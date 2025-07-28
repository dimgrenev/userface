import { FoundComponent } from './types';
import { logger } from './logger';

// Сканер компонентов
export class ComponentScanner {
  // === СКАНИРОВАНИЕ ПАПОК ===
  
  findUserfaceFolder(): { found: boolean; path?: string; error?: string } {
    try {
      const projectRoot = this.findProjectRoot();
      if (!projectRoot) {
        return { found: false, error: 'Project root not found' };
      }
      
      const userfacePath = this.findUserfaceRecursively(projectRoot);
      if (userfacePath) {
        logger.info(`Found userface folder: ${userfacePath}`, 'ComponentScanner');
        return { found: true, path: userfacePath };
      }
      
      return { found: false, error: 'Userface folder not found' };
      
    } catch (error) {
      logger.error('Error finding userface folder', 'ComponentScanner', error as Error);
      return { found: false, error: (error as Error).message };
    }
  }

  scanUserfaceFolder(userfacePath: string): FoundComponent[] {
    const foundComponents: FoundComponent[] = [];
    
    try {
      this.scanComponentsRecursively(userfacePath, foundComponents);
      logger.info(`Scanned userface folder: ${foundComponents.length} components found`, 'ComponentScanner', { 
        path: userfacePath, 
        count: foundComponents.length 
      });
    } catch (error) {
      logger.error('Error scanning userface folder', 'ComponentScanner', error as Error, { path: userfacePath });
    }
    
    return foundComponents;
  }

  // === АВТОРЕГИСТРАЦИЯ ===
  
  autoRegisterComponents(componentModule: any, prefix: string = ''): void {
    if (!componentModule || typeof componentModule !== 'object') {
      logger.warn('Invalid component module for auto-registration', 'ComponentScanner');
      return;
    }
    
    Object.entries(componentModule).forEach(([name, component]) => {
      if (typeof component === 'function' || typeof component === 'object') {
        const fullName = prefix ? `${prefix}.${name}` : name;
        this.autoRegisterComponent(component, fullName);
      }
    });
  }

  autoRegisterComponent(component: any, componentName: string): void {
    try {
      if (typeof component === 'function' || typeof component === 'object') {
        logger.info(`Auto-registering component: ${componentName}`, 'ComponentScanner', { name: componentName });
        // В реальной реализации здесь будет вызов registry.registerComponent()
        // Пока что просто логируем, так как нет доступа к registry из scanner
      }
    } catch (error) {
      logger.error(`Failed to auto-register component: ${componentName}`, 'ComponentScanner', error as Error, { name: componentName });
    }
  }

  // === ПРИВАТНЫЕ МЕТОДЫ ===
  
  private findProjectRoot(): string | null {
    try {
      let currentDir = process.cwd();
      let depth = 0;
      const maxDepth = 10;
      
      while (depth < maxDepth) {
        // Проверяем наличие package.json
        const fs = require('fs');
        const path = require('path');
        
        if (fs.existsSync(path.join(currentDir, 'package.json'))) {
          return currentDir;
        }
        
        const parentDir = path.dirname(currentDir);
        if (parentDir === currentDir) {
          break; // Достигли корня файловой системы
        }
        
        currentDir = parentDir;
        depth++;
      }
      
      return null;
    } catch (error) {
      logger.error('Error finding project root', 'ComponentScanner', error as Error);
      return null;
    }
  }

  private findUserfaceRecursively(dir: string, depth: number = 0): string | null {
    try {
      if (depth > 5) return null; // Ограничиваем глубину поиска
      
      const fs = require('fs');
      const path = require('path');
      
      // Проверяем текущую директорию
      const userfacePath = path.join(dir, 'userface');
      if (fs.existsSync(userfacePath) && fs.statSync(userfacePath).isDirectory()) {
        return userfacePath;
      }
      
      // Рекурсивно ищем в поддиректориях
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          const found = this.findUserfaceRecursively(itemPath, depth + 1);
          if (found) return found;
        }
      }
      
      return null;
    } catch (error) {
      logger.error('Error in recursive search', 'ComponentScanner', error as Error, { dir, depth });
      return null;
    }
  }

  private scanComponentsRecursively(dir: string, foundComponents: FoundComponent[], depth: number = 0): void {
    try {
      if (depth > 5) return; // Ограничиваем глубину
      
      const fs = require('fs');
      const path = require('path');
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          if (!this.shouldSkipDirectory(item)) {
            this.scanComponentsRecursively(itemPath, foundComponents, depth + 1);
          }
        } else if (this.isComponentFile(item)) {
          const component = this.tryLoadComponent(itemPath);
          if (component) {
            foundComponents.push(component);
          }
        }
      }
    } catch (error) {
      logger.error('Error scanning components recursively', 'ComponentScanner', error as Error, { dir, depth });
    }
  }

  private shouldSkipDirectory(dirName: string): boolean {
    const skipDirs = ['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.nyc_output'];
    return skipDirs.includes(dirName) || dirName.startsWith('.');
  }

  private isComponentFile(fileName: string): boolean {
    const componentExtensions = ['.tsx', '.ts', '.jsx', '.js'];
    const componentPatterns = [/\.component\./, /\.widget\./, /\.ui\./];
    
    const hasExtension = componentExtensions.some(ext => fileName.endsWith(ext));
    const matchesPattern = componentPatterns.some(pattern => pattern.test(fileName));
    
    return hasExtension && (matchesPattern || !fileName.includes('.test.') && !fileName.includes('.spec.'));
  }

  private tryLoadComponent(filePath: string): FoundComponent | null {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      
      if (!this.hasExports(content)) {
        return null;
      }
      
      const componentName = this.extractComponentName(filePath, content);
      if (!componentName) {
        return null;
      }
      
      // В реальной реализации здесь будет require/import
      const module = {}; // Заглушка
      
      return {
        path: filePath,
        name: componentName,
        module
      };
      
    } catch (error) {
      logger.error(`Failed to load component from: ${filePath}`, 'ComponentScanner', error as Error);
      return null;
    }
  }

  private hasExports(content: string): boolean {
    return content.includes('export') || content.includes('module.exports');
  }

  private extractComponentName(fileName: string, content: string): string {
    // Извлекаем имя из имени файла
    const baseName = fileName.replace(/\.[^/.]+$/, '');
    
    // Ищем экспорты в коде
    const exportMatch = content.match(/export\s+(?:default\s+)?(?:function|class|const)\s+(\w+)/);
    if (exportMatch) {
      return exportMatch[1];
    }
    
    // Ищем module.exports
    const moduleMatch = content.match(/module\.exports\s*=\s*(\w+)/);
    if (moduleMatch) {
      return moduleMatch[1];
    }
    
    // Возвращаем имя файла как fallback
    return baseName;
  }
} 