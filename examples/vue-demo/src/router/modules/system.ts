import type { RouteRecordStringComponent } from '@admin-core/layout-vue';

/**
 * 系统管理路由模块
 * @description 类似常见 admin 模板的路由模块，支持自动扫描和合并
 */
const routes: RouteRecordStringComponent[] = [
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
];

export default routes;

