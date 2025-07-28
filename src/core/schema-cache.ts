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

  // Синхронизация с реальными компонентами
  private componentHashes = new Map<string, string>();

  static getInstance(): SchemaCacheManager {
    if (!SchemaCacheManager.instance) {
      SchemaCacheManager.instance = new SchemaCacheManager();
    }
    return SchemaCacheManager.instance;
  }

  // Сохранить схему компонента с хешем
  setSchema(componentName: string, schema: ComponentSchema, componentHash?: string): void {
    this.cache.components[componentName] = schema;
    this.cache.lastUpdated = Date.now();
    
    if (componentHash) {
      this.componentHashes.set(componentName, componentHash);
    }
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

  // Проверить актуальность схемы
  isSchemaValid(componentName: string, currentHash: string): boolean {
    const cachedHash = this.componentHashes.get(componentName);
    return cachedHash === currentHash;
  }

  // Удалить схему компонента
  removeSchema(componentName: string): void {
    delete this.cache.components[componentName];
    this.componentHashes.delete(componentName);
    this.cache.lastUpdated = Date.now();
  }

  // Очистить кэш
  clear(): void {
    this.cache.components = {};
    this.componentHashes.clear();
    this.cache.lastUpdated = Date.now();
  }

  // Получить статистику кэша
  getStats(): { count: number; lastUpdated: number; version: string; validSchemas: number } {
    return {
      count: Object.keys(this.cache.components).length,
      lastUpdated: this.cache.lastUpdated,
      version: this.cache.version,
      validSchemas: this.componentHashes.size
    };
  }

  // Экспорт кэша для отладки
  exportCache(): SchemaCache {
    return { ...this.cache };
  }
} 