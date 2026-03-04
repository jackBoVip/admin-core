<script setup lang="ts">
/**
 * 滑动条设置项组件模块。
 * @description 提供带防抖能力的范围输入控件，用于数值型偏好设置的连续调节。
 */
import { computed, getCurrentInstance } from 'vue';
import { SLIDER_DEBOUNCE_MS } from '@admin-core/preferences';
import { useDebouncedValue } from '../../composables/use-debounced-value';

/**
 * 滑块设置项入参
 * @description 定义数值范围、单位、禁用态与防抖策略。
 */
export interface SliderItemProps {
  /** 标签文本。 */
  label: string;
  /** 最小值。 */
  min?: number;
  /** 最大值。 */
  max?: number;
  /** 步进值。 */
  step?: number;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 单位文本。 */
  unit?: string;
  /** 防抖延迟（毫秒）。 */
  debounce?: number;
}

const props = withDefaults(defineProps<SliderItemProps>(), {
  min: 0,
  max: 100,
  step: 1,
  debounce: SLIDER_DEBOUNCE_MS,
});

/**
 * 滑块模型值
 * @description 与外层 `v-model` 双向同步的当前数值。
 */
const modelValue = defineModel<number>({ default: 0 });

/**
 * 防抖输入控制器
 * @description 提供本地值与防抖更新方法，降低连续拖拽时的状态更新频率。
 */
const { localValue, handleInput: handleInputDebounced } = useDebouncedValue({
  modelValue,
  delay: props.debounce,
});

/**
 * 当前进度百分比
 * @description 基于 `min/max` 与当前值计算轨道进度，用于渲染渐变背景。
 */
const progressPercent = computed(() => {
  const range = props.max - props.min;
  if (range === 0) return 0;
  return ((localValue.value - props.min) / range) * 100;
});

/**
 * 滑块样式变量
 * @description 通过 CSS 变量把进度百分比注入到样式层。
 */
const sliderStyle = computed(() => ({
  '--slider-progress': `${progressPercent.value}%`,
}));

/**
 * 处理滑块值变化事件
 * @description 将字符串输入转换为数字后交给防抖更新器，避免频繁触发外层状态更新。
 * @param e 滑块输入事件对象。
 */
const handleInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const value = Number(target.value);
  handleInputDebounced(value);
};

/**
 * 当前组件实例
 * @description 用于生成稳定的标签关联 ID。
 */
const instance = getCurrentInstance();
/**
 * 滑块控件 ID
 * @description 用于 `label` 与滑块输入框之间的无障碍关联。
 */
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
