import { ComponentSchema } from './types';

export interface SchemaCache {
  components: Record<string, ComponentSchema>;
  lastUpdated: number;
  version: string;
}

export class SchemaCacheManager {
  private static instance: SchemaCacheManager;
  private cache: SchemaCache = {
    components: {},
    lastUpdated: Date.now(),
    version: '1.0.0'
  };

  static getInstance(): SchemaCacheManager {
    if (!SchemaCacheManager.instance) {
      SchemaCacheManager.instance = new SchemaCacheManager();
    }
    return SchemaCacheManager.instance;
  }

  // Сохранить схему компонента
  setSchema(componentName: string, schema: ComponentSchema): void {
    this.cache.components[componentName] = schema;
    this.cache.lastUpdated = Date.now();
  }

  // Получить схему компонента
  getSchema(componentName: string): ComponentSchema | undefined {
    return this.cache.components[componentName];
  }

  // Получить все схемы
  getAllSchemas(): Record<string, ComponentSchema> {
    return this.cache.components;
  }

  // Проверить, есть ли схема
  hasSchema(componentName: string): boolean {
    return componentName in this.cache.components;
  }

  // Очистить кэш
  clear(): void {
    this.cache.components = {};
    this.cache.lastUpdated = Date.now();
  }

  // Получить статистику кэша
  getStats(): { count: number; lastUpdated: number; version: string } {
    return {
      count: Object.keys(this.cache.components).length,
      lastUpdated: this.cache.lastUpdated,
      version: this.cache.version
    };
  }
} 