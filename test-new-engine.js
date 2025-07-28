import { Engine, EngineFactory, engine } from './build/index.js';

console.log('=== ТЕСТ НОВОЙ ENGINE АРХИТЕКТУРЫ ===\n');

// Тест 1: Проверка создания Engine через Factory
console.log('1. Проверка создания Engine через Factory...');
try {
  const newEngine = EngineFactory.createEngine();
  console.log('✅ Engine создан через Factory');
  console.log('Тип Engine:', typeof newEngine);
  console.log('Методы Engine:', Object.getOwnPropertyNames(Object.getPrototypeOf(newEngine)).slice(0, 10));
} catch (error) {
  console.log('❌ Ошибка создания Engine через Factory:', error.message);
}

// Тест 2: Проверка глобального Engine
console.log('\n2. Проверка глобального Engine...');
try {
  console.log('✅ Глобальный Engine доступен');
  console.log('Тип глобального Engine:', typeof engine);
  console.log('Методы глобального Engine:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)).slice(0, 10));
} catch (error) {
  console.log('❌ Ошибка глобального Engine:', error.message);
}

// Тест 3: Регистрация компонента через новый Engine
console.log('\n3. Регистрация компонента через новый Engine...');
try {
  const TestComponent = (props) => ({ type: 'div', props });
  await engine.registerComponent('test-button-new', TestComponent);
  console.log('✅ Компонент зарегистрирован через новый Engine');
} catch (error) {
  console.log('❌ Ошибка регистрации компонента:', error.message);
}

// Тест 4: Получение компонента через новый Engine
console.log('\n4. Получение компонента через новый Engine...');
try {
  const component = engine.getComponent('test-button-new');
  if (component) {
    console.log('✅ Компонент получен через новый Engine');
  } else {
    console.log('❌ Компонент не найден');
  }
} catch (error) {
  console.log('❌ Ошибка получения компонента:', error.message);
}

// Тест 5: Data Layer через новый Engine
console.log('\n5. Data Layer через новый Engine...');
try {
  engine.registerDataSource('/api/test-new', {
    type: 'api',
    url: 'https://jsonplaceholder.typicode.com/posts/1'
  });
  console.log('✅ Data source зарегистрирован через новый Engine');
  
  const data = await engine.getData('/api/test-new');
  console.log('✅ Данные получены через новый Engine:', data ? 'успешно' : 'пусто');
} catch (error) {
  console.log('❌ Ошибка Data Layer:', error.message);
}

// Тест 6: Рендеринг через новый Engine
console.log('\n6. Рендеринг через новый Engine...');
try {
  const userFace = {
    component: 'test-button-new',
    text: 'Click me!',
    onClick: () => console.log('clicked')
  };
  
  const result = await engine.render(userFace, 'simple');
  console.log('✅ Рендеринг выполнен через новый Engine:', result ? 'успешно' : 'пусто');
} catch (error) {
  console.log('❌ Ошибка рендеринга:', error.message);
}

// Тест 7: Плагины через новый Engine
console.log('\n7. Плагины через новый Engine...');
try {
  const testPlugin = {
    id: 'test-plugin-new',
    name: 'Test Plugin New',
    type: 'custom',
    version: '1.0.0',
    install: async () => console.log('Plugin installed'),
    uninstall: async () => console.log('Plugin uninstalled'),
    enable: async () => console.log('Plugin enabled'),
    disable: async () => console.log('Plugin disabled')
  };
  
  await engine.registerPlugin(testPlugin);
  console.log('✅ Плагин зарегистрирован через новый Engine');
  
  const plugins = engine.getActivePlugins();
  console.log('✅ Активные плагины через новый Engine:', plugins.length);
} catch (error) {
  console.log('❌ Ошибка плагинов:', error.message);
}

// Тест 8: Тестирование через новый Engine
console.log('\n8. Тестирование через новый Engine...');
try {
  const results = await engine.runAllTests();
  console.log('✅ Тесты выполнены через новый Engine:', results.length, 'результатов');
} catch (error) {
  console.log('❌ Ошибка тестирования:', error.message);
}

console.log('\n=== ТЕСТ ЗАВЕРШЕН ==='); 