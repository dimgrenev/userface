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

// Универсальный контейнер для всех компонентов
export interface UserFace {
    component: string;
    id?: string;
    children?: any;
    meta?: {
        className?: string;
        visible?: boolean;
        style?: Record<string, any>;
        theme?: string;
        responsive?: Record<string, any>;
        accessibility?: Record<string, any>;
        [key: string]: any;
    };
    events?: {
        [key: string]: (...args: any[]) => void;
    };
    data?: {
        [key: string]: {
            source: string;
            config?: {
                cache?: boolean;
                polling?: number;
                realtime?: boolean;
                transform?: (data: any) => any;
                [key: string]: any;
            };
        };
    };
    [key: string]: any;
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

// === ТИПЫ ДЛЯ СКАНИРОВАНИЯ ===

export interface FoundComponent {
  path: string;
  name: string;
  module: any;
}

export interface ComponentSearchResult {
  found: boolean;
  components: FoundComponent[];
  error?: string;
} 