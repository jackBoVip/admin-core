/**
 * Tabs Core 初始化与语言运行时。
 * @description 负责 Tabs 语言包合并、版本追踪与订阅通知管理。
 */
import type {
  AdminTabsLocale,
  SetupAdminTabsCoreOptions,
} from './types';

/**
 * 标签页核心默认国际化文案。
 * @description 在未调用 `setupAdminTabsCore` 或未覆盖字段时作为回退值。
 */
const DEFAULT_LOCALE: AdminTabsLocale = {
  close: 'Close',
};

/**
 * 标签页核心初始化状态。
 */
interface AdminTabsCoreSetupState {
  /** 是否已初始化。 */
  initialized: boolean;
  /** 当前生效语言包。 */
  locale: AdminTabsLocale;
  /** 语言版本号（每次语言更新自增）。 */
  localeVersion: number;
}

/** 标签页核心模块级 setup 状态存储。 */
const setupState: AdminTabsCoreSetupState = {
  initialized: false,
  locale: { ...DEFAULT_LOCALE },
  localeVersion: 0,
};

/** 语言变更订阅器集合。 */
const localeListeners = new Set<() => void>();

/**
 * 通知语言变更监听器。
 * @returns 无返回值。
 */
function notifyLocaleChanged() {
  setupState.localeVersion += 1;
  for (const listener of localeListeners) {
    listener();
  }
}

/**
 * 初始化标签页核心配置。
 * @description 支持多次调用；每次调用都会在现有状态上增量合并。
 * @param options 初始化选项。
 * @returns 最新 setup 状态。
 */
export function setupAdminTabsCore(options: SetupAdminTabsCoreOptions = {}) {
  if (options.locale) {
    setupState.locale = {
      ...setupState.locale,
      ...options.locale,
    };
    notifyLocaleChanged();
  }
  setupState.initialized = true;
  return setupState;
}

/**
 * 设置标签页语言包增量。
 * @description 仅覆盖传入字段，不会重置未传字段。
 * @param locale 语言包增量。
 * @returns 合并后的语言包。
 */
export function setAdminTabsLocale(locale: Partial<AdminTabsLocale>) {
  setupState.locale = {
    ...setupState.locale,
    ...locale,
  };
  notifyLocaleChanged();
  return setupState.locale;
}

/**
 * 获取当前标签页语言包。
 * @returns 当前语言包快照。
 */
export function getAdminTabsLocale() {
  return setupState.locale;
}

/**
 * 获取标签页语言版本号。
 * @returns 当前语言版本号。
 */
export function getAdminTabsLocaleVersion() {
  return setupState.localeVersion;
}

/**
 * 订阅标签页语言变更。
 * @param listener 变更回调。
 * @returns 取消订阅函数，调用后不再接收后续语言变更通知。
 */
export function subscribeAdminTabsLocale(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

/**
 * 获取标签页核心 setup 状态。
 * @returns setup 状态对象。
 */
export function getAdminTabsCoreSetupState() {
  return setupState;
}
