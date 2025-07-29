console.log('=== Минимальный тест без ts-morph ===');

// Простая функция анализа компонента без ts-morph
function analyzeComponentSimple(code, name) {
  console.log('[MINIMAL] Анализируем компонент:', name);
  
  // Простой анализ на основе регулярных выражений
  const props = [];
  const events = [];
  let platform = 'universal';
  
  // Определяем платформу по ключевым словам
  if (code.includes('React') || code.includes('react')) {
    platform = 'react';
  } else if (code.includes('Vue') || code.includes('vue')) {
    platform = 'vue';
  } else if (code.includes('Angular') || code.includes('angular')) {
    platform = 'angular';
  } else if (code.includes('Svelte') || code.includes('svelte')) {
    platform = 'svelte';
  }
  
  // Ищем пропсы (очень упрощенно)
  const propMatches = code.match(/interface\s+\w+Props\s*\{([^}]+)\}/g);
  if (propMatches) {
    propMatches.forEach(match => {
      const propContent = match.match(/\{([^}]+)\}/)[1];
      const propLines = propContent.split('\n');
      propLines.forEach(line => {
        const propMatch = line.match(/(\w+)\s*\?*\s*:\s*([^;]+)/);
        if (propMatch) {
          props.push({
            name: propMatch[1].trim(),
            type: propMatch[2].trim(),
            required: !line.includes('?')
          });
        }
      });
    });
  }
  
  // Ищем события (очень упрощенно)
  const eventMatches = code.match(/onClick|onChange|onSubmit|onInput/g);
  if (eventMatches) {
    eventMatches.forEach(event => {
      events.push({
        name: event,
        type: 'function'
      });
    });
  }
  
  return {
    name,
    detectedPlatform: platform,
    props,
    events
  };
}

// Тестовый компонент
const testComponent = {
  name: 'TestButton',
  code: `
import React from 'react';

interface TestButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

const TestButton: React.FC<TestButtonProps> = ({ text, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};

export default TestButton;
`
};

try {
  console.log('Запускаем минимальный анализ...');
  const result = analyzeComponentSimple(testComponent.code, testComponent.name);
  
  console.log('✅ Результат анализа:');
  console.log('- Имя:', result.name);
  console.log('- Платформа:', result.detectedPlatform);
  console.log('- Пропсы:', result.props.length);
  console.log('- События:', result.events.length);
  
  console.log('\n📋 Детали пропсов:');
  result.props.forEach(prop => {
    console.log(`  - ${prop.name}: ${prop.type}${prop.required ? '' : ' (опциональный)'}`);
  });
  
  console.log('\n🎯 Детали событий:');
  result.events.forEach(event => {
    console.log(`  - ${event.name}: ${event.type}`);
  });
  
} catch (error) {
  console.error('❌ Ошибка в минимальном тесте:', error.message);
  console.error('Stack:', error.stack);
} 