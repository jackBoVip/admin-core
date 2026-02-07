<script setup lang="ts">
/**
 * 偏好设置按钮
 * @description 打开偏好设置抽屉，hover时齿轮旋转
 */
import LayoutIcon from '../common/LayoutIcon.vue';

interface Props {
  onOpenPreferences?: () => void;
}

const props = defineProps<Props>();
</script>

<template>
  <button
    type="button"
    class="header-widget-btn"
    data-widget="preferences"
    @click="props.onOpenPreferences?.()"
  >
    <LayoutIcon name="settings" size="sm" />
  </button>
</template>
