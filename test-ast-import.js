try {
  console.log('Пробуем импортировать ast-analyzer...');
  const { astAnalyzer } = require('./engine/ast-analyzer');
  console.log('astAnalyzer импортирован:', !!astAnalyzer);
} catch (error) {
  console.error('Ошибка импорта ast-analyzer:', error.message);
} 