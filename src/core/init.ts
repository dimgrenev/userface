// Инициализация и автоматическая регистрация рендереров и компонентов
import { engine } from './engine';
import { renderReact } from './render-react';
import { renderVue } from './render-vue';
import { renderAngular } from './render-angular';
import { renderSvelte } from './render-svelte';
import { renderVanilla } from './render-vanilla';
import { autoRegisterComponents } from './auto-register-components';
import { logger } from './logger';
import { findUserfaceFolder } from './find-userface-folder';
import { autoRegisterAllComponents } from './find-components-recursively';

// Версионная инициализация
let lastInitializedVersion: string | null = null;

// Получаем версию из package.json
function getCurrentVersion(): string {
  try {
    if (typeof require !== 'undefined') {
      const packageJson = require('../../package.json');
      return packageJson.version;
    }
  } catch {
    // Fallback
  }
  return '1.0.7'; // Fallback версия
}

const CURRENT_VERSION = getCurrentVersion();

// Функция инициализации
function initializeUserface() {
  // Проверяем версию
  if (lastInitializedVersion === CURRENT_VERSION) {
    logger.warn('Userface already initialized with current version - skipping', 'Init');
    return;
  }
  
  // Если версия изменилась, логируем и очищаем кэш
  if (lastInitializedVersion && lastInitializedVersion !== CURRENT_VERSION) {
    logger.info(`Userface version updated: ${lastInitializedVersion} → ${CURRENT_VERSION}`, 'Init');
    
    // Очищаем кэш при обновлении
    try {
      engine.clearCache();
      logger.info('Cache cleared due to version update', 'Init');
    } catch (error) {
      logger.warn('Failed to clear cache during update', 'Init', error as Error);
    }
  }

  // === РЕГИСТРАЦИЯ АДАПТЕРОВ ===
  const adapters = [
    { adapter: renderReact, name: 'React' },
    { adapter: renderVue, name: 'Vue' },
    { adapter: renderAngular, name: 'Angular' },
    { adapter: renderSvelte, name: 'Svelte' },
    { adapter: renderVanilla, name: 'Vanilla JS' }
  ];

  adapters.forEach(({ adapter, name }) => {
    try {
      const existingAdapter = engine.getAdapter(adapter.id);
      
      if (existingAdapter) {
        engine.reinstallAdapter(adapter);
        logger.info(`${name} renderer reinstalled (updated)`, 'Init');
      } else {
        engine.registerAdapter(adapter);
        logger.info(`${name} renderer registered successfully`, 'Init');
      }
    } catch (error) {
      logger.error(`${name} renderer registration failed`, 'Init', error as Error);
    }
  });

  // === АВТОМАТИЧЕСКАЯ РЕГИСТРАЦИЯ КОМПОНЕНТОВ ===
  try {
    const result = findUserfaceFolder();
    
    if (result.found) {
      const success = autoRegisterAllComponents(result.path!);
      
      if (success) {
        logger.info('Components auto-registered from userface folder', 'Init');
      } else {
        logger.info('No components found in userface folder', 'Init');
      }
    } else {
      logger.info('No userface folder found - manual registration required', 'Init');
    }
  } catch (error) {
    logger.warn('Auto-registration not available', 'Init', { error });
  }

  lastInitializedVersion = CURRENT_VERSION;
  logger.info(`Userface initialization completed (version ${CURRENT_VERSION})`, 'Init');
}

initializeUserface();

export { engine, renderReact, renderVue, renderAngular, renderSvelte, renderVanilla, autoRegisterComponents }; 