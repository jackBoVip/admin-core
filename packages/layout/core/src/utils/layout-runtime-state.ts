/**
 * 运行时状态公共工具
 * @description 提供 React/Vue 共用的全屏、锁屏、检查更新、快捷键运行时能力
 */

import { createAutoLockTimer, createCheckUpdatesTimer } from './layout';
import {
  handleShortcutKeydown,
  resolveCheckUpdatesEnabled,
  resolveShortcutEnabled,
} from './layout-features-state';
import type { ShortcutActionHandlers } from './shortcut-keys';
import type { CheckUpdatesConfig, LockScreenConfig } from '../types';
import type { ShortcutKeyPreferences } from '@admin-core/preferences';

/** 全屏能力所需的最小 document 形状。 */
export interface FullscreenDocumentLike {
  /** 当前全屏元素。 */
  fullscreenElement: Element | null;
  /** 文档根元素。 */
  documentElement: {
    /** 请求进入全屏。 */
    requestFullscreen: () => Promise<void> | void;
  };
  /** 退出全屏。 */
  exitFullscreen: () => Promise<void> | void;
}

/**
 * 读取全屏状态。
 * @param targetDocument 文档对象最小子集。
 * @returns 当前是否处于全屏。
 */
export function readFullscreenState(targetDocument: Pick<FullscreenDocumentLike, 'fullscreenElement'>): boolean {
  return !!targetDocument.fullscreenElement;
}

/**
 * 切换全屏并返回切换后的状态。
 * @param targetDocument 文档对象，需支持全屏请求与退出能力。
 * @returns 切换完成后的全屏状态。
 */
export async function toggleFullscreenState(targetDocument: FullscreenDocumentLike): Promise<boolean> {
  const nextValue = !readFullscreenState(targetDocument);
  if (nextValue) {
    await targetDocument.documentElement.requestFullscreen();
  } else {
    await targetDocument.exitFullscreen();
  }
  return nextValue;
}

/**
 * 在可用时启动自动锁屏定时器。
 * @param config 锁屏配置。
 * @param onLock 触发锁屏时执行的回调。
 * @returns 清理函数；不可启动时返回 `null`。
 */
export function startAutoLockTimerIfEnabled(
  config: LockScreenConfig,
  onLock: () => void
): (() => void) | null {
  if (!config.autoLockTime || config.autoLockTime <= 0) {
    return null;
  }
  return createAutoLockTimer(config, onLock);
}

/**
 * 在可用时启动检查更新定时器。
 * @param config 检查更新配置。
 * @param onUpdate 检查结果回调。
 * @param checkFn 实际执行检查更新的异步函数。
 * @returns 清理函数；不可启动时返回 `null`。
 */
export function startCheckUpdatesTimerIfEnabled(
  config: CheckUpdatesConfig,
  onUpdate: (hasUpdate: boolean) => void,
  checkFn?: () => Promise<boolean>
): (() => void) | null {
  if (
    !checkFn ||
    !resolveCheckUpdatesEnabled(config) ||
    !config.interval ||
    config.interval <= 0
  ) {
    return null;
  }
  return createCheckUpdatesTimer(config, onUpdate, checkFn);
}

/** 快捷键 keydown 处理器创建参数。 */
export interface ShortcutKeydownHandlerOptions {
  /** 获取快捷键配置。 */
  getConfig: () => Partial<ShortcutKeyPreferences> | undefined;
  /** 获取快捷键动作处理器集合。 */
  getHandlers: () => ShortcutActionHandlers;
}

/** 运行时事件目标最小形状。 */
export interface RuntimeEventTargetLike {
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

/** 运行时控制器统一接口。 */
export interface RuntimeController {
  /** 启动运行时资源（定时器、监听器等）。 */
  start: () => void;
  /** 在配置更新后重新同步运行时资源。 */
  sync: () => void;
  /** 销毁并清理所有运行时资源。 */
  destroy: () => void;
}

/** 自动锁屏运行时参数。 */
export interface LayoutAutoLockRuntimeOptions {
  /** 获取锁屏配置。 */
  getConfig: () => LockScreenConfig;
  /** 自动锁屏触发时执行。 */
  onLock: () => void;
}

/** 检查更新运行时参数。 */
export interface LayoutCheckUpdatesRuntimeOptions {
  /** 获取检查更新配置。 */
  getConfig: () => CheckUpdatesConfig;
  /** 获取检查更新函数。 */
  getCheckFn: () => (() => Promise<boolean>) | undefined;
  /** 检查更新完成后回调结果。 */
  onUpdate: (hasUpdate: boolean) => void;
}

/** 快捷键运行时参数。 */
export interface LayoutShortcutKeyRuntimeOptions {
  /** 是否启用快捷键监听。 */
  getEnabled: () => boolean;
  /** 键盘按下事件处理函数。 */
  onKeydown: (event: KeyboardEvent) => void;
  /** 事件目标（默认 window）。 */
  eventTarget?: RuntimeEventTargetLike | null;
}

/** `MediaQueryList` 兼容形状（新旧 API）。 */
interface MediaQueryListLike {
  /** 当前是否匹配。 */
  matches: boolean;
  /** 新版事件订阅。 */
  addEventListener?: (
    /** 固定为 `change`。 */
    type: 'change',
    /** 变化回调。 */
    listener: (event: MediaQueryListEvent) => void,
    /** 监听选项。 */
    options?: boolean | AddEventListenerOptions
  ) => void;
  /** 新版事件取消订阅。 */
  removeEventListener?: (
    /** 固定为 `change`。 */
    type: 'change',
    /** 变化回调。 */
    listener: (event: MediaQueryListEvent) => void,
    /** 监听选项。 */
    options?: boolean | EventListenerOptions
  ) => void;
  /** 旧版事件订阅。 */
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  /** 旧版事件取消订阅。 */
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
}

/** 系统主题监听运行时参数。 */
export interface LayoutThemeSystemRuntimeOptions {
  /** 是否启用系统主题同步。 */
  getEnabled: () => boolean;
  /** 写入系统暗色状态。 */
  setSystemDark: (value: boolean) => void;
  /** 自定义 matchMedia 实现。 */
  matchMedia?: (query: string) => MediaQueryListLike | null;
}

/**
 * 解析运行时事件目标，默认回退到 `window`。
 * @param target 可选事件目标。
 * @returns 事件目标。
 */
function resolveRuntimeEventTarget(
  target?: RuntimeEventTargetLike | null
): RuntimeEventTargetLike | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  return null;
}

/**
 * 解析 `matchMedia` 实现，默认回退到 `window.matchMedia`。
 * @param matchMedia 可选自定义实现。
 * @returns `matchMedia` 函数。
 */
function resolveMatchMedia(
  matchMedia?: (query: string) => MediaQueryListLike | null
): ((query: string) => MediaQueryListLike | null) | null {
  if (matchMedia) return matchMedia;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return (query: string) => window.matchMedia(query);
  }
  return null;
}

/**
 * 绑定 media query 监听（兼容新旧 API）。
 * @param mediaQuery media query 对象。
 * @param listener 监听回调。
 */
function addMediaQueryListener(
  mediaQuery: MediaQueryListLike,
  listener: (event: MediaQueryListEvent) => void
) {
  if (typeof mediaQuery.addEventListener === 'function') {
    mediaQuery.addEventListener('change', listener);
    return;
  }
  mediaQuery.addListener?.(listener);
}

/**
 * 移除 media query 监听（兼容新旧 API）。
 * @param mediaQuery media query 对象。
 * @param listener 监听回调。
 */
function removeMediaQueryListener(
  mediaQuery: MediaQueryListLike,
  listener: (event: MediaQueryListEvent) => void
) {
  if (typeof mediaQuery.removeEventListener === 'function') {
    mediaQuery.removeEventListener('change', listener);
    return;
  }
  mediaQuery.removeListener?.(listener);
}

/**
 * 创建可 start/sync/destroy 的定时器运行时壳层。
 * @param setup 启动函数，返回清理函数。
 * @returns 运行时控制器。
 */
function createManagedTimerRuntime(
  setup: () => (() => void) | null
): RuntimeController {
  let started = false;
  let cleanup: (() => void) | null = null;

  /**
   * 清理当前注册的定时器资源。
   */
  const clear = () => {
    cleanup?.();
    cleanup = null;
  };

  /**
   * 在已启动状态下重新建立定时器。
   */
  const sync = () => {
    if (!started) return;
    clear();
    cleanup = setup();
  };

  /**
   * 启动定时器运行时。
   */
  const start = () => {
    if (started) return;
    started = true;
    sync();
  };

  /**
   * 销毁定时器运行时并释放资源。
   */
  const destroy = () => {
    clear();
    started = false;
  };

  return {
    start,
    sync,
    destroy,
  };
}

/**
 * 创建统一快捷键 `keydown` 处理器。
 * @param options 快捷键配置读取器与动作处理器提供器。
 * @returns 可直接绑定到事件系统的键盘事件处理函数。
 */
export function createShortcutKeydownHandler(
  options: ShortcutKeydownHandlerOptions
): (event: KeyboardEvent) => void {
  return (event: KeyboardEvent) => {
    const config = options.getConfig();
    if (!resolveShortcutEnabled(config)) {
      return;
    }
    handleShortcutKeydown(event, config, options.getHandlers());
  };
}

/**
 * 创建自动锁屏定时器运行时控制器。
 * @param options 自动锁屏运行时参数。
 * @returns 标准运行时控制器。
 */
export function createLayoutAutoLockRuntime(
  options: LayoutAutoLockRuntimeOptions
): RuntimeController {
  return createManagedTimerRuntime(() =>
    startAutoLockTimerIfEnabled(options.getConfig(), options.onLock)
  );
}

/**
 * 创建检查更新定时器运行时控制器。
 * @param options 检查更新运行时参数。
 * @returns 标准运行时控制器。
 */
export function createLayoutCheckUpdatesRuntime(
  options: LayoutCheckUpdatesRuntimeOptions
): RuntimeController {
  return createManagedTimerRuntime(() =>
    startCheckUpdatesTimerIfEnabled(
      options.getConfig(),
      options.onUpdate,
      options.getCheckFn()
    )
  );
}

/**
 * 创建快捷键监听运行时控制器（可按 enable 动态启停）。
 * @param options 快捷键运行时参数。
 * @returns 标准运行时控制器。
 */
export function createLayoutShortcutKeyRuntime(
  options: LayoutShortcutKeyRuntimeOptions
): RuntimeController {
  const eventTarget = resolveRuntimeEventTarget(options.eventTarget);
  let started = false;
  let listening = false;

  /**
   * 键盘事件统一转发处理器。
   *
   * @param event 原始事件对象。
   */
  const handleKeydown: EventListener = (event) => {
    options.onKeydown(event as KeyboardEvent);
  };

  /**
   * 绑定快捷键监听。
   */
  const addListener = () => {
    if (!eventTarget || listening) return;
    eventTarget.addEventListener('keydown', handleKeydown);
    listening = true;
  };

  /**
   * 移除快捷键监听。
   */
  const removeListener = () => {
    if (!eventTarget || !listening) return;
    eventTarget.removeEventListener('keydown', handleKeydown);
    listening = false;
  };

  /**
   * 按当前启用状态同步快捷键监听绑定。
   */
  const sync = () => {
    if (!started) return;
    if (options.getEnabled()) {
      addListener();
    } else {
      removeListener();
    }
  };

  /**
   * 启动快捷键运行时。
   */
  const start = () => {
    if (started) return;
    started = true;
    sync();
  };

  /**
   * 销毁快捷键运行时。
   */
  const destroy = () => {
    removeListener();
    started = false;
  };

  return {
    start,
    sync,
    destroy,
  };
}

/**
 * 创建系统主题监听运行时控制器（auto 模式下同步 `prefers-color-scheme`）。
 * @param options 系统主题同步运行时参数。
 * @returns 标准运行时控制器。
 */
export function createLayoutThemeSystemRuntime(
  options: LayoutThemeSystemRuntimeOptions
): RuntimeController {
  const readMatchMedia = resolveMatchMedia(options.matchMedia);
  let started = false;
  let listening = false;
  let mediaQuery: MediaQueryListLike | null = null;

  /**
   * 处理系统主题变化事件。
   *
   * @param event 媒体查询变化事件。
   */
  const handleChange = (event: MediaQueryListEvent) => {
    options.setSystemDark(event.matches);
  };

  /**
   * 懒加载系统主题媒体查询对象。
   *
   * @returns 媒体查询对象。
   */
  const ensureMediaQuery = () => {
    if (mediaQuery || !readMatchMedia) return mediaQuery;
    mediaQuery = readMatchMedia('(prefers-color-scheme: dark)');
    return mediaQuery;
  };

  /**
   * 绑定系统主题变化监听。
   */
  const addListener = () => {
    const nextMediaQuery = ensureMediaQuery();
    if (!nextMediaQuery || listening) return;
    addMediaQueryListener(nextMediaQuery, handleChange);
    listening = true;
  };

  /**
   * 移除系统主题变化监听。
   */
  const removeListener = () => {
    if (!mediaQuery || !listening) return;
    removeMediaQueryListener(mediaQuery, handleChange);
    listening = false;
  };

  /**
   * 按启用状态同步系统主题监听，并立即回写当前系统主题。
   */
  const sync = () => {
    if (!started) return;
    if (!options.getEnabled()) {
      removeListener();
      return;
    }

    const nextMediaQuery = ensureMediaQuery();
    if (!nextMediaQuery) return;

    options.setSystemDark(nextMediaQuery.matches);
    addListener();
  };

  /**
   * 启动系统主题同步运行时。
   */
  const start = () => {
    if (started) return;
    started = true;
    sync();
  };

  /**
   * 销毁系统主题同步运行时。
   */
  const destroy = () => {
    removeListener();
    mediaQuery = null;
    started = false;
  };

  return {
    start,
    sync,
    destroy,
  };
}
