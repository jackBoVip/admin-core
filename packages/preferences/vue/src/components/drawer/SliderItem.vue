<script setup lang="ts">
/**
 * 滑动条设置项组件
 * @description 用于数值范围选择，性能优化：使用 debounce 避免频繁更新
 */
import { ref, watch, computed, onUnmounted, getCurrentInstance } from 'vue';
import { SLIDER_DEBOUNCE_MS } from '@admin-core/preferences';

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

// 本地值用于即时响应UI
const localValue = ref(modelValue.value);

// 防抖定时器（使用 ref 避免多实例冲突）
const debounceTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

// 同步外部值变化
watch(modelValue, (newVal) => {
  if (newVal !== localValue.value) {
    localValue.value = newVal;
  }
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
  localValue.value = value;
  
  // 清除之前的定时器
  if (debounceTimerRef.value) {
    clearTimeout(debounceTimerRef.value);
  }

  if (props.debounce <= 0) {
    modelValue.value = value;
    return;
  }
  
  // 防抖更新
  debounceTimerRef.value = setTimeout(() => {
    modelValue.value = value;
  }, props.debounce);
};

// 清理定时器
onUnmounted(() => {
  if (debounceTimerRef.value) {
    clearTimeout(debounceTimerRef.value);
    debounceTimerRef.value = null;
  }
});

// 生成稳定的唯一 ID
const instance = getCurrentInstance();
const sliderId = `slider-${instance?.uid ?? Math.random().toString(36).slice(2, 9)}`;
</script>

<template>
  <div class="slider-item" :class="{ disabled }" :data-disabled="disabled ? 'true' : undefined">
    <div class="slider-item-header">
      <label :id="`${sliderId}-label`" class="slider-item-label">{{ label }}</label>
      <span class="slider-item-value">{{ localValue }}{{ unit }}</span>
    </div>
    <input
      type="range"
      class="preferences-slider data-disabled:cursor-not-allowed data-disabled:opacity-60"
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
