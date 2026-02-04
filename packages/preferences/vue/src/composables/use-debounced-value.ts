/**
 * 防抖值管理 Composable
 * @description 用于 InputItem、SliderItem 等组件，避免频繁更新
 */
import { ref, watch, onUnmounted, type Ref } from 'vue';
import { createDebouncedCallback } from '@admin-core/preferences';

export interface UseDebouncedValueOptions<T> {
  /** 外部模型值 */
  modelValue: Ref<T>;
  /** 防抖延迟 (ms) */
  delay?: number;
}

export interface UseDebouncedValueReturn<T> {
  /** 本地值（用于即时 UI 响应） */
  localValue: Ref<T>;
  /** 更新本地值并触发防抖回调 */
  handleInput: (value: T) => void;
}

/**
 * 防抖值管理 Composable
 * @description 提供本地值用于即时 UI 响应，同时防抖更新外部状态
 */
export function useDebouncedValue<T>({
  modelValue,
  delay = 300,
}: UseDebouncedValueOptions<T>): UseDebouncedValueReturn<T> {
  // 本地值用于即时响应 UI
  const localValue = ref(modelValue.value) as Ref<T>;

  const debounced = createDebouncedCallback((value: T) => {
    modelValue.value = value;
  }, delay);

  // 同步外部值变化
  watch(modelValue, (newVal) => {
    if (newVal !== localValue.value) {
      localValue.value = newVal;
    }
  });

  // 处理输入变化（防抖）
  const handleInput = (value: T) => {
    localValue.value = value;

    debounced.trigger(value);
  };

  // 清理定时器
  onUnmounted(() => {
    debounced.cancel();
  });

  return { localValue, handleInput };
}

export default useDebouncedValue;
