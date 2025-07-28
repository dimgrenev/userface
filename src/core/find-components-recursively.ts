// Рекурсивный поиск компонентов по всей папке userface
import { logger } from './logger';
import { autoRegisterComponents } from './auto-register-components';

// Интерфейс для найденного компонента
export interface FoundComponent {
  path: string;
  name: string;
  module: any;
}

// Интерфейс для результата поиска
export interface ComponentSearchResult {
  found: boolean;
  components: FoundComponent[];
  error?: string;
}

// Рекурсивный поиск компонентов в папке userface
export function findComponentsRecursively(userfacePath: string): ComponentSearchResult {
  const foundComponents: FoundComponent[] = [];
  
  try {
    if (typeof window !== 'undefined') {
      return {
        found: false,
        components: [],
        error: 'Cannot search files in browser environment'
      };
    }

    const fs = require('fs');

    // Проверяем существование папки userface
    if (!fs.existsSync(userfacePath)) {
      return {
        found: false,
        components: [],
        error: 'Userface folder not found'
      };
    }

    // Рекурсивно ищем компоненты
    searchComponentsRecursively(userfacePath, foundComponents);

    logger.info(`Found ${foundComponents.length} components in userface folder`, 'FindComponents', {
      userfacePath,
      componentCount: foundComponents.length
    });

    return {
      found: foundComponents.length > 0,
      components: foundComponents
    };

  } catch (error) {
    logger.error('Error searching components recursively', 'FindComponents', error as Error);
    return {
      found: false,
      components: [],
      error: `Search failed: ${error}`
    };
  }
}

// Рекурсивный поиск компонентов в папке
function searchComponentsRecursively(dir: string, foundComponents: FoundComponent[], depth: number = 0): void {
  try {
    if (typeof window !== 'undefined') return;
    
    const fs = require('fs');
    const path = require('path');

    // Максимальная глубина поиска
    if (depth > 10) return;

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        // Пропускаем служебные папки
        if (shouldSkipDirectory(item)) {
          continue;
        }

        // Рекурсивно ищем в подпапках
        searchComponentsRecursively(itemPath, foundComponents, depth + 1);

      } else if (stats.isFile()) {
        // Проверяем файлы на компоненты
        if (isComponentFile(item)) {
          const component = tryLoadComponent(itemPath);
          if (component) {
            foundComponents.push(component);
          }
        }
      }
    }

  } catch (error) {
    logger.warn(`Error searching in directory: ${dir}`, 'FindComponents', error as Error);
  }
}

// Проверка, нужно ли пропустить папку
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = [
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    '.nuxt',
    'coverage',
    '.nyc_output',
    '.cache',
    'tmp',
    'temp'
  ];

  return skipDirs.includes(dirName);
}

// Проверка, является ли файл компонентом
function isComponentFile(fileName: string): boolean {
  const componentExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  const componentPatterns = [
    /\.component\./i,
    /\.page\./i,
    /\.widget\./i,
    /\.modal\./i,
    /\.form\./i,
    /\.layout\./i
  ];

  const extension = fileName.toLowerCase();
  
  // Проверяем расширение
  const hasValidExtension = componentExtensions.some(ext => extension.endsWith(ext));
  if (!hasValidExtension) return false;

  // Проверяем паттерны (опционально)
  const hasComponentPattern = componentPatterns.some(pattern => pattern.test(fileName));
  
  // Если есть паттерн - точно компонент
  if (hasComponentPattern) return true;

  // Если нет паттерна, но есть расширение - тоже может быть компонентом
  // (например, Button.tsx, HomePage.tsx)
  return true;
}

// Попытка загрузить компонент из файла
function tryLoadComponent(filePath: string): FoundComponent | null {
  try {
    if (typeof window !== 'undefined') return null;

    const fs = require('fs');
    const path = require('path');

    // Читаем содержимое файла
    const content = fs.readFileSync(filePath, 'utf8');

    // Простая проверка на наличие экспортов
    if (!hasExports(content)) {
      return null;
    }

    // Пытаемся загрузить модуль
    const module = require(filePath);
    if (!module || typeof module !== 'object') {
      return null;
    }

    // Извлекаем имя компонента из пути
    const fileName = path.basename(filePath, path.extname(filePath));
    const componentName = extractComponentName(fileName, content);

    return {
      path: filePath,
      name: componentName,
      module
    };

  } catch (error) {
    logger.debug(`Failed to load component from: ${filePath}`, 'FindComponents', error as Error);
    return null;
  }
}

// Проверка наличия экспортов в файле
function hasExports(content: string): boolean {
  const exportPatterns = [
    /export\s+(default|{)/,
    /export\s+(const|function|class)/,
    /export\s+default/
  ];

  return exportPatterns.some(pattern => pattern.test(content));
}

// Извлечение имени компонента
function extractComponentName(fileName: string, content: string): string {
  // Ищем экспорт по умолчанию
  const defaultExportMatch = content.match(/export\s+default\s+(\w+)/);
  if (defaultExportMatch) {
    return defaultExportMatch[1];
  }

  // Ищем именованные экспорты
  const namedExportMatch = content.match(/export\s+(?:const|function|class)\s+(\w+)/);
  if (namedExportMatch) {
    return namedExportMatch[1];
  }

  // Если не нашли - используем имя файла
  return fileName;
}

// Автоматическая регистрация всех найденных компонентов
export function autoRegisterAllComponents(userfacePath: string): boolean {
  const result = findComponentsRecursively(userfacePath);
  
  if (!result.found) {
    logger.warn('No components found in userface folder', 'FindComponents', { error: result.error });
    return false;
  }

  try {
    let registeredCount = 0;

    // Регистрируем каждый найденный компонент
    for (const component of result.components) {
      try {
        autoRegisterComponents(component.module, component.name);
        registeredCount++;
        logger.debug(`Registered component: ${component.name}`, 'FindComponents', { path: component.path });
      } catch (error) {
        logger.warn(`Failed to register component: ${component.name}`, 'FindComponents', error as Error);
      }
    }

    logger.info(`Auto-registered ${registeredCount} components from userface folder`, 'FindComponents', {
      totalFound: result.components.length,
      registered: registeredCount
    });

    return registeredCount > 0;

  } catch (error) {
    logger.error('Failed to auto-register components', 'FindComponents', error as Error);
    return false;
  }
} 