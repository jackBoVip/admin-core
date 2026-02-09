import type { RouteRecordStringComponent } from '@admin-core/layout-react';

/**
 * 仪表盘路由模块
 * @description 类似 Admin 模板的路由模块，支持自动扫描和合并
 */
const routes: RouteRecordStringComponent[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    component: 'LAYOUT',
    meta: {
      title: '仪表盘',
      icon: '📊',
      order: 2,
    },
    children: [
      {
        name: 'DashboardAnalysis',
        path: '/dashboard/analysis',
        component: '/dashboard/Analysis',
        meta: {
          title: '分析页',
          icon: '📈',
        },
      },
      {
        name: 'DashboardMonitor',
        path: '/dashboard/monitor',
        component: '/dashboard/Monitor',
        meta: {
          title: '监控页',
          icon: '🖥️',
        },
      },
      {
        name: 'DashboardWorkplace',
        path: '/dashboard/workplace',
        component: '/dashboard/Workplace',
        meta: {
          title: '工作台',
          icon: '💼',
        },
      },
    ],
  },
];

export default routes;

