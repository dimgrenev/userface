import { Face } from './types';
import { logger } from './logger';

export type DataSource = 'api' | 'local' | 'cache' | 'websocket' | 'file';

export interface DataSourceConfig {
    type: DataSource;
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    params?: Record<string, any>;
    cache?: boolean;
    cacheTime?: number;
    polling?: number;
    realtime?: boolean;
    transform?: (data: any) => any;
    validate?: (data: any) => boolean;
}

export interface DataState {
    loading: boolean;
    error: string | null;
    data: any;
    lastUpdated: number;
    source: DataSource;
}

export interface DataSubscription {
    id: string;
    path: string;
    callback: (data: any, state: DataState) => void;
    active: boolean;
}

export interface DataCache {
    data: any;
    timestamp: number;
    ttl: number;
}

export interface APIClient {
    get: (url: string) => Promise<any>;
    post: (url: string, data: any) => Promise<any>;
    put: (url: string, data: any) => Promise<any>;
    delete: (url: string) => Promise<any>;
}

export interface StateManager {
    getState: (path: string) => DataState | undefined;
    setState: (path: string, state: Partial<DataState>) => void;
    getAllStates: () => Map<string, DataState>;
}

export interface ReactivityEngine {
    subscribe: (path: string, callback: (data: any) => void) => string;
    unsubscribe: (id: string) => void;
    notify: (path: string, data: any) => void;
}

export interface DataValidator {
    validate: (data: any, schema?: any) => boolean;
    sanitize: (data: any) => any;
}

export class DataLayer {
    private dataSources = new Map<string, DataSourceConfig>();
    private dataStates = new Map<string, DataState>();
    private subscriptions = new Map<string, DataSubscription[]>();
    private cache = new Map<string, DataCache>();
    private apiClient: APIClient;
    private stateManager: StateManager;
    private reactivityEngine: ReactivityEngine;
    private dataValidator: DataValidator;

    constructor() {
        this.apiClient = this.createAPIClient();
        this.stateManager = this.createStateManager();
        this.reactivityEngine = this.createReactivityEngine();
        this.dataValidator = this.createDataValidator();
        logger.debug('DataLayer initialized');
    }

    registerDataSource(path: string, config: DataSourceConfig): void {
        this.dataSources.set(path, config);
        logger.debug(`Data source registered: ${path} (type: ${config.type})`);
    }

    unregisterDataSource(path: string): void {
        this.dataSources.delete(path);
        this.dataStates.delete(path);
        this.clearCache(path);
        logger.debug(`Data source unregistered: ${path}`);
    }

    async getData(path: string, options?: Partial<DataSourceConfig>): Promise<any> {
        const config = this.dataSources.get(path);
        if (!config) {
            throw new Error(`Data source not found: ${path}`);
        }

        const mergedConfig = { ...config, ...options };

        // Проверяем кэш
        if (mergedConfig.cache) {
            const cached = this.getFromCache(path);
            if (cached) {
                return cached;
            }
        }

        try {
            let data: any;

            switch (mergedConfig.type) {
                case 'api':
                    data = await this.fetchFromAPI(path, mergedConfig);
                    break;
                case 'local':
                    data = await this.getFromLocal(path, mergedConfig);
                    break;
                case 'websocket':
                    data = await this.getFromWebSocket(path, mergedConfig);
                    break;
                case 'file':
                    data = await this.getFromFile(path, mergedConfig);
                    break;
                default:
                    throw new Error(`Unsupported data source type: ${mergedConfig.type}`);
            }

            // Трансформация данных
            if (mergedConfig.transform) {
                data = mergedConfig.transform(data);
            }

            // Кэширование
            if (mergedConfig.cache) {
                this.setCache(path, data, 300000); // 5 минут по умолчанию
            }

            // Обновление состояния
            this.updateDataState(path, { 
                loading: false, 
                data, 
                lastUpdated: Date.now(),
                error: null,
                source: config.type
            });

            // Уведомление подписчиков
            this.notifySubscribers(path, data);

            return data;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.updateDataState(path, { 
                loading: false, 
                error: errorMessage,
                data: null,
                lastUpdated: Date.now(),
                source: config.type
            });
            logger.error(`Failed to get data: ${path} - ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }
    }

    subscribe(path: string, callback: (data: any, state: DataState) => void): DataSubscription {
        const subscriptionId = `${path}-${Date.now()}-${Math.random()}`;
        const subscription: DataSubscription = {
            id: subscriptionId,
            path,
            callback,
            active: true
        };

        if (!this.subscriptions.has(path)) {
            this.subscriptions.set(path, []);
        }
        this.subscriptions.get(path)!.push(subscription);

        logger.debug(`Subscription created: ${subscriptionId} for ${path}`);
        return subscription;
    }

    unsubscribe(subscriptionId: string): void {
        for (const [path, subs] of this.subscriptions.entries()) {
            const index = subs.findIndex(sub => sub.id === subscriptionId);
            if (index !== -1) {
                subs.splice(index, 1);
                if (subs.length === 0) {
                    this.subscriptions.delete(path);
                }
                logger.debug(`Subscription removed: ${subscriptionId}`);
                break;
            }
        }
    }

    private getFromCache(path: string): any | null {
        const cached = this.cache.get(path);
        if (cached && Date.now() - cached.timestamp < cached.ttl) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(path);
        }
        return null;
    }

    private setCache(path: string, data: any, ttl: number): void {
        this.cache.set(path, {
            data,
            timestamp: Date.now(),
            ttl
        });
    }

    private clearCache(path?: string): void {
        if (path) {
            this.cache.delete(path);
        } else {
            this.cache.clear();
        }
    }

    private createAPIClient(): APIClient {
        return {
            get: async (url: string) => {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            },
            post: async (url: string, data: any) => {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            },
            put: async (url: string, data: any) => {
                const response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            },
            delete: async (url: string) => {
                const response = await fetch(url, { method: 'DELETE' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                return response.json();
            }
        };
    }

    private createStateManager(): StateManager {
        return {
            getState: (path: string) => this.dataStates.get(path),
            setState: (path: string, state: Partial<DataState>) => {
                const current = this.dataStates.get(path) || {
                    loading: false,
                    error: null,
                    data: null,
                    lastUpdated: Date.now(),
                    source: 'api' as DataSource
                };
                const newState = { ...current, ...state };
                this.dataStates.set(path, newState as DataState);
            },
            getAllStates: () => new Map(this.dataStates)
        };
    }

    private createReactivityEngine(): ReactivityEngine {
        return {
            subscribe: (path: string, callback: (data: any) => void) => {
                const id = `${path}-reactive-${Date.now()}`;
                this.subscribe(path, callback);
                return id;
            },
            unsubscribe: (id: string) => this.unsubscribe(id),
            notify: (path: string, data: any) => this.notifySubscribers(path, data)
        };
    }

    private createDataValidator(): DataValidator {
        return {
            validate: (data: any) => data !== null && data !== undefined,
            sanitize: (data: any) => data
        };
    }

    private async fetchFromAPI(path: string, config: DataSourceConfig): Promise<any> {
        if (!config.url) {
            throw new Error('URL is required for API data source');
        }
        return this.apiClient.get(config.url);
    }

    private async getFromLocal(path: string, config: DataSourceConfig): Promise<any> {
        // Локальные данные - возвращаем пустой объект
        return {};
    }

    private async getFromWebSocket(path: string, config: DataSourceConfig): Promise<any> {
        // WebSocket - возвращаем пустой объект
        return {};
    }

    private async getFromFile(path: string, config: DataSourceConfig): Promise<any> {
        // Файловые данные - возвращаем пустой объект
        return {};
    }

    private updateDataState(path: string, updates: Partial<DataState>): void {
        const current = this.dataStates.get(path) || {
            loading: false,
            error: null,
            data: null,
            lastUpdated: Date.now(),
            source: 'api' as DataSource
        };
        const newState = { ...current, ...updates };
        this.dataStates.set(path, newState as DataState);
    }

    private notifySubscribers(path: string, data: any): void {
        const subs = this.subscriptions.get(path);
        if (subs) {
            const state = this.dataStates.get(path);
            subs.forEach(sub => {
                if (sub.active) {
                    try {
                        sub.callback(data, state || {
                        loading: false,
                        error: null,
                        data: null,
                        lastUpdated: Date.now(),
                        source: 'api' as DataSource
                    });
                    } catch (error) {
                        logger.error(`Error in subscription callback: ${sub.id} - ${error instanceof Error ? error.message : String(error)}`);
                    }
                }
            });
        }
    }

    getState(path: string): DataState | undefined {
        return this.dataStates.get(path);
    }

    getAllStates(): Map<string, DataState> {
        return new Map(this.dataStates);
    }

    clearAllData(): void {
        this.dataStates.clear();
        this.cache.clear();
        this.subscriptions.clear();
    }

    getStats(): any {
        return {
            dataSources: this.dataSources.size,
            states: this.dataStates.size,
            subscriptions: Array.from(this.subscriptions.values()).flat().length,
            cache: this.cache.size
        };
    }

    // === МЕТОДЫ ИНТЕРФЕЙСА IDataLayer ===

    subscribeToData(path: string, callback: (data: any, state: any) => void): any {
        return this.subscribe(path, callback);
    }

    getDataState(path: string): any {
        return this.getState(path);
    }

    getDataStats(): any {
        return this.getStats();
    }

    async renderWithData(spec: Face, adapterId: string): Promise<any> {
        // Простая реализация - возвращаем компонент с данными
        const component = spec.component;
        const data = spec.data || {};
        
        // Здесь должна быть логика рендеринга с данными
        // Пока возвращаем объект с компонентом и данными
        return {
            component,
            data,
            adapterId,
            timestamp: Date.now()
        };
    }
}

export const dataLayer = new DataLayer(); 