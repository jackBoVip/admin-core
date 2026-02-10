<script setup lang="ts">
/**
 * 滑动条设置项组件
 * @description 用于数值范围选择，性能优化：使用 debounce 避免频繁更新
 */
import { computed, getCurrentInstance } from 'vue';
import { SLIDER_DEBOUNCE_MS } from '@admin-core/preferences';
import { useDebouncedValue } from '../../composables/use-debounced-value';

const props = withDefaults(defineProps<{
  /** 标签文本 */
  label: string;
  /** 最小值 */
  min?: number;
  /** 最大值 */
  max?: number;
  /** 步进值 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 单位文本 */
  unit?: string;
  /** 防抖延迟 (ms) */
  debounce?: number;
}>(), {
  min: 0,
  max: 100,
  step: 1,
  debounce: SLIDER_DEBOUNCE_MS,
});

const modelValue = defineModel<number>({ default: 0 });

// 使用统一的防抖工具
const { localValue, handleInput: handleInputDebounced } = useDebouncedValue({
  modelValue,
  delay: props.debounce,
});

// 计算已滑动百分比，用于渐变背景（防止除零）
const progressPercent = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((localValue.value - props.min) / range) * 100;
});

const sliderStyle = computed(() => ({
  '--slider-progress': `${progressPercent.value}%`,
}));

// 处理滑动变化（防抖）
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = Number(target.value);
  handleInputDebounced(value);
};

// 生成稳定的唯一 ID
const instance = getCurrentInstance();
const sliderId = `slider-${instance?.uid ?? Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div
    class="slider-item pref-disabled"
    :class="{ disabled }"
    :data-disabled="disabled ? 'true' : undefined"
  >
    <div class="slider-item-header">
      <label :id="`${sliderId}-label`" class="slider-item-label">{{ label }}</label>
      <span class="slider-item-value">{{ localValue }}{{ unit }}</span>
    </div>
    <input
      type="range"
      class="preferences-slider"
      :min="min"
      :max="max"
      :step="step"
      :value="localValue"
      :disabled="disabled"
      :data-disabled="disabled ? 'true' : undefined"
      :aria-labelledby="`${sliderId}-label`"
      :aria-valuemin="min"
      :aria-valuemax="max"
      :aria-valuenow="localValue"
      :style="sliderStyle"
      @input="handleInput"
    />
  </div>
</template>
