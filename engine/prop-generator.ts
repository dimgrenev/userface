// Универсальная генерация пропсов для компонентов
// Анализирует схему компонента и генерирует подходящие пропсы без хардкода

import { Schema, PropDefinition } from './schema';

export interface PropGeneratorOptions {
  componentName: string;
  schema: Schema;
}

export interface GeneratedProps {
  [key: string]: any;
}

/**
 * Фильтрует пропсы, убирая те, которые не должны передаваться на DOM элементы
 */
export function filterDOMProps(props: Record<string, any>): Record<string, any> {
  const filtered: Record<string, any> = {};
  
  // Список пропсов, которые НЕ должны передаваться на DOM
  const invalidDOMProps = new Set([
    'isopen', 'showLabel', 'isOpen', 'isVisible', 'isActive',
    'isSelected', 'isDisabled', 'isLoading', 'isError', 'isSuccess',
    'hasError', 'hasWarning', 'hasInfo', 'hasSuccess',
    'canEdit', 'canDelete', 'canView', 'canCreate',
    'shouldShow', 'shouldHide', 'shouldRender', 'shouldUpdate',
    'onToggle', 'onShow', 'onHide', 'onOpen', 'onClose',
    'items', 'options', 'data', 'tabs', 'sections', 'fields',
    'children', 'render', 'component', 'as', 'forwardedRef',
    'defaultActiveTab', 'activeTab', 'currentTab',
    'variant', 'size', 'theme', 'color', 'backgroundColor'
  ]);

  for (const [key, value] of Object.entries(props)) {
    const keyLower = key.toLowerCase();
    
    // Всегда передаем стандартные React пропсы
    if (key === 'children' || key === 'ref' || key === 'key') {
      filtered[key] = value;
      continue;
    }
    
    // Всегда передаем data-* и aria-* атрибуты
    if (key.startsWith('data-') || key.startsWith('aria-')) {
      filtered[key] = value;
      continue;
    }
    
    // Пропускаем невалидные DOM пропсы
    if (invalidDOMProps.has(keyLower)) {
      continue;
    }
    
    // Передаем все остальные пропсы (стандартные HTML атрибуты)
    filtered[key] = value;
  }

  return filtered;
}

/**
 * Универсальная генерация пропсов на основе анализа компонента
 */
export class PropGenerator {
  
  /**
   * Генерирует пропсы для компонента на основе его схемы
   */
  static generateProps(schema: Schema, componentName: string): GeneratedProps {
    const props: GeneratedProps = {
      id: `${componentName.toLowerCase()}-demo`
    };

    if (!schema.props || !Array.isArray(schema.props)) {
      return props;
    }

    // Обрабатываем каждый проп из схемы
    schema.props.forEach((prop: PropDefinition) => {
      const propName = prop.name;
      const propType = prop.type;
      const isRequired = prop.required;
      
      // Генерируем значение на основе типа и контекста пропа
      const value = this.generateValueForType(propType, propName, isRequired);
      if (value !== undefined) {
        props[propName] = value;
      }
    });

    return props;
  }

  /**
   * Универсальная генерация значения для конкретного типа пропа
   */
  private static generateValueForType(
    type: string, 
    name: string, 
    required: boolean
  ): any {
    const typeLower = type.toLowerCase();
    const nameLower = name.toLowerCase();
    
    // === ОБРАБОТКА КОНТРОЛИРУЕМЫХ КОМПОНЕНТОВ ===
    
    // Для value/checked без onChange - не передаем, пусть компонент использует defaultValue/defaultChecked
    if ((nameLower.includes('value') || nameLower.includes('checked')) && 
        !nameLower.includes('onchange') && !nameLower.includes('onclick')) {
      return undefined;
    }
    
    // === ОБРАБОТКА ФУНКЦИЙ ===
    if (typeLower.includes('function') || 
        nameLower.includes('on') || 
        nameLower.includes('handle') ||
        nameLower.includes('callback')) {
      return () => console.log(`Function ${name} called`);
    }
    
    // === УНИВЕРСАЛЬНАЯ ОБРАБОТКА МАССИВОВ ===
    if (typeLower.includes('array') || typeLower.includes('[]')) {
      return this.generateArrayValue(nameLower);
    }
    
    // === ОБЩИЕ ТИПЫ ===
    
    // Строки
    if (typeLower.includes('string') || typeLower.includes('text')) {
      return this.generateStringValue(nameLower);
    }
    
    // Числа
    if (typeLower.includes('number') || typeLower.includes('int')) {
      return this.generateNumberValue(nameLower);
    }
    
    // Булевы значения
    if (typeLower.includes('boolean') || typeLower.includes('bool')) {
      return false;
    }
    
    // Объекты
    if (typeLower.includes('object') || typeLower.includes('{}')) {
      return {};
    }
    
    // Дефолтное значение для неизвестных типов
    return required ? 'Default value' : undefined;
  }

  /**
   * Универсальная генерация строковых значений
   */
  private static generateStringValue(nameLower: string): string {
    // Специальные случаи для строк
    if (nameLower.includes('placeholder')) return 'Enter text...';
    if (nameLower.includes('label')) return 'Label';
    if (nameLower.includes('title')) return 'Title';
    if (nameLower.includes('content')) return 'Content';
    if (nameLower.includes('text')) return 'Sample text';
    if (nameLower.includes('src') || nameLower.includes('source')) return 'https://via.placeholder.com/300x200';
    if (nameLower.includes('alt') || nameLower.includes('alttext')) return 'Sample image';
    if (nameLower.includes('href') || nameLower.includes('url')) return '#';
    if (nameLower.includes('name')) return 'sample-name';
    if (nameLower.includes('id')) return 'sample-id';
    if (nameLower.includes('class')) return 'sample-class';
    
    // Дефолтное значение
    return 'Sample text';
  }

  /**
   * Универсальная генерация числовых значений
   */
  private static generateNumberValue(nameLower: string): number {
    // Специальные случаи для чисел
    if (nameLower.includes('min')) return 0;
    if (nameLower.includes('max')) return 100;
    if (nameLower.includes('value')) return 50;
    if (nameLower.includes('progress')) return 65;
    if (nameLower.includes('width')) return 300;
    if (nameLower.includes('height')) return 200;
    if (nameLower.includes('size')) return 16;
    if (nameLower.includes('count')) return 5;
    if (nameLower.includes('limit')) return 10;
    if (nameLower.includes('step')) return 1;
    if (nameLower.includes('delay')) return 1000;
    if (nameLower.includes('duration')) return 300;
    
    // Дефолтное значение
    return 42;
  }

  /**
   * Универсальная генерация массивов
   */
  private static generateArrayValue(nameLower: string): any[] {
    // Определяем тип массива по имени пропа
    if (nameLower.includes('options') || nameLower.includes('choices')) {
      return [
        { value: 'option1', label: 'Option 1' },
        { value: 'option2', label: 'Option 2' },
        { value: 'option3', label: 'Option 3' }
      ];
    }
    
    if (nameLower.includes('items') || nameLower.includes('list')) {
      return [
        { id: '1', text: 'Item 1', title: 'First Item' },
        { id: '2', text: 'Item 2', title: 'Second Item' },
        { id: '3', text: 'Item 3', title: 'Third Item' }
      ];
    }
    
    if (nameLower.includes('data') || nameLower.includes('rows')) {
      return [
        { id: 1, name: 'Row 1', value: 'Value 1', status: 'Active' },
        { id: 2, name: 'Row 2', value: 'Value 2', status: 'Inactive' },
        { id: 3, name: 'Row 3', value: 'Value 3', status: 'Active' }
      ];
    }
    
    if (nameLower.includes('tabs') || nameLower.includes('sections')) {
      return [
        { id: 'tab1', label: 'Tab 1', content: 'Content for tab 1' },
        { id: 'tab2', label: 'Tab 2', content: 'Content for tab 2' },
        { id: 'tab3', label: 'Tab 3', content: 'Content for tab 3' }
      ];
    }
    
    if (nameLower.includes('fields') || nameLower.includes('inputs')) {
      return [
        { id: 'field1', label: 'Field 1', type: 'text', placeholder: 'Enter field 1' },
        { id: 'field2', label: 'Field 2', type: 'select', options: ['Option 1', 'Option 2'] }
      ];
    }
    
    if (nameLower.includes('posts') || nameLower.includes('articles')) {
      return [
        { id: '1', author: 'John Doe', title: 'First Post', content: 'This is the content of the first post.', date: '2024-01-15 10:30' },
        { id: '2', author: 'Jane Smith', title: 'Second Post', content: 'Another interesting post content.', date: '2024-01-15 11:45' }
      ];
    }
    
    if (nameLower.includes('products') || nameLower.includes('goods')) {
      return [
        { id: '1', name: 'Product 1', price: 29.99, quantity: 2, image: 'product1.jpg' },
        { id: '2', name: 'Product 2', price: 19.99, quantity: 1, image: 'product2.jpg' }
      ];
    }
    
    // Универсальный массив для неизвестных типов
    return [
      { id: '1', name: 'Item 1', value: 'Value 1' },
      { id: '2', name: 'Item 2', value: 'Value 2' },
      { id: '3', name: 'Item 3', value: 'Value 3' }
    ];
  }

  /**
   * Генерирует дефолтные пропсы если анализ не удался
   */
  static generateDefaultProps(componentName: string): GeneratedProps {
    return {
      id: `${componentName.toLowerCase()}-demo`,
      // Базовые пропсы для большинства компонентов
      className: 'demo-component',
      style: { margin: '8px' }
    };
  }
} 