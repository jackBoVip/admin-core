/**
 * 布局响应式断点 Hook（React）。
 * @description 监听窗口宽度变化并输出移动端/平板/桌面断点快照。
 */
import {
  createLayoutResponsiveStateController,
  TIMING,
} from '@admin-core/layout';
import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * 布局响应式快照类型。
 * @description 由响应式状态控制器快照推导，保持与 core 层实现一致。
 */
type LayoutResponsiveSnapshot = ReturnType<
  ReturnType<typeof createLayoutResponsiveStateController>['getSnapshot']
>;

/**
 * `useResponsive` 返回值。
 */
export interface UseResponsiveReturn {
  /** 当前视口宽度。 */
  width: LayoutResponsiveSnapshot['width'];
  /** 是否命中移动端断点。 */
  isMobile: LayoutResponsiveSnapshot['isMobile'];
  /** 是否命中平板断点。 */
  isTablet: LayoutResponsiveSnapshot['isTablet'];
  /** 是否命中桌面端断点。 */
  isDesktop: LayoutResponsiveSnapshot['isDesktop'];
  /** 当前断点名称。 */
  breakpoint: LayoutResponsiveSnapshot['breakpoint'];
}

/**
 * 监听并返回布局响应式状态。
 * @description 统一监听窗口尺寸变化并输出断点与终端类型标识。
 * @returns 当前视口宽度、设备断点及断点名称。
 */
export function useResponsive(): UseResponsiveReturn {
  /**
   * 当前窗口宽度。
   */
  const [width, setWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : TIMING.defaultWindowWidth
  );
  /**
   * 宽度引用缓存，供响应式控制器读取最新值。
   */
  const widthRef = useRef(width);
  widthRef.current = width;
  /**
   * 响应式状态控制器，统一监听窗口尺寸变化。
   */
  const controller = useMemo(
    () =>
      createLayoutResponsiveStateController({
        getWidth: () => widthRef.current,
        setWidth: (nextWidth) => {
          widthRef.current = nextWidth;
          setWidth(nextWidth);
        },
      }),
    []
  );
  /**
   * 当前响应式断点快照。
   */
  const snapshot = useMemo(() => controller.getSnapshot(), [controller, width]);

  useEffect(() => {
    controller.start();
    return () => {
      controller.destroy();
    };
  }, [controller]);

  return {
    width: snapshot.width,
    isMobile: snapshot.isMobile,
    isTablet: snapshot.isTablet,
    isDesktop: snapshot.isDesktop,
    breakpoint: snapshot.breakpoint,
  };
}
