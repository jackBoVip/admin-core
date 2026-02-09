/**
 * 延迟聚焦 Hook
 * @description 在条件满足时对目标元素做一次延迟聚焦，避免直接在渲染阶段调用 focus 带来的抖动。
 */
import { useEffect, useRef, type RefObject } from 'react';

export interface UseDeferredFocusOptions {
  /** 是否需要聚焦 */
  enabled: boolean;
  /** 延迟时间（毫秒） */
  delay?: number;
}

/**
 * 延迟聚焦 Hook
 * @description 用于锁屏输入框、弹窗输入框等场景，统一管理 setTimeout/clearTimeout 逻辑。
 */
export function useDeferredFocus<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  { enabled, delay = 100 }: UseDeferredFocusOptions,
): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 需要聚焦时，开启一次新的延迟定时器
    if (enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        targetRef.current?.focus();
      }, delay);
    } else if (timerRef.current) {
      // 不需要聚焦时，清理已有定时器
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 组件卸载或依赖变更时清理定时器
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, delay, targetRef]);
}

export default useDeferredFocus;


