# 📋 Функция spec.json в системе UserFace

## 🎯 Что такое spec.json и зачем он нужен

### **spec.json - это метаданные компонента**

`spec.json` файлы **НЕ создаются пользователем вручную**. Они генерируются автоматически системой для описания API компонентов.

## 🔄 Как работает система

### **1. Пользователь создает компонент**
```typescript
// Пользователь создает обычный React компонент
// src/library/UserProfile.tsx
export interface UserProfileProps {
  name: string;
  email: string;
  avatar?: string;
  onEdit?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ name, email, avatar, onEdit }) => {
  return (
    <div className="user-profile">
      <h3>{name}</h3>
      <p>{email}</p>
      {onEdit && <button onClick={onEdit}>Редактировать</button>}
    </div>
  );
};
```

### **2. Система автоматически анализирует компонент**
```typescript
// scripts/generate-types-from-components.ts
const extractPropsFromFile = (filePath: string) => {
  // Анализирует TypeScript код
  // Извлекает интерфейсы пропсов
  // Создает типы автоматически
}
```

### **3. Система может создать spec.json (опционально)**
```typescript
// scripts/generate-specs.ts
const generateSpecJson = (componentPath: string) => {
  // Анализирует TypeScript интерфейс
  // Создает spec.json с метаданными
  // Добавляет описания свойств и событий
}
```

## 📝 Структура spec.json

### **Автоматически генерируемый spec.json:**
```json
{
  "name": "UserProfile",
  "description": "Component for displaying user profile information",
  "properties": [
    {
      "name": "name",
      "type": "string",
      "required": true,
      "description": "User's display name"
    },
    {
      "name": "email", 
      "type": "string",
      "required": true,
      "description": "User's email address"
    },
    {
      "name": "avatar",
      "type": "string",
      "required": false,
      "description": "URL to user's avatar image"
    }
  ],
  "events": [
    {
      "name": "onEdit",
      "description": "Event fired when edit button is clicked"
    }
  ]
}
```

## 🎯 Функции spec.json в системе

### **1. Документация компонентов**
```typescript
// spec.json содержит человекочитаемые описания
const spec = {
  "name": "Button",
  "description": "Interactive button component with multiple variants",
  "properties": [
    {
      "name": "text",
      "type": "string", 
      "description": "Button text content"
    }
  ]
};
```

### **2. Генерация примеров использования**
```typescript
// scripts/generate-interface-spec.ts
const generateInterfaceSpec = (componentSpec) => {
  // Создает JSON спекы с примерами данных
  return {
    id: "button-example",
    component: "button",
    text: "Example text",  // Из spec.json
    variant: "primary"     // Из spec.json
  };
};
```

### **3. Валидация и проверки**
```typescript
// Система может проверять соответствие TypeScript и spec.json
const validateComponent = (tsxPath: string, specPath: string) => {
  const tsProps = extractTypeScriptProps(tsxPath);
  const specProps = JSON.parse(fs.readFileSync(specPath, 'utf-8')).properties;
  
  // Проверяем соответствие
  return tsProps.every(prop => 
    specProps.some(specProp => specProp.name === prop.name)
  );
};
```

### **4. Генерация документации**
```typescript
// Автоматическое создание документации
const generateDocs = (specPath: string) => {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  
  return `
# ${spec.name}

${spec.description}

## Properties

${spec.properties.map(prop => `
### ${prop.name}
- **Type:** ${prop.type}
- **Required:** ${prop.required}
- **Description:** ${prop.description}
`).join('')}
  `;
};
```

## 🔧 Автоматическая генерация spec.json

### **Сценарий 1: Из TypeScript интерфейса**
```typescript
// Система анализирует TypeScript и создает spec.json
const generateSpecFromTypeScript = (tsxPath: string) => {
  const interface = extractInterface(tsxPath);
  
  const spec = {
    name: interface.name,
    properties: interface.properties.map(prop => ({
      name: prop.name,
      type: prop.type,
      required: prop.required,
      description: `Property ${prop.name}`
    }))
  };
  
  return spec;
};
```

### **Сценарий 2: Из существующего spec.json**
```typescript
// Пользователь может отредактировать spec.json вручную
// Система использует обновленные метаданные
const updateSpecFromUser = (specPath: string, userUpdates: any) => {
  const spec = JSON.parse(fs.readFileSync(specPath, 'utf-8'));
  const updatedSpec = { ...spec, ...userUpdates };
  fs.writeFileSync(specPath, JSON.stringify(updatedSpec, null, 2));
};
```

## 💡 Практическое применение

### **1. Автоматическая документация**
```typescript
// Система создает документацию из spec.json
const docs = generateDocsFromSpecs('./src/library');
// Результат: README.md с описанием всех компонентов
```

### **2. Визуальный редактор**
```typescript
// Визуальный редактор использует spec.json для UI
const PropertyPanel = ({ componentName }) => {
  const spec = loadSpec(componentName);
  
  return (
    <div>
      {spec.properties.map(prop => (
        <PropertyField 
          key={prop.name}
          name={prop.name}
          type={prop.type}
          description={prop.description}
        />
      ))}
    </div>
  );
};
```

### **3. Валидация спеков**
```typescript
// Проверка корректности JSON спеков
const validateSpec = (spec: UserFace, componentName: string) => {
  const componentSpec = loadSpec(componentName);
  
  // Проверяем обязательные свойства
  const requiredProps = componentSpec.properties
    .filter(prop => prop.required)
    .map(prop => prop.name);
    
  const missingProps = requiredProps.filter(prop => 
    !(prop in spec)
  );
  
  if (missingProps.length > 0) {
    throw new Error(`Missing required properties: ${missingProps.join(', ')}`);
  }
};
```

## 🎯 Итог

### **spec.json выполняет функции:**

1. **📝 Документация** - человекочитаемые описания компонентов
2. **🎯 Примеры** - генерация готовых JSON спеков для демонстрации
3. **🛡️ Валидация** - проверка корректности данных
4. **🔧 Интеграция** - связь между TypeScript и метаданными
5. **🎨 UI** - данные для визуального редактора

### **Пользователь НЕ создает spec.json вручную:**
- ✅ Система генерирует их автоматически
- ✅ Пользователь может редактировать для улучшения документации
- ✅ spec.json дополняет TypeScript типы, а не заменяет их

**spec.json - это метаданные для экосистемы, а не обязательная часть для работы!** 🚀 