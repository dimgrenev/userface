import { ComponentSchema } from './schema';
import { logger } from './logger';

// Кеш схем компонентов
export class SchemaCache {
  // Кеш схем
  private schemas = new Map<string, ComponentSchema>();
  
  // Хеши для валидации
  private componentHashes = new Map<string, string>();
  
  // Статистика кеша
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    clears: 0
  };

  // === ОСНОВНЫЕ ОПЕРАЦИИ ===
  
  getSchema(name: string): ComponentSchema | undefined {
    const schema = this.schemas.get(name);
    
    if (schema) {
      this.stats.hits++;
      logger.debug(`Cache hit for schema: ${name}`, 'SchemaCache');
    } else {
      this.stats.misses++;
      logger.debug(`Cache miss for schema: ${name}`, 'SchemaCache');
    }
    
    return schema;
  }

  setSchema(name: string, schema: ComponentSchema): void {
    this.schemas.set(name, schema);
    this.stats.sets++;
    
    logger.debug(`Cached schema: ${name}`, 'SchemaCache', { name });
  }

  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  getAllSchemas(): ComponentSchema[] {
    return Array.from(this.schemas.values());
  }

  getSchemasByPlatform(platform: string): ComponentSchema[] {
    return Array.from(this.schemas.values()).filter(schema => schema.platform === platform);
  }

  // === ВАЛИДАЦИЯ ===
  
  validateMigration(sourceSchema: ComponentSchema, targetPlatform: string): {
    canMigrate: boolean;
    issues: string[];
    compatibility: number;
  } {
    const issues: string[] = [];
    let compatibility = 100;
    
    // Проверяем совместимость платформ
    if (sourceSchema.platform === targetPlatform) {
      return { canMigrate: true, issues: [], compatibility: 100 };
    }
    
    // Анализируем пропы на совместимость
    for (const prop of sourceSchema.props) {
      const propCompatibility = this.validatePropCompatibility(prop, targetPlatform);
      if (propCompatibility < 100) {
        issues.push(`Prop "${prop.name}" may have compatibility issues with ${targetPlatform}`);
        compatibility = Math.min(compatibility, propCompatibility);
      }
    }
    
    // Анализируем события на совместимость
    for (const event of sourceSchema.events) {
      const eventCompatibility = this.validateEventCompatibility(event, targetPlatform);
      if (eventCompatibility < 100) {
        issues.push(`Event "${event.name}" may have compatibility issues with ${targetPlatform}`);
        compatibility = Math.min(compatibility, eventCompatibility);
      }
    }
    
    const canMigrate = compatibility > 50; // Минимальный порог совместимости
    
    logger.info(`Migration validation for ${sourceSchema.name} to ${targetPlatform}`, 'SchemaCache', {
      canMigrate,
      compatibility,
      issuesCount: issues.length
    });
    
    return { canMigrate, issues, compatibility };
  }

  // === ЭКСПОРТ ===
  
  exportSchema(name: string): ComponentSchema | null {
    const schema = this.schemas.get(name);
    if (schema) {
      logger.info(`Exported schema: ${name}`, 'SchemaCache');
      return { ...schema }; // Возвращаем копию
    }
    return null;
  }

  exportAllSchemas(): ComponentSchema[] {
    const schemas = Array.from(this.schemas.values());
    logger.info(`Exported all schemas: ${schemas.length}`, 'SchemaCache');
    return schemas.map(schema => ({ ...schema })); // Возвращаем копии
  }

  // === ОЧИСТКА ===
  
  clearCache(): void {
    const schemaCount = this.schemas.size;
    this.schemas.clear();
    this.componentHashes.clear();
    this.stats.clears++;
    
    logger.info(`Cleared schema cache: ${schemaCount} schemas removed`, 'SchemaCache', { 
      removedCount: schemaCount 
    });
  }

  removeSchema(name: string): boolean {
    const hadSchema = this.schemas.has(name);
    const hadHash = this.componentHashes.has(name);
    
    this.schemas.delete(name);
    this.componentHashes.delete(name);
    
    if (hadSchema || hadHash) {
      logger.info(`Removed schema from cache: ${name}`, 'SchemaCache');
    }
    
    return hadSchema || hadHash;
  }

  // === СТАТИСТИКА ===
  
  getStats() {
    return {
      ...this.stats,
      size: this.schemas.size,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private validatePropCompatibility(prop: any, platform: string): number {
    // Базовая валидация совместимости пропов
    switch (platform) {
      case 'react':
        return this.validateReactProp(prop);
      case 'vue':
        return this.validateVueProp(prop);
      case 'angular':
        return this.validateAngularProp(prop);
      case 'svelte':
        return this.validateSvelteProp(prop);
      default:
        return 80; // Неизвестная платформа - средняя совместимость
    }
  }

  private validateEventCompatibility(event: any, platform: string): number {
    // Базовая валидация совместимости событий
    switch (platform) {
      case 'react':
        return this.validateReactEvent(event);
      case 'vue':
        return this.validateVueEvent(event);
      case 'angular':
        return this.validateAngularEvent(event);
      case 'svelte':
        return this.validateSvelteEvent(event);
      default:
        return 80;
    }
  }

  private validateReactProp(prop: any): number {
    // React поддерживает большинство типов
    return 95;
  }

  private validateVueProp(prop: any): number {
    // Vue имеет специфичные типы пропов
    return 90;
  }

  private validateAngularProp(prop: any): number {
    // Angular использует TypeScript типы
    return 85;
  }

  private validateSvelteProp(prop: any): number {
    // Svelte имеет простую систему пропов
    return 90;
  }

  private validateReactEvent(event: any): number {
    // React события в camelCase
    return 95;
  }

  private validateVueEvent(event: any): number {
    // Vue события в kebab-case
    return 85;
  }

  private validateAngularEvent(event: any): number {
    // Angular события в camelCase
    return 90;
  }

  private validateSvelteEvent(event: any): number {
    // Svelte события в camelCase
    return 95;
  }
} 