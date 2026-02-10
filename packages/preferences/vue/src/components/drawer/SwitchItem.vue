<script setup lang="ts">
/**
 * 开关设置项组件
 * @description 与 React 版本保持一致的 API 设计，增强无障碍性
 */

const props = defineProps<{
  /** 标签文本 */
  label: string;
  /** 图标 SVG 字符串 */
  icon?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 提示文本 */
  tip?: string;
}>();

const checked = defineModel<boolean>({ default: false });

// 生成唯一 ID（在 setup 中生成一次，保持稳定）
const switchId = `switch-${Math.random().toString(36).slice(2, 9)}`;

const toggle = () => {
  if (!props.disabled) {
    checked.value = !checked.value;
  }
};

const handleKeyDown = (e: KeyboardEvent) => {
  if (props.disabled) return;
  // 空格或回车触发切换
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    checked.value = !checked.value;
  }
};
</script>

<template>
  <div
    class="switch-item data-disabled:opacity-50 data-disabled:cursor-not-allowed data-disabled:[&_*]:cursor-not-allowed data-disabled:[&_.switch-item-label]:text-muted-foreground"
    :class="{ disabled }"
    :data-disabled="disabled ? 'true' : undefined"
    :title="tip"
    role="switch"
    :aria-checked="checked"
    :aria-disabled="disabled"
    :aria-labelledby="`${switchId}-label`"
    :tabindex="disabled ? -1 : 0"
    @click="toggle"
    @keydown="handleKeyDown"
  >
    <span :id="`${switchId}-label`" class="switch-item-label">
      <span v-if="icon" class="switch-item-icon" v-html="icon" />
      {{ label }}
    </span>
    <div
      class="preferences-switch data-checked:border-primary data-checked:ring-1 data-checked:ring-ring/30"
      :class="{ checked: checked }"
      :data-state="checked ? 'checked' : 'unchecked'"
      aria-hidden="true"
    >
      <span class="preferences-switch-thumb" />
    </div>
  </div>
</template>
