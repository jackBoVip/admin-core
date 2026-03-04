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

/**
 * 顶栏工具栏组件属性。
 */
interface Props {
  /** 是否显示偏好设置按钮。 */
  showPreferencesButton?: boolean;
  /** 偏好设置按钮位置策略。 */
  preferencesButtonPosition?: 'header' | 'fixed' | 'auto';
  /** 打开偏好设置回调。 */
  onOpenPreferences?: () => void;
}

/**
 * 顶栏工具栏入参
 * @description 控制偏好按钮显示与位置，以及打开偏好回调。
 */
const props = defineProps<Props>();

/**
 * 布局上下文
 * @description 提供顶栏小部件配置及全局布局能力。
 */
const context = useLayoutContext();
/**
 * 顶栏小部件显隐配置集合，统一做空对象兜底。
 */
const widgets = computed(() => context.props.widgets || {});

/**
 * 是否显示全局搜索入口。
 */
const showSearch = computed(() => widgets.value.globalSearch !== false);
/**
 * 是否显示偏好设置入口。
 */
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
/**
 * 是否显示主题切换入口。
 */
const showTheme = computed(() => widgets.value.themeToggle !== false);
/**
 * 是否显示语言切换入口。
 */
const showLanguage = computed(() => widgets.value.languageToggle !== false);
/**
 * 是否显示全屏按钮入口。
 */
const showFullscreen = computed(() => widgets.value.fullscreen !== false);
/**
 * 是否显示通知按钮入口。
 */
const showNotification = computed(() => widgets.value.notification !== false);
/**
 * 是否显示用户下拉入口。
 */
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
    <slot name="user">
      <UserDropdown v-if="showUser">
        <template v-if="$slots['user-menu']" #menu>
          <slot name="user-menu" />
        </template>
      </UserDropdown>
    </slot>
  </div>
</template>
