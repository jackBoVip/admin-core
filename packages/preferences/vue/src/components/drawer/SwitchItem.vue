<script setup lang="ts">
/**
 * 开关设置项组件模块。
 * @description 提供可键盘操作的布尔开关控件，并保持与 React 版本一致的 API 语义。
 */

/**
 * 开关设置项入参
 * @description 定义展示标签、图标、禁用态及提示信息。
 */
export interface SwitchItemProps {
  /** 标签文本。 */
  label: string;
  /** 图标 SVG 字符串。 */
  icon?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 提示文本。 */
  tip?: string;
}

const props = defineProps<SwitchItemProps>();

/**
 * 开关选中状态
 * @description 与外层 `v-model` 绑定的布尔值。
 */
const checked = defineModel<boolean>({ default: false });

/**
 * 开关控件 ID
 * @description 在组件实例生命周期内保持稳定，用于无障碍标签关联。
 */
const switchId = `switch-${Math.random().toString(36).slice(2, 9)}`;

/**
 * 切换开关状态
 * @description 非禁用状态下翻转当前布尔值并同步到 `v-model`。
 */
const toggle = () => {
  if (!props.disabled) {
    checked.value = !checked.value;
  }
};

/**
 * 处理开关键盘事件
 * @description 在可操作状态下，空格或回车会触发状态切换。
 * @param e 键盘事件对象。
 */
const handleKeyDown = (e: KeyboardEvent) => {
  if (props.disabled) return;
  /**
   * 键盘触发条件。
   * @description 仅空格与回车键触发开关切换。
   */
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    checked.value = !checked.value;
  }
};
</script>

<template>
  <div
    class="switch-item pref-disabled"
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
    <span :id="`${switchId}-label`" class="switch-item-label pref-disabled-label">
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
