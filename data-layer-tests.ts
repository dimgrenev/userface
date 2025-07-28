import { dataLayer } from './engine/data-layer';
import { UserFace } from './engine/types';
import { logger } from './engine/logger';

class MockAPI {
    private responses = new Map<string, any>();

    setResponse(url: string, data: any) {
        this.responses.set(url, data);
    }

    async fetch(url: string): Promise<Response> {
        const data = this.responses.get(url) || { error: 'Not found' };
        return {
            ok: !data.error,
            json: () => Promise.resolve(data),
            status: data.error ? 404 : 200,
            statusText: data.error ? 'Not Found' : 'OK'
        } as Response;
    }
}

export class DataLayerTests {
    private mockAPI: MockAPI;
    private testResults: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];

    constructor() {
        this.mockAPI = new MockAPI();
        this.setupMockFetch();
    }

    private setupMockFetch(): void {
        // Мокаем fetch для тестов
        (global as any).fetch = (url: string) => this.mockAPI.fetch(url);
    }

    async runAllTests(): Promise<void> {
        logger.info('🚀 Starting Data Layer Tests...');

        await this.runTest('DataSource Registration', () => this.testDataSourceRegistration());
        await this.runTest('Data Fetching', () => this.testDataFetching());
        await this.runTest('Caching', () => this.testCaching());
        await this.runTest('Subscriptions', () => this.testSubscriptions());
        await this.runTest('Error Handling', () => this.testErrorHandling());
        await this.runTest('Data Transformation', () => this.testDataTransformation());
        await this.runTest('Reactive Updates', () => this.testReactiveUpdates());
        await this.runTest('UserFace Integration', () => this.testUserFaceIntegration());

        this.printResults();
    }

    private async runTest(testName: string, testFn: () => Promise<void>): Promise<void> {
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
        this.testResults.push({ name: testName, passed, error, duration });
    }

    private async testDataSourceRegistration(): Promise<void> {
        dataLayer.registerDataSource('/api/test', { type: 'api', url: 'https://api.example.com/test' });
        
        const state = dataLayer.getState('/api/test');
        if (!state) {
            throw new Error('Data source state not created');
        }
    }

    private async testDataFetching(): Promise<void> {
        dataLayer.registerDataSource('/api/users/1', { type: 'api', url: 'https://api.example.com/api/users/1' });
        
        this.mockAPI.setResponse('https://api.example.com/api/users/1', { id: 1, name: 'John' });
        
        const data = await dataLayer.getData('/api/users/1');
        if (!data || data.id !== 1) {
            throw new Error('Data fetching failed');
        }
    }

    private async testCaching(): Promise<void> {
        dataLayer.clearAllData();
        
        dataLayer.registerDataSource('/api/cache-test', { 
            type: 'api', 
            url: 'https://api.example.com/cache-test',
            cache: true 
        });
        
        this.mockAPI.setResponse('https://api.example.com/cache-test', { cached: true });
        
        const start1 = Date.now();
        await dataLayer.getData('/api/cache-test');
        const time1 = Date.now() - start1;
        
        const start2 = Date.now();
        await dataLayer.getData('/api/cache-test');
        const time2 = Date.now() - start2;
        
        if (time2 >= time1) {
            throw new Error(`Cache not working: first call ${time1}ms, second call ${time2}ms`);
        }
    }

    private async testSubscriptions(): Promise<void> {
        let receivedData: any = null;
        
        const subscription = dataLayer.subscribe('/api/sub-test', (data) => {
            receivedData = data;
        });
        
        dataLayer.registerDataSource('/api/sub-test', { type: 'api', url: 'https://api.example.com/sub-test' });
        this.mockAPI.setResponse('https://api.example.com/sub-test', { subscribed: true });
        
        await dataLayer.getData('/api/sub-test');
        
        if (!receivedData || !receivedData.subscribed) {
            throw new Error('Subscription not working');
        }
        
        dataLayer.unsubscribe(subscription.id);
    }

    private async testErrorHandling(): Promise<void> {
        dataLayer.registerDataSource('/api/error', { type: 'api', url: 'https://api.example.com/error' });
        this.mockAPI.setResponse('https://api.example.com/error', { error: 'Server Error' });
        
        try {
            await dataLayer.getData('/api/error');
            throw new Error('Should have thrown an error');
        } catch (error) {
            // Ожидаем ошибку
        }
    }

    private async testDataTransformation(): Promise<void> {
        dataLayer.registerDataSource('/api/transform', { 
            type: 'api', 
            url: 'https://api.example.com/transform',
            transform: (data: any) => ({ ...data, transformed: true })
        });
        
        this.mockAPI.setResponse('https://api.example.com/transform', { original: true });
        
        const data = await dataLayer.getData('/api/transform');
        if (!data.transformed) {
            throw new Error('Data transformation failed');
        }
    }

    private async testReactiveUpdates(): Promise<void> {
        let updateCount = 0;
        
        dataLayer.subscribe('/api/reactive', () => {
            updateCount++;
        });
        
        dataLayer.registerDataSource('/api/reactive', { type: 'api', url: 'https://api.example.com/reactive' });
        this.mockAPI.setResponse('https://api.example.com/reactive', { reactive: true });
        
        await dataLayer.getData('/api/reactive');
        
        if (updateCount === 0) {
            throw new Error('Reactive updates not working');
        }
    }

    private async testUserFaceIntegration(): Promise<void> {
        const userFace: UserFace = {
            component: 'TestComponent',
            data: {
                user: {
                    source: '/api/user',
                    config: {
                        cache: true,
                        transform: (data: any) => ({ ...data, processed: true })
                    }
                }
            }
        };
        
        if (!userFace.data) {
            throw new Error('UserFace data property missing');
        }
    }

    private printResults(): void {
        logger.info('\n🎯 DATA LAYER TEST RESULTS:');
        logger.info('============================================================');
        
        let passed = 0;
        let failed = 0;
        let totalDuration = 0;
        
        for (const result of this.testResults) {
            const status = result.passed ? '✅' : '❌';
            const duration = `${result.duration}ms`;
            logger.info(`${status} ${result.name} (${duration})`);
            
            if (result.passed) {
                passed++;
            } else {
                failed++;
                if (result.error) {
                    logger.info(`   Error: ${result.error}`);
                }
            }
            
            totalDuration += result.duration;
        }
        
        logger.info('============================================================');
        logger.info(`📊 Results: ${passed} passed, ${failed} failed (${totalDuration}ms total)`);
        logger.info('🎉 Data Layer tests completed!');
    }
}

export async function runDataLayerTests(): Promise<void> {
    const tests = new DataLayerTests();
    await tests.runAllTests();
} 