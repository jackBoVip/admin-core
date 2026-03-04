<script setup lang="ts">
/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { computed } from 'vue';
import { useLayoutContext } from '../../composables';
import { getCurrentThemeMode, toggleThemeMode, isDarkTheme } from '@admin-core/layout';
import LayoutIcon from '../common/LayoutIcon.vue';

/**
 * 布局上下文
 * @description 提供当前主题配置与主题切换事件回调。
 */
const context = useLayoutContext();

/**
 * 当前主题模式（light/dark/auto）。
 */
const currentTheme = computed(() => getCurrentThemeMode(context.props.theme));
/**
 * 当前主题是否为暗色模式。
 */
const isDark = computed(() => isDarkTheme(context.props.theme));

/**
 * 主题切换按钮状态类名。
 * @description 根据亮暗模式输出语义类名，驱动图标与背景样式。
 */
const toggleThemeClass = computed(() => (isDark.value ? 'is-dark' : 'is-light'));

/**
 * 切换主题模式并派发主题切换事件。
 */
const handleToggleTheme = () => {
  const nextTheme = toggleThemeMode(currentTheme.value);
  context.events.onThemeToggle?.(nextTheme);
};
</script>

<template>
  <button
    type="button"
    class="header-widget-btn theme-toggle"
    :class="toggleThemeClass"
    @click="handleToggleTheme"
  >
    <LayoutIcon name="theme-toggle" size="md" className="sun-and-moon" />
  </button>
</template>

<style scoped>
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--admin-duration-fast, 150ms) ease, transform var(--admin-duration-fast, 150ms) ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(var(--admin-dropdown-offset, -4px));
}
</style>
