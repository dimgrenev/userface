import * as React from 'react';
import { ComponentSchema, Type } from './types';

export class Analyzer {
  // Анализ React компонента
  static analyzeReactComponent(component: any, name: string): ComponentSchema {
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
            type: 'any',
            required: false,
            defaultValue: component.defaultProps[propName],
            description: `React default prop: ${propName}`
          });
        }
      });
    }
    
    // Анализируем TypeScript типы если есть
    if (component.displayName || component.name) {
      // Пытаемся извлечь типы из TypeScript
      try {
        const componentType = component as React.ComponentType<any>;
        // Это базовая реализация, в реальности нужен более сложный анализ
        if (!props.length) {
          props.push({
            name: 'children',
            type: 'any',
            required: false,
            description: 'React children prop'
          });
        }
      } catch (error) {
        // Игнорируем ошибки анализа TypeScript
      }
    }
    
    return {
      name,
      platform: 'react',
      props,
      events: [
        {
          name: 'onClick',
          parameters: [],
          description: 'Click event'
        },
        {
          name: 'onChange',
          parameters: ['value'],
          description: 'Change event'
        }
      ],
      children: true,
      description: `React component ${name}`
    };
  }
  
  // Анализ Vue компонента
  static analyzeVueComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Анализируем props если есть
    if (component.props) {
      Object.keys(component.props).forEach(propName => {
        const prop = component.props[propName];
        let propType: Type = 'text';
        let required = false;
        let defaultValue: any = undefined;
        
        if (typeof prop === 'object') {
          propType = this.mapVuePropType(prop.type);
          required = prop.required || false;
          defaultValue = prop.default;
        } else {
          propType = this.mapVuePropType(prop);
        }
        
        props.push({
          name: propName,
          type: propType,
          required,
          defaultValue,
          description: `Vue prop: ${propName}`
        });
      });
    }
    
    // Анализируем emits если есть
    const events: any[] = [];
    if (component.emits) {
      if (Array.isArray(component.emits)) {
        component.emits.forEach((eventName: string) => {
          events.push({
            name: eventName,
            parameters: [],
            description: `Vue emit: ${eventName}`
          });
        });
      } else if (typeof component.emits === 'object') {
        Object.keys(component.emits).forEach(eventName => {
          events.push({
            name: eventName,
            parameters: component.emits[eventName] || [],
            description: `Vue emit: ${eventName}`
          });
        });
      }
    }
    
    return {
      name,
      platform: 'vue',
      props,
      events,
      children: true,
      description: `Vue component ${name}`
    };
  }
  
  // Анализ Angular компонента
  static analyzeAngularComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Анализируем Input декораторы
    if (component.prototype && component.prototype.constructor) {
      const metadata = Reflect.getMetadata('design:paramtypes', component.prototype.constructor);
      if (metadata) {
        metadata.forEach((param: any, index: number) => {
          props.push({
            name: `param${index}`,
            type: this.mapAngularType(param),
            required: false,
            description: `Angular input parameter ${index}`
          });
        });
      }
    }
    
    // Анализируем @Input() декораторы (если доступны)
    if (component.inputs) {
      component.inputs.forEach((input: string) => {
        props.push({
          name: input,
          type: 'any',
          required: false,
          description: `Angular input: ${input}`
        });
      });
    }
    
    // Анализируем @Output() декораторы
    const events: any[] = [];
    if (component.outputs) {
      component.outputs.forEach((output: string) => {
        events.push({
          name: output,
          parameters: [],
          description: `Angular output: ${output}`
        });
      });
    }
    
    return {
      name,
      platform: 'angular',
      props,
      events,
      children: true,
      description: `Angular component ${name}`
    };
  }
  
  // Анализ Svelte компонента
  static analyzeSvelteComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Анализируем props если есть
    if (component.props) {
      Object.keys(component.props).forEach(propName => {
        const prop = component.props[propName];
        props.push({
          name: propName,
          type: this.mapSveltePropType(prop),
          required: !prop.hasOwnProperty('default'),
          defaultValue: prop.default,
          description: `Svelte prop: ${propName}`
        });
      });
    }
    
    // Анализируем dispatch события
    const events: any[] = [];
    if (component.dispatch) {
      events.push({
        name: 'dispatch',
        parameters: ['eventName', 'detail'],
        description: 'Svelte dispatch event'
      });
    }
    
    return {
      name,
      platform: 'svelte',
      props,
      events,
      children: true,
      description: `Svelte component ${name}`
    };
  }
  
  // Анализ Vanilla JS компонента
  static analyzeVanillaComponent(component: any, name: string): ComponentSchema {
    const props: any[] = [];
    
    // Анализируем параметры функции если это функция
    if (typeof component === 'function') {
      const functionString = component.toString();
      const paramMatch = functionString.match(/\(([^)]*)\)/);
      
      if (paramMatch && paramMatch[1]) {
        const params = paramMatch[1].split(',').map(p => p.trim()).filter(p => p);
        params.forEach(param => {
          // Убираем значения по умолчанию
          const paramName = param.split('=')[0].trim();
          props.push({
            name: paramName,
            type: 'any',
            required: false,
            description: `Vanilla JS parameter: ${paramName}`
          });
        });
      }
    }
    
    // Анализируем свойства объекта если это объект
    if (typeof component === 'object' && component !== null) {
      Object.keys(component).forEach(key => {
        props.push({
          name: key,
          type: this.mapVanillaType(typeof component[key]),
          required: false,
          description: `Vanilla JS property: ${key}`
        });
      });
    }
    
    return {
      name,
      platform: 'vanilla',
      props,
      events: [
        {
          name: 'click',
          parameters: [],
          description: 'Click event'
        },
        {
          name: 'change',
          parameters: ['value'],
          description: 'Change event'
        }
      ],
      children: false,
      description: `Vanilla JS component ${name}`
    };
  }
  
  // Маппинг React prop типов
  private static mapReactPropType(propType: any): Type {
    if (!propType) return 'text';
    
    const typeName = propType.name || propType.constructor.name;
    
    switch (typeName) {
      case 'string':
        return 'text';
      case 'number':
        return 'number';
      case 'bool':
        return 'boolean';
      case 'array':
        return 'array';
      case 'object':
        return 'object';
      case 'func':
        return 'function';
      case 'element':
        return 'element';
      case 'oneOf':
        return 'text';
      case 'oneOfType':
        return 'text';
      case 'shape':
        return 'object';
      case 'arrayOf':
        return 'array';
      default:
        return 'text';
    }
  }
  
  // Маппинг Vue prop типов
  private static mapVuePropType(propType: any): Type {
    if (!propType) return 'text';
    
    if (Array.isArray(propType)) {
      return 'array';
    }
    
    const typeName = propType.name || propType.constructor.name;
    
    switch (typeName) {
      case 'String':
        return 'text';
      case 'Number':
        return 'number';
      case 'Boolean':
        return 'boolean';
      case 'Array':
        return 'array';
      case 'Object':
        return 'object';
      case 'Function':
        return 'function';
      default:
        return 'text';
    }
  }
  
  // Маппинг Angular типов
  private static mapAngularType(type: any): Type {
    if (!type) return 'text';
    
    const typeName = type.name || type.constructor.name;
    
    switch (typeName) {
      case 'String':
        return 'text';
      case 'Number':
        return 'number';
      case 'Boolean':
        return 'boolean';
      case 'Array':
        return 'array';
      case 'Object':
        return 'object';
      case 'Function':
        return 'function';
      default:
        return 'text';
    }
  }
  
  // Маппинг Svelte prop типов
  private static mapSveltePropType(prop: any): Type {
    if (!prop) return 'text';
    
    if (Array.isArray(prop)) {
      return 'array';
    }
    
    const typeName = typeof prop;
    
    switch (typeName) {
      case 'string':
        return 'text';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'function':
        return 'function';
      default:
        return 'text';
    }
  }
  
  // Маппинг Vanilla JS типов
  private static mapVanillaType(typeName: string): Type {
    switch (typeName) {
      case 'string':
        return 'text';
      case 'number':
        return 'number';
      case 'boolean':
        return 'boolean';
      case 'object':
        return 'object';
      case 'function':
        return 'function';
      default:
        return 'text';
    }
  }
  
  // Универсальный анализ компонента
  static analyzeComponent(component: any, name: string): ComponentSchema {
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
}

export const analyzer = new Analyzer();