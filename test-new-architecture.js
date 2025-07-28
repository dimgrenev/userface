import { engine } from './build/index.js';

console.log('=== ТЕСТ НОВОЙ АРХИТЕКТУРЫ USERFACE ENGINE ===\n');

// Тест 1: Проверка создания Engine
console.log('1. Проверка создания Engine...');
try {
  console.log('✅ Engine создан успешно');
  console.log('Статистика:', engine.getStats());
} catch (error) {
  console.log('❌ Ошибка создания Engine:', error.message);
}

// Тест 2: Регистрация компонента
console.log('\n2. Регистрация компонента...');
try {
  const TestComponent = (props) => ({ type: 'div', props });
  await engine.registerComponent('test-button', TestComponent);
  console.log('✅ Компонент зарегистрирован');
} catch (error) {
  console.log('❌ Ошибка регистрации компонента:', error.message);
}

// Тест 3: Получение компонента
console.log('\n3. Получение компонента...');
try {
  const component = engine.getComponent('test-button');
  if (component) {
    console.log('✅ Компонент получен');
  } else {
    console.log('❌ Компонент не найден');
  }
} catch (error) {
  console.log('❌ Ошибка получения компонента:', error.message);
}

// Тест 4: Data Layer
console.log('\n4. Тест Data Layer...');
try {
  engine.registerDataSource('/api/test', {
    type: 'api',
    url: 'https://jsonplaceholder.typicode.com/posts/1'
  });
  console.log('✅ Data source зарегистрирован');
  
  const data = await engine.getData('/api/test');
  console.log('✅ Данные получены:', data ? 'успешно' : 'пусто');
} catch (error) {
  console.log('❌ Ошибка Data Layer:', error.message);
}

// Тест 5: Рендеринг
console.log('\n5. Тест рендеринга...');
try {
  // Регистрируем простой адаптер
  const simpleAdapter = {
    id: 'simple',
    render: (spec) => ({ type: 'div', props: spec })
  };
  engine.registerAdapter(simpleAdapter);
  
  const userFace = {
    component: 'test-button',
    text: 'Click me!',
    onClick: () => console.log('clicked')
  };
  
  const result = await engine.render(userFace, 'simple');
  console.log('✅ Рендеринг выполнен:', result ? 'успешно' : 'пусто');
} catch (error) {
  console.log('❌ Ошибка рендеринга:', error.message);
}

// Тест 6: Плагины
console.log('\n6. Тест плагинов...');
try {
  const testPlugin = {
    id: 'test-plugin',
    name: 'Test Plugin',
    type: 'custom',
    version: '1.0.0',
    install: async () => console.log('Plugin installed'),
    uninstall: async () => console.log('Plugin uninstalled'),
    enable: async () => console.log('Plugin enabled'),
    disable: async () => console.log('Plugin disabled')
  };
  
  await engine.registerPlugin(testPlugin);
  console.log('✅ Плагин зарегистрирован');
  
  const plugins = engine.getActivePlugins();
  console.log('✅ Активные плагины:', plugins.length);
} catch (error) {
  console.log('❌ Ошибка плагинов:', error.message);
}

// Тест 7: Тестирование
console.log('\n7. Тест тестирования...');
try {
  const results = await engine.runAllTests();
  console.log('✅ Тесты выполнены:', results ? results.length : 0, 'результатов');
} catch (error) {
  console.log('❌ Ошибка тестирования:', error.message);
}

console.log('\n=== ТЕСТ ЗАВЕРШЕН ===');
console.log('Итоговая статистика:', engine.getStats()); 