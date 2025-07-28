import { Face } from './types';
import { logger } from './logger';

export interface FallbackComponent {
    component: string;
    props: Record<string, any>;
    error?: Error;
    originalSpec?: Face;
}

export type RecoveryStrategy = 'fallback' | 'retry' | 'ignore' | 'throw';

export interface RecoveryConfig {
    strategy: RecoveryStrategy;
    maxRetries?: number;
    fallbackComponent?: string;
    logErrors?: boolean;
}

export class ErrorRecovery {
    private defaultFallback = 'div';

    handleComponentError(error: Error, spec: Face, config?: RecoveryConfig): FallbackComponent {
        const recoveryConfig = config || this.getDefaultConfig();
        
        logger.warn(`Component error occurred: ${spec.component} - ${error.message} (strategy: ${recoveryConfig.strategy})`);

        switch (recoveryConfig.strategy) {
            case 'fallback':
                return this.createFallbackComponent(error, spec, recoveryConfig.fallbackComponent);
            case 'retry':
                return this.retryComponent(spec, recoveryConfig);
            case 'ignore':
                return this.createSilentFallback(spec);
            case 'throw':
            default:
                throw error;
        }
    }

    createFallbackComponent(error: Error, spec: Face, fallbackComponent?: string): FallbackComponent {
        const component = fallbackComponent || this.defaultFallback;
        
        return {
            component,
            props: {
                style: {
                    padding: '10px',
                    border: '1px solid #ff6b6b',
                    backgroundColor: '#ffe6e6',
                    color: '#d63031',
                    borderRadius: '4px',
                    fontSize: '14px'
                },
                children: this.formatErrorMessage(error, spec)
            },
            error,
            originalSpec: spec
        };
    }

    createSilentFallback(spec: Face): FallbackComponent {
        return {
            component: this.defaultFallback,
            props: {
                style: { display: 'none' },
                children: null
            },
            originalSpec: spec
        };
    }

    retryComponent(spec: Face, config: RecoveryConfig): FallbackComponent {
        const maxRetries = config.maxRetries || 3;
        
        // В реальной реализации здесь была бы логика повторных попыток
        // Пока возвращаем fallback
        logger.info(`Retrying component: ${spec.component} (max retries: ${maxRetries})`);
        
        return this.createFallbackComponent(
            new Error(`Component failed after ${maxRetries} retries`),
            spec,
            config.fallbackComponent
        );
    }

    formatErrorMessage(error: Error, spec: Face): string {
        return `Error rendering component '${spec.component}': ${error.message}`;
    }

    canRecover(error: Error): boolean {
        // Определяем, можно ли восстановиться от ошибки
        const nonRecoverableErrors = [
            'Component not found',
            'Invalid component definition',
            'Critical system error'
        ];
        
        return !nonRecoverableErrors.some(msg => error.message.includes(msg));
    }

    getRecommendedStrategy(error: Error): RecoveryStrategy {
        if (!this.canRecover(error)) {
            return 'throw';
        }
        
        if (error.message.includes('Network') || error.message.includes('Timeout')) {
            return 'retry';
        }
        
        return 'fallback';
    }

    getDefaultConfig(): RecoveryConfig {
        return {
            strategy: 'fallback',
            maxRetries: 3,
            fallbackComponent: this.defaultFallback,
            logErrors: true
        };
    }
}

export const errorRecovery = new ErrorRecovery(); 