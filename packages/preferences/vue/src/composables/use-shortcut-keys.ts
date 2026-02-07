/**
 * 快捷键 Composable
 * @description 全局快捷键监听，支持打开设置、搜索、锁屏、退出等功能
 */
import {
  createShortcutManager,
  type ShortcutKeyCallbacks,
} from '@admin-core/preferences';
import { onMounted, onUnmounted, ref, watchEffect, watch } from 'vue';
import { usePreferences } from './use-preferences';

export interface UseShortcutKeysOptions extends ShortcutKeyCallbacks {
  /** 是否启用快捷键监听（默认 true） */
  enabled?: boolean;
}

/**
 * 全局快捷键 Composable
 * @description 监听全局快捷键并执行相应的回调函数
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
export function useShortcutKeys(options: UseShortcutKeysOptions = {}) {
  const { enabled = true, onPreferences, onSearch, onLockScreen, onLogout } = options;
  const { preferences } = usePreferences();

  // 将 enabled 转换为响应式 ref（支持外部传入响应式值）
  const enabledRef = ref(enabled);

  // 使用 ref 存储回调函数引用，确保始终获取最新的回调
  const callbacksRef = ref<ShortcutKeyCallbacks>({
    onPreferences,
    onSearch,
    onLockScreen,
    onLogout,
  });

  // 监听回调变化并更新 ref
  watchEffect(() => {
    callbacksRef.value = {
      onPreferences,
      onSearch,
      onLockScreen,
      onLogout,
    };
  });

  // 销毁函数引用
  let destroyManager: (() => void) | null = null;

  // 初始化快捷键管理器
  const initManager = () => {
    // 先销毁已有的管理器
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
        // 使用 ref 包装确保始终调用最新的回调函数
        onPreferences: () => callbacksRef.value.onPreferences?.(),
        onSearch: () => callbacksRef.value.onSearch?.(),
        onLockScreen: () => callbacksRef.value.onLockScreen?.(),
        onLogout: () => callbacksRef.value.onLogout?.(),
      },
    });
  };

  // 销毁快捷键管理器
  const disposeManager = () => {
    if (destroyManager) {
      destroyManager();
      destroyManager = null;
    }
  };

  // 监听 enabled 状态变化，重建管理器
  watch(enabledRef, () => {
    initManager();
  });

  onMounted(() => {
    initManager();
  });

  onUnmounted(() => {
    disposeManager();
  });

  return {
    /** 手动销毁快捷键监听 */
    destroy: disposeManager,
  };
}

export default useShortcutKeys;
