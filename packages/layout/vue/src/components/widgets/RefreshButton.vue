<script setup lang="ts">
/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { useRefresh } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';

const { isRefreshing, refresh } = useRefresh();
</script>

<template>
  <button
    type="button"
    class="header-widget-btn"
    :data-state="isRefreshing ? 'refreshing' : 'idle'"
    @click="refresh"
  >
    <LayoutIcon
      name="refresh"
      size="sm"
      :style="isRefreshing ? { animation: 'spin var(--admin-duration-slow, 500ms) var(--admin-easing-default, ease-in-out)', transition: 'none' } : undefined"
    />
  </button>
</template>
