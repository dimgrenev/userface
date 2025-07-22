#!/usr/bin/env tsx

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Цвета для консоли
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg: string) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  step: (msg: string) => console.log(`${colors.cyan}🔧 ${msg}${colors.reset}`)
};

// Проверка наличия файлов
const checkFiles = () => {
  const requiredFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'src/core/reestr.ts'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Отсутствует обязательный файл: ${file}`);
    }
  }
};

// Проверка покрытия реестра
const checkRegistryCoverage = () => {
  log.step('Проверка покрытия реестра...');
  
  try {
    execSync('npm run check-registry', { stdio: 'inherit' });
    log.success('Покрытие реестра проверено');
  } catch (error) {
    log.error('Ошибка проверки покрытия реестра');
    throw error;
  }
};



// Запуск тестов
const runTests = () => {
  log.step('Запуск тестов...');
  
  try {
    execSync('npm run test', { stdio: 'inherit' });
    log.success('Все тесты прошли успешно');
  } catch (error) {
    log.error('Ошибка выполнения тестов');
    throw error;
  }
};

// Линтинг кода
const runLint = () => {
  log.step('Проверка линтера...');
  
  try {
    execSync('npm run lint', { stdio: 'inherit' });
    log.success('Линтинг прошел успешно');
  } catch (error) {
    log.error('Ошибка линтера');
    throw error;
  }
};

// Сборка проекта
const buildProject = () => {
  log.step('Сборка проекта...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log.success('Проект собран успешно');
  } catch (error) {
    log.error('Ошибка сборки проекта');
    throw error;
  }
};

// Проверка сборки
const checkBuild = () => {
  log.step('Проверка сборки...');
  
  const distFiles = [
    'dist/index.js',
    'dist/index.esm.js',
    'dist/index.d.ts'
  ];

  for (const file of distFiles) {
    if (!fs.existsSync(file)) {
      throw new Error(`Отсутствует файл сборки: ${file}`);
    }
  }
  
  log.success('Сборка проверена');
};

// Публикация пакета (опционально)
const publishPackage = (dryRun: boolean = true) => {
  log.step(`${dryRun ? 'Тестовая публикация' : 'Публикация'} пакета...`);
  
  try {
    const command = dryRun ? 'npm publish --dry-run' : 'npm publish';
    execSync(command, { stdio: 'inherit' });
    log.success(`${dryRun ? 'Тестовая публикация' : 'Публикация'} прошла успешно`);
  } catch (error) {
    log.error(`Ошибка ${dryRun ? 'тестовой публикации' : 'публикации'}`);
    throw error;
  }
};

// Основная функция
const main = async () => {
  const startTime = Date.now();
  
  try {
    log.info('🚀 Запуск полного цикла релиза UserEngine');
    
    // Проверка окружения
    checkFiles();
    
    // Этапы релиза
    checkRegistryCoverage();
    runTests();
    runLint();
    buildProject();
    checkBuild();
    
    // Опциональная публикация
    const args = process.argv.slice(2);
    const shouldPublish = args.includes('--publish');
    const dryRun = args.includes('--dry-run');
    
    if (shouldPublish || dryRun) {
      publishPackage(dryRun);
    } else {
      log.warning('Для публикации используйте --publish или --dry-run');
    }
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    log.success(`🎉 Релиз завершен успешно за ${duration}с`);
    
  } catch (error) {
    log.error(`💥 Ошибка релиза: ${error.message}`);
    process.exit(1);
  }
};

// Обработка аргументов командной строки
const showHelp = () => {
  console.log(`
${colors.bright}Использование:${colors.reset}
  npm run release [опции]

${colors.bright}Опции:${colors.reset}
  --publish     Публиковать пакет в npm
  --dry-run     Тестовая публикация без реальной отправки
  --help        Показать эту справку

${colors.bright}Примеры:${colors.reset}
  npm run release              # Полный цикл без публикации
  npm run release --dry-run    # Полный цикл + тестовая публикация
  npm run release --publish    # Полный цикл + реальная публикация
`);
};

if (process.argv.includes('--help')) {
  showHelp();
  process.exit(0);
}

if (require.main === module) {
  main();
}

export { main as release }; 