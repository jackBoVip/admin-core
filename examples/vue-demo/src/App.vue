<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router';
import {
  BasicLayout,
  useVueRouterAdapter,
  type MenuItem,
} from '@admin-core/layout-vue';

// 菜单数据
const menus: MenuItem[] = [
  {
    key: 'home',
    name: '首页',
    path: '/',
    icon: '🏠',
    affix: true,
  },
  {
    key: 'dashboard',
    name: '仪表盘',
    path: '/dashboard',
    icon: '📊',
    children: [
      {
        key: 'dashboard-analysis',
        name: '分析页',
        path: '/dashboard/analysis',
        icon: '📈',
      },
      {
        key: 'dashboard-monitor',
        name: '监控页',
        path: '/dashboard/monitor',
        icon: '🖥️',
      },
      {
        key: 'dashboard-workplace',
        name: '工作台',
        path: '/dashboard/workplace',
        icon: '💼',
      },
    ],
  },
  {
    key: 'system',
    name: '系统管理',
    path: '/system',
    icon: '⚙️',
    children: [
      {
        key: 'system-user',
        name: '用户管理',
        path: '/system/user',
        icon: '👤',
      },
      {
        key: 'system-role',
        name: '角色管理',
        path: '/system/role',
        icon: '👥',
      },
      {
        key: 'system-menu',
        name: '菜单管理',
        path: '/system/menu',
        icon: '📋',
      },
      {
        key: 'system-dept',
        name: '部门管理',
        path: '/system/dept',
        icon: '🏢',
      },
      {
        key: 'system-dict',
        name: '字典管理',
        path: '/system/dict',
        icon: '📖',
      },
      {
        key: 'system-config',
        name: '系统配置',
        path: '/system/config',
        icon: '🔧',
      },
    ],
  },
  {
    key: 'permission',
    name: '权限管理',
    path: '/permission',
    icon: '🔐',
    children: [
      {
        key: 'permission-page',
        name: '页面权限',
        path: '/permission/page',
        icon: '📄',
      },
      {
        key: 'permission-button',
        name: '按钮权限',
        path: '/permission/button',
        icon: '🔘',
      },
      {
        key: 'permission-api',
        name: '接口权限',
        path: '/permission/api',
        icon: '🔌',
      },
    ],
  },
  {
    key: 'components',
    name: '组件示例',
    path: '/components',
    icon: '🧩',
    children: [
      {
        key: 'components-basic',
        name: '基础组件',
        icon: '📦',
        children: [
          {
            key: 'components-button',
            name: '按钮',
            path: '/components/button',
          },
          {
            key: 'components-icon',
            name: '图标',
            path: '/components/icon',
          },
          {
            key: 'components-typography',
            name: '排版',
            path: '/components/typography',
          },
        ],
      },
      {
        key: 'components-form',
        name: '表单组件',
        icon: '📝',
        children: [
          {
            key: 'components-input',
            name: '输入框',
            path: '/components/input',
          },
          {
            key: 'components-select',
            name: '选择器',
            path: '/components/select',
          },
          {
            key: 'components-form-basic',
            name: '基础表单',
            path: '/components/form',
          },
          {
            key: 'components-form-advanced',
            name: '高级表单',
            path: '/components/form-advanced',
          },
        ],
      },
      {
        key: 'components-data',
        name: '数据展示',
        icon: '📊',
        children: [
          {
            key: 'components-table',
            name: '表格',
            path: '/components/table',
          },
          {
            key: 'components-tree',
            name: '树形控件',
            path: '/components/tree',
          },
          {
            key: 'components-card',
            name: '卡片',
            path: '/components/card',
          },
        ],
      },
      {
        key: 'components-feedback',
        name: '反馈组件',
        icon: '💬',
        children: [
          {
            key: 'components-modal',
            name: '模态框',
            path: '/components/modal',
          },
          {
            key: 'components-message',
            name: '消息提示',
            path: '/components/message',
          },
          {
            key: 'components-notification',
            name: '通知',
            path: '/components/notification',
          },
        ],
      },
    ],
  },
  {
    key: 'feature',
    name: '功能示例',
    path: '/feature',
    icon: '✨',
    children: [
      {
        key: 'feature-clipboard',
        name: '剪切板',
        path: '/feature/clipboard',
        icon: '📋',
      },
      {
        key: 'feature-print',
        name: '打印',
        path: '/feature/print',
        icon: '🖨️',
      },
      {
        key: 'feature-excel',
        name: 'Excel 导出',
        path: '/feature/excel',
        icon: '📗',
      },
      {
        key: 'feature-pdf',
        name: 'PDF 预览',
        path: '/feature/pdf',
        icon: '📕',
      },
      {
        key: 'feature-watermark',
        name: '水印',
        path: '/feature/watermark',
        icon: '💧',
      },
      {
        key: 'feature-fullscreen',
        name: '全屏',
        path: '/feature/fullscreen',
        icon: '🖥️',
      },
    ],
  },
  {
    key: 'charts',
    name: '图表',
    path: '/charts',
    icon: '📉',
    children: [
      {
        key: 'charts-echarts',
        name: 'ECharts',
        path: '/charts/echarts',
        icon: '📊',
      },
      {
        key: 'charts-apexcharts',
        name: 'ApexCharts',
        path: '/charts/apexcharts',
        icon: '📈',
      },
      {
        key: 'charts-map',
        name: '地图',
        path: '/charts/map',
        icon: '🗺️',
      },
    ],
  },
  {
    key: 'nested',
    name: '多级菜单',
    path: '/nested',
    icon: '📁',
    children: [
      {
        key: 'nested-menu1',
        name: '菜单1',
        path: '/nested/menu1',
        children: [
          {
            key: 'nested-menu1-1',
            name: '菜单1-1',
            path: '/nested/menu1/menu1-1',
            children: [
              {
                key: 'nested-menu1-1-1',
                name: '菜单1-1-1',
                path: '/nested/menu1/menu1-1/menu1-1-1',
              },
              {
                key: 'nested-menu1-1-2',
                name: '菜单1-1-2',
                path: '/nested/menu1/menu1-1/menu1-1-2',
              },
            ],
          },
          {
            key: 'nested-menu1-2',
            name: '菜单1-2',
            path: '/nested/menu1/menu1-2',
          },
        ],
      },
      {
        key: 'nested-menu2',
        name: '菜单2',
        path: '/nested/menu2',
      },
    ],
  },
  {
    key: 'external',
    name: '外部链接',
    icon: '🔗',
    children: [
      {
        key: 'external-github',
        name: 'GitHub',
        externalLink: 'https://github.com',
        openInNewWindow: true,
        icon: '🐙',
      },
      {
        key: 'external-vue',
        name: 'Vue 文档',
        externalLink: 'https://vuejs.org',
        openInNewWindow: true,
        icon: '💚',
      },
      {
        key: 'external-vite',
        name: 'Vite 文档',
        externalLink: 'https://vitejs.dev',
        openInNewWindow: true,
        icon: '⚡',
      },
    ],
  },
  {
    key: 'about',
    name: '关于',
    path: '/about',
    icon: 'ℹ️',
  },
];

// 用户信息
const userInfo = {
  id: '1',
  username: 'admin',
  displayName: 'Admin User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  roles: ['admin'],
};

// 路由适配器
const router = useRouter();
const route = useRoute();
const routerConfig = useVueRouterAdapter(router, route);

// 事件处理
const handleLogout = () => {
  if (confirm('确定要退出登录吗？')) {
    console.log('Logout');
    router.push('/login');
  }
};

const handleSearch = (keyword: string) => {
  console.log('Search:', keyword);
};

const handleRefresh = () => {
  console.log('Refresh page');
  window.location.reload();
};

const handleLockScreen = () => {
  console.log('Lock screen');
};
</script>

<template>
  <!-- 
    BasicLayout 已内置：
    - PreferencesProvider（偏好设置上下文）
    - PreferencesDrawer（偏好设置抽屉）
    - 偏好设置按钮（右侧固定）
    用户无需手动配置！
  -->
  <!-- 
    不传递 layout 属性，让布局响应偏好设置的变化
    用户可以通过偏好设置面板切换布局类型
  -->
  <BasicLayout
    :menus="menus"
    :router="routerConfig"
    :user-info="userInfo"
    :logo="{ source: 'https://vitejs.dev/logo.svg' }"
    app-name="Admin"
    locale="zh-CN"
    @logout="handleLogout"
    @global-search="handleSearch"
    @refresh="handleRefresh"
    @lock-screen="handleLockScreen"
  >
    <!-- 内容区域 -->
    <template #default>
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </template>

    <!-- 页脚插槽 -->
    <template #footer-center>
      <div class="text-center text-sm text-gray-500 py-4">
        Copyright © 2024 Admin Core. All rights reserved.
      </div>
    </template>
  </BasicLayout>
</template>

<style>
/* 全局样式 */
html, body, #app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>
