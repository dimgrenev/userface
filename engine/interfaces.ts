// ===== ОСНОВНЫЕ ИНТЕРФЕЙСЫ ДВИЖКА =====

export interface IComponentRegistry {
  registerComponent(name: string, component: any, schema?: ComponentSchema): void;
  getComponent(name: string): any;
  getComponentSchema(name: string): ComponentSchema | null;
  getAllComponents(): Map<string, any>;
  getAllSchemas(): Map<string, ComponentSchema>;
  removeComponent(name: string): void;
  clear(): void;
}

export interface IDataLayer {
  registerDataSource(path: string, config: DataSourceConfig): void;
  getData(path: string, options?: DataOptions): Promise<any>;
  subscribeToData(path: string, callback: DataCallback): DataSubscription;
  getDataState(path: string): DataState | null;
  clearAllData(): void;
  getDataStats(): DataStats;
  renderWithData(spec: UserFace, adapterId: string): Promise<any>;
}

export interface IPluginSystem {
  registerPlugin(plugin: Plugin, config?: PluginConfig): Promise<void>;
  uninstallPlugin(pluginId: string): Promise<void>;
  enablePlugin(pluginId: string): Promise<void>;
  disablePlugin(pluginId: string): Promise<void>;
  getPlugin(pluginId: string): Plugin | null;
  getAllPlugins(): Plugin[];
  getActivePlugins(): Plugin[];
  executeHook(hookName: string, context: any): Promise<any>;
}

export interface IValidationEngine {
  validateUserFace(spec: UserFace, schema: ComponentSchema): ValidationResult;
  validateComponent(component: any, schema: ComponentSchema): ValidationResult;
  addCustomValidator(name: string, validator: ValidatorFunction): void;
  removeCustomValidator(name: string): void;
}

export interface IErrorRecovery {
  handleError(error: Error, context: ErrorContext): Promise<RecoveryResult>;
  setFallbackComponent(name: string, component: any): void;
  setRecoveryStrategy(strategy: RecoveryStrategy): void;
  getRecoveryStats(): RecoveryStats;
}

export interface ITestingInfrastructure {
  addTestSuite(suite: TestSuite): void;
  runAllTests(): Promise<TestResult[]>;
  getTestResults(): TestResult[];
  createMockComponent(name: string, schema: ComponentSchema, render: MockRenderFunction): MockComponent;
  generateTestData(schema: ComponentSchema): UserFace;
  setTestEnvironment(env: TestEnvironment): void;
}

export interface ILogger {
  log(level: LogLevel, message: string, context?: any): void;
  debug(message: string, context?: any): void;
  info(message: string, context?: any): void;
  warn(message: string, context?: any): void;
  error(message: string, context?: any): void;
  setLevel(level: LogLevel): void;
  getLogs(): LogEntry[];
}

// ===== ИНТЕРФЕЙСЫ ЖИЗНЕННОГО ЦИКЛА =====

export interface ILifecycleManager {
  onBeforeRegister(callback: LifecycleCallback): void;
  onAfterRegister(callback: LifecycleCallback): void;
  onBeforeRender(callback: LifecycleCallback): void;
  onAfterRender(callback: LifecycleCallback): void;
  onError(callback: ErrorCallback): void;
  executeLifecycle(event: LifecycleEvent, context: any): Promise<void>;
}

// ===== ИНТЕРФЕЙСЫ СОБЫТИЙ =====

export interface IEventBus {
  emit(event: string, data?: any): void;
  on(event: string, callback: EventCallback): void;
  off(event: string, callback: EventCallback): void;
  once(event: string, callback: EventCallback): void;
  clear(): void;
}

// ===== ТИПЫ ДЛЯ ИНТЕРФЕЙСОВ =====

export type LifecycleCallback = (context: any) => void | Promise<void>;
export type ErrorCallback = (error: Error, context: any) => void | Promise<void>;
export type EventCallback = (data?: any) => void;
export type ValidatorFunction = (value: any, schema: any) => ValidationResult;
export type MockRenderFunction = (props: any) => any;
export type DataCallback = (data: any, state: DataState) => void;

export type LifecycleEvent = 'beforeRegister' | 'afterRegister' | 'beforeRender' | 'afterRender' | 'error';

export interface ErrorContext {
  component?: string;
  operation?: string;
  data?: any;
  userFace?: UserFace;
}

export interface RecoveryResult {
  success: boolean;
  fallback?: any;
  retry?: boolean;
  error?: Error;
}

export interface RecoveryStats {
  totalErrors: number;
  recoveredErrors: number;
  fallbackUsed: number;
  retries: number;
}

export interface DataStats {
  totalSources: number;
  activeSubscriptions: number;
  cacheSize: number;
  lastUpdate: number;
}

// ===== СУЩЕСТВУЮЩИЕ ТИПЫ (импортируем из других файлов) =====

import { 
  UserFace, 
  ComponentSchema, 
  DataSourceConfig, 
  DataState, 
  DataSubscription,
  DataOptions,
  Plugin,
  PluginConfig,
  ValidationResult,
  RecoveryStrategy,
  TestSuite,
  TestResult,
  MockComponent,
  TestEnvironment,
  LogLevel,
  LogEntry
} from './types'; 