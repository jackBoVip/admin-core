import { describe, expect, it, vi } from 'vitest';
import {
  applyQueryToPath,
  createLayoutRouterNavigation,
  createLayoutRouterStateController,
  extractPathAndQuery,
  resolveLayoutRouterCurrentPath,
} from '../utils';

describe('layout-router-state helpers', () => {
  it('should apply query into path and keep hash', () => {
    expect(
      applyQueryToPath('/users?page=1#detail', {
        page: 2,
        size: 20,
        keyword: 'admin',
      })
    ).toBe('/users?page=2&size=20&keyword=admin#detail');

    expect(
      applyQueryToPath('/users?page=1#detail', {
        page: null,
      })
    ).toBe('/users#detail');
  });

  it('should extract pathname and query from path', () => {
    expect(extractPathAndQuery('/users?page=2&size=20#detail')).toEqual({
      path: '/users',
      query: {
        page: '2',
        size: '20',
      },
    });

    expect(extractPathAndQuery('/users')).toEqual({
      path: '/users',
    });
  });

  it('should create router navigation handlers', () => {
    const navigateMock = vi.fn();
    const navigation = createLayoutRouterNavigation({
      getCurrentPath: () => '/dashboard',
      routerNavigate: navigateMock,
      autoActivateChild: true,
    });

    navigation.handleMenuItemClick({
      key: 'system',
      name: '系统管理',
      children: [
        {
          key: 'users',
          name: '用户管理',
          path: '/system/users',
        },
      ],
    });

    navigation.handleTabClick({
      key: 'k1',
      name: '部门管理',
      path: '/system/departments',
    });

    navigation.handleBreadcrumbClick({
      key: 'c1',
      name: '用户管理',
      path: '/system/users',
      clickable: true,
    });

    expect(navigateMock).toHaveBeenNthCalledWith(1, '/system/users', {
      params: undefined,
      query: undefined,
    });
    expect(navigateMock).toHaveBeenNthCalledWith(2, '/system/departments', undefined);
    expect(navigateMock).toHaveBeenNthCalledWith(3, '/system/users', undefined);
  });

  it('should resolve current path by router priority', () => {
    expect(
      resolveLayoutRouterCurrentPath({
        routerCurrentPath: '/router-path',
        currentPath: '/current-path',
        location: { pathname: '/location-path' },
        mode: 'history',
      })
    ).toBe('/router-path');
  });

  it('should create router state controller', () => {
    const navigateMock = vi.fn();
    const controller = createLayoutRouterStateController({
      getRouterCurrentPath: () => '/router-path',
      getCurrentPath: () => '/legacy-path',
      getLocation: () => ({ pathname: '/location-path' }),
      getMode: () => 'history',
      getRouterNavigate: () => navigateMock,
      getAutoActivateChild: () => true,
    });

    expect(controller.getResolvedCurrentPath()).toBe('/router-path');

    controller.handleMenuItemClick({
      key: 'parent',
      name: '父菜单',
      children: [{ key: 'child', name: '子菜单', path: '/menu/child' }],
    });

    expect(navigateMock).toHaveBeenCalledWith('/menu/child', {
      params: undefined,
      query: undefined,
    });
  });
});
