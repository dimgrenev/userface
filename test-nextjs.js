// Имитируем Next.js окружение
global.NextApiRequest = class {};
global.NextApiResponse = class {};

// Имитируем импорт как в Next.js
const { astAnalyzer } = require('./build/index.js');

console.log('Testing in Next.js-like environment...');
console.log('astAnalyzer type:', typeof astAnalyzer);

try {
  const result = astAnalyzer.analyzeComponent({}, 'TestComponent');
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
} 