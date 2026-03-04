/**
 * 防抖值管理 Hook 模块。
 * @description 为输入类组件提供“即时本地值 + 延迟外部同步”的双通道更新能力。
 */
import { createDebouncedCallback } from '@admin-core/preferences';
import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * 防抖值 Hook 输入参数。
 */
export interface UseDebouncedValueOptions<T> {
  /** 初始值。 */
  value: T;
  /** 值变化回调。 */
  onChange: (value: T) => void;
  /** 防抖延迟（毫秒）。 */
  delay?: number;
}

/**
 * 防抖值 Hook 返回结构。
 */
export interface UseDebouncedValueReturn<T> {
  /** 本地值（用于即时 UI 响应）。 */
  localValue: T;
  /** 更新本地值并触发防抖回调。 */
  setLocalValue: (value: T) => void;
}

/**
 * 防抖值管理 Hook。
 * @description 提供本地值用于即时 UI 响应，同时防抖更新外部状态。
 * @param options Hook 输入参数。
 * @returns 防抖值与更新方法。
 */
export function useDebouncedValue<T>({
  value,
  onChange,
  delay = 300,
}: UseDebouncedValueOptions<T>): UseDebouncedValueReturn<T> {
  /**
   * 本地即时值。
   * @description 用于第一时间驱动 UI 显示，避免等待防抖回调。
   */
  const [localValue, setLocalValueState] = useState(value);
  /**
   * 外部回调引用。
   * @description 始终持有最新 `onChange`，避免防抖函数闭包过期。
   */
  const onChangeRef = useRef(onChange);
  /**
   * 防抖回调引用。
   * @description 维护可重建、可取消的防抖触发器实例。
   */
  const debouncedRef = useRef(createDebouncedCallback(onChange, delay));

  /**
   * 同步 `onChange` 回调引用，避免闭包持有旧函数。
   */
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  /**
   * 同步外部值变化（仅在值发生变化时更新本地状态）。
   */
  useEffect(() => {
    setLocalValueState((prev) => (prev !== value ? value : prev));
  }, [value]);

  /**
   * 仅在 `delay` 变化时重建防抖函数。
   */
  useEffect(() => {
    debouncedRef.current.cancel();
    debouncedRef.current = createDebouncedCallback((val: T) => {
      onChangeRef.current(val);
    }, delay);
    return () => {
      debouncedRef.current.cancel();
    };
  }, [delay]);

  /**
   * 更新本地值并触发防抖变更通知。
   * @description 先更新本地状态保证界面即时反馈，再延迟触发外部 `onChange`。
   * @param newValue 最新输入值。
   * @returns 无返回值。
   */
  const setLocalValue = useCallback(
    (newValue: T) => {
      setLocalValueState(newValue);

      debouncedRef.current.trigger(newValue);
    },
    []
  );

  return { localValue, setLocalValue };
}

/**
 * 默认导出防抖值 Hook。
 */
export default useDebouncedValue;
