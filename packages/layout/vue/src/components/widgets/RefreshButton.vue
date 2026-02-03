<script setup lang="ts">
/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { ref, onUnmounted } from 'vue';
import { useLayoutContext } from '../../composables';

const context = useLayoutContext();

// 是否正在刷新
const isRefreshing = ref(false);
const timerRef = ref<ReturnType<typeof setTimeout> | null>(null);

// 处理刷新
const handleRefresh = async () => {
  if (isRefreshing.value) return;
  
  isRefreshing.value = true;
  
  // 触发刷新事件
  context.events.onRefresh?.();
  
  // 动画持续时间
  if (timerRef.value) {
    clearTimeout(timerRef.value);
  }
  timerRef.value = setTimeout(() => {
    isRefreshing.value = false;
    timerRef.value = null;
  }, 600);
};

onUnmounted(() => {
  if (timerRef.value) {
    clearTimeout(timerRef.value);
    timerRef.value = null;
  }
});
</script>

<template>
  <button
    type="button"
    class="header-widget-btn"
    :class="{ 'animate-spin': isRefreshing }"
    :title="context.t('layout.header.refresh')"
    :data-state="isRefreshing ? 'refreshing' : 'idle'"
    @click="handleRefresh"
  >
    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  </button>
</template>
