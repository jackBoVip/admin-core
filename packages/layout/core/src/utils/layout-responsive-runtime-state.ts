/**
 * 响应式运行时状态公共工具
 * @description 提供 React/Vue 共用的 resize 监听与节流更新逻辑
 */

import { TIMING } from '../constants';
import {
  resolveResponsiveBreakpoint,
  resolveResponsiveFlags,
  resolveViewportWidthChange,
  type ResponsiveBreakpoint,
} from './layout-regions-state';

/**
 * 可监听 `resize` 事件的目标对象接口。
 */
export interface ResizeEventTargetLike {
  /**
   * 添加事件监听。
   * @param type 事件类型。
   * @param listener 监听器。
   * @param options 监听选项。
   */
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  /**
   * 移除事件监听。
   * @param type 事件类型。
   * @param listener 监听器。
   * @param options 监听选项。
   */
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
}

/**
 * 响应式运行时选项。
 */
export interface LayoutResponsiveRuntimeOptions {
  /** 获取当前视口宽度状态。 */
  getWidth: () => number;
  /** 写入最新视口宽度。 */
  setWidth: (width: number) => void;
  /** 尺寸变化事件节流时长。 */
  throttleMs?: number;
  /** 监听目标，默认 `window`。 */
  target?: ResizeEventTargetLike | null;
  /** 自定义读取窗口宽度方法。 */
  readWindowWidth?: () => number;
}

/**
 * 响应式运行时控制器。
 */
export interface LayoutResponsiveRuntimeController {
  /** 启动监听。 */
  start: () => void;
  /** 销毁监听。 */
  destroy: () => void;
}

/**
 * 响应式状态快照。
 */
export interface LayoutResponsiveStateSnapshot {
  /** 宽度。 */
  width: number;
  /** 是否处于移动端断点。 */
  isMobile: boolean;
  /** 是否处于平板断点。 */
  isTablet: boolean;
  /** 是否处于桌面端断点。 */
  isDesktop: boolean;
  /** 当前断点。 */
  breakpoint: ResponsiveBreakpoint;
}

/**
 * 响应式状态控制器。
 */
export interface LayoutResponsiveStateController {
  /** 启动监听。 */
  start: () => void;
  /** 销毁监听。 */
  destroy: () => void;
  /** 获取当前快照。 */
  getSnapshot: () => LayoutResponsiveStateSnapshot;
}

/**
 * 解析 resize 监听目标。
 * @param target 显式传入目标。
 * @returns 监听目标；不可用时返回 `null`。
 */
function resolveResizeTarget(target?: ResizeEventTargetLike | null): ResizeEventTargetLike | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  return null;
}

/**
 * 解析窗口宽度读取函数。
 * @param readWindowWidth 自定义读取函数。
 * @returns 可用读取函数；不可用时返回 `null`。
 */
function resolveReadWindowWidth(readWindowWidth?: () => number): (() => number) | null {
  if (readWindowWidth) return readWindowWidth;
  if (typeof window !== 'undefined') return () => window.innerWidth;
  return null;
}

/**
 * 创建响应式运行时控制器
 * @param options 响应式运行时参数。
 * @returns 响应式运行时控制器。
 */
export function createLayoutResponsiveRuntime(
  options: LayoutResponsiveRuntimeOptions
): LayoutResponsiveRuntimeController {
  const throttleMs = options.throttleMs ?? TIMING.throttle;

  let target: ResizeEventTargetLike | null = null;
  let readWidth: (() => number) | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let started = false;

  /**
   * 清理挂起的节流定时器。
   */
  const clearTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  /**
   * 处理窗口 resize 事件并按节流策略更新宽度。
   */
  const handleResize = () => {
    const readCurrentWidth = readWidth;
    if (!readCurrentWidth) return;
    if (timeoutId) return;

    timeoutId = setTimeout(() => {
      const next = resolveViewportWidthChange(options.getWidth(), readCurrentWidth());
      if (next.changed) {
        options.setWidth(next.width);
      }
      timeoutId = null;
    }, throttleMs);
  };

  /**
   * 启动响应式监听。
   */
  const start = () => {
    if (started) return;
    target = resolveResizeTarget(options.target);
    readWidth = resolveReadWindowWidth(options.readWindowWidth);
    if (!target || !readWidth) return;
    target.addEventListener('resize', handleResize, { passive: true });
    started = true;
  };

  /**
   * 销毁响应式监听并清理资源。
   */
  const destroy = () => {
    if (target && started) {
      target.removeEventListener('resize', handleResize);
      started = false;
    }
    target = null;
    readWidth = null;
    clearTimer();
  };

  return {
    start,
    destroy,
  };
}

/**
 * 创建响应式状态控制器（运行时监听 + 快照派生）
 * @param options 响应式运行时参数。
 * @returns 响应式状态控制器。
 */
export function createLayoutResponsiveStateController(
  options: LayoutResponsiveRuntimeOptions
): LayoutResponsiveStateController {
  const runtime = createLayoutResponsiveRuntime(options);

  /**
   * 获取当前响应式状态快照。
   * @returns 响应式状态快照。
   */
  const getSnapshot = (): LayoutResponsiveStateSnapshot => {
    const width = options.getWidth();
    const flags = resolveResponsiveFlags(width);
    const breakpoint = resolveResponsiveBreakpoint(width);
    return {
      width,
      ...flags,
      breakpoint,
    };
  };

  return {
    start: runtime.start,
    destroy: runtime.destroy,
    getSnapshot,
  };
}
