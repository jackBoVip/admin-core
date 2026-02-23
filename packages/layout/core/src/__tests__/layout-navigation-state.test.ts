import { describe, expect, it } from 'vitest';
import {
  createLayoutBreadcrumbStateController,
  createLayoutMenuStateController,
  resolveBreadcrumbChildItems,
  resolveBreadcrumbDisplayOptions,
  resolveBreadcrumbItems,
  resolveBreadcrumbStateSnapshot,
  resolveMenuStateSnapshot,
} from '../utils';

describe('layout-navigation-state helpers', () => {
  it('should resolve menu snapshot', () => {
    const snapshot = resolveMenuStateSnapshot({
      menus: [{ key: 'home', name: 'home', path: '/home' }],
      currentPath: '/home?x=1',
    });

    expect(snapshot.menuPath).toBe('/home');
    expect(snapshot.activeKey).toBe('/home');
    expect(snapshot.menuIndex.byPath.get('/home')?.key).toBe('home');
  });

  it('should resolve breadcrumb display options', () => {
    expect(resolveBreadcrumbDisplayOptions(undefined)).toEqual({
      showIcon: true,
      styleType: 'normal',
    });
    expect(resolveBreadcrumbDisplayOptions({ showIcon: false, styleType: 'modern' })).toEqual({
      showIcon: false,
      styleType: 'modern',
    });
  });

  it('should resolve breadcrumb items in auto mode', () => {
    const items = resolveBreadcrumbItems({
      autoMode: true,
      currentPath: '/system/user',
      menus: [
        { key: 'system', name: '系统', path: '/system', children: [{ key: 'user', name: '用户', path: '/system/user' }] },
      ],
      translatedHomeName: '首页',
    });

    expect(items.length).toBeGreaterThan(0);
    expect(items[0]?.name).toBe('首页');
    expect(items.at(-1)?.name).toBe('用户');
  });

  it('should resolve breadcrumb state snapshot', () => {
    const snapshot = resolveBreadcrumbStateSnapshot({
      currentPath: '/system/user',
      menus: [
        { key: 'system', name: '系统', path: '/system', children: [{ key: 'user', name: '用户', path: '/system/user' }] },
      ],
      translatedHomeName: '首页',
    });

    expect(snapshot.isAutoMode).toBe(true);
    expect(snapshot.showIcon).toBe(true);
    expect(snapshot.styleType).toBe('normal');
    expect(snapshot.breadcrumbs.at(-1)?.name).toBe('用户');
  });

  it('should handle breadcrumb click by controller', () => {
    const logs: string[] = [];

    const controller = createLayoutBreadcrumbStateController({
      navigateBreadcrumb: (item) => {
        logs.push(`navigate:${item.key}`);
      },
      onBreadcrumbClick: (item, key) => {
        logs.push(`event:${item.key}:${key}`);
      },
    });

    expect(controller.handleClick({ key: 'home', name: 'home', path: '/home', clickable: true })).toBe(true);
    expect(controller.handleClick({ key: 'noop', name: 'noop', path: '/noop', clickable: false })).toBe(false);
    expect(controller.handleClick({ key: 'no-path', name: 'no-path' })).toBe(false);
    expect(logs).toEqual(['navigate:home', 'event:home:home']);
  });

  it('should resolve breadcrumb child items from menu tree', () => {
    const menus = [
      {
        key: 'system',
        name: '系统管理',
        path: '/system',
        children: [
          { key: 'user', name: '用户管理', path: '/system/user' },
          { key: 'role', name: '角色管理', path: '/system/role' },
        ],
      },
    ];

    const items = resolveBreadcrumbChildItems({
      item: {
        key: '__breadcrumb_system__',
        name: '系统管理',
        path: '/system',
        clickable: true,
      },
      menus,
      currentPath: '/system/user',
    });

    expect(items).toHaveLength(2);
    expect(items[0]?.name).toBe('用户管理');
    expect(items[0]?.clickable).toBe(false);
    expect(items[1]?.path).toBe('/system/role');
  });

  it('should resolve breadcrumb child items from custom item children', () => {
    const items = resolveBreadcrumbChildItems({
      item: {
        key: 'custom',
        name: '自定义',
        children: [{ key: 'detail', name: '详情', path: '/detail' }],
      },
      currentPath: '/list',
    });

    expect(items).toEqual([
      {
        key: 'detail',
        name: '详情',
        path: '/detail',
        clickable: true,
      },
    ]);
  });

  it('should sync menu open keys by current path', () => {
    const menus = [
      {
        key: 'system',
        name: '系统',
        path: '/system',
        children: [{ key: 'user', name: '用户', path: '/system/user' }],
      },
      { key: 'analysis', name: '分析', path: '/analysis' },
    ];

    const snapshot = resolveMenuStateSnapshot({
      menus,
      currentPath: '/system/user',
    });

    let openKeys: string[] = [];

    const controller = createLayoutMenuStateController({
      getSnapshot: () => ({
        menuIndex: snapshot.menuIndex,
        menuPath: snapshot.menuPath,
        openKeys,
        accordion: false,
      }),
      setOpenKeys: (keys) => {
        openKeys = keys;
      },
    });

    expect(controller.syncOpenKeysByPath()).toBe(true);
    expect(openKeys).toEqual(['system']);
    expect(controller.syncOpenKeysByPath()).toBe(false);
  });

  it('should resolve accordion open keys on menu open change', () => {
    const menus = [
      { key: 'system', name: '系统', path: '/system' },
      { key: 'analysis', name: '分析', path: '/analysis' },
    ];
    const snapshot = resolveMenuStateSnapshot({ menus, currentPath: '/system' });
    let openKeys: string[] = ['system'];

    const controller = createLayoutMenuStateController({
      getSnapshot: () => ({
        menuIndex: snapshot.menuIndex,
        menuPath: snapshot.menuPath,
        openKeys,
        accordion: true,
      }),
      setOpenKeys: (keys) => {
        openKeys = keys;
      },
    });

    expect(controller.handleOpenChange(['system', 'analysis'])).toBe(true);
    expect(openKeys).toEqual(['analysis']);
    expect(controller.handleOpenChange(['analysis'])).toBe(false);
  });

  it('should resolve selected menu item by path or key', () => {
    const menus = [
      {
        key: 'system',
        name: '系统',
        path: '/system',
        children: [{ key: 'user', name: '用户', path: '/system/user' }],
      },
    ];
    const snapshot = resolveMenuStateSnapshot({ menus, currentPath: '/system/user' });
    const controller = createLayoutMenuStateController({
      getSnapshot: () => ({
        menuIndex: snapshot.menuIndex,
        menuPath: snapshot.menuPath,
        openKeys: [],
      }),
      setOpenKeys: () => {},
    });

    expect(controller.resolveSelection('/system/user')?.item?.key).toBe('user');
    expect(controller.resolveSelection('system')?.item?.key).toBe('system');
    expect(controller.resolveSelection('')).toBeUndefined();
  });
});
