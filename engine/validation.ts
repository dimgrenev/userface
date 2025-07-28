import { UserFace, Type } from './types';
import { ComponentSchema, PropDefinition } from './schema';
import { ValidationError } from './errors';
import { logger } from './logger';

export interface ValidationRule {
    field: string;
    type: 'required' | 'min' | 'max' | 'pattern' | 'custom' | 'type';
    value?: any;
    message?: string;
    validator?: (value: any) => boolean;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
    warnings: ValidationWarning[];
}

export class ValidationWarning extends Error {
    field: string;
    value: any;
    rule: ValidationRule;

    constructor(message: string, field: string, value: any, rule: ValidationRule) {
        super(message);
        this.name = 'ValidationWarning';
        this.field = field;
        this.value = value;
        this.rule = rule;
    }
}

export class ValidationEngine {
    validateUserFace(spec: UserFace, schema: ComponentSchema): ValidationResult {
        logger.debug(`Validating UserFace: ${spec.component} with schema: ${schema.name}`);
        
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        // Валидация пропов
        const propsValidation = this.validateProps(spec, schema);
        errors.push(...propsValidation.errors);
        warnings.push(...propsValidation.warnings);

        // Валидация событий
        const eventsValidation = this.validateEvents(spec, schema);
        errors.push(...eventsValidation.errors);
        warnings.push(...eventsValidation.warnings);

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }

    validateProps(spec: UserFace, schema: ComponentSchema): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        for (const propDef of schema.props) {
            const value = spec[propDef.name];
            
            if (propDef.required && (value === undefined || value === null)) {
                errors.push(new ValidationError(
                    `Required prop '${propDef.name}' is missing`,
                    propDef.name,
                    value
                ));
                continue;
            }

            if (value !== undefined && value !== null) {
                const validation = this.validatePropValue(value, propDef);
                if (!validation.isValid) {
                    errors.push(new ValidationError(
                        validation.message,
                        propDef.name,
                        value
                    ));
                }
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    validateEvents(spec: UserFace, schema: ComponentSchema): ValidationResult {
        const errors: ValidationError[] = [];
        const warnings: ValidationWarning[] = [];

        if (spec.events) {
            for (const eventName in spec.events) {
                const eventDef = schema.events.find(e => e.name === eventName);
                if (!eventDef) {
                    warnings.push(new ValidationWarning(
                        `Unknown event '${eventName}'`,
                        eventName,
                        spec.events[eventName],
                        { field: eventName, type: 'custom' }
                    ));
                }
            }
        }

        return { isValid: errors.length === 0, errors, warnings };
    }

    validatePropValue(value: any, propDef: PropDefinition): { isValid: boolean; message: string } {
        // Валидация типа
        if (!this.validateType(value, propDef.type)) {
            return {
                isValid: false,
                message: `Expected type '${propDef.type}', got '${typeof value}'`
            };
        }

        // Валидация по правилам
        if (propDef.validation && Array.isArray(propDef.validation)) {
            for (const rule of propDef.validation) {
                if (!this.validateRule(value, rule)) {
                    return {
                        isValid: false,
                        message: rule.message || `Validation failed for '${propDef.name}'`
                    };
                }
            }
        }

        return { isValid: true, message: '' };
    }

    validateType(value: any, expectedType: Type): boolean {
        switch (expectedType) {
            case 'text':
                return typeof value === 'string';
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'boolean':
                return typeof value === 'boolean';
            case 'function':
                return typeof value === 'function';
            case 'object':
                return typeof value === 'object' && value !== null;
            case 'array':
                return Array.isArray(value);
            default:
                return true; // Неизвестный тип - пропускаем
        }
    }

    private validateRule(value: any, rule: ValidationRule): boolean {
        switch (rule.type) {
            case 'required':
                return value !== undefined && value !== null && value !== '';
            case 'min':
                return typeof value === 'number' && value >= (rule.value || 0);
            case 'max':
                return typeof value === 'number' && value <= (rule.value || Infinity);
            case 'pattern':
                return typeof value === 'string' && new RegExp(rule.value || '').test(value);
            case 'custom':
                return rule.validator ? rule.validator(value) : true;
            default:
                return true;
        }
    }
}

export const validationEngine = new ValidationEngine(); 