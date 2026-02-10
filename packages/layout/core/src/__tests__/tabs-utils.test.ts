/**
 * 标签页工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { getTabCacheName, resolveKeepAliveIncludes } from '../utils/tabs';
import type { TabItem } from '../types';

describe('getTabCacheName', () => {
  it('应优先使用 cacheName', () => {
    const tab: TabItem = {
      key: 'a',
      name: 'A',
      path: '/a',
      cacheName: 'cache-a',
    };
    expect(getTabCacheName(tab)).toBe('cache-a');
  });

  it('应使用 meta.cacheName 作为兜底', () => {
    const tab: TabItem = {
      key: 'b',
      name: 'B',
      path: '/b',
      meta: { cacheName: 'cache-b' },
    };
    expect(getTabCacheName(tab)).toBe('cache-b');
  });

  it('应使用 name 作为最终兜底', () => {
    const tab: TabItem = {
      key: 'c',
      name: 'C',
      path: '/c',
    };
    expect(getTabCacheName(tab)).toBe('C');
  });
});

describe('resolveKeepAliveIncludes', () => {
  it('应过滤 keepAlive=false 的标签', () => {
    const tabs: TabItem[] = [
      { key: 'a', name: 'A', path: '/a', cacheName: 'cache-a' },
      { key: 'b', name: 'B', path: '/b', meta: { cacheName: 'cache-b' } },
      { key: 'c', name: 'C', path: '/c', meta: { keepAlive: false } },
    ];
    expect(resolveKeepAliveIncludes(tabs, true)).toEqual(['cache-a', 'cache-b']);
  });

  it('keepAlive 关闭时返回空列表', () => {
    const tabs: TabItem[] = [
      { key: 'a', name: 'A', path: '/a', cacheName: 'cache-a' },
    ];
    expect(resolveKeepAliveIncludes(tabs, false)).toEqual([]);
  });
});
