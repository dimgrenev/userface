import { Face } from './types';
import { Schema } from './schema';

// Условные импорты для поддержки Node.js
let React: any = null;
let createElement: any = null;

// Проверяем доступность React Native
if (typeof window !== 'undefined' && (window as any).React) {
  React = (window as any).React;
  createElement = React.createElement;
} else if (typeof require !== 'undefined') {
  try {
    React = require('react');
    createElement = React.createElement;
  } catch (error) {
    console.warn('React not available in Node.js environment');
  }
}

export interface RenderReactNativeOptions {
  enableStyleConversion?: boolean;
  enableEventConversion?: boolean;
}

export class RenderReactNative {
  private options: RenderReactNativeOptions;

  constructor(options: RenderReactNativeOptions = {}) {
    this.options = {
      enableStyleConversion: true,
      enableEventConversion: true,
      ...options
    };
  }

  render(userFace: Face, schema?: Schema): any {
    if (!React) {
      throw new Error('React is not available for React Native rendering');
    }

    try {
      const { component, ...props } = userFace;
      
      // Конвертируем пропсы для React Native
      const convertedProps = this.convertProps(props);
      
      // Создаем React Native элемент
      return createElement(component, convertedProps);
    } catch (error) {
      console.error('React Native render error:', error);
      throw error;
    }
  }

  private convertProps(props: any): any {
    const converted: any = {};

    Object.entries(props).forEach(([key, value]) => {
      // Конвертируем события
      if (this.options.enableEventConversion && key === 'onClick') {
        converted.onPress = value;
      } else if (this.options.enableEventConversion && key === 'onChange') {
        converted.onChangeText = value;
      } else if (this.options.enableEventConversion && key === 'onSubmit') {
        converted.onSubmitEditing = value;
      } else {
        // Конвертируем стили
        if (this.options.enableStyleConversion && key === 'className') {
          converted.style = this.convertClassNameToStyle(value as string);
        } else if (this.options.enableStyleConversion && key === 'style' && typeof value === 'string') {
          converted.style = this.convertCssToStyle(value);
        } else {
          converted[key] = value;
        }
      }
    });

    return converted;
  }

  private convertClassNameToStyle(className: string): any {
    // Простая конвертация CSS классов в React Native стили
    const styles: any = {};
    
    if (className.includes('primary')) {
      styles.backgroundColor = '#007AFF';
    }
    if (className.includes('secondary')) {
      styles.backgroundColor = '#5856D6';
    }
    if (className.includes('success')) {
      styles.backgroundColor = '#34C759';
    }
    if (className.includes('danger')) {
      styles.backgroundColor = '#FF3B30';
    }
    if (className.includes('warning')) {
      styles.backgroundColor = '#FF9500';
    }
    
    return styles;
  }

  private convertCssToStyle(css: string): any {
    // Простая конвертация CSS в React Native стили
    const styles: any = {};
    
    // Цвета
    const colorMatch = css.match(/color:\s*([^;]+)/);
    if (colorMatch) {
      styles.color = colorMatch[1].trim();
    }
    
    // Фон
    const bgMatch = css.match(/background(?:-color)?:\s*([^;]+)/);
    if (bgMatch) {
      styles.backgroundColor = bgMatch[1].trim();
    }
    
    // Размеры
    const widthMatch = css.match(/width:\s*([^;]+)/);
    if (widthMatch) {
      styles.width = widthMatch[1].trim();
    }
    
    const heightMatch = css.match(/height:\s*([^;]+)/);
    if (heightMatch) {
      styles.height = heightMatch[1].trim();
    }
    
    // Отступы
    const paddingMatch = css.match(/padding:\s*([^;]+)/);
    if (paddingMatch) {
      styles.padding = paddingMatch[1].trim();
    }
    
    const marginMatch = css.match(/margin:\s*([^;]+)/);
    if (marginMatch) {
      styles.margin = marginMatch[1].trim();
    }
    
    return styles;
  }
}

// Экспортируем функцию рендеринга
export const renderReactNative = (userFace: Face, schema?: Schema): any => {
  const renderer = new RenderReactNative();
  return renderer.render(userFace, schema);
}; 