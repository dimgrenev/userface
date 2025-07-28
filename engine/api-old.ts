import { Face, Platform } from './types';
import { Schema } from './schema';

// Рендерер
export interface Renderer {
  createElement(type: string, props: any, children: any[]): any;
  render(component: any, container: any): void;
  unmount(container: any): void;
}

// Рендерер платформы
export interface RenderPlatform {
  id: Platform;
  meta: {
    name: string;
    version: string;
    platform: Platform;
  };
  renderer: Renderer;
  render(spec: Face): any;
  isCompatible(component: any): boolean;
  getSupportedComponents(): string[];
  validateSpec(spec: Face): boolean;
}

// Движок
export interface UserEngine {
  // === ОСНОВНЫЕ МЕТОДЫ ===
  registerComponent(name: string, component: any): Schema;
  registerComponents(components: Record<string, any>): Schema[];
  registerComponentWithSchema(registration: any): void;
  
  getComponent(name: string): any | undefined;
  getSchema(name: string): Schema | undefined;
  getAllComponents(): Record<string, any>;
  getAllComponentNames(): string[];
  getAllSchemas(): ComponentSchema[];
  getSchemasByPlatform(platform: Platform): ComponentSchema[];
  
  // === РЕНДЕРЕРЫ ПЛАТФОРМ ===
  registerAdapter(adapter: RenderPlatform): void;
  reinstallAdapter(adapter: RenderPlatform): void;
  getAdapter(adapterId: string): RenderPlatform | undefined;
  getAllAdapters(): RenderPlatform[];
  
  // === РЕНДЕРИНГ ===
  renderWithAdapter(spec: UserFace, adapterId: string): any;
  renderWithAllAdapters(spec: UserFace): Record<string, any>;
  
  // === ЖИЗНЕННЫЙ ЦИКЛ ===
  updateComponent(name: string, component: any): ComponentSchema | null;
  removeComponent(name: string): boolean;
  clearCache(): void;
  clear(): void;
  
  // === СТАТИСТИКА ===
  getStats(): any;
  
  // === API ДЛЯ КОНВЕРТЕРА ===
  exportSchema(name: string): ComponentSchema | null;
  exportAllSchemas(): ComponentSchema[];
  validateMigration(sourceSchema: ComponentSchema, targetPlatform: Platform): any;
}

// Провайдер контекста
export interface ContextProvider {
  initialize(face: UserFace, options?: any): void;
  getData(): any;
  updateData(data: any): void;
  cleanup(): void;
}

// Интерфейс для доступа к Registry
export interface ComponentRegistry {
  getComponent(name: string): any | undefined;
  getSchema(name: string): any | undefined;
  getAllComponentNames(): string[];
} 