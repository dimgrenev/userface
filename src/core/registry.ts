import { ComponentRegistry } from './component-registry';
import { ComponentScanner } from './scanner';
import { SchemaCache } from './schema-cache';
import { AdapterManager } from './adapter-manager';
import { SystemInitializer } from './initializer';
import { SystemMonitor } from './monitor';
import { UserEngine } from './api';
import { logger } from './logger';

// Фасад для всех модулей registry
export class Registry implements UserEngine {
  // Модули
  private componentRegistry: ComponentRegistry;
  private scanner: ComponentScanner;
  private cache: SchemaCache;
  private adapterManager: AdapterManager;
  private initializer: SystemInitializer;
  private monitor: SystemMonitor;

  constructor() {
    this.componentRegistry = new ComponentRegistry();
    this.scanner = new ComponentScanner();
    this.cache = new SchemaCache();
    this.adapterManager = new AdapterManager();
    this.initializer = new SystemInitializer();
    this.monitor = new SystemMonitor();
    
    logger.info('Registry facade initialized', 'Registry');
  }

  // === КОМПОНЕНТЫ (делегируем в ComponentRegistry) ===
  
  registerComponent(name: string, component: any) {
    const startTime = Date.now();
    
    try {
      const result = this.componentRegistry.registerComponent(name, component);
      this.monitor.trackRegistration(name, Date.now() - startTime);
      return result;
    } catch (error) {
      this.monitor.trackError(error as Error, { name });
      throw error;
    }
  }

  getComponent(name: string) {
    return this.componentRegistry.getComponent(name);
  }

  getAllComponents() {
    return this.componentRegistry.getAllComponents();
  }

  getAllComponentNames() {
    return this.componentRegistry.getAllComponentNames();
  }

  hasComponent(name: string) {
    return this.componentRegistry.hasComponent(name);
  }

  removeComponent(name: string) {
    return this.componentRegistry.removeComponent(name);
  }

  registerComponents(components: Record<string, any>) {
    return this.componentRegistry.registerComponents(components);
  }

  registerComponentWithSchema(registration: any) {
    return this.componentRegistry.registerComponentWithSchema(registration);
  }

  updateComponent(name: string, component: any) {
    return this.componentRegistry.updateComponent(name, component);
  }

  // === СХЕМЫ (делегируем в SchemaCache) ===
  
  getSchema(name: string) {
    const schema = this.cache.getSchema(name);
    if (schema) {
      this.monitor.trackCacheHit(name);
    } else {
      this.monitor.trackCacheMiss(name);
    }
    return schema;
  }

  getAllSchemas() {
    return this.cache.getAllSchemas();
  }

  getSchemasByPlatform(platform: string) {
    return this.cache.getSchemasByPlatform(platform);
  }

  hasSchema(name: string) {
    return this.cache.hasSchema(name);
  }

  exportSchema(name: string) {
    return this.cache.exportSchema(name);
  }

  exportAllSchemas() {
    return this.cache.exportAllSchemas();
  }

  validateMigration(sourceSchema: any, targetPlatform: string) {
    return this.cache.validateMigration(sourceSchema, targetPlatform);
  }

  // === АДАПТЕРЫ (делегируем в AdapterManager) ===
  
  registerAdapter(adapter: any) {
    return this.adapterManager.registerAdapter(adapter);
  }

  reinstallAdapter(adapter: any) {
    return this.adapterManager.reinstallAdapter(adapter);
  }

  getAdapter(adapterId: string) {
    return this.adapterManager.getAdapter(adapterId);
  }

  getAllAdapters() {
    return this.adapterManager.getAllAdapters();
  }

  renderWithAdapter(spec: any, adapterId: string) {
    const startTime = Date.now();
    
    try {
      const result = this.adapterManager.renderWithAdapter(spec, adapterId);
      this.monitor.trackRender(adapterId, Date.now() - startTime);
      return result;
    } catch (error) {
      this.monitor.trackError(error as Error, { adapterId });
      throw error;
    }
  }

  renderWithAllAdapters(spec: any) {
    return this.adapterManager.renderWithAllAdapters(spec);
  }

  // === СКАНИРОВАНИЕ (делегируем в ComponentScanner) ===
  
  findUserfaceFolder() {
    return this.scanner.findUserfaceFolder();
  }

  scanUserfaceFolder(userfacePath: string) {
    return this.scanner.scanUserfaceFolder(userfacePath);
  }

  autoRegisterComponents(componentModule: any, prefix: string = '') {
    return this.scanner.autoRegisterComponents(componentModule, prefix);
  }

  autoRegisterComponent(component: any, componentName: string) {
    return this.scanner.autoRegisterComponent(component, componentName);
  }

  // === ИНИЦИАЛИЗАЦИЯ (делегируем в SystemInitializer) ===
  
  initialize() {
    return this.initializer.initialize();
  }

  initializeWithAdapters(adapters: any[]) {
    return this.initializer.initializeWithAdapters(adapters);
  }

  isSystemInitialized() {
    return this.initializer.isSystemInitialized();
  }

  validateInitialization() {
    return this.initializer.validateInitialization();
  }

  // === МОНИТОРИНГ ===
  
  getStats() {
    return {
      components: this.componentRegistry.getAllComponentNames().length,
      schemas: this.cache.getAllSchemas().length,
      adapters: this.adapterManager.getAllAdapters().length,
      system: this.monitor.getStats(),
      cache: this.cache.getStats(),
      adapterStats: this.adapterManager.getStats(),
      initialization: this.initializer.getStats()
    };
  }

  getSystemHealth() {
    return this.monitor.getSystemHealth();
  }

  getPerformanceMetrics() {
    return this.monitor.getPerformanceMetrics();
  }

  getRecentEvents(limit: number = 10) {
    return this.monitor.getRecentEvents(limit);
  }

  // === ОЧИСТКА ===
  
  clear() {
    this.componentRegistry.clear();
    this.cache.clearCache();
    this.adapterManager.clearAdapters();
    this.monitor.clearEvents();
    
    logger.info('Registry cleared', 'Registry');
  }

  clearCache() {
    this.cache.clearCache();
    logger.info('Cache cleared', 'Registry');
  }

  reset() {
    this.initializer.reset();
    this.monitor.resetStats();
    logger.info('Registry reset', 'Registry');
  }
}

// Экспортируем единый экземпляр
export const unifiedRegistry = new Registry(); 