// import * as React from 'react';
import { ComponentSchema, ComponentRegistration } from './types';
import { Analyzer } from './analyzer';
import { logger } from './logger';
import { SchemaCacheManager } from './schema-cache';

// Реестр компонентов и схем
export class Registry {
  // Основные хранилища
  private components = new Map<string, any>();
  
  // Централизованный кэш схем
  private schemaCache = SchemaCacheManager.getInstance();
  
  // Кэширование компонентов
  private componentCache = new Map<string, any>();
  
  // Базовая статистика
  private stats = {
    totalComponents: 0,
    totalSchemas: 0,
    errors: 0
  };

  // === РЕГИСТРАЦИЯ КОМПОНЕНТОВ ===
  
  // Регистрация с автоматическим анализом
  registerComponent(name: string, component: any): ComponentSchema {
    
    try {
      // Проверяем кэш схем
      let schema = this.schemaCache.getSchema(name);
      
      if (!schema) {
        // Анализируем компонент
        schema = Analyzer.analyzeComponent(component, name);
        if (schema) {
          this.schemaCache.setSchema(name, schema);
        }
      }
      
      // Сохраняем компонент
      this.components.set(name, component);
      this.componentCache.set(name, component);
      
      this.stats.totalComponents = this.components.size;
      this.stats.totalSchemas = this.schemaCache.getStats().count;
      
      logger.info(`Registered component "${name}" with auto-analysis`, 'Registry', { 
        name, 
        schema
      });
      
      return schema || {
        name,
        platform: 'unknown',
        props: [],
        events: [],
        children: false,
        description: `Fallback schema for ${name}`
      };
      
    } catch (error) {
      this.stats.errors++;
      
      logger.error(`Failed to register component "${name}"`, 'Registry', error as Error, { 
        name
      });
      
      // Fallback - базовая схема
      const fallbackSchema: ComponentSchema = {
        name,
        platform: 'unknown',
        props: [],
        events: [],
        children: false,
        description: `Fallback schema for ${name}`
      };
      
      this.components.set(name, component);
      this.schemaCache.setSchema(name, fallbackSchema);
      return fallbackSchema;
    }
  }

  // Регистрация с явной схемой
  registerComponentWithSchema(registration: ComponentRegistration): void {
    const { name, component, schema } = registration;
    
    try {
      this.components.set(name, component);
      this.schemaCache.setSchema(name, schema);
      this.componentCache.set(name, component);
      
      this.stats.totalComponents = this.components.size;
      this.stats.totalSchemas = this.schemaCache.getStats().count;
      
      console.log(`[UnifiedRegistry] Registered component "${name}" with explicit schema`);
      
    } catch (error) {
      this.stats.errors++;
      console.warn(`[UnifiedRegistry] Failed to register component "${name}" with schema:`, error);
    }
  }

  // Обновление схемы компонента
  updateComponentSchema(name: string, schema: ComponentSchema): void {
    if (this.schemaCache.hasSchema(name)) {
      this.schemaCache.setSchema(name, schema);
      logger.info(`Updated schema for component "${name}"`, 'Registry');
    } else {
      logger.warn(`Cannot update schema: component "${name}" not found`, 'Registry');
    }
  }

  // Регистрация нескольких компонентов
  registerComponents(components: Record<string, any>): ComponentSchema[] {
    const schemas: ComponentSchema[] = [];
    
    Object.entries(components).forEach(([name, component]) => {
      try {
        const schema = this.registerComponent(name, component);
        schemas.push(schema);
      } catch (error) {
        console.warn(`[UnifiedRegistry] Failed to register component "${name}":`, error);
      }
    });
    
    return schemas;
  }

  // === ПОЛУЧЕНИЕ ДАННЫХ ===
  
  // Получение компонента
  getComponent(name: string): any | undefined {
    // Проверяем кэш
    if (this.componentCache.has(name)) {
      return this.componentCache.get(name);
    }
    
    // Получаем из основного реестра
    const component = this.components.get(name);
    if (component) {
      this.componentCache.set(name, component);
    }
    
    return component;
  }

  // Получение схемы
  getSchema(name: string): ComponentSchema | undefined {
    return this.schemaCache.getSchema(name);
  }

  // Получение всех компонентов
  getAllComponents(): Record<string, any> {
    const result: Record<string, any> = {};
    this.components.forEach((component, name) => {
      result[name] = component;
    });
    return result;
  }

  // Получение всех схем
  getAllSchemas(): ComponentSchema[] {
    return Object.values(this.schemaCache.getAllSchemas());
  }

  // Получение имен компонентов
  getAllComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  // Получение схем по платформе
  getSchemasByPlatform(platform: string): ComponentSchema[] {
    return this.getAllSchemas().filter(schema => schema.platform === platform);
  }

  // === ПРОВЕРКИ ===
  
  // Проверка существования компонента
  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  // Проверка существования схемы
  hasSchema(name: string): boolean {
    return this.schemaCache.hasSchema(name);
  }

  // Валидация компонента
  validateComponent(name: string): boolean {
    const component = this.getComponent(name);
    const schema = this.getSchema(name);
    
    return !!(component && schema);
  }

  // === УПРАВЛЕНИЕ ЖИЗНЕННЫМ ЦИКЛОМ ===
  
  // Обновление компонента
  updateComponent(name: string, component: any): ComponentSchema | null {
    if (!this.hasComponent(name)) {
      console.warn(`[UnifiedRegistry] Cannot update non-existent component "${name}"`);
      return null;
    }
    
    // Инвалидируем кэш
    this.componentCache.delete(name);
    
    // Регистрируем заново
    return this.registerComponent(name, component);
  }

  // Удаление компонента
  removeComponent(name: string): boolean {
    const existed = this.hasComponent(name);
    
    if (existed) {
      this.components.delete(name);
      this.schemaCache.clear(); // Полностью очищаем кэш схем (или можно реализовать удаление по имени)
      this.componentCache.delete(name);
      
      this.stats.totalComponents = this.components.size;
      this.stats.totalSchemas = this.schemaCache.getStats().count;
      
      console.log(`[UnifiedRegistry] Removed component "${name}"`);
    }
    
    return existed;
  }

  // Очистка кэша
  clearCache(): void {
    this.componentCache.clear();
    this.schemaCache.clear();
    console.log('[UnifiedRegistry] Cache cleared');
  }

  // Полная очистка
  clear(): void {
    this.components.clear();
    this.componentCache.clear();
    this.schemaCache.clear();
    
    this.stats.totalComponents = 0;
    this.stats.totalSchemas = 0;
    
    console.log('[UnifiedRegistry] Registry cleared');
  }

  // === СТАТИСТИКА И МЕТРИКИ ===
  
  // Получение статистики
  getStats() {
    return {
      ...this.stats,
      errorRate: this.stats.errors / this.stats.totalComponents || 0
    };
  }

  // Сброс статистики
  resetStats(): void {
    this.stats = {
      totalComponents: this.components.size,
      totalSchemas: this.schemaCache.getStats().count,
      errors: 0
    };
  }

  // === API ДЛЯ КОНВЕРТЕРА ===
  
  // Экспорт схемы
  exportSchema(name: string): ComponentSchema | null {
    const schema = this.getSchema(name);
    if (!schema) {
      console.warn(`[UnifiedRegistry] Schema not found for component "${name}"`);
      return null;
    }
    
    return { ...schema }; // Возвращаем копию
  }

  // Экспорт всех схем
  exportAllSchemas(): ComponentSchema[] {
    return this.getAllSchemas().map(schema => ({ ...schema }));
  }

  // Валидация миграции
  validateMigration(sourceSchema: ComponentSchema, targetPlatform: string): {
    canMigrate: boolean;
    issues: string[];
    compatibility: number; // 0-1
  } {
    const issues: string[] = [];
    let compatibility = 1;
    
    // Проверяем платформу
    if (sourceSchema.platform === targetPlatform) {
      issues.push('Source and target platforms are the same');
      compatibility = 0;
    }
    
    // Проверяем пропы
    sourceSchema.props.forEach(prop => {
      if (prop.type === 'function' && targetPlatform !== 'react') {
        issues.push(`Function prop "${prop.name}" may not be compatible with ${targetPlatform}`);
        compatibility -= 0.1;
      }
      
      if (prop.type === 'element' && targetPlatform !== 'react') {
        issues.push(`Element prop "${prop.name}" may not be compatible with ${targetPlatform}`);
        compatibility -= 0.1;
      }
    });
    
    // Проверяем события
    if (sourceSchema.events.length > 0 && targetPlatform !== 'react') {
      issues.push(`Events may need adaptation for ${targetPlatform}`);
      compatibility -= 0.2;
    }
    
    return {
      canMigrate: compatibility > 0.5,
      issues,
      compatibility: Math.max(0, compatibility)
    };
  }
}

// Экспортируем синглтон
export const unifiedRegistry = new Registry();

// Автоматическая регистрация рендереров будет в отдельном файле 