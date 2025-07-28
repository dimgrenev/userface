#!/usr/bin/env tsx

import { Project, InterfaceDeclaration, PropertySignature } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

interface ComponentType {
  name: string;
  props: Record<string, {
    type: string;
    required: boolean;
    description?: string;
  }>;
}

class TypeGenerator {
  private project: Project;
  private componentsDir: string;
  private outputFile: string;

  constructor(componentsDir: string, outputFile: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(process.cwd(), 'tsconfig.json'),
    });
    this.componentsDir = componentsDir;
    this.outputFile = outputFile;
  }

  // Сканирование компонентов
  scanComponents(): string[] {
    const pattern = path.join(this.componentsDir, '**/*.tsx');
    return glob.sync(pattern, { ignore: ['**/node_modules/**'] });
  }

  // Анализ компонента
  analyzeComponent(filePath: string): ComponentType | null {
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

    const props: Record<string, { type: string; required: boolean; description?: string }> = {};

    // Анализируем свойства
    propsInterface.getProperties().forEach(prop => {
      const propName = prop.getName();
      const propType = prop.getType();
      const isRequired = !prop.hasQuestionToken();
      const typeString = this.getTypeString(propType);
      
      props[propName] = {
        type: typeString,
        required: isRequired
      };
    });

    return {
      name: componentName.toLowerCase(),
      props
    };
  }

  // Преобразование типа
  getTypeString(type: any): string {
    const typeText = type.getText();
    
    // Простые типы
    if (typeText.includes('string')) return 'string';
    if (typeText.includes('number')) return 'number';
    if (typeText.includes('boolean')) return 'boolean';
    if (typeText.includes('ReactNode') || typeText.includes('children')) return 'any';
    
    // Union типы
    if (typeText.includes('|')) {
      return typeText;
    }
    
    // Массивы
    if (typeText.includes('[]')) return 'any[]';
    
    // Объекты
    if (typeText.includes('{') || typeText.includes('Record')) return 'object';
    
    return 'any';
  }

  // Генерация TypeScript типов
  generateTypes(components: ComponentType[]): string {
    let typesContent = `// Auto-generated types from components
// Generated at: ${new Date().toISOString()}

import { UserFace } from '../core/types';

`;

    // Генерируем типы для каждого компонента
    components.forEach(component => {
      const interfaceName = `${component.name.charAt(0).toUpperCase() + component.name.slice(1)}Spec`;
      
      typesContent += `export interface ${interfaceName} extends Omit<UserFace, 'component'> {
  component: '${component.name}';
`;

      // Собираем события отдельно
      const events: string[] = [];
      const regularProps: string[] = [];

      // Добавляем пропсы
      Object.entries(component.props).forEach(([propName, propInfo]) => {
        if (propName === 'children') {
          regularProps.push(`  children?: any;`);
        } else if (propName.startsWith('on')) {
          // События идут в events
          const eventName = propName.charAt(2).toLowerCase() + propName.slice(3);
          events.push(`    ${eventName}?: (...args: any[]) => void;`);
        } else if (propName === 'className') {
          regularProps.push(`  meta?: {\n    className?: string;\n  };`);
        } else {
          const optional = propInfo.required ? '' : '?';
          regularProps.push(`  ${propName}${optional}: ${propInfo.type};`);
        }
      });

      // Добавляем обычные пропсы
      regularProps.forEach(prop => {
        typesContent += `${prop}\n`;
      });

      // Добавляем события если есть
      if (events.length > 0) {
        typesContent += `  events?: {\n`;
        events.forEach(event => {
          typesContent += `${event}\n`;
        });
        typesContent += `  };\n`;
      }

      typesContent += `}\n\n`;
    });

    // Генерируем union тип для всех компонентов
    const componentNames = components.map(c => `'${c.name}'`);
    typesContent += `export type ComponentName = ${componentNames.join(' | ')};\n\n`;

    // Генерируем union тип для всех спецификаций
    const specNames = components.map(c => `${c.name.charAt(0).toUpperCase() + c.name.slice(1)}Spec`);
    typesContent += `export type ComponentSpec = ${specNames.join(' | ')};\n\n`;

    // Генерируем helper функции
    typesContent += `// Helper functions for type-safe component creation
export function createSpec<T extends ComponentSpec>(spec: T): T {
  return spec;
}

export function isComponentSpec(spec: any): spec is ComponentSpec {
  return spec && typeof spec.component === 'string' && componentNames.includes(spec.component);
}

const componentNames = [${componentNames.join(', ')}] as const;
`;

    return typesContent;
  }

  // Сохранение типов
  saveTypes(content: string): void {
    const outputDir = path.dirname(this.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    fs.writeFileSync(this.outputFile, content);
    console.log(`✅ Generated types: ${this.outputFile}`);
  }

  // Основной метод
  generate(): void {
    console.log('🔍 Scanning components for types...');
    const componentFiles = this.scanComponents();
    
    console.log(`📁 Found ${componentFiles.length} component files`);
    
    const components: ComponentType[] = [];
    
    componentFiles.forEach(filePath => {
      try {
        const componentInfo = this.analyzeComponent(filePath);
        if (componentInfo) {
          components.push(componentInfo);
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error);
      }
    });
    
    if (components.length > 0) {
      const typesContent = this.generateTypes(components);
      this.saveTypes(typesContent);
      console.log(`🎉 Generated types for ${components.length} components`);
    } else {
      console.warn('⚠️ No components found to generate types for');
    }
  }
}

// CLI
if (require.main === module) {
  const args = process.argv.slice(2);
  const componentsDir = args[0] || './src/components';
  const outputFile = args[1] || './src/core/generated-types.ts';
  
  console.log(`🚀 Generating types from ${componentsDir} to ${outputFile}`);
  
  const generator = new TypeGenerator(componentsDir, outputFile);
  generator.generate();
}

export { TypeGenerator }; 