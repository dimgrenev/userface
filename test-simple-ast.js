const { astAnalyzer } = require('./build/index.js');

try {
  console.log('Тестируем AST анализатор...');
  
  const result = astAnalyzer.analyzeCode(`
    interface Props {
      name: string;
      age: number;
    }
    
    const TestComponent = ({ name, age }: Props) => {
      return <div>{name} - {age}</div>;
    };
  `, 'test.tsx');
  
  console.log('Результат:', JSON.stringify(result, null, 2));
  console.log('Ключи результата:', Object.keys(result));
  for (const key of Object.keys(result)) {
    console.log(`result[${key}] =`, result[key], '| typeof:', typeof result[key]);
  }
} catch (error) {
  console.error('Ошибка:', error.message);
  console.error('Стек:', error.stack);
} 