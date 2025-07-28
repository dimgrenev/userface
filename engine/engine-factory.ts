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
    const componentRegistry = new ComponentRegistry();
    
    // Используем существующие экземпляры
    const dataLayerInstance = dataLayer;
    const pluginSystemInstance = new PluginSystem(componentRegistry);
    const validationEngineInstance = validationEngine;
    const errorRecoveryInstance = errorRecovery;
    const testingInfrastructureInstance = testingInfrastructure;
    const loggerInstance = logger;

    // Создаем Engine с зависимостями
    const engine = new Engine(
      componentRegistry,
      dataLayerInstance,
      pluginSystemInstance,
      validationEngineInstance,
      errorRecoveryInstance,
      testingInfrastructureInstance,
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