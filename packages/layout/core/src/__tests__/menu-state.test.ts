/**
 * 菜单状态工具函数测试
 */
import { describe, it, expect } from 'vitest';
import { buildMenuPathIndex } from '../utils/menu';
import {
  resolveMenuOpenKeysOnChange,
  resolveMenuOpenKeysOnPath,
} from '../utils/menu-state';
import type { MenuItem } from '../types';

const menus: MenuItem[] = [
  {
    key: 'dashboard',
    name: 'Dashboard',
    path: '/dashboard',
  },
  {
    key: 'system',
    name: 'System',
    path: '/system',
    children: [
      { key: 'user', name: 'User', path: '/system/user' },
      { key: 'role', name: 'Role', path: '/system/role' },
    ],
  },
  {
    key: 'reports',
    name: 'Reports',
    path: '/reports',
  },
];

const menuIndex = buildMenuPathIndex(menus);

describe('resolveMenuOpenKeysOnPath', () => {
  it('应在非手风琴模式下合并父级 key', () => {
    const openKeys: string[] = [];
    const nextKeys = resolveMenuOpenKeysOnPath({
      menuIndex,
      menuPath: '/system/user',
      openKeys,
      accordion: false,
    });
    expect(nextKeys).toEqual(['system']);
  });

  it('应保留已有展开 key', () => {
    const openKeys = ['reports'];
    const nextKeys = resolveMenuOpenKeysOnPath({
      menuIndex,
      menuPath: '/system/user',
      openKeys,
      accordion: false,
    });
    expect(nextKeys).toEqual(['reports', 'system']);
  });

  it('手风琴模式下只保留当前父级', () => {
    const openKeys = ['reports'];
    const nextKeys = resolveMenuOpenKeysOnPath({
      menuIndex,
      menuPath: '/system/user',
      openKeys,
      accordion: true,
    });
    expect(nextKeys).toEqual(['system']);
  });

  it('路径无法匹配时保持原数组引用', () => {
    const openKeys = ['reports'];
    const nextKeys = resolveMenuOpenKeysOnPath({
      menuIndex,
      menuPath: '/unknown',
      openKeys,
      accordion: false,
    });
    expect(nextKeys).toBe(openKeys);
  });
});

describe('resolveMenuOpenKeysOnChange', () => {
  it('手风琴模式下保留当前分支路径', () => {
    const openKeys = ['system'];
    const nextKeys = resolveMenuOpenKeysOnChange({
      menuIndex,
      openKeys,
      nextKeys: ['system', 'user'],
      accordion: true,
    });
    expect(nextKeys).toEqual(['system', 'user']);
  });

  it('非手风琴模式下直接返回新 key 列表', () => {
    const openKeys = ['system'];
    const nextKeys = resolveMenuOpenKeysOnChange({
      menuIndex,
      openKeys,
      nextKeys: ['system', 'user'],
      accordion: false,
    });
    expect(nextKeys).toEqual(['system', 'user']);
  });
});
