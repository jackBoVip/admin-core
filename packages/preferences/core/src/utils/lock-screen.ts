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

/**
 * 创建锁屏管理器
 * @param options - 配置选项
 * @returns 销毁函数
 */
export function createLockScreenManager(options: LockScreenManagerOptions): () => void {
  const { getPreferences, onLock } = options;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastActivityTime = 0;
  let isDestroyed = false; // 标记是否已销毁

  const resetTimer = () => {
    // 如果已销毁，不再操作
    if (isDestroyed) return;
    
    // 清除现有定时器
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }

    let preferences;
    try {
      preferences = getPreferences();
    } catch {
      return; // getPreferences 失败时静默返回
    }
    
    const { autoLockTime, isLocked } = preferences.lockScreen;

    // 如果未锁定且开启了自动锁屏
    if (!isLocked && autoLockTime > 0) {
      // 计算精确的毫秒数（避免浮点数精度问题）
      // 限制最大值防止 setTimeout 整数溢出（最大约 24.8 天）
      const MAX_TIMEOUT_MS = 2147483647; // 2^31 - 1
      const delayMs = Math.min(Math.round(autoLockTime * 60 * 1000), MAX_TIMEOUT_MS);
      
      timer = setTimeout(() => {
        // 执行锁屏前再次检查状态和销毁标记
        if (isDestroyed) return;
        
        try {
          const currentPreferences = getPreferences();
          if (!currentPreferences.lockScreen.isLocked) {
            onLock();
          }
        } catch {
          // 静默处理错误
        }
        timer = null;
      }, delayMs);
    }
  };

  // 带节流的活动处理器
  const handleActivity = () => {
    const now = Date.now();
    // 节流：mousemove 等高频事件只在间隔超过阈值时才重置定时器
    if (now - lastActivityTime >= THROTTLE_DELAY) {
      lastActivityTime = now;
      resetTimer();
    }
  };

  // 监听用户活动（使用 passive 提升性能）
  const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'wheel'];
  events.forEach((event) => {
    window.addEventListener(event, handleActivity, { passive: true });
  });

  // 初始化定时器
  resetTimer();

  // 返回销毁函数
  return () => {
    isDestroyed = true; // 标记为已销毁
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    // 移除事件监听器时传递相同的选项（passive），确保正确移除
    events.forEach((event) => {
      window.removeEventListener(event, handleActivity, { passive: true } as EventListenerOptions);
    });
  };
}
