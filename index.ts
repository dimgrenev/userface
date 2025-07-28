// Core exports
export { Engine } from './engine/engine';
export { EngineFactory, engine } from './engine/engine-factory';
export { unifiedRegistry } from './engine/registry'; // Legacy export for backward compatibility

// Logging
export { logger } from './engine/logger';
export type { LogLevel, LogEntry } from './engine/logger';

// React adapter exports
export { renderReact, RenderReact } from './engine/render-react';
export { UserRenderer, UserContextProvider, useUserContext, useUserFace } from './engine/render-react';

// Vue adapter exports
export { renderVue, RenderVue } from './engine/render-vue';

// Angular adapter exports
export { renderAngular, RenderAngular } from './engine/render-angular';

// Svelte adapter exports
export { renderSvelte, RenderSvelte } from './engine/render-svelte';

// Vanilla JS adapter exports
export { renderVanilla, RenderVanilla } from './engine/render-vanilla';

// Type exports
export type {
  UserFace,
  Platform,
  Type
} from './engine/types';

// Schema exports
export type {
  ComponentSchema,
  PropDefinition,
  EventDefinition,
  ComponentRegistration
} from './engine/schema';

// API exports
export type {
  RenderPlatform,
  UserEngine,
  ContextProvider
} from './engine/api';

// Error exports
export {
  UserFaceError,
  ComponentNotFoundError,
  ValidationError,
  RenderError
} from './engine/errors';

// Validation exports
export { validationEngine, ValidationEngine } from './engine/validation';
export type { ValidationResult, ValidationWarning } from './engine/validation';

// Error Recovery exports
export { errorRecovery, ErrorRecovery } from './engine/error-recovery';
export type { FallbackComponent, RecoveryStrategy, RecoveryConfig } from './engine/error-recovery';

// Plugin System exports
export { pluginSystem, PluginSystem } from './engine/plugin-system';
export type { Plugin, PluginType, PluginContext, PluginConfig, PluginStatus } from './engine/plugin-system';

// Testing Infrastructure exports
export { testingInfrastructure, TestingInfrastructure } from './testing-infrastructure';
export type { TestResult, TestSuite, TestCase, MockComponent, TestEnvironment } from './testing-infrastructure';

// Data Layer exports
export { dataLayer, DataLayer } from './engine/data-layer';
export type { 
  DataSource, 
  DataSourceConfig, 
  DataState, 
  DataSubscription, 
  DataCache,
  APIClient,
  StateManager,
  ReactivityEngine,
  DataValidator
} from './engine/data-layer';

// Data Layer Tests
export { runDataLayerTests } from './data-layer-tests';

// Comprehensive Tests
export { runComprehensiveTests } from './comprehensive-tests';

// Utility functions
export { validateUserFace } from './engine/types';

// Auto-register renderers and components
import { unifiedRegistry } from './engine/registry';
import { renderReact } from './engine/render-react';
import { renderVue } from './engine/render-vue';
import { renderAngular } from './engine/render-angular';
import { renderSvelte } from './engine/render-svelte';
import { renderVanilla } from './engine/render-vanilla';

// Инициализация с адаптерами
unifiedRegistry.initializeWithAdapters([
  { adapter: renderReact, name: 'React' },
  { adapter: renderVue, name: 'Vue' },
  { adapter: renderAngular, name: 'Angular' },
  { adapter: renderSvelte, name: 'Svelte' },
  { adapter: renderVanilla, name: 'Vanilla JS' }
]);
