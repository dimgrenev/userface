// Поиск папки userface в проекте
import { logger } from './logger';

// Интерфейс для результата поиска
export interface UserfaceFolderResult {
  found: boolean;
  path?: string;
  componentsPath?: string;
  error?: string;
}

// Поиск папки userface в проекте
export function findUserfaceFolder(): UserfaceFolderResult {
  try {
    // Получаем корень проекта (где package.json)
    const projectRoot = findProjectRoot();
    if (!projectRoot) {
      return {
        found: false,
        error: 'Project root not found (no package.json)'
      };
    }

    // Рекурсивный поиск папки userface по всему проекту
    const userfacePath = findUserfaceRecursively(projectRoot);
    
    if (userfacePath) {
      const componentsPath = `${userfacePath}/components`;
      
      if (isDirectory(componentsPath)) {
        logger.info(`Found userface folder: ${userfacePath}`, 'FindUserface');
        return {
          found: true,
          path: userfacePath,
          componentsPath
        };
      } else {
        return {
          found: false,
          error: 'Userface folder found but no components subfolder'
        };
      }
    }

    return {
      found: false,
      error: 'Userface folder not found in project'
    };

  } catch (error) {
    logger.error('Error finding userface folder', 'FindUserface', error as Error);
    return {
      found: false,
      error: `Search failed: ${error}`
    };
  }
}

// Поиск корня проекта (папка с package.json)
function findProjectRoot(): string | null {
  try {
    // В браузере это не работает, возвращаем null
    if (typeof window !== 'undefined') {
      return null;
    }

    // В Node.js ищем package.json
    const fs = require('fs');
    const path = require('path');
    
    let currentDir = process.cwd();
    const maxDepth = 10; // Максимальная глубина поиска
    
    for (let depth = 0; depth < maxDepth; depth++) {
      const packageJsonPath = path.join(currentDir, 'package.json');
      
      if (fs.existsSync(packageJsonPath)) {
        return currentDir;
      }
      
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        break; // Достигли корня файловой системы
      }
      
      currentDir = parentDir;
    }
    
    return null;
  } catch (error) {
    logger.error('Error finding project root', 'FindUserface', error as Error);
    return null;
  }
}

// Рекурсивный поиск папки userface
function findUserfaceRecursively(dir: string, depth: number = 0): string | null {
  try {
    if (typeof window !== 'undefined') {
      return null; // В браузере не можем искать
    }
    
    const fs = require('fs');
    const path = require('path');
    
    // Максимальная глубина поиска
    if (depth > 5) {
      return null;
    }
    
    // Проверяем текущую папку
    const userfacePath = path.join(dir, 'userface');
    if (isDirectory(userfacePath)) {
      return userfacePath;
    }
    
    // Рекурсивно ищем в подпапках
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const itemPath = path.join(dir, item);
      
      // Пропускаем node_modules и другие системные папки
      if (item === 'node_modules' || item === '.git' || item === 'dist' || item === 'build') {
        continue;
      }
      
      if (isDirectory(itemPath)) {
        const found = findUserfaceRecursively(itemPath, depth + 1);
        if (found) {
          return found;
        }
      }
    }
    
    return null;
  } catch (error) {
    logger.error('Error in recursive search', 'FindUserface', error as Error);
    return null;
  }
}

// Проверка существования директории
function isDirectory(path: string): boolean {
  try {
    if (typeof window !== 'undefined') {
      return false; // В браузере не можем проверить
    }
    
    const fs = require('fs');
    const stats = fs.statSync(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

// Автоматическая регистрация компонентов из найденной папки
export function autoRegisterFromUserfaceFolder(): boolean {
  const result = findUserfaceFolder();
  
  if (!result.found) {
    logger.warn('Userface folder not found - manual registration required', 'FindUserface', { error: result.error });
    return false;
  }
  
  try {
    // Динамический импорт компонентов из найденной папки
    const componentsPath = result.componentsPath!;
    const indexPath = `${componentsPath}/index`;
    
    // Пытаемся импортировать index.ts/js
    const possibleExtensions = ['ts', 'js', 'tsx', 'jsx'];
    
    for (const ext of possibleExtensions) {
      try {
        const module = require(`${indexPath}.${ext}`);
        if (module && typeof module === 'object') {
          logger.info(`Auto-registering components from: ${indexPath}.${ext}`, 'FindUserface');
          
          // Импортируем autoRegisterComponents
          const { autoRegisterComponents } = require('../auto-register-components');
          autoRegisterComponents(module);
          
          return true;
        }
      } catch (importError) {
        // Продолжаем с следующим расширением
        continue;
      }
    }
    
    logger.warn('No valid index file found in userface/components/', 'FindUserface');
    return false;
    
  } catch (error) {
    logger.error('Failed to auto-register from userface folder', 'FindUserface', error as Error);
    return false;
  }
} 