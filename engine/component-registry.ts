import { Schema } from './schema';
import { IComponentStore } from './interfaces';

export class ComponentRegistry implements IComponentStore {
  private components: Map<string, any> = new Map();
  private schemas: Map<string, Schema> = new Map();

  registerComponent(name: string, component: any, schema?: Schema): void {
    try {
      // Если схема не предоставлена, создаем базовую
      if (!schema) {
        schema = {
          name,
          detectedPlatform: 'universal',
          props: [],
          events: []
        };
      }

      this.components.set(name, component);
      this.schemas.set(name, schema);

      console.log(`Component registered: ${name}`, { schema: schema.name });
    } catch (error) {
      console.error(`Failed to register component: ${name}`, error);
      throw error;
    }
  }

  getComponent(name: string): any {
    const component = this.components.get(name);
    if (!component) {
      console.warn(`Component not found: ${name}`);
      return null;
    }
    return component;
  }

  getComponentSchema(name: string): Schema | null {
    const schema = this.schemas.get(name);
    if (!schema) {
      console.warn(`Schema not found for component: ${name}`);
      return null;
    }
    return schema;
  }

  getAllComponents(): Map<string, any> {
    return new Map(this.components);
  }

  getAllSchemas(): Map<string, Schema> {
    return new Map(this.schemas);
  }

  removeComponent(name: string): void {
    const component = this.components.get(name);
    if (component) {
      this.components.delete(name);
      this.schemas.delete(name);
      console.log(`Component removed: ${name}`);
    } else {
      console.warn(`Component not found for removal: ${name}`);
    }
  }

  clear(): void {
    const count = this.components.size;
    this.components.clear();
    this.schemas.clear();
    console.log(`Registry cleared, removed ${count} components`);
  }

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  getComponentCount(): number {
    return this.components.size;
  }

  getComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  updateComponentSchema(name: string, schema: Schema): void {
    if (this.components.has(name)) {
      this.schemas.set(name, schema);
      console.log(`Schema updated for component: ${name}`);
    } else {
      console.warn(`Cannot update schema for non-existent component: ${name}`);
    }
  }

  validateComponent(name: string): boolean {
    const component = this.components.get(name);
    const schema = this.schemas.get(name);
    
    if (!component || !schema) {
      return false;
    }

    // Базовая валидация компонента
    return typeof component === 'function' || typeof component === 'object';
  }

  // === АДАПТЕРЫ ===
  private adapters: Map<string, any> = new Map();

  registerAdapter(adapter: any): void {
    const adapterId = adapter.id || `adapter-${this.adapters.size}`;
    this.adapters.set(adapterId, adapter);
    console.log(`Adapter registered: ${adapterId}`);
  }

  getAdapter(adapterId: string): any | undefined {
    return this.adapters.get(adapterId);
  }

  getAllAdapters(): any[] {
    return Array.from(this.adapters.values());
  }
}

export const componentRegistry = new ComponentRegistry(); 