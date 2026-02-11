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

export interface ResizeEventTargetLike {
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
}

export interface LayoutResponsiveRuntimeOptions {
  getWidth: () => number;
  setWidth: (width: number) => void;
  throttleMs?: number;
  target?: ResizeEventTargetLike | null;
  readWindowWidth?: () => number;
}

export interface LayoutResponsiveRuntimeController {
  start: () => void;
  destroy: () => void;
}

export interface LayoutResponsiveStateSnapshot {
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: ResponsiveBreakpoint;
}

export interface LayoutResponsiveStateController {
  start: () => void;
  destroy: () => void;
  getSnapshot: () => LayoutResponsiveStateSnapshot;
}

function resolveResizeTarget(target?: ResizeEventTargetLike | null): ResizeEventTargetLike | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  return null;
}

function resolveReadWindowWidth(readWindowWidth?: () => number): (() => number) | null {
  if (readWindowWidth) return readWindowWidth;
  if (typeof window !== 'undefined') return () => window.innerWidth;
  return null;
}

/**
 * 创建响应式运行时控制器
 */
export function createLayoutResponsiveRuntime(
  options: LayoutResponsiveRuntimeOptions
): LayoutResponsiveRuntimeController {
  const throttleMs = options.throttleMs ?? TIMING.throttle;

  let target: ResizeEventTargetLike | null = null;
  let readWidth: (() => number) | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let started = false;

  const clearTimer = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

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

  const start = () => {
    if (started) return;
    target = resolveResizeTarget(options.target);
    readWidth = resolveReadWindowWidth(options.readWindowWidth);
    if (!target || !readWidth) return;
    target.addEventListener('resize', handleResize, { passive: true });
    started = true;
  };

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
 */
export function createLayoutResponsiveStateController(
  options: LayoutResponsiveRuntimeOptions
): LayoutResponsiveStateController {
  const runtime = createLayoutResponsiveRuntime(options);

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
