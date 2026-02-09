import { createLockScreenManager, logger, canLockScreen, hasLockScreenPassword, isLockScreenEnabled } from '@admin-core/preferences';
import { useEffect, useRef, useCallback } from 'react';
import { usePreferences } from './use-preferences';

/**
 * 锁屏 Hook
 * @description 处理锁屏逻辑，包括手动锁屏和自动锁屏
 */
export function useLockScreen() {
  const { preferences, setPreferences, manager } = usePreferences();
  const preferencesRef = useRef(preferences);
  
  // 使用 ref 存储 setPreferences，避免依赖变化
  const setPreferencesRef = useRef(setPreferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  
  useEffect(() => {
    setPreferencesRef.current = setPreferences;
  }, [setPreferences]);

  // 启动时校验持久化状态，避免内存状态被异常覆盖
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

  // 自动锁屏回调 - 使用 ref 确保稳定性
  const handleAutoLock = useCallback(() => {
    const current = preferencesRef.current;
    // 🔧 关键修复：只有在开启了锁屏功能、已设置密码、且 autoLockTime > 0 的情况下才自动锁定
    // 这样可以防止 autoLockTime 为 0 时仍然触发锁屏
    if (canLockScreen(current) && current.lockScreen.autoLockTime > 0) {
      setPreferencesRef.current({ lockScreen: { isLocked: true } });
    }
  }, []); // 空依赖，确保稳定

  useEffect(() => {
    const current = preferencesRef.current;
    const autoLockTime = current.lockScreen.autoLockTime;
    // 🔧 关键修复：只有在 autoLockTime > 0 时才创建锁屏管理器
    // 这样可以避免在 autoLockTime 为 0 时仍然添加事件监听器
    if (!autoLockTime || autoLockTime <= 0) {
      return;
    }

    // 确保 preferences 已初始化后再创建锁屏管理器
    // 延迟创建，避免在 preferences 初始化完成前读取到错误的状态
    let destroy: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    
    timer = setTimeout(() => {
      // 再次检查 autoLockTime，因为可能在延迟期间发生了变化
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
   * 手动锁屏
   * @returns 是否成功锁屏
   */
  const lock = useCallback(() => {
    const current = preferencesRef.current;

    // 检查锁屏功能是否启用
    if (!isLockScreenEnabled(current)) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return false;
    }

    // 如果没有设置密码，不能锁屏（需要先在设置中设置密码）
    if (!hasLockScreenPassword(current)) {
      logger.warn('[LockScreen] Password not set, please set password first');
      return false;
    }

    setPreferences({ lockScreen: { isLocked: true } });
    return true;
  }, [setPreferences]);

  /**
   * 解锁（内部调用，验证密码在 LockScreen 组件中进行）
   */
  const unlock = useCallback(() => {
    setPreferences({ lockScreen: { isLocked: false } });
  }, [setPreferences]);

  return {
    /** 是否已锁定 */
    isLocked: preferences.lockScreen.isLocked,
    /** 是否启用锁屏功能 */
    isEnabled: isLockScreenEnabled(preferences),
    /** 是否已设置密码 */
    hasPassword: hasLockScreenPassword(preferences),
    /** 是否可以锁屏（启用且有密码） */
    canLock: canLockScreen(preferences),
    /** 锁屏（需要启用且有密码） */
    lock,
    /** 解锁 */
    unlock,
  };
}
