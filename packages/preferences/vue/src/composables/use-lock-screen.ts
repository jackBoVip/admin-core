/**
 * Vue 锁屏 Composable。
 * @description 封装手动锁屏、自动锁屏计时与解锁流程，并与偏好设置状态保持同步。
 */
import { createLockScreenManager, logger, canLockScreen, hasLockScreenPassword, isLockScreenEnabled } from '@admin-core/preferences';
import { computed, onMounted, onUnmounted, watch, type ComputedRef } from 'vue';
import { usePreferences } from './use-preferences';

/**
 * Vue 锁屏 Composable 返回结构。
 */
export interface UseLockScreenResult {
  /** 当前是否已锁定。 */
  isLocked: Readonly<ComputedRef<boolean>>;
  /** 锁屏功能是否启用。 */
  isEnabled: Readonly<ComputedRef<boolean>>;
  /** 是否已设置锁屏密码。 */
  hasPassword: Readonly<ComputedRef<boolean>>;
  /** 当前是否允许执行锁屏。 */
  canLock: Readonly<ComputedRef<boolean>>;
  /** 手动触发锁屏。 */
  lock: () => boolean;
  /** 手动触发解锁。 */
  unlock: () => void;
}

/**
 * 使用锁屏状态与行为。
 * @description 处理手动锁屏、自动锁屏监听重建与解锁状态更新。
 * @returns 锁屏状态与操作方法集合。
 */
export function useLockScreen(): UseLockScreenResult {
  const { preferences, setPreferences } = usePreferences();

  /**
   * 自动锁屏管理器销毁函数。
   * @description 指向当前管理器实例的销毁方法，用于重建与卸载时清理监听。
   */
  let destroyManager: (() => void) | null = null;

  /**
   * 创建或重建自动锁屏管理器。
   * @description
   * 仅当偏好已初始化且 `autoLockTime > 0` 时创建管理器；
   * 若存在旧实例会先销毁，确保全局事件监听不会重复注册。
   * @returns 无返回值。
   */
  const createManager = () => {
    /** 确保偏好状态已初始化。 */
    if (!preferences.value) {
      logger.warn('[LockScreen] Preferences not initialized');
      return;
    }

    const autoLockTime = preferences.value.lockScreen.autoLockTime;
    
    /** `autoLockTime <= 0` 时不创建锁屏管理器。 */
    if (!autoLockTime || autoLockTime <= 0) {
      return;
    }

    /** 已存在管理器时先销毁旧实例。 */
    if (destroyManager) {
      destroyManager();
      destroyManager = null;
    }

    destroyManager = createLockScreenManager({
      /*
       * 此处在创建前已校验 `preferences.value`，并在读取时再做保护校验，
       * 保证传入管理器的配置来源始终有效。
       */
      getPreferences: () => {
        if (!preferences.value) {
          throw new Error('[LockScreen] Preferences became null unexpectedly');
        }
        return preferences.value;
      },
      /** 自动锁屏回调，始终读取最新偏好状态。 */
      onLock: () => {
        /** 仅在可锁屏且自动锁屏时间大于 0 时执行自动锁定。 */
        if (preferences.value && canLockScreen(preferences.value) && preferences.value.lockScreen.autoLockTime > 0) {
          setPreferences({ lockScreen: { isLocked: true } });
        }
      },
    });
  };

  /**
   * 组件挂载初始化。
   * @description 挂载后按当前配置创建自动锁屏管理器。
   */
  onMounted(() => {
    createManager();
  });

  /**
   * 监听 `autoLockTime` 变化并动态创建/销毁管理器。
   * @param newTime 新的自动锁屏时长（分钟）。
   * @param oldTime 上一次自动锁屏时长（分钟）。
   */
  watch(
    () => preferences.value?.lockScreen.autoLockTime,
    (newTime, oldTime) => {
      if (newTime === oldTime) return;
      
      /** `autoLockTime` 变为无效值时销毁管理器。 */
      if (!newTime || newTime <= 0) {
        if (destroyManager) {
          destroyManager();
          destroyManager = null;
        }
      } else {
        /** `autoLockTime` 重新有效后重建管理器。 */
        createManager();
      }
    }
  );

  /**
   * 组件卸载清理。
   * @description 卸载时销毁自动锁屏管理器，释放全局监听与资源引用。
   */
  onUnmounted(() => {
    if (destroyManager) {
      destroyManager();
    }
  });

  /**
   * 手动锁屏。
   * @description 仅在锁屏功能启用且已设置密码时生效，成功后写入锁定状态。
   * @returns 是否成功进入锁屏状态。
   */
  const lock = () => {
    /** 检查锁屏功能是否启用。 */
    if (!preferences.value || !isLockScreenEnabled(preferences.value)) {
      logger.warn('[LockScreen] Lock screen widget is disabled');
      return false;
    }

    /** 未设置密码时禁止锁屏。 */
    if (!preferences.value || !hasLockScreenPassword(preferences.value)) {
      logger.warn('[LockScreen] Password not set, please set password first');
      return false;
    }

    setPreferences({ lockScreen: { isLocked: true } });
    return true;
  };

  /**
   * 解锁。
   * @description 直接将锁屏状态更新为未锁定。
   * @returns 无返回值。
   */
  const unlock = () => {
    setPreferences({ lockScreen: { isLocked: false } });
  };

  return {
    /** 是否已锁定。 */
    isLocked: computed(() => preferences.value?.lockScreen.isLocked ?? false),
    /** 是否启用锁屏功能。 */
    isEnabled: computed(() => preferences.value ? isLockScreenEnabled(preferences.value) : false),
    /** 是否已设置密码。 */
    hasPassword: computed(() => preferences.value ? hasLockScreenPassword(preferences.value) : false),
    /** 是否可以锁屏（启用且有密码）。 */
    canLock: computed(() => preferences.value ? canLockScreen(preferences.value) : false),
    /** 锁屏。 */
    lock,
    /** 解锁。 */
    unlock,
  };
}
