import { Engine } from './engine';
import { ComponentRegistry } from './component-registry';
import { dataLayer } from './data-layer';
import { PluginSystem } from './plugin-system';
import { validationEngine } from './validation';
import { errorRecovery } from './error-recovery';
import { testingInfrastructure } from '../testing-infrastructure';
import { logger } from './logger';

export class EngineFactory {
  static createEngine(): Engine {
    // Создаем все сервисы
    const componentStore = new ComponentRegistry();
    
    // Используем существующие экземпляры
    const dataService = dataLayer;
    const pluginManager = new PluginSystem(componentStore);
    const validator = validationEngine;
    const errorHandler = errorRecovery;
    const testRunner = testingInfrastructure;
    const loggerInstance = logger;

    // Создаем Engine с зависимостями
    const engine = new Engine(
      componentStore,
      dataService,
      pluginManager,
      validator,
      errorHandler,
      testRunner,
      loggerInstance
    );

    return engine;
  }

  static createEngineWithCustomServices(
    componentRegistry: ComponentRegistry,
    dataLayerInstance: any,
    pluginSystemInstance: any,
    validationEngineInstance: any,
    errorRecoveryInstance: any,
    testingInfrastructureInstance: any,
    loggerInstance: any
  ): Engine {
    return new Engine(
      componentRegistry,
      dataLayerInstance,
      pluginSystemInstance,
      validationEngineInstance,
      errorRecoveryInstance,
      testingInfrastructureInstance,
      loggerInstance
    );
  }
}

// Создаем глобальный экземпляр Engine
export const engine = EngineFactory.createEngine(); 