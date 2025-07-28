import { Face } from './engine/types';
import { Schema } from './engine/schema';
import { logger } from './engine/logger';

export interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

export interface TestSuite {
    name: string;
    tests: TestCase[];
}

export interface TestCase {
    name: string;
    test: () => Promise<void>;
}

export interface MockComponent {
    name: string;
    schema: Schema;
    render: (props: any) => any;
}

export interface TestEnvironment {
    registry: any;
    mockComponents: MockComponent[];
}

export class TestingInfrastructure {
    private testSuites: TestSuite[] = [];
    private results: TestResult[] = [];
    private environment: TestEnvironment;
    private mockComponents = new Map<string, MockComponent>();

    async runTest(testName: string, testFn: () => Promise<void>): Promise<TestResult> {
        const startTime = Date.now();
        let passed = false;
        let error: string | undefined;

        try {
            await testFn();
            passed = true;
        } catch (err) {
            error = err instanceof Error ? err.message : String(err);
        }

        const duration = Date.now() - startTime;
        const result: TestResult = { name: testName, passed, error, duration };

        this.results.push(result);
        return result;
    }

    async runTestSuite(suiteName: string, tests: TestCase[]): Promise<TestResult[]> {
        logger.info(`Running test suite: ${suiteName}`);
        const results: TestResult[] = [];

        for (const testCase of tests) {
            const result = await this.runTest(testCase.name, testCase.test);
            results.push(result);
        }

        return results;
    }

    createMockComponent(name: string, schema: Schema, renderFn?: (props: any) => any): MockComponent {
        const mockComponent: MockComponent = {
            name,
            schema,
            render: renderFn || ((props: any) => ({ type: 'div', props }))
        };

        this.mockComponents.set(name, mockComponent);
        return mockComponent;
    }

    getMockComponent(name: string): MockComponent | undefined {
        return this.mockComponents.get(name);
    }

    getAllMockComponents(): MockComponent[] {
        return Array.from(this.mockComponents.values());
    }

    generateTestData(schema: Schema): Face {
        const testData: Face = {
            component: schema.name
        };

        // Генерируем тестовые пропы
        for (const prop of schema.props) {
            switch (prop.type) {
                case 'text':
                    testData[prop.name] = `Test ${prop.name}`;
                    break;
                case 'number':
                    testData[prop.name] = 42;
                    break;
                case 'boolean':
                    testData[prop.name] = true;
                    break;
                case 'array':
                    testData[prop.name] = [];
                    break;
                case 'object':
                    testData[prop.name] = {};
                    break;
                default:
                    testData[prop.name] = null;
            }
        }

        return testData;
    }

    getTestResults(): TestResult[] {
        return [...this.results];
    }

    clearTestResults(): void {
        this.results = [];
    }

    getTestSummary(): { total: number; passed: number; failed: number; duration: number } {
        const total = this.results.length;
        const passed = this.results.filter(r => r.passed).length;
        const failed = total - passed;
        const duration = this.results.reduce((sum, r) => sum + r.duration, 0);

        return { total, passed, failed, duration };
    }

    // === НОВЫЕ МЕТОДЫ ИЗ .D.TS ===
    
    addTestSuite(suite: TestSuite): void {
        this.testSuites.push(suite);
    }

    createTestCase(name: string, test: () => void | Promise<void>, options?: Partial<TestCase>): TestCase {
        return {
            name,
            test: test as () => Promise<void>,
            ...options
        };
    }

    async runAllTests(): Promise<TestResult[]> {
        const allResults: TestResult[] = [];
        
        for (const suite of this.testSuites) {
            const suiteResults = await this.runTestSuite(suite.name, suite.tests);
            allResults.push(...suiteResults);
        }
        
        return allResults;
    }

    generateRandomUserFace(schema: Schema): Face {
        return this.generateTestData(schema);
    }

    mockComponent(name: string, schema: Schema, render: (props: any) => any): void {
        this.createMockComponent(name, schema, render);
    }
}

export const testingInfrastructure = new TestingInfrastructure(); 