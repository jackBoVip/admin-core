/**
 * 顶栏运行时状态公共工具
 * @description 提供 React/Vue 共用的顶栏自动隐藏监听逻辑
 */

import {
  isHeaderAutoHideMode,
  resolveHeaderHidden,
  resolveHeaderMode,
  resolveHeaderMouseHidden,
  resolveHeaderScrollHidden,
  type HeaderMode,
} from './layout-regions-state';

export interface HeaderAutoHideEventTargetLike {
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

export interface HeaderAutoHideScrollTargetLike extends HeaderAutoHideEventTargetLike {
  scrollTop: number;
}

export interface LayoutHeaderAutoHideRuntimeOptions {
  getMode: () => HeaderMode;
  getHidden: () => boolean;
  setHidden: (value: boolean) => void;
  getHeaderHeight: () => number;
  getWindowScrollY?: () => number;
  getScrollTarget?: () => HeaderAutoHideScrollTargetLike | null;
  eventTarget?: HeaderAutoHideEventTargetLike | null;
  requestFrame?: (cb: FrameRequestCallback) => number;
  cancelFrame?: (id: number) => void;
}

export interface LayoutHeaderAutoHideRuntimeController {
  start: () => void;
  refresh: () => void;
  destroy: () => void;
}

export interface LayoutHeaderStateSnapshot {
  hidden: boolean;
  mode: HeaderMode;
}

export interface LayoutHeaderStateControllerOptions {
  getStateHidden: () => boolean;
  getConfigHidden: () => boolean;
  getMode: () => unknown;
  getHeaderHeight: () => number;
  setStateHidden: (value: boolean) => void;
}

export interface LayoutHeaderStateController {
  getSnapshot: () => LayoutHeaderStateSnapshot;
  setHidden: (value: boolean) => void;
  start: () => void;
  sync: () => void;
  destroy: () => void;
}

function resolveEventTarget(
  target?: HeaderAutoHideEventTargetLike | null
): HeaderAutoHideEventTargetLike | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  return null;
}

function resolveGetWindowScrollY(getWindowScrollY?: () => number): (() => number) | null {
  if (getWindowScrollY) return getWindowScrollY;
  if (typeof window !== 'undefined') return () => window.scrollY;
  return null;
}

function resolveGetScrollTarget(
  getScrollTarget?: () => HeaderAutoHideScrollTargetLike | null
): (() => HeaderAutoHideScrollTargetLike | null) {
  if (getScrollTarget) return getScrollTarget;
  return () =>
    typeof document !== 'undefined'
      ? (document.querySelector('.layout-content') as HeaderAutoHideScrollTargetLike | null)
      : null;
}

/**
 * 创建顶栏自动隐藏运行时控制器
 */
export function createLayoutHeaderAutoHideRuntime(
  options: LayoutHeaderAutoHideRuntimeOptions
): LayoutHeaderAutoHideRuntimeController {
  const requestFrame = options.requestFrame ?? ((cb) => requestAnimationFrame(cb));
  const cancelFrame = options.cancelFrame ?? ((id) => cancelAnimationFrame(id));
  const getScrollTarget = resolveGetScrollTarget(options.getScrollTarget);

  let target: HeaderAutoHideEventTargetLike | null = null;
  let readWindowScrollY: (() => number) | null = null;
  let started = false;
  let listening = false;

  let mouseY = 0;
  let lastScrollYWindow = 0;
  let lastScrollYElement = 0;
  let scrollTarget: HeaderAutoHideScrollTargetLike | null = null;
  let scrollRafWindow: number | null = null;
  let scrollRafElement: number | null = null;
  let mouseMoveRaf: number | null = null;

  const clearRaf = () => {
    if (scrollRafWindow !== null) {
      cancelFrame(scrollRafWindow);
      scrollRafWindow = null;
    }
    if (scrollRafElement !== null) {
      cancelFrame(scrollRafElement);
      scrollRafElement = null;
    }
    if (mouseMoveRaf !== null) {
      cancelFrame(mouseMoveRaf);
      mouseMoveRaf = null;
    }
  };

  const setHiddenIfChanged = (value: boolean) => {
    if (value !== options.getHidden()) {
      options.setHidden(value);
    }
  };

  const handleMouseMove = (event: Event) => {
    if (options.getMode() !== 'auto') return;
    mouseY = (event as MouseEvent).clientY;
    if (mouseMoveRaf !== null) return;
    mouseMoveRaf = requestFrame(() => {
      const nextHidden = resolveHeaderMouseHidden({
        mouseY,
        currentHidden: options.getHidden(),
      });
      setHiddenIfChanged(nextHidden);
      mouseMoveRaf = null;
    });
  };

  const updateHiddenByScroll = (currentScrollY: number, lastScrollY: number) => {
    const result = resolveHeaderScrollHidden({
      mode: options.getMode(),
      currentHidden: options.getHidden(),
      currentScrollY,
      lastScrollY,
      headerHeight: options.getHeaderHeight(),
      mouseY,
    });
    setHiddenIfChanged(result.hidden);
    return result.lastScrollY;
  };

  const handleWindowScroll = () => {
    const readCurrentWindowScrollY = readWindowScrollY;
    if (!readCurrentWindowScrollY) return;
    if (scrollRafWindow !== null) return;
    scrollRafWindow = requestFrame(() => {
      lastScrollYWindow = updateHiddenByScroll(readCurrentWindowScrollY(), lastScrollYWindow);
      scrollRafWindow = null;
    });
  };

  const handleElementScroll = () => {
    if (!scrollTarget) return;
    if (scrollRafElement !== null) return;
    scrollRafElement = requestFrame(() => {
      if (!scrollTarget) return;
      lastScrollYElement = updateHiddenByScroll(scrollTarget.scrollTop, lastScrollYElement);
      scrollRafElement = null;
    });
  };

  const removeListeners = () => {
    if (!listening || !target) return;
    target.removeEventListener('scroll', handleWindowScroll);
    target.removeEventListener('mousemove', handleMouseMove);
    scrollTarget?.removeEventListener('scroll', handleElementScroll);
    listening = false;
  };

  const refresh = () => {
    if (!started || !target || !readWindowScrollY) return;

    removeListeners();
    clearRaf();
    scrollTarget = getScrollTarget();
    lastScrollYWindow = readWindowScrollY();
    lastScrollYElement = scrollTarget?.scrollTop ?? 0;

    const mode = options.getMode();
    if (!isHeaderAutoHideMode(mode)) {
      setHiddenIfChanged(false);
      return;
    }

    target.addEventListener('scroll', handleWindowScroll, { passive: true });
    scrollTarget?.addEventListener('scroll', handleElementScroll, { passive: true });
    if (mode === 'auto') {
      target.addEventListener('mousemove', handleMouseMove, { passive: true });
    }
    listening = true;
  };

  const start = () => {
    if (started) return;
    target = resolveEventTarget(options.eventTarget);
    readWindowScrollY = resolveGetWindowScrollY(options.getWindowScrollY);
    if (!target || !readWindowScrollY) return;
    started = true;
    refresh();
  };

  const destroy = () => {
    removeListeners();
    clearRaf();
    scrollTarget = null;
    target = null;
    readWindowScrollY = null;
    started = false;
  };

  return {
    start,
    refresh,
    destroy,
  };
}

/**
 * 创建顶栏状态控制器（派生 + 运行时自动隐藏）
 */
export function createLayoutHeaderStateController(
  options: LayoutHeaderStateControllerOptions
): LayoutHeaderStateController {
  const getSnapshot = (): LayoutHeaderStateSnapshot => ({
    hidden: resolveHeaderHidden({
      stateHidden: options.getStateHidden(),
      configHidden: options.getConfigHidden(),
    }),
    mode: resolveHeaderMode(options.getMode()),
  });

  const setHidden = (value: boolean) => {
    if (options.getStateHidden() !== value) {
      options.setStateHidden(value);
    }
  };

  const runtime = createLayoutHeaderAutoHideRuntime({
    getMode: () => getSnapshot().mode,
    getHidden: () => getSnapshot().hidden,
    setHidden,
    getHeaderHeight: options.getHeaderHeight,
  });

  return {
    getSnapshot,
    setHidden,
    start: runtime.start,
    sync: runtime.refresh,
    destroy: runtime.destroy,
  };
}
