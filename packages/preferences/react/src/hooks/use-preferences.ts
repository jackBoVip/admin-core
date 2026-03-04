/**
 * React 偏好设置 Hooks。
 * @description 提供偏好状态订阅、分类更新与主题/布局快捷操作能力。
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
 * 全局生命周期管理器（使用 core 的单例）。
 */
const store = getDefaultPreferencesStore();
/**
 * 动作工厂实例。
 * @description 统一提供 preferences/theme/layout 三类 actions 的缓存访问能力。
 */
const actionFactory = store.actions;

/**
 * 获取缓存的 actions
 * @description 返回偏好设置主 actions 实例，用于执行通用设置更新与重置。
 * @returns 偏好设置 actions 对象。
 */
function getPreferencesActionsInstance() {
  return actionFactory.getPreferencesActions();
}

/**
 * 获取缓存的主题动作实例。
 * @returns 主题相关 actions。
 */
function getThemeActionsInstance() {
  return actionFactory.getThemeActions();
}

/**
 * 获取缓存的布局动作实例。
 * @returns 布局相关 actions。
 */
function getLayoutActionsInstance() {
  return actionFactory.getLayoutActions();
}

/**
 * 偏好设置 actions 类型别名。
 * @description 用于复用 actions 方法签名，避免手写重复函数类型。
 */
type PreferencesActions = ReturnType<typeof getPreferencesActionsInstance>;

/**
 * 主题 actions 类型别名。
 * @description 用于复用主题相关方法签名。
 */
type ThemeActions = ReturnType<typeof getThemeActionsInstance>;

/**
 * 布局 actions 类型别名。
 * @description 用于复用布局相关方法签名。
 */
type LayoutActions = ReturnType<typeof getLayoutActionsInstance>;

/**
 * `usePreferences` Hook 返回值。
 */
export interface UsePreferencesReturn {
  /** 当前偏好设置快照。 */
  preferences: Preferences;
  /** 当前实际主题模式（`auto` 已解析）。 */
  actualThemeMode: ReturnType<PreferencesActions['getActualThemeMode']>;
  /** 是否处于深色主题。 */
  isDark: boolean;
  /** 是否相对默认配置发生过变更。 */
  hasChanges: boolean;
  /** 合并写入偏好设置。 */
  setPreferences: PreferencesActions['setPreferences'];
  /** 重置全部偏好设置。 */
  resetPreferences: PreferencesActions['resetPreferences'];
  /** 切换浅色/深色主题。 */
  toggleTheme: PreferencesActions['toggleTheme'];
  /** 切换侧边栏折叠状态。 */
  toggleSidebar: PreferencesActions['toggleSidebar'];
  /** 导出当前偏好配置。 */
  exportConfig: PreferencesActions['exportConfig'];
  /** 导入外部偏好配置。 */
  importConfig: PreferencesActions['importConfig'];
  /** 偏好设置管理器实例。 */
  manager: PreferencesManager;
}

/**
 * `usePreferencesCategory` Hook 返回值。
 * @template K 偏好设置分类键。
 */
export interface UsePreferencesCategoryReturn<K extends PreferencesKeys> {
  /** 指定分类的当前值。 */
  value: Preferences[K];
  /** 深度合并更新指定分类。 */
  setValue: (updates: DeepPartial<Preferences[K]>) => void;
  /** 将指定分类恢复为默认值。 */
  reset: () => void;
}

/**
 * `useTheme` Hook 返回值。
 */
export interface UseThemeReturn {
  /** 主题分类快照。 */
  theme: Preferences['theme'];
  /** 当前实际主题模式（`auto` 已解析）。 */
  actualThemeMode: ReturnType<ThemeActions['getActualThemeMode']>;
  /** 是否处于深色主题。 */
  isDark: boolean;
  /** 合并更新主题分类。 */
  setTheme: ThemeActions['setTheme'];
  /** 设置主题模式。 */
  setMode: ThemeActions['setMode'];
  /** 设置主题主色。 */
  setPrimaryColor: ThemeActions['setPrimaryColor'];
  /** 切换内置主题。 */
  setBuiltinTheme: ThemeActions['setBuiltinTheme'];
  /** 设置全局圆角。 */
  setRadius: ThemeActions['setRadius'];
  /** 切换浅色/深色主题。 */
  toggleTheme: ThemeActions['toggleTheme'];
}

/**
 * `useLayout` Hook 返回值。
 */
export interface UseLayoutReturn {
  /** 应用布局基础配置。 */
  app: Preferences['app'];
  /** 侧边栏配置。 */
  sidebar: Preferences['sidebar'];
  /** 顶栏配置。 */
  header: Preferences['header'];
  /** 标签栏配置。 */
  tabbar: Preferences['tabbar'];
  /** 页脚配置。 */
  footer: Preferences['footer'];
  /** 面包屑配置。 */
  breadcrumb: Preferences['breadcrumb'];
  /** 侧边栏当前折叠状态。 */
  isSidebarCollapsed: boolean;
  /** 当前布局模式。 */
  currentLayout: Preferences['app']['layout'];
  /** 合并更新应用配置。 */
  setApp: LayoutActions['setApp'];
  /** 设置布局模式。 */
  setLayout: LayoutActions['setLayout'];
  /** 合并更新侧边栏配置。 */
  setSidebar: LayoutActions['setSidebar'];
  /** 合并更新顶栏配置。 */
  setHeader: LayoutActions['setHeader'];
  /** 合并更新标签栏配置。 */
  setTabbar: LayoutActions['setTabbar'];
  /** 合并更新页脚配置。 */
  setFooter: LayoutActions['setFooter'];
  /** 合并更新面包屑配置。 */
  setBreadcrumb: LayoutActions['setBreadcrumb'];
  /** 切换侧边栏折叠状态。 */
  toggleSidebarCollapsed: LayoutActions['toggleSidebarCollapsed'];
  /** `toggleSidebarCollapsed` 的别名。 */
  toggleSidebar: LayoutActions['toggleSidebarCollapsed'];
  /** 显式设置侧边栏折叠状态。 */
  setSidebarCollapsed: LayoutActions['setSidebarCollapsed'];
}

/**
 * 创建并初始化全局偏好设置管理器。
 *
 * @param options 初始化选项。
 * @returns 偏好设置管理器实例。
 */
export function initPreferences(options?: PreferencesInitOptions): PreferencesManager {
  return store.init(options);
}

/**
 * 获取全局偏好设置管理器。
 *
 * @returns 偏好设置管理器实例。
 */
export function getPreferencesManager(): PreferencesManager {
  return store.getManager();
}

/**
 * 判断偏好设置管理器是否已初始化。
 *
 * @returns `true` 表示管理器已初始化。
 */
export function isPreferencesInitialized(): boolean {
  return store.isInitialized();
}

/**
 * 销毁全局偏好设置管理器。
 * @description 清理全局 store 与管理器资源。
 * @returns 无返回值。
 */
export function destroyPreferences(): void {
  store.destroy();
}

/**
 * 订阅偏好设置 store 并返回最新状态快照。
 *
 * @returns 当前偏好设置对象。
 */
function usePreferencesStore(): Preferences {
  /**
   * 订阅偏好设置变更。
   * @description 为 React 外部状态同步提供订阅函数，并返回取消订阅逻辑。
   * @param callback React 在状态变更时触发的回调。
   * @returns 取消订阅函数。
   */
  const subscribe = useCallback((callback: () => void) => {
    const unsubscribe = store.subscribe(() => {
      /** 始终触发回调，确保 React 感知外部状态更新。 */
      callback();
    });
    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * 获取当前偏好快照。
   * @description 提供给 `useSyncExternalStore` 的快照读取函数。
   * @returns 当前偏好设置对象。
   */
  const getSnapshot = useCallback(() => {
    const prefs = store.getPreferences() as Preferences;
    /*
     * `useSyncExternalStore` 会频繁读取快照，这属于正常行为。
     * 此处仅返回当前快照，不附加额外日志逻辑。
     */
    return prefs;
  }, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

/**
 * 使用全局偏好设置状态与通用操作。
 *
 * @returns 偏好状态、主题派生值与常用更新方法集合。
 */
export function usePreferences(): UsePreferencesReturn {
  /**
   * 偏好设置管理器实例。
   * @description 提供分类级读写与持久化能力。
   */
  const manager = store.getManager();
  /**
   * 偏好 actions 实例。
   */
  const actions = getPreferencesActionsInstance();
  /**
   * 偏好设置快照（订阅式）。
   */
  const preferences = usePreferencesStore();

  /**
   * 主题派生状态：仅在主题模式变化时重算。
   */
  const actualThemeMode = useMemo(
    () => actions.getActualThemeMode(),
    [actions, preferences.theme.mode]
  );
  /**
   * 是否处于深色主题。
   * @description 根据主题派生模式计算，供界面快速分支判断使用。
   */
  const isDark = actualThemeMode === 'dark';

  /**
   * 是否相对默认偏好存在变更。
   */
  const hasChanges = useMemo(
    () => hasChangesUtil(getDefaultPreferences(), preferences),
    [preferences]
  );

  return {
    preferences,
    actualThemeMode,
    isDark,
    hasChanges,
    /** 从 core actions 缓存实例透传的操作方法。 */
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
 * 使用特定分类的偏好设置（优化版，减少重渲染）。
 * @description 读取指定分类快照并返回分类级更新/重置方法。
 * @template K 偏好设置分类键。
 * @param key 分类键名。
 * @returns 分类值、更新方法与重置方法。
 */
export function usePreferencesCategory<K extends PreferencesKeys>(
  key: K
): UsePreferencesCategoryReturn<K> {
  /**
   * 偏好设置管理器实例。
   */
  const manager = store.getManager();
  /**
   * 偏好设置快照。
   */
  const preferences = usePreferencesStore();

  /**
   * 当前分类值。
   */
  const value = preferences[key] as Preferences[K];

  /**
   * 更新指定分类偏好。
   * @description 对当前分类执行深度局部更新。
   * @param updates 分类增量更新对象。
   * @returns 无返回值。
   */
  const setCategory = useCallback(
    (updates: DeepPartial<Preferences[K]>) => {
      manager.set(key, updates);
    },
    [manager, key]
  );

  /**
   * 重置指定分类偏好。
   * @description 将当前分类恢复为默认值。
   * @returns 无返回值。
   */
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
 * 使用主题设置（优化版，共享订阅）。
 * @description 返回主题分类快照与常用主题更新方法。
 *
 * @returns 主题状态与主题更新方法集合。
 */
export function useTheme(): UseThemeReturn {
  /**
   * 主题 actions 实例。
   */
  const themeActions = getThemeActionsInstance();
  /**
   * 偏好设置快照。
   */
  const preferences = usePreferencesStore();

  /**
   * 当前主题分类快照。
   */
  const theme = preferences.theme;
  /**
   * 主题派生状态：仅在主题模式变化时重算。
   */
  const actualThemeMode = useMemo(
    () => themeActions.getActualThemeMode(),
    [themeActions, theme.mode]
  );
  const isDark = actualThemeMode === 'dark';

  return {
    theme,
    actualThemeMode,
    isDark,
    /** 从 core actions 缓存实例透传的操作方法。 */
    setTheme: themeActions.setTheme,
    setMode: themeActions.setMode,
    setPrimaryColor: themeActions.setPrimaryColor,
    setBuiltinTheme: themeActions.setBuiltinTheme,
    setRadius: themeActions.setRadius,
    toggleTheme: themeActions.toggleTheme,
  };
}

/**
 * 使用布局设置（优化版，共享订阅）。
 * @description 返回布局相关分类快照与布局更新方法集合。
 *
 * @returns 布局分类状态与布局更新方法集合。
 */
export function useLayout(): UseLayoutReturn {
  /**
   * 布局 actions 实例。
   */
  const layoutActions = getLayoutActionsInstance();
  /**
   * 偏好设置快照。
   */
  const preferences = usePreferencesStore();

  const { app, sidebar, header, tabbar, footer, breadcrumb } = preferences;
  /**
   * 当前侧边栏是否折叠。
   * @description 便捷别名字段，减少调用方重复访问深层属性。
   */
  const isSidebarCollapsed = sidebar.collapsed;
  /**
   * 当前布局类型。
   * @description 便捷别名字段，供布局相关逻辑快速读取。
   */
  const currentLayout = app.layout;

  return {
    /** 响应式读取的数据快照（React）。 */
    app,
    sidebar,
    header,
    tabbar,
    footer,
    breadcrumb,
    isSidebarCollapsed,
    currentLayout,
    /** 从 core actions 缓存实例透传的操作方法。 */
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
