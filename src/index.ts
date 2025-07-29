// UserFace Engine - Universal Data-Driven UI Engine
// Экспортируем все основные компоненты движка

console.log('[UserFace] Loading engine...');

// AST Analyzer (серверный) - НАСТОЯЩИЙ AST-АНАЛИЗАТОР
console.log('[AST-DEBUG] index.ts: about to export astAnalyzer');
export { realASTAnalyzer as astAnalyzer, realASTAnalyzer as ASTAnalyzer } from './engine/real-ast-analyzer';
export { realASTAnalyzer as realAstAnalyzer } from './engine/real-ast-analyzer';

// Engine Core
export { Engine } from './engine/engine';
export { EngineFactory, engine } from './engine/engine-factory';

// Adapters
export { AdapterManager } from './engine/adapter-manager';

// Rendering
export { renderReact, RenderReact } from './engine/render-react';
export { renderVue, RenderVue } from './engine/render-vue';
export { renderAngular, RenderAngular } from './engine/render-angular';
export { renderSvelte, RenderSvelte } from './engine/render-svelte';
export { renderVanilla, RenderVanilla } from './engine/render-vanilla';
export { renderReactNative, RenderReactNative } from './engine/render-react-native';

// Data Layer
export { dataLayer, DataLayer } from './engine/data-layer';

// Validation
export { validationEngine, ValidationEngine } from './engine/validation';
export { ValidationError } from './engine/errors';

// Plugin System
export { pluginSystem, PluginSystem } from './engine/plugin-system';

// Event System
export { eventBus as events } from './engine/event-bus';

// Lifecycle
export { lifecycleManager as lifecycle } from './engine/lifecycle-manager';

// Registry
export { ComponentRegistry } from './engine/component-registry';

// Scanner
export { ComponentScanner } from './engine/scanner';

// Logger
export { logger } from './engine/logger';

// Error Recovery
export { errorRecovery, ErrorRecovery } from './engine/error-recovery';

// Node Compatibility
export { NodeEngine, nodeEngine } from './engine/node-compat';

// Types
export type { Schema, PropDefinition, EventDefinition, ComponentRegistration } from './engine/schema';
export type { Type, Platform, Face } from './engine/types';

// Main Engine Instance
import { engine } from './engine/engine-factory';
export const userfaceEngine = engine;

console.log('[UserFace] Engine loaded successfully');
