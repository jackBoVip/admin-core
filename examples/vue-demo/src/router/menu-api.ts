import type { RouteRecordStringComponent } from '@admin-core/layout-vue';

/**
 * 动态菜单 API
 * @description
 * 从后端获取菜单数据，返回路由配置
 *
 * 注意：如果路由已经在路由模块中定义（routes/modules 下的模块文件），
 * 则可以通过后端 API 来覆盖或扩展这些路由。
 *
 * 合并顺序：静态路由 -> 路由模块 -> 动态路由（后面的覆盖前面的）
 */
export async function fetchMenuList(): Promise<RouteRecordStringComponent[]> {
  // 模拟 API 调用
  // const response = await fetch('/api/menus');
  // return response.json();

  // 示例：返回一些额外的动态路由（不在路由模块中的）
  // 这些路由会与路由模块中的路由合并
  return [
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
    {
      name: 'Feature',
      path: '/feature',
      component: 'LAYOUT',
      meta: {
        title: '功能示例',
        icon: '✨',
        order: 5,
      },
      children: [
        {
          name: 'FeatureClipboard',
          path: '/feature/clipboard',
          component: '/feature/Clipboard',
          meta: {
            title: '剪切板',
            icon: '📋',
          },
        },
      ],
    },
  ];
}
