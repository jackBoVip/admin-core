<script setup lang="ts">
/**
 * Vue 滑动条控件
 * @description 使用 Headless Logic 重构，逻辑与 React 完全同步
 */
import { computed } from 'vue';
import { createSliderController } from '@admin-core/preferences';

export interface SliderItemProps {
  /** 最小值 */
  min: number;
  /** 最大值 */
  max: number;
  /** 步进值 */
  step?: number;
  /** 是否禁用 */
  disabled?: boolean;
  /** 格式化显示值 */
  formatValue?: (value: number) => string;
}

const props = withDefaults(defineProps<SliderItemProps>(), {
  step: 0.05,
  disabled: false,
  formatValue: (v: number) => `${Math.round(v * 100)}%`,
});

const modelValue = defineModel<number>({ required: true });

// 创建控制器实例
const controller = computed(() => createSliderController({
  min: props.min,
  max: props.max,
  step: props.step,
}));

// 计算背景样式 (Headless)
const backgroundStyle = computed(() => {
  return controller.value.getBackgroundStyle(
    modelValue.value,
    'var(--primary)',
    'var(--muted)'
  );
});

// 格式化显示值
const displayValue = computed(() => props.formatValue(modelValue.value));

// 处理滑动变化
function handleChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const newValue = parseFloat(target.value);
  // 使用控制器限制和舍入数值
  modelValue.value = controller.value.clamp(newValue);
}
</script>

<template>
  <div class="slider-control">
    <div class="slider-wrapper">
      <input
        type="range"
        class="slider-native"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :disabled="disabled"
        :style="{ background: backgroundStyle }"
        @input="handleChange"
      />
    </div>
    <span class="slider-value">{{ displayValue }}</span>
  </div>
</template>
