import * as React from 'react';
import { ComponentSchema, ComponentRegistration } from './schema';
import { Type } from './types';
import { logger } from './logger';

// Расширяем Reflect для Angular метаданных
declare global {
  interface Reflect {
    getMetadata(metadataKey: string, target: any): any;
  }
}

// Реестр компонентов с встроенным кешем
export class Registry {
  // Компоненты (без дублирования)
  private components = new Map<string, any>();
  
  // Кеш схем (встроенный)
  private schemas = new Map<string, ComponentSchema>();
  
  // Хеши для валидации
  private componentHashes = new Map<string, string>();
  
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
    this.stats = { totalComponents: 0, totalSchemas: 0, errors: 0 };
  }

  clearCache(): void {
    this.schemas.clear();
    this.componentHashes.clear();
    this.stats.totalSchemas = 0;
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
      validSchemas: this.componentHashes.size
    };
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