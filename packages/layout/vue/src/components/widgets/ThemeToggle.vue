<script setup lang="ts">
/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { computed } from 'vue';
import { useLayoutContext } from '../../composables';
import type { ThemeModeType } from '@admin-core/preferences';

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
    <svg class="sun-and-moon" aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
      <mask class="moon" id="moon-mask">
        <rect x="0" y="0" width="100%" height="100%" fill="white" />
        <circle cx="24" cy="10" r="6" fill="black" />
      </mask>
      <circle class="sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor" />
      <g class="sun-beams" stroke="currentColor">
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </g>
    </svg>
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
