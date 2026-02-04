/**
 * 防抖值管理 Hook
 * @description 用于 InputItem、SliderItem 等组件，避免频繁更新
 */
import { useState, useCallback, useRef, useEffect } from 'react';
import { createDebouncedCallback } from '@admin-core/preferences';

export interface UseDebouncedValueOptions<T> {
  /** 初始值 */
  value: T;
  /** 值变化回调 */
  onChange: (value: T) => void;
  /** 防抖延迟 (ms) */
  delay?: number;
}

export interface UseDebouncedValueReturn<T> {
  /** 本地值（用于即时 UI 响应） */
  localValue: T;
  /** 更新本地值并触发防抖回调 */
  setLocalValue: (value: T) => void;
}

/**
 * 防抖值管理 Hook
 * @description 提供本地值用于即时 UI 响应，同时防抖更新外部状态
 */
export function useDebouncedValue<T>({
  value,
  onChange,
  delay = 300,
}: UseDebouncedValueOptions<T>): UseDebouncedValueReturn<T> {
  const [localValue, setLocalValueState] = useState(value);
  const debouncedRef = useRef(createDebouncedCallback(onChange, delay));

  // 同步外部值变化（仅在值实际改变时更新，避免不必要的 re-render）
  useEffect(() => {
    setLocalValueState(prev => prev !== value ? value : prev);
  }, [value]);

  useEffect(() => {
    debouncedRef.current.cancel();
    debouncedRef.current = createDebouncedCallback(onChange, delay);
    return () => {
      debouncedRef.current.cancel();
    };
  }, [onChange, delay]);

  // 更新本地值并触发防抖回调
  const setLocalValue = useCallback(
    (newValue: T) => {
      setLocalValueState(newValue);

      debouncedRef.current.trigger(newValue);
    },
    []
  );

  return { localValue, setLocalValue };
}

export default useDebouncedValue;
