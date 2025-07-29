import { Schema, ComponentRegistration } from './schema';
import { Face } from './types';
import { UserEngine } from './api';
import { logger } from './logger';
import { componentAnalyzer } from './analyzer';
// Убираем неиспользуемые импорты
import { validationEngine } from './validation';
import { errorRecovery } from './error-recovery';
import { dataLayer } from './data-layer';
import { initializePluginSystem } from './plugin-system';
import { testingInfrastructure } from '../testing-infrastructure';

export class Registry implements UserEngine {
  // === ОСНОВНЫЕ КОМПОНЕНТЫ ===
  private components = new Map<string, any>();
  private schemas = new Map<string, Schema>();
  private adapters = new Map<string, any>();
  
  // Убираем дублирование
  
  // Хеши для валидации
  private componentHashes = new Map<string, string>();
  private schemaHashes = new Map<string, string>();
  
  // Статистика
  private stats = {
    totalComponents: 0,
    totalSchemas: 0,
    totalAdapters: 0,
    lastUpdate: Date.now()
  };

  // === ИНТЕГРАЦИЯ С ДРУГИМИ СЕРВИСАМИ ===
  private validationEngine: typeof validationEngine;
  private errorRecovery: typeof errorRecovery;
  private dataLayer: typeof dataLayer;
  private pluginSystem: any;
  private testingInfrastructure: typeof testingInfrastructure;

  constructor() {
    logger.info('Registry initialized', 'Registry');
    
    // Инициализируем сервисы
    this.validationEngine = validationEngine;
    this.errorRecovery = errorRecovery;
    this.dataLayer = dataLayer;
    this.pluginSystem = initializePluginSystem(this);
    this.testingInfrastructure = testingInfrastructure;
  }

  // === РЕГИСТРАЦИЯ ===
  
  registerComponent(name: string, component: any): Schema {
    const startTime = Date.now();
    
    try {
      // Анализируем компонент
      const schema = componentAnalyzer.analyzeComponent(component, name);
      
      // Сохраняем компонент и схему
      this.components.set(name, component);
      this.schemas.set(name, schema);
      
      // Обновляем статистику
      this.stats.totalComponents++;
      this.stats.lastUpdate = Date.now();
      
      // Вычисляем хеши
      this.componentHashes.set(name, this.computeHash(component));
      this.schemaHashes.set(name, this.computeHash(schema));
      
      logger.info(`Component registered: ${name}`, 'Registry', { 
        name, 
        schema: schema.name,
        duration: Date.now() - startTime 
      });
      
      return schema;
    } catch (error) {
      logger.error(`Failed to register component: ${name}`, 'Registry', { name, error });
      throw error;
    }
  }

  getComponent(name: string): any | undefined {
    return this.components.get(name);
  }

  getSchema(name: string): Schema | undefined {
    return this.schemas.get(name);
  }

  getAllComponents(): Record<string, any> {
    return Object.fromEntries(this.components);
  }

  getAllComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  getAllSchemas(): Schema[] {
    return Array.from(this.schemas.values());
  }

  getSchemasByPlatform(targetPlatform: string): Schema[] {
    return Array.from(this.schemas.values()).filter(schema => schema.detectedPlatform === targetPlatform);
  }

  // === РЕНДЕРЕРЫ ПЛАТФОРМ ===
  
  registerAdapter(adapter: any): void {
    const adapterId = adapter.id || `adapter-${this.adapters.size}`;
    this.adapters.set(adapterId, adapter);
    this.stats.totalAdapters++;
    logger.info(`Adapter registered: ${adapterId}`, 'Registry');
  }

  reinstallAdapter(adapter: any): void {
    const adapterId = adapter.id || `adapter-${this.adapters.size}`;
    this.adapters.set(adapterId, adapter);
    logger.info(`Adapter reinstalled: ${adapterId}`, 'Registry');
  }

  getAdapter(adapterId: string): any | undefined {
    return this.adapters.get(adapterId);
  }

  getAllAdapters(): any[] {
    return Array.from(this.adapters.values());
  }

  // === РЕНДЕРИНГ ===
  
  renderWithAdapter(spec: Face, adapterId: string): any {
    const adapter = this.getAdapter(adapterId);
    if (!adapter) {
      throw new Error(`Adapter not found: ${adapterId}`);
    }
    
    return adapter.render(spec);
  }

  renderWithAllAdapters(spec: Face): Record<string, any> {
    const results: Record<string, any> = {};
    
    for (const [adapterId, adapter] of this.adapters) {
      try {
        results[adapterId] = adapter.render(spec);
      } catch (error) {
        logger.error(`Render failed for adapter: ${adapterId}`, 'Registry', { adapterId, error });
        results[adapterId] = { error: error.message };
      }
    }
    
    return results;
  }

  // === ЖИЗНЕННЫЙ ЦИКЛ ===
  
  updateComponent(name: string, component: any): Schema | null {
    if (!this.components.has(name)) {
      logger.warn(`Cannot update non-existent component "${name}"`, 'Registry', { name });
      return null;
    }
    
    const oldSchema = this.schemas.get(name);
    const newSchema = componentAnalyzer.analyzeComponent(component, name);
    
    this.components.set(name, component);
    this.schemas.set(name, newSchema);
    
    logger.info(`Component updated: ${name}`, 'Registry', { name });
    return newSchema;
  }

  removeComponent(name: string): boolean {
    const removed = this.components.delete(name);
    if (removed) {
      this.schemas.delete(name);
      this.componentHashes.delete(name);
      this.schemaHashes.delete(name);
      this.stats.totalComponents--;
      logger.info(`Component removed: ${name}`, 'Registry', { name });
    }
    return removed;
  }

  clearCache(): void {
    this.componentHashes.clear();
    this.schemaHashes.clear();
    logger.info('Cache cleared', 'Registry');
  }

  clear(): void {
    const count = this.components.size;
    this.components.clear();
    this.schemas.clear();
    this.componentHashes.clear();
    this.schemaHashes.clear();
    this.stats.totalComponents = 0;
    this.stats.totalSchemas = 0;
    logger.info(`Registry cleared, removed ${count} components`, 'Registry');
  }

  // === СТАТИСТИКА ===
  
  getStats(): any {
    return {
      ...this.stats,
      adapters: this.adapters.size,
      hashes: {
        components: this.componentHashes.size,
        schemas: this.schemaHashes.size
      }
    };
  }

  // === API ДЛЯ КОНВЕРТЕРА ===
  
  exportSchema(name: string): Schema | null {
    const schema = this.schemas.get(name);
    if (!schema) {
      logger.warn(`Schema not found for export: ${name}`, 'Registry', { name });
      return null;
    }
    
    return { ...schema };
  }

  exportAllSchemas(): Schema[] {
    return Array.from(this.schemas.values()).map(schema => ({ ...schema }));
  }

  validateMigration(sourceSchema: Schema, targetPlatform: string): any {
    // Простая валидация миграции
    const targetAdapter = Array.from(this.adapters.values())
      .find(adapter => adapter.id === targetPlatform);
    
    if (!targetAdapter) {
      return { valid: false, error: `Target platform not found: ${targetPlatform}` };
    }
    
    return { valid: true, adapter: targetAdapter };
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

  // === ВАЛИДАЦИЯ ===
  
  validateComponent(name: string): boolean {
    const component = this.components.get(name);
    const schema = this.schemas.get(name);
    
    if (!component || !schema) {
      return false;
    }
    
    return this.validationEngine.validateComponent(component, schema).isValid;
  }

  validateUserFace(spec: Face): boolean {
    const schema = this.schemas.get(spec.component);
    if (!schema) {
      return false;
    }
    
    return this.validationEngine.validateUserFace(spec, schema).isValid;
  }

  // === ТЕСТИРОВАНИЕ ===
  
  async runAllTests(): Promise<any[]> {
    return this.testingInfrastructure.runAllTests();
  }

  createMockComponent(name: string, schema: Schema, render: (props: any) => any): any {
    return this.testingInfrastructure.createMockComponent(name, schema, render);
  }

  generateTestData(schema: any): Face {
    return this.testingInfrastructure.generateTestData(schema);
  }

  // === DATA LAYER ===
  
  async getData(path: string, options?: any): Promise<any> {
    return this.dataLayer.getData(path, options);
  }

  registerDataSource(path: string, config: any): void {
    this.dataLayer.registerDataSource(path, config);
  }

  subscribeToData(path: string, callback: (data: any, state: any) => void): any {
    return this.dataLayer.subscribe(path, callback);
  }

  getDataState(path: string): any {
    return this.dataLayer.getState(path);
  }

  // === РЕНДЕРИНГ С ДАННЫМИ ===
  
  async render(userFace: Face, adapterId: string): Promise<any> {
    try {
      // Валидация
      if (!this.validateUserFace(userFace)) {
        throw new Error(`Invalid UserFace: ${userFace.component}`);
      }
      
      // Рендеринг с данными
      return await this.renderWithData(userFace, adapterId);
    } catch (error) {
      logger.error(`Render failed: ${error.message}`, 'Registry', { userFace, adapterId, error });
      throw error;
    }
  }

  async renderWithData(spec: Face, adapterId: string): Promise<any> {
    // Обрабатываем data свойства в UserFace
    if (spec.data) {
      for (const [key, dataConfig] of Object.entries(spec.data)) {
        const data = await this.dataLayer.getData(dataConfig.source, dataConfig.config);
        spec[key] = data;
      }
    }
    
    // Рендерим через адаптер
    return this.renderWithAdapter(spec, adapterId);
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private computeHash(obj: any): string {
    return JSON.stringify(obj).split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0).toString();
  }

  private analyzeComponent(component: any, name: string): Schema {
    return componentAnalyzer.analyzeComponent(component, name);
  }

  private createFallbackSchema(name: string): Schema {
    return {
      name,
      detectedPlatform: 'universal',
      props: [],
      events: []
    };
  }
}

// Registry больше не экспортируется как unifiedRegistry
// Используйте Engine из engine-factory.ts 