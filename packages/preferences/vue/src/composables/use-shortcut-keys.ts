/**
 * 快捷键 Composable 模块。
 * @description 提供全局快捷键监听能力，支持打开设置、搜索、锁屏与退出登录等动作分发。
 */
import {
  createShortcutManager,
  type ShortcutKeyCallbacks,
} from '@admin-core/preferences';
import { onMounted, onUnmounted, ref, watchEffect, watch } from 'vue';
import { usePreferences } from './use-preferences';

/**
 * 快捷键 Composable 配置参数。
 */
export interface UseShortcutKeysOptions extends ShortcutKeyCallbacks {
  /** 是否启用快捷键监听（默认 `true`）。 */
  enabled?: boolean;
}

/**
 * 快捷键 Composable 返回结构。
 */
export interface UseShortcutKeysReturn {
  /** 手动销毁快捷键监听。 */
  destroy: () => void;
}

/**
 * 全局快捷键 Composable。
 * @description 监听全局快捷键并执行对应动作回调。
 * @param options 快捷键监听配置与回调。
 * @returns 快捷键监听控制器（当前包含手动销毁方法）。
 *
 * @example
 * ```vue
 * <script setup>
 * import { ref } from 'vue';
 * import { useShortcutKeys } from '@admin-core/preferences-vue';
 *
 * const drawerOpen = ref(false);
 *
 * useShortcutKeys({
 *   onPreferences: () => { drawerOpen.value = true; },
 *   onSearch: () => console.log('Open search'),
 *   onLockScreen: () => console.log('Lock screen'),
 *   onLogout: () => console.log('Logout'),
 * });
 * </script>
 * ```
 */
export function useShortcutKeys(options: UseShortcutKeysOptions = {}): UseShortcutKeysReturn {
  const { enabled = true, onPreferences, onSearch, onLockScreen, onLogout } = options;
  const { preferences } = usePreferences();

  /**
   * 快捷键启用状态引用。
   * @description 将启用状态包装为响应式 ref，便于后续监听并重建管理器。
   */
  const enabledRef = ref(enabled);

  /**
   * 快捷键回调引用。
   * @description 通过 ref 始终持有最新回调，避免闭包捕获旧函数。
   */
  const callbacksRef = ref<ShortcutKeyCallbacks>({
    onPreferences,
    onSearch,
    onLockScreen,
    onLogout,
  });

  /**
   * 同步回调函数到引用。
   * @description 当外部回调变化时，更新内部引用供管理器调用。
   */
  watchEffect(() => {
    callbacksRef.value = {
      onPreferences,
      onSearch,
      onLockScreen,
      onLogout,
    };
  });

  /**
   * 快捷键管理器销毁函数引用。
   * @description 指向当前实例的销毁函数，便于重建与卸载时清理。
   */
  let destroyManager: (() => void) | null = null;

  /**
   * 初始化快捷键管理器实例。
   * @description
   * 会先销毁旧实例再创建新实例，确保启用状态与回调引用始终与当前组件状态一致。
   * @returns 无返回值。
   */
  const initManager = () => {
    /**
     * 创建新实例前先清理旧实例。
     * @description 避免重复注册全局监听造成多次触发。
     */
    disposeManager();

    destroyManager = createShortcutManager({
      enabled: enabledRef.value,
      getPreferences: () => {
        if (!preferences.value) {
          throw new Error('[ShortcutKeys] Preferences not initialized');
        }
        return preferences.value;
      },
      callbacks: {
        /**
         * 使用回调引用代理执行。
         * @description 保证触发时总是调用最新版本的回调函数。
         */
        onPreferences: () => callbacksRef.value.onPreferences?.(),
        onSearch: () => callbacksRef.value.onSearch?.(),
        onLockScreen: () => callbacksRef.value.onLockScreen?.(),
        onLogout: () => callbacksRef.value.onLogout?.(),
      },
    });
  };

  /**
   * 销毁快捷键管理器实例。
   * @description 释放全局快捷键监听并清空销毁函数引用。
   * @returns 无返回值。
   */
  const disposeManager = () => {
    if (destroyManager) {
      destroyManager();
      destroyManager = null;
    }
  };

  /**
   * 监听启用状态变化并重建管理器。
   * @description 保持快捷键监听行为与当前启用状态一致。
   */
  watch(enabledRef, () => {
    initManager();
  });

  /**
   * 组件挂载初始化。
   * @description 挂载后创建快捷键管理器并注册全局键盘监听。
   */
  onMounted(() => {
    initManager();
  });

  /**
   * 组件卸载清理。
   * @description 卸载时销毁快捷键管理器，确保移除全局监听。
   */
  onUnmounted(() => {
    disposeManager();
  });

  return {
    /** 手动销毁快捷键监听。 */
    destroy: disposeManager,
  };
}

/**
 * 默认导出快捷键 Composable。
 */
export default useShortcutKeys;
