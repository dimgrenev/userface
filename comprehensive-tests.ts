import { engine } from './engine/engine-factory';
import { Schema } from './engine/schema';
import { Face } from './engine/types';
import { componentAnalyzer } from './engine/analyzer';

export class ComprehensiveTests {
  private testResults: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];

  constructor() {
    // Инициализация тестов
  }

  async runAllTests(): Promise<void> {
    console.log('🧪 Запуск комплексных тестов...');
    
    const tests = [
      { name: 'Registry', fn: () => this.testRegistry() },
      { name: 'Analyzer', fn: () => this.testAnalyzer() },
      { name: 'Integration', fn: () => this.testIntegration() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    this.printResults();
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const start = Date.now();
    try {
      await testFn();
      this.testResults.push({ name, passed: true, duration: Date.now() - start });
      console.log(`✅ ${name} passed`);
    } catch (error) {
      this.testResults.push({ 
        name, 
        passed: false, 
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - start 
      });
      console.log(`❌ ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private printResults(): void {
    console.log('\n📊 Результаты тестов:');
    console.log('='.repeat(50));
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      console.log(`${status} ${result.name} (${duration})`);
      if (!result.passed && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('='.repeat(50));
    console.log(`Итого: ${passed}/${total} тестов прошли`);
  }

  private async testRegistry(): Promise<void> {
    // Регистрируем компонент
    engine.registerComponent('TestButton', () => 'button');
    
    // Проверяем что компонент зарегистрирован
    const component = engine.getComponent('TestButton');
    if (!component) {
      throw new Error('Component not registered');
    }

    // Проверяем схему
    const retrievedSchema = engine.getComponentSchema('TestButton');
    if (!retrievedSchema) {
      throw new Error('Schema not found');
    }
  }

  private async testAnalyzer(): Promise<void> {
    const testComponent = {
      name: 'TestComponent',
      code: `
        import React from 'react';
        
        interface TestProps {
          id: string;
          value: string;
          disabled?: boolean;
          onChange?: (value: string) => void;
        }
        
        export const TestComponent: React.FC<TestProps> = ({ 
          id, 
          value, 
          disabled = false, 
          onChange 
        }) => {
          return <div>Test</div>;
        };
      `
    };

    const result = componentAnalyzer.analyzeComponent(testComponent, 'TestComponent');
    
    if (!result) {
      throw new Error('Analysis failed');
    }
    
    if (result.detectedPlatform !== 'react') {
      throw new Error(`Expected platform 'react', got '${result.detectedPlatform}'`);
    }
    
    if (result.props.length === 0) {
      throw new Error('No props detected');
    }
    
    // Проверяем что id есть в пропсах
    const idProp = result.props.find(p => p.name === 'id');
    if (!idProp) {
      throw new Error('id prop not detected');
    }
  }

  private async testIntegration(): Promise<void> {
    // Регистрируем компонент
    engine.registerComponent('ComplexComponent', () => 'div');
    
    // Проверяем что можем получить компонент
    const component = engine.getComponent('ComplexComponent');
    if (!component) {
      throw new Error('Component not found after registration');
    }
  }
}

// Экспорт для использования
export const comprehensiveTests = new ComprehensiveTests(); 