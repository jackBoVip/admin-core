/**
 * React 偏好设置 Hooks
 * @description 提供响应式的偏好设置状态
 */

import {
  getDefaultPreferencesStore,
  getDefaultPreferences,
  hasChanges as hasChangesUtil,
  type PreferencesManager,
  type Preferences,
  type PreferencesKeys,
  type PreferencesInitOptions,
  type DeepPartial,
} from '@admin-core/preferences';
import { useCallback, useMemo, useSyncExternalStore } from 'react';

/**
 * 全局生命周期管理器（使用 core 的单例）
 */
const store = getDefaultPreferencesStore();
const actionFactory = store.actions;

/**
 * 获取缓存的 actions
 */
function getPreferencesActionsInstance() {
  return actionFactory.getPreferencesActions();
}

function getThemeActionsInstance() {
  return actionFactory.getThemeActions();
}

function getLayoutActionsInstance() {
  return actionFactory.getLayoutActions();
}

/**
 * 创建并初始化全局偏好设置管理器
 * @param options - 初始化选项
 */
export function initPreferences(options?: PreferencesInitOptions): PreferencesManager {
  return store.init(options);
}

/**
 * 获取全局偏好设置管理器
 */
export function getPreferencesManager(): PreferencesManager {
  return store.getManager();
}

/**
 * 判断偏好设置管理器是否已初始化
 */
export function isPreferencesInitialized(): boolean {
  return store.isInitialized();
}

/**
 * 销毁全局偏好设置管理器
 */
export function destroyPreferences(): void {
  store.destroy();
}

function usePreferencesStore(): Preferences {
  const subscribe = useCallback((callback: () => void) => {
    const unsubscribe = store.subscribe(() => {
      // 始终调用 callback，确保 React 能感知状态变化
      callback();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const getSnapshot = useCallback(() => {
    const prefs = store.getPreferences() as Preferences;
    // 减少 getSnapshot 日志输出（只在开发环境且值变化时输出）
    // React useSyncExternalStore 会频繁调用 getSnapshot，这是正常行为
    return prefs;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 使用偏好设置
 * @returns 响应式偏好设置
 */
export function usePreferences() {
  const manager = store.getManager();
  const actions = getPreferencesActionsInstance();
  const preferences = usePreferencesStore();

  // 计算派生状态（使用 useMemo 优化，仅在 theme.mode 变化时重新计算）
  const actualThemeMode = useMemo(
    () => actions.getActualThemeMode(),
    [actions, preferences.theme.mode]
  );
  const isDark = actualThemeMode === 'dark';

  // 是否有变更（与默认值比较）
  const hasChanges = useMemo(
    () => hasChangesUtil(getDefaultPreferences(), preferences),
    [preferences]
  );

  return {
    preferences,
    actualThemeMode,
    isDark,
    hasChanges,
    // 从 core 导入的操作（已缓存）
    setPreferences: actions.setPreferences,
    resetPreferences: actions.resetPreferences,
    toggleTheme: actions.toggleTheme,
    toggleSidebar: actions.toggleSidebar,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig,
    manager,
  };
}

/**
 * 使用特定分类的偏好设置（优化版 - 减少重渲染）
 * @param key - 分类键名
 */
export function usePreferencesCategory<K extends PreferencesKeys>(key: K) {
  const manager = store.getManager();
  const preferences = usePreferencesStore();

  const value = preferences[key] as Preferences[K];

  const setCategory = useCallback(
    (updates: DeepPartial<Preferences[K]>) => {
      manager.set(key, updates);
    },
    [manager, key]
  );

  const reset = useCallback(() => {
    manager.resetCategory(key);
  }, [manager, key]);

  return {
    value,
    setValue: setCategory,
    reset,
  };
}

/**
 * 使用主题设置（优化版 - 共享订阅）
 */
export function useTheme() {
  const themeActions = getThemeActionsInstance();
  const preferences = usePreferencesStore();

  const theme = preferences.theme;
  // 使用 useMemo 优化，仅在 theme.mode 变化时重新计算
  const actualThemeMode = useMemo(
    () => themeActions.getActualThemeMode(),
    [themeActions, theme.mode]
  );
  const isDark = actualThemeMode === 'dark';

  return {
    theme,
    actualThemeMode,
    isDark,
    // 从 core 导入的操作
    setTheme: themeActions.setTheme,
    setMode: themeActions.setMode,
    setPrimaryColor: themeActions.setPrimaryColor,
    setBuiltinTheme: themeActions.setBuiltinTheme,
    setRadius: themeActions.setRadius,
    toggleTheme: themeActions.toggleTheme,
  };
}

/**
 * 使用布局设置（优化版 - 共享订阅）
 */
export function useLayout() {
  const layoutActions = getLayoutActionsInstance();
  const preferences = usePreferencesStore();

  const { app, sidebar, header, tabbar, footer, breadcrumb } = preferences;
  const isSidebarCollapsed = sidebar.collapsed;
  const currentLayout = app.layout;

  return {
    // React 响应式数据
    app,
    sidebar,
    header,
    tabbar,
    footer,
    breadcrumb,
    isSidebarCollapsed,
    currentLayout,
    // 从 core 导入的操作
    setApp: layoutActions.setApp,
    setLayout: layoutActions.setLayout,
    setSidebar: layoutActions.setSidebar,
    setHeader: layoutActions.setHeader,
    setTabbar: layoutActions.setTabbar,
    setFooter: layoutActions.setFooter,
    setBreadcrumb: layoutActions.setBreadcrumb,
    toggleSidebarCollapsed: layoutActions.toggleSidebarCollapsed,
    toggleSidebar: layoutActions.toggleSidebarCollapsed, // 别名
    setSidebarCollapsed: layoutActions.setSidebarCollapsed,
  };
}
