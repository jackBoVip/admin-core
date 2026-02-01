<script setup lang="ts">
/**
 * 顶栏工具栏组件
 * @description 整合所有顶栏工具组件，根据配置显示
 */
import { computed } from 'vue';
import { useLayoutContext, useLayoutComputed } from '../../composables';
import RefreshButton from './RefreshButton.vue';
import GlobalSearch from './GlobalSearch.vue';
import ThemeToggle from './ThemeToggle.vue';
import LanguageToggle from './LanguageToggle.vue';
import FullscreenButton from './FullscreenButton.vue';
import NotificationButton from './NotificationButton.vue';
import UserDropdown from './UserDropdown.vue';

const context = useLayoutContext();
const layoutComputed = useLayoutComputed();

// 小部件配置
const widgets = computed(() => context.props.widgets || {});

// 是否为顶部菜单布局（header-nav、mixed-nav、header-mixed-nav）
const isHeaderMenuLayout = computed(() => 
  layoutComputed.value.isHeaderNav || 
  layoutComputed.value.isMixedNav || 
  layoutComputed.value.isHeaderMixedNav
);

// 显示配置
const showRefresh = computed(() => widgets.value.refresh !== false);
// 全局搜索只在顶部菜单布局下显示
const showSearch = computed(() => widgets.value.globalSearch !== false && isHeaderMenuLayout.value);
const showTheme = computed(() => widgets.value.themeToggle !== false);
const showLanguage = computed(() => widgets.value.languageToggle !== false);
const showFullscreen = computed(() => widgets.value.fullscreen !== false);
const showNotification = computed(() => widgets.value.notification !== false);
const showUser = computed(() => widgets.value.userDropdown !== false);
</script>

<template>
  <div class="header-toolbar flex items-center gap-1">
    <!-- 刷新按钮 -->
    <RefreshButton v-if="showRefresh" />
    
    <!-- 全局搜索 -->
    <GlobalSearch v-if="showSearch" />
    
    <!-- 分隔符 -->
    <div v-if="showSearch" class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
    
    <!-- 主题切换 -->
    <ThemeToggle v-if="showTheme" />
    
    <!-- 语言切换 -->
    <LanguageToggle v-if="showLanguage" />
    
    <!-- 全屏按钮 -->
    <FullscreenButton v-if="showFullscreen" />
    
    <!-- 通知按钮 -->
    <NotificationButton v-if="showNotification" />
    
    <!-- 分隔符 -->
    <div v-if="showUser" class="mx-1 h-4 w-px bg-gray-200 dark:bg-gray-700" />
    
    <!-- 用户下拉菜单 -->
    <UserDropdown v-if="showUser" />
  </div>
</template>
