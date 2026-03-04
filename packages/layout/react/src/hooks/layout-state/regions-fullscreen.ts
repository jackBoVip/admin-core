/**
 * 布局全屏区域状态 Hook（React）。
 * @description 封装浏览器全屏 API 的状态同步、错误处理与切换动作。
 */
import { createLayoutFullscreenStateController, logger } from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLayoutContext } from '../use-layout-context';

/**
 * 全屏切换返回值类型。
 * @description 由控制器 `toggle` 返回值推导，保持与 core 层实现一致。
 */
type FullscreenToggleResult = ReturnType<
  ReturnType<typeof createLayoutFullscreenStateController>['toggle']
>;

/**
 * `useFullscreenState` 返回值。
 */
export interface UseFullscreenStateReturn {
  /** 当前是否处于全屏状态。 */
  isFullscreen: boolean;
  /** 触发全屏切换。 */
  toggle: () => FullscreenToggleResult;
}

/**
 * 管理全屏状态与全屏切换行为。
 * @returns 当前全屏状态及切换函数。
 */
export function useFullscreenState(): UseFullscreenStateReturn {
  /**
   * 布局上下文。
   * @description 提供全屏切换事件回调与运行时配置。
   */
  const context = useLayoutContext();
  /**
   * 全屏状态。
   */
  const [isFullscreen, setIsFullscreen] = useState(false);
  /**
   * 全屏状态引用缓存。
   * @description 供控制器读取最新状态，避免闭包滞后。
   */
  const isFullscreenRef = useRef(isFullscreen);
  isFullscreenRef.current = isFullscreen;

  /**
   * 全屏状态控制器，封装浏览器全屏 API 与错误处理。
   */
  const controller = useMemo(
    () =>
      createLayoutFullscreenStateController({
        getIsFullscreen: () => isFullscreenRef.current,
        setIsFullscreen: (nextValue) => {
          isFullscreenRef.current = nextValue;
          setIsFullscreen((prev) => (prev === nextValue ? prev : nextValue));
        },
        onFullscreenToggle: (nextValue) => {
          context.events.onFullscreenToggle?.(nextValue);
        },
        onError: (error) => {
          logger.error('Fullscreen error:', error);
        },
      }),
    [context.events]
  );

  useEffect(() => {
    controller.start();
    return () => {
      controller.destroy();
    };
  }, [controller]);

  /**
   * 触发全屏切换。
   */
  const toggle = useCallback(() => controller.toggle(), [controller]);

  return {
    isFullscreen,
    toggle,
  };
}
