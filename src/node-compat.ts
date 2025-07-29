/**
 * Node.js совместимая версия Engine
 * Убирает зависимости от React и браузерных API
 */

import { Engine } from './engine';
import { ComponentRegistry } from './component-registry';
import { DataLayer } from './data-layer';
import { PluginSystem } from './plugin-system';
import { ValidationEngine } from './validation';
import { ErrorRecovery } from './error-recovery';
import { TestingInfrastructure } from '../testing-infrastructure';
import { logger } from './logger';
import { LifecycleManager } from './lifecycle-manager';
import { EventBus } from './event-bus';

// Node.js совместимый Logger
class NodeLogger {
  info(message: string, context?: string, data?: any): void {
    console.log(`[INFO] ${context ? `[${context}]` : ''} ${message}`, data || '');
  }

  warn(message: string, context?: string, data?: any): void {
    console.warn(`[WARN] ${context ? `[${context}]` : ''} ${message}`, data || '');
  }

  error(message: string, context?: string, data?: any): void {
    console.error(`[ERROR] ${context ? `[${context}]` : ''} ${message}`, data || '');
  }

  debug(message: string, context?: string, data?: any): void {
    console.debug(`[DEBUG] ${context ? `[${context}]` : ''} ${message}`, data || '');
  }
}

// Node.js совместимый Engine
export class NodeEngine extends Engine {
  constructor() {
    const logger = new NodeLogger();
    const componentStore = new ComponentRegistry();
    const dataService = new DataLayer();
    const pluginManager = new PluginSystem(componentStore);
    const validator = new ValidationEngine();
    const errorHandler = new ErrorRecovery();
    const testRunner = new TestingInfrastructure();
    const lifecycle = new LifecycleManager();
    const events = new EventBus();

    super(
      componentStore,
      dataService,
      pluginManager,
      validator,
      errorHandler,
      testRunner,
      logger
    );
  }

  // Переопределяем методы которые требуют браузерные API
  async render(userFace: any, adapterId: string): Promise<any> {
    try {
      // В Node.js просто возвращаем данные компонента
      const component = this.getComponent(userFace.component);
      if (!component) {
        throw new Error(`Component not found: ${userFace.component}`);
      }

      return {
        component: userFace.component,
        props: userFace,
        adapterId,
        timestamp: Date.now(),
        environment: 'node'
      };
    } catch (error) {
      console.error('Render error:', error);
      return { error: error.message, environment: 'node' };
    }
  }
}

// Создаем глобальный экземпляр для Node.js
export const nodeEngine = new NodeEngine(); 