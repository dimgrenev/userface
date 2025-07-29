const { astAnalyzer } = require('./build/index.js');

console.log('Testing astAnalyzer import...');
console.log('astAnalyzer type:', typeof astAnalyzer);
console.log('astAnalyzer:', astAnalyzer);

try {
  const result = astAnalyzer.analyzeComponent({}, 'TestComponent');
  console.log('Result:', result);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
} 