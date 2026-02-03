/**
 * 防抖值管理 Composable
 * @description 用于 InputItem、SliderItem 等组件，避免频繁更新
 */
import { ref, watch, onUnmounted, type Ref } from 'vue';

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

  // 防抖定时器 - 使用 ref 确保每个组件实例独立
  const debounceTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

  // 清除定时器辅助函数
  const clearTimer = () => {
    if (debounceTimerRef.value) {
      clearTimeout(debounceTimerRef.value);
      debounceTimerRef.value = null;
    }
  };

  // 同步外部值变化
  watch(modelValue, (newVal) => {
    if (newVal !== localValue.value) {
      localValue.value = newVal;
    }
  });

  // 处理输入变化（防抖）
  const handleInput = (value: T) => {
    localValue.value = value;

    // 清除之前的定时器
    clearTimer();

    if (delay <= 0) {
      modelValue.value = value;
      return;
    }

    // 防抖更新
    debounceTimerRef.value = setTimeout(() => {
      modelValue.value = value;
      debounceTimerRef.value = null;
    }, delay);
  };

  // 清理定时器
  onUnmounted(() => {
    clearTimer();
  });

  return { localValue, handleInput };
}

export default useDebouncedValue;
