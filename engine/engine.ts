import { UserFace, ComponentSchema } from './types';
import { IComponentRegistry, IDataLayer, IPluginSystem, IValidationEngine, IErrorRecovery, ITestingInfrastructure, ILogger } from './interfaces';
import { lifecycleManager } from './lifecycle-manager';
import { eventBus } from './event-bus';

export class Engine {
  private componentRegistry: any;
  private dataLayer: any;
  private pluginSystem: any;
  private validationEngine: any;
  private errorRecovery: any;
  private testingInfrastructure: any;
  private logger: any;

  constructor(
    componentRegistry: any,
    dataLayer: any,
    pluginSystem: any,
    validationEngine: any,
    errorRecovery: any,
    testingInfrastructure: any,
    logger: any
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
      
      // Валидация (временно отключена)
      // const schema = this.componentRegistry.getComponentSchema(userFace.component);
      // if (schema) {
      //   const validation = this.validationEngine.validateUserFace(userFace, schema);
      //   if (!validation.isValid) {
      //     throw new Error(`Validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
      //   }
      // }

      // Простой рендеринг - возвращаем компонент с данными
      const component = this.componentRegistry.getComponent(userFace.component);
      if (!component) {
        throw new Error(`Component not found: ${userFace.component}`);
      }

      // Обрабатываем data свойства в UserFace
      if (userFace.data) {
        for (const [key, dataConfig] of Object.entries(userFace.data)) {
          const data = await this.dataLayer.getData(dataConfig.source, dataConfig.config);
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

  // === DATA LAYER ===
  registerDataSource(path: string, config: any): void {
    this.dataLayer.registerDataSource(path, config);
  }

  async getData(path: string, options?: any): Promise<any> {
    return this.dataLayer.getData(path, options);
  }

  subscribeToData(path: string, callback: (data: any, state: any) => void): any {
    return this.dataLayer.subscribe(path, callback);
  }

  getDataState(path: string): any {
    return this.dataLayer.getState(path);
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

  getPlugin(pluginId: string): any {
    return this.pluginSystem.getPlugin(pluginId);
  }

  getAllPlugins(): any[] {
    return this.pluginSystem.getAllPlugins();
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
      components: this.componentRegistry.getAllComponents().size,
      plugins: this.pluginSystem.getAllPlugins().length,
      activePlugins: this.pluginSystem.getActivePlugins().length,
      dataSources: this.dataLayer.getDataStats().totalSources,
      testResults: this.testingInfrastructure.getTestResults().length
    };
  }
} 