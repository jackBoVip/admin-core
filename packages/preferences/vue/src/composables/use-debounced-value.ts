/**
 * 防抖值管理 Composable 模块。
 * @description 为输入类组件提供“即时本地值 + 延迟外部同步”的双通道更新能力。
 */
import { createDebouncedCallback } from '@admin-core/preferences';
import { ref, watch, onUnmounted, type Ref } from 'vue';

/**
 * 防抖值 Composable 输入参数。
 */
export interface UseDebouncedValueOptions<T> {
  /** 外部模型值。 */
  modelValue: Ref<T>;
  /** 防抖延迟（毫秒）。 */
  delay?: number;
}

/**
 * 防抖值 Composable 返回结构。
 */
export interface UseDebouncedValueReturn<T> {
  /** 本地值（用于即时 UI 响应）。 */
  localValue: Ref<T>;
  /** 更新本地值并触发防抖回调。 */
  handleInput: (value: T) => void;
}

/**
 * 防抖值管理 Composable。
 * @description 提供本地值用于即时 UI 响应，同时防抖更新外部状态。
 * @param options Composable 输入参数。
 * @returns 本地值与输入处理方法。
 */
export function useDebouncedValue<T>({
  modelValue,
  delay = 300,
}: UseDebouncedValueOptions<T>): UseDebouncedValueReturn<T> {
  /**
   * 本地值用于即时响应 UI。
   */
  const localValue = ref(modelValue.value) as Ref<T>;

  /**
   * 防抖写回外部模型的处理器。
   * @description 使用统一防抖器延迟更新 `modelValue`，减少高频输入造成的上层抖动。
   */
  const debounced = createDebouncedCallback((value: T) => {
    modelValue.value = value;
  }, delay);

  /**
   * 同步外部值变化。
   */
  watch(modelValue, (newVal) => {
    if (newVal !== localValue.value) {
      localValue.value = newVal;
    }
  });

  /**
   * 处理输入值变更。
   * @description 先同步本地值以保证界面即时响应，再通过防抖回调延迟写回外部模型。
   * @param value 最新输入值。
   * @returns 无返回值。
   */
  const handleInput = (value: T) => {
    localValue.value = value;

    debounced.trigger(value);
  };

  /**
   * 组件卸载时清理防抖定时器。
   */
  onUnmounted(() => {
    debounced.cancel();
  });

  return { localValue, handleInput };
}

/**
 * 默认导出防抖值 Composable。
 */
export default useDebouncedValue;
