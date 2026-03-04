import type { RouteRecordStringComponent } from '@admin-core/layout-react';

/**
 * 获取示例动态菜单数据。
 * @description
 * 从后端获取菜单数据并转换为路由配置，示例中使用本地 mock 数据代替真实请求。
 *
 * 注意：如果路由已经在路由模块中定义（routes/modules/*.ts），
 * 则可以通过后端 API 来覆盖或扩展这些路由。
 *
 * 合并顺序：静态路由 -> 路由模块 -> 动态路由（后面的覆盖前面的）
 *
 * @returns 返回动态路由列表（包含顶级菜单与子路由）。
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
          name: 'ComponentsCard',
          path: '/components/card',
          component: '/components/Card',
          meta: {
            title: '卡片',
            icon: '🃏',
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
          name: 'ComponentsTabs',
          path: '/components/tabs',
          component: '/components/Tabs',
          meta: {
            title: 'Tabs',
            icon: '🗂️',
          },
        },
        {
          name: 'ComponentsPage',
          path: '/components/page',
          component: 'LAYOUT',
          redirect: '/components/page/basic',
          meta: {
            title: '内容页',
            icon: '📑',
          },
          children: [
            {
              name: 'ComponentsPageBasic',
              path: '/components/page/basic',
              component: '/components/page/Basic',
              meta: {
                title: 'Page 容器',
                icon: '🗂️',
              },
            },
          ],
        },
        {
          name: 'ComponentsTable',
          path: '/components/table',
          component: 'LAYOUT',
          redirect: '/components/table/basic',
          meta: {
            title: '表格',
            icon: '📊',
          },
          children: [
            {
              name: 'ComponentsTableBasic',
              path: '/components/table/basic',
              component: '/components/table/Basic',
              meta: {
                title: '基础表格',
                icon: '📄',
              },
            },
            {
              name: 'ComponentsTableRemote',
              path: '/components/table/remote',
              component: '/components/table/Remote',
              meta: {
                title: '远程请求',
                icon: '🌐',
              },
            },
            {
              name: 'ComponentsTableForm',
              path: '/components/table/form',
              component: '/components/table/Form',
              meta: {
                title: '搜索表单',
                icon: '🔎',
              },
            },
            {
              name: 'ComponentsTableTree',
              path: '/components/table/tree',
              component: '/components/table/Tree',
              meta: {
                title: '树形表格',
                icon: '🌳',
              },
            },
            {
              name: 'ComponentsTableFixed',
              path: '/components/table/fixed',
              component: '/components/table/Fixed',
              meta: {
                title: '固定列',
                icon: '📌',
              },
            },
            {
              name: 'ComponentsTableCustomCell',
              path: '/components/table/custom-cell',
              component: '/components/table/CustomCell',
              meta: {
                title: '自定义单元格',
                icon: '🧩',
              },
            },
            {
              name: 'ComponentsTableEditCell',
              path: '/components/table/edit-cell',
              component: '/components/table/EditCell',
              meta: {
                title: '单元格编辑',
                icon: '✏️',
              },
            },
            {
              name: 'ComponentsTableEditRow',
              path: '/components/table/edit-row',
              component: '/components/table/EditRow',
              meta: {
                title: '行编辑',
                icon: '📝',
              },
            },
            {
              name: 'ComponentsTableVirtual',
              path: '/components/table/virtual',
              component: '/components/table/Virtual',
              meta: {
                title: '虚拟滚动',
                icon: '🚀',
              },
            },
            {
              name: 'ComponentsTableSlot',
              path: '/components/table/slot',
              component: '/components/table/Slot',
              meta: {
                title: '插槽示例',
                icon: '🧱',
              },
            },
          ],
        },
      ],
    },
  ];
}
