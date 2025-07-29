import { Face } from './types';
import { RenderPlatform, Renderer } from './api';
import { ComponentNotFoundError } from './errors';
import { engine } from './engine-factory';

// Svelte рендерер
class SvelteRenderer implements Renderer {
  createElement(type: string, props: any, children: any[]): any {
    // В реальной реализации здесь будет создание Svelte элемента
    return {
      type,
      props,
      children
    };
  }
  
  render(component: any, _container: any): void {
    // В реальной реализации здесь будет рендеринг Svelte компонента
    console.log('[SvelteRenderer] Rendering component:', component);
  }
  
  unmount(container: any): void {
    // В реальной реализации здесь будет размонтирование Svelte компонента
    console.log('[SvelteRenderer] Unmounting component from container:', container);
  }
}

// Svelte рендерер платформы
export class RenderSvelte implements RenderPlatform {
  id = 'svelte';
  meta = {
    name: 'Svelte Adapter',
    version: '1.0.0',
    platform: 'svelte'
  };
  
  renderer = new SvelteRenderer();
  
  // Компоненты, которые поддерживает этот адаптер
  private supportedComponents: string[] = [
    'button', 'text', 'input', 'card', 'modal', 'form', 'list', 'table',
    'tabs', 'accordion', 'slider', 'progress', 'checkbox', 'radio',
    'select', 'textarea', 'image', 'link', 'container', 'layout',
    'media', 'panel', 'side', 'footer', 'filter', 'feed', 'code', 'cardcart', 'article'
  ];
  
  // Рендеринг компонента
  render(spec: Face): any {
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
    // Проверяем, является ли компонент Svelte компонентом
    return !!(component && (component.$$render || component.fragment));
  }
  
  // Получение поддерживаемых компонентов
  getSupportedComponents(): string[] {
    return this.supportedComponents;
  }
  
  // Валидация спецификации
  validateSpec(spec: Face): boolean {
    if (!spec.component || typeof spec.component !== 'string') {
      return false;
    }
    
    // Проверяем что компонент зарегистрирован в Engine
    const component = engine.getComponent(spec.component);
    if (!component) {
      return false;
    }
    
    // Проверяем обязательные пропсы из схемы
    const schema = engine.getComponentSchema(spec.component);
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
  
  // Адаптация пропсов для Svelte
  private adaptProps(props: any): any {
    const adaptedProps: any = {};
    
    // Маппинг универсальных типов в Svelte пропсы
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
      if (props.meta.className) adaptedProps.class = props.meta.className;
      if (props.meta.style) adaptedProps.style = props.meta.style;
      if (props.meta.theme) adaptedProps.theme = props.meta.theme;
    }
    
    // Обработка событий
    if (props.events) {
      Object.keys(props.events).forEach(eventName => {
        adaptedProps[`on:${eventName}`] = props.events[eventName];
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
    return engine.getComponent(componentName);
  }
}

export const renderSvelte = new RenderSvelte(); 