import { describe, it, expect } from 'vitest';
import { componentRegistry } from '../core/reestr';

describe('UserFace Events (ядро)', () => {
  it('не падает при попытке обработать событие для несуществующего компонента', () => {
    expect(() => {
      const fakeComponent = componentRegistry['fake'];
      if (fakeComponent && typeof fakeComponent.onClick === 'function') {
        fakeComponent.onClick();
      }
    }).not.toThrow();
  });
}); 