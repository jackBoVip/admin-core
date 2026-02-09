import type { RouteRecordStringComponent } from '@admin-core/layout-react';

/**
 * 动态菜单 API
 * @description 
 * 从后端获取菜单数据，返回路由配置
 * 
 * 注意：如果路由已经在路由模块中定义（routes/modules/*.ts），
 * 则可以通过后端 API 来覆盖或扩展这些路由。
 * 
 * 合并顺序：静态路由 -> 路由模块 -> 动态路由（后面的覆盖前面的）
 */
export async function fetchMenuList(): Promise<RouteRecordStringComponent[]> {
  // 模拟 API 调用
  // const response = await fetch('/api/menus');
  // return response.json();

  // 示例：返回一些额外的动态路由（不在路由模块中的）
  return [
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
    {
      name: 'System',
      path: '/system',
      component: 'LAYOUT',
      meta: {
        title: '系统管理',
        icon: '⚙️',
        order: 3,
      },
      children: [
        {
          name: 'SystemUser',
          path: '/system/user',
          component: '/system/User',
          meta: {
            title: '用户管理',
            icon: '👤',
          },
        },
        {
          name: 'SystemRole',
          path: '/system/role',
          component: '/system/Role',
          meta: {
            title: '角色管理',
            icon: '👥',
          },
        },
        {
          name: 'SystemMenu',
          path: '/system/menu',
          component: '/system/Menu',
          meta: {
            title: '菜单管理',
            icon: '📋',
          },
        },
        {
          name: 'SystemDept',
          path: '/system/dept',
          component: '/system/Dept',
          meta: {
            title: '部门管理',
            icon: '🏢',
          },
        },
      ],
    },
    {
      name: 'Components',
      path: '/components',
      component: 'LAYOUT',
      meta: {
        title: '组件示例',
        icon: '🧩',
        order: 4,
      },
      children: [
        {
          name: 'ComponentsButton',
          path: '/components/button',
          component: '/components/Button',
          meta: {
            title: '按钮',
            icon: '🔘',
          },
        },
        {
          name: 'ComponentsForm',
          path: '/components/form',
          component: '/components/Form',
          meta: {
            title: '表单',
            icon: '📝',
          },
        },
        {
          name: 'ComponentsTable',
          path: '/components/table',
          component: '/components/Table',
          meta: {
            title: '表格',
            icon: '📊',
          },
        },
      ],
    },
  ];
}
