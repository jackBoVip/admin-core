<script setup lang="ts">
/**
 * 偏好设置触发按钮
 * @description 固定在页面右侧的设置按钮
 */
import { getIcon } from '@admin-core/preferences';

defineProps<{
  /** 是否显示 */
  show?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click'): void;
}>();

const settingsIcon = getIcon('settings');
</script>

<template>
  <button
    v-if="show !== false"
    class="preferences-trigger"
    @click="emit('click')"
  >
    <span v-html="settingsIcon" />
  </button>
</template>
