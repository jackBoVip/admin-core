<script setup lang="ts">
/**
 * 主题切换组件
 * @description 切换亮色/暗色/自动主题
 */
import { computed, ref } from 'vue';
import { useLayoutContext } from '../../composables';
import type { ThemeModeType } from '@admin-core/preferences';

const context = useLayoutContext();

// 当前主题
const currentTheme = computed(() => context.props.theme?.mode || 'light');

// 下拉菜单状态
const isOpen = ref(false);

// 主题选项
const themeOptions: { value: ThemeModeType; icon: string; label: string }[] = [
  { value: 'light', icon: 'sun', label: 'layout.theme.light' },
  { value: 'dark', icon: 'moon', label: 'layout.theme.dark' },
  { value: 'auto', icon: 'monitor', label: 'layout.theme.auto' },
];

// 切换主题
const handleThemeChange = (theme: ThemeModeType) => {
  context.events.onThemeToggle?.(theme);
  isOpen.value = false;
};

const handleThemeOptionClick = (e: MouseEvent) => {
  const theme = (e.currentTarget as HTMLElement | null)?.dataset?.value as ThemeModeType | undefined;
  if (theme) {
    handleThemeChange(theme);
  }
};

// 切换下拉菜单
const toggleDropdown = () => {
  isOpen.value = !isOpen.value;
};

// 关闭下拉菜单
const closeDropdown = () => {
  isOpen.value = false;
};
</script>

<template>
  <div class="header-widget-dropdown relative" :data-state="isOpen ? 'open' : 'closed'" @mouseleave="closeDropdown">
    <button
      type="button"
      class="header-widget-btn"
      :title="context.t('layout.header.toggleTheme')"
      :data-state="isOpen ? 'open' : 'closed'"
      @click="toggleDropdown"
    >
      <!-- 太阳图标（亮色模式） -->
      <svg v-if="currentTheme === 'light'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>
      <!-- 月亮图标（暗色模式） -->
      <svg v-else-if="currentTheme === 'dark'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
      </svg>
      <!-- 显示器图标（自动模式） -->
      <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8" />
        <path d="M12 17v4" />
      </svg>
    </button>

    <!-- 下拉菜单 -->
    <Transition name="dropdown">
      <div
        v-if="isOpen"
        class="header-widget-dropdown__menu absolute right-0 top-full z-50 mt-1 min-w-[120px] rounded-lg border bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800"
        data-state="open"
      >
        <button
          v-for="option in themeOptions"
          :key="option.value"
          type="button"
          class="flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
          :class="{ 'text-primary bg-primary/10': currentTheme === option.value }"
          :data-selected="currentTheme === option.value ? 'true' : undefined"
          :data-value="option.value"
          @click="handleThemeOptionClick"
        >
          <!-- 太阳图标 -->
          <svg v-if="option.icon === 'sun'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2" />
            <path d="M12 20v2" />
            <path d="m4.93 4.93 1.41 1.41" />
            <path d="m17.66 17.66 1.41 1.41" />
            <path d="M2 12h2" />
            <path d="M20 12h2" />
            <path d="m6.34 17.66-1.41 1.41" />
            <path d="m19.07 4.93-1.41 1.41" />
          </svg>
          <!-- 月亮图标 -->
          <svg v-else-if="option.icon === 'moon'" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
          <!-- 显示器图标 -->
          <svg v-else class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8" />
            <path d="M12 17v4" />
          </svg>
          <span>{{ context.t(option.label) }}</span>
        </button>
      </div>
    </Transition>
  </div>
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
