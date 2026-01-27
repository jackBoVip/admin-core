<script setup lang="ts">
import { ref, computed } from 'vue';
import { RouterView, RouterLink, useRoute } from 'vue-router';
import {
  initPreferences,
  usePreferences,
  useTheme,
  useLayout,
  PreferencesDrawer,
  PreferencesTrigger,
  AdminIcon,
} from '@admin-core/preferences-vue';
import type { IconName } from '@admin-core/preferences';

// 初始化偏好设置
initPreferences({
  namespace: 'vue-demo',
  overrides: {
    app: {
      name: 'Vue Demo',
    },
  },
});

const route = useRoute();
const { preferences, setPreferences } = usePreferences();
const { isDark, toggleTheme } = useTheme();
const { toggleSidebar } = useLayout();

// 抽屉状态
const drawerOpen = ref(false);

// 侧边栏折叠状态
const sidebarCollapsed = computed(() => preferences.value?.sidebar.collapsed ?? false);

// 导航菜单
const menuItems: Array<{ path: string; name: string; icon: IconName }> = [
  { path: '/', name: '首页', icon: 'home' },
  { path: '/dashboard', name: '仪表盘', icon: 'dashboard' },
  { path: '/settings', name: '设置演示', icon: 'settings' },
  { path: '/about', name: '关于', icon: 'info' },
];

// 切换语言
const toggleLocale = () => {
  const newLocale = preferences.value?.app.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
  setPreferences({ app: { locale: newLocale } });
};
</script>

<template>
  <div class="app-layout">
    <!-- 顶栏 -->
    <header class="app-header admin-header">
      <div class="toolbar">
        <!-- 侧边栏折叠按钮 -->
        <button
          class="sidebar-toggle"
          @click="toggleSidebar"
          :title="sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'"
        >
          <AdminIcon :name="sidebarCollapsed ? 'menu' : 'close'" size="sm" />
        </button>
        <div class="logo">
          <AdminIcon name="dashboard" size="md" />
          <span v-if="!sidebarCollapsed">{{ preferences?.app.name }}</span>
        </div>
      </div>

      <div class="toolbar-spacer" />

      <div class="toolbar">
        <!-- 语言切换 -->
        <button
          class="lang-toggle"
          @click="toggleLocale"
          title="切换语言"
        >
          {{ preferences?.app.locale === 'zh-CN' ? '中' : 'En' }}
        </button>
        <!-- 主题切换 -->
        <button
          class="theme-toggle"
          @click="toggleTheme"
          :title="isDark ? '切换到亮色' : '切换到暗色'"
        >
          <AdminIcon :name="isDark ? 'sun' : 'moon'" size="sm" />
        </button>
      </div>
    </header>

    <!-- 侧边栏 -->
    <aside class="app-sidebar admin-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <nav>
        <ul class="nav-menu">
          <li v-for="item in menuItems" :key="item.path" class="nav-item">
            <RouterLink
              :to="item.path"
              class="nav-link"
              :class="{ active: route.path === item.path }"
            >
              <AdminIcon :name="item.icon" size="sm" class="nav-icon" />
              <span v-if="!sidebarCollapsed" class="nav-text">{{ item.name }}</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 主内容区 -->
    <main class="app-main" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
      <RouterView />
    </main>

    <!-- 偏好设置触发按钮 -->
    <PreferencesTrigger @click="drawerOpen = true" />

    <!-- 偏好设置抽屉 -->
    <PreferencesDrawer v-model:open="drawerOpen" />
  </div>
</template>
