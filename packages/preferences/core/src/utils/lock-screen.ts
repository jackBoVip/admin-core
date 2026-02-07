/**
 * 锁屏管理工具
 * @description 处理自动锁屏逻辑
 */

import type { Preferences } from '../types';

/**
 * 锁屏管理器配置
 */
export interface LockScreenManagerOptions {
  /** 偏好设置 */
  getPreferences: () => Preferences;
  /** 锁定回调 */
  onLock: () => void;
}

/** 节流延迟时间（毫秒） */
const THROTTLE_DELAY = 1000;

/** 自动锁屏事件列表 */
const DEFAULT_AUTO_LOCK_EVENTS = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel'];

/** setTimeout 最大值（约 24.8 天） */
const MAX_TIMEOUT_MS = 2147483647; // 2^31 - 1

export interface AutoLockTimerOptions {
  /** 获取自动锁屏时间（分钟） */
  getAutoLockTime: () => number;
  /** 锁定回调 */
  onLock: () => void;
  /** 是否已锁定（可选） */
  isLocked?: () => boolean;
  /** 监听的事件列表 */
  events?: string[];
  /** 节流时间（毫秒），<=0 表示不节流 */
  throttleMs?: number;
  /** 事件目标（默认 window/document） */
  target?: EventTarget;
}

function resolveEventTarget(target?: EventTarget): EventTarget | null {
  if (target) return target;
  if (typeof window !== 'undefined') return window;
  if (typeof document !== 'undefined') return document;
  return null;
}

/**
 * 创建自动锁屏定时器（通用）
 * @returns 销毁函数
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

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTime = 0;
  let isDestroyed = false;

  const getDelayMs = () => {
    const autoLockTime = getAutoLockTime();
    if (!autoLockTime || autoLockTime <= 0) return 0;
    return Math.min(Math.round(autoLockTime * 60 * 1000), MAX_TIMEOUT_MS);
  };

  const canLock = () => {
    if (!isLocked) return true;
    try {
      return !isLocked();
    } catch {
      return false;
    }
  };

  const resetTimer = () => {
    if (isDestroyed) return;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    const delayMs = getDelayMs();
    if (!delayMs || !canLock()) return;

    timer = setTimeout(() => {
      if (isDestroyed) return;
      if (!getDelayMs() || !canLock()) {
        timer = null;
        return;
      }
      onLock();
      timer = null;
    }, delayMs);
  };

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
 * 创建锁屏管理器
 * @param options - 配置选项
 * @returns 销毁函数
 */
export function createLockScreenManager(options: LockScreenManagerOptions): () => void {
  const { getPreferences, onLock } = options;

  return createAutoLockTimer({
    getAutoLockTime: () => {
      try {
        return getPreferences().lockScreen.autoLockTime;
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
}
