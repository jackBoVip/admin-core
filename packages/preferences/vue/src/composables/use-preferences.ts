/**
 * Vue 偏好设置 Composable。
 * @description 提供响应式偏好状态、分类更新与主题操作等能力。
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
import { computed, ref, type ComputedRef } from 'vue';

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
 * 响应式偏好设置状态。
 * @description 使用 `ref` 而非 `shallowRef`，确保深层属性变化可触发响应更新。
 */
const preferencesState = ref<Preferences | null>(null);

/**
 * 是否已订阅全局状态。
 */
let globalSubscribed = false;

/**
 * 取消订阅函数（用于清理）。
 */
let globalUnsubscribe: (() => void) | null = null;

/**
 * 确保已订阅全局状态。
 * @description 首次调用时注册全局 store 订阅，并同步当前偏好到响应式状态。
 */
function ensureGlobalSubscription(): void {
  if (globalSubscribed) return;

  /** 保存取消订阅函数，供销毁阶段清理。 */
  globalUnsubscribe = store.subscribe((prefs) => {
    preferencesState.value = prefs;
  });

  /** 初始化响应式状态。 */
  const initialPrefs = store.getPreferences();
  preferencesState.value = initialPrefs;
  globalSubscribed = true;
}

/**
 * 获取缓存的 actions。
 * @description 返回偏好设置主 actions 实例，用于执行通用更新、重置及导入导出操作。
 * @returns 偏好设置 actions 对象。
 */
function getPreferencesActionsInstance() {
  return actionFactory.getPreferencesActions();
}

/**
 * 获取主题操作对象实例。
 * @returns 主题相关 actions。
 */
function getThemeActionsInstance() {
  return actionFactory.getThemeActions();
}

/**
 * 获取布局操作对象实例。
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
 * `usePreferences` Composable 返回值。
 */
export interface UsePreferencesReturn {
  /** 当前偏好设置快照。 */
  preferences: ComputedRef<Preferences | null>;
  /** 当前实际主题模式（`auto` 已解析）。 */
  actualThemeMode: ComputedRef<ReturnType<PreferencesActions['getActualThemeMode']>>;
  /** 是否处于深色主题。 */
  isDark: ComputedRef<boolean>;
  /** 是否相对默认配置发生过变更。 */
  hasChanges: ComputedRef<boolean>;
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
 * `usePreferencesCategory` Composable 返回值。
 * @template K 偏好设置分类键。
 */
export interface UsePreferencesCategoryReturn<K extends PreferencesKeys> {
  /** 指定分类的当前值。 */
  value: ComputedRef<Preferences[K] | undefined>;
  /** 深度合并更新指定分类。 */
  setValue: (updates: DeepPartial<Preferences[K]>) => void;
  /** 将指定分类恢复为默认值。 */
  reset: () => void;
}

/**
 * `useTheme` Composable 返回值。
 */
export interface UseThemeReturn {
  /** 主题分类快照。 */
  theme: ComputedRef<Preferences['theme'] | undefined>;
  /** 当前实际主题模式（`auto` 已解析）。 */
  actualThemeMode: ComputedRef<ReturnType<ThemeActions['getActualThemeMode']>>;
  /** 是否处于深色主题。 */
  isDark: ComputedRef<boolean>;
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
 * `useLayout` Composable 返回值。
 */
export interface UseLayoutReturn {
  /** 应用布局基础配置。 */
  app: ComputedRef<Preferences['app'] | undefined>;
  /** 侧边栏配置。 */
  sidebar: ComputedRef<Preferences['sidebar'] | undefined>;
  /** 顶栏配置。 */
  header: ComputedRef<Preferences['header'] | undefined>;
  /** 标签栏配置。 */
  tabbar: ComputedRef<Preferences['tabbar'] | undefined>;
  /** 页脚配置。 */
  footer: ComputedRef<Preferences['footer'] | undefined>;
  /** 面包屑配置。 */
  breadcrumb: ComputedRef<Preferences['breadcrumb'] | undefined>;
  /** 侧边栏当前折叠状态。 */
  isSidebarCollapsed: ComputedRef<boolean>;
  /** 当前布局模式。 */
  currentLayout: ComputedRef<Preferences['app']['layout'] | undefined>;
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
  const manager = store.init(options);
  ensureGlobalSubscription();
  return manager;
}

/**
 * 获取全局偏好设置管理器。
 * @description 返回 store 内部维护的单例管理器实例。
 * @returns 偏好设置管理器实例。
 */
export function getPreferencesManager(): PreferencesManager {
  return store.getManager();
}

/**
 * 判断偏好设置管理器是否已初始化。
 * @description 用于在运行时判断是否已执行 `initPreferences`。
 * @returns `true` 表示管理器已初始化。
 */
export function isPreferencesInitialized(): boolean {
  return store.isInitialized();
}

/**
 * 销毁全局偏好设置管理器。
 * @description 取消订阅、销毁 store 管理器并清空本地响应式状态。
 * @returns 无返回值。
 */
export function destroyPreferences(): void {
  /** 销毁前先取消全局订阅。 */
  if (globalUnsubscribe) {
    globalUnsubscribe();
    globalUnsubscribe = null;
  }

  store.destroy();
  preferencesState.value = null;
  globalSubscribed = false;
}

/**
 * 使用全局偏好设置状态与通用操作。
 *
 * @returns 偏好状态、主题派生值与常用更新方法集合。
 */
export function usePreferences(): UsePreferencesReturn {
  /**
   * 偏好管理器实例。
   * @description 提供分类读写与持久化能力。
   */
  const manager = store.getManager();
  /**
   * 偏好 actions 实例。
   * @description 提供通用偏好更新、重置与导入导出能力。
   */
  const actions = getPreferencesActionsInstance();

  /** 响应式绑定（Vue）。 */
  const preferences = computed(() => preferencesState.value);
  /** 当前实际主题模式（考虑 `auto` 场景后的解析结果）。 */
  const actualThemeMode = computed(() => actions.getActualThemeMode());
  /** 是否处于深色主题。 */
  const isDark = computed(() => actualThemeMode.value === 'dark');

  /** 是否相对默认偏好存在变更。 */
  const hasChanges = computed(() => {
    if (!preferencesState.value) return false;
    return hasChangesUtil(getDefaultPreferences(), preferencesState.value);
  });

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
    /** 导出管理器供高级场景直接调用。 */
    manager,
  };
}

/**
 * 使用特定分类的偏好设置。
 * @description 返回某一偏好分类的响应式值及更新方法。
 * @template K 偏好设置分类键。
 * @param key 分类键名。
 * @returns 分类值、分类更新与分类重置方法。
 */
export function usePreferencesCategory<K extends PreferencesKeys>(
  key: K
): UsePreferencesCategoryReturn<K> {
  const manager = store.getManager();

  const value = computed(() => preferencesState.value?.[key]);

  /**
   * 更新指定分类偏好。
   * @description 使用深度局部更新方式写入当前分类配置。
   * @param updates 分类配置的增量更新对象。
   * @returns 无返回值。
   */
  const setValue = (updates: DeepPartial<Preferences[K]>) => {
    manager.set(key, updates);
  };

  /**
   * 重置指定分类偏好。
   * @description 将当前分类恢复为默认配置值。
   * @returns 无返回值。
   */
  const reset = () => {
    manager.resetCategory(key);
  };

  return {
    value,
    setValue,
    reset,
  };
}

/**
 * 使用主题偏好设置与主题操作方法。
 *
 * @returns 主题状态与主题更新方法集合。
 */
export function useTheme(): UseThemeReturn {
  /**
   * 主题 actions 实例。
   * @description 提供主题模式、主色与主题预设等更新能力。
   */
  const themeActions = getThemeActionsInstance();

  /** 响应式绑定（直接读取全局状态，避免重复订阅）。 */
  const theme = computed(() => preferencesState.value?.theme);
  const actualThemeMode = computed(() => themeActions.getActualThemeMode());
  const isDark = computed(() => actualThemeMode.value === 'dark');

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
 * 使用布局偏好设置与布局操作方法。
 *
 * @returns 布局分类状态与布局更新方法集合。
 */
export function useLayout(): UseLayoutReturn {
  /**
   * 布局 actions 实例。
   * @description 提供布局与区域开关等布局域更新能力。
   */
  const layoutActions = getLayoutActionsInstance();

  /** 响应式绑定（直接读取全局状态，避免重复订阅）。 */
  const app = computed(() => preferencesState.value?.app);
  const sidebar = computed(() => preferencesState.value?.sidebar);
  const header = computed(() => preferencesState.value?.header);
  const tabbar = computed(() => preferencesState.value?.tabbar);
  const footer = computed(() => preferencesState.value?.footer);
  const breadcrumb = computed(() => preferencesState.value?.breadcrumb);
  const isSidebarCollapsed = computed(() => sidebar.value?.collapsed ?? false);
  const currentLayout = computed(() => app.value?.layout);

  return {
    /** 响应式数据（Vue）。 */
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
