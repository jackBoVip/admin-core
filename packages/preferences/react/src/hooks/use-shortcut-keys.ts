/**
 * 快捷键 Hook
 * @description 全局快捷键监听，支持打开设置、搜索、锁屏、退出等功能
 */
import {
  createShortcutManager,
  type ShortcutKeyCallbacks,
} from '@admin-core/preferences';
import { useEffect, useRef } from 'react';
import { usePreferences } from './use-preferences';

export interface UseShortcutKeysOptions extends ShortcutKeyCallbacks {
  /** 是否启用快捷键监听（默认 true） */
  enabled?: boolean;
}

/**
 * 全局快捷键 Hook
 * @description 监听全局快捷键并执行相应的回调函数
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

  // 使用 ref 存储最新的回调函数，避免频繁重新注册事件监听
  const callbacksRef = useRef<ShortcutKeyCallbacks>({
    onPreferences,
    onSearch,
    onLockScreen,
    onLogout,
  });

  // 更新回调引用
  useEffect(() => {
    callbacksRef.current = {
      onPreferences,
      onSearch,
      onLockScreen,
      onLogout,
    };
  }, [onPreferences, onSearch, onLockScreen, onLogout]);

  // 使用 ref 存储最新的偏好设置
  const preferencesRef = useRef(preferences);
  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  useEffect(() => {
    // 创建快捷键管理器
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

export default useShortcutKeys;
