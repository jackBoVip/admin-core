/**
 * React 偏好设置 Hooks
 * @description 提供响应式的偏好设置状态
 */

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  getDefaultLifecycle,
  createPreferencesActions,
  createThemeActions,
  createLayoutActions,
  getDefaultPreferences,
  hasChanges as hasChangesUtil,
  type PreferencesManager,
  type Preferences,
  type PreferencesKeys,
  type PreferencesInitOptions,
  type DeepPartial,
} from '@admin-core/preferences';

/**
 * 全局生命周期管理器（使用 core 的单例）
 */
const lifecycle = getDefaultLifecycle();

/**
 * 缓存的 actions 对象（避免重复创建，与 Vue 版本一致）
 */
let cachedPreferencesActions: ReturnType<typeof createPreferencesActions> | null = null;
let cachedThemeActions: ReturnType<typeof createThemeActions> | null = null;
let cachedLayoutActions: ReturnType<typeof createLayoutActions> | null = null;

/**
 * 获取缓存的 actions
 */
function getPreferencesActionsInstance() {
  if (!cachedPreferencesActions) {
    cachedPreferencesActions = createPreferencesActions(lifecycle.get());
  }
  return cachedPreferencesActions;
}

function getThemeActionsInstance() {
  if (!cachedThemeActions) {
    cachedThemeActions = createThemeActions(lifecycle.get());
  }
  return cachedThemeActions;
}

function getLayoutActionsInstance() {
  if (!cachedLayoutActions) {
    cachedLayoutActions = createLayoutActions(lifecycle.get());
  }
  return cachedLayoutActions;
}

/**
 * 创建并初始化全局偏好设置管理器
 * @param options - 初始化选项
 */
export function initPreferences(options?: PreferencesInitOptions): PreferencesManager {
  return lifecycle.init(options);
}

/**
 * 获取全局偏好设置管理器
 */
export function getPreferencesManager(): PreferencesManager {
  return lifecycle.get();
}

/**
 * 销毁全局偏好设置管理器
 */
export function destroyPreferences(): void {
  lifecycle.destroy();
  // 清除缓存的 actions（与 Vue 版本一致）
  cachedPreferencesActions = null;
  cachedThemeActions = null;
  cachedLayoutActions = null;
}

/**
 * 使用 useSyncExternalStore 订阅偏好设置（避免重复订阅）
 */
function usePreferencesStore(): Preferences {
  const subscribe = useCallback((callback: () => void) => {
    return lifecycle.subscribe(callback);
  }, []);

  const getSnapshot = useCallback(() => {
    return lifecycle.getPreferences() as Preferences;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 使用偏好设置
 * @returns 响应式偏好设置
 */
export function usePreferences() {
  const manager = lifecycle.get();
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
  const manager = lifecycle.get();
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
