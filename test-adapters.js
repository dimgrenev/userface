import { engine } from './build/index.esm.js';

console.log('=== ТЕСТ АДАПТЕРОВ И ПЛАГИНОВ ===\n');

// 1. Проверяем глобальный Engine
console.log('1. Проверка глобального Engine...');
console.log('✅ Глобальный Engine доступен');
console.log('Тип Engine:', typeof engine);
console.log('Методы Engine:', Object.getOwnPropertyNames(Object.getPrototypeOf(engine)).filter(name => name !== 'constructor'));

// 2. Проверяем плагины
console.log('\n2. Проверка плагинов...');
const allPlugins = engine.getAllPlugins();
console.log('Все плагины:', allPlugins.length);
allPlugins.forEach(plugin => {
  console.log(`- ${plugin.name} (${plugin.id}) - ${plugin.type}`);
});

const activePlugins = engine.getActivePlugins();
console.log('Активные плагины:', activePlugins.length);
activePlugins.forEach(plugin => {
  console.log(`- ${plugin.name} (${plugin.id}) - ${plugin.type}`);
});

// 3. Проверяем адаптеры
console.log('\n3. Проверка адаптеров...');
const allAdapters = engine.getAllAdapters();
console.log('Все адаптеры:', allAdapters.length);
allAdapters.forEach(adapter => {
  console.log(`- ${adapter.id} (${adapter.meta?.name || 'Unknown'})`);
});

// 4. Регистрируем тестовый компонент
console.log('\n4. Регистрация тестового компонента...');
const testComponent = {
  name: 'TestButton',
  render: (props) => `<button>${props.text || 'Click me'}</button>`
};

await engine.registerComponent('TestButton', testComponent, {
  name: 'TestButton',
  platform: 'universal',
  props: [
    { name: 'text', type: 'text', required: false }
  ],
  events: []
});

console.log('✅ Тестовый компонент зарегистрирован');

// 5. Тестируем рендеринг через разные адаптеры
console.log('\n5. Тестирование рендеринга...');

const testFace = {
  component: 'TestButton',
  text: 'Hello from Engine!'
};

try {
  // Пробуем рендерить через каждый адаптер
  for (const adapter of allAdapters) {
    console.log(`Тестируем адаптер: ${adapter.id}`);
    
    if (adapter.validateSpec && adapter.validateSpec(testFace)) {
      console.log(`✅ ${adapter.id} - валидация прошла`);
      
      try {
        const result = adapter.render(testFace);
        console.log(`✅ ${adapter.id} - рендеринг успешен:`, typeof result);
      } catch (error) {
        console.log(`❌ ${adapter.id} - ошибка рендеринга:`, error.message);
      }
    } else {
      console.log(`❌ ${adapter.id} - валидация не прошла`);
    }
  }
} catch (error) {
  console.log('❌ Ошибка при тестировании рендеринга:', error.message);
}

console.log('\n=== ТЕСТ ЗАВЕРШЕН ==='); 