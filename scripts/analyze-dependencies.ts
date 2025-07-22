#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';

interface DependencyAnalysis {
  totalDependencies: number;
  directDependencies: number;
  devDependencies: number;
  peerDependencies: number;
  unusedDependencies: string[];
  outdatedDependencies: string[];
  securityIssues: string[];
  bundleSize: {
    total: number;
    byCategory: Record<string, number>;
  };
}

const analyzeDependencies = (): void => {
  console.log('🔍 Analyzing dependencies...');
  
  const packageJsonPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  const analysis: DependencyAnalysis = {
    totalDependencies: 0,
    directDependencies: 0,
    devDependencies: 0,
    peerDependencies: 0,
    unusedDependencies: [],
    outdatedDependencies: [],
    securityIssues: [],
    bundleSize: {
      total: 0,
      byCategory: {}
    }
  };

  // Подсчитываем зависимости
  analysis.directDependencies = Object.keys(packageJson.dependencies || {}).length;
  analysis.devDependencies = Object.keys(packageJson.devDependencies || {}).length;
  analysis.peerDependencies = Object.keys(packageJson.peerDependencies || {}).length;
  analysis.totalDependencies = analysis.directDependencies + analysis.devDependencies + analysis.peerDependencies;

  // Анализируем размер зависимостей
  const nodeModulesPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../node_modules');
  if (fs.existsSync(nodeModulesPath)) {
    analysis.bundleSize = calculateBundleSize(nodeModulesPath);
  }

  // Проверяем потенциально неиспользуемые зависимости
  analysis.unusedDependencies = findUnusedDependencies(packageJson);

  // Проверяем устаревшие зависимости
  analysis.outdatedDependencies = findOutdatedDependencies(packageJson);

  // Проверяем проблемы безопасности
  analysis.securityIssues = findSecurityIssues(packageJson);

  // Выводим результаты
  console.log('\n📊 Dependency Analysis Results:');
  console.log('================================');
  
  console.log(`\n📦 Dependencies Count:`);
  console.log(`   Direct: ${analysis.directDependencies}`);
  console.log(`   Dev: ${analysis.devDependencies}`);
  console.log(`   Peer: ${analysis.peerDependencies}`);
  console.log(`   Total: ${analysis.totalDependencies}`);

  console.log(`\n📏 Bundle Size:`);
  console.log(`   Total: ${formatBytes(analysis.bundleSize.total)}`);
  Object.entries(analysis.bundleSize.byCategory).forEach(([category, size]) => {
    console.log(`   ${category}: ${formatBytes(size)}`);
  });

  if (analysis.unusedDependencies.length > 0) {
    console.log(`\n⚠️  Potentially Unused Dependencies:`);
    analysis.unusedDependencies.forEach(dep => console.log(`   - ${dep}`));
  }

  if (analysis.outdatedDependencies.length > 0) {
    console.log(`\n🔄 Outdated Dependencies:`);
    analysis.outdatedDependencies.forEach(dep => console.log(`   - ${dep}`));
  }

  if (analysis.securityIssues.length > 0) {
    console.log(`\n🔒 Security Issues:`);
    analysis.securityIssues.forEach(issue => console.log(`   - ${issue}`));
  }

  // Рекомендации
  console.log(`\n💡 Recommendations:`);
  if (analysis.totalDependencies > 50) {
    console.log(`   - Consider reducing dependencies (${analysis.totalDependencies} total)`);
  }
  if (analysis.bundleSize.total > 10 * 1024 * 1024) { // 10MB
    console.log(`   - Bundle size is large (${formatBytes(analysis.bundleSize.total)})`);
  }
  if (analysis.unusedDependencies.length > 0) {
    console.log(`   - Remove unused dependencies to reduce bundle size`);
  }

  // Сохраняем отчет
  const reportPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../reports/dependencies.json');
  const reportDir = path.dirname(reportPath);
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  fs.writeFileSync(reportPath, JSON.stringify(analysis, null, 2));
  console.log(`\n📄 Report saved to: ${reportPath}`);
};

const calculateBundleSize = (nodeModulesPath: string): { total: number; byCategory: Record<string, number> } => {
  const result = { total: 0, byCategory: {} as Record<string, number> };
  
  try {
    const items = fs.readdirSync(nodeModulesPath);
    items.forEach(item => {
      const itemPath = path.join(nodeModulesPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const size = calculateDirectorySize(itemPath);
        result.total += size;
        
        // Категоризируем зависимости
        const category = categorizeDependency(item);
        result.byCategory[category] = (result.byCategory[category] || 0) + size;
      }
    });
  } catch (error) {
    console.warn('Could not analyze node_modules size');
  }
  
  return result;
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

const categorizeDependency = (name: string): string => {
  if (name.startsWith('@types/')) return 'TypeScript Types';
  if (name.includes('react')) return 'React Ecosystem';
  if (name.includes('test') || name.includes('vitest') || name.includes('jest')) return 'Testing';
  if (name.includes('eslint') || name.includes('prettier')) return 'Code Quality';
  if (name.includes('vite') || name.includes('webpack')) return 'Build Tools';
  if (name.includes('crypto') || name.includes('hash')) return 'Security';
  return 'Other';
};

const findUnusedDependencies = (packageJson: any): string[] => {
  const unused: string[] = [];
  const srcPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src');
  
  // Простая проверка импортов в исходном коде
  const dependencies = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {})
  ];
  
  dependencies.forEach(dep => {
    if (!isDependencyUsed(dep, srcPath)) {
      unused.push(dep);
    }
  });
  
  return unused;
};

const isDependencyUsed = (dependency: string, srcPath: string): boolean => {
  try {
    const files = getAllFiles(srcPath);
    const importPattern = new RegExp(`import.*['"]${dependency}['"]|require\\(['"]${dependency}['"]\\)`, 'g');
    
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js')) {
        const content = fs.readFileSync(file, 'utf-8');
        if (importPattern.test(content)) {
          return true;
        }
      }
    }
  } catch (error) {
    // Игнорируем ошибки
  }
  
  return false;
};

const getAllFiles = (dirPath: string): string[] => {
  const files: string[] = [];
  
  try {
    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        files.push(...getAllFiles(itemPath));
      } else {
        files.push(itemPath);
      }
    });
  } catch (error) {
    // Игнорируем ошибки
  }
  
  return files;
};

const findOutdatedDependencies = (packageJson: any): string[] => {
  // Простая проверка версий
  const outdated: string[] = [];
  
  const checkVersion = (deps: Record<string, string>, type: string) => {
    Object.entries(deps).forEach(([name, version]) => {
      if (version.includes('^') || version.includes('~')) {
        // Это диапазон версий, может быть устаревшим
        outdated.push(`${name} (${type})`);
      }
    });
  };
  
  checkVersion(packageJson.dependencies || {}, 'dependencies');
  checkVersion(packageJson.devDependencies || {}, 'devDependencies');
  
  return outdated;
};

const findSecurityIssues = (packageJson: any): string[] => {
  const issues: string[] = [];
  
  // Проверяем известные проблемные зависимости
  const problematicDeps = [
    'lodash', // Может быть большим
    'moment', // Устаревшая библиотека
    'jquery'  // Устаревшая библиотека
  ];
  
  const allDeps = [
    ...Object.keys(packageJson.dependencies || {}),
    ...Object.keys(packageJson.devDependencies || {})
  ];
  
  problematicDeps.forEach(dep => {
    if (allDeps.includes(dep)) {
      issues.push(`${dep} - Consider alternatives`);
    }
  });
  
  return issues;
};

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeDependencies();
} 