import { createLockScreenManager, logger, canLockScreen, hasLockScreenPassword, isLockScreenEnabled } from '@admin-core/preferences';
import { computed, onMounted, onUnmounted, watch } from 'vue';
import { usePreferences } from './use-preferences';

/**
 * 锁屏 Composable
 * @description 处理锁屏逻辑，包括手动锁屏和自动锁屏
 */
export function useLockScreen() {
  const { preferences, setPreferences } = usePreferences();

  let destroyManager: (() => void) | null = null;

  const createManager = () => {
    // 确保 preferences 已初始化
    if (!preferences.value) {
      logger.warn('[LockScreen] Preferences not initialized');
      return;
    }

    const autoLockTime = preferences.value.lockScreen.autoLockTime;
    
    // 🔧 关键修复：只有在 autoLockTime > 0 时才创建锁屏管理器
    // 这样可以避免在 autoLockTime 为 0 时仍然添加事件监听器
    if (!autoLockTime || autoLockTime <= 0) {
      return;
    }

    // 如果已经存在管理器，先销毁
    if (destroyManager) {
      destroyManager();
      destroyManager = null;
    }

    destroyManager = createLockScreenManager({
      // 使用非空断言是安全的，因为上面已经检查了 preferences.value 存在
      // 且 createLockScreenManager 内部会在需要时调用 getPreferences
      getPreferences: () => {
        if (!preferences.value) {
          throw new Error('[LockScreen] Preferences became null unexpectedly');
        }
        return preferences.value;
      },
      // 自动锁屏回调 - 使用闭包确保始终读取最新的 preferences.value
      onLock: () => {
        // 🔧 关键修复：只有在开启了锁屏功能、已设置密码、且 autoLockTime > 0 的情况下才自动锁定
        // 这样可以防止 autoLockTime 为 0 时仍然触发锁屏
        if (preferences.value && canLockScreen(preferences.value) && preferences.value.lockScreen.autoLockTime > 0) {
          setPreferences({ lockScreen: { isLocked: true } });
        } else {
        }
      },
    });
  };

  onMounted(() => {
    createManager();
  });

  // 监听 autoLockTime 变化，动态创建/销毁管理器
  watch(
    () => preferences.value?.lockScreen.autoLockTime,
    (newTime, oldTime) => {
      if (newTime === oldTime) return;
      
      // 如果 autoLockTime 变为 0 或小于等于 0，销毁管理器
      if (!newTime || newTime <= 0) {
        if (destroyManager) {
          destroyManager();
          destroyManager = null;
        }
      } else {
        // 如果 autoLockTime 变为大于 0，创建管理器
        createManager();
      }
    }
  );

  onUnmounted(() => {
    if (destroyManager) {
      destroyManager();
    }
  });

  /**
   * 手动锁屏
   * @returns 是否成功锁屏
   */
  const lock = () => {
    // 检查锁屏功能是否启用
    if (!preferences.value || !isLockScreenEnabled(preferences.value)) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return false;
    }

    // 如果没有设置密码，不能锁屏
    if (!preferences.value || !hasLockScreenPassword(preferences.value)) {
      logger.warn('[LockScreen] Password not set, please set password first');
      return false;
    }

    setPreferences({ lockScreen: { isLocked: true } });
    return true;
  };

  /**
   * 解锁
   */
  const unlock = () => {
    setPreferences({ lockScreen: { isLocked: false } });
  };

  return {
    /** 是否已锁定 */
    isLocked: computed(() => preferences.value?.lockScreen.isLocked ?? false),
    /** 是否启用锁屏功能 */
    isEnabled: computed(() => preferences.value ? isLockScreenEnabled(preferences.value) : false),
    /** 是否已设置密码 */
    hasPassword: computed(() => preferences.value ? hasLockScreenPassword(preferences.value) : false),
    /** 是否可以锁屏（启用且有密码） */
    canLock: computed(() => preferences.value ? canLockScreen(preferences.value) : false),
    /** 锁屏 */
    lock,
    /** 解锁 */
    unlock,
  };
}
