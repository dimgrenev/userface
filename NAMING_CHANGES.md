# Переименования в UserFace Core

## 🎯 Цель переименований

Улучшить читаемость и понятность кода:
- Более короткие и понятные названия
- Лучшее отражение сути компонентов
- Подчеркивание роли рендеринга

## ✅ Что переименовано

### 1. **UnifiedRegistry → reestr**
```typescript
// Было
export class UnifiedRegistry { ... }
export const unifiedRegistry = new UnifiedRegistry();

// Стало
export class reestr { ... }
export const unifiedRegistry = new reestr();
```

**Причины:**
- ✅ Короткое и понятное название
- ✅ Отражает суть (реестр компонентов)
- ✅ Легче произносить и писать
- ✅ Соответствует русскому названию

### 2. **PlatformAdapter → RenderPlatform**
```typescript
// Было
export interface PlatformAdapter {
  id: Platform;
  render(spec: UserFace): any;
  // ...
}

// Стало
export interface RenderPlatform {
  id: Platform;
  render(spec: UserFace): any;
  // ...
}
```

**Причины:**
- ✅ Подчеркивает основную функцию (рендеринг)
- ✅ Понятно что это платформа
- ✅ Логично в контексте: `UserFace` → `RendererPlatform` → `Component`
- ✅ Лучше отражает архитектуру

## 🔄 Изменения в файлах

### Переименованные файлы:
- `src/core/UnifiedRegistry.ts` → `src/core/reestr.ts`

### Обновленные импорты:
- `UserEngine.tsx` - импорт из `./reestr`
- `ReactAdapter.tsx` - импорт из `./reestr`
- `index.ts` - экспорт из `./core/reestr`

### Обновленные типы:
- `types.ts` - `PlatformAdapter` → `RenderPlatform`
- Все файлы адаптеров - обновлены интерфейсы
- `ComponentAnalyzer` → `analyzer`
- Объединены `types.ts` и `generated-types.ts`

## 🎯 Результат

### **Архитектура стала понятнее:**
```
UserFace → UserEngine → reestr → RenderPlatform → React Component
```

### **Названия отражают суть:**
- `reestr` - реестр компонентов
- `RenderPlatform` - платформа для рендеринга
- `analyzer` - анализатор компонентов
- `UserEngine` - движок пользовательского интерфейса

### **Код стал читабельнее:**
- Короткие названия
- Понятная терминология
- Логичная архитектура

## 🚀 Следующие шаги

1. **Обновить userface-dev** - адаптировать под новые названия
2. **Документация** - обновить примеры
3. **Тесты** - исправить старые методы в тестах

**Переименования завершены! Код стал понятнее и логичнее.** 🎉 