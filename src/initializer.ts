import { logger } from './logger';

// Инициализатор системы
export class SystemInitializer {
  // Версия последней инициализации
  private lastInitializedVersion: string | null = null;
  
  // Статус инициализации
  private isInitialized = false;
  
  // Статистика инициализации
  private stats = {
    initializations: 0,
    errors: 0,
    lastInitTime: null as Date | null
  };

  // === ИНИЦИАЛИЗАЦИЯ ===
  
  initialize(): void {
    try {
      const currentVersion = this.getCurrentVersion();
      
      if (this.isInitialized && this.lastInitializedVersion === currentVersion) {
        logger.info('System already initialized with current version', 'SystemInitializer', { version: currentVersion });
        return;
      }
      
      logger.info('Initializing system', 'SystemInitializer', { version: currentVersion });
      
      // Выполняем инициализацию
      this.performInitialization();
      
      this.lastInitializedVersion = currentVersion;
      this.isInitialized = true;
      this.stats.initializations++;
      this.stats.lastInitTime = new Date();
      
      logger.info('System initialized successfully', 'SystemInitializer', { 
        version: currentVersion,
        initCount: this.stats.initializations
      });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to initialize system', 'SystemInitializer', error as Error);
      throw error;
    }
  }

  initializeWithAdapters(adapters: any[]): void {
    try {
      logger.info('Initializing system with adapters', 'SystemInitializer', { adapterCount: adapters.length });
      
      // Сначала инициализируем систему
      this.initialize();
      
      // Затем регистрируем адаптеры
      if (adapters && Array.isArray(adapters)) {
        adapters.forEach((adapter, index) => {
          try {
            if (adapter && typeof adapter === 'object') {
              logger.info(`Registering adapter ${index + 1}/${adapters.length}`, 'SystemInitializer', { 
                adapterId: adapter.id || `adapter-${index}` 
              });
              // В реальной реализации здесь будет вызов adapterManager.registerAdapter()
            }
          } catch (error) {
            logger.error(`Failed to register adapter ${index + 1}`, 'SystemInitializer', error as Error, { adapter });
          }
        });
      }
      
      logger.info('System initialized with adapters successfully', 'SystemInitializer', { 
        adapterCount: adapters.length 
      });
      
    } catch (error) {
      this.stats.errors++;
      logger.error('Failed to initialize system with adapters', 'SystemInitializer', error as Error);
      throw error;
    }
  }

  // === ПРОВЕРКИ ===
  
  isSystemInitialized(): boolean {
    return this.isInitialized;
  }

  validateInitialization(): {
    isValid: boolean;
    issues: string[];
    version: string | null;
  } {
    const issues: string[] = [];
    const currentVersion = this.getCurrentVersion();
    
    if (!this.isInitialized) {
      issues.push('System not initialized');
    }
    
    if (this.lastInitializedVersion !== currentVersion) {
      issues.push('Version mismatch');
    }
    
    if (this.stats.errors > 0) {
      issues.push(`Initialization errors: ${this.stats.errors}`);
    }
    
    const isValid = issues.length === 0;
    
    logger.debug('Validated initialization', 'SystemInitializer', { 
      isValid, 
      issuesCount: issues.length,
      version: currentVersion
    });
    
    return { isValid, issues, version: currentVersion };
  }

  // === СБРОС ===
  
  reset(): void {
    logger.info('Resetting system initialization', 'SystemInitializer');
    
    this.lastInitializedVersion = null;
    this.isInitialized = false;
    
    logger.info('System initialization reset', 'SystemInitializer');
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private getCurrentVersion(): string {
    try {
      // В реальной реализации здесь будет логика определения версии
      // Например, из package.json или git commit hash
      const packageJson = require('../../package.json');
      return packageJson.version || '1.0.0';
    } catch (error) {
      logger.warn('Failed to get current version, using fallback', 'SystemInitializer', error as Error);
      return '1.0.0';
    }
  }

  private performInitialization(): void {
    // В реальной реализации здесь будут все необходимые шаги инициализации
    logger.debug('Performing system initialization steps', 'SystemInitializer');
    
    // 1. Проверка окружения
    this.validateEnvironment();
    
    // 2. Инициализация логгера
    this.initializeLogger();
    
    // 3. Проверка зависимостей
    this.validateDependencies();
    
    // 4. Инициализация кешей
    this.initializeCaches();
    
    logger.debug('System initialization steps completed', 'SystemInitializer');
  }

  private validateEnvironment(): void {
    logger.debug('Validating environment', 'SystemInitializer');
    
    // Проверяем Node.js версию
    const nodeVersion = process.version;
    const minNodeVersion = '16.0.0';
    
    if (this.compareVersions(nodeVersion, minNodeVersion) < 0) {
      throw new Error(`Node.js version ${minNodeVersion} or higher required, got ${nodeVersion}`);
    }
    
    // Проверяем доступность файловой системы
    const fs = require('fs');
    if (!fs || typeof fs.writeFileSync !== 'function') {
      throw new Error('File system not available');
    }
    
    logger.debug('Environment validation passed', 'SystemInitializer');
  }

  private initializeLogger(): void {
    logger.debug('Initializing logger', 'SystemInitializer');
    // Логгер уже инициализирован, просто логируем
  }

  private validateDependencies(): void {
    logger.debug('Validating dependencies', 'SystemInitializer');
    
    // Проверяем наличие необходимых модулей
    const requiredModules = ['fs', 'path'];
    
    for (const moduleName of requiredModules) {
      try {
        require(moduleName);
      } catch (error) {
        throw new Error(`Required module not available: ${moduleName}`);
      }
    }
    
    logger.debug('Dependencies validation passed', 'SystemInitializer');
  }

  private initializeCaches(): void {
    logger.debug('Initializing caches', 'SystemInitializer');
    // В реальной реализации здесь будет инициализация кешей
  }

  private compareVersions(version1: string, version2: string): number {
    const v1 = version1.replace(/^v/, '').split('.').map(Number);
    const v2 = version2.replace(/^v/, '').split('.').map(Number);
    
    for (let i = 0; i < Math.max(v1.length, v2.length); i++) {
      const num1 = v1[i] || 0;
      const num2 = v2[i] || 0;
      
      if (num1 > num2) return 1;
      if (num1 < num2) return -1;
    }
    
    return 0;
  }

  // === СТАТИСТИКА ===
  
  getStats() {
    return {
      ...this.stats,
      isInitialized: this.isInitialized,
      lastVersion: this.lastInitializedVersion,
      currentVersion: this.getCurrentVersion()
    };
  }
} 