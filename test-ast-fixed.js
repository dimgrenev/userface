const { astAnalyzer } = require('./build/index.js');

try {
  console.log('Тестируем исправленный AST анализатор...');
  
  const result = astAnalyzer.analyzeCode(`
    interface Props {
      name: string;
      age: number;
    }
    
    const TestComponent = ({ name, age }: Props) => {
      return <div>{name} - {age}</div>;
    };
  `, 'test.tsx');
  
  console.log('✅ Результат:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Ошибка:', error.message);
  console.error('📄 Стек:', error.stack);
} 