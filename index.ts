// Core exports
export { Engine } from './engine/engine';
export { EngineFactory, engine } from './engine/engine-factory';

// Node.js compatibility
export { NodeEngine, nodeEngine } from './engine/node-compat';

// Logging
export { logger } from './engine/logger';
export type { LogLevel, LogEntry } from './engine/logger';

// React adapter exports
export { renderReact, RenderReact } from './engine/render-react';
export { UserRenderer, ReactContextProvider, useUserContext, useUserFace } from './engine/render-react';

// React Native adapter exports
export { renderReactNative, RenderReactNative } from './engine/render-react-native';

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
  Face,
  Platform,
  Type
} from './engine/types';

// Schema exports
export type {
  Schema,
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

// Lifecycle and Events exports
export { lifecycleManager as lifecycle } from './engine/lifecycle-manager';
export { eventBus as events } from './engine/event-bus';

// Auto-register renderers and components
import { engine } from './engine/engine-factory';
import { renderReact } from './engine/render-react';
import { renderReactNative } from './engine/render-react-native';
import { renderVue } from './engine/render-vue';
import { renderAngular } from './engine/render-angular';
import { renderSvelte } from './engine/render-svelte';
import { renderVanilla } from './engine/render-vanilla';

// Регистрация и установка адаптеров как плагины
const adapterPlugins = [
  {
    id: 'react-adapter',
    name: 'React Adapter',
    version: '1.0.0',
    type: 'adapter',
    adapter: renderReact,
    install: () => {
      engine.registerAdapter(renderReact);
    }
  },
  {
    id: 'react-native-adapter',
    name: 'React Native Adapter',
    version: '1.0.0',
    type: 'adapter',
    adapter: renderReactNative,
    install: () => {
      engine.registerAdapter(renderReactNative);
    }
  },
  {
    id: 'vue-adapter',
    name: 'Vue Adapter', 
    version: '1.0.0',
    type: 'adapter',
    adapter: renderVue,
    install: () => {
      engine.registerAdapter(renderVue);
    }
  },
  {
    id: 'angular-adapter',
    name: 'Angular Adapter',
    version: '1.0.0', 
    type: 'adapter',
    adapter: renderAngular,
    install: () => {
      engine.registerAdapter(renderAngular);
    }
  },
  {
    id: 'svelte-adapter',
    name: 'Svelte Adapter',
    version: '1.0.0',
    type: 'adapter', 
    adapter: renderSvelte,
    install: () => {
      engine.registerAdapter(renderSvelte);
    }
  },
  {
    id: 'vanilla-adapter',
    name: 'Vanilla JS Adapter',
    version: '1.0.0',
    type: 'adapter',
    adapter: renderVanilla,
    install: () => {
      engine.registerAdapter(renderVanilla);
    }
  }
];

// Функция для инициализации адаптеров
async function initializeAdapters() {
  for (const plugin of adapterPlugins) {
    await engine.registerPlugin(plugin);
    // Устанавливаем плагин сразу после регистрации
    await engine.installPlugin(plugin.id);
  }
}

// Инициализируем адаптеры
initializeAdapters().catch(console.error);
