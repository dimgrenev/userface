# UserFace Universal Types Update

## 🎯 Что было исправлено

### 1. **Универсальные типы в UserFace**

**Было:**
```typescript
interface UserFace {
  component: string;
  id?: string;
  children?: any;
  meta?: { /* ... */ };
  events?: { /* ... */ };
  [key: string]: any; // ← Все пропы как any!
}
```

**Стало:**
```typescript
interface UserFace {
  component: string;
  id?: string;
  children?: any;
  
  // Универсальные базовые типы
  text?: string;
  number?: number;
  boolean?: boolean;
  array?: any[];
  object?: Record<string, any>;
  
  // Платформо-специфичные типы (Web)
  function?: (...args: any[]) => any;
  element?: any;
  
  // UI-специфичные типы
  color?: string;
  dimension?: string;
  resource?: string;
  
  // Метаданные
  meta?: {
    className?: string;
    visible?: boolean;
    style?: Record<string, any>;
    theme?: string;
    responsive?: Record<string, any>;
    accessibility?: Record<string, any>;
    [key: string]: any;
  };
  
  // События
  events?: {
    [key: string]: (...args: any[]) => void;
  };
  
  // Для обратной совместимости
  [key: string]: any;
}
```

### 2. **Валидация типов в ReactAdapter**

Добавлена автоматическая валидация универсальных типов:

```typescript
// Валидация при рендеринге
private validateUniversalTypes(props: any): void {
  const universalTypes = ['text', 'number', 'boolean', 'array', 'object', 'function', 'element', 'color', 'dimension', 'resource'];
  
  universalTypes.forEach(type => {
    if (props[type] !== undefined) {
      const value = props[type];
      const isValid = this.validateType(value, type);
      
      if (!isValid) {
        console.warn(`[ReactAdapter] Invalid type for "${type}":`, value);
      }
    }
  });
}
```

### 3. **Поддерживаемые типы**

| Тип | Описание | Примеры |
|-----|----------|---------|
| `text` | Любой текст | `"Hello World"` |
| `number` | Число | `42`, `3.14` |
| `boolean` | Да/нет | `true`, `false` |
| `array` | Массив | `[1, 2, 3]`, `["a", "b"]` |
| `object` | Объект | `{name: "John", age: 30}` |
| `function` | Функция | `() => alert("click")` |
| `element` | React элемент | `<div>content</div>` |
| `color` | Цвет | `"#ff0000"`, `"rgb(255,0,0)"` |
| `dimension` | Размер | `"100px"`, `"2rem"`, `"50%"` |
| `resource` | Ресурс | `"/api/image.jpg"`, `"https://..."` |

## 🚀 Как использовать

### Пример UserFace спецификации:

```typescript
const buttonSpec: UserFace = {
  component: 'my-button',
  text: 'Click me!',
  color: '#007AFF',
  dimension: '150px',
  meta: {
    className: 'primary-button',
    theme: 'light',
    style: { 
      borderRadius: '8px',
      fontWeight: 'bold'
    }
  },
  events: {
    click: () => alert('Button clicked!')
  }
};

// Рендеринг
const result = userEngine.renderWithAdapter(buttonSpec, 'react');
```

### Регистрация компонента:

```typescript
// Автоматический анализ и регистрация
userEngine.registerComponent('my-button', MyButtonComponent);

// Или с явной схемой
userEngine.registerComponentWithSchema({
  name: 'my-button',
  component: MyButtonComponent,
  schema: buttonSchema,
  adapterId: 'react'
});
```

## 🧪 Тестирование

Созданы тесты для проверки:

- `src/test/universal-types-test.tsx` - тест универсальных типов
- `src/test/simple-test.tsx` - простой тест работы движка
- `src/test/schema-test.tsx` - тест схем компонентов

## ✅ Что работает

1. **Авторегистрация ReactAdapter** ✅
2. **Валидация универсальных типов** ✅
3. **Обработка метаданных** ✅
4. **Маппинг событий** ✅
5. **Обратная совместимость** ✅

## 🔧 Архитектура

```
UserFace (универсальная спецификация)
    ↓
UserEngine (координатор)
    ↓
ReactAdapter (платформо-специфичный рендерер)
    ↓
React Component (нативный компонент)
```

## 🎯 Следующие шаги

1. **Кэширование схем** - для оптимизации производительности
2. **Метрики** - для мониторинга использования
3. **API для конвертера** - для userface-dev/converter
4. **Другие адаптеры** - Vue, Angular, SwiftUI

## 📝 Примечания

- Все изменения обратно совместимы
- Валидация происходит в режиме предупреждений (не блокирует рендеринг)
- Универсальные типы автоматически маппятся в React пропы
- Метаданные обрабатываются специально (className, style, theme) 