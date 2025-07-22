// Core exports
export { userEngine } from './core/UserEngine';
export { UserRenderer } from './core/UserRenderer';

// Generated types
export type { UserFace, UserEngine as UserEngineType } from './core/generated-types';

// Component registry
export { componentRegistry } from './core/reestr';

// Экспорт утилит
export { generateId, validateUserFace } from './core/utils';
