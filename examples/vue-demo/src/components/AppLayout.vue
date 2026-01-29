<script setup lang="ts">
import { computed } from 'vue';
import { RouterView, RouterLink, useRoute } from 'vue-router';
import {
  usePreferences,
  useTheme,
  useLayout,
  usePreferencesContext,
  AdminIcon,
} from '@admin-core/preferences-vue';

const route = useRoute();
const { preferences, setPreferences } = usePreferences();
const { isDark, toggleTheme } = useTheme();
const { toggleSidebar } = useLayout();

// 从 Provider 注入的上下文
const { lock, isLockEnabled } = usePreferencesContext();

// 侧边栏折叠状态
const sidebarCollapsed = computed(() => preferences.value?.sidebar.collapsed ?? false);

// 切换语言
const toggleLocale = () => {
  const newLocale = preferences.value?.app.locale === 'zh-CN' ? 'en-US' : 'zh-CN';
  setPreferences({ app: { locale: newLocale } });
};

// 导航菜单
const menuItems = [
  { path: '/', name: '首页', icon: 'home' },
  { path: '/dashboard', name: '仪表盘', icon: 'dashboard' },
  { path: '/settings', name: '设置演示', icon: 'settings' },
  { path: '/about', name: '关于', icon: 'info' },
] as const;
</script>

<template>
  <div class="app-layout">
    <!-- 顶栏 -->
    <header class="app-header admin-header">
      <div class="toolbar">
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
        <!-- 锁屏按钮 - 功能启用时显示 -->
        <button
          v-if="isLockEnabled"
          class="lock-toggle"
          @click="lock"
          title="锁屏 (Ctrl+Shift+L)"
        >
          <AdminIcon name="lock" size="sm" />
        </button>
        <button class="lang-toggle" @click="toggleLocale" title="切换语言">
          {{ preferences?.app.locale === 'zh-CN' ? '中' : 'En' }}
        </button>
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
  </div>
</template>
