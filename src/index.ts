// Core exports
export { engine } from './core/engine';
export { unifiedRegistry } from './core/registry';

// Logging
export { logger } from './core/logger';
export type { LogLevel, LogEntry } from './core/logger';

// Auto-registration
export { autoRegisterComponents, autoRegisterComponent } from './core/auto-register-components';
export { findUserfaceFolder } from './core/find-userface-folder';
export { findComponentsRecursively, autoRegisterAllComponents } from './core/find-components-recursively';

// React adapter exports
export { renderReact, RenderReact } from './core/render-react';
export { UserRenderer, UserContextProvider, useUserContext, useUserFace } from './core/render-react';

// Vue adapter exports
export { renderVue, RenderVue } from './core/render-vue';

// Angular adapter exports
export { renderAngular, RenderAngular } from './core/render-angular';

// Svelte adapter exports
export { renderSvelte, RenderSvelte } from './core/render-svelte';

// Vanilla JS adapter exports
export { renderVanilla, RenderVanilla } from './core/render-vanilla';

// Type exports
export type {
  UserFace,
  Platform,
  Type
} from './core/types';

// Schema exports
export type {
  ComponentSchema,
  PropDefinition,
  EventDefinition,
  ComponentRegistration
} from './core/schema';

// API exports
export type {
  RenderPlatform,
  UserEngine,
  ContextProvider
} from './core/api';

// Error exports
export {
  UserFaceError,
  ComponentNotFoundError,
  ValidationError,
  RenderError
} from './core/errors';

// Utility functions
export { validateUserFace } from './core/types';

// Auto-register renderers and components
import './core/init';
