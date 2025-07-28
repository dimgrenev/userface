import { UserFace } from './types';
import { RenderPlatform, Renderer } from './api';
import { ComponentNotFoundError } from './errors';
import { unifiedRegistry } from './registry';

// Angular рендерер
class AngularRenderer implements Renderer {
  createElement(type: string, props: any, children: any[]): any {
    // В реальной реализации здесь будет создание Angular элемента
    return {
      type,
      props,
      children
    };
  }
  
  render(component: any, _container: any): void {
    // В реальной реализации здесь будет рендеринг Angular компонента
    console.log('[AngularRenderer] Rendering component:', component);
  }
  
  unmount(container: any): void {
    // В реальной реализации здесь будет размонтирование Angular компонента
    console.log('[AngularRenderer] Unmounting component from container:', container);
  }
}

// Angular рендерер платформы
export class RenderAngular implements RenderPlatform {
  id = 'angular';
  
  meta = {
    name: 'Angular Adapter',
    version: '1.0.0',
    platform: 'angular'
  };
  
  renderer = new AngularRenderer();
  
  // Компоненты, которые поддерживает этот адаптер
  private supportedComponents: string[] = [
    'button', 'text', 'input', 'card', 'modal', 'form', 'list', 'table',
    'tabs', 'accordion', 'slider', 'progress', 'checkbox', 'radio',
    'select', 'textarea', 'image', 'link', 'container', 'layout',
    'media', 'panel', 'side', 'footer', 'filter', 'feed', 'code', 'cardcart', 'article'
  ];
  
  // Рендеринг компонента
  render(spec: UserFace): any {
    const { component, ...props } = spec;
    
    // Получаем компонент из глобального реестра
    const Component = this.getComponentFromRegistry(component);
    
    if (!Component) {
      throw new ComponentNotFoundError(component);
    }
    
    const adaptedProps = this.adaptProps(props);
    
    return this.renderer.createElement(Component, adaptedProps, []);
  }
  
  // Проверка совместимости компонента
  isCompatible(component: any): boolean {
    // Проверяем, является ли компонент Angular компонентом
    return !!(component && (component.selector || component.templateUrl || component.template));
  }
  
  // Получение поддерживаемых компонентов
  getSupportedComponents(): string[] {
    return this.supportedComponents;
  }
  
  // Валидация спецификации
  validateSpec(spec: UserFace): boolean {
    if (!spec.component || typeof spec.component !== 'string') {
      return false;
    }
    if (!this.supportedComponents.includes(spec.component)) {
      return false;
    }
    const schema = unifiedRegistry.getSchema(spec.component);
    if (schema) {
      const requiredProps = schema.props.filter(p => p.required);
      for (const prop of requiredProps) {
        if (spec[prop.name] === undefined) {
          return false;
        }
      }
    }
    return true;
  }
  
  // Адаптация пропсов для Angular
  private adaptProps(props: any): any {
    const adaptedProps: any = {};
    
    // Маппинг универсальных типов в Angular пропсы
    if (props.text !== undefined) adaptedProps.text = props.text;
    if (props.number !== undefined) adaptedProps.number = props.number;
    if (props.boolean !== undefined) adaptedProps.boolean = props.boolean;
    if (props.array !== undefined) adaptedProps.array = props.array;
    if (props.object !== undefined) adaptedProps.object = props.object;
    if (props.function !== undefined) adaptedProps.function = props.function;
    if (props.element !== undefined) adaptedProps.element = props.element;
    if (props.color !== undefined) adaptedProps.color = props.color;
    if (props.dimension !== undefined) adaptedProps.dimension = props.dimension;
    if (props.resource !== undefined) adaptedProps.resource = props.resource;
    
    // Обработка метаданных
    if (props.meta) {
      if (props.meta.className) adaptedProps.className = props.meta.className;
      if (props.meta.style) adaptedProps.style = props.meta.style;
      if (props.meta.theme) adaptedProps.theme = props.meta.theme;
    }
    
    // Обработка событий
    if (props.events) {
      Object.keys(props.events).forEach(eventName => {
        adaptedProps[eventName] = props.events[eventName];
      });
    }
    
    // Копируем остальные пропсы
    Object.keys(props).forEach(key => {
      if (!['text', 'number', 'boolean', 'array', 'object', 'function', 'element', 'color', 'dimension', 'resource', 'meta', 'events'].includes(key)) {
        adaptedProps[key] = props[key];
      }
    });
    
    return adaptedProps;
  }
  
  // Получение компонента из реестра
  private getComponentFromRegistry(componentName: string): any {
    return unifiedRegistry.getComponent(componentName);
  }
}

export const renderAngular = new RenderAngular(); 