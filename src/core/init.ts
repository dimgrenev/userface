// Инициализация движка
import { unifiedRegistry } from './registry';
import { renderReact } from './render-react';
import { renderVue } from './render-vue';
import { renderAngular } from './render-angular';
import { renderSvelte } from './render-svelte';
import { renderVanilla } from './render-vanilla';
import { findUserfaceFolder } from './find-userface-folder';
import { autoRegisterAllComponents } from './find-components-recursively';
import { logger } from './logger';

// Инициализация
function initializeUserface() {
  // Инициализируем реестр
  unifiedRegistry.initialize();

  // Регистрируем адаптеры
  const adapters = [
    { adapter: renderReact, name: 'React' },
    { adapter: renderVue, name: 'Vue' },
    { adapter: renderAngular, name: 'Angular' },
    { adapter: renderSvelte, name: 'Svelte' },
    { adapter: renderVanilla, name: 'Vanilla JS' }
  ];

  adapters.forEach(({ adapter, name }) => {
    try {
      const existingAdapter = unifiedRegistry.getAdapter(adapter.id);
      
      if (existingAdapter) {
        unifiedRegistry.reinstallAdapter(adapter);
        logger.info(`${name} renderer reinstalled`, 'Init');
      } else {
        unifiedRegistry.registerAdapter(adapter);
        logger.info(`${name} renderer registered`, 'Init');
      }
    } catch (error) {
      logger.error(`${name} renderer registration failed`, 'Init', error as Error);
    }
  });

  // Авторегистрация компонентов
  try {
    const result = findUserfaceFolder();
    
    if (result.found) {
      const success = autoRegisterAllComponents(result.path!, unifiedRegistry);
      
      if (success) {
        logger.info('Components auto-registered', 'Init');
      } else {
        logger.info('No components found', 'Init');
      }
    } else {
      logger.info('No userface folder found', 'Init');
    }
  } catch (error) {
    logger.warn('Auto-registration not available', 'Init', { error });
  }

  logger.info('Userface initialization completed', 'Init');
}

initializeUserface();

export { unifiedRegistry as engine, renderReact, renderVue, renderAngular, renderSvelte, renderVanilla }; 