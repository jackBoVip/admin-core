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

export interface FullscreenDocumentLike {
  fullscreenElement: Element | null;
  documentElement: {
    requestFullscreen: () => Promise<void> | void;
  };
  exitFullscreen: () => Promise<void> | void;
}

/**
 * 读取全屏状态
 */
export function readFullscreenState(targetDocument: Pick<FullscreenDocumentLike, 'fullscreenElement'>): boolean {
  return !!targetDocument.fullscreenElement;
}

/**
 * 切换全屏并返回切换后的状态
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
 * 在可用时启动自动锁屏定时器
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
 * 在可用时启动检查更新定时器
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

export interface ShortcutKeydownHandlerOptions {
  getConfig: () => Partial<ShortcutKeyPreferences> | undefined;
  getHandlers: () => ShortcutActionHandlers;
}

export interface RuntimeEventTargetLike {
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

export interface RuntimeController {
  start: () => void;
  sync: () => void;
  destroy: () => void;
}

export interface LayoutAutoLockRuntimeOptions {
  getConfig: () => LockScreenConfig;
  onLock: () => void;
}

export interface LayoutCheckUpdatesRuntimeOptions {
  getConfig: () => CheckUpdatesConfig;
  getCheckFn: () => (() => Promise<boolean>) | undefined;
  onUpdate: (hasUpdate: boolean) => void;
}

export interface LayoutShortcutKeyRuntimeOptions {
  getEnabled: () => boolean;
  onKeydown: (event: KeyboardEvent) => void;
  eventTarget?: RuntimeEventTargetLike | null;
}

interface MediaQueryListLike {
  matches: boolean;
  addEventListener?: (
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
    options?: boolean | AddEventListenerOptions
  ) => void;
  removeEventListener?: (
    type: 'change',
    listener: (event: MediaQueryListEvent) => void,
    options?: boolean | EventListenerOptions
  ) => void;
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
}

export interface LayoutThemeSystemRuntimeOptions {
  getEnabled: () => boolean;
  setSystemDark: (value: boolean) => void;
  matchMedia?: (query: string) => MediaQueryListLike | null;
}

function resolveRuntimeEventTarget(
  target?: RuntimeEventTargetLike | null
): RuntimeEventTargetLike | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  return null;
}

function resolveMatchMedia(
  matchMedia?: (query: string) => MediaQueryListLike | null
): ((query: string) => MediaQueryListLike | null) | null {
  if (matchMedia) return matchMedia;
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return (query: string) => window.matchMedia(query);
  }
  return null;
}

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

function createManagedTimerRuntime(
  setup: () => (() => void) | null
): RuntimeController {
  let started = false;
  let cleanup: (() => void) | null = null;

  const clear = () => {
    cleanup?.();
    cleanup = null;
  };

  const sync = () => {
    if (!started) return;
    clear();
    cleanup = setup();
  };

  const start = () => {
    if (started) return;
    started = true;
    sync();
  };

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
 * 创建统一快捷键 keydown 处理器
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
 * 创建自动锁屏定时器运行时控制器
 */
export function createLayoutAutoLockRuntime(
  options: LayoutAutoLockRuntimeOptions
): RuntimeController {
  return createManagedTimerRuntime(() =>
    startAutoLockTimerIfEnabled(options.getConfig(), options.onLock)
  );
}

/**
 * 创建检查更新定时器运行时控制器
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
 * 创建快捷键监听运行时控制器（可按 enable 动态启停）
 */
export function createLayoutShortcutKeyRuntime(
  options: LayoutShortcutKeyRuntimeOptions
): RuntimeController {
  const eventTarget = resolveRuntimeEventTarget(options.eventTarget);
  let started = false;
  let listening = false;
  const handleKeydown: EventListener = (event) => {
    options.onKeydown(event as KeyboardEvent);
  };

  const addListener = () => {
    if (!eventTarget || listening) return;
    eventTarget.addEventListener('keydown', handleKeydown);
    listening = true;
  };

  const removeListener = () => {
    if (!eventTarget || !listening) return;
    eventTarget.removeEventListener('keydown', handleKeydown);
    listening = false;
  };

  const sync = () => {
    if (!started) return;
    if (options.getEnabled()) {
      addListener();
    } else {
      removeListener();
    }
  };

  const start = () => {
    if (started) return;
    started = true;
    sync();
  };

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
 * 创建系统主题监听运行时控制器（auto 模式下同步 prefers-color-scheme）
 */
export function createLayoutThemeSystemRuntime(
  options: LayoutThemeSystemRuntimeOptions
): RuntimeController {
  const readMatchMedia = resolveMatchMedia(options.matchMedia);
  let started = false;
  let listening = false;
  let mediaQuery: MediaQueryListLike | null = null;

  const handleChange = (event: MediaQueryListEvent) => {
    options.setSystemDark(event.matches);
  };

  const ensureMediaQuery = () => {
    if (mediaQuery || !readMatchMedia) return mediaQuery;
    mediaQuery = readMatchMedia('(prefers-color-scheme: dark)');
    return mediaQuery;
  };

  const addListener = () => {
    const nextMediaQuery = ensureMediaQuery();
    if (!nextMediaQuery || listening) return;
    addMediaQueryListener(nextMediaQuery, handleChange);
    listening = true;
  };

  const removeListener = () => {
    if (!mediaQuery || !listening) return;
    removeMediaQueryListener(mediaQuery, handleChange);
    listening = false;
  };

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

  const start = () => {
    if (started) return;
    started = true;
    sync();
  };

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
