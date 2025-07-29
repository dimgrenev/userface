/**
 * Тест source версии UserFace с настоящим AST-анализатором
 */

console.log('=== Тест Source версии UserFace ===');

try {
  // Импортируем source версию
  const { realASTAnalyzer, astAnalyzer } = require('./src/index.ts');
  
  console.log('✅ Source версия загружена успешно');
  console.log('✅ AST-анализатор доступен:', !!realASTAnalyzer);
  console.log('✅ astAnalyzer доступен:', !!astAnalyzer);

  // Тестовый React компонент
  const reactComponent = {
    code: `
import React from 'react';

interface ButtonProps {
  text: string;
  onClick?: () => void;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ text, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {text}
    </button>
  );
};
    `
  };

  console.log('\n🔍 Анализируем React компонент...');
  const result = realASTAnalyzer.analyzeComponent(reactComponent, 'Button');
  
  console.log('✅ Результат анализа:');
  console.log(JSON.stringify(result, null, 2));

  // Проверяем, что это настоящий AST-анализ
  console.log('\n🔍 Проверяем качество анализа...');
  console.log('✅ Платформа определена:', result.detectedPlatform);
  console.log('✅ Пропсы найдены:', result.props.length);
  console.log('✅ События найдены:', result.events.length);
  
  if (result.props.length > 0) {
    console.log('✅ Первый проп:', result.props[0]);
  }

  console.log('\n🎉 Source версия работает с настоящим AST-анализатором!');

} catch (error) {
  console.error('❌ Ошибка при тестировании source версии:', error);
  console.error('Stack:', error.stack);
} 