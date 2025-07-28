import { UserFace, ComponentSchema } from './types';
import { IComponentRegistry, IDataLayer, IPluginSystem, IValidationEngine, IErrorRecovery, ITestingInfrastructure, ILogger } from './interfaces';
import { lifecycleManager } from './lifecycle-manager';
import { eventBus } from './event-bus';

export class Engine {
  private componentRegistry: IComponentRegistry;
  private dataLayer: IDataLayer;
  private pluginSystem: IPluginSystem;
  private validationEngine: IValidationEngine;
  private errorRecovery: IErrorRecovery;
  private testingInfrastructure: ITestingInfrastructure;
  private logger: ILogger;

  constructor(
    componentRegistry: IComponentRegistry,
    dataLayer: IDataLayer,
    pluginSystem: IPluginSystem,
    validationEngine: IValidationEngine,
    errorRecovery: IErrorRecovery,
    testingInfrastructure: ITestingInfrastructure,
    logger: ILogger
  ) {
    this.componentRegistry = componentRegistry;
    this.dataLayer = dataLayer;
    this.pluginSystem = pluginSystem;
    this.validationEngine = validationEngine;
    this.errorRecovery = errorRecovery;
    this.testingInfrastructure = testingInfrastructure;
    this.logger = logger;

    this.logger.info('Engine initialized');
  }

  // === КОМПОНЕНТЫ ===
  async registerComponent(name: string, component: any, schema?: ComponentSchema): Promise<void> {
    try {
      await lifecycleManager.executeLifecycle('beforeRegister', { name, component, schema });
      
      this.componentRegistry.registerComponent(name, component, schema);
      
      await lifecycleManager.executeLifecycle('afterRegister', { name, component, schema });
      this.logger.info(`Component registered: ${name}`);
    } catch (error) {
      await this.handleError(error as Error, { operation: 'registerComponent', name });
    }
  }

  getComponent(name: string): any {
    return this.componentRegistry.getComponent(name);
  }

  getComponentSchema(name: string): ComponentSchema | null {
    return this.componentRegistry.getComponentSchema(name);
  }

  // === РЕНДЕРИНГ ===
  async render(userFace: UserFace, adapterId: string): Promise<any> {
    try {
      await lifecycleManager.executeLifecycle('beforeRender', { userFace, adapterId });
      
      // Валидация
      const schema = this.componentRegistry.getComponentSchema(userFace.component);
      if (schema) {
        const validation = this.validationEngine.validateUserFace(userFace, schema);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
        }
      }

      // Рендеринг с данными
      const result = await this.dataLayer.renderWithData(userFace, adapterId);
      
      await lifecycleManager.executeLifecycle('afterRender', { userFace, adapterId, result });
      
      return result;
    } catch (error) {
      return await this.handleError(error as Error, { operation: 'render', userFace, adapterId });
    }
  }

  // === DATA LAYER ===
  async getData(path: string, options?: any): Promise<any> {
    return this.dataLayer.getData(path, options);
  }

  subscribeToData(path: string, callback: (data: any, state: any) => void): any {
    return this.dataLayer.subscribeToData(path, callback);
  }

  getDataState(path: string): any {
    return this.dataLayer.getDataState(path);
  }

  // === ПЛАГИНЫ ===
  async registerPlugin(plugin: any, config?: any): Promise<void> {
    await this.pluginSystem.registerPlugin(plugin, config);
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    await this.pluginSystem.uninstallPlugin(pluginId);
  }

  getActivePlugins(): any[] {
    return this.pluginSystem.getActivePlugins();
  }

  // === ТЕСТИРОВАНИЕ ===
  async runAllTests(): Promise<any[]> {
    return this.testingInfrastructure.runAllTests();
  }

  createMockComponent(name: string, schema: ComponentSchema, render: (props: any) => any): any {
    return this.testingInfrastructure.createMockComponent(name, schema, render);
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
      const recovery = await this.errorRecovery.handleError(error, context);
      if (recovery.success && recovery.fallback) {
        return recovery.fallback;
      }
    } catch (recoveryError) {
      this.logger.error('Error recovery failed:', recoveryError);
    }

    throw error;
  }

  // === СТАТИСТИКА ===
  getStats(): any {
    return {
      components: this.componentRegistry.getAllComponents().size,
      plugins: this.pluginSystem.getAllPlugins().length,
      activePlugins: this.pluginSystem.getActivePlugins().length,
      dataSources: this.dataLayer.getDataStats().totalSources,
      testResults: this.testingInfrastructure.getTestResults().length
    };
  }
} 