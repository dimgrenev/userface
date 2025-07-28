export type Platform = string;

// Базовые универсальные типы для валидации
export type BaseType = 
  | 'text'      // Любой текст
  | 'number'    // Любое число
  | 'boolean'   // Да/нет
  | 'array'     // Список элементов
  | 'object';   // Объект с ключами

// Платформо-специфичные типы
export type PlatformType = 
  | 'function'  // Функция (только Web)
  | 'element';  // Элемент (только Web)

// UI-специфичные типы
export type UIType = 
  | 'color'     // Цвет (универсальный для UI)
  | 'dimension' // Размеры (универсальный для UI)
  | 'resource'; // Ресурсы (универсальный для UI)

// Итоговый тип пропа
export type PropType = BaseType | PlatformType | UIType;

// Унифицированное описание пропа
export interface PropDefinition {
  name: string;
  type: PropType;
  required: boolean;
  defaultValue?: any;
  description?: string;
  unionValues?: string[]; // для union типов
  validation?: {
    required: boolean;
    min?: number;
    max?: number;
    pattern?: string;
  };
}

// Унифицированное описание события
export interface EventDefinition {
  name: string;
  parameters?: string[]; // типы параметров
  description?: string;
}

// Унифицированная схема компонента
export interface ComponentSchema {
  name: string;
  platform: Platform;
  props: PropDefinition[];
  events: EventDefinition[];
  children?: boolean; // поддерживает ли children
  description?: string;
  examples?: Record<string, any>[];
  meta?: {
    version: string;
    createdAt: string;
    updatedAt: string;
  };
  supportsChildren?: boolean;
}

// Унифицированная регистрация компонента
export interface ComponentRegistration {
  name: string;
  component: any;
  schema: ComponentSchema;
  adapterId?: string; // в каком адаптере регистрируется
}

// Базовый интерфейс для всех компонентов
export interface UserFace {
  component: string;
  id?: string;
  children?: any;
  
  // Универсальные базовые типы для валидации
  text?: string;
  number?: number;
  boolean?: boolean;
  array?: any[];
  object?: Record<string, any>;
  
  // Платформо-специфичные типы (Web)
  function?: (...args: any[]) => any;
  element?: any;
  
  // UI-специфичные типы
  color?: string;
  dimension?: string;
  resource?: string;
  
  // Метаданные
  meta?: {
    className?: string;
    visible?: boolean;
    style?: Record<string, any>;
    theme?: string;
    responsive?: Record<string, any>;
    accessibility?: Record<string, any>;
    [key: string]: any;
  };
  
  // События
  events?: {
    [key: string]: (...args: any[]) => void;
  };
  
  // Любые другие пропы
  [key: string]: any;
}

// Движок не знает о конкретных компонентах - они определяются пользователем

// Утилиты для работы с компонентами
export function createSpec<T extends UserFace>(spec: T): T {
  return spec;
}

export function isComponentSpec(spec: any): spec is UserFace {
  return spec && typeof spec.component === 'string';
}

// Типизированные ошибки
export class UserFaceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: string,
    public face?: UserFace
  ) {
    super(message);
    this.name = 'UserFaceError';
  }
}

export class ComponentNotFoundError extends UserFaceError {
  constructor(componentName: string) {
    super(
      `Component "${componentName}" not found`,
      'COMPONENT_NOT_FOUND',
      `Component "${componentName}" is not registered in the registry`
    );
  }
}

export class ValidationError extends UserFaceError {
  constructor(message: string, details?: string, face?: UserFace) {
    super(message, 'VALIDATION_ERROR', details, face);
  }
}

export class RenderError extends UserFaceError {
  constructor(message: string, details?: string, face?: UserFace) {
    super(message, 'RENDER_ERROR', details, face);
  }
}

// Валидация
export function validateUserFace(spec: any): spec is UserFace {
  return (
    typeof spec === 'object' &&
    spec !== null &&
    typeof spec.component === 'string' &&
    spec.component.length > 0
  );
}

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
  render(spec: UserFace): any;
  isCompatible(component: any): boolean;
  getSupportedComponents(): string[];
  validateSpec(spec: UserFace): boolean;
}

// Движок
export interface UserEngine {
  // === ОСНОВНЫЕ МЕТОДЫ ===
  registerComponent(name: string, component: any): ComponentSchema;
  registerComponents(components: Record<string, any>): ComponentSchema[];
  registerComponentWithSchema(registration: ComponentRegistration): void;
  
  getComponent(name: string): any | undefined;
  getSchema(name: string): ComponentSchema | undefined;
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

// Контекст
export interface ContextProvider {
  initialize(face: UserFace, options?: any): void;
  getData(): any;
  updateData(data: any): void;
  cleanup(): void;
} 