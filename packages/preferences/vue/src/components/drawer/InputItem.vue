<script setup lang="ts">
/**
 * 文本输入设置项组件模块。
 * @description 提供带防抖与长度约束的输入控件，用于偏好设置中的文本类字段编辑。
 */
import { getCurrentInstance } from 'vue';
import { getIcon, INPUT_DEBOUNCE_MS, INPUT_MAX_LENGTH } from '@admin-core/preferences';
import { useDebouncedValue } from '../../composables/use-debounced-value';

/**
 * 输入模式类型。
 */
type InputModeType =
  | 'decimal'
  | 'email'
  | 'none'
  | 'numeric'
  | 'search'
  | 'tel'
  | 'text'
  | 'url';

/**
 * 输入设置项入参
 * @description 定义标签、占位提示、数值边界与防抖等输入行为配置。
 */
export interface InputItemProps {
  /** 标签文本。 */
  label: string;
  /** 占位符。 */
  placeholder?: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 防抖延迟（毫秒）。 */
  debounce?: number;
  /** 最大长度。 */
  maxLength?: number;
  /** 输入类型。 */
  type?: string;
  /** 输入模式。 */
  inputMode?: InputModeType;
  /** 最小值。 */
  min?: number;
  /** 最大值。 */
  max?: number;
  /** 步进值。 */
  step?: number;
  /** 行内布局。 */
  inline?: boolean;
  /** 提示文本。 */
  tip?: string;
}

const props = withDefaults(defineProps<InputItemProps>(), {
  debounce: INPUT_DEBOUNCE_MS,
  maxLength: INPUT_MAX_LENGTH,
  type: 'text',
});

/**
 * 输入模型值
 * @description 与外层 `v-model` 双向绑定的文本值。
 */
const modelValue = defineModel<string>({ default: '' });
/**
 * 帮助提示图标
 * @description 在提供 `tip` 时展示提示入口。
 */
const helpCircleIcon = getIcon('helpCircle');

/**
 * 防抖输入控制器
 * @description 提供本地输入值与防抖后的写回函数，减少高频更新抖动。
 */
const { localValue, handleInput: handleInputDebounced } = useDebouncedValue({
  modelValue,
  delay: props.debounce,
});

/**
 * 处理输入框内容变化
 * @description 提取输入值并通过防抖处理器回写模型值。
 * @param e 输入事件对象。
 */
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  handleInputDebounced(target.value);
};

/**
 * 当前组件实例
 * @description 用于生成稳定且可预测的输入框关联 ID。
 */
const instance = getCurrentInstance();
/**
 * 输入框可访问性 ID
 * @description 绑定 `label` 与 `input`，提升无障碍读屏体验。
 */
const inputId = `input-${instance?.uid ?? Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div
    class="input-item pref-disabled"
    :class="{ disabled, 'input-item--inline': inline }"
    :data-disabled="disabled ? 'true' : undefined"
  >
    <label :id="`${inputId}-label`" class="input-item-label">
      <span class="input-item-label-text">{{ label }}</span>
      <span
        v-if="tip"
        class="help-icon"
        :data-preference-tooltip="tip"
        aria-label="help"
        v-html="helpCircleIcon"
      />
    </label>
    <input
      :type="type"
      :inputmode="inputMode"
      class="preferences-input"
      :value="localValue"
      :placeholder="placeholder"
      :disabled="disabled"
      :maxlength="maxLength"
      :min="min"
      :max="max"
      :step="step"
      :aria-labelledby="`${inputId}-label`"
      @input="handleInput"
    />
  </div>
</template>
