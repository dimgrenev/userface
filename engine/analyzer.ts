import { Schema } from './schema';
import { Type } from './types';
import { Project, SourceFile, Node, SyntaxKind, TypeReferenceNode, InterfaceDeclaration, PropertySignature, MethodSignature, FunctionDeclaration, VariableStatement, VariableDeclaration, ArrowFunction, CallExpression, Identifier, PropertyAccessExpression, ScriptTarget, ModuleKind, ModuleResolutionKind } from 'ts-morph';
import { JsxEmit } from 'typescript';

console.log('[AST-DEBUG] analyzer.ts loaded');

export class ComponentAnalyzer {
  private project: Project;

  constructor() {
    console.log('[AST-DEBUG] ComponentAnalyzer constructed');
    this.project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.ESNext,
        moduleResolution: ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        allowJs: true,
        jsx: JsxEmit.ReactJSX
      }
    });
  }

  analyzeComponent(component: any, name: string): Schema {
    console.log('[AST-DEBUG] analyzeComponent called', { name, component });
    
    try {
      // Если component содержит код как строку, анализируем его
      if (typeof component === 'object' && component.code) {
        return this.analyzeCodeString(component.code, name);
      }
      
      // Если component - это функция или объект, анализируем его структуру
      return this.analyzeComponentObject(component, name);
      
    } catch (error) {
      console.error('[AST-DEBUG] Error in analyzeComponent:', error);
      // Возвращаем fallback схему
      return {
        name,
        platform: 'universal',
        props: [],
        events: [],
        children: false,
        description: `Component ${name} (fallback)`
      };
    }
  }

  private analyzeCodeString(code: string, name: string): Schema {
    console.log('[AST-DEBUG] analyzeCodeString called', { name, codeLength: code.length });
    
    try {
      // Создаем временный файл для анализа
      const sourceFile = this.project.createSourceFile(`temp-${name}.tsx`, code);
      
      const props: any[] = [];
      const events: any[] = [];
      let platform = 'universal';
      let children = false;
      
      // Анализируем интерфейсы и типы
      this.extractInterfaces(sourceFile, props, events);
      
      // Анализируем функции и компоненты
      this.extractFunctions(sourceFile, props, events, name);
      
      // Определяем платформу
      platform = this.detectPlatform(sourceFile, code);
      
      // Проверяем поддержку children
      children = this.detectChildrenSupport(sourceFile, code);
      
      return {
        name,
        platform,
        props,
        events,
        children,
        description: `Component ${name} (analyzed from code)`
      };
      
    } catch (error) {
      console.error('[AST-DEBUG] Error in analyzeCodeString:', error);
      throw error;
    }
  }

  private analyzeComponentObject(component: any, name: string): Schema {
    console.log('[AST-DEBUG] analyzeComponentObject called', { name, componentType: typeof component });
    
    const props: any[] = [];
    const events: any[] = [];
    let platform = 'universal';
    
    // Простой анализ объекта компонента
    if (typeof component === 'function') {
      // Анализируем параметры функции
      const paramNames = this.getFunctionParameters(component);
      paramNames.forEach(paramName => {
        if (paramName.startsWith('on')) {
          events.push({
            name: paramName,
            parameters: [],
            description: `${paramName} event`
          });
        } else {
          props.push({
            name: paramName,
            type: 'text',
            required: false,
            description: `Prop: ${paramName}`
          });
        }
      });
      
      platform = this.detectPlatformFromComponent(component);
    }
    
    return {
      name,
      platform,
      props,
      events,
      children: true,
      description: `Component ${name} (object analysis)`
    };
  }

  private extractInterfaces(sourceFile: SourceFile, props: any[], events: any[]): void {
    const interfaces = sourceFile.getInterfaces();
    
    interfaces.forEach(interfaceDecl => {
      const properties = interfaceDecl.getProperties();
      
      properties.forEach(prop => {
        const propName = prop.getName();
        const propType = this.mapTypeScriptType(prop.getType().getText());
        const isRequired = !prop.hasQuestionToken();
        
        if (propName.startsWith('on')) {
          events.push({
            name: propName,
            parameters: [],
            description: `${propName} event`
          });
        } else {
          props.push({
            name: propName,
            type: propType,
            required: isRequired,
            description: `Interface prop: ${propName}`
          });
        }
      });
    });
  }

  private extractFunctions(sourceFile: SourceFile, props: any[], events: any[], componentName: string): void {
    const functions = sourceFile.getFunctions();
    const variables = sourceFile.getVariableStatements();
    
    // Анализируем функции
    functions.forEach(func => {
      if (func.getName() === componentName) {
        const parameters = func.getParameters();
        parameters.forEach(param => {
          const paramName = param.getName();
          const paramType = this.mapTypeScriptType(param.getType().getText());
          
          if (paramName.startsWith('on')) {
            events.push({
              name: paramName,
              parameters: [],
              description: `${paramName} event`
            });
          } else {
            props.push({
              name: paramName,
              type: paramType,
              required: !param.hasQuestionToken(),
              description: `Function prop: ${paramName}`
            });
          }
        });
      }
    });
    
    // Анализируем переменные (arrow functions)
    variables.forEach(variable => {
      const declarations = variable.getDeclarations();
      declarations.forEach(decl => {
        const initializer = decl.getInitializer();
        if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
          const arrowFunc = initializer as ArrowFunction;
          const parameters = arrowFunc.getParameters();
          parameters.forEach(param => {
            const paramName = param.getName();
            const paramType = this.mapTypeScriptType(param.getType().getText());
            
            if (paramName.startsWith('on')) {
              events.push({
                name: paramName,
                parameters: [],
                description: `${paramName} event`
              });
            } else {
              props.push({
                name: paramName,
                type: paramType,
                required: !param.hasQuestionToken(),
                description: `Arrow function prop: ${paramName}`
              });
            }
          });
        }
      });
    });
  }

  private detectPlatform(sourceFile: SourceFile, code: string): string {
    // Определяем платформу по импортам и коду
    const imports = sourceFile.getImportDeclarations();
    
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      if (moduleSpecifier.includes('react')) {
        return 'react';
      }
      if (moduleSpecifier.includes('vue')) {
        return 'vue';
      }
      if (moduleSpecifier.includes('angular')) {
        return 'angular';
      }
      if (moduleSpecifier.includes('svelte')) {
        return 'svelte';
      }
    }
    
    // Определяем по паттернам в коде
    if (code.includes('React.') || code.includes('useState') || code.includes('useEffect')) {
      return 'react';
    }
    if (code.includes('Vue.') || code.includes('defineComponent')) {
      return 'vue';
    }
    if (code.includes('@Component') || code.includes('@Input')) {
      return 'angular';
    }
    if (code.includes('$:') || code.includes('{#if}')) {
      return 'svelte';
    }
    
    return 'universal';
  }

  private detectPlatformFromComponent(component: any): string {
    // Определяем платформу по свойствам компонента
    if (component.$$typeof) {
      return 'react';
    }
    if (component.render && typeof component.render === 'function') {
      return 'vue';
    }
    if (component.selector || component.templateUrl) {
      return 'angular';
    }
    
    return 'universal';
  }

  private detectChildrenSupport(sourceFile: SourceFile, code: string): boolean {
    // Проверяем поддержку children
    if (code.includes('children') || code.includes('{children}')) {
      return true;
    }
    
    const interfaces = sourceFile.getInterfaces();
    for (const interfaceDecl of interfaces) {
      const properties = interfaceDecl.getProperties();
      for (const prop of properties) {
        if (prop.getName() === 'children') {
          return true;
        }
      }
    }
    
    return false;
  }

  private getFunctionParameters(func: Function): string[] {
    const funcStr = func.toString();
    const match = funcStr.match(/\(([^)]*)\)/);
    if (match && match[1]) {
      return match[1].split(',').map(param => param.trim().split('=')[0].trim());
    }
    return [];
  }

  private mapTypeScriptType(typeText: string): Type {
    const type = typeText.toLowerCase();
    
    if (type.includes('string') || type.includes('text')) {
      return 'text';
    }
    if (type.includes('number') || type.includes('int') || type.includes('float')) {
      return 'number';
    }
    if (type.includes('boolean') || type.includes('bool')) {
      return 'boolean';
    }
    if (type.includes('function') || type.includes('()')) {
      return 'function';
    }
    if (type.includes('array') || type.includes('[]')) {
      return 'array';
    }
    if (type.includes('object') || type.includes('{}')) {
      return 'object';
    }
    
    return 'text'; // default
  }
}

// Экспортируем синглтон
export const componentAnalyzer = new ComponentAnalyzer();
console.log('[AST-DEBUG] componentAnalyzer exported', componentAnalyzer); 