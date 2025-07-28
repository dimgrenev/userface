import * as React from 'react';
import { Schema } from './schema';
import { Type } from './types';
import { logger } from './logger';

// Расширяем Reflect для Angular метаданных
declare global {
  interface Reflect {
    getMetadata(metadataKey: string, target: any): any;
  }
}

// Универсальный анализатор компонентов
export class ComponentAnalyzer {
  
  // Анализ компонента любой платформы
  analyzeComponent(component: any, name: string): Schema {
    // Определяем платформу по типу компонента
    if (React.isValidElement(component) || component.$$typeof) {
      return this.analyzeReactComponent(component, name);
    }
    
    // Vue компонент
    if (component.render || component.template || component.setup) {
      return this.analyzeVueComponent(component, name);
    }
    
    // Angular компонент
    if (component.selector || component.templateUrl || component.template) {
      return this.analyzeAngularComponent(component, name);
    }
    
    // Svelte компонент
    if (component.$$render || component.fragment) {
      return this.analyzeSvelteComponent(component, name);
    }
    
    // Vanilla JS компонент
    return this.analyzeVanillaComponent(component, name);
  }

  private analyzeReactComponent(component: any, name: string): Schema {
    const props: any[] = [];
    
    // Анализируем propTypes если есть
    if (component.propTypes) {
      Object.keys(component.propTypes).forEach(propName => {
        const propType = component.propTypes[propName];
        props.push({
          name: propName,
          type: this.mapReactPropType(propType),
          required: propType.isRequired || false,
          description: `React prop: ${propName}`
        });
      });
    }
    
    // Анализируем defaultProps если есть
    if (component.defaultProps) {
      Object.keys(component.defaultProps).forEach(propName => {
        const existingProp = props.find(p => p.name === propName);
        if (existingProp) {
          existingProp.defaultValue = component.defaultProps[propName];
        } else {
          props.push({
            name: propName,
            type: 'text',
            required: false,
            defaultValue: component.defaultProps[propName],
            description: `React default prop: ${propName}`
          });
        }
      });
    }
    
    return {
      name,
      platform: 'react',
      props,
      events: [
        { name: 'onClick', parameters: [], description: 'Click event' },
        { name: 'onChange', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `React component ${name}`
    };
  }

  private analyzeVueComponent(component: any, name: string): Schema {
    const props: any[] = [];
    
    if (component.props) {
      Object.keys(component.props).forEach(propName => {
        const prop = component.props[propName];
        let propType: Type = 'text';
        let required = false;
        
        if (typeof prop === 'object') {
          propType = this.mapVuePropType(prop.type);
          required = prop.required || false;
        } else {
          propType = this.mapVuePropType(prop);
        }
        
        props.push({
          name: propName,
          type: propType,
          required,
          description: `Vue prop: ${propName}`
        });
      });
    }
    
    return {
      name,
      platform: 'vue',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Vue component ${name}`
    };
  }

  private analyzeAngularComponent(component: any, name: string): Schema {
    const props: any[] = [];
    
    // Анализируем Input декораторы
    try {
      if (typeof Reflect !== 'undefined' && (Reflect as any).getMetadata) {
        const inputs = (Reflect as any).getMetadata('inputs', component) || [];
        inputs.forEach((input: any) => {
          props.push({
            name: input.propertyName || input,
            type: 'text',
            required: false,
            description: `Angular input: ${input.propertyName || input}`
          });
        });
      }
    } catch (error) {
      logger.debug('Angular metadata not available', 'Analyzer', error as Error);
    }
    
    return {
      name,
      platform: 'angular',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Angular component ${name}`
    };
  }

  private analyzeSvelteComponent(component: any, name: string): Schema {
    const props: any[] = [];
    
    // Svelte компоненты обычно имеют $$render метод
    if (component.$$render) {
      // Анализируем props из $$render
      const renderFn = component.$$render.toString();
      const propMatches = renderFn.match(/\$(\w+)/g);
      
      if (propMatches) {
        propMatches.forEach((prop: string) => {
          const propName = prop.substring(1);
          props.push({
            name: propName,
            type: 'text',
            required: false,
            description: `Svelte prop: ${propName}`
          });
        });
      }
    }
    
    return {
      name,
      platform: 'svelte',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Svelte component ${name}`
    };
  }

  private analyzeVanillaComponent(component: any, name: string): Schema {
    const props: any[] = [];
    
    // Vanilla JS компоненты - анализируем как функции
    if (typeof component === 'function') {
      const fnStr = component.toString();
      const paramMatch = fnStr.match(/\(([^)]*)\)/);
      
      if (paramMatch && paramMatch[1]) {
        const params = paramMatch[1].split(',').map((p: string) => p.trim()).filter((p: string) => p);
        params.forEach((param: string) => {
          props.push({
            name: param,
            type: 'text',
            required: false,
            description: `Vanilla prop: ${param}`
          });
        });
      }
    }
    
    return {
      name,
      platform: 'vanilla',
      props,
      events: [
        { name: 'click', parameters: [], description: 'Click event' },
        { name: 'change', parameters: ['value'], description: 'Change event' }
      ],
      children: true,
      description: `Vanilla JS component ${name}`
    };
  }

  // Маппинг типов для разных платформ
  private mapReactPropType(propType: any): Type {
    // React.PropTypes может не быть доступен в новых версиях
    const PropTypes = (React as any).PropTypes;
    if (PropTypes && propType === PropTypes.string) return 'text';
    if (PropTypes && propType === PropTypes.number) return 'number';
    if (PropTypes && propType === PropTypes.bool) return 'boolean';
    if (PropTypes && propType === PropTypes.array) return 'array';
    if (PropTypes && propType === PropTypes.object) return 'object';
    if (PropTypes && propType === PropTypes.func) return 'function';
    if (PropTypes && propType === PropTypes.element) return 'element';
    return 'text';
  }

  private mapVuePropType(propType: any): Type {
    if (propType === String) return 'text';
    if (propType === Number) return 'number';
    if (propType === Boolean) return 'boolean';
    if (propType === Array) return 'array';
    if (propType === Object) return 'object';
    if (propType === Function) return 'function';
    return 'text';
  }
}

// Экспортируем синглтон
export const componentAnalyzer = new ComponentAnalyzer(); 