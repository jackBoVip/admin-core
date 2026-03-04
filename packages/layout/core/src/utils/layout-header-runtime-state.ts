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

/** 顶栏自动隐藏监听所需事件目标形状。 */
export interface HeaderAutoHideEventTargetLike {
  /** 绑定事件。 */
  addEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ) => void;
  /** 移除事件。 */
  removeEventListener: (
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ) => void;
}

/** 顶栏自动隐藏监听所需滚动目标形状。 */
export interface HeaderAutoHideScrollTargetLike extends HeaderAutoHideEventTargetLike {
  /** 当前滚动位置。 */
  scrollTop: number;
}

/** 顶栏自动隐藏运行时参数。 */
export interface LayoutHeaderAutoHideRuntimeOptions {
  /** 获取顶栏模式。 */
  getMode: () => HeaderMode;
  /** 获取当前隐藏状态。 */
  getHidden: () => boolean;
  /** 设置隐藏状态。 */
  setHidden: (value: boolean) => void;
  /** 获取顶栏高度。 */
  getHeaderHeight: () => number;
  /** 读取窗口滚动位置。 */
  getWindowScrollY?: () => number;
  /** 获取内容滚动目标。 */
  getScrollTarget?: () => HeaderAutoHideScrollTargetLike | null;
  /** 事件目标（默认 window）。 */
  eventTarget?: HeaderAutoHideEventTargetLike | null;
  /** 自定义 RAF 调度。 */
  requestFrame?: (cb: FrameRequestCallback) => number;
  /** 取消 RAF 的函数。 */
  cancelFrame?: (id: number) => void;
}

/** 顶栏自动隐藏运行时控制器。 */
export interface LayoutHeaderAutoHideRuntimeController {
  /** 启动自动隐藏监听。 */
  start: () => void;
  /** 按最新配置刷新监听绑定。 */
  refresh: () => void;
  /** 销毁监听并释放资源。 */
  destroy: () => void;
}

/** 顶栏状态快照。 */
export interface LayoutHeaderStateSnapshot {
  /** 顶栏是否隐藏。 */
  hidden: boolean;
  /** 顶栏模式。 */
  mode: HeaderMode;
}

/** 顶栏状态控制器创建参数。 */
export interface LayoutHeaderStateControllerOptions {
  /** 获取运行态隐藏状态。 */
  getStateHidden: () => boolean;
  /** 获取配置隐藏状态。 */
  getConfigHidden: () => boolean;
  /** 获取模式配置。 */
  getMode: () => unknown;
  /** 获取顶栏高度。 */
  getHeaderHeight: () => number;
  /** 设置运行态隐藏状态。 */
  setStateHidden: (value: boolean) => void;
}

/** 顶栏状态控制器。 */
export interface LayoutHeaderStateController {
  /** 获取当前顶栏状态快照。 */
  getSnapshot: () => LayoutHeaderStateSnapshot;
  /** 设置运行态隐藏状态。 */
  setHidden: (value: boolean) => void;
  /** 启动运行时监听。 */
  start: () => void;
  /** 同步运行时配置。 */
  sync: () => void;
  /** 销毁运行时监听。 */
  destroy: () => void;
}

/**
 * 解析事件目标，默认回退到 `window`。
 * @param target 可选事件目标。
 * @returns 事件目标。
 */
function resolveEventTarget(
  target?: HeaderAutoHideEventTargetLike | null
): HeaderAutoHideEventTargetLike | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  return null;
}

/**
 * 解析窗口滚动读取函数。
 * @param getWindowScrollY 可选读取函数。
 * @returns 读取函数。
 */
function resolveGetWindowScrollY(getWindowScrollY?: () => number): (() => number) | null {
  if (getWindowScrollY) return getWindowScrollY;
  if (typeof window !== 'undefined') return () => window.scrollY;
  return null;
}

/**
 * 解析内容滚动目标读取函数。
 * @param getScrollTarget 可选读取函数。
 * @returns 读取函数。
 */
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
 * 创建顶栏自动隐藏运行时控制器。
 * @param options 自动隐藏运行时参数。
 * @returns 顶栏自动隐藏运行时控制器。
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

  /**
   * 清理所有挂起的 RAF 任务。
   */
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

  /**
   * 仅在状态变化时写入隐藏状态。
   *
   * @param value 目标隐藏状态。
   */
  const setHiddenIfChanged = (value: boolean) => {
    if (value !== options.getHidden()) {
      options.setHidden(value);
    }
  };

  /**
   * 处理鼠标移动事件并按策略计算 auto 模式隐藏状态。
   *
   * @param event 鼠标事件。
   */
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

  /**
   * 基于滚动位置计算顶栏隐藏状态。
   *
   * @param currentScrollY 当前滚动位置。
   * @param lastScrollY 上一次滚动位置。
   * @returns 本次更新后的滚动位置。
   */
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

  /**
   * 处理窗口滚动事件（RAF 节流）。
   */
  const handleWindowScroll = () => {
    const readCurrentWindowScrollY = readWindowScrollY;
    if (!readCurrentWindowScrollY) return;
    if (scrollRafWindow !== null) return;
    scrollRafWindow = requestFrame(() => {
      lastScrollYWindow = updateHiddenByScroll(readCurrentWindowScrollY(), lastScrollYWindow);
      scrollRafWindow = null;
    });
  };

  /**
   * 处理内容容器滚动事件（RAF 节流）。
   */
  const handleElementScroll = () => {
    if (!scrollTarget) return;
    if (scrollRafElement !== null) return;
    scrollRafElement = requestFrame(() => {
      if (!scrollTarget) return;
      lastScrollYElement = updateHiddenByScroll(scrollTarget.scrollTop, lastScrollYElement);
      scrollRafElement = null;
    });
  };

  /**
   * 移除自动隐藏相关事件监听。
   */
  const removeListeners = () => {
    if (!listening || !target) return;
    target.removeEventListener('scroll', handleWindowScroll);
    target.removeEventListener('mousemove', handleMouseMove);
    scrollTarget?.removeEventListener('scroll', handleElementScroll);
    listening = false;
  };

  /**
   * 按当前配置刷新监听绑定与初始滚动基线。
   */
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

  /**
   * 启动顶栏自动隐藏运行时。
   */
  const start = () => {
    if (started) return;
    target = resolveEventTarget(options.eventTarget);
    readWindowScrollY = resolveGetWindowScrollY(options.getWindowScrollY);
    if (!target || !readWindowScrollY) return;
    started = true;
    refresh();
  };

  /**
   * 销毁顶栏自动隐藏运行时并清理资源。
   */
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
 * 创建顶栏状态控制器（派生 + 运行时自动隐藏）。
 * @param options 顶栏状态控制器参数。
 * @returns 顶栏状态控制器。
 */
export function createLayoutHeaderStateController(
  options: LayoutHeaderStateControllerOptions
): LayoutHeaderStateController {
  /**
   * 读取当前顶栏状态快照。
   * @returns 顶栏隐藏状态与模式。
   */
  const getSnapshot = (): LayoutHeaderStateSnapshot => ({
    hidden: resolveHeaderHidden({
      stateHidden: options.getStateHidden(),
      configHidden: options.getConfigHidden(),
    }),
    mode: resolveHeaderMode(options.getMode()),
  });

  /**
   * 设置运行态隐藏状态。
   *
   * @param value 目标隐藏状态。
   */
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
