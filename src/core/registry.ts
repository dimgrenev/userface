import * as React from 'react';
import { ComponentSchema, ComponentRegistration } from './schema';
import { Type, FoundComponent } from './types';
import { RenderPlatform, UserEngine } from './api';
import { logger } from './logger';

// Расширяем Reflect для Angular метаданных
declare global {
  interface Reflect {
    getMetadata(metadataKey: string, target: any): any;
  }
}

// Универсальный реестр компонентов и рендереров
export class Registry implements UserEngine {
  // Компоненты (без дублирования)
  private components = new Map<string, any>();
  
  // Кеш схем (встроенный)
  private schemas = new Map<string, ComponentSchema>();
  
  // Хеши для валидации
  private componentHashes = new Map<string, string>();
  
  // Адаптеры рендереров
  private adapters = new Map<string, RenderPlatform>();
  
  // Статистика
  private stats = {
    totalComponents: 0,
    totalSchemas: 0,
    errors: 0
  };

  // === РЕГИСТРАЦИЯ ===
  
  registerComponent(name: string, component: any): ComponentSchema {
    try {
      // Проверяем кеш схем
      let schema = this.schemas.get(name);
      
      if (!schema) {
        // Анализируем компонент
        schema = this.analyzeComponent(component, name);
        if (schema) {
          this.schemas.set(name, schema);
        }
      }
      
      // Сохраняем компонент (только один раз!)
      this.components.set(name, component);
      
      this.stats.totalComponents = this.components.size;
      this.stats.totalSchemas = this.schemas.size;
      
      logger.info(`Registered component "${name}"`, 'Registry', { name, schema });
      
      return schema || this.createFallbackSchema(name);
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to register component "${name}"`, 'Registry', error as Error, { name });
      
      const fallbackSchema = this.createFallbackSchema(name);
      this.components.set(name, component);
      this.schemas.set(name, fallbackSchema);
      return fallbackSchema;
    }
  }

  // === ПОЛУЧЕНИЕ ДАННЫХ ===
  
  getComponent(name: string): any | undefined {
    return this.components.get(name);
  }

  getSchema(name: string): ComponentSchema | undefined {
    return this.schemas.get(name);
  }

  getAllComponents(): Record<string, any> {
    return Object.fromEntries(this.components);
  }

  getAllSchemas(): ComponentSchema[] {
    return Array.from(this.schemas.values());
  }

  getAllComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  getSchemasByPlatform(platform: string): ComponentSchema[] {
    return Array.from(this.schemas.values()).filter(schema => schema.platform === platform);
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  // === РЕГИСТРАЦИЯ МНОЖЕСТВЕННАЯ ===
  
  registerComponents(components: Record<string, any>): ComponentSchema[] {
    const schemas: ComponentSchema[] = [];
    
    Object.entries(components).forEach(([name, component]) => {
      const schema = this.registerComponent(name, component);
      schemas.push(schema);
    });
    
    return schemas;
  }

  registerComponentWithSchema(registration: ComponentRegistration): void {
    const { name, component, schema } = registration;
    
    this.components.set(name, component);
    this.schemas.set(name, schema);
    
    this.stats.totalComponents = this.components.size;
    this.stats.totalSchemas = this.schemas.size;
  }

  // === УПРАВЛЕНИЕ ЖИЗНЕННЫМ ЦИКЛОМ ===
  
  updateComponent(name: string, component: any): ComponentSchema | null {
    if (!this.components.has(name)) {
      return null;
    }
    
    // Обновляем компонент
    this.components.set(name, component);
    
    // Переанализируем схему
    const schema = this.analyzeComponent(component, name);
    if (schema) {
      this.schemas.set(name, schema);
      this.stats.totalSchemas = this.schemas.size;
    }
    
    return schema || null;
  }

  removeComponent(name: string): boolean {
    const hadComponent = this.components.has(name);
    
    this.components.delete(name);
    this.schemas.delete(name);
    this.componentHashes.delete(name);
    
    this.stats.totalComponents = this.components.size;
    this.stats.totalSchemas = this.schemas.size;
    
    return hadComponent;
  }

  clear(): void {
    this.components.clear();
    this.schemas.clear();
    this.componentHashes.clear();
    this.adapters.clear();
    this.stats = { totalComponents: 0, totalSchemas: 0, errors: 0 };
  }

  clearCache(): void {
    this.schemas.clear();
    this.componentHashes.clear();
    this.stats.totalSchemas = 0;
  }

  // === ИНИЦИАЛИЗАЦИЯ ===
  
  private lastInitializedVersion: string | null = null;

  initialize(): void {
    const currentVersion = this.getCurrentVersion();
    
    if (this.lastInitializedVersion === currentVersion) {
      logger.warn('Registry already initialized with current version - skipping', 'Registry');
      return;
    }
    
    if (this.lastInitializedVersion && this.lastInitializedVersion !== currentVersion) {
      logger.info(`Registry version updated: ${this.lastInitializedVersion} → ${currentVersion}`, 'Registry');
      this.clearCache();
    }

    this.lastInitializedVersion = currentVersion;
    logger.info(`Registry initialization completed (version ${currentVersion})`, 'Registry');
  }

  // Полная инициализация с адаптерами и авторегистрацией
  initializeWithAdapters(adapters: any[]): void {
    this.initialize();

    // Регистрируем адаптеры
    adapters.forEach(({ adapter, name }) => {
      try {
        const existingAdapter = this.getAdapter(adapter.id);
        
        if (existingAdapter) {
          this.reinstallAdapter(adapter);
          logger.info(`${name} renderer reinstalled`, 'Registry');
        } else {
          this.registerAdapter(adapter);
          logger.info(`${name} renderer registered`, 'Registry');
        }
      } catch (error) {
        logger.error(`${name} renderer registration failed`, 'Registry', error as Error);
      }
    });

    // Авторегистрация компонентов
    try {
      const result = this.findUserfaceFolder();
      
      if (result.found) {
        const components = this.scanUserfaceFolder(result.path!);
        
        if (components.length > 0) {
          components.forEach((component: FoundComponent) => {
            this.autoRegisterComponent(component.module, component.name);
          });
          logger.info(`Auto-registered ${components.length} components`, 'Registry');
        } else {
          logger.info('No components found in userface folder', 'Registry');
        }
      } else {
        logger.info('No userface folder found', 'Registry');
      }
    } catch (error) {
      logger.warn('Auto-registration failed', 'Registry', { error });
    }

    logger.info('Registry full initialization completed', 'Registry');
  }

  private getCurrentVersion(): string {
    try {
      if (typeof require !== 'undefined') {
        const packageJson = require('../../package.json');
        return packageJson.version;
      }
    } catch {
      // Fallback
    }
    return '1.0.7';
  }

  // === АВТОРЕГИСТРАЦИЯ ===
  
  autoRegisterComponents(componentModule: any, prefix: string = ''): void {
    try {
      Object.entries(componentModule).forEach(([name, component]) => {
        if (typeof component !== 'function' || name.startsWith('_')) {
          return;
        }
        
        const componentName = prefix ? `${prefix}-${name.toLowerCase()}` : name.toLowerCase();
        this.registerComponent(componentName, component);
        
        logger.info(`Auto-registered component: ${componentName}`, 'Registry');
      });
      
      logger.info(`Auto-registration completed for ${Object.keys(componentModule).length} components`, 'Registry');
    } catch (error) {
      logger.error('Auto-registration failed', 'Registry', error as Error);
    }
  }

  autoRegisterComponent(component: any, componentName: string): void {
    try {
      if (typeof component !== 'function') {
        logger.warn(`Skipping non-function component: ${componentName}`, 'Registry');
        return;
      }
      
      this.registerComponent(componentName.toLowerCase(), component);
      logger.info(`Auto-registered component: ${componentName}`, 'Registry');
    } catch (error) {
      logger.error(`Failed to register component: ${componentName}`, 'Registry', error as Error);
    }
  }

  // === ПОИСК ПАПКИ USERFACE ===
  
  findUserfaceFolder(): { found: boolean; path?: string; error?: string } {
    try {
      const projectRoot = this.findProjectRoot();
      if (!projectRoot) {
        return { found: false, error: 'Project root not found' };
      }

      const userfacePath = this.findUserfaceRecursively(projectRoot);
      
      if (userfacePath) {
        logger.info(`Found userface folder: ${userfacePath}`, 'Registry');
        return { found: true, path: userfacePath };
      }

      return { found: false, error: 'Userface folder not found' };

    } catch (error) {
      logger.error('Error finding userface folder', 'Registry', error as Error);
      return { found: false, error: `Search failed: ${error}` };
    }
  }

  private findProjectRoot(): string | null {
    try {
      if (typeof window !== 'undefined') return null;

      const fs = require('fs');
      const path = require('path');
      
      let currentDir = process.cwd();
      const maxDepth = 5;
      
      for (let depth = 0; depth < maxDepth; depth++) {
        const packageJsonPath = path.join(currentDir, 'package.json');
        
        if (fs.existsSync(packageJsonPath)) {
          return currentDir;
        }
        
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) break;
        
        currentDir = parentDir;
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding project root', 'Registry', error as Error);
      return null;
    }
  }

  private findUserfaceRecursively(dir: string, depth: number = 0): string | null {
    try {
      if (typeof window !== 'undefined' || depth > 3) return null;

      const fs = require('fs');
      const path = require('path');

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          if (item === 'userface') {
            return itemPath;
          }
          const result = this.findUserfaceRecursively(itemPath, depth + 1);
          if (result) return result;
        }
      }
      
      return null;
    } catch (error) {
      logger.debug(`Error searching in directory: ${dir}`, 'Registry', error as Error);
      return null;
    }
  }

  // === СКАНИРОВАНИЕ КОМПОНЕНТОВ ===
  
  private scanUserfaceFolder(userfacePath: string): FoundComponent[] {
    const foundComponents: FoundComponent[] = [];
    
    try {
      if (typeof window !== 'undefined') return foundComponents;

      const fs = require('fs');
      const path = require('path');

      if (!fs.existsSync(userfacePath)) {
        logger.warn('Userface folder not found', 'Registry', { userfacePath });
        return foundComponents;
      }

      this.scanComponentsRecursively(userfacePath, foundComponents);
      
      logger.info(`Scanned ${foundComponents.length} components`, 'Registry', { userfacePath, count: foundComponents.length });
      
    } catch (error) {
      logger.error('Error scanning components', 'Registry', error as Error);
    }

    return foundComponents;
  }

  private scanComponentsRecursively(dir: string, foundComponents: FoundComponent[], depth: number = 0): void {
    if (typeof window !== 'undefined' || depth > 5) return;
    
    try {
      const fs = require('fs');
      const path = require('path');

      const items = fs.readdirSync(dir);

      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory() && !this.shouldSkipDirectory(item)) {
          this.scanComponentsRecursively(itemPath, foundComponents, depth + 1);
        } else if (stats.isFile() && this.isComponentFile(item)) {
          const component = this.tryLoadComponent(itemPath);
          if (component) {
            foundComponents.push(component);
          }
        }
      }
    } catch (error) {
      logger.debug(`Error scanning directory: ${dir}`, 'Registry', error as Error);
    }
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.cache', 'coverage'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  private isComponentFile(fileName: string): boolean {
    const componentExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    const componentPatterns = [/component/i, /\.spec\./, /\.test\./, /\.stories\./];
    
    const hasComponentExt = componentExtensions.some(ext => fileName.endsWith(ext));
    const isComponentFile = componentPatterns.some(pattern => pattern.test(fileName));
    
    return hasComponentExt && !isComponentFile;
  }

  private tryLoadComponent(filePath: string): FoundComponent | null {
    try {
      if (typeof window !== 'undefined') return null;

      const fs = require('fs');
      const path = require('path');

      const content = fs.readFileSync(filePath, 'utf8');
      if (!this.hasExports(content)) return null;

      const module = require(filePath);
      if (!module || typeof module !== 'object') return null;

      const fileName = path.basename(filePath, path.extname(filePath));
      const componentName = this.extractComponentName(fileName, content);

      return {
        path: filePath,
        name: componentName,
        module
      };
    } catch (error) {
      logger.debug(`Failed to load component: ${filePath}`, 'Registry', error as Error);
      return null;
    }
  }

  private hasExports(content: string): boolean {
    return /export\s+(default|{|const|function|class)/.test(content);
  }

  private extractComponentName(fileName: string, content: string): string {
    // Ищем имя компонента в экспорте
    const exportMatch = content.match(/export\s+(default|{.*?})\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[2].toLowerCase();
    }
    
    // Иначе используем имя файла
    return fileName.toLowerCase();
  }

  // === ЭКСПОРТ И ВАЛИДАЦИЯ ===
  
  exportSchema(name: string): ComponentSchema | null {
    const schema = this.schemas.get(name);
    return schema || null;
  }

  exportAllSchemas(): ComponentSchema[] {
    return Array.from(this.schemas.values());
  }

  validateMigration(sourceSchema: ComponentSchema, targetPlatform: string): {
    canMigrate: boolean;
    issues: string[];
    compatibility: number;
  } {
    // Простая валидация миграции
    const issues: string[] = [];
    let compatibility = 1.0;
    
    // Проверяем совместимость пропов
    sourceSchema.props.forEach(prop => {
      if (prop.type === 'function' && targetPlatform !== 'react') {
        issues.push(`Function props not supported in ${targetPlatform}`);
        compatibility -= 0.2;
      }
    });
    
    return {
      canMigrate: issues.length === 0,
      issues,
      compatibility: Math.max(0, compatibility)
    };
  }

  // === УТИЛИТЫ ===
  
  private createFallbackSchema(name: string): ComponentSchema {
    return {
      name,
      platform: 'unknown',
      props: [],
      events: [],
      children: false,
      description: `Fallback schema for ${name}`
    };
  }

  getStats() {
    return {
      ...this.stats,
      validSchemas: this.componentHashes.size,
      adapters: {
        total: this.adapters.size,
        available: Array.from(this.adapters.keys())
      }
    };
  }

  // === АДАПТЕРЫ РЕНДЕРЕРОВ ===
  
  registerAdapter(adapter: RenderPlatform): void {
    this.adapters.set(adapter.id, adapter);
    logger.info(`Registered adapter "${adapter.id}"`, 'Registry', { adapterId: adapter.id, adapter });
  }

  reinstallAdapter(adapter: RenderPlatform): void {
    this.adapters.delete(adapter.id);
    logger.info(`Removed old adapter "${adapter.id}"`, 'Registry', { adapterId: adapter.id });
    
    this.adapters.set(adapter.id, adapter);
    logger.info(`Reinstalled adapter "${adapter.id}"`, 'Registry', { adapterId: adapter.id, adapter });
  }

  getAdapter(adapterId: string): RenderPlatform | undefined {
    return this.adapters.get(adapterId);
  }

  getAllAdapters(): RenderPlatform[] {
    return Array.from(this.adapters.values());
  }

  // === РЕНДЕРИНГ ===
  
  renderWithAdapter(spec: any, adapterId: string): any {
    try {
      const adapter = this.getAdapter(adapterId);
      if (!adapter) {
        logger.warn(`Adapter not found: ${adapterId}`, 'Registry', { adapterId, spec });
        return null;
      }
      
      if (!adapter.validateSpec(spec)) {
        logger.warn(`Invalid spec for adapter ${adapterId}`, 'Registry', { adapterId, spec });
        return null;
      }
      
      return adapter.render(spec);
      
    } catch (error) {
      logger.error(`Failed to render with adapter ${adapterId}`, 'Registry', error as Error, { adapterId, spec });
      return null;
    }
  }

  renderWithAllAdapters(spec: any): Record<string, any> {
    const results: Record<string, any> = {};
    
    for (const [adapterId, adapter] of Array.from(this.adapters.entries())) {
      try {
        if (adapter.validateSpec(spec)) {
          results[adapterId] = adapter.render(spec);
        } else {
          results[adapterId] = null;
        }
      } catch (error) {
        logger.warn(`Failed to render with adapter ${adapterId}`, 'Registry', error as Error);
        results[adapterId] = null;
      }
    }
    
    return results;
  }

  // === АНАЛИЗ КОМПОНЕНТОВ ===
  
  private analyzeComponent(component: any, name: string): ComponentSchema {
    // Определяем платформу по типу компонента
    if (React.isValidElement(component) || component.$$typeof) {
      return this.analyzeReactComponent(component, name);
    }
    
    // Vue компонент
    if (component.render || component.template || component.setup) {
      return this.analyzeVueComponent(component, name);
    }
    
    // Angular компонент
    if (component.selector || component.templateUrl || component.template) {
      return this.analyzeAngularComponent(component, name);
    }
    
    // Svelte компонент
    if (component.$$render || component.fragment) {
      return this.analyzeSvelteComponent(component, name);
    }
    
    // Vanilla JS компонент
    return this.analyzeVanillaComponent(component, name);
  }

  private analyzeReactComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Анализируем propTypes если есть
    if (component.propTypes) {
      Object.keys(component.propTypes).forEach(propName => {
        const propType = component.propTypes[propName];
        props.push({
          name: propName,
          type: this.mapReactPropType(propType),
          required: propType.isRequired || false,
          description: `React prop: ${propName}`
        });
      });
    }
    
    // Анализируем defaultProps если есть
    if (component.defaultProps) {
      Object.keys(component.defaultProps).forEach(propName => {
        const existingProp = props.find(p => p.name === propName);
        if (existingProp) {
          existingProp.defaultValue = component.defaultProps[propName];
        } else {
          props.push({
            name: propName,
            type: 'text',
            required: false,
            defaultValue: component.defaultProps[propName],
            description: `React default prop: ${propName}`
          });
        }
      });
    }
    
    return {
      name,
      platform: 'react',
      props,
      events: [
        { name: 'onClick', parameters: [], description: 'Click event' },
        { name: 'onChange', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `React component ${name}`
    };
  }

  private analyzeVueComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    if (component.props) {
      Object.keys(component.props).forEach(propName => {
        const prop = component.props[propName];
        let propType: Type = 'text';
        let required = false;
        
        if (typeof prop === 'object') {
          propType = this.mapVuePropType(prop.type);
          required = prop.required || false;
        } else {
          propType = this.mapVuePropType(prop);
        }
        
        props.push({
          name: propName,
          type: propType,
          required,
          description: `Vue prop: ${propName}`
        });
      });
    }
    
    return {
      name,
      platform: 'vue',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Vue component ${name}`
    };
  }

  private analyzeAngularComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    try {
      // Пытаемся получить метаданные Angular
      if (typeof Reflect !== 'undefined' && (Reflect as any).getMetadata) {
        const metadata = (Reflect as any).getMetadata('design:paramtypes', component);
        if (metadata) {
          metadata.forEach((param: any, index: number) => {
            props.push({
              name: `param${index}`,
              type: this.mapAngularType(param),
              required: true,
              description: `Angular parameter ${index}`
            });
          });
        }
      }
    } catch (error) {
      // Игнорируем ошибки метаданных
    }
    
    return {
      name,
      platform: 'angular',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Angular component ${name}`
    };
  }

  private analyzeSvelteComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Svelte компоненты обычно имеют $$render
    if (component.$$render) {
      props.push({
        name: 'children',
        type: 'any',
        required: false,
        description: 'Svelte children'
      });
    }
    
    return {
      name,
      platform: 'svelte',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Svelte component ${name}`
    };
  }

  private analyzeVanillaComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Анализируем параметры функции
    if (typeof component === 'function') {
      const functionStr = component.toString();
      const paramMatch = functionStr.match(/\(([^)]*)\)/);
      
      if (paramMatch && paramMatch[1]) {
        const params = paramMatch[1].split(',').map((p: string) => p.trim());
        params.forEach((param: string) => {
          if (param) {
            props.push({
              name: param,
              type: 'any',
              required: true,
              description: `Vanilla JS parameter: ${param}`
            });
          }
        });
      }
    }
    
    return {
      name,
      platform: 'vanilla',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Vanilla JS component ${name}`
    };
  }

  // === МАППИНГ ТИПОВ ===
  
  private mapReactPropType(propType: any): Type {
    if (!propType) return 'text';
    
    const typeName = propType.name || propType.constructor.name;
    
    switch (typeName) {
      case 'string':
        return 'text';
      case 'number':
        return 'number';
      case 'bool':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      case 'func':
        return 'function';
      default:
        return 'text';
    }
  }

  private mapVuePropType(propType: any): Type {
    if (!propType) return 'text';
    
    const typeName = propType.name || propType.constructor.name;
    
    switch (typeName) {
      case 'String':
        return 'text';
      case 'Number':
        return 'number';
      case 'Boolean':
        return 'boolean';
      case 'Array':
        return 'array';
      case 'Object':
        return 'object';
      case 'Function':
        return 'function';
      default:
        return 'text';
    }
  }

  private mapAngularType(type: any): Type {
    if (!type) return 'text';
    
    const typeName = type.name || type.constructor.name;
    
    switch (typeName) {
      case 'String':
        return 'text';
      case 'Number':
        return 'number';
      case 'Boolean':
        return 'boolean';
      case 'Array':
        return 'array';
      case 'Object':
        return 'object';
      case 'Function':
        return 'function';
      default:
        return 'text';
    }
  }
}

// Экспортируем единый экземпляр реестра
export const unifiedRegistry = new Registry(); 