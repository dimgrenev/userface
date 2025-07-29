import { Face } from './types';
import { Schema } from './schema';
import { IComponentStore, IDataService, IPluginManager, IValidator, IErrorHandler, ITestRunner, ILogger } from './interfaces';
import { lifecycleManager } from './lifecycle-manager';
import { eventBus } from './event-bus';

export class Engine {
  private componentStore: any;
  private dataService: any;
  private pluginManager: any;
  private validator: any;
  private errorHandler: any;
  private testRunner: any;
  private logger: any;

  constructor(
    componentStore: any,
    dataService: any,
    pluginManager: any,
    validator: any,
    errorHandler: any,
    testRunner: any,
    logger: any
  ) {
    this.componentStore = componentStore;
    this.dataService = dataService;
    this.pluginManager = pluginManager;
    this.validator = validator;
    this.errorHandler = errorHandler;
    this.testRunner = testRunner;
    this.logger = logger;

    this.logger.info('Engine initialized');
  }

  // === КОМПОНЕНТЫ ===
  async registerComponent(name: string, component: any, schema?: Schema): Promise<void> {
    try {
      await lifecycleManager.executeLifecycle('beforeRegister', { name, component, schema });
      
      this.componentStore.registerComponent(name, component, schema);
      
      await lifecycleManager.executeLifecycle('afterRegister', { name, component, schema });
      this.logger.info(`Component registered: ${name}`);
    } catch (error) {
      await this.handleError(error as Error, { operation: 'registerComponent', name });
    }
  }

  getComponent(name: string): any {
    return this.componentStore.getComponent(name);
  }

  getComponentSchema(name: string): Schema | null {
    return this.componentStore.getComponentSchema(name);
  }

  // === РЕНДЕРИНГ ===
  async render(userFace: Face, adapterId: string): Promise<any> {
    try {
      await lifecycleManager.executeLifecycle('beforeRender', { userFace, adapterId });
      
      // Валидация (временно отключена)
      // const schema = this.componentRegistry.getComponentSchema(userFace.component);
      // if (schema) {
      //   const validation = this.validationEngine.validateUserFace(userFace, schema);
      //   if (!validation.isValid) {
      //     throw new Error(`Validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
      //   }
      // }

      // Простой рендеринг - возвращаем компонент с данными
      const component = this.componentStore.getComponent(userFace.component);
      if (!component) {
        throw new Error(`Component not found: ${userFace.component}`);
      }

      // Обрабатываем data свойства в UserFace
      if (userFace.data) {
        for (const [key, dataConfig] of Object.entries(userFace.data)) {
          const data = await this.dataService.getData(dataConfig.source, dataConfig.config);
          userFace[key] = data;
        }
      }

      const result = {
        component: userFace.component,
        props: userFace,
        adapterId,
        timestamp: Date.now()
      };
      
      await lifecycleManager.executeLifecycle('afterRender', { userFace, adapterId, result });
      
      return result;
    } catch (error) {
      return await this.handleError(error as Error, { operation: 'render', userFace, adapterId });
    }
  }

  // === DATA SERVICE ===
  registerDataSource(path: string, config: any): void {
    this.dataService.registerDataSource(path, config);
  }

  async getData(path: string, options?: any): Promise<any> {
    return this.dataService.getData(path, options);
  }

  subscribeToData(path: string, callback: (data: any, state: any) => void): any {
    return this.dataService.subscribe(path, callback);
  }

  getDataState(path: string): any {
    return this.dataService.getState(path);
  }

  // === АДАПТЕРЫ ===
  registerAdapter(adapter: any): void {
    // Простая реализация - сохраняем адаптер в componentStore
    this.componentStore.registerAdapter?.(adapter);
    this.logger.info(`Adapter registered: ${adapter.id || adapter.name}`);
  }

  getAdapter(adapterId: string): any {
    return this.componentStore.getAdapter?.(adapterId);
  }

  getAllAdapters(): any[] {
    return this.componentStore.getAllAdapters?.() || [];
  }

  // === ПЛАГИНЫ ===
  async registerPlugin(plugin: any, config?: any): Promise<void> {
    await this.pluginManager.registerPlugin(plugin, config);
  }

  async installPlugin(pluginId: string): Promise<void> {
    await this.pluginManager.installPlugin(pluginId);
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.pluginManager.uninstallPlugin(pluginId);
  }

  getActivePlugins(): any[] {
    return this.pluginManager.getActivePlugins();
  }

  getInstalledPlugins(): any[] {
    return this.pluginManager.getInstalledPlugins();
  }

  getEnabledPlugins(): any[] {
    return this.pluginManager.getEnabledPlugins();
  }

  getPlugin(pluginId: string): any {
    return this.pluginManager.getPlugin(pluginId);
  }

  getAllPlugins(): any[] {
    return this.pluginManager.getAllPlugins();
  }

  // === ТЕСТИРОВАНИЕ ===
  async runAllTests(): Promise<any[]> {
    return this.testRunner.runAllTests();
  }

  createMockComponent(name: string, schema: Schema, render: (props: any) => any): any {
    return this.testRunner.createMockComponent(name, schema, render);
  }

  // === ЖИЗНЕННЫЙ ЦИКЛ ===
  onBeforeRegister(callback: (context: any) => void | Promise<void>): void {
    lifecycleManager.onBeforeRegister(callback);
  }

  onAfterRegister(callback: (context: any) => void | Promise<void>): void {
    lifecycleManager.onAfterRegister(callback);
  }

  onBeforeRender(callback: (context: any) => void | Promise<void>): void {
    lifecycleManager.onBeforeRender(callback);
  }

  onAfterRender(callback: (context: any) => void | Promise<void>): void {
    lifecycleManager.onAfterRender(callback);
  }

  onError(callback: (error: Error, context: any) => void | Promise<void>): void {
    lifecycleManager.onError(callback);
  }

  // === СОБЫТИЯ ===
  on(event: string, callback: (data?: any) => void): void {
    eventBus.on(event, callback);
  }

  off(event: string, callback: (data?: any) => void): void {
    eventBus.off(event, callback);
  }

  emit(event: string, data?: any): void {
    eventBus.emit(event, data);
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  private async handleError(error: Error, context: any): Promise<any> {
    this.logger.error(`Engine error: ${error.message}`, context);
    
    try {
      // Простая обработка ошибки без recovery
      console.error('Engine error:', error.message, context);
    } catch (recoveryError) {
      this.logger.error('Error handling failed:', recoveryError);
    }

    throw error;
  }

  // === СТАТИСТИКА ===
  getStats(): any {
    return {
      components: this.componentStore.getAllComponents().size,
      plugins: this.pluginManager.getAllPlugins().length,
      activePlugins: this.pluginManager.getActivePlugins().length,
      dataSources: this.dataService.getDataStats().totalSources,
      testResults: this.testRunner.getTestResults().length
    };
  }
} 