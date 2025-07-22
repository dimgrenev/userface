#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface SizeAnalysis {
  totalSize: number;
  byFile: Record<string, number>;
  byDirectory: Record<string, number>;
  byType: Record<string, number>;
  largestFiles: Array<{ file: string; size: number; percentage: number }>;
  recommendations: string[];
}

const analyzeSize = (): void => {
  console.log('📏 Analyzing library size...');
  
  const srcPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src');
  const distPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist');
  
  const analysis: SizeAnalysis = {
    totalSize: 0,
    byFile: {},
    byDirectory: {},
    byType: {},
    largestFiles: [],
    recommendations: []
  };

  // Анализируем исходный код
  if (fs.existsSync(srcPath)) {
    analyzeDirectory(srcPath, analysis, 'src');
  }

  // Анализируем собранную версию
  if (fs.existsSync(distPath)) {
    analyzeDirectory(distPath, analysis, 'dist');
  }

  // Сортируем файлы по размеру
  analysis.largestFiles = Object.entries(analysis.byFile)
    .map(([file, size]) => ({ file, size, percentage: (size / analysis.totalSize) * 100 }))
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  // Генерируем рекомендации
  generateRecommendations(analysis);

  // Выводим результаты
  console.log('\n📊 Size Analysis Results:');
  console.log('==========================');
  
  console.log(`\n📦 Total Size: ${formatBytes(analysis.totalSize)}`);
  
  console.log(`\n📁 By Directory:`);
  Object.entries(analysis.byDirectory)
    .sort(([,a], [,b]) => b - a)
    .forEach(([dir, size]) => {
      console.log(`   ${dir}: ${formatBytes(size)} (${((size / analysis.totalSize) * 100).toFixed(1)}%)`);
    });

  console.log(`\n📄 By File Type:`);
  Object.entries(analysis.byType)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, size]) => {
      console.log(`   ${type}: ${formatBytes(size)} (${((size / analysis.totalSize) * 100).toFixed(1)}%)`);
    });

  console.log(`\n🔝 Largest Files:`);
  analysis.largestFiles.forEach(({ file, size, percentage }) => {
    console.log(`   ${file}: ${formatBytes(size)} (${percentage.toFixed(1)}%)`);
  });

  if (analysis.recommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    analysis.recommendations.forEach(rec => console.log(`   - ${rec}`));
  }

  // Сохраняем отчет
  const reportPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../reports/size.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
};

const analyzeDirectory = (dirPath: string, analysis: SizeAnalysis, prefix: string): void => {
  try {
    const items = fs.readdirSync(dirPath);
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        // Рекурсивно анализируем подпапки
        analyzeDirectory(itemPath, analysis, `${prefix}/${item}`);
        
        // Подсчитываем размер папки
        const dirSize = calculateDirectorySize(itemPath);
        analysis.byDirectory[`${prefix}/${item}`] = dirSize;
        analysis.totalSize += dirSize;
      } else {
        // Анализируем файл
        const fileSize = stats.size;
        const relativePath = `${prefix}/${item}`;
        
        analysis.byFile[relativePath] = fileSize;
        analysis.totalSize += fileSize;
        
        // Категоризируем по типу файла
        const fileType = getFileType(item);
        analysis.byType[fileType] = (analysis.byType[fileType] || 0) + fileSize;
        
        // Добавляем в размер папки
        const dirName = prefix;
        analysis.byDirectory[dirName] = (analysis.byDirectory[dirName] || 0) + fileSize;
      }
    });
  } catch (error) {
    console.warn(`Could not analyze directory: ${dirPath}`);
  }
};

const calculateDirectorySize = (dirPath: string): number => {
  let totalSize = 0;
  
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        totalSize += calculateDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    });
  } catch (error) {
    // Игнорируем ошибки доступа
  }
  
  return totalSize;
};

const getFileType = (filename: string): string => {
  const ext = path.extname(filename).toLowerCase();
  
  switch (ext) {
    case '.ts':
    case '.tsx':
      return 'TypeScript';
    case '.js':
    case '.jsx':
      return 'JavaScript';
    case '.css':
    case '.scss':
    case '.sass':
      return 'Styles';
    case '.json':
      return 'JSON';
    case '.md':
      return 'Documentation';
    case '.d.ts':
      return 'Type Definitions';
    case '.map':
      return 'Source Maps';
    default:
      return 'Other';
  }
};

const generateRecommendations = (analysis: SizeAnalysis): void => {
  const { totalSize, byType, largestFiles } = analysis;
  
  // Рекомендации по общему размеру
  if (totalSize > 1024 * 1024) { // 1MB
    analysis.recommendations.push('Library size is large (>1MB), consider code splitting');
  }
  
  // Рекомендации по типам файлов
  if (byType['Source Maps'] && byType['Source Maps'] > totalSize * 0.3) {
    analysis.recommendations.push('Source maps take significant space, consider excluding from production');
  }
  
  if (byType['Documentation'] && byType['Documentation'] > totalSize * 0.2) {
    analysis.recommendations.push('Documentation files are large, consider external hosting');
  }
  
  // Рекомендации по отдельным файлам
  largestFiles.forEach(({ file, percentage }) => {
    if (percentage > 20) {
      analysis.recommendations.push(`Large file detected: ${file} (${percentage.toFixed(1)}% of total)`);
    }
  });
  
  // Рекомендации по оптимизации
  if (byType['TypeScript'] > totalSize * 0.5) {
    analysis.recommendations.push('TypeScript files dominate, consider tree-shaking unused code');
  }
  
  if (byType['Styles'] > totalSize * 0.3) {
    analysis.recommendations.push('Styles are significant, consider CSS-in-JS or external CSS');
  }
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeSize();
} 