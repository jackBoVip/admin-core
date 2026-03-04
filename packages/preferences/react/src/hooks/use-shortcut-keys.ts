/**
 * React 快捷键 Hook。
 * @description 提供全局快捷键监听能力，支持打开偏好、搜索、锁屏与退出登录等动作分发。
 */
import {
  createShortcutManager,
  type ShortcutKeyCallbacks,
} from '@admin-core/preferences';
import { useEffect, useRef } from 'react';
import { usePreferences } from './use-preferences';

/**
 * 快捷键 Hook 配置参数。
 */
export interface UseShortcutKeysOptions extends ShortcutKeyCallbacks {
  /** 是否启用快捷键监听（默认 `true`）。 */
  enabled?: boolean;
}

/**
 * 使用全局快捷键监听。
 * @description 内部通过快捷键管理器统一处理键盘事件，并将命中动作分发到最新回调。
 * @param options 快捷键监听配置与回调。
 * @returns 无返回值。
 *
 * @example
 * ```tsx
 * function App() {
 *   const [drawerOpen, setDrawerOpen] = useState(false);
 *
 *   useShortcutKeys({
 *     onPreferences: () => setDrawerOpen(true),
 *     onSearch: () => console.log('Open search'),
 *     onLockScreen: () => console.log('Lock screen'),
 *     onLogout: () => console.log('Logout'),
 *   });
 *
 *   return <PreferencesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />;
 * }
 * ```
 */
export function useShortcutKeys(options: UseShortcutKeysOptions = {}) {
  const { enabled = true, onPreferences, onSearch, onLockScreen, onLogout } = options;
  const { preferences } = usePreferences();

  /**
   * 使用 ref 保存最新回调，避免因回调变化导致重复注册监听。
   */
  const callbacksRef = useRef<ShortcutKeyCallbacks>({
    onPreferences,
    onSearch,
    onLockScreen,
    onLogout,
  });

  /**
   * 同步回调引用到最新值。
   * @description 仅更新 ref 内容，不重建监听器实例。
   */
  useEffect(() => {
    callbacksRef.current = {
      onPreferences,
      onSearch,
      onLockScreen,
      onLogout,
    };
  }, [onPreferences, onSearch, onLockScreen, onLogout]);

  /**
   * 使用 ref 缓存最新偏好设置，供快捷键管理器按需读取。
   */
  const preferencesRef = useRef(preferences);

  /**
   * 同步偏好快照引用。
   * @description 保证快捷键触发时读取的是最新偏好配置。
   */
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  /**
   * 创建并维护快捷键管理器。
   * @description 依赖 `enabled` 变化重建管理器，并在副作用清理阶段销毁全局监听。
   */
  useEffect(() => {
    /** 创建快捷键管理器并在卸载时释放。 */
    const destroy = createShortcutManager({
      getPreferences: () => preferencesRef.current,
      enabled,
      callbacks: {
        onPreferences: () => callbacksRef.current.onPreferences?.(),
        onSearch: () => callbacksRef.current.onSearch?.(),
        onLockScreen: () => callbacksRef.current.onLockScreen?.(),
        onLogout: () => callbacksRef.current.onLogout?.(),
      },
    });

    return destroy;
  }, [enabled]);
}

/**
 * 默认导出快捷键 Hook。
 */
export default useShortcutKeys;
