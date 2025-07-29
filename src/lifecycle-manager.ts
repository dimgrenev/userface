import { ILifecycleHooks, LifecycleCallback, ErrorCallback, LifecycleEvent } from './interfaces';
import { eventBus } from './event-bus';

export class LifecycleManager implements ILifecycleHooks {
  private hooks: Map<LifecycleEvent, LifecycleCallback[]> = new Map();
  private errorCallbacks: ErrorCallback[] = [];

  onBeforeRegister(callback: LifecycleCallback): void {
    this.addHook('beforeRegister', callback);
  }

  onAfterRegister(callback: LifecycleCallback): void {
    this.addHook('afterRegister', callback);
  }

  onBeforeRender(callback: LifecycleCallback): void {
    this.addHook('beforeRender', callback);
  }

  onAfterRender(callback: LifecycleCallback): void {
    this.addHook('afterRender', callback);
  }

  onError(callback: ErrorCallback): void {
    this.errorCallbacks.push(callback);
  }

  async executeLifecycle(event: LifecycleEvent, context: any): Promise<void> {
    // Выполняем хуки жизненного цикла
    const callbacks = this.hooks.get(event) || [];
    
    for (const callback of callbacks) {
      try {
        await callback(context);
      } catch (error) {
        console.error(`Error in lifecycle hook ${event}:`, error);
        await this.handleError(error as Error, context);
      }
    }

    // Эмитим событие
    eventBus.emit(`lifecycle:${event}`, context);
  }

  async handleError(error: Error, context: any): Promise<void> {
    // Выполняем error callbacks
    for (const callback of this.errorCallbacks) {
      try {
        await callback(error, context);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    }

    // Эмитим событие ошибки
    eventBus.emit('lifecycle:error', { error, context });
  }

  private addHook(event: LifecycleEvent, callback: LifecycleCallback): void {
    if (!this.hooks.has(event)) {
      this.hooks.set(event, []);
    }
    this.hooks.get(event)!.push(callback);
  }

  getHookCount(event: LifecycleEvent): number {
    return this.hooks.get(event)?.length || 0;
  }

  clearHooks(event?: LifecycleEvent): void {
    if (event) {
      this.hooks.delete(event);
    } else {
      this.hooks.clear();
    }
  }

  clearErrorCallbacks(): void {
    this.errorCallbacks = [];
  }
}

export const lifecycleManager = new LifecycleManager(); 