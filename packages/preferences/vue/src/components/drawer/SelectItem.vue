<script setup lang="ts">
/**
 * 选择设置项组件
 */
defineProps<{
  /** 标签文本 */
  label: string;
  /** 选项列表 */
  options: Array<{ label: string; value: string | number }>;
  /** 是否禁用 */
  disabled?: boolean;
}>();

const value = defineModel<string | number>();
</script>

<template>
  <div class="select-item">
    <span class="select-item-label">{{ label }}</span>
    <select
      v-model="value"
      class="select-item-select"
      :disabled="disabled"
    >
      <option
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  </div>
</template>
