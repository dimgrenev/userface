import { Project, SyntaxKind, TypeFormatFlags, ScriptTarget, ModuleKind, ModuleResolutionKind } from 'ts-morph';
import { JsxEmit } from 'typescript';
import { Schema } from './schema';
import { Type } from './types';

console.log('[AST-DEBUG] analyzer.ts loaded');

export class ComponentAnalyzer {
  private project: Project;

  constructor() {
    console.log('[AST-DEBUG] ComponentAnalyzer constructed');
    this.project = new Project({
      compilerOptions: {
        target: ScriptTarget.ES2020,
        module: ModuleKind.ESNext,
        moduleResolution: ModuleResolutionKind.NodeJs,
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        jsx: JsxEmit.ReactJSX,
        strict: true,
        skipLibCheck: true
      }
    });
  }

  analyzeComponent(component: any, name: string): Schema {
    console.log('[AST-DEBUG] analyzeComponent called', { name, component });
    
    try {
      if (typeof component === 'object' && component.code) {
        return this.analyzeCodeString(component.code, name);
      }
      return this.analyzeComponentObject(component, name);
    } catch (error) {
      console.error('[AST-DEBUG] Error in analyzeComponent:', error);
      return {
        name,
        detectedPlatform: 'universal',
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
      
      // Анализируем интерфейсы
      this.extractInterfaces(sourceFile, props, events);
      
      // Анализируем функции/компоненты
      this.extractFunctions(sourceFile, props, events, name);
      
      // Определяем платформу
      const platform = this.detectPlatform(sourceFile);
      
      // Проверяем поддержку children
      const children = this.detectChildrenSupport(sourceFile);
      
      // Дедуплицируем и объединяем пропсы
      const uniqueProps = this.deduplicateProps(props);
      
      return {
        name,
        detectedPlatform: platform,
        props: uniqueProps,
        events,
        children,
        description: `Component ${name} (analyzed from AST)`
      };
    } catch (error) {
      console.error('[AST-DEBUG] Error in analyzeCodeString:', error);
      throw error;
    }
  }

  private extractInterfaces(sourceFile: any, props: any[], events: any[]): void {
    const interfaces = sourceFile.getInterfaces();
    
    interfaces.forEach((interfaceDecl: any) => {
      const properties = interfaceDecl.getProperties();
      
      properties.forEach((property: any) => {
        const propName = property.getName();
        const propType = property.getType();
        const isOptional = property.hasQuestionToken();
        
        if (propName.startsWith('on')) {
          events.push({
            name: propName,
            parameters: [],
            description: `${propName} event`
          });
        } else {
          props.push({
            name: propName,
            type: this.mapTypeScriptType(propType),
            required: !isOptional,
            description: `Interface prop: ${propName}`
          });
        }
      });
    });
  }

  private extractFunctions(sourceFile: any, props: any[], events: any[], componentName: string): void {
    // Ищем функции с именем компонента
    const functions = sourceFile.getFunctions();
    const variables = sourceFile.getVariableStatements();
    
    // Анализируем функции
    functions.forEach((func: any) => {
      if (func.getName() === componentName) {
        this.analyzeFunctionParameters(func, props, events);
      }
    });
    
    // Анализируем переменные (const Component = ...)
    variables.forEach((varStmt: any) => {
      const declarations = varStmt.getDeclarations();
      declarations.forEach((decl: any) => {
        if (decl.getName() === componentName) {
          const initializer = decl.getInitializer();
          if (initializer && initializer.getKind() === SyntaxKind.ArrowFunction) {
            this.analyzeFunctionParameters(initializer, props, events);
          }
        }
      });
    });
  }

  private analyzeFunctionParameters(func: any, props: any[], events: any[]): void {
    const parameters = func.getParameters();
    
    parameters.forEach((param: any) => {
      const paramName = param.getName();
      const paramType = param.getType();
      const isOptional = param.hasQuestionToken();
      
      if (paramName.startsWith('on')) {
        events.push({
          name: paramName,
          parameters: [],
          description: `${paramName} event`
        });
      } else {
        props.push({
          name: paramName,
          type: this.mapTypeScriptType(paramType),
          required: !isOptional,
          description: `Function prop: ${paramName}`
        });
      }
    });
  }

  private detectPlatform(sourceFile: any): string {
    const imports = sourceFile.getImportDeclarations();
    
    for (const importDecl of imports) {
      const moduleSpecifier = importDecl.getModuleSpecifierValue();
      
      if (moduleSpecifier.includes('react') || moduleSpecifier.includes('@types/react')) {
        return 'react';
      }
      if (moduleSpecifier.includes('vue')) {
        return 'vue';
      }
      if (moduleSpecifier.includes('@angular')) {
        return 'angular';
      }
      if (moduleSpecifier.includes('svelte')) {
        return 'svelte';
      }
    }
    
    // Проверяем использование React хуков
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    const reactHooks = ['useState', 'useEffect', 'useContext', 'useMemo', 'useCallback'];
    
    for (const identifier of identifiers) {
      if (reactHooks.includes(identifier.getText())) {
        return 'react';
      }
    }
    
    return 'universal';
  }

  private detectChildrenSupport(sourceFile: any): boolean {
    const identifiers = sourceFile.getDescendantsOfKind(SyntaxKind.Identifier);
    
    for (const identifier of identifiers) {
      const text = identifier.getText();
      if (text === 'children' || text === 'ReactNode') {
        return true;
      }
    }
    
    return false;
  }

  private deduplicateProps(props: any[]): any[] {
    const propMap = new Map();
    
    props.forEach(prop => {
      const existing = propMap.get(prop.name);
      
      if (existing) {
        // Объединяем информацию о пропе
        propMap.set(prop.name, {
          ...existing,
          required: existing.required || prop.required,
          type: this.mergeTypes(existing.type, prop.type),
          description: existing.description || prop.description
        });
      } else {
        propMap.set(prop.name, prop);
      }
    });
    
    return Array.from(propMap.values());
  }

  private mergeTypes(type1: Type, type2: Type): Type {
    // Если типы одинаковые, возвращаем любой
    if (type1 === type2) return type1;
    
    // Если один из типов более специфичный, возвращаем его
    if (type1 === 'text' && type2 === 'array') return 'array';
    if (type1 === 'array' && type2 === 'text') return 'array';
    if (type1 === 'object' && type2 === 'text') return 'object';
    if (type1 === 'text' && type2 === 'object') return 'object';
    
    // По умолчанию возвращаем первый тип
    return type1;
  }

  private mapTypeScriptType(type: any): Type {
    const typeText = type.getText();
    
    if (type.isString()) return 'text';
    if (type.isNumber()) return 'number';
    if (type.isBoolean()) return 'boolean';
    if (type.isFunction()) return 'function';
    if (type.isArray()) return 'array';
    if (type.isObject()) return 'object';
    
    // Проверяем по тексту типа
    const text = typeText.toLowerCase();
    
    if (text.includes('string') || text.includes('text')) return 'text';
    if (text.includes('number') || text.includes('int') || text.includes('float')) return 'number';
    if (text.includes('boolean') || text.includes('bool')) return 'boolean';
    if (text.includes('function') || text.includes('()')) return 'function';
    if (text.includes('array') || text.includes('[]')) return 'array';
    if (text.includes('object') || text.includes('{}')) return 'object';
    
    return 'text'; // default
  }

  private analyzeComponentObject(component: any, name: string): Schema {
    console.log('[AST-DEBUG] analyzeComponentObject called', { name, componentType: typeof component });
    
    const props: any[] = [];
    const events: any[] = [];
    let platform = 'universal';
    
    if (typeof component === 'function') {
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
      detectedPlatform: platform,
      props,
      events,
      children: true,
      description: `Component ${name} (object analysis)`
    };
  }

  private detectPlatformFromComponent(component: any): string {
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

  private getFunctionParameters(func: Function): string[] {
    const funcStr = func.toString();
    const match = funcStr.match(/\(([^)]*)\)/);
    if (match && match[1]) {
      return match[1].split(',').map(param => param.trim().split('=')[0].trim());
    }
    return [];
  }
}

export const componentAnalyzer = new ComponentAnalyzer();
console.log('[AST-DEBUG] componentAnalyzer exported', componentAnalyzer); 