/**
 * 路由访问构建测试
 */
import { describe, it, expect } from 'vitest';
import {
  normalizeViewPath,
  normalizePageMap,
  resolveComponentFromMap,
  mergeStaticRoutes,
  injectDefaultRedirects,
  generateMenusFromRoutes,
  createRouteAccess,
} from '../utils/route-access';
import type { RouteRecordStringComponent } from '../types';

const DummyComponent = () => null;

describe('route-access utils', () => {
  it('normalizeViewPath should normalize extensions and views root', () => {
    const path = './src/views/system/User.vue';
    const result = normalizeViewPath(path, 'src/views');
    expect(result).toBe('/system/User');
  });

  it('normalizePageMap should add index alias', () => {
    const map = normalizePageMap(
      {
        '/src/views/dashboard/index.vue': DummyComponent,
      },
      'src/views'
    );
    expect(map['/dashboard']).toBe(DummyComponent);
    expect(map['/dashboard/index']).toBe(DummyComponent);
  });

  it('resolveComponentFromMap should resolve component by normalized path', () => {
    const pageMap = {
      '/src/views/system/user.vue': DummyComponent,
    };
    const resolved = resolveComponentFromMap('/system/user', pageMap, undefined, 'src/views');
    expect(resolved).toBe(DummyComponent);
  });

  it('resolveComponentFromMap should fallback to case-insensitive match', () => {
    const pageMap = {
      '/src/views/components/Card.vue': DummyComponent,
    };
    const resolved = resolveComponentFromMap('/components/card', pageMap, undefined, 'src/views');
    expect(resolved).toBe(DummyComponent);
  });

  it('mergeStaticRoutes should override by name', () => {
    const staticRoutes = [
      { name: 'A', path: '/a', component: 'A' },
      { name: 'B', path: '/b', component: 'B' },
    ];
    const dynamicRoutes = [
      { name: 'A', path: '/a', component: 'A2' },
    ];
    const merged = mergeStaticRoutes(staticRoutes, dynamicRoutes);
    const target = merged.find((route) => route.name === 'A');
    expect(target?.component).toBe('A2');
  });

  it('injectDefaultRedirects should set redirect to first child', () => {
    const routes = [
      {
        path: '/parent',
        children: [
          { path: '/parent/child', component: 'Child' },
        ],
      },
    ];
    const injected = injectDefaultRedirects(routes);
    expect(injected[0].redirect).toBe('/parent/child');
  });

  it('generateMenusFromRoutes should map meta to menu fields', () => {
    const routes = [
      {
        name: 'home',
        path: '/',
        meta: {
          title: 'Home',
          icon: 'home',
        },
      },
      {
        name: 'hidden',
        path: '/hidden',
        meta: {
          title: 'Hidden',
          hideInMenu: true,
        },
      },
    ];
    const menus = generateMenusFromRoutes(routes);
    expect(menus.length).toBe(1);
    expect(menus[0]?.name).toBe('Home');
    expect(menus[0]?.icon).toBe('home');
  });

  it('createRouteAccess should merge static + dynamic routes', async () => {
    const staticRoutes: RouteRecordStringComponent[] = [
      { name: 'static', path: '/static', component: '/static' },
    ];
    const access = await createRouteAccess({
      staticRoutes,
      fetchMenuList: async () => [
        { name: 'dynamic', path: '/dynamic', component: '/dynamic' },
      ],
      pageMap: {
        '/static': DummyComponent,
        '/dynamic': DummyComponent,
      },
      viewsRoot: '',
    });

    expect(access.routes.length).toBe(2);
    expect(access.menus.length).toBe(2);
  });
});
