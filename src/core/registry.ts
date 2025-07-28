import { ComponentSchema, ComponentRegistration } from './schema';
import { Analyzer } from './analyzer';
import { logger } from './logger';

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
        schema = Analyzer.analyzeComponent(component, name);
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
    const schema = Analyzer.analyzeComponent(component, name);
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
}

// Экспортируем единый экземпляр реестра
export const unifiedRegistry = new Registry(); 