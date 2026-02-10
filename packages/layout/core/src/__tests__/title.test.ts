/**
 * 标题工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { buildMenuPathIndex } from '../utils/menu';
import { formatDocumentTitle, resolveMenuTitleByPath } from '../utils/title';
import type { MenuItem } from '../types';

const menus: MenuItem[] = [
  { key: 'home', name: '首页', path: '/' },
  {
    key: 'system',
    name: '系统管理',
    path: '/system',
    children: [
      { key: 'user', name: '用户管理', path: '/system/user' },
    ],
  },
];

const menuIndex = buildMenuPathIndex(menus);

describe('resolveMenuTitleByPath', () => {
  it('应解析菜单标题', () => {
    const title = resolveMenuTitleByPath(menuIndex, '/system/user?foo=1');
    expect(title).toBe('用户管理');
  });

  it('路径不存在时回退到首页标题', () => {
    const title = resolveMenuTitleByPath(menuIndex, '/unknown');
    expect(title).toBe('首页');
  });
});

describe('formatDocumentTitle', () => {
  it('应拼接标题与应用名', () => {
    expect(formatDocumentTitle('页面', '应用')).toBe('页面 - 应用');
  });

  it('应优先返回页面标题', () => {
    expect(formatDocumentTitle('页面', '')).toBe('页面');
  });

  it('应在无页面标题时返回应用名', () => {
    expect(formatDocumentTitle('', '应用')).toBe('应用');
  });
});
