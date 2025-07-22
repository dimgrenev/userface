import { describe, it, expect } from 'vitest';
import { componentRegistry } from '../core/reestr';

describe('Component Registry (ядро)', () => {
  it('экспортирует объект (пусть даже пустой)', () => {
    expect(componentRegistry).toBeDefined();
    expect(typeof componentRegistry).toBe('object');
  });

  it('пустой, если нет компонентов', () => {
    expect(Object.keys(componentRegistry).length).toBe(0);
  });
}); 