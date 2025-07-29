const { astAnalyzer } = require('./build/index.js');

console.log('Testing new AST analyzer...');
console.log('astAnalyzer type:', typeof astAnalyzer);

const testComponent = {
  name: 'TestComponent',
  code: `
import React from 'react';

interface TestProps {
  id?: string;
  value: string;
  disabled?: boolean;
  options: string[];
  onChange?: (value: string) => void;
}

export const TestComponent: React.FC<TestProps> = ({ 
  id, 
  value, 
  disabled = false, 
  options, 
  onChange 
}) => {
  return <div>Test</div>;
};
`
};

try {
  const result = astAnalyzer.analyzeComponent(testComponent, 'TestComponent');
  console.log('✅ AST Analysis Result:', JSON.stringify(result, null, 2));
} catch (error) {
  console.error('❌ Error:', error.message);
  console.error('Stack:', error.stack);
} 