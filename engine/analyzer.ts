import { Schema } from './schema';
import { Type } from './types';

// Простой AST-анализатор компонентов
export class ComponentAnalyzer {
  
  // Анализ компонента любой платформы
  analyzeComponent(component: any, name: string): Schema {
    // Определяем платформу по типу компонента
    if (this.isReactComponent(component)) {
      return this.analyzeReactComponent(component, name);
    }
    
    // Vue компонент
    if (this.isVueComponent(component)) {
      return this.analyzeVueComponent(component, name);
    }
    
    // Angular компонент
    if (this.isAngularComponent(component)) {
      return this.analyzeAngularComponent(component, name);
    }
    
    // Svelte компонент
    if (this.isSvelteComponent(component)) {
      return this.analyzeSvelteComponent(component, name);
    }
    
    // Vanilla JS компонент
    return this.analyzeVanillaComponent(component, name);
  }

  private isReactComponent(component: any): boolean {
    return component && (
      typeof component === 'function' ||
      component.$$typeof ||
      component.propTypes ||
      component.defaultProps
    );
  }

  private isVueComponent(component: any): boolean {
    return component && (
      component.render ||
      component.template ||
      component.setup ||
      component.props
    );
  }

  private isAngularComponent(component: any): boolean {
    return component && (
      component.selector ||
      component.templateUrl ||
      component.template
    );
  }

  private isSvelteComponent(component: any): boolean {
    return component && (
      component.$$render ||
      component.fragment
    );
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
    
    // Простой анализ без Reflect
    if (component.inputs) {
      component.inputs.forEach((input: any) => {
        props.push({
          name: input.propertyName || input,
          type: 'text',
          required: false,
          description: `Angular input: ${input.propertyName || input}`
        });
      });
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
    // Простой маппинг без React.PropTypes
    if (propType && typeof propType === 'object') {
      if (propType.name === 'string') return 'text';
      if (propType.name === 'number') return 'number';
      if (propType.name === 'bool') return 'boolean';
      if (propType.name === 'array') return 'array';
      if (propType.name === 'object') return 'object';
      if (propType.name === 'func') return 'function';
      if (propType.name === 'element') return 'element';
    }
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