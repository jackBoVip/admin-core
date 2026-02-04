<script setup lang="ts">
/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { useRefresh } from '../../composables';

const { isRefreshing, refresh } = useRefresh();
</script>

<template>
  <button
    type="button"
    class="header-widget-btn"
    :data-state="isRefreshing ? 'refreshing' : 'idle'"
    @click="refresh"
  >
    <svg
      class="h-4 w-4"
      :style="isRefreshing ? { animation: 'spin var(--admin-duration-slow, 500ms) var(--admin-easing-default, ease-in-out)', transition: 'none' } : undefined"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  </button>
</template>
