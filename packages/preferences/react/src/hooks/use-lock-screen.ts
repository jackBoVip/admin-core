import { useEffect, useRef, useCallback } from 'react';
import { usePreferences } from './use-preferences';
import { createLockScreenManager, logger } from '@admin-core/preferences';

/**
 * 锁屏 Hook
 * @description 处理锁屏逻辑，包括手动锁屏和自动锁屏
 */
export function useLockScreen() {
  const { preferences, setPreferences } = usePreferences();
  const preferencesRef = useRef(preferences);
  
  // 使用 ref 存储 setPreferences，避免依赖变化
  const setPreferencesRef = useRef(setPreferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);
  
  useEffect(() => {
    setPreferencesRef.current = setPreferences;
  }, [setPreferences]);

  // 自动锁屏回调 - 使用 ref 确保稳定性
  const handleAutoLock = useCallback(() => {
    const current = preferencesRef.current;
    // 只有在开启了锁屏功能且已设置密码的情况下才自动锁定
    if (current.widget.lockScreen && current.lockScreen.password) {
      setPreferencesRef.current({ lockScreen: { isLocked: true } });
    }
  }, []); // 空依赖，确保稳定

  useEffect(() => {
    const destroy = createLockScreenManager({
      getPreferences: () => preferencesRef.current,
      onLock: handleAutoLock,
    });

    return destroy;
  }, [handleAutoLock]);

  /**
   * 手动锁屏
   * @returns 是否成功锁屏
   */
  const lock = useCallback(() => {
    const current = preferencesRef.current;

    // 检查锁屏功能是否启用
    if (!current.widget.lockScreen) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return false;
    }

    // 如果没有设置密码，不能锁屏（需要先在设置中设置密码）
    if (!current.lockScreen.password) {
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
    isEnabled: preferences.widget.lockScreen,
    /** 是否已设置密码 */
    hasPassword: !!preferences.lockScreen.password,
    /** 是否可以锁屏（启用且有密码） */
    canLock: preferences.widget.lockScreen && !!preferences.lockScreen.password,
    /** 锁屏（需要启用且有密码） */
    lock,
    /** 解锁 */
    unlock,
  };
}
