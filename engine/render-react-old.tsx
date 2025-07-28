import * as React from 'react';
import { createContext, useState, useEffect, useContext, useMemo } from 'react';
import { Face } from './types';
import { RenderPlatform, Renderer, ContextProvider } from './api';
import { ComponentNotFoundError } from './errors';

// React рендерер
class ReactRenderer implements Renderer {
  createElement(type: string, props: any, children: any[]): any {
    return React.createElement(type, props, ...children);
  }
  
  render(component: any, container: any): void {
    if (typeof (window as any).ReactDOM !== 'undefined') {
      (window as any).ReactDOM.render(component, container);
    } else {
      console.warn('[RenderReact] ReactDOM not available');
    }
  }
  
  unmount(container: any): void {
    if (typeof (window as any).ReactDOM !== 'undefined') {
      (window as any).ReactDOM.unmountComponentAtNode(container);
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
  face: UserFace;
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
      
      const remoteComponents = (window as any)[registryKey] || {};
                    // Регистрируем компоненты в глобальном реестре
              Object.entries(remoteComponents).forEach(([name, component]) => {
                // В реальной реализации нужно передавать registry
                console.log(`Would register component: ${name}`);
              });
      
      setIsReady(true);
      onReady?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      onError?.(errorMessage);
      console.error('[RenderReact] Error loading remote bundles:', err);
    }
  };

  useEffect(() => {
    loadRemoteBundles();
  }, [bundlesKey]);

  if (!isReady && fallback) {
    return <>{fallback}</>;
  }

  if (error) {
    return (
      <div style={{ 
        padding: '16px', 
        border: '1px solid #ff4444', 
        color: '#ff4444',
        borderRadius: '4px',
        background: '#fff5f5'
      }}>
        <h3>Ошибка загрузки компонентов</h3>
        <p>{error}</p>
        <button onClick={reload} style={{ 
          padding: '8px 16px', 
          background: '#ff4444', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: 'pointer'
        }}>
          Повторить
        </button>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div style={{ 
        padding: '16px', 
        textAlign: 'center',
        color: '#666'
      }}>
        <div style={{ 
          width: '20px', 
          height: '20px', 
          border: '2px solid #ddd', 
          borderTop: '2px solid #007AFF',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 8px'
        }} />
        <span>Загрузка компонентов...</span>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ face, isReady, error, reload }}>
      {children}
    </UserContext.Provider>
  );
};

// React хуки
export const useUserContext = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within UserContextProvider');
  }
  return context;
};

export const useUserFace = (): UserFace | null => {
  const context = useUserContext();
  return context.face;
};

// React рендерер компонентов
export const UserRenderer: React.FC<{
  face: UserFace;
  fallback?: React.ComponentType<any>;
  onError?: (error: string, face: any) => void;
}> = ({ 
  face, 
  fallback,
  onError
}) => {
  const { component, ...props } = face;
  
  // Получаем компонент из глобального реестра
  // В реальной реализации нужно передавать registry
  const Component = null;
  
  if (!Component) {
    const errorMessage = `Component "${component}" not found`;
    console.warn(`[UserRenderer] ${errorMessage}`);
    
    onError?.(errorMessage, face);
    
    if (fallback) {
      return React.createElement(fallback, { error: errorMessage, face });
    }
    
    return (
      <div style={{ 
        padding: '8px', 
        border: '1px solid #ff4444', 
        color: '#ff4444',
        fontSize: '12px',
        background: '#fff5f5',
        borderRadius: '4px'
      }}>
        {errorMessage}
      </div>
    );
  }
  
  return React.createElement(Component, props);
};

// React рендерер платформы
export class RenderReact implements RenderPlatform {
  id = 'react';
  
  meta = {
    name: 'React Adapter',
    version: '1.0.0',
    platform: 'react'
  };
  
  renderer = new ReactRenderer();
  
  // Движок не знает о конкретных компонентах - они определяются пользователем
  
  // Рендеринг компонента
  render(spec: UserFace): any {
    const { component, ...props } = spec;
    
    // Получаем компонент из глобального реестра
    const Component = this.getComponentFromRegistry(component);
    
    if (!Component) {
      throw new ComponentNotFoundError(component);
    }
    
    const adaptedProps = this.adaptProps(props);
    
    return React.createElement(Component, adaptedProps);
  }
  
  // Проверка совместимости
  isCompatible(component: any): boolean {
    return (
      typeof component === 'function' ||
      (component && typeof component.type === 'function') ||
      React.isValidElement(component)
    );
  }
  
  // Получение поддерживаемых компонентов
  getSupportedComponents(): string[] {
    // Возвращаем базовые компоненты - в реальной реализации нужно передавать registry
    return ['button', 'text', 'input', 'card', 'modal', 'form', 'list', 'table', 'tabs'];
  }
  
  // Валидация спецификации
  validateSpec(spec: UserFace): boolean {
    // Базовая валидация
    if (!spec.component || typeof spec.component !== 'string') {
      return false;
    }
    
    // В реальной реализации нужно передавать registry для проверки компонентов
    return true;
  }
  
  // Приватные методы для работы с реестром
  private getComponentFromRegistry(name: string): any | undefined {
    // В реальной реализации нужно передавать registry
    return null;
  }
  
  // Приватные методы
  private adaptProps(props: any): any {
    const adaptedProps: any = { ...props };
    
    // Удаляем служебные поля
    delete adaptedProps.meta;
    delete adaptedProps.events;
    
    // Валидируем универсальные типы
    this.validateUniversalTypes(props);
    
    // Обрабатываем события
    if (props.events) {
      Object.entries(props.events).forEach(([eventName, handler]) => {
        const reactEventName = this.mapEventName(eventName);
        if (reactEventName) {
          adaptedProps[reactEventName] = handler;
        }
      });
    }
    
    // Обрабатываем метаданные
    if (props.meta) {
      if (props.meta.className) {
        adaptedProps.className = props.meta.className;
      }
      if (props.meta.visible === false) {
        adaptedProps.style = { ...adaptedProps.style, display: 'none' };
      }
      if (props.meta.style) {
        adaptedProps.style = { ...adaptedProps.style, ...props.meta.style };
      }
      if (props.meta.theme) {
        adaptedProps['data-theme'] = props.meta.theme;
      }
    }
    
    return adaptedProps;
  }
  
  // Валидация универсальных типов
  private validateUniversalTypes(props: any): void {
    const universalTypes = ['text', 'number', 'boolean', 'array', 'object', 'function', 'element', 'color', 'dimension', 'resource'];
    
    universalTypes.forEach(type => {
      if (props[type] !== undefined) {
        const value = props[type];
        const isValid = this.validateType(value, type);
        
        if (!isValid) {
          console.warn(`[RenderReact] Invalid type for "${type}":`, value);
        }
      }
    });
  }
  
  // Проверка типа значения
  private validateType(value: any, type: string): boolean {
    switch (type) {
      case 'text':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'function':
        return typeof value === 'function';
      case 'element':
        return value !== null && (typeof value === 'object' || typeof value === 'string');
      case 'color':
        return typeof value === 'string' && (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl'));
      case 'dimension':
        return typeof value === 'string' && /^\d+(\.\d+)?(px|em|rem|%|vh|vw)$/.test(value);
      case 'resource':
        return typeof value === 'string' && (value.startsWith('http') || value.startsWith('/'));
      default:
        return true;
    }
  }
  
  private mapEventName(eventName: string): string | null {
    const eventMap: Record<string, string> = {
      'click': 'onClick',
      'change': 'onChange',
      'input': 'onInput',
      'submit': 'onSubmit',
      'focus': 'onFocus',
      'blur': 'onBlur',
      'keydown': 'onKeyDown',
      'keyup': 'onKeyUp',
      'mouseenter': 'onMouseEnter',
      'mouseleave': 'onMouseLeave'
    };
    
    return eventMap[eventName] || null;
  }
}

// Экспорт синглтона
export const renderReact = new RenderReact();

// Экспорт провайдера для удобства
export const UserContextProvider = ReactContextProviderComponent; 