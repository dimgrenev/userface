// Условные импорты для поддержки Node.js
let React: any = null;
let createContext: any = null;
let useState: any = null;
let useEffect: any = null;
let useContext: any = null;
let useMemo: any = null;

// Проверяем доступность React
if (typeof window !== 'undefined' && window.React) {
  React = window.React;
  createContext = React.createContext;
  useState = React.useState;
  useEffect = React.useEffect;
  useContext = React.useContext;
  useMemo = React.useMemo;
} else if (typeof require !== 'undefined') {
  try {
    React = require('react');
    createContext = React.createContext;
    useState = React.useState;
    useEffect = React.useEffect;
    useContext = React.useContext;
    useMemo = React.useMemo;
  } catch (error) {
    // React недоступен в Node.js - это нормально
    console.warn('React not available in Node.js environment');
  }
}

import { Face } from './types';
import { RenderPlatform, Renderer, ContextProvider } from './api';
import { ComponentNotFoundError } from './errors';
import { logger } from './logger';
import { engine } from './engine-factory';

// React рендерер
class ReactRenderer implements Renderer {
  createElement(type: string, props: any, children: any[]): any {
    return React.createElement(type, props, ...children);
  }

  render(component: any, container: any): void {
    // React рендеринг через ReactDOM
    if (typeof window !== 'undefined' && window.ReactDOM) {
      window.ReactDOM.render(component, container);
    }
  }

  unmount(container: any): void {
    if (typeof window !== 'undefined' && window.ReactDOM) {
      window.ReactDOM.unmountComponentAtNode(container);
    }
  }
}

// React контекст
interface UserContextType {
  face: Face | null;
  isReady: boolean;
  error: string | null;
  reload: () => void;
}

const UserContext = createContext<UserContextType | null>(null);

// React контекст провайдер
export class ReactContextProvider implements ContextProvider {
  private face: Face | null = null;
  private options: any = {};
  private contextValue: UserContextType | null = null;

  initialize(face: Face, options?: any): void {
    this.face = face;
    this.options = options || {};
  }

  getData(): any {
    return this.contextValue;
  }

  updateData(data: any): void {
    this.contextValue = data;
  }

  cleanup(): void {
    this.face = null;
    this.contextValue = null;
  }

  getContext() {
    return UserContext;
  }

  createProvider(children: React.ReactNode): React.ReactElement {
    if (!this.face) {
      throw new Error('Context not initialized');
    }

    return React.createElement(ReactContextProviderComponent, {
      face: this.face,
      children,
      ...this.options
    });
  }
}

// React компонент провайдера
const ReactContextProviderComponent: React.FC<{
  face: Face;
  children: React.ReactNode;
  remoteBundles?: string[];
  registryKey?: string;
  onReady?: () => void;
  onError?: (error: string) => void;
  fallback?: React.ReactNode;
}> = ({ 
  face, 
  children, 
  remoteBundles = [],
  registryKey = 'userRegistry',
  onReady,
  onError,
  fallback
}) => {
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bundlesKey = useMemo(() => remoteBundles.join(','), [remoteBundles]);

  const reload = () => {
    setIsReady(false);
    setError(null);
    loadRemoteBundles();
  };

  const loadRemoteBundles = async () => {
    if (remoteBundles.length === 0) {
      setIsReady(true);
      onReady?.();
      return;
    }

    try {
      (window as any)[registryKey] = {};

      const promises = remoteBundles.map(url => {
        return new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = `${url}?t=${new Date().getTime()}`;
          script.async = true;
          script.onload = () => {
            console.log(`[RenderReact] Loaded remote bundle: ${url}`);
            resolve();
          };
          script.onerror = () => {
            console.error(`[RenderReact] Failed to load remote bundle: ${url}`);
            reject(new Error(`Failed to load: ${url}`));
          };
          document.head.appendChild(script);
        });
      });

      await Promise.all(promises);
      setIsReady(true);
      onReady?.();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(errorMsg);
      onError?.(errorMsg);
    }
  };

  useEffect(() => {
    loadRemoteBundles();
  }, [bundlesKey]);

  const contextValue: UserContextType = {
    face,
    isReady,
    error,
    reload
  };

  if (error) {
    return React.createElement('div', { 
      style: { 
        padding: '20px', 
        border: '1px solid #ff6b6b', 
        backgroundColor: '#ffe6e6',
        color: '#d63031',
        borderRadius: '4px'
      }
    }, `Error: ${error}`);
  }

  if (!isReady) {
    return fallback ? React.createElement(React.Fragment, {}, fallback) : null;
  }

  return React.createElement(UserContext.Provider, { value: contextValue }, children);
};

// React хуки
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserContextProvider');
  }
  return context;
};

export const useUserFace = (): Face | null => {
  const context = useUserContext();
  return context.face;
};

// React рендерер компонента
export const UserRenderer: React.FC<{
  face: Face;
  fallback?: React.ComponentType<any>;
  onError?: (error: string, face: any) => void;
}> = ({ 
  face, 
  fallback,
  onError
}) => {
  const [error, setError] = useState<string | null>(null);
  const [component, setComponent] = useState<any>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        // Получаем компонент из registry
        const registry = (window as any).userRegistry || {};
        const Component = registry[face.component];
        
        if (!Component) {
          throw new ComponentNotFoundError(face.component);
        }

        setComponent(() => Component);
        setError(null);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setError(errorMsg);
        onError?.(errorMsg, face);
      }
    };

    loadComponent();
  }, [face.component, onError]);

  if (error) {
    return React.createElement('div', { 
      style: { 
        padding: '10px', 
        border: '1px solid #ff6b6b', 
        backgroundColor: '#ffe6e6',
        color: '#d63031',
        borderRadius: '4px'
      }
    }, `Error: ${error}`);
  }

  if (!component) {
    return fallback ? React.createElement(fallback) : null;
  }

  // Рендерим компонент с пропсами
  const props = { ...face };
  delete props.component;
  delete props.data;

  return React.createElement(component, props);
};

// React платформа рендерер
export class RenderReact implements RenderPlatform {
  id = 'react';
  
  meta = {
    name: 'React Renderer',
    version: '1.0.0',
    platform: 'react'
  };

  renderer = new ReactRenderer();

  render(spec: Face): any {
    try {
      // Валидируем спецификацию
      if (!this.validateSpec(spec)) {
        throw new Error('Invalid UserFace specification');
      }

      // Получаем компонент из registry
      const Component = this.getComponentFromRegistry(spec.component);
      if (!Component) {
        throw new ComponentNotFoundError(spec.component);
      }

      // Адаптируем пропсы
      const props = this.adaptProps(spec);
      
      // Валидируем универсальные типы
      this.validateUniversalTypes(props);

      // Рендерим компонент
      return React.createElement(Component, props);
    } catch (error) {
      logger.error(`React render failed: ${error.message}`, 'RenderReact', { spec, error });
      throw error;
    }
  }

  isCompatible(component: any): boolean {
    return React.isValidElement(component) || 
           typeof component === 'function' || 
           component.$$typeof === React.elementType;
  }

  getSupportedComponents(): string[] {
    return ['div', 'span', 'button', 'input', 'form', 'img', 'a', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
  }

  validateSpec(spec: Face): boolean {
    return spec && 
           typeof spec.component === 'string' && 
           spec.component.length > 0;
  }

  private getComponentFromRegistry(name: string): any | undefined {
    // Получаем компонент из Engine
    return engine.getComponent(name);
  }

  private adaptProps(props: any): any {
    const adaptedProps: any = {};

    for (const [key, value] of Object.entries(props)) {
      if (key === 'component' || key === 'data') continue;

      // Адаптируем события
      if (key.startsWith('on') && typeof value === 'function') {
        const eventName = this.mapEventName(key);
        if (eventName) {
          adaptedProps[eventName] = value;
        }
      } else {
        adaptedProps[key] = value;
      }
    }

    return adaptedProps;
  }

  private validateUniversalTypes(props: any): void {
    for (const [key, value] of Object.entries(props)) {
      if (key === 'children') continue;

      // Проверяем типы
      if (value !== null && value !== undefined) {
        const type = typeof value;
        if (!['string', 'number', 'boolean', 'function', 'object'].includes(type)) {
          logger.warn(`Unsupported prop type: ${type} for ${key}`, 'RenderReact');
        }
      }
    }
  }

  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'text':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'function':
        return typeof value === 'function';
      case 'object':
        return typeof value === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  private mapEventName(eventName: string): string | null {
    const eventMap: Record<string, string> = {
      'onClick': 'onClick',
      'onChange': 'onChange',
      'onSubmit': 'onSubmit',
      'onFocus': 'onFocus',
      'onBlur': 'onBlur',
      'onKeyDown': 'onKeyDown',
      'onKeyUp': 'onKeyUp',
      'onMouseEnter': 'onMouseEnter',
      'onMouseLeave': 'onMouseLeave'
    };

    return eventMap[eventName] || null;
  }
}

// Экспортируем рендерер
export const renderReact = new RenderReact(); 