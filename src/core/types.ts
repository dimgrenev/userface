export type Platform = string;

// Базовые универсальные типы
export type TypeBase = 
  | 'text'      // Любой текст
  | 'number'    // Любое число
  | 'boolean'   // Да/нет
  | 'array'     // Список элементов
  | 'object';   // Объект с ключами

// Платформо-специфичные типы
export type TypePlatform = 
  | 'function'  // Функция (только Web)
  | 'element';  // Элемент (только Web)

// UI-специфичные типы
export type TypeUI = 
  | 'color'     // Цвет (универсальный для UI)
  | 'dimension' // Размеры (универсальный для UI)
  | 'resource'; // Ресурсы (универсальный для UI)

// Типы для шрифтов
export type TypeFace = 
  | 'font-family'  // Семейство шрифтов
  | 'font-size'    // Размер шрифта
  | 'font-weight'  // Жирность шрифта
  | 'font-style';  // Стиль шрифта

// Итоговый тип пропа
export type Type = TypeBase | TypePlatform | TypeUI | TypeFace;

// Унифицированное описание пропа
export interface PropDefinition {
  name: string;
  type: Type;
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
  
  // Универсальные базовые типы
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
  
  // Для обратной совместимости - любые другие пропы
  [key: string]: any;
}

// Специфичные типы компонентов
export interface ButtonSpec extends Omit<UserFace, 'component'> {
  component: 'button';
  text: string;
  variant?: "primary" | "secondary" | "accent" | "danger" | "ghost" | "default" | "outlined" | "round";
  fullWidth?: boolean;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  loading?: boolean;
  icon?: any;
  iconPosition?: "left" | "right";
}

export interface TextSpec extends Omit<UserFace, 'component'> {
  component: 'text';
  text: string;
  variant?: "body-primary" | "body-secondary" | "heading-primary" | "heading-secondary" | "subheading-primary" | "subheading-secondary" | "caption-primary" | "caption-secondary" | "label-primary" | "label-secondary" | "success" | "warning" | "error";
  weight?: "normal" | "medium" | "semibold" | "bold";
  align?: "left" | "center" | "right" | "justify";
  truncate?: boolean;
  maxLines?: number;
  as?: keyof JSX.IntrinsicElements;
}

export interface InputSpec extends Omit<UserFace, 'component'> {
  component: 'input';
  label?: string;
  placeholder?: string;
  value?: string;
  type?: number;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  hint?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  autocomplete?: string;
  align?: "vertical" | "horizontal";
}

export interface CardSpec extends Omit<UserFace, 'component'> {
  component: 'card';
  variant?: "default" | "elevated";
  media?: any;
  header?: any;
  content?: any;
  footer?: any;
}

export interface ModalSpec extends Omit<UserFace, 'component'> {
  component: 'modal';
  isOpen: boolean;
  title?: string;
  variant?: "default" | "centered" | "side";
}

export interface FormSpec extends Omit<UserFace, 'component'> {
  component: 'form';
}

export interface ListSpec extends Omit<UserFace, 'component'> {
  component: 'list';
  items: any[];
  variant?: "default" | "bordered" | "striped";
}

export interface TableSpec extends Omit<UserFace, 'component'> {
  component: 'table';
  columns: any[];
  data: any[];
  variant?: "default" | "striped" | "bordered";
}

export interface TabsSpec extends Omit<UserFace, 'component'> {
  component: 'tabs';
  tabs: any[];
  defaultActiveTab?: string;
  variant?: "default" | "pills" | "underline";
}

export interface AccordionSpec extends Omit<UserFace, 'component'> {
  component: 'accordion';
  items: any[];
  variant?: "plus" | "arrow";
}

export interface SliderSpec extends Omit<UserFace, 'component'> {
  component: 'slider';
  min?: number;
  max?: number;
  value?: number;
  step?: number;
  disabled?: boolean;
}

export interface ProgressSpec extends Omit<UserFace, 'component'> {
  component: 'progress';
  value: number;
  max?: number;
  variant?: "default" | "success" | "warning" | "error";
  showLabel?: boolean;
}

export interface CheckboxSpec extends Omit<UserFace, 'component'> {
  component: 'checkbox';
  label?: string;
  checked?: boolean;
  disabled?: boolean;
  required?: boolean;
}

export interface RadioSpec extends Omit<UserFace, 'component'> {
  component: 'radio';
  name: string;
  options: any[];
  value?: string;
  disabled?: boolean;
  required?: boolean;
}

export interface SelectSpec extends Omit<UserFace, 'component'> {
  component: 'select';
  label?: string;
  options: any[];
  value?: string;
  values?: string;
  multiple?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

export interface TextareaSpec extends Omit<UserFace, 'component'> {
  component: 'textarea';
  label?: string;
  placeholder?: string;
  value?: string;
  flow?: "vertical" | "horizontal";
  autoResize?: boolean;
}

export interface ImageSpec extends Omit<UserFace, 'component'> {
  component: 'image';
  src: string;
  alt: string;
  width?: string;
  height?: string;
  variant?: "default" | "rounded" | "circle" | "thumbnail";
  lazy?: boolean;
}

export interface LinkSpec extends Omit<UserFace, 'component'> {
  component: 'link';
  href: string;
  variant?: "default" | "primary" | "secondary" | "underline";
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
}

export interface ContainerSpec extends Omit<UserFace, 'component'> {
  component: 'container';
  as?: keyof JSX.IntrinsicElements;
}

export interface LayoutSpec extends Omit<UserFace, 'component'> {
  component: 'layout';
  header?: any;
  main: any;
  side?: any;
  footer?: any;
  variant?: "default" | "sidebar" | "header-footer";
}

export interface MediaSpec extends Omit<UserFace, 'component'> {
  component: 'media';
  src: string;
  type: "image" | "video" | "audio";
  alt?: string;
  width?: string;
  height?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
}

export interface PanelSpec extends Omit<UserFace, 'component'> {
  component: 'panel';
  title?: string;
  variant?: "default" | "elevated" | "outlined";
}

export interface SideSpec extends Omit<UserFace, 'component'> {
  component: 'side';
  position?: "left" | "right";
  width?: string;
}

export interface FooterSpec extends Omit<UserFace, 'component'> {
  component: 'footer';
  variant?: "default" | "minimal" | "full";
}

export interface FilterSpec extends Omit<UserFace, 'component'> {
  component: 'filter';
  fields: any[];
  variant?: "default" | "compact" | "expanded";
}

export interface FeedSpec extends Omit<UserFace, 'component'> {
  component: 'feed';
  items: any[];
  variant?: "default" | "timeline" | "card";
}

export interface CodeSpec extends Omit<UserFace, 'component'> {
  component: 'code';
  code: string;
  language?: string;
  theme?: "light" | "dark";
  showLineNumbers?: boolean;
}

export interface CardcartSpec extends Omit<UserFace, 'component'> {
  component: 'cardcart';
  items: any[];
  variant?: "default" | "compact" | "detailed";
}

export interface ArticleSpec extends Omit<UserFace, 'component'> {
  component: 'article';
  title?: string;
  content: any;
  author?: string;
  date?: string;
  variant?: "default" | "card" | "minimal";
}

// Объединенный тип для всех компонентов
export type ComponentName = 'button' | 'text' | 'input' | 'card' | 'modal' | 'form' | 'list' | 'table' | 'tabs' | 'accordion' | 'slider' | 'progress' | 'checkbox' | 'radio' | 'select' | 'textarea' | 'image' | 'link' | 'container' | 'layout' | 'media' | 'panel' | 'side' | 'footer' | 'filter' | 'feed' | 'code' | 'cardcart' | 'article';

export type ComponentSpec = ButtonSpec | TextSpec | InputSpec | CardSpec | ModalSpec | FormSpec | ListSpec | TableSpec | TabsSpec | AccordionSpec | SliderSpec | ProgressSpec | CheckboxSpec | RadioSpec | SelectSpec | TextareaSpec | ImageSpec | LinkSpec | ContainerSpec | LayoutSpec | MediaSpec | PanelSpec | SideSpec | FooterSpec | FilterSpec | FeedSpec | CodeSpec | CardcartSpec | ArticleSpec;

// Утилиты для работы с компонентами
export function createSpec<T extends ComponentSpec>(spec: T): T {
  return spec;
}

export function isComponentSpec(spec: any): spec is ComponentSpec {
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