import { describe, it, expect } from 'vitest';
import { componentRegistry } from '../core/reestr';

describe('UserFace Engine (ядро)', () => {
  it('не падает при пустом реестре компонентов', () => {
    expect(componentRegistry).toBeDefined();
    expect(typeof componentRegistry).toBe('object');
    expect(Object.keys(componentRegistry).length).toBe(0);
  });

  it('корректно экспортирует пустой объект, если нет папки library', () => {
    expect(componentRegistry).toEqual({});
  });

  // Можно добавить тесты на регистрацию компонентов вручную, если потребуется
}); 