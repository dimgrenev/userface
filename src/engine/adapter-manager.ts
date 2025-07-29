import { RenderPlatform } from './api';
import { logger } from './logger';

// Менеджер адаптеров рендереров
export class AdapterManager {
  // Адаптеры рендереров
  private adapters = new Map<string, RenderPlatform>();
  
  // Статистика адаптеров
  private stats = {
    totalAdapters: 0,
    activeAdapters: 0,
    errors: 0
  };

  // === РЕГИСТРАЦИЯ АДАПТЕРОВ ===
  
  registerAdapter(adapter: RenderPlatform): void {
    try {
      if (!adapter || !adapter.id) {
        throw new Error('Invalid adapter: missing id');
      }
      
      this.adapters.set(adapter.id, adapter);
      this.stats.totalAdapters = this.adapters.size;
      this.stats.activeAdapters++;
      
      logger.info(`Registered adapter: ${adapter.id}`, 'AdapterManager', { 
        id: adapter.id, 
        platform: adapter.meta?.platform 
      });
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to register adapter`, 'AdapterManager', error as Error, { adapter });
    }
  }

  reinstallAdapter(adapter: RenderPlatform): void {
    try {
      if (!adapter || !adapter.id) {
        throw new Error('Invalid adapter: missing id');
      }
      
      const existing = this.adapters.get(adapter.id);
      if (existing) {
        logger.info(`Reinstalling adapter: ${adapter.id}`, 'AdapterManager', { id: adapter.id });
      }
      
      this.adapters.set(adapter.id, adapter);
      
      logger.info(`Reinstalled adapter: ${adapter.id}`, 'AdapterManager', { id: adapter.id });
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to reinstall adapter`, 'AdapterManager', error as Error, { adapter });
    }
  }

  // === ПОЛУЧЕНИЕ АДАПТЕРОВ ===
  
  getAdapter(adapterId: string): RenderPlatform | undefined {
    const adapter = this.adapters.get(adapterId);
    
    if (adapter) {
      logger.debug(`Retrieved adapter: ${adapterId}`, 'AdapterManager');
    } else {
      logger.debug(`Adapter not found: ${adapterId}`, 'AdapterManager');
    }
    
    return adapter;
  }

  getAllAdapters(): RenderPlatform[] {
    const adapters = Array.from(this.adapters.values());
    logger.debug(`Retrieved all adapters: ${adapters.length}`, 'AdapterManager');
    return adapters;
  }

  getAdaptersByPlatform(targetPlatform: string): RenderPlatform[] {
    const adapters = Array.from(this.adapters.values()).filter(
      adapter => adapter.meta?.platform === targetPlatform
    );
    logger.debug(`Retrieved adapters for platform ${targetPlatform}: ${adapters.length}`, 'AdapterManager');
    return adapters;
  }

  hasAdapter(adapterId: string): boolean {
    return this.adapters.has(adapterId);
  }

  // === РЕНДЕРИНГ ===
  
  renderWithAdapter(spec: any, adapterId: string): any {
    try {
      const adapter = this.getAdapter(adapterId);
      if (!adapter) {
        throw new Error(`Adapter not found: ${adapterId}`);
      }
      
      if (!adapter.render) {
        throw new Error(`Adapter ${adapterId} has no render method`);
      }
      
      logger.info(`Rendering with adapter: ${adapterId}`, 'AdapterManager', { adapterId });
      
      const result = adapter.render(spec);
      
      logger.info(`Rendered successfully with adapter: ${adapterId}`, 'AdapterManager', { adapterId });
      
      return result;
      
    } catch (error) {
      this.stats.errors++;
      logger.error(`Failed to render with adapter: ${adapterId}`, 'AdapterManager', error as Error, { adapterId });
      throw error;
    }
  }

  renderWithAllAdapters(spec: any): Record<string, any> {
    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};
    
    logger.info(`Rendering with all adapters: ${this.adapters.size}`, 'AdapterManager');
    
    for (const [adapterId, adapter] of this.adapters) {
      try {
        if (adapter.render) {
          results[adapterId] = adapter.render(spec);
          logger.debug(`Rendered with adapter: ${adapterId}`, 'AdapterManager');
        } else {
          errors[adapterId] = 'No render method';
          logger.warn(`Adapter ${adapterId} has no render method`, 'AdapterManager');
        }
      } catch (error) {
        errors[adapterId] = (error as Error).message;
        this.stats.errors++;
        logger.error(`Failed to render with adapter: ${adapterId}`, 'AdapterManager', error as Error);
      }
    }
    
    logger.info(`Rendered with all adapters: ${Object.keys(results).length} success, ${Object.keys(errors).length} errors`, 'AdapterManager', {
      successCount: Object.keys(results).length,
      errorCount: Object.keys(errors).length
    });
    
    return results;
  }

  // === ВАЛИДАЦИЯ ===
  
  validateAdapter(adapter: RenderPlatform): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];
    
    // Проверяем обязательные поля
    if (!adapter.id) {
      issues.push('Missing adapter id');
    }
    
    if (!adapter.render) {
      issues.push('Missing render method');
    }
    
    if (!adapter.meta) {
      issues.push('Missing meta information');
    }
    
    if (!adapter.meta?.platform) {
      issues.push('Missing platform in meta');
    }
    
    const isValid = issues.length === 0;
    
    logger.debug(`Validated adapter: ${adapter.id}`, 'AdapterManager', { 
      isValid, 
      issuesCount: issues.length 
    });
    
    return { isValid, issues };
  }

  // === УДАЛЕНИЕ ===
  
  removeAdapter(adapterId: string): boolean {
    const hadAdapter = this.adapters.has(adapterId);
    
    if (hadAdapter) {
      this.adapters.delete(adapterId);
      this.stats.totalAdapters = this.adapters.size;
      this.stats.activeAdapters--;
      
      logger.info(`Removed adapter: ${adapterId}`, 'AdapterManager', { id: adapterId });
    }
    
    return hadAdapter;
  }

  clearAdapters(): void {
    const adapterCount = this.adapters.size;
    
    this.adapters.clear();
    this.stats.totalAdapters = 0;
    this.stats.activeAdapters = 0;
    
    logger.info(`Cleared all adapters: ${adapterCount} removed`, 'AdapterManager', { 
      removedCount: adapterCount 
    });
  }

  // === СТАТИСТИКА ===
  
  getStats() {
    return {
      ...this.stats,
      adapters: Array.from(this.adapters.keys()),
      platforms: Array.from(this.adapters.values()).map(a => a.meta?.platform).filter(Boolean)
    };
  }
} 