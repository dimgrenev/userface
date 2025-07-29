import { Type, Platform } from './types';

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
export interface Schema {
  name: string;
  detectedPlatform: Platform;
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
  schema: Schema;
  adapterId?: string; // в каком адаптере регистрируется
} 