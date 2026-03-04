<script setup lang="ts">
/**
 * 偏好设置按钮
 * @description 打开偏好设置抽屉，hover时齿轮旋转
 */
import LayoutIcon from '../common/LayoutIcon.vue';

/**
 * 偏好设置按钮属性。
 */
interface Props {
  /** 打开偏好设置抽屉回调。 */
  onOpenPreferences?: () => void;
}

/**
 * 偏好按钮入参
 * @description 提供打开偏好抽屉回调。
 */
const props = defineProps<Props>();

/**
 * 点击偏好按钮。
 * @description 转发打开偏好抽屉回调，未传回调时保持空操作。
 */
const handleClick = () => {
  props.onOpenPreferences?.();
};
</script>

<template>
  <button
    type="button"
    class="header-widget-btn"
    data-widget="preferences"
    @click="handleClick"
  >
    <LayoutIcon name="settings" size="sm" />
  </button>
</template>
