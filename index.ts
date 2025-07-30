// UserFace Engine - Universal Data-Driven UI Engine
// Экспортируем все основные компоненты движка

console.log('[UserFace] Loading engine...');

// AST Analyzer (серверный) - НАСТОЯЩИЙ AST-АНАЛИЗАТОР
console.log('[AST-DEBUG] index.ts: about to export astAnalyzer');
export { realASTAnalyzer as astAnalyzer, realASTAnalyzer as ASTAnalyzer, realASTAnalyzer as realAstAnalyzer } from './engine/real-ast-analyzer';

// Prop Generator - умная генерация пропсов
export { PropGenerator, filterDOMProps } from './engine/prop-generator';

// Engine Core
export { Engine } from './engine/engine';
export { EngineFactory } from './engine/engine-factory';
export { engine } from './engine/engine-factory';

// Adapters
export { AdapterManager } from './engine/adapter-manager';

// Renderers
export { renderReact, RenderReact } from './engine/render-react';
export { renderVue, RenderVue } from './engine/render-vue';
export { renderAngular, RenderAngular } from './engine/render-angular';
export { renderSvelte, RenderSvelte } from './engine/render-svelte';
export { renderVanilla, RenderVanilla } from './engine/render-vanilla';
export { renderReactNative, RenderReactNative } from './engine/render-react-native';

// Data Layer
export { DataLayer, dataLayer } from './engine/data-layer';

// Validation
export { ValidationEngine, validationEngine } from './engine/validation';

// Plugin System
export { PluginSystem, pluginSystem } from './engine/plugin-system';

// Event System
export { EventBus, eventBus as events } from './engine/event-bus';

// Lifecycle Management
export { LifecycleManager, lifecycleManager as lifecycle } from './engine/lifecycle-manager';

// Component Registry
export { ComponentRegistry } from './engine/component-registry';

// Component Scanner
export { ComponentScanner } from './engine/scanner';

// Logging
export { logger } from './engine/logger';

// Error Recovery
export { ErrorRecovery, errorRecovery } from './engine/error-recovery';

// Node.js Engine
export { NodeEngine, nodeEngine } from './engine/node-compat';

console.log('[UserFace] Engine loaded successfully');
