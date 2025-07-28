// Упрощенный поиск компонентов
import { logger } from './logger';

export interface FoundComponent {
  path: string;
  name: string;
  module: any;
}

export interface ComponentSearchResult {
  found: boolean;
  components: FoundComponent[];
  error?: string;
}

// Основная функция поиска
export function findComponentsRecursively(userfacePath: string): ComponentSearchResult {
  if (typeof window !== 'undefined') {
    return { found: false, components: [], error: 'Browser environment not supported' };
  }

  try {
    const fs = require('fs');

    if (!fs.existsSync(userfacePath)) {
      return { found: false, components: [], error: 'Userface folder not found' };
    }

    const foundComponents: FoundComponent[] = [];
    searchComponentsRecursively(userfacePath, foundComponents);

    logger.info(`Found ${foundComponents.length} components`, 'FindComponents', { userfacePath, count: foundComponents.length });

    return {
      found: foundComponents.length > 0,
      components: foundComponents
    };

  } catch (error) {
    logger.error('Error searching components', 'FindComponents', error as Error);
    return { found: false, components: [], error: `Search failed: ${error}` };
  }
}

// Рекурсивный поиск
function searchComponentsRecursively(dir: string, foundComponents: FoundComponent[], depth: number = 0): void {
  if (typeof window !== 'undefined' || depth > 5) return;
  
  try {
    const fs = require('fs');
    const path = require('path');

    const items = fs.readdirSync(dir);

    for (const item of items) {
      const itemPath = path.join(dir, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory() && !shouldSkipDirectory(item)) {
        searchComponentsRecursively(itemPath, foundComponents, depth + 1);
      } else if (stats.isFile() && isComponentFile(item)) {
        const component = tryLoadComponent(itemPath);
        if (component) {
          foundComponents.push(component);
        }
      }
    }
  } catch (error) {
    logger.debug(`Error searching in directory: ${dir}`, 'FindComponents', error as Error);
  }
}

// Утилиты
function shouldSkipDirectory(dirName: string): boolean {
  const skipDirs = ['.git', 'node_modules', 'dist', 'build', '.next', '.nuxt', '.cache', 'coverage'];
  return skipDirs.includes(dirName) || dirName.startsWith('.');
}

function isComponentFile(fileName: string): boolean {
  const componentExtensions = ['.tsx', '.ts', '.jsx', '.js'];
  const componentPatterns = [/component/i, /\.spec\./, /\.test\./, /\.stories\./];
  
  const hasComponentExt = componentExtensions.some(ext => fileName.endsWith(ext));
  const isComponentFile = componentPatterns.some(pattern => pattern.test(fileName));
  
  return hasComponentExt && !isComponentFile;
}

function tryLoadComponent(filePath: string): FoundComponent | null {
  try {
    if (typeof window !== 'undefined') return null;

    const fs = require('fs');
    const path = require('path');

    const content = fs.readFileSync(filePath, 'utf8');
    if (!hasExports(content)) return null;

    const module = require(filePath);
    if (!module || typeof module !== 'object') return null;

    const fileName = path.basename(filePath, path.extname(filePath));
    const componentName = extractComponentName(fileName, content);

    return { path: filePath, name: componentName, module };

  } catch (error) {
    logger.debug(`Failed to load component: ${filePath}`, 'FindComponents', error as Error);
    return null;
  }
}

function hasExports(content: string): boolean {
  return /export\s+(default|{|const|function|class)/.test(content);
}

function extractComponentName(fileName: string, content: string): string {
  const defaultExportMatch = content.match(/export\s+default\s+(\w+)/);
  if (defaultExportMatch) return defaultExportMatch[1];

  const namedExportMatch = content.match(/export\s+(?:const|function|class)\s+(\w+)/);
  if (namedExportMatch) return namedExportMatch[1];

  return fileName;
}

// Авторегистрация всех компонентов
export function autoRegisterAllComponents(userfacePath: string, registry: any): boolean {
  const result = findComponentsRecursively(userfacePath);
  
  if (!result.found) {
    logger.warn('No components found', 'FindComponents', { error: result.error });
    return false;
  }

  try {
    let registeredCount = 0;

    for (const component of result.components) {
      try {
        registry.autoRegisterComponents(component.module, component.name);
        registeredCount++;
      } catch (error) {
        logger.warn(`Failed to register: ${component.name}`, 'FindComponents', error as Error);
      }
    }

    logger.info(`Auto-registered ${registeredCount} components`, 'FindComponents', {
      total: result.components.length,
      registered: registeredCount
    });

    return registeredCount > 0;

  } catch (error) {
    logger.error('Auto-registration failed', 'FindComponents', error as Error);
    return false;
  }
} 