# UserFace — декларативный движок UI

UserFace — это движок для декларативного рендеринга UI и CLI для работы с библиотеками компонентов. В пакете userface нет ни одной библиотеки компонентов, только ядро, генераторы, анализаторы и CLI.

## Структура пакета

```
userface/
├── dist/                    # Сборка движка для npm (js, d.ts)
├── scripts/                 # CLI-утилиты (init, add, sync, remove, gen и т.д.)
├── src/                     # Исходники движка (core, types, utils)
├── test/                    # Тесты движка (vitest)
├── package.json
├── README.md
├── vitest.config.ts
├── tsconfig.json
├── .npmignore
└── LICENSE
```

## CLI-команды

- `npx userface init` — создаёт папку userface/ в корне проекта, предлагает скопировать найденные библиотеки (например, feld) в userface/library/.
- `npx userface add <lib>` — копирует/синхронизирует библиотеку из node_modules в userface/library/<lib>.
- `npx userface remove <lib>` — удаляет библиотеку из userface/library/.
- `npx userface sync` — сканирует node_modules и userface/library, предлагает обновить/добавить новые библиотеки.
- `npx userface gen` — генерирует типы, спеки, документацию для всех компонентов в userface/library.

## Как это работает

1. Устанавливаете userface и нужные библиотеки компонентов (например, feld):
   ```bash
   npm install userface feld
   ```
2. Инициализируете userface:
   ```bash
   npx userface init
   ```
3. Добавляете библиотеки:
   ```bash
   npx userface add feld
   ```
4. Генерируете типы и спеки:
   ```bash
   npx userface gen
   ```
5. Используете компоненты и спеки в своем проекте через userface/library.

## Важно
- В пакете userface нет компонентов и спеков — только движок и инструменты.
- Все компоненты и спеки — только в userface/library в проекте пользователя.
- Тесты в пакете — только для движка и CLI, не для компонентов.

## Лицензия
MIT 