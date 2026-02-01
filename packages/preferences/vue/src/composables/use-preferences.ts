/**
 * Vue 偏好设置 Composable
 * @description 提供响应式的偏好设置状态
 */

import { computed, ref } from 'vue';
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
 * 响应式偏好设置状态
 * @description 使用 ref 而非 shallowRef，确保深层属性变化能触发响应式更新
 */
const preferencesState = ref<Preferences | null>(null);

/**
 * 是否已订阅全局状态
 */
let globalSubscribed = false;

/**
 * 取消订阅函数（用于清理）
 */
let globalUnsubscribe: (() => void) | null = null;

/**
 * 缓存的 actions 对象（避免重复创建）
 */
let cachedPreferencesActions: ReturnType<typeof createPreferencesActions> | null = null;
let cachedThemeActions: ReturnType<typeof createThemeActions> | null = null;
let cachedLayoutActions: ReturnType<typeof createLayoutActions> | null = null;

/**
 * 确保已订阅全局状态
 */
function ensureGlobalSubscription(): void {
  if (globalSubscribed) return;
  
  // 保存取消订阅函数以便后续清理
  globalUnsubscribe = lifecycle.subscribe((prefs) => {
    preferencesState.value = prefs;
  });
  
  // 初始化状态
  preferencesState.value = lifecycle.getPreferences();
  globalSubscribed = true;
}

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
 * @returns PreferencesManager 实例
 */
export function initPreferences(options?: PreferencesInitOptions): PreferencesManager {
  const manager = lifecycle.init(options);
  ensureGlobalSubscription();
  return manager;
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
  // 先取消订阅
  if (globalUnsubscribe) {
    globalUnsubscribe();
    globalUnsubscribe = null;
  }
  
  lifecycle.destroy();
  preferencesState.value = null;
  globalSubscribed = false;
  // 清除缓存的 actions
  cachedPreferencesActions = null;
  cachedThemeActions = null;
  cachedLayoutActions = null;
}

/**
 * 使用偏好设置
 * @returns 响应式偏好设置
 */
export function usePreferences() {
  const manager = lifecycle.get();
  const actions = getPreferencesActionsInstance();

  // Vue 响应式绑定
  const preferences = computed(() => preferencesState.value);
  const actualThemeMode = computed(() => actions.getActualThemeMode());
  const isDark = computed(() => actualThemeMode.value === 'dark');

  // 是否有变更（与默认值比较）
  const hasChanges = computed(() => {
    if (!preferencesState.value) return false;
    return hasChangesUtil(getDefaultPreferences(), preferencesState.value);
  });

  return {
    preferences,
    actualThemeMode,
    isDark,
    hasChanges,
    // 从 core 导入的操作
    setPreferences: actions.setPreferences,
    resetPreferences: actions.resetPreferences,
    toggleTheme: actions.toggleTheme,
    toggleSidebar: actions.toggleSidebar,
    exportConfig: actions.exportConfig,
    importConfig: actions.importConfig,
    // 导出管理器供高级使用
    manager,
  };
}

/**
 * 使用特定分类的偏好设置
 * @param key - 分类键名
 */
export function usePreferencesCategory<K extends PreferencesKeys>(key: K) {
  const manager = lifecycle.get();

  const value = computed(() => preferencesState.value?.[key]);

  const setValue = (updates: DeepPartial<Preferences[K]>) => {
    manager.set(key, updates);
  };

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
 * 使用主题设置
 */
export function useTheme() {
  const themeActions = getThemeActionsInstance();

  // Vue 响应式绑定（直接从全局状态读取，避免重复订阅）
  const theme = computed(() => preferencesState.value?.theme);
  const actualThemeMode = computed(() => themeActions.getActualThemeMode());
  const isDark = computed(() => actualThemeMode.value === 'dark');

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
 * 使用布局设置
 */
export function useLayout() {
  const layoutActions = getLayoutActionsInstance();

  // Vue 响应式绑定（直接从全局状态读取，避免重复订阅）
  const app = computed(() => preferencesState.value?.app);
  const sidebar = computed(() => preferencesState.value?.sidebar);
  const header = computed(() => preferencesState.value?.header);
  const tabbar = computed(() => preferencesState.value?.tabbar);
  const footer = computed(() => preferencesState.value?.footer);
  const breadcrumb = computed(() => preferencesState.value?.breadcrumb);
  const isSidebarCollapsed = computed(() => sidebar.value?.collapsed ?? false);
  const currentLayout = computed(() => app.value?.layout);

  return {
    // Vue 响应式数据
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
