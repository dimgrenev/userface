import { Schema } from './schema';
import { Type } from './types';

console.log('[AST-DEBUG] analyzer.ts loaded');

export class ComponentAnalyzer {
  constructor() {
    console.log('[AST-DEBUG] ComponentAnalyzer constructed');
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
      const props: any[] = [];
      const events: any[] = [];
      let platform = 'universal';
      let children = false;
      
      // Анализируем интерфейсы и типы с помощью regex
      this.extractInterfacesRegex(code, props, events);
      
      // Анализируем функции и компоненты
      this.extractFunctionsRegex(code, props, events, name);
      
      // Определяем платформу
      platform = this.detectPlatformRegex(code);
      
      // Проверяем поддержку children
      children = this.detectChildrenSupportRegex(code);
      
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

  private extractInterfacesRegex(code: string, props: any[], events: any[]): void {
    // Ищем интерфейсы
    const interfaceRegex = /interface\s+(\w+)\s*\{([^}]+)\}/g;
    let match;
    
    while ((match = interfaceRegex.exec(code)) !== null) {
      const interfaceName = match[1];
      const interfaceBody = match[2];
      
      // Ищем свойства в интерфейсе
      const propertyRegex = /(\w+)\s*(\?)?\s*:\s*([^;]+);/g;
      let propMatch;
      
      while ((propMatch = propertyRegex.exec(interfaceBody)) !== null) {
        const propName = propMatch[1];
        const isOptional = !!propMatch[2];
        const propType = propMatch[3].trim();
        
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
      }
    }
  }

  private extractFunctionsRegex(code: string, props: any[], events: any[], componentName: string): void {
    // Ищем функции с именем компонента
    const functionRegex = new RegExp(`(?:function\\s+${componentName}|const\\s+${componentName}\\s*=\\s*\\(|export\\s+(?:function\\s+)?${componentName})\\s*\\(([^)]*)\\)`, 'g');
    let match;
    
    while ((match = functionRegex.exec(code)) !== null) {
      const params = match[1];
      if (params) {
        const paramList = params.split(',').map(p => p.trim());
        paramList.forEach(param => {
          const paramName = param.split(':')[0].trim();
          const paramType = param.split(':')[1]?.trim() || 'any';
          
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
              required: !param.includes('?'),
              description: `Function prop: ${paramName}`
            });
          }
        });
      }
    }
  }

  private detectPlatformRegex(code: string): string {
    // Определяем платформу по паттернам в коде
    if (code.includes('import React') || code.includes('from "react"') || code.includes('useState') || code.includes('useEffect')) {
      return 'react';
    }
    if (code.includes('import Vue') || code.includes('from "vue"') || code.includes('defineComponent')) {
      return 'vue';
    }
    if (code.includes('@Component') || code.includes('@Input') || code.includes('from "@angular')) {
      return 'angular';
    }
    if (code.includes('$:') || code.includes('{#if}') || code.includes('from "svelte')) {
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

  private detectChildrenSupportRegex(code: string): boolean {
    // Проверяем поддержку children
    return code.includes('children') || code.includes('{children}') || code.includes('ReactNode');
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