import { Schema, PropDefinition, EventDefinition, ComponentRegistration } from './schema';
import { Type, Platform, Face } from './types';
import { realASTAnalyzer } from './real-ast-analyzer';

console.log('[REGISTRY] Component registry loaded');

export class ComponentRegistry {
  private components: Map<string, ComponentRegistration> = new Map();
  private analyzers: Map<string, any> = new Map();

  constructor() {
    console.log('[REGISTRY] ComponentRegistry constructed');
    // Регистрируем анализатор по умолчанию
    this.registerAnalyzer('default', realASTAnalyzer);
  }

  registerComponent(name: string, component: any, metadata?: Partial<Schema>): void {
    console.log('[REGISTRY] Registering component:', name);
    
    try {
      // Анализируем компонент для получения схемы
      const schema = realASTAnalyzer.analyzeComponent(component, name);
      
      // Объединяем с переданными метаданными
      const finalSchema: Schema = {
        ...schema,
        ...metadata
      };

      const registration: ComponentRegistration = {
        name,
        component,
        schema: finalSchema,
        registeredAt: new Date(),
        version: '1.0.0'
      };

      this.components.set(name, registration);
      console.log('[REGISTRY] Component registered successfully:', name);
    } catch (error) {
      console.error('[REGISTRY] Error registering component:', error);
      throw error;
    }
  }

  getComponent(name: string): ComponentRegistration | undefined {
    return this.components.get(name);
  }

  getAllComponents(): ComponentRegistration[] {
    return Array.from(this.components.values());
  }

  updateComponent(name: string, component: any, metadata?: Partial<Schema>): void {
    console.log('[REGISTRY] Updating component:', name);
    
    if (!this.components.has(name)) {
      throw new Error(`Component ${name} not found`);
    }

    try {
      // Анализируем обновленный компонент
      const newSchema = realASTAnalyzer.analyzeComponent(component, name);
      
      // Объединяем с переданными метаданными
      const finalSchema: Schema = {
        ...newSchema,
        ...metadata
      };

      const existing = this.components.get(name)!;
      const updatedRegistration: ComponentRegistration = {
        ...existing,
        component,
        schema: finalSchema,
        registeredAt: new Date()
      };

      this.components.set(name, updatedRegistration);
      console.log('[REGISTRY] Component updated successfully:', name);
    } catch (error) {
      console.error('[REGISTRY] Error updating component:', error);
      throw error;
    }
  }

  removeComponent(name: string): boolean {
    console.log('[REGISTRY] Removing component:', name);
    return this.components.delete(name);
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  getComponentCount(): number {
    return this.components.size;
  }

  clear(): void {
    console.log('[REGISTRY] Clearing all components');
    this.components.clear();
  }

  // Методы для работы с анализаторами
  registerAnalyzer(name: string, analyzer: any): void {
    console.log('[REGISTRY] Registering analyzer:', name);
    this.analyzers.set(name, analyzer);
  }

  getAnalyzer(name: string): any {
    return this.analyzers.get(name) || this.analyzers.get('default');
  }

  analyzeComponent(component: any, name: string, analyzerName?: string): Schema {
    console.log('[REGISTRY] Analyzing component:', name, 'with analyzer:', analyzerName || 'default');
    
    const analyzer = analyzerName ? this.getAnalyzer(analyzerName) : this.getAnalyzer('default');
    
    if (!analyzer) {
      throw new Error('No analyzer available');
    }

    return realASTAnalyzer.analyzeComponent(component, name);
  }

  // Методы для поиска компонентов
  findComponentsByPlatform(platform: Platform): ComponentRegistration[] {
    return this.getAllComponents().filter(reg => reg.schema.detectedPlatform === platform);
  }

  findComponentsByType(type: Type): ComponentRegistration[] {
    return this.getAllComponents().filter(reg => 
      reg.schema.props.some(prop => prop.type === type)
    );
  }

  findComponentsByName(pattern: string): ComponentRegistration[] {
    const regex = new RegExp(pattern, 'i');
    return this.getAllComponents().filter(reg => regex.test(reg.name));
  }

  // Методы для экспорта/импорта
  exportRegistry(): ComponentRegistration[] {
    return this.getAllComponents();
  }

  importRegistry(registrations: ComponentRegistration[]): void {
    console.log('[REGISTRY] Importing registry with', registrations.length, 'components');
    
    for (const registration of registrations) {
      this.components.set(registration.name, registration);
    }
  }

  // Методы для статистики
  getStatistics(): {
    totalComponents: number;
    platforms: Record<Platform, number>;
    types: Record<Type, number>;
    averageProps: number;
    averageEvents: number;
  } {
    const components = this.getAllComponents();
    const platforms: Record<Platform, number> = {} as Record<Platform, number>;
    const types: Record<Type, number> = {} as Record<Type, number>;
    let totalProps = 0;
    let totalEvents = 0;

    for (const reg of components) {
      const platform = reg.schema.detectedPlatform;
      platforms[platform] = (platforms[platform] || 0) + 1;

      for (const prop of reg.schema.props) {
        types[prop.type] = (types[prop.type] || 0) + 1;
        totalProps++;
      }

      totalEvents += reg.schema.events.length;
    }

    return {
      totalComponents: components.length,
      platforms,
      types,
      averageProps: components.length > 0 ? totalProps / components.length : 0,
      averageEvents: components.length > 0 ? totalEvents / components.length : 0
    };
  }
}

// Создаем глобальный экземпляр реестра
export const componentRegistry = new ComponentRegistry(); 