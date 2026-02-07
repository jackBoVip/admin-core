<script setup lang="ts">
/**
 * 数字输入设置项组件
 * @description 带 +/- 步进控制的数字输入
 */
import { ref, watch, getCurrentInstance } from 'vue';
import { getIcon } from '@admin-core/preferences';

const props = withDefaults(defineProps<{
  /** 标签文本 */
  label: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进值 */
  step?: number;
  /** 提示文本 */
  tip?: string;
}>(), {
  step: 1,
});

const modelValue = defineModel<number>({ default: 0 });
const localText = ref(String(modelValue.value ?? 0));
const helpCircleIcon = getIcon('helpCircle');

watch(modelValue, (val) => {
  const next = String(val ?? 0);
  if (localText.value !== next) {
    localText.value = next;
  }
});

const clamp = (value: number) => {
  let next = Number.isFinite(value) ? value : 0;
  if (props.min !== undefined) next = Math.max(props.min, next);
  if (props.max !== undefined) next = Math.min(props.max, next);
  return next;
};

const commit = (value: number) => {
  const next = clamp(value);
  modelValue.value = next;
  localText.value = String(next);
};

const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  localText.value = target.value;
};

const handleBlur = () => {
  const parsed = Number.parseInt(localText.value, 10);
  commit(Number.isNaN(parsed) ? (modelValue.value ?? 0) : parsed);
};

const handleStep = (direction: number) => {
  if (props.disabled) return;
  const current = Number.parseInt(localText.value, 10);
  const base = Number.isNaN(current) ? (modelValue.value ?? 0) : current;
  const step = props.step ?? 1;
  commit(base + step * direction);
};

// 生成稳定的唯一 ID
const instance = getCurrentInstance();
const inputId = `number-${instance?.uid ?? Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div
    class="number-item"
    :class="{ disabled }"
    :data-disabled="disabled ? 'true' : undefined"
    :style="{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px', flexWrap: 'nowrap' }"
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
    <div class="preferences-stepper" :style="{ display: 'flex', alignItems: 'center', width: '165px', flex: '0 0 165px' }">
      <button
        type="button"
        class="preferences-stepper__btn"
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
        class="preferences-stepper__btn"
        :disabled="disabled"
        aria-label="increase"
        @click="handleStep(1)"
      >
        +
      </button>
    </div>
  </div>
</template>
