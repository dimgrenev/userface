import { Engine } from './engine';
import { ComponentRegistry } from './component-registry';
import { DataLayer } from './data-layer';
import { PluginSystem } from './plugin-system';
import { ValidationEngine } from './validation';
import { ErrorRecovery } from './error-recovery';
import { TestingInfrastructure } from '../testing-infrastructure';
import { logger } from './logger';

export class EngineFactory {
  static createEngine(): Engine {
    // Создаем все сервисы
    const componentRegistry = new ComponentRegistry();
    const dataLayer = new DataLayer();
    const pluginSystem = new PluginSystem(componentRegistry);
    const validationEngine = new ValidationEngine();
    const errorRecovery = new ErrorRecovery();
    const testingInfrastructure = new TestingInfrastructure();
    const loggerInstance = logger;

    // Создаем Engine с зависимостями
    const engine = new Engine(
      componentRegistry,
      dataLayer,
      pluginSystem,
      validationEngine,
      errorRecovery,
      testingInfrastructure,
      loggerInstance
    );

    return engine;
  }

  static createEngineWithCustomServices(
    componentRegistry: ComponentRegistry,
    dataLayer: DataLayer,
    pluginSystem: PluginSystem,
    validationEngine: ValidationEngine,
    errorRecovery: ErrorRecovery,
    testingInfrastructure: TestingInfrastructure,
    logger: any
  ): Engine {
    return new Engine(
      componentRegistry,
      dataLayer,
      pluginSystem,
      validationEngine,
      errorRecovery,
      testingInfrastructure,
      logger
    );
  }
}

// Создаем глобальный экземпляр Engine
export const engine = EngineFactory.createEngine(); 