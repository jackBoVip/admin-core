<script setup lang="ts">
/**
 * 数字输入设置项组件
 * @description 带 +/- 步进控制的数字输入
 */
import { ref, watch, getCurrentInstance } from 'vue';
import { getIcon, clamp } from '@admin-core/preferences';

/**
 * 数字设置项入参
 * @description 定义标签文案、可选边界与步进粒度等配置。
 */
export interface NumberItemProps {
  /** 标签文本。 */
  label: string;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 最小值。 */
  min?: number;
  /** 最大值。 */
  max?: number;
  /** 步进值。 */
  step?: number;
  /** 提示文本。 */
  tip?: string;
}

const props = withDefaults(defineProps<NumberItemProps>(), {
  step: 1,
});

/**
 * 数字模型值
 * @description 与外层 `v-model` 同步的数值状态。
 */
const modelValue = defineModel<number>({ default: 0 });
/**
 * 本地输入文本
 * @description 保留用户当前输入字符串，避免中间态被立即格式化。
 */
const localText = ref(String(modelValue.value ?? 0));
/**
 * 帮助提示图标
 * @description 在配置 `tip` 时作为提示入口展示。
 */
const helpCircleIcon = getIcon('helpCircle');

/**
 * 监听外部模型值变化
 * @description 当外部值更新时同步刷新本地文本，保持显示一致。
 */
watch(modelValue, (val) => {
  const next = String(val ?? 0);
  if (localText.value !== next) {
    localText.value = next;
  }
});

/**
 * 约束数字值到合法范围
 * @description 对输入值做有限数校验，并按 `min/max` 进行边界裁剪。
 * @param value 待处理的数值。
 * @returns 约束后的合法数值。
 */
const clampValue = (value: number) => {
  const next = Number.isFinite(value) ? value : 0;
  return clamp(next, props.min, props.max);
};

/**
 * 提交数字值
 * @description 将值裁剪后同步到 `v-model`，并回写文本框显示值。
 * @param value 待提交的数值。
 */
const commit = (value: number) => {
  const next = clampValue(value);
  modelValue.value = next;
  localText.value = String(next);
};

/**
 * 处理输入框输入事件
 * @description 仅更新本地文本，实际数值在失焦或步进时统一提交。
 * @param e 输入事件对象。
 */
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  localText.value = target.value;
};

/**
 * 处理输入框失焦事件
 * @description 将文本解析为整数并提交；解析失败时回退到当前模型值。
 */
const handleBlur = () => {
  const parsed = Number.parseInt(localText.value, 10);
  commit(Number.isNaN(parsed) ? (modelValue.value ?? 0) : parsed);
};

/**
 * 处理步进按钮点击
 * @description 按步进值增减当前数字并提交到模型。
 * @param direction 步进方向，`1` 为增加，`-1` 为减少。
 */
const handleStep = (direction: number) => {
  if (props.disabled) return;
  const current = Number.parseInt(localText.value, 10);
  const base = Number.isNaN(current) ? (modelValue.value ?? 0) : current;
  const step = props.step ?? 1;
  commit(base + step * direction);
};

/**
 * 当前组件实例
 * @description 用于构造稳定的输入框标识符。
 */
const instance = getCurrentInstance();
/**
 * 数字输入框 ID
 * @description 用于关联标签与输入框的 `aria-labelledby`。
 */
const inputId = `number-${instance?.uid ?? Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div
    class="number-item pref-disabled"
    :class="{ disabled }"
    :data-disabled="disabled ? 'true' : undefined"
  >
    <label :id="`${inputId}-label`" class="number-item__label">
      <span class="number-item__label-text">{{ label }}</span>
      <span
        v-if="tip"
        class="help-icon"
        :data-preference-tooltip="tip"
        aria-label="help"
        v-html="helpCircleIcon"
      />
    </label>
    <div class="preferences-stepper">
      <button
        type="button"
        class="preferences-stepper__btn pref-disabled"
        :disabled="disabled"
        aria-label="decrease"
        @click="handleStep(-1)"
      >
        -
      </button>
      <input
        :id="inputId"
        type="number"
        inputmode="numeric"
        class="preferences-stepper__input"
        :value="localText"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :aria-labelledby="`${inputId}-label`"
        @input="handleInput"
        @blur="handleBlur"
      />
      <button
        type="button"
        class="preferences-stepper__btn pref-disabled"
        :disabled="disabled"
        aria-label="increase"
        @click="handleStep(1)"
      >
        +
      </button>
    </div>
  </div>
</template>
