/**
 * 延迟聚焦 Hook 模块。
 * @description 在满足条件时延时聚焦目标元素，避免渲染阶段直接 `focus` 带来的时序抖动。
 */
import { useEffect, useRef, type RefObject } from 'react';

/**
 * 延迟聚焦参数。
 */
export interface UseDeferredFocusOptions {
  /** 是否需要聚焦。 */
  enabled: boolean;
  /** 延迟时间（毫秒）。 */
  delay?: number;
}

/**
 * 使用延迟聚焦能力。
 * @description 用于锁屏输入框、弹窗输入框等场景，统一管理 `setTimeout/clearTimeout` 生命周期。
 * @param targetRef 目标元素引用。
 * @param options 延迟聚焦参数。
 * @returns 无返回值。
 */
export function useDeferredFocus<T extends HTMLElement>(
  targetRef: RefObject<T | null>,
  { enabled, delay = 100 }: UseDeferredFocusOptions,
): void {
  /**
   * 延迟聚焦定时器引用。
   * @description 保存当前待执行的聚焦任务，便于依赖变化时取消。
   */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 监听启用状态并维护延迟聚焦任务。
   * @description 开启时创建延时聚焦，关闭或依赖变化时及时清理旧定时器。
   */
  useEffect(() => {
    /** 需要聚焦时开启新的延时任务。 */
    if (enabled) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        targetRef.current?.focus();
      }, delay);
    } else if (timerRef.current) {
      /** 不需要聚焦时清理已有任务。 */
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    /** 组件卸载或依赖变化时清理定时器。 */
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, delay, targetRef]);
}

/**
 * 默认导出延迟聚焦 Hook。
 */
export default useDeferredFocus;
