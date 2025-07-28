#!/usr/bin/env tsx

import { Project, SyntaxKind, InterfaceDeclaration, PropertySignature, TypeReferenceNode, UnionTypeNode, LiteralTypeNode } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface SpecData {
  component: string;
  id?: string;
  children?: any;
  meta?: {
    className?: string;
    visible?: boolean;
    [key: string]: any;
  };
  events?: {
    [key: string]: (...args: any[]) => void;
  };
  [key: string]: any;
}

interface ComponentInfo {
  name: string;
  props: Record<string, {
    type: string;
    required: boolean;
    defaultValue?: any;
  }>;
  events: string[];
}

class SpecGenerator {
  private project: Project;
  private componentsDir: string;
  private specsDir: string;

  constructor(componentsDir: string, specsDir: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    });
    this.componentsDir = componentsDir;
    this.specsDir = specsDir;
  }

  // Сканирование всех компонентов
  scanComponents(): string[] {
    const pattern = path.join(this.componentsDir, '**/*.tsx');
    return glob.sync(pattern, { ignore: ['**/node_modules/**'] });
  }

  // Анализ компонента и извлечение информации о пропсах
  analyzeComponent(filePath: string): ComponentInfo | null {
    const sourceFile = this.project.addSourceFileAtPath(filePath);
    const componentName = path.basename(filePath, '.tsx');
    
    // Ищем интерфейс пропсов
    const propsInterface = sourceFile.getInterface(`${componentName}Props`) || 
                          sourceFile.getInterface('Props') ||
                          sourceFile.getInterfaces().find(i => i.getName()?.includes('Props'));

    if (!propsInterface) {
      console.warn(`No props interface found in ${filePath}`);
      return null;
    }

    const props: Record<string, { type: string; required: boolean; defaultValue?: any }> = {};
    const events: string[] = [];

    // Анализируем свойства интерфейса
    propsInterface.getProperties().forEach(prop => {
      const propName = prop.getName();
      const propType = prop.getType();
      const isRequired = !prop.hasQuestionToken();
      
      // Определяем тип
      let typeString = this.getTypeString(propType);
      
      // Проверяем на события (onClick, onChange и т.д.)
      if (propName.startsWith('on') && propName.length > 2) {
        const eventName = propName.charAt(2).toLowerCase() + propName.slice(3);
        events.push(eventName);
        typeString = 'function';
      }

      props[propName] = {
        type: typeString,
        required: isRequired
      };
    });

    return {
      name: componentName.toLowerCase(),
      props,
      events
    };
  }

  // Преобразование TypeScript типа в строку
  getTypeString(type: any): string {
    const typeText = type.getText();
    
    // Простые типы
    if (typeText.includes('string')) return 'string';
    if (typeText.includes('number')) return 'number';
    if (typeText.includes('boolean')) return 'boolean';
    if (typeText.includes('ReactNode') || typeText.includes('children')) return 'any';
    
    // Union типы (например, 'primary' | 'secondary')
    if (typeText.includes('|')) {
      const unionTypes = typeText.split('|').map(t => t.trim().replace(/['"]/g, ''));
      return unionTypes.join(' | ');
    }
    
    // Массивы
    if (typeText.includes('[]')) return 'array';
    
    // Объекты
    if (typeText.includes('{') || typeText.includes('Record')) return 'object';
    
    return 'any';
  }

  // Генерация .spec.json файла
  generateSpec(componentInfo: ComponentInfo): SpecData {
    const spec: SpecData = {
      component: componentInfo.name
    };

    // Добавляем пропсы
    Object.entries(componentInfo.props).forEach(([propName, propInfo]) => {
      if (propName === 'children') {
        spec.children = 'Sample content';
      } else if (propName.startsWith('on')) {
        // События добавляем в events
        if (!spec.events) spec.events = {};
        const eventName = propName.charAt(2).toLowerCase() + propName.slice(3);
        spec.events[eventName] = () => console.log(`${eventName} event`);
      } else if (propName === 'className') {
        // className идет в meta
        if (!spec.meta) spec.meta = {};
        spec.meta.className = 'sample-class';
      } else if (propName === 'style') {
        spec.style = { margin: '8px' };
      } else {
        // Остальные пропсы добавляем напрямую
        if (propInfo.type === 'boolean') {
          spec[propName] = false;
        } else if (propInfo.type.includes('|')) {
          // Берем первый вариант из union
          const firstOption = propInfo.type.split('|')[0].trim();
          spec[propName] = firstOption.replace(/['"]/g, '');
        } else if (propInfo.type === 'string') {
          spec[propName] = 'sample';
        } else if (propInfo.type === 'number') {
          spec[propName] = 0;
        } else {
          spec[propName] = null;
        }
      }
    });

    return spec;
  }

  // Сохранение .spec.json файла
  saveSpec(componentName: string, spec: SpecData): void {
    const specPath = path.join(this.specsDir, `${componentName}.spec.json`);
    
    // Создаем директорию если не существует
    const specDir = path.dirname(specPath);
    if (!fs.existsSync(specDir)) {
      fs.mkdirSync(specDir, { recursive: true });
    }

    const specContent = JSON.stringify(spec, null, 2);
    fs.writeFileSync(specPath, specContent);
    console.log(`✅ Generated: ${specPath}`);
  }

  // Основной метод генерации
  generate(): void {
    console.log('🔍 Scanning components...');
    const componentFiles = this.scanComponents();
    
    console.log(`📁 Found ${componentFiles.length} component files`);
    
    componentFiles.forEach(filePath => {
      try {
        const componentInfo = this.analyzeComponent(filePath);
        if (componentInfo) {
          const spec = this.generateSpec(componentInfo);
          this.saveSpec(componentInfo.name, spec);
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
      }
    });
    
    console.log('🎉 Spec generation completed!');
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const componentsDir = args[0] || './src/components';
  const specsDir = args[1] || './specs';
  
  console.log(`🚀 Generating specs from ${componentsDir} to ${specsDir}`);
  
  const generator = new SpecGenerator(componentsDir, specsDir);
  generator.generate();
}

export { SpecGenerator }; 