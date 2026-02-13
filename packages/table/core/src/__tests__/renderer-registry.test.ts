import { describe, expect, it } from 'vitest';
import {
  createTableFormatterRegistry,
  createTableRendererRegistry,
} from '../renderer';

describe('table renderer registry', () => {
  it('should register and resolve renderer', () => {
    const registry = createTableRendererRegistry<string>();
    registry.register('CellText', ({ value }) => String(value ?? ''));

    const renderer = registry.resolve('CellText');
    const content = renderer?.({
      column: {},
      row: {},
      value: 1,
    });

    expect(content).toBe('1');
  });

  it('should remove renderer', () => {
    const registry = createTableRendererRegistry();
    registry.register('CellText', () => null);
    registry.remove('CellText');
    expect(registry.resolve('CellText')).toBeNull();
  });

  it('should support renderer override by same key', () => {
    const registry = createTableRendererRegistry<string>();
    registry.register('CellText', () => 'old');
    registry.register('CellText', () => 'new');
    expect(
      registry.resolve('CellText')?.({
        column: {},
        row: {},
        value: 1,
      })
    ).toBe('new');
  });
});

describe('table formatter registry', () => {
  it('should register and get formatter', () => {
    const registry = createTableFormatterRegistry();
    registry.register('upper', (value) => String(value).toUpperCase());
    expect(registry.get('upper')?.('abc')).toBe('ABC');
  });
});
