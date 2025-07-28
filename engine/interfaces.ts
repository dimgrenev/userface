import { Face } from './types';
import { Schema } from './schema';

// ===== ОСНОВНЫЕ ИНТЕРФЕЙСЫ ДВИЖКА =====

export interface IComponentStore {
  registerComponent(name: string, component: any, schema?: Schema): void;
  getComponent(name: string): any;
  getComponentSchema(name: string): Schema | null;
  getAllComponents(): Map<string, any>;
  getAllSchemas(): Map<string, Schema>;
  removeComponent(name: string): void;
  clear(): void;
  hasComponent(name: string): boolean;
  getComponentCount(): number;
  getComponentNames(): string[];
  updateComponentSchema(name: string, schema: Schema): void;
  validateComponent(name: string): boolean;
}

export interface IDataService {
  registerDataSource(path: string, config: any): void;
  getData(path: string, options?: any): Promise<any>;
  subscribe(path: string, callback: (data: any, state: any) => void): any;
  getState(path: string): any;
  clearCache(path?: string): void;
  getDataStats(): any;
  clearAllData(): void;
  renderWithData(spec: Face, adapterId: string): Promise<any>;
}

export interface IPluginManager {
  registerPlugin(plugin: any, config?: any): Promise<void>;
  uninstallPlugin(pluginId: string): Promise<void>;
  getActivePlugins(): any[];
  getPlugin(pluginId: string): any;
  getAllPlugins(): any[];
}

export interface IValidator {
  validateUserFace(spec: Face, schema: Schema): any;
  validateComponent(component: any, schema: Schema): any;
  addCustomValidator(name: string, validator: any): void;
  removeCustomValidator(name: string): void;
}

export interface IErrorHandler {
  handleError(error: Error, context: any): Promise<any>;
  setFallbackComponent(name: string, component: any): void;
  handleComponentError(error: Error, spec: Face, config?: any): any;
  getRecoveryStats(): any;
  getRecommendedStrategy(error: Error): string;
}

export interface ITestRunner {
  addTestSuite(suite: any): void;
  runAllTests(): Promise<any[]>;
  getTestResults(): any[];
  createMockComponent(name: string, schema: Schema, render: any): any;
  generateTestData(schema: Schema): Face;
  setTestEnvironment(env: any): void;
}

export interface ILogger {
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  debug(message: string, context?: any): void;
  getLogs(): any[];
  clearLogs(): void;
}

// ===== ИНТЕРФЕЙСЫ ЖИЗНЕННОГО ЦИКЛА =====

export interface ILifecycleHooks {
  onBeforeRegister(callback: any): void;
  onAfterRegister(callback: any): void;
  onBeforeRender(callback: any): void;
  onAfterRender(callback: any): void;
  onError(callback: any): void;
  executeLifecycle(event: string, context: any): Promise<void>;
  handleError(error: Error, context: any): Promise<void>;
}

export type LifecycleEvent = 'beforeRegister' | 'afterRegister' | 'beforeRender' | 'afterRender' | 'onError';
export type LifecycleCallback = (context: any) => void | Promise<void>;
export type ErrorCallback = (error: Error, context: any) => void | Promise<void>;

// ===== ИНТЕРФЕЙСЫ СОБЫТИЙ =====

export interface IEventHub {
  emit(event: string, data?: any): void;
  on(event: string, callback: any): void;
  off(event: string, callback: any): void;
  once(event: string, callback: any): void;
  clear(): void;
  getEventCount(): number;
}

export type EventCallback = (data?: any) => void;

// ===== ТИПЫ ДЛЯ ОШИБОК =====

export interface ErrorContext {
  operation?: string;
  data?: any;
  userFace?: Face;
} 