/**
 * 工具函数测试
 */

import { describe, it, expect } from 'vitest';
import {
  deepMerge,
  deepClone,
  diff,
  hasChanges,
  getChangedKeys,
} from '../utils';

describe('deepMerge', () => {
  it('应该合并简单对象', () => {
    const target = { a: 1, b: 2 };
    const source = { b: 3, c: 4 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('应该深度合并嵌套对象', () => {
    const target = { a: { b: 1, c: 2 } };
    const source = { a: { c: 3, d: 4 } };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: { b: 1, c: 3, d: 4 } });
  });

  it('应该处理多个源对象', () => {
    const target = { a: 1 };
    const source1 = { b: 2 };
    const source2 = { c: 3 };
    const result = deepMerge(target, source1, source2);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('应该处理 undefined 值', () => {
    const target = { a: 1, b: 2 };
    const source = { a: undefined, c: 3 };
    const result = deepMerge(target, source);
    expect(result).toEqual({ a: 1, b: 2, c: 3 });
  });
});

describe('deepClone', () => {
  it('应该深度克隆对象', () => {
    const original = { a: { b: 1 }, c: [1, 2, 3] };
    const cloned = deepClone(original);
    expect(cloned).toEqual(original);
    expect(cloned).not.toBe(original);
    expect(cloned.a).not.toBe(original.a);
    expect(cloned.c).not.toBe(original.c);
  });

  it('应该处理原始值', () => {
    expect(deepClone(1)).toBe(1);
    expect(deepClone('test')).toBe('test');
    expect(deepClone(null)).toBe(null);
  });
});

describe('diff', () => {
  it('应该返回两个对象之间的差异', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 3, d: 4 };
    const result = diff(obj1, obj2);
    expect(result).toEqual({ b: 3, d: 4 });
  });

  it('应该处理嵌套对象', () => {
    const obj1 = { a: { b: 1, c: 2 } };
    const obj2 = { a: { b: 1, c: 3 } };
    const result = diff(obj1, obj2);
    expect(result).toEqual({ a: { c: 3 } });
  });

  it('相同对象应该返回空对象', () => {
    const obj = { a: 1, b: 2 };
    const result = diff(obj, obj);
    expect(result).toEqual({});
  });
});

describe('hasChanges', () => {
  it('相同对象应该返回 false', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 2 };
    expect(hasChanges(obj1, obj2)).toBe(false);
  });

  it('不同对象应该返回 true', () => {
    const obj1 = { a: 1, b: 2 };
    const obj2 = { a: 1, b: 3 };
    expect(hasChanges(obj1, obj2)).toBe(true);
  });

  it('嵌套对象变更应该返回 true', () => {
    const obj1 = { a: { b: 1 } };
    const obj2 = { a: { b: 2 } };
    expect(hasChanges(obj1, obj2)).toBe(true);
  });
});

describe('getChangedKeys', () => {
  it('应该返回变更的键列表', () => {
    const obj1 = { a: 1, b: 2, c: 3 };
    const obj2 = { a: 1, b: 3, d: 4 };
    const keys = getChangedKeys(obj1, obj2);
    expect(keys).toContain('b');
    expect(keys).toContain('d');
    expect(keys).not.toContain('a');
    expect(keys).not.toContain('c');
  });
});
