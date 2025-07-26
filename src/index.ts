// Core exports
export { userEngine } from './core/UserEngine';
export { UserRenderer } from './core/UserRenderer';
export { useUserEngine } from './core/useUserEngine';
export { UserContext } from './core/UserContext';

// Generated types
export type { UserFace, UserEngine as UserEngineType } from './core/generated-types';

// Component registry
export { componentRegistry } from './core/reestr';

// Экспорт утилит
export { generateId, validateUserFace } from './core/utils';

// Default export for compatibility with CJS/ESM consumers
import { userEngine } from './core/UserEngine';
import { UserRenderer } from './core/UserRenderer';
import { useUserEngine } from './core/useUserEngine';
import { UserContext } from './core/UserContext';
import { componentRegistry } from './core/reestr';
import { generateId, validateUserFace } from './core/utils';

export default {
  userEngine,
  UserRenderer,
  useUserEngine,
  UserContext,
  componentRegistry,
  generateId,
  validateUserFace,
};
