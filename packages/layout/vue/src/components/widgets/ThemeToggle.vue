<script setup lang="ts">
/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { computed } from 'vue';
import { useLayoutContext } from '../../composables';
import { getCurrentThemeMode, toggleThemeMode, isDarkTheme } from '@admin-core/layout';
import LayoutIcon from '../common/LayoutIcon.vue';

const context = useLayoutContext();

// 当前主题
const currentTheme = computed(() => getCurrentThemeMode(context.props.theme));
const isDark = computed(() => isDarkTheme(context.props.theme));

// 切换主题
const handleToggleTheme = () => {
  const nextTheme = toggleThemeMode(currentTheme.value);
  context.events.onThemeToggle?.(nextTheme);
};
</script>

<template>
  <button
    type="button"
    class="header-widget-btn theme-toggle"
    :class="isDark ? 'is-dark' : 'is-light'"
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
