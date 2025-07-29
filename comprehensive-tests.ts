import { logger } from './engine/logger';
import { realASTAnalyzer } from './engine/real-ast-analyzer';

console.log('[TESTS] Starting comprehensive tests...');

interface TestResult {
  name: string;
  success: boolean;
  duration: number;
  error?: string;
}

class ComprehensiveTests {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('[TESTS] Running all tests...');

    const tests = [
      { name: 'Logger', fn: () => this.testLogger() },
      { name: 'AST Analyzer', fn: () => this.testASTAnalyzer() },
      { name: 'Engine Factory', fn: () => this.testEngineFactory() },
      { name: 'Data Layer', fn: () => this.testDataLayer() },
      { name: 'Validation', fn: () => this.testValidation() },
      { name: 'Plugin System', fn: () => this.testPluginSystem() },
      { name: 'Event Bus', fn: () => this.testEventBus() },
      { name: 'Lifecycle Manager', fn: () => this.testLifecycleManager() },
      { name: 'Component Registry', fn: () => this.testComponentRegistry() },
      { name: 'Error Recovery', fn: () => this.testErrorRecovery() }
    ];

    for (const test of tests) {
      await this.runTest(test.name, test.fn);
    }

    this.printResults();
    return this.results;
  }

  private async runTest(name: string, testFn: () => Promise<void>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      this.results.push({
        name,
        success: true,
        duration: Date.now() - startTime
      });
      console.log(`✅ ${name} passed`);
    } catch (error) {
      this.results.push({
        name,
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : String(error)
      });
      console.log(`❌ ${name} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async testLogger(): Promise<void> {
    logger.info('Test info message', 'TestLogger');
    logger.warn('Test warning message', 'TestLogger');
    logger.error('Test error message', 'TestLogger');
    
    // Проверяем, что логгер работает без ошибок
    if (typeof logger.info !== 'function') {
      throw new Error('Logger.info is not a function');
    }
  }

  private async testASTAnalyzer(): Promise<void> {
    const testComponent = {
      name: 'TestComponent',
      code: `
        interface TestProps {
          name: string;
          age?: number;
          onSave?: () => void;
        }
        
        export const TestComponent: React.FC<TestProps> = ({ name, age, onSave }) => {
          return <div onClick={onSave}>{name}: {age}</div>;
        };
      `
    };

    const result = realASTAnalyzer.analyzeComponent(testComponent, 'TestComponent');
    
    if (!result || !result.name || !result.props) {
      throw new Error('AST analyzer returned invalid result');
    }
    
    if (result.name !== 'TestComponent') {
      throw new Error(`Expected component name 'TestComponent', got '${result.name}'`);
    }
    
    if (result.props.length === 0) {
      throw new Error('AST analyzer should extract props from interface');
    }
  }

  private async testEngineFactory(): Promise<void> {
    const { EngineFactory } = await import('./engine/engine-factory');
    const engine = EngineFactory.createEngine();
    
    if (!engine) {
      throw new Error('Engine factory failed to create engine');
    }
  }

  private async testDataLayer(): Promise<void> {
    const { dataLayer } = await import('./engine/data-layer');
    
    // Регистрируем тестовый источник данных
    dataLayer.registerDataSource('test', {
      type: 'static',
      data: { message: 'Hello World' }
    });
    
    const data = await dataLayer.getData('test');
    if (!data || data.message !== 'Hello World') {
      throw new Error('Data layer failed to retrieve test data');
    }
  }

  private async testValidation(): Promise<void> {
    const { validationEngine } = await import('./engine/validation');
    
    const result = validationEngine.validateComponent({}, { name: 'test', props: [] });
    if (!result || typeof result.isValid !== 'boolean') {
      throw new Error('Validation engine returned invalid result');
    }
  }

  private async testPluginSystem(): Promise<void> {
    const { PluginSystem } = await import('./engine/plugin-system');
    const pluginSystem = new PluginSystem({});
    
    const testPlugin = {
      id: 'test-plugin',
      name: 'Test Plugin',
      version: '1.0.0',
      type: 'custom' as const
    };
    
    await pluginSystem.registerPlugin(testPlugin);
    const plugins = pluginSystem.getAllPlugins();
    
    if (plugins.length === 0) {
      throw new Error('Plugin system failed to register plugin');
    }
  }

  private async testEventBus(): Promise<void> {
    const { eventBus } = await import('./engine/event-bus');
    
    let eventReceived = false;
    eventBus.on('test-event', () => {
      eventReceived = true;
    });
    
    eventBus.emit('test-event');
    
    if (!eventReceived) {
      throw new Error('Event bus failed to emit/receive event');
    }
  }

  private async testLifecycleManager(): Promise<void> {
    const { lifecycleManager } = await import('./engine/lifecycle-manager');
    
    let lifecycleExecuted = false;
    lifecycleManager.onBeforeRegister(() => {
      lifecycleExecuted = true;
    });
    
    await lifecycleManager.executeLifecycle('beforeRegister', {});
    
    if (!lifecycleExecuted) {
      throw new Error('Lifecycle manager failed to execute lifecycle');
    }
  }

  private async testComponentRegistry(): Promise<void> {
    const { ComponentRegistry } = await import('./engine/component-registry');
    const registry = new ComponentRegistry();
    
    const testComponent = { render: () => 'test' };
    registry.registerComponent('test', testComponent);
    
    const retrieved = registry.getComponent('test');
    if (!retrieved) {
      throw new Error('Component registry failed to store/retrieve component');
    }
  }

  private async testErrorRecovery(): Promise<void> {
    const { errorRecovery } = await import('./engine/error-recovery');
    
    const result = errorRecovery.handleError(new Error('Test error'), {});
    if (!result || !result.recovered) {
      throw new Error('Error recovery failed to handle error');
    }
  }

  private printResults(): void {
    console.log('\n=== TEST RESULTS ===');
    const passed = this.results.filter(r => r.success).length;
    const failed = this.results.filter(r => !r.success).length;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total: ${this.results.length}, Passed: ${passed}, Failed: ${failed}`);
    console.log(`Total duration: ${totalDuration}ms`);
    
    if (failed > 0) {
      console.log('\nFailed tests:');
      this.results.filter(r => !r.success).forEach(r => {
        console.log(`  ❌ ${r.name}: ${r.error}`);
      });
    }
    
    console.log('\n=== END RESULTS ===');
  }
}

// Запускаем тесты
const tests = new ComprehensiveTests();
tests.runAllTests().catch(console.error); 