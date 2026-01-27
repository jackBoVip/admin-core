<script setup lang="ts">
/**
 * 开关设置项组件
 */
const props = defineProps<{
  /** 标签文本 */
  label: string;
  /** 图标 SVG 字符串 */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
}>();

const checked = defineModel<boolean>({ default: false });

const toggle = () => {
  if (!props.disabled) {
    checked.value = !checked.value;
  }
};
</script>

<template>
  <div
    class="switch-item"
    :class="{ disabled }"
    @click="toggle"
  >
    <span class="switch-item-label">
      <span v-if="icon" class="switch-item-icon" v-html="icon" />
      {{ label }}
    </span>
    <div
      class="preferences-switch"
      :class="{ checked: checked }"
    >
      <span class="preferences-switch-thumb" />
    </div>
  </div>
</template>
