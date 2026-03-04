/**
 * 锁屏管理工具
 * @description 提供自动锁屏定时器与锁屏管理器创建能力。
 */

import type { Preferences } from '../types';

/**
 * 锁屏管理器配置。
 */
export interface LockScreenManagerOptions {
  /** 获取最新偏好设置。 */
  getPreferences: () => Preferences;
  /** 触发锁屏时的回调。 */
  onLock: () => void;
}

/** 默认活动事件节流间隔（毫秒）。 */
const THROTTLE_DELAY = 1000;

/** 默认用于重置自动锁屏计时器的活动事件列表。 */
const DEFAULT_AUTO_LOCK_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel'];

/** `setTimeout` 可接受的最大毫秒值（约 24.8 天）。 */
const MAX_TIMEOUT_MS = 2147483647; // 2^31 - 1

/**
 * 自动锁屏定时器参数。
 */
export interface AutoLockTimerOptions {
  /** 获取自动锁屏时间（分钟）。 */
  getAutoLockTime: () => number;
  /** 达到超时阈值后触发的锁定回调。 */
  onLock: () => void;
  /** 查询当前是否已锁定（可选）。 */
  isLocked?: () => boolean;
  /** 需要监听的活动事件列表。 */
  events?: string[];
  /** 活动事件节流时间（毫秒），`<= 0` 表示不节流。 */
  throttleMs?: number;
  /** 事件绑定目标（默认自动选择 `window/document`）。 */
  target?: EventTarget;
}

/**
 * 解析事件绑定目标。
 *
 * @param target 显式指定目标。
 * @returns 可用事件目标；无可用目标时返回 `null`。
 */
function resolveEventTarget(target?: EventTarget): EventTarget | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  if (typeof document !== 'undefined') return document;
  return null;
}

/**
 * 创建自动锁屏定时器（通用）。
 * @description
 * 当用户发生活动事件时重置计时器；达到超时时间后触发 `onLock`。
 * 支持动态读取超时时间与锁定状态，适配运行时配置变更。
 * @param options 自动锁屏定时器配置。
 * @returns 销毁函数，用于移除事件监听并清理计时器。
 */
export function createAutoLockTimer(options: AutoLockTimerOptions): () => void {
  const {
    getAutoLockTime,
    onLock,
    isLocked,
    events = DEFAULT_AUTO_LOCK_EVENTS,
    throttleMs = THROTTLE_DELAY,
    target,
  } = options;

  const eventTarget = resolveEventTarget(target);
  if (!eventTarget) return () => {};

  /**
   * 读取初始化自动锁定时长。
   * @returns 自动锁定时长（分钟）；读取失败时返回 `0`。
   */
  const initialAutoLockTime = (() => {
    try {
      return getAutoLockTime();
    } catch {
      return 0;
    }
  })();

  if (!initialAutoLockTime || initialAutoLockTime <= 0) {
    return () => {};
  }

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTime = 0;
  let isDestroyed = false;

  /**
   * 解析锁屏延迟毫秒值。
   * @returns 延迟毫秒值；不可用时返回 `0`。
   */
  const getDelayMs = () => {
    const autoLockTime = getAutoLockTime();
    if (!autoLockTime || autoLockTime <= 0) return 0;
    return Math.min(Math.round(autoLockTime * 60 * 1000), MAX_TIMEOUT_MS);
  };

  /**
   * 判断当前是否允许触发锁屏。
   * @returns 允许锁屏返回 `true`。
   */
  const canLock = () => {
    if (!isLocked) return true;
    try {
      return !isLocked();
    } catch {
      return false;
    }
  };

  /**
   * 重置自动锁屏计时器。
   * @returns 无返回值。
   */
  const resetTimer = () => {
    if (isDestroyed) return;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    const delayMs = getDelayMs();
    const canLockNow = canLock();

    if (!delayMs || !canLockNow) {
      return;
    }

    timer = setTimeout(() => {
      if (isDestroyed) return;
      const finalDelayMs = getDelayMs();
      const finalCanLock = canLock();
      if (!finalDelayMs || !finalCanLock) {
        timer = null;
        return;
      }
      onLock();
      timer = null;
    }, delayMs);
  };

  /**
   * 处理用户活动事件并按节流策略重置计时器。
   * @returns 无返回值。
   */
  const handleActivity = () => {
    if (throttleMs <= 0) {
      resetTimer();
      return;
    }
    const now = Date.now();
    if (now - lastActivityTime >= throttleMs) {
      lastActivityTime = now;
      resetTimer();
    }
  };

  events.forEach((event) => {
    eventTarget.addEventListener(event, handleActivity, { passive: true });
  });

  resetTimer();

  return () => {
    isDestroyed = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    events.forEach((event) => {
      eventTarget.removeEventListener(event, handleActivity, { passive: true } as EventListenerOptions);
    });
  };
}

/**
 * 创建锁屏管理器。
 * @description 基于偏好设置读取 `autoLockTime` 与 `isLocked`，并复用通用自动锁屏定时器。
 * @param options 锁屏管理器配置。
 * @returns 销毁函数，用于释放自动锁屏监听资源。
 */
export function createLockScreenManager(options: LockScreenManagerOptions): () => void {
  const { getPreferences, onLock } = options;

  const destroyFn = createAutoLockTimer({
    getAutoLockTime: () => {
      try {
        const time = getPreferences().lockScreen.autoLockTime;
        return time;
      } catch {
        return 0;
      }
    },
    isLocked: () => {
      try {
        return getPreferences().lockScreen.isLocked;
      } catch {
        return true;
      }
    },
    onLock,
    throttleMs: THROTTLE_DELAY,
    events: DEFAULT_AUTO_LOCK_EVENTS,
  });

  return () => {
    destroyFn();
  };
}
