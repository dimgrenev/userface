# UserFace - Universal UI Engine

Универсальный движок для рендеринга UI компонентов с поддержкой мультиплатформенности через адаптеры.

## 🚀 Возможности

- **Универсальный движок** - один API для всех платформ
- **Адаптерная архитектура** - легко добавлять новые платформы
- **Автогенерация типов** - TypeScript типы из компонентов
- **Автогенерация спецификаций** - JSON спецификации из компонентов
- **Обратная совместимость** - старый код работает без изменений

## 📦 Установка

```bash
npm install userface
```

## 🎯 Быстрый старт

### Базовое использование

```typescript
import { userEngine, UserRenderer, ButtonSpec } from 'userface';

// Регистрация компонента
userEngine.registerComponent('my-button', MyButton);

// Создание спецификации
const buttonSpec: ButtonSpec = {
  component: 'button',
  text: 'Click me!',
  variant: 'primary',
  events: {
    click: () => console.log('Button clicked!')
  }
};

// Рендеринг
<UserRenderer face={buttonSpec} />
```

### Автогенерация типов

```bash
# Генерация TypeScript типов из компонентов
npm run generate-types ./components ./src/types.ts

# Генерация JSON спецификаций
npm run generate-specs ./components ./specs
```

### Использование сгенерированных типов

```typescript
import { createSpec, ButtonSpec, TextSpec } from 'userface';

// Type-safe создание спецификаций
const button = createSpec<ButtonSpec>({
  component: 'button',
  text: 'Hello',
  variant: 'primary'
});

const text = createSpec<TextSpec>({
  component: 'text',
  text: 'Sample text',
  variant: 'body-primary'
});
```

## 🔧 Адаптеры

### React адаптер (по умолчанию)

```typescript
import { reactAdapter, UserRenderer } from 'userface';

// Автоматически зарегистрирован
console.log(reactAdapter.getRegisteredComponents());

// Рендеринг через конкретный адаптер
const element = userEngine.renderWithAdapter(spec, 'react');
```

### Создание нового адаптера

```typescript
import { PlatformAdapter, UserFace } from 'userface';

class VueAdapter implements PlatformAdapter {
  id = 'vue';
  
  meta = {
    name: 'Vue Adapter',
    version: '1.0.0',
    platform: 'vue'
  };

  render(spec: UserFace): any {
    // Vue-специфичная логика рендеринга
    return createVueComponent(spec);
  }

  // ... остальные методы
}

// Регистрация адаптера
userEngine.registerAdapter(new VueAdapter());
```

## 📝 API

### UserEngine

```typescript
// Обратная совместимость
userEngine.registerComponent(name, component);
userEngine.getComponent(name);
userEngine.getRegisteredComponents();

// Новые методы
userEngine.registerAdapter(adapter);
userEngine.renderWithAdapter(spec, adapterId);
userEngine.renderWithAllAdapters(spec);
```

### ComponentRegistry

```typescript
import { componentRegistry } from 'userface';

// Регистрация
componentRegistry.register('button', ButtonComponent);

// Получение
const component = componentRegistry.get('button');

// Статистика
const stats = componentRegistry.getStats();
```

## 🛠️ Разработка

### Генерация типов и спецификаций

```bash
# Установка зависимостей
npm install

# Генерация типов из компонентов feld
npm run generate-types ../feld src/core/generated-types.ts

# Генерация спецификаций
npm run generate-specs ../feld ./generated-specs

# Сборка
npm run build
```

### Структура проекта

```
userface/
├── src/
│   ├── core/
│   │   ├── UserEngine.tsx      # Основной движок
│   │   ├── types.ts           # Базовые типы
│   │   ├── reestr.ts          # Реестр компонентов
│   │   ├── generated-types.ts # Автогенерированные типы
│   │   └── adapters/
│   │       ├── ReactAdapter.tsx
│   │       └── index.ts
│   └── index.ts
├── scripts/
│   ├── generate-types.ts      # Генератор типов
│   └── generate-specs.ts      # Генератор спецификаций
└── package.json
```

## 🎨 Примеры

### Комплексный пример

```typescript
import { userEngine, UserRenderer, createSpec, ButtonSpec, FormSpec } from 'userface';

// Регистрация компонентов
userEngine.registerComponents({
  button: MyButton,
  form: MyForm,
  input: MyInput
});

// Создание формы
const formSpec: FormSpec = createSpec({
  component: 'form',
  events: {
    submit: (data) => console.log('Form submitted:', data)
  },
  children: [
    createSpec<ButtonSpec>({
      component: 'button',
      text: 'Submit',
      variant: 'primary'
    })
  ]
});

// Рендеринг
<UserRenderer face={formSpec} />
```

## 🔄 Миграция

### С версии 1.0.5

- ✅ Обратная совместимость сохранена
- ✅ Старые методы `registerComponent` работают
- ✅ Новые возможности доступны опционально

### Новые возможности

- Автогенерация типов из компонентов
- Автогенерация JSON спецификаций
- Улучшенная архитектура адаптеров
- Единый реестр компонентов

## 📄 Лицензия

MIT 