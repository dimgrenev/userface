// Автоматическая регистрация компонентов
import { engine } from './engine';
import { logger } from './logger';

// Интерфейс для компонентов
interface ComponentModule {
  [key: string]: any;
}

// Автоматическая регистрация компонентов из модуля
export function autoRegisterComponents(componentModule: ComponentModule, prefix: string = ''): void {
  try {
    Object.entries(componentModule).forEach(([name, component]) => {
      // Пропускаем не-компоненты
      if (typeof component !== 'function' || name.startsWith('_')) {
        return;
      }
      
      // Регистрируем компонент
      const componentName = prefix ? `${prefix}-${name.toLowerCase()}` : name.toLowerCase();
      engine.registerComponent(componentName, component);
      
      logger.info(`Auto-registered component: ${componentName}`, 'AutoRegister');
    });
    
    logger.info(`Auto-registration completed for ${Object.keys(componentModule).length} components`, 'AutoRegister');
  } catch (error) {
    logger.error('Auto-registration failed', 'AutoRegister', error as Error);
  }
}

// Удалено - эта функция не работает в контексте пользовательского проекта

// Регистрация компонента с конкретным именем
export function autoRegisterComponent(component: any, componentName: string): void {
  try {
    if (typeof component !== 'function') {
      logger.warn(`Skipping non-function component: ${componentName}`, 'AutoRegister');
      return;
    }
    
    engine.registerComponent(componentName.toLowerCase(), component);
    logger.info(`Auto-registered component: ${componentName}`, 'AutoRegister');
  } catch (error) {
    logger.error(`Failed to register component: ${componentName}`, 'AutoRegister', error as Error);
  }
} 