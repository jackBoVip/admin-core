<script setup lang="ts">
/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { computed } from 'vue';
import { useLayoutContext } from '../../composables';
import type { ThemeModeType } from '@admin-core/preferences';
import LayoutIcon from '../common/LayoutIcon.vue';

const context = useLayoutContext();

// 当前主题
const currentTheme = computed<ThemeModeType>(() =>
  context.props.theme?.mode === 'dark' ? 'dark' : 'light'
);
const isDark = computed(() => currentTheme.value === 'dark');

// 切换主题
const handleToggleTheme = () => {
  const nextTheme: ThemeModeType = isDark.value ? 'light' : 'dark';
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
  transition: opacity 150ms ease, transform 150ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
