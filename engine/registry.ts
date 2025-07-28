import { ComponentSchema, ComponentRegistration } from './schema';
import { UserFace } from './types';
import { UserEngine } from './api';
import { logger } from './logger';
import { componentAnalyzer } from './analyzer';
import { AdapterManager } from './adapter-manager';
import { SystemInitializer } from './initializer';
import { SystemMonitor } from './monitor';
import { ComponentScanner } from './scanner';
import { validationEngine } from './validation';
import { errorRecovery } from './error-recovery';
import { dataLayer } from './data-layer';
import { initializePluginSystem } from './plugin-system';
import { testingInfrastructure } from '../testing-infrastructure';

// Главный класс Registry - ядро системы
export class Registry implements UserEngine {
  // Компоненты (без дублирования)
  private components = new Map<string, any>();
  
  // Кеш схем (встроенный)
  private schemas = new Map<string, ComponentSchema>();
  
  // Хеши для валидации
  private componentHashes = new Map<string, string>();
  
  // Модули
  private adapterManager: AdapterManager;
  private initializer: SystemInitializer;
  private monitor: SystemMonitor;
  private scanner: ComponentScanner;
  private validationEngine: typeof validationEngine;
  private errorRecovery: typeof errorRecovery;
  private dataLayer: typeof dataLayer;
  private pluginSystem: any;
  private testingInfrastructure: typeof testingInfrastructure;

  constructor() {
    this.adapterManager = new AdapterManager();
    this.initializer = new SystemInitializer();
    this.monitor = new SystemMonitor();
    this.scanner = new ComponentScanner();
    this.validationEngine = validationEngine;
    this.errorRecovery = errorRecovery;
    this.dataLayer = dataLayer;
    this.pluginSystem = initializePluginSystem(this);
    this.testingInfrastructure = testingInfrastructure;
    logger.info('Registry initialized', 'Registry');
  }

  // === РЕГИСТРАЦИЯ ===
  
  registerComponent(name: string, component: any): ComponentSchema {
    const startTime = Date.now();
    
    try {
      // Проверяем кеш схем
      let schema = this.schemas.get(name);
      
      if (!schema) {
        // Анализируем компонент
        schema = this.analyzeComponent(component, name);
        if (schema) {
          this.schemas.set(name, schema);
        }
      }
      
      // Сохраняем компонент (только один раз!)
      this.components.set(name, component);
      
      // Отслеживаем метрики
      this.monitor.trackRegistration(name, Date.now() - startTime);
      
      logger.info(`Registered component "${name}"`, 'Registry', { name, schema });
      
      return schema || this.createFallbackSchema(name);
      
    } catch (error) {
      this.monitor.trackError(error as Error, { name });
      logger.error(`Failed to register component "${name}"`, 'Registry', error as Error, { name });
      
      const fallbackSchema = this.createFallbackSchema(name);
      this.components.set(name, component);
      this.schemas.set(name, fallbackSchema);
      return fallbackSchema;
    }
  }

  // === ПОЛУЧЕНИЕ ДАННЫХ ===
  
  getComponent(name: string): any | undefined {
    return this.components.get(name);
  }

  getSchema(name: string): ComponentSchema | undefined {
    return this.schemas.get(name);
  }

  getAllComponents(): Record<string, any> {
    return Object.fromEntries(this.components);
  }

  getAllSchemas(): ComponentSchema[] {
    return Array.from(this.schemas.values());
  }

  getAllComponentNames(): string[] {
    return Array.from(this.components.keys());
  }

  getSchemasByPlatform(platform: string): ComponentSchema[] {
    return Array.from(this.schemas.values()).filter(schema => schema.platform === platform);
  }

  hasComponent(name: string): boolean {
    return this.components.has(name);
  }

  hasSchema(name: string): boolean {
    return this.schemas.has(name);
  }

  // === МАССОВАЯ РЕГИСТРАЦИЯ ===
  
  registerComponents(components: Record<string, any>): ComponentSchema[] {
    const schemas: ComponentSchema[] = [];
    
    Object.entries(components).forEach(([name, component]) => {
      const schema = this.registerComponent(name, component);
      schemas.push(schema);
    });
    
    return schemas;
  }

  registerComponentWithSchema(registration: ComponentRegistration): void {
    const { name, component, schema } = registration;
    
    this.components.set(name, component);
    if (schema) {
      this.schemas.set(name, schema);
    }
    
          logger.info(`Registered component with schema "${name}"`, 'Registry', { name });
  }

  // === ОБНОВЛЕНИЕ И УДАЛЕНИЕ ===
  
  updateComponent(name: string, component: any): ComponentSchema | null {
    if (!this.components.has(name)) {
      logger.warn(`Cannot update non-existent component "${name}"`, 'Registry', { name });
      return null;
    }
    
    // Обновляем компонент
    this.components.set(name, component);
    
    // Переанализируем схему
    const schema = this.analyzeComponent(component, name);
    this.schemas.set(name, schema);
    
          logger.info(`Updated component "${name}"`, 'Registry', { name, schema });
    
    return schema;
  }

  removeComponent(name: string): boolean {
    const hadComponent = this.components.has(name);
    const hadSchema = this.schemas.has(name);
    
    this.components.delete(name);
    this.schemas.delete(name);
    this.componentHashes.delete(name);
    
    if (hadComponent || hadSchema) {
      logger.info(`Removed component "${name}"`, 'Registry', { name });
    }
    
    return hadComponent || hadSchema;
  }

  // === ОЧИСТКА ===
  
  clear(): void {
    const componentCount = this.components.size;
    const schemaCount = this.schemas.size;
    
    this.components.clear();
    this.schemas.clear();
    this.componentHashes.clear();
    
    logger.info(`Cleared registry`, 'Registry', { 
      removedComponents: componentCount, 
      removedSchemas: schemaCount 
    });
  }

  clearCache(): void {
    const schemaCount = this.schemas.size;
    this.schemas.clear();
    this.componentHashes.clear();
    
    logger.info(`Cleared cache`, 'Registry', { removedSchemas: schemaCount });
  }

  // === АДАПТЕРЫ (делегируем в AdapterManager) ===
  
  registerAdapter(adapter: any): void {
    this.adapterManager.registerAdapter(adapter);
  }

  reinstallAdapter(adapter: any): void {
    this.adapterManager.reinstallAdapter(adapter);
  }

  getAdapter(adapterId: string): any {
    return this.adapterManager.getAdapter(adapterId);
  }

  getAllAdapters(): any[] {
    return this.adapterManager.getAllAdapters();
  }

  renderWithAdapter(spec: any, adapterId: string): any {
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

  // === ИНИЦИАЛИЗАЦИЯ (делегируем в SystemInitializer) ===
  
  initialize(): void {
    this.initializer.initialize();
  }

  initializeWithAdapters(adapters: any[]): void {
    this.initializer.initializeWithAdapters(adapters);
  }

  isSystemInitialized(): boolean {
    return this.initializer.isSystemInitialized();
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

  // === ДОПОЛНИТЕЛЬНЫЕ МЕТОДЫ ===
  
  renderWithAllAdapters(spec: any): Record<string, any> {
    return this.adapterManager.renderWithAllAdapters(spec);
  }

  getStats(): any {
    return {
      components: this.getAllComponentNames().length,
      schemas: this.getAllSchemas().length,
      adapters: this.getAllAdapters().length,
      system: this.monitor.getStats(),
      performance: this.monitor.getPerformanceMetrics()
    };
  }

  exportSchema(name: string): ComponentSchema | null {
    const schema = this.getSchema(name);
    return schema || null;
  }

  exportAllSchemas(): ComponentSchema[] {
    return this.getAllSchemas();
  }

  validateMigration(sourceSchema: any, targetPlatform: string): any {
    // Используем логику из SchemaCache
    const issues: string[] = [];
    let compatibility = 100;
    
    // Проверяем совместимость платформ
    if (sourceSchema.platform === targetPlatform) {
      return { canMigrate: true, issues: [], compatibility: 100 };
    }
    
    // Простая валидация - в реальной реализации будет более сложная логика
    logger.info(`Migration validation for ${sourceSchema.name} to ${targetPlatform}`, 'Registry', {
      canMigrate: true,
      compatibility: 100,
      issuesCount: 0
    });
    
    return { canMigrate: true, issues, compatibility };
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private analyzeComponent(component: any, name: string): ComponentSchema {
    // Используем универсальный анализатор
    return componentAnalyzer.analyzeComponent(component, name);
  }

  private createFallbackSchema(name: string): ComponentSchema {
    return {
      name,
      platform: 'unknown',
      props: [],
      events: [],
      children: false,
      description: `Fallback schema for ${name}`
    };
  }

  // === ПЛАГИН СИСТЕМА ===
  
  async registerPlugin(plugin: any, config?: any): Promise<void> {
    return this.pluginSystem.registerPlugin(plugin, config);
  }

  async uninstallPlugin(pluginId: string): Promise<void> {
    return this.pluginSystem.uninstallPlugin(pluginId);
  }

  async enablePlugin(pluginId: string): Promise<void> {
    return this.pluginSystem.enablePlugin(pluginId);
  }

  async disablePlugin(pluginId: string): Promise<void> {
    return this.pluginSystem.disablePlugin(pluginId);
  }

  getPlugin(pluginId: string): any {
    return this.pluginSystem.getPlugin(pluginId);
  }

  getAllPlugins(): any[] {
    return this.pluginSystem.getPluginsByType('custom');
  }

  getActivePlugins(): any[] {
    return this.pluginSystem.getPluginsByType('custom').filter((p: any) => p.status === 'enabled');
  }

  // === ТЕСТИРОВАНИЕ ===
  
  addTestSuite(suite: any): void {
    this.testingInfrastructure.addTestSuite(suite);
  }

  async runAllTests(): Promise<any[]> {
    return this.testingInfrastructure.runAllTests();
  }

  getTestResults(): any[] {
    return this.testingInfrastructure.getTestResults();
  }

  createMockComponent(name: string, schema: any, render: (props: any) => any): any {
    this.testingInfrastructure.mockComponent(name, schema, render);
    return { name, schema, render };
  }

  generateTestData(schema: any): UserFace {
    return this.testingInfrastructure.generateRandomUserFace(schema);
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

  clearAllData(): void {
    this.dataLayer.clearAllData();
  }

  getDataStats(): any {
    return this.dataLayer.getStats();
  }

  // === РЕНДЕРИНГ ===
  
  async render(userFace: UserFace, adapterId: string): Promise<any> {
    try {
      // Валидация
      const schema = this.getSchema(userFace.component);
      if (schema) {
        const validation = this.validationEngine.validateUserFace(userFace, schema);
        if (!validation.isValid) {
          throw new Error(`Validation failed: ${validation.errors.map((e: any) => e.message).join(', ')}`);
        }
      }

      // Рендеринг с данными
      const result = await this.renderWithData(userFace, adapterId);
      
      return result;
    } catch (error) {
      // Простая обработка ошибки
      console.error('Render error:', error);
      throw error;
    }
  }

  async renderWithData(spec: UserFace, adapterId: string): Promise<any> {
    // Обрабатываем data свойства в UserFace
    if (spec.data) {
      for (const [key, dataConfig] of Object.entries(spec.data)) {
        const data = await this.dataLayer.getData(dataConfig.source, dataConfig.config);
        spec[key] = data;
      }
    }
    
    return this.renderWithAdapter(spec, adapterId);
  }
}

// Экспортируем единственный экземпляр
export const unifiedRegistry = new Registry(); 