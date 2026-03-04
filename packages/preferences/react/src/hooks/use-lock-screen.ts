/**
 * 锁屏状态 Hook。
 * @description 封装手动锁屏、自动锁屏与解锁流程，并与偏好设置持久化状态保持一致。
 */
import { createLockScreenManager, logger, canLockScreen, hasLockScreenPassword, isLockScreenEnabled } from '@admin-core/preferences';
import { useEffect, useRef, useCallback } from 'react';
import { usePreferences } from './use-preferences';

/**
 * React 锁屏 Hook 返回结构。
 */
export interface UseLockScreenResult {
  /** 当前是否已锁定。 */
  isLocked: boolean;
  /** 锁屏功能是否启用。 */
  isEnabled: boolean;
  /** 是否已设置锁屏密码。 */
  hasPassword: boolean;
  /** 当前是否允许执行锁屏。 */
  canLock: boolean;
  /** 手动触发锁屏。 */
  lock: () => boolean;
  /** 手动触发解锁。 */
  unlock: () => void;
}

/**
 * 锁屏 Hook。
 * @description 处理锁屏逻辑，包括手动锁屏和自动锁屏。
 * @returns 锁屏状态与操作方法集合。
 */
export function useLockScreen(): UseLockScreenResult {
  /**
   * 偏好设置快照与更新能力。
   */
  const { preferences, setPreferences, manager } = usePreferences();
  /**
   * 偏好设置引用缓存。
   * @description 保证定时器与事件回调读取到最新偏好状态。
   */
  const preferencesRef = useRef(preferences);
  
  /**
   * 使用 ref 缓存 `setPreferences`，避免闭包引用过期。
   */
  const setPreferencesRef = useRef(setPreferences);

  /**
   * 同步偏好快照引用。
   * @description 确保自动锁屏回调中读取到当前最新偏好。
   */
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  
  /**
   * 同步写入函数引用。
   * @description 防止异步回调闭包持有过期 `setPreferences` 引用。
   */
  useEffect(() => {
    setPreferencesRef.current = setPreferences;
  }, [setPreferences]);

  /**
   * 启动时校验持久化锁屏状态，避免内存态被异常覆盖。
   */
  useEffect(() => {
    try {
      const stored = manager.getStoredPreferences?.();
      const storedIsLocked = stored?.lockScreen?.isLocked;
      if (
        storedIsLocked !== undefined &&
        storedIsLocked !== preferencesRef.current.lockScreen.isLocked
      ) {
        setPreferencesRef.current({ lockScreen: { isLocked: storedIsLocked } });
      }
    } catch {}
  }, [manager]);

  /**
   * 自动锁屏触发回调。
   * @description 仅在锁屏功能可用且自动锁屏时间大于 0 时写入锁定状态。
   * @returns 无返回值。
   */
  const handleAutoLock = useCallback(() => {
    const current = preferencesRef.current;
    /** 仅在可锁屏且自动锁屏时间大于 0 时执行自动锁定。 */
    if (canLockScreen(current) && current.lockScreen.autoLockTime > 0) {
      setPreferencesRef.current({ lockScreen: { isLocked: true } });
    }
  }, []); // 空依赖，确保稳定

  /**
   * 根据自动锁屏时长创建或销毁管理器。
   * @description 当 `autoLockTime > 0` 时延迟创建管理器，依赖变化或卸载时执行完整清理。
   */
  useEffect(() => {
    const current = preferencesRef.current;
    /**
     * 自动锁屏时长（分钟）。
     */
    const autoLockTime = current.lockScreen.autoLockTime;
    /** `autoLockTime <= 0` 时不创建锁屏管理器。 */
    if (!autoLockTime || autoLockTime <= 0) {
      return;
    }

    /** 延迟创建，避免初始化竞态导致读取旧配置。 */
    let destroy: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    timer = setTimeout(() => {
      /** 延迟期间可能发生配置变化，创建前再次校验。 */
      const latestAutoLockTime = preferencesRef.current.lockScreen.autoLockTime;
      if (!latestAutoLockTime || latestAutoLockTime <= 0) {
        return;
      }
      destroy = createLockScreenManager({
        getPreferences: () => preferencesRef.current,
        onLock: handleAutoLock,
      });
    }, 0);

    return () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      if (destroy) {
        destroy();
        destroy = null;
      }
    };
  }, [handleAutoLock, preferences.lockScreen.autoLockTime]);

  /**
   * 手动锁屏。
   * @description 仅在锁屏功能启用且已设置密码时生效。
   * @returns 是否成功进入锁屏状态。
   */
  const lock = useCallback(() => {
    const current = preferencesRef.current;

    /** 检查锁屏功能是否启用。 */
    if (!isLockScreenEnabled(current)) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return false;
    }

    /** 未设置密码时禁止锁屏。 */
    if (!hasLockScreenPassword(current)) {
      logger.warn('[LockScreen] Password not set, please set password first');
      return false;
    }

    setPreferences({ lockScreen: { isLocked: true } });
    return true;
  }, [setPreferences]);

  /**
   * 解锁（内部调用，验证密码在 LockScreen 组件中进行）。
   * @description 直接将锁屏状态更新为未锁定。
   * @returns 无返回值。
   */
  const unlock = useCallback(() => {
    setPreferences({ lockScreen: { isLocked: false } });
  }, [setPreferences]);

  return {
    /** 是否已锁定。 */
    isLocked: preferences.lockScreen.isLocked,
    /** 是否启用锁屏功能。 */
    isEnabled: isLockScreenEnabled(preferences),
    /** 是否已设置密码。 */
    hasPassword: hasLockScreenPassword(preferences),
    /** 是否可以锁屏（启用且有密码）。 */
    canLock: canLockScreen(preferences),
    /** 锁屏（需要启用且有密码）。 */
    lock,
    /** 解锁。 */
    unlock,
  };
}
