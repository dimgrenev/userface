import { ComponentSchema, ComponentRegistration } from '../schema';
import { logger } from '../logger';
import { componentAnalyzer } from '../analyzer';

// Ядро регистрации компонентов
export class ComponentRegistry {
  // Компоненты (без дублирования)
  private components = new Map<string, any>();
  
  // Кеш схем (встроенный)
  private schemas = new Map<string, ComponentSchema>();
  
  // Хеши для валидации
  private componentHashes = new Map<string, string>();

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
      
      logger.info(`Registered component "${name}"`, 'ComponentRegistry', { name, schema });
      
      return schema || this.createFallbackSchema(name);
      
    } catch (error) {
      logger.error(`Failed to register component "${name}"`, 'ComponentRegistry', error as Error, { name });
      
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

  // === МАССОВАЯ РЕГИСТРАЦИЯ ===
  
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
    if (schema) {
      this.schemas.set(name, schema);
    }
    
    logger.info(`Registered component with schema "${name}"`, 'ComponentRegistry', { name });
  }

  // === ОБНОВЛЕНИЕ И УДАЛЕНИЕ ===
  
  updateComponent(name: string, component: any): ComponentSchema | null {
    if (!this.components.has(name)) {
      logger.warn(`Cannot update non-existent component "${name}"`, 'ComponentRegistry', { name });
      return null;
    }
    
    // Обновляем компонент
    this.components.set(name, component);
    
    // Переанализируем схему
    const schema = this.analyzeComponent(component, name);
    this.schemas.set(name, schema);
    
    logger.info(`Updated component "${name}"`, 'ComponentRegistry', { name, schema });
    
    return schema;
  }

  removeComponent(name: string): boolean {
    const hadComponent = this.components.has(name);
    const hadSchema = this.schemas.has(name);
    
    this.components.delete(name);
    this.schemas.delete(name);
    this.componentHashes.delete(name);
    
    if (hadComponent || hadSchema) {
      logger.info(`Removed component "${name}"`, 'ComponentRegistry', { name });
    }
    
    return hadComponent || hadSchema;
  }

  // === ОЧИСТКА ===
  
  clear(): void {
    const componentCount = this.components.size;
    const schemaCount = this.schemas.size;
    
    this.components.clear();
    this.schemas.clear();
    this.componentHashes.clear();
    
    logger.info(`Cleared registry`, 'ComponentRegistry', { 
      removedComponents: componentCount, 
      removedSchemas: schemaCount 
    });
  }

  clearCache(): void {
    const schemaCount = this.schemas.size;
    this.schemas.clear();
    this.componentHashes.clear();
    
    logger.info(`Cleared cache`, 'ComponentRegistry', { removedSchemas: schemaCount });
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private analyzeComponent(component: any, name: string): ComponentSchema {
    // Используем универсальный анализатор
    return componentAnalyzer.analyzeComponent(component, name);
  }

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
} 