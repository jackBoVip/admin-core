/**
 * 通用工具函数测试
 */
import { describe, it, expect, vi } from 'vitest';
import {
  classNames,
  getBreakpoint,
  isMobileWidth,
  isTabletWidth,
  isDesktopWidth,
  debounce,
  throttle,
  deepClone,
  get,
  generateId,
  isSSR,
  getWindowSize,
  getOrCreateTabManager,
  clearTabManagerCache,
} from '../utils/common';
import { BREAKPOINTS } from '../constants';

// ============================================================
// 1. classNames 测试
// ============================================================
describe('classNames', () => {
  it('应合并字符串类名', () => {
    const result = classNames('a', 'b', 'c');
    expect(result).toBe('a b c');
  });

  it('应过滤 falsy 值', () => {
    const result = classNames('a', null, undefined, false, '', 'b');
    expect(result).toBe('a b');
  });

  it('应处理条件类名', () => {
    const isActive = true;
    const isDisabled = false;
    const result = classNames('base', isActive && 'active', isDisabled && 'disabled');
    expect(result).toBe('base active');
  });

  it('应处理数组', () => {
    const result = classNames(['a', 'b'], 'c');
    expect(result).toBe('a b c');
  });

  it('应处理对象', () => {
    const result = classNames({ a: true, b: false, c: true });
    expect(result).toBe('a c');
  });
});

// ============================================================
// 2. 响应式断点测试
// ============================================================
describe('响应式断点', () => {
  describe('getBreakpoint', () => {
    it('应返回 xs 当宽度小于 sm', () => {
      expect(getBreakpoint(600)).toBe('xs');
    });

    it('应返回 md 当宽度在 md 和 lg 之间', () => {
      expect(getBreakpoint(800)).toBe('md');
    });

    it('应返回 lg 当宽度在 lg 和 xl 之间', () => {
      expect(getBreakpoint(1100)).toBe('lg');
    });

    it('应返回 xl 当宽度在 xl 和 2xl 之间', () => {
      expect(getBreakpoint(1400)).toBe('xl');
    });

    it('应返回 2xl 当宽度大于等于 2xl', () => {
      expect(getBreakpoint(1600)).toBe('2xl');
    });
  });

  describe('isMobileWidth', () => {
    it('应返回 true 当宽度小于 md', () => {
      expect(isMobileWidth(600)).toBe(true);
    });

    it('应返回 false 当宽度大于等于 md', () => {
      expect(isMobileWidth(800)).toBe(false);
    });
  });

  describe('isTabletWidth', () => {
    it('应返回 true 当宽度在 md 和 lg 之间', () => {
      expect(isTabletWidth(800)).toBe(true);
    });

    it('应返回 false 当宽度大于等于 lg', () => {
      expect(isTabletWidth(1100)).toBe(false);
    });
  });

  describe('isDesktopWidth', () => {
    it('应返回 true 当宽度大于等于 lg', () => {
      expect(isDesktopWidth(1100)).toBe(true);
    });

    it('应返回 false 当宽度小于 lg', () => {
      expect(isDesktopWidth(800)).toBe(false);
    });
  });
});

// ============================================================
// 3. debounce 和 throttle 测试
// ============================================================
describe('防抖和节流', () => {
  describe('debounce', () => {
    it('应延迟执行函数', async () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    });
  });

  describe('throttle', () => {
    it('应限制函数执行频率', () => {
      vi.useFakeTimers();
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      throttledFn();
      expect(fn).toHaveBeenCalledTimes(1);

      vi.advanceTimersByTime(100);
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });
});

// ============================================================
// 4. deepClone 测试
// ============================================================
describe('deepClone', () => {
  it('应深度克隆对象', () => {
    const obj = { a: 1, b: { c: 2 } };
    const cloned = deepClone(obj);
    expect(cloned).toEqual(obj);
    expect(cloned).not.toBe(obj);
    expect(cloned.b).not.toBe(obj.b);
  });

  it('应深度克隆数组', () => {
    const arr = [1, [2, 3], { a: 4 }];
    const cloned = deepClone(arr);
    expect(cloned).toEqual(arr);
    expect(cloned).not.toBe(arr);
    expect(cloned[1]).not.toBe(arr[1]);
  });

  it('应处理 null 和 undefined', () => {
    expect(deepClone(null)).toBeNull();
    expect(deepClone(undefined)).toBeUndefined();
  });
});

// ============================================================
// 5. get 函数测试
// ============================================================
describe('get', () => {
  const obj = {
    a: {
      b: {
        c: 'value',
      },
    },
    arr: [1, 2, 3],
  };

  it('应获取嵌套属性', () => {
    expect(get(obj, 'a.b.c')).toBe('value');
  });

  it('应返回 undefined 当路径不存在', () => {
    expect(get(obj, 'a.b.d')).toBeUndefined();
  });

  it('应返回默认值当路径不存在', () => {
    expect(get(obj, 'a.b.d', 'default')).toBe('default');
  });

  it('应支持点号访问数组', () => {
    expect(get(obj, 'arr.1')).toBe(2);
  });
});

// ============================================================
// 6. generateId 测试
// ============================================================
describe('generateId', () => {
  it('应生成唯一 ID', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
  });

  it('应支持前缀', () => {
    const id = generateId('prefix-');
    expect(id.startsWith('prefix-')).toBe(true);
  });
});

// ============================================================
// 7. isSSR 测试
// ============================================================
describe('isSSR', () => {
  it('应返回 true 在 Node 环境 (无 window)', () => {
    // 在 Node 测试环境中，没有 window 对象，所以应该返回 true
    expect(isSSR()).toBe(true);
  });
});

// ============================================================
// 8. TabManager 缓存测试
// ============================================================
describe('TabManager 缓存', () => {
  beforeEach(() => {
    clearTabManagerCache();
  });

  it('应创建并缓存 TabManager', () => {
    const manager1 = getOrCreateTabManager({ persistKey: 'test' });
    const manager2 = getOrCreateTabManager({ persistKey: 'test' });
    expect(manager1).toBe(manager2);
  });

  it('应为不同 key 创建不同实例', () => {
    const manager1 = getOrCreateTabManager({ persistKey: 'test1' });
    const manager2 = getOrCreateTabManager({ persistKey: 'test2' });
    expect(manager1).not.toBe(manager2);
  });

  it('应清除缓存', () => {
    const manager1 = getOrCreateTabManager({ persistKey: 'test' });
    clearTabManagerCache('test');
    const manager2 = getOrCreateTabManager({ persistKey: 'test' });
    expect(manager1).not.toBe(manager2);
  });
});
