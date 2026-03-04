<script setup lang="ts">
/**
 * 刷新按钮组件
 * @description 刷新当前页面
 */
import { useRefresh } from '../../composables';
import LayoutIcon from '../common/LayoutIcon.vue';
import { computed } from 'vue';

/**
 * 页面刷新状态与触发器。
 */
const { isRefreshing, refresh } = useRefresh();

/**
 * 刷新图标动画样式。
 * @description 仅在刷新中启用旋转动画，空闲态返回 `undefined`。
 */
const spinStyle = computed(() =>
  isRefreshing.value
    ? {
        animation: 'spin var(--admin-duration-slow, 500ms) var(--admin-easing-default, ease-in-out)',
        transition: 'none',
      }
    : undefined
);
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
      :style="spinStyle"
    />
  </button>
</template>
