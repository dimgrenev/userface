#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface PerformanceAnalysis {
  componentCount: number;
  averageComponentSize: number;
  largestComponents: Array<{ name: string; size: number; lines: number }>;
  complexComponents: Array<{ name: string; complexity: number; issues: string[] }>;
  renderPerformance: {
    estimatedRenderTime: number;
    memoryUsage: number;
    optimizationOpportunities: string[];
  };
  recommendations: string[];
}

const analyzePerformance = (): void => {
  console.log('⚡ Analyzing performance...');
  
  const libraryPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src/library');
  
  const analysis: PerformanceAnalysis = {
    componentCount: 0,
    averageComponentSize: 0,
    largestComponents: [],
    complexComponents: [],
    renderPerformance: {
      estimatedRenderTime: 0,
      memoryUsage: 0,
      optimizationOpportunities: []
    },
    recommendations: []
  };

  if (fs.existsSync(libraryPath)) {
    const components = scanComponents(libraryPath);
    analysis.componentCount = components.length;
    
    // Анализируем каждый компонент
    components.forEach(component => {
      const componentAnalysis = analyzeComponent(component);
      
      // Добавляем в список крупных компонентов
      if (componentAnalysis.size > 1000) { // > 1KB
        analysis.largestComponents.push({
          name: component.name,
          size: componentAnalysis.size,
          lines: componentAnalysis.lines
        });
      }
      
      // Добавляем в список сложных компонентов
      if (componentAnalysis.complexity > 10) {
        analysis.complexComponents.push({
          name: component.name,
          complexity: componentAnalysis.complexity,
          issues: componentAnalysis.issues
        });
      }
      
      // Подсчитываем общую статистику
      analysis.averageComponentSize += componentAnalysis.size;
      analysis.renderPerformance.estimatedRenderTime += componentAnalysis.estimatedRenderTime;
      analysis.renderPerformance.memoryUsage += componentAnalysis.memoryUsage;
    });
    
    // Вычисляем средние значения
    if (analysis.componentCount > 0) {
      analysis.averageComponentSize /= analysis.componentCount;
      analysis.renderPerformance.estimatedRenderTime /= analysis.componentCount;
      analysis.renderPerformance.memoryUsage /= analysis.componentCount;
    }
    
    // Сортируем списки
    analysis.largestComponents.sort((a, b) => b.size - a.size);
    analysis.complexComponents.sort((a, b) => b.complexity - a.complexity);
    
    // Генерируем рекомендации
    generatePerformanceRecommendations(analysis);
  }

  // Выводим результаты
  console.log('\n⚡ Performance Analysis Results:');
  console.log('=================================');
  
  console.log(`\n📊 Component Statistics:`);
  console.log(`   Total Components: ${analysis.componentCount}`);
  console.log(`   Average Size: ${formatBytes(analysis.averageComponentSize)}`);
  console.log(`   Estimated Render Time: ${analysis.renderPerformance.estimatedRenderTime.toFixed(2)}ms`);
  console.log(`   Memory Usage: ${formatBytes(analysis.renderPerformance.memoryUsage)}`);

  if (analysis.largestComponents.length > 0) {
    console.log(`\n🔝 Largest Components:`);
    analysis.largestComponents.slice(0, 5).forEach(comp => {
      console.log(`   ${comp.name}: ${formatBytes(comp.size)} (${comp.lines} lines)`);
    });
  }

  if (analysis.complexComponents.length > 0) {
    console.log(`\n🧩 Complex Components:`);
    analysis.complexComponents.slice(0, 5).forEach(comp => {
      console.log(`   ${comp.name}: Complexity ${comp.complexity}`);
      comp.issues.forEach(issue => console.log(`     - ${issue}`));
    });
  }

  if (analysis.renderPerformance.optimizationOpportunities.length > 0) {
    console.log(`\n🎯 Optimization Opportunities:`);
    analysis.renderPerformance.optimizationOpportunities.forEach(opp => {
      console.log(`   - ${opp}`);
    });
  }

  if (analysis.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    analysis.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }

  // Сохраняем отчет
  const reportPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../reports/performance.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
};

interface ComponentInfo {
  name: string;
  filePath: string;
  content: string;
}

interface ComponentAnalysis {
  size: number;
  lines: number;
  complexity: number;
  issues: string[];
  estimatedRenderTime: number;
  memoryUsage: number;
}

const scanComponents = (libraryPath: string): ComponentInfo[] => {
  const components: ComponentInfo[] = [];
  
  const scanDir = (dir: string): void => {
    try {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const itemPath = path.join(dir, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          scanDir(itemPath);
        } else if (item.endsWith('.tsx')) {
          const name = path.basename(item, '.tsx');
          const content = fs.readFileSync(itemPath, 'utf-8');
          components.push({ name, filePath: itemPath, content });
        }
      });
    } catch (error) {
      console.warn(`Could not scan directory: ${dir}`);
    }
  };
  
  scanDir(libraryPath);
  return components;
};

const analyzeComponent = (component: ComponentInfo): ComponentAnalysis => {
  const { content } = component;
  const lines = content.split('\n').length;
  const size = Buffer.byteLength(content, 'utf8');
  
  // Анализируем сложность
  const complexity = calculateComplexity(content);
  const issues = findIssues(content);
  
  // Оцениваем производительность рендеринга
  const estimatedRenderTime = estimateRenderTime(content, complexity);
  const memoryUsage = estimateMemoryUsage(content, size);
  
  return {
    size,
    lines,
    complexity,
    issues,
    estimatedRenderTime,
    memoryUsage
  };
};

const calculateComplexity = (content: string): number => {
  let complexity = 1; // Базовая сложность
  
  // Увеличиваем сложность за условные конструкции
  const conditionals = (content.match(/if\s*\(|else\s*{|switch\s*\(|case\s+/g) || []).length;
  complexity += conditionals * 1;
  
  // Увеличиваем сложность за циклы
  const loops = (content.match(/for\s*\(|while\s*\(|map\s*\(|filter\s*\(|reduce\s*\(/g) || []).length;
  complexity += loops * 2;
  
  // Увеличиваем сложность за вложенные функции
  const nestedFunctions = (content.match(/=>\s*{|function\s*\(/g) || []).length;
  complexity += nestedFunctions * 1;
  
  // Увеличиваем сложность за состояние
  const stateUsage = (content.match(/useState|useEffect|useContext|useReducer/g) || []).length;
  complexity += stateUsage * 1;
  
  return complexity;
};

const findIssues = (content: string): string[] => {
  const issues: string[] = [];
  
  // Проверяем на потенциальные проблемы производительности
  if (content.includes('useEffect') && content.includes('[]')) {
    issues.push('Empty dependency array in useEffect');
  }
  
  if (content.includes('useState') && content.includes('useEffect')) {
    issues.push('State updates in useEffect may cause re-renders');
  }
  
  if (content.includes('map') && content.includes('key=')) {
    issues.push('Check for proper key props in lists');
  }
  
  if (content.includes('onClick') && content.includes('() =>')) {
    issues.push('Inline functions may cause re-renders');
  }
  
  if (content.includes('useMemo') || content.includes('useCallback')) {
    issues.push('Memoization detected - verify dependencies');
  }
  
  if (content.includes('console.log')) {
    issues.push('Console.log statements in production code');
  }
  
  return issues;
};

const estimateRenderTime = (content: string, complexity: number): number => {
  // Простая оценка времени рендеринга на основе сложности
  let baseTime = 1; // 1ms базовая скорость
  
  // Увеличиваем время за сложность
  baseTime += complexity * 0.5;
  
  // Увеличиваем время за количество JSX элементов
  const jsxElements = (content.match(/<[A-Z][a-zA-Z]*/g) || []).length;
  baseTime += jsxElements * 0.1;
  
  // Увеличиваем время за обработчики событий
  const eventHandlers = (content.match(/on[A-Z][a-zA-Z]*/g) || []).length;
  baseTime += eventHandlers * 0.2;
  
  return baseTime;
};

const estimateMemoryUsage = (content: string, size: number): number => {
  // Оценка использования памяти
  let memoryUsage = size; // Базовое использование памяти = размер файла
  
  // Увеличиваем за состояние
  const stateHooks = (content.match(/useState|useReducer/g) || []).length;
  memoryUsage += stateHooks * 100; // ~100 bytes per state
  
  // Увеличиваем за эффекты
  const effectHooks = (content.match(/useEffect/g) || []).length;
  memoryUsage += effectHooks * 50; // ~50 bytes per effect
  
  // Увеличиваем за контекст
  const contextHooks = (content.match(/useContext/g) || []).length;
  memoryUsage += contextHooks * 200; // ~200 bytes per context
  
  return memoryUsage;
};

const generatePerformanceRecommendations = (analysis: PerformanceAnalysis): void => {
  const { componentCount, averageComponentSize, complexComponents, renderPerformance } = analysis;
  
  // Рекомендации по количеству компонентов
  if (componentCount > 50) {
    analysis.recommendations.push('Large number of components, consider code splitting');
  }
  
  // Рекомендации по размеру компонентов
  if (averageComponentSize > 5000) { // 5KB
    analysis.recommendations.push('Components are large on average, consider splitting');
  }
  
  // Рекомендации по сложности
  if (complexComponents.length > 0) {
    analysis.recommendations.push(`${complexComponents.length} complex components detected, consider refactoring`);
  }
  
  // Рекомендации по производительности рендеринга
  if (renderPerformance.estimatedRenderTime > 5) {
    analysis.recommendations.push('Slow render times detected, optimize component logic');
  }
  
  if (renderPerformance.memoryUsage > 1024 * 1024) { // 1MB
    analysis.recommendations.push('High memory usage, check for memory leaks');
  }
  
  // Рекомендации по оптимизации
  analysis.recommendations.push('Consider using React.memo for expensive components');
  analysis.recommendations.push('Use useCallback for event handlers to prevent re-renders');
  analysis.recommendations.push('Implement lazy loading for large component trees');
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzePerformance();
} 