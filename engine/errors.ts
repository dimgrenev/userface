import { UserFace } from './types';

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