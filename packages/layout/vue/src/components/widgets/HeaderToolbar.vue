<script setup lang="ts">
/**
 * 顶栏工具栏组件
 * @description 整合所有顶栏工具组件，根据配置显示
 */
import { computed } from 'vue';
import { useLayoutContext } from '../../composables';
import GlobalSearch from './GlobalSearch.vue';
import PreferencesButton from './PreferencesButton.vue';
import ThemeToggle from './ThemeToggle.vue';
import LanguageToggle from './LanguageToggle.vue';
import FullscreenButton from './FullscreenButton.vue';
import NotificationButton from './NotificationButton.vue';
import UserDropdown from './UserDropdown.vue';

interface Props {
  showPreferencesButton?: boolean;
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  onOpenPreferences?: () => void;
}

const props = defineProps<Props>();

const context = useLayoutContext();
// 小部件配置
const widgets = computed(() => context.props.widgets || {});

// 显示配置
const showSearch = computed(() => widgets.value.globalSearch !== false);
const showPreferences = computed(() => {
  const position =
    props.preferencesButtonPosition ?? context.props.preferencesButtonPosition ?? 'auto';
  return (
    (props.showPreferencesButton ?? true) &&
    context.props.enablePreferences !== false &&
    widgets.value.preferencesButton !== false &&
    (position === 'header' || position === 'auto')
  );
});
const showTheme = computed(() => widgets.value.themeToggle !== false);
const showLanguage = computed(() => widgets.value.languageToggle !== false);
const showFullscreen = computed(() => widgets.value.fullscreen !== false);
const showNotification = computed(() => widgets.value.notification !== false);
const showUser = computed(() => widgets.value.userDropdown !== false);
</script>

<template>
  <div class="header-toolbar flex items-center gap-1">
    <!-- 全局搜索 -->
    <div v-if="showSearch" class="mr-2">
      <GlobalSearch />
    </div>

    <!-- 偏好设置 -->
    <PreferencesButton v-if="showPreferences" :on-open-preferences="props.onOpenPreferences" />
    
    <!-- 主题切换 -->
    <ThemeToggle v-if="showTheme" />
    
    <!-- 语言切换 -->
    <LanguageToggle v-if="showLanguage" />

    <!-- 全屏按钮 -->
    <FullscreenButton v-if="showFullscreen" />
    
    <!-- 通知按钮 -->
    <NotificationButton v-if="showNotification" />
    
    <!-- 用户下拉菜单 -->
    <UserDropdown v-if="showUser" />
  </div>
</template>
