# История изменений

## [1.0.0] - 2025-07-20

### Добавлено
- ✅ Автоматическая генерация типов из компонентов в папке `src/library/`
- ✅ Система сканирования TypeScript файлов и извлечения интерфейсов
- ✅ Автоматическая регистрация компонентов в реестре
- ✅ Watch режим для автоматической регенерации типов
- ✅ Полная поддержка TypeScript с автокомплитом и валидацией
- ✅ Интеграция с внешними библиотеками компонентов (feld)

### Изменено
- 🔄 Переименована папка `src/components/` в `src/library/`
- 🔄 Обновлены все скрипты и документация для работы с новой структурой
- 🔄 README полностью переведен на русский язык

### Структура проекта
```
userface/
├── src/
│   ├── library/              # 🎯 Библиотека компонентов
│   │   ├── Button.tsx       # ✅ Автоматически регистрируется
│   │   ├── Card.tsx         # ✅ Автоматически регистрируется
│   │   └── index.ts         # ✅ Автогенерируемые экспорты
│   ├── core/
│   │   ├── reestr.ts        # ✅ Автогенерируемый реестр
│   │   └── generated-types.ts # ✅ Автогенерируемые типы
│   └── index.ts
└── scripts/
    └── generate-types-from-components.ts # 🔧 Скрипт генерации
```

### Использование
```typescript
// 1. Добавьте компонент в src/library/
export interface ButtonProps {
  text: string;
  variant?: 'primary' | 'secondary';
}

export const Button: React.FC<ButtonProps> = ({ text, variant }) => (
  <button className={`btn btn-${variant}`}>{text}</button>
);

// 2. Типы генерируются автоматически!
const spec: UserFace = {
  id: 'my-button',
  component: 'button', // ✅ TypeScript автодополнение
  text: 'Нажми меня',  // ✅ TypeScript валидация
  variant: 'primary'   // ✅ TypeScript проверка значений
};
``` 