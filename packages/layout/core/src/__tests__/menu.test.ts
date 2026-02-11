/**
 * 菜单工具函数测试
 */
import { describe, it, expect } from 'vitest';
import {
  flattenMenus,
  filterHiddenMenus,
  generateBreadcrumbsFromMenus,
  resolveBreadcrumbsFromIndex,
  resolveAutoBreadcrumbOptions,
  getCachedFilteredMenus,
  getCachedHeaderMenus,
  getCachedMenuPathIndex,
  clearMenuCaches,
  findMenuByPath,
  getMenuPathByPath,
  findMenuByKey,
  findFirstActivatableChild,
  getMenuParentKeys,
  hasChildren,
  isMenuActive,
  hasActiveChild,
  getMenuItemClassName,
  buildMenuPathIndex,
} from '../utils/menu';
import type { MenuItem } from '../types';

// 测试用菜单数据
const mockMenus: MenuItem[] = [
  {
    key: 'home',
    name: '首页',
    path: '/',
    icon: 'home',
  },
  {
    key: 'system',
    name: '系统管理',
    icon: 'settings',
    children: [
      {
        key: 'user',
        name: '用户管理',
        path: '/system/user',
      },
      {
        key: 'role',
        name: '角色管理',
        path: '/system/role',
      },
      {
        key: 'permission',
        name: '权限管理',
        hidden: true,
        path: '/system/permission',
      },
    ],
  },
  {
    key: 'about',
    name: '关于',
    path: '/about',
    hidden: true,
  },
];

// ============================================================
// 1. 菜单查找测试
// ============================================================
describe('菜单查找', () => {
  describe('findMenuByKey', () => {
    it('应找到顶级菜单', () => {
      const menu = findMenuByKey(mockMenus, 'home');
      expect(menu).toBeDefined();
      expect(menu?.key).toBe('home');
    });

    it('应找到嵌套菜单', () => {
      const menu = findMenuByKey(mockMenus, 'user');
      expect(menu).toBeDefined();
      expect(menu?.key).toBe('user');
    });

    it('应返回 null 当菜单不存在', () => {
      const menu = findMenuByKey(mockMenus, 'nonexistent');
      expect(menu).toBeNull();
    });
  });

  describe('findMenuByPath', () => {
    it('应通过路径找到菜单', () => {
      const menu = findMenuByPath(mockMenus, '/system/user');
      expect(menu).toBeDefined();
      expect(menu?.key).toBe('user');
    });

    it('应返回首页菜单当路径不精确匹配', () => {
      // findMenuByPath 使用 startsWith 匹配，可能返回首页
      const menu = findMenuByPath(mockMenus, '/nonexistent');
      // 该函数的行为是返回最接近的匹配或 undefined
      expect(menu === undefined || menu?.path === '/').toBe(true);
    });
  });

  describe('findFirstActivatableChild', () => {
    it('应找到第一个可激活的子菜单', () => {
      const systemMenu = mockMenus[1];
      const child = findFirstActivatableChild(systemMenu);
      expect(child).toBeDefined();
      expect(child?.key).toBe('user');
    });

    it('应返回 null 当没有子菜单', () => {
      const homeMenu = mockMenus[0];
      const child = findFirstActivatableChild(homeMenu);
      expect(child).toBeNull();
    });
  });
});

// ============================================================
// 2. 菜单路径测试
// ============================================================
describe('菜单路径', () => {
  describe('getMenuParentKeys', () => {
    it('应返回父级菜单 keys', () => {
      const keys = getMenuParentKeys(mockMenus, 'user');
      expect(keys).toContain('system');
    });

    it('应返回空数组当为顶级菜单', () => {
      const keys = getMenuParentKeys(mockMenus, 'home');
      expect(keys).toHaveLength(0);
    });
  });

  describe('getMenuPathByPath', () => {
    it('应返回菜单路径', () => {
      const path = getMenuPathByPath(mockMenus, '/system/user');
      expect(path).toHaveLength(2);
      expect(path[0].key).toBe('system');
      expect(path[1].key).toBe('user');
    });

    it('应返回空数组当路径不存在', () => {
      const path = getMenuPathByPath(mockMenus, '/nonexistent');
      expect(path).toHaveLength(0);
    });
  });
});

// ============================================================
// 3. 菜单状态判断测试
// ============================================================
describe('菜单状态判断', () => {
  describe('hasChildren', () => {
    it('应返回 true 当有子菜单', () => {
      const systemMenu = mockMenus[1];
      expect(hasChildren(systemMenu)).toBe(true);
    });

    it('应返回 false 当没有子菜单', () => {
      const homeMenu = mockMenus[0];
      expect(hasChildren(homeMenu)).toBe(false);
    });
  });

  describe('isMenuActive', () => {
    it('应返回 true 当 key 匹配', () => {
      const homeMenu = mockMenus[0];
      expect(isMenuActive(homeMenu, 'home')).toBe(true);
    });

    it('应返回 true 当 path 匹配', () => {
      const homeMenu = mockMenus[0];
      expect(isMenuActive(homeMenu, '/')).toBe(true);
    });

    it('应返回 false 当不匹配', () => {
      const homeMenu = mockMenus[0];
      expect(isMenuActive(homeMenu, 'about')).toBe(false);
    });
  });

  describe('hasActiveChild', () => {
    it('应返回 true 当子菜单激活', () => {
      const systemMenu = mockMenus[1];
      expect(hasActiveChild(systemMenu, 'user')).toBe(true);
    });

    it('应返回 false 当无子菜单激活', () => {
      const systemMenu = mockMenus[1];
      expect(hasActiveChild(systemMenu, 'home')).toBe(false);
    });
  });
});

// ============================================================
// 4. 菜单类名生成测试
// ============================================================
describe('菜单类名生成', () => {
  describe('getMenuItemClassName', () => {
    it('应生成基础类名', () => {
      const homeMenu = mockMenus[0];
      const className = getMenuItemClassName(homeMenu, {
        level: 0,
        isActive: false,
        isExpanded: false,
        hasActiveChild: false,
      });
      expect(className).toContain('sidebar-menu__item');
    });

    it('应包含 active 类名当激活', () => {
      const homeMenu = mockMenus[0];
      const className = getMenuItemClassName(homeMenu, {
        level: 0,
        isActive: true,
        isExpanded: false,
        hasActiveChild: false,
      });
      expect(className).toContain('sidebar-menu__item--active');
    });

    it('应包含 expanded 类名', () => {
      const systemMenu = mockMenus[1];
      const className = getMenuItemClassName(systemMenu, {
        level: 0,
        isActive: false,
        isExpanded: true,
        hasActiveChild: false,
      });
      expect(className).toContain('sidebar-menu__item--expanded');
    });
  });
});

// ============================================================
// 5. 菜单数据处理测试
// ============================================================
describe('菜单数据处理', () => {
  describe('flattenMenus', () => {
    it('应扁平化菜单', () => {
      const flattened = flattenMenus(mockMenus);
      expect(flattened.length).toBeGreaterThan(mockMenus.length);
      expect(flattened.some((m) => m.key === 'user')).toBe(true);
    });
  });

  describe('filterHiddenMenus', () => {
    it('应过滤隐藏菜单', () => {
      const filtered = filterHiddenMenus(mockMenus);
      expect(filtered.some((m) => m.key === 'about')).toBe(false);
    });

    it('应递归过滤子菜单中的隐藏项', () => {
      const filtered = filterHiddenMenus(mockMenus);
      const systemMenu = filtered.find((m) => m.key === 'system');
      expect(systemMenu?.children?.some((m) => m.key === 'permission')).toBe(false);
    });
  });

  describe('getCachedFilteredMenus', () => {
    it('应对相同引用返回同一结果', () => {
      const first = getCachedFilteredMenus(mockMenus);
      const second = getCachedFilteredMenus(mockMenus);
      expect(first).toBe(second);
    });

    it('应在原地修改菜单并清理缓存后失效缓存', () => {
      const menus: MenuItem[] = [
        { key: 'a', name: 'A', path: '/a', hidden: true },
      ];
      const first = getCachedFilteredMenus(menus);
      expect(first).toHaveLength(0);

      menus[0].hidden = false;
      clearMenuCaches(menus);
      const second = getCachedFilteredMenus(menus);
      expect(second).not.toBe(first);
      expect(second).toHaveLength(1);
    });
  });
});

// ============================================================
// 6. 顶部菜单缓存测试
// ============================================================
describe('顶部菜单缓存', () => {
  it('应缓存顶部菜单结果', () => {
    const first = getCachedHeaderMenus(mockMenus, { isHeaderNav: true });
    const second = getCachedHeaderMenus(mockMenus, { isHeaderNav: true });
    expect(first).toBe(second);
  });

  it('应在原地修改菜单并清理缓存后失效顶部菜单缓存', () => {
    const menus: MenuItem[] = [
      {
        key: 'root',
        name: 'Root',
        path: '/root',
        children: [{ key: 'child-a', name: 'A', path: '/root/a' }],
      },
    ];
    const first = getCachedHeaderMenus(menus, { isMixedNav: true });

    menus[0].children = [
      { key: 'child-a', name: 'A', path: '/root/a' },
      { key: 'child-b', name: 'B', path: '/root/b' },
    ];
    clearMenuCaches(menus);
    const second = getCachedHeaderMenus(menus, { isMixedNav: true });
    expect(second).not.toBe(first);
  });

  it('应在原地修改菜单并清理缓存后失效路径索引缓存', () => {
    const menus: MenuItem[] = [{ key: 'a', name: 'A', path: '/a' }];
    const first = getCachedMenuPathIndex(menus);
    expect(first.byPath.has('/a')).toBe(true);

    menus[0].path = '/b';
    clearMenuCaches(menus);
    const second = getCachedMenuPathIndex(menus);
    expect(second).not.toBe(first);
    expect(second.byPath.has('/b')).toBe(true);
    expect(second.byPath.has('/a')).toBe(false);
  });
});

// ============================================================
// 7. 面包屑生成测试
// ============================================================
describe('面包屑生成', () => {
  describe('generateBreadcrumbsFromMenus', () => {
    it('应生成面包屑数据', () => {
      const breadcrumbs = generateBreadcrumbsFromMenus(mockMenus, '/system/user');
      expect(breadcrumbs).toHaveLength(2);
      expect(breadcrumbs[0].key).toBe('__breadcrumb_system__');
      expect(breadcrumbs[1].key).toBe('__breadcrumb_user__');
    });

    it('应包含首页当配置', () => {
      const breadcrumbs = generateBreadcrumbsFromMenus(mockMenus, '/system/user', {
        showHome: true,
        homePath: '/',
        homeName: '首页',
      });
      expect(breadcrumbs[0].name).toBe('首页');
    });

    it('应返回空数组当路径不存在', () => {
      const breadcrumbs = generateBreadcrumbsFromMenus(mockMenus, '/nonexistent');
      expect(breadcrumbs).toHaveLength(0);
    });
  });

  describe('resolveBreadcrumbsFromIndex', () => {
    const menuIndex = buildMenuPathIndex(mockMenus);

    it('应基于索引生成面包屑数据', () => {
      const breadcrumbs = resolveBreadcrumbsFromIndex({
        menuIndex,
        basePath: '/system/user',
        showHome: true,
        homePath: '/',
        homeName: '首页',
        homeIcon: 'home',
      });
      expect(breadcrumbs.map((item) => item.name)).toEqual(['首页', '系统管理', '用户管理']);
    });

    it('应返回空数组当路径不存在且仅有首页', () => {
      const breadcrumbs = resolveBreadcrumbsFromIndex({
        menuIndex,
        basePath: '/nonexistent',
        showHome: true,
        homePath: '/',
        homeName: '首页',
        hideOnlyOne: true,
      });
      expect(breadcrumbs).toHaveLength(0);
    });
  });

  describe('resolveAutoBreadcrumbOptions', () => {
    it('应合并自动配置与面包屑配置', () => {
      const resolved = resolveAutoBreadcrumbOptions({
        autoBreadcrumb: {
          showHome: false,
          homePath: '/dashboard',
          homeName: '仪表盘',
          homeIcon: 'dashboard',
        },
        breadcrumb: {
          showHome: true,
          hideOnlyOne: false,
        },
        defaultHomePath: '/',
        translatedHomeName: '首页',
      });
      expect(resolved).toEqual({
        showHome: false,
        homePath: '/dashboard',
        homeName: '仪表盘',
        homeIcon: 'dashboard',
        hideOnlyOne: false,
      });
    });

    it('应使用默认值与翻译名称', () => {
      const resolved = resolveAutoBreadcrumbOptions({
        autoBreadcrumb: {},
        breadcrumb: {},
        defaultHomePath: '/home',
        translatedHomeName: '首页',
      });
      expect(resolved.homePath).toBe('/home');
      expect(resolved.homeName).toBe('首页');
      expect(resolved.showHome).toBe(true);
    });
  });
});
