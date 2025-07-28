import { UserFace, Platform } from './types';
import { ComponentRegistration, ComponentSchema } from './schema';
import { RenderPlatform, UserEngine } from './api';
import { unifiedRegistry } from './registry';
import { logger } from './logger';

// Реестр рендереров платформ
const adapters = new Map<string, RenderPlatform>();

const createEngine = (): UserEngine => {
  // === ДЕЛЕГИРУЕМ В REGISTRY ===
  
  const registerComponent = (name: string, component: any): ComponentSchema => {
    return unifiedRegistry.registerComponent(name, component);
  };

  const registerComponents = (components: Record<string, any>): ComponentSchema[] => {
    return unifiedRegistry.registerComponents(components);
  };

  const registerComponentWithSchema = (registration: ComponentRegistration): void => {
    unifiedRegistry.registerComponentWithSchema(registration);
  };

  const getComponent = (name: string): any | undefined => {
    return unifiedRegistry.getComponent(name);
  };

  const getSchema = (name: string): ComponentSchema | undefined => {
    return unifiedRegistry.getSchema(name);
  };

  const getAllComponents = (): Record<string, any> => {
    return unifiedRegistry.getAllComponents();
  };

  const getAllComponentNames = (): string[] => {
    return unifiedRegistry.getAllComponentNames();
  };

  const getAllSchemas = (): ComponentSchema[] => {
    return unifiedRegistry.getAllSchemas();
  };

  const getSchemasByPlatform = (platform: Platform): ComponentSchema[] => {
    return unifiedRegistry.getSchemasByPlatform(platform);
  };

  // === РЕНДЕРЕРЫ ПЛАТФОРМ ===
  
  const registerAdapter = (adapter: RenderPlatform): void => {
    adapters.set(adapter.id, adapter);
    logger.info(`Registered adapter "${adapter.id}"`, 'Engine', { adapterId: adapter.id, adapter });
  };

  const reinstallAdapter = (adapter: RenderPlatform): void => {
    // Удаляем старую версию
    adapters.delete(adapter.id);
    logger.info(`Removed old adapter "${adapter.id}"`, 'Engine', { adapterId: adapter.id });
    
    // Устанавливаем новую версию
    adapters.set(adapter.id, adapter);
    logger.info(`Reinstalled adapter "${adapter.id}"`, 'Engine', { adapterId: adapter.id, adapter });
  };

  const getAdapter = (adapterId: string): RenderPlatform | undefined => {
    return adapters.get(adapterId);
  };

  const getAllAdapters = (): RenderPlatform[] => {
    return Array.from(adapters.values());
  };

  // getAvailableAdapters удален - используйте getAllAdapters

  // === РЕНДЕРИНГ ===
  
  const renderWithAdapter = (spec: UserFace, adapterId: string): any => {
    try {
      const adapter = getAdapter(adapterId);
      if (!adapter) {
        logger.warn(`Adapter not found: ${adapterId}`, 'Engine', { adapterId, spec });
        return null;
      }
      
      if (!adapter.validateSpec(spec)) {
        logger.warn(`Invalid spec for adapter ${adapterId}`, 'Engine', { adapterId, spec });
        return null;
      }
      
      return adapter.render(spec);
      
    } catch (error) {
      logger.error(`Failed to render with adapter ${adapterId}`, 'Engine', error as Error, { adapterId, spec });
      return null;
    }
  };

  const renderWithAllAdapters = (spec: UserFace): Record<string, any> => {
    const results: Record<string, any> = {};
    
    for (const [adapterId, adapter] of Array.from(adapters.entries())) {
      try {
        if (adapter.validateSpec(spec)) {
          results[adapterId] = adapter.render(spec);
        } else {
          results[adapterId] = null;
        }
      } catch (error) {
        console.warn(`[UserEngine] Failed to render with adapter ${adapterId}:`, error);
        results[adapterId] = null;
      }
    }
    
    return results;
  };

  // === ЖИЗНЕННЫЙ ЦИКЛ ===
  
  const updateComponent = (name: string, component: any): ComponentSchema | null => {
    return unifiedRegistry.updateComponent(name, component);
  };

  const removeComponent = (name: string): boolean => {
    return unifiedRegistry.removeComponent(name);
  };

  const clearCache = (): void => {
    unifiedRegistry.clearCache();
  };

  const clear = (): void => {
    unifiedRegistry.clear();
    adapters.clear();
    console.log('[UserEngine] Engine cleared');
  };

  // === СТАТИСТИКА ===
  
  const getStats = (): any => {
    const registryStats = unifiedRegistry.getStats();
    return {
      ...registryStats,
      adapters: {
        total: adapters.size,
        available: Array.from(adapters.keys())
      }
    };
  };

  // === API ДЛЯ КОНВЕРТЕРА ===
  
  const exportSchema = (name: string): ComponentSchema | null => {
    return unifiedRegistry.exportSchema(name);
  };

  const exportAllSchemas = (): ComponentSchema[] => {
    return unifiedRegistry.exportAllSchemas();
  };

  const validateMigration = (sourceSchema: ComponentSchema, targetPlatform: Platform): any => {
    return unifiedRegistry.validateMigration(sourceSchema, targetPlatform);
  };

  return {
    // Основные методы
    registerComponent,
    registerComponents,
    registerComponentWithSchema,
    getComponent,
    getSchema,
    getAllComponents,
    getAllComponentNames,
    getAllSchemas,
    getSchemasByPlatform,
    
    // Адаптеры
    registerAdapter,
    reinstallAdapter,
    getAdapter,
    getAllAdapters,
    
    // Рендеринг
    renderWithAdapter,
    renderWithAllAdapters,
    
    // Жизненный цикл
    updateComponent,
    removeComponent,
    clearCache,
    clear,
    
    // Статистика
    getStats,
    
    // API для конвертера
    exportSchema,
    exportAllSchemas,
    validateMigration
  };
};

export const engine = createEngine(); 