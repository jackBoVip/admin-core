import type { RouteRecordStringComponent } from '@admin-core/layout-react';

export const staticRoutes: RouteRecordStringComponent[] = [
  {
    name: 'Home',
    path: '/',
    component: '/Home',
    meta: {
      title: '首页',
      icon: '🏠',
      order: 1,
    },
  },
  {
    name: 'About',
    path: '/about',
    component: '/About',
    meta: {
      title: '关于',
      icon: 'ℹ️',
      order: 99,
    },
  },
];
