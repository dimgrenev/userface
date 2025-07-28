import { logger } from '../logger';

// Мониторинг системы
export class SystemMonitor {
  // Общая статистика
  private stats = {
    totalComponents: 0,
    totalSchemas: 0,
    totalAdapters: 0,
    errors: 0,
    warnings: 0,
    startTime: new Date(),
    lastActivity: new Date()
  };
  
  // Метрики производительности
  private performance = {
    registrationTime: 0,
    analysisTime: 0,
    renderTime: 0,
    cacheHits: 0,
    cacheMisses: 0
  };
  
  // События
  private events: Array<{
    type: string;
    message: string;
    timestamp: Date;
    data?: any;
  }> = [];

  // === ОСНОВНЫЕ МЕТРИКИ ===
  
  trackRegistration(componentName: string, duration: number): void {
    this.stats.totalComponents++;
    this.performance.registrationTime += duration;
    this.stats.lastActivity = new Date();
    
    this.addEvent('registration', `Component registered: ${componentName}`, { 
      name: componentName, 
      duration 
    });
    
    logger.debug(`Tracked registration: ${componentName}`, 'SystemMonitor', { duration });
  }

  trackAnalysis(componentName: string, duration: number): void {
    this.performance.analysisTime += duration;
    this.stats.lastActivity = new Date();
    
    this.addEvent('analysis', `Component analyzed: ${componentName}`, { 
      name: componentName, 
      duration 
    });
    
    logger.debug(`Tracked analysis: ${componentName}`, 'SystemMonitor', { duration });
  }

  trackRender(adapterId: string, duration: number): void {
    this.performance.renderTime += duration;
    this.stats.lastActivity = new Date();
    
    this.addEvent('render', `Rendered with adapter: ${adapterId}`, { 
      adapterId, 
      duration 
    });
    
    logger.debug(`Tracked render: ${adapterId}`, 'SystemMonitor', { duration });
  }

  trackCacheHit(schemaName: string): void {
    this.performance.cacheHits++;
    this.stats.lastActivity = new Date();
    
    logger.debug(`Tracked cache hit: ${schemaName}`, 'SystemMonitor');
  }

  trackCacheMiss(schemaName: string): void {
    this.performance.cacheMisses++;
    this.stats.lastActivity = new Date();
    
    logger.debug(`Tracked cache miss: ${schemaName}`, 'SystemMonitor');
  }

  trackError(error: Error, context?: any): void {
    this.stats.errors++;
    this.stats.lastActivity = new Date();
    
    this.addEvent('error', error.message, { 
      error: error.stack, 
      context 
    });
    
    logger.error('Tracked error', 'SystemMonitor', error, context);
  }

  trackWarning(message: string, context?: any): void {
    this.stats.warnings++;
    this.stats.lastActivity = new Date();
    
    this.addEvent('warning', message, { context });
    
    logger.warn('Tracked warning', 'SystemMonitor', { message, context });
  }

  // === СТАТИСТИКА ===
  
  getStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const cacheHitRate = this.performance.cacheHits / (this.performance.cacheHits + this.performance.cacheMisses) || 0;
    
    return {
      ...this.stats,
      uptime,
      performance: {
        ...this.performance,
        cacheHitRate,
        avgRegistrationTime: this.stats.totalComponents > 0 ? this.performance.registrationTime / this.stats.totalComponents : 0,
        avgAnalysisTime: this.stats.totalComponents > 0 ? this.performance.analysisTime / this.stats.totalComponents : 0,
        avgRenderTime: this.stats.totalAdapters > 0 ? this.performance.renderTime / this.stats.totalAdapters : 0
      },
      eventsCount: this.events.length
    };
  }

  getPerformanceMetrics() {
    return {
      ...this.performance,
      cacheHitRate: this.performance.cacheHits / (this.performance.cacheHits + this.performance.cacheMisses) || 0,
      avgRegistrationTime: this.stats.totalComponents > 0 ? this.performance.registrationTime / this.stats.totalComponents : 0,
      avgAnalysisTime: this.stats.totalComponents > 0 ? this.performance.analysisTime / this.stats.totalComponents : 0,
      avgRenderTime: this.stats.totalAdapters > 0 ? this.performance.renderTime / this.stats.totalAdapters : 0
    };
  }

  getRecentEvents(limit: number = 10): Array<{
    type: string;
    message: string;
    timestamp: Date;
    data?: any;
  }> {
    return this.events
      .slice(-limit)
      .reverse()
      .map(event => ({
        type: event.type,
        message: event.message,
        timestamp: event.timestamp,
        data: event.data
      }));
  }

  getEventsByType(type: string): Array<{
    type: string;
    message: string;
    timestamp: Date;
    data?: any;
  }> {
    return this.events
      .filter(event => event.type === type)
      .map(event => ({
        type: event.type,
        message: event.message,
        timestamp: event.timestamp,
        data: event.data
      }));
  }

  // === ЗДОРОВЬЕ СИСТЕМЫ ===
  
  getSystemHealth(): {
    status: 'healthy' | 'warning' | 'critical';
    issues: string[];
    score: number;
  } {
    const issues: string[] = [];
    let score = 100;
    
    // Проверяем количество ошибок
    if (this.stats.errors > 10) {
      issues.push(`High error count: ${this.stats.errors}`);
      score -= 20;
    }
    
    // Проверяем производительность
    const avgRegistrationTime = this.stats.totalComponents > 0 ? this.performance.registrationTime / this.stats.totalComponents : 0;
    if (avgRegistrationTime > 1000) {
      issues.push(`Slow registration: ${avgRegistrationTime.toFixed(2)}ms average`);
      score -= 15;
    }
    
    const avgAnalysisTime = this.stats.totalComponents > 0 ? this.performance.analysisTime / this.stats.totalComponents : 0;
    if (avgAnalysisTime > 500) {
      issues.push(`Slow analysis: ${avgAnalysisTime.toFixed(2)}ms average`);
      score -= 15;
    }
    
    // Проверяем кеш
    const cacheHitRate = this.performance.cacheHits / (this.performance.cacheHits + this.performance.cacheMisses) || 0;
    if (cacheHitRate < 0.5) {
      issues.push(`Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`);
      score -= 10;
    }
    
    // Определяем статус
    let status: 'healthy' | 'warning' | 'critical';
    if (score >= 80) {
      status = 'healthy';
    } else if (score >= 50) {
      status = 'warning';
    } else {
      status = 'critical';
    }
    
    logger.info('System health check', 'SystemMonitor', { 
      status, 
      score, 
      issuesCount: issues.length 
    });
    
    return { status, issues, score };
  }

  // === ОЧИСТКА ===
  
  clearEvents(): void {
    const eventCount = this.events.length;
    this.events = [];
    
    logger.info(`Cleared events: ${eventCount} removed`, 'SystemMonitor', { 
      removedCount: eventCount 
    });
  }

  resetStats(): void {
    this.stats = {
      totalComponents: 0,
      totalSchemas: 0,
      totalAdapters: 0,
      errors: 0,
      warnings: 0,
      startTime: new Date(),
      lastActivity: new Date()
    };
    
    this.performance = {
      registrationTime: 0,
      analysisTime: 0,
      renderTime: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    logger.info('Reset system statistics', 'SystemMonitor');
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private addEvent(type: string, message: string, data?: any): void {
    this.events.push({
      type,
      message,
      timestamp: new Date(),
      data
    });
    
    // Ограничиваем количество событий
    if (this.events.length > 1000) {
      this.events = this.events.slice(-500);
    }
  }
} 