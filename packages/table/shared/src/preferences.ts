/**
 * Table Shared 偏好联动工具。
 * @description 提供表格语言与主题和偏好中心的绑定、同步与解析能力。
 */
import {
  getActualThemeMode,
  getDefaultPreferencesStore,
  getThemePrimaryColor,
  oklchToHex,
  type Preferences,
} from '@admin-core/preferences';
import {
  createTableDateFormatter,
  normalizeTableLocale,
  registerTableFormatters,
  setLocale as setTableLocale,
} from '@admin-core/table-core';
import type { BuiltInTableLocale } from './types';

/**
 * 规范化主题主色值。
 * 支持将 OKLCH 色值转换为十六进制。
 * @param value 原始主色值。
 * @returns 规范化后的主色字符串。
 */
export function normalizeThemePrimaryColor(value: null | string | undefined) {
  const raw = value?.trim();
  if (!raw) {
    return '';
  }
  if (/^oklch\(/i.test(raw)) {
    return oklchToHex(raw);
  }
  return raw;
}

/**
 * 偏好设置绑定器参数。
 * @description 约束语言与主题应用回调，供共享层统一对接偏好中心。
 */
export interface TablePreferencesBinderOptions {
  /** 应用语言回调，在偏好语言变化时触发。 */
  applyLocale: (locale: BuiltInTableLocale) => void;
  /** 应用主题回调，在偏好主题变化时触发。 */
  applyTheme: (preferences: Preferences | null | undefined) => void;
}

/**
 * 表格偏好设置绑定控制器。
 * @description 提供偏好订阅建立与手动同步入口，确保表格主题语言实时一致。
 */
export interface TablePreferencesBinder {
  /** 确保偏好订阅已建立（幂等）。 */
  ensurePreferencesBinding: () => void;
  /** 立即读取当前偏好并同步一次语言与主题。 */
  syncWithPreferences: () => void;
}

/**
 * 创建表格偏好设置绑定器。
 * @param options 绑定参数。
 * @returns 偏好绑定控制器。
 */
export function createTablePreferencesBinder(
  options: TablePreferencesBinderOptions
): TablePreferencesBinder {
  /**
   * 偏好订阅取消函数。
   * @description 非空表示当前已建立偏好订阅。
   */
  let preferenceUnsubscribe: null | (() => void) = null;
  /**
   * 默认偏好设置存储实例。
   */
  const preferencesStore = getDefaultPreferencesStore();

  /**
   * 确保仅绑定一次偏好订阅。
   * @returns 无返回值。
   */
  function ensurePreferencesBinding() {
    if (preferenceUnsubscribe) {
      return;
    }
    preferenceUnsubscribe = preferencesStore.subscribe((preferences) => {
      const nextLocale = normalizeTableLocale(preferences?.app?.locale);
      options.applyLocale(nextLocale);
      options.applyTheme(preferences);
    });
  }

  /**
   * 读取当前偏好并立即同步一次语言与主题。
   * @returns 无返回值。
   */
  function syncWithPreferences() {
    const currentPreferences = preferencesStore.getPreferences();
    if (!currentPreferences) {
      return;
    }
    options.applyLocale(normalizeTableLocale(currentPreferences.app.locale));
    options.applyTheme(currentPreferences);
  }

  return {
    ensurePreferencesBinding,
    syncWithPreferences,
  };
}

/**
 * 应用表格语言时的钩子。
 * @description 在设置语言前后暴露扩展点，便于注入额外副作用。
 */
export interface ApplyTableLocaleCoreHooks {
  /** 语言应用完成后的回调。 */
  onAfterApply?: (locale: BuiltInTableLocale) => void;
  /** 语言应用前的回调。 */
  onBeforeApply?: (locale: BuiltInTableLocale) => void;
}

/**
 * 应用表格核心语言设置。
 * @param locale 目标语言。
 * @param hooks 应用前后钩子。
 * @returns 无返回值。
 */
export function applyTableLocaleCore(
  locale: BuiltInTableLocale,
  hooks: ApplyTableLocaleCoreHooks = {}
) {
  hooks.onBeforeApply?.(locale);
  setTableLocale(locale);
  registerTableFormatters(createTableDateFormatter(locale));
  hooks.onAfterApply?.(locale);
}

/**
 * 表格主题上下文解析结果。
 * @description 描述一次主题解析后的模式与主色结果，用于后续样式同步。
 */
export interface ResolvedTableThemeContext {
  /** 实际主题模式（已考虑系统模式解析）。 */
  actualMode: 'dark' | 'light';
  /** 用于本次解析的原始偏好对象。 */
  preferences: Preferences;
  /** 解析后的最终主色（优先 CSS 变量，其次偏好设置）。 */
  resolvedPrimary: string;
}

/**
 * 解析表格主题上下文。
 * @param preferences 偏好设置。
 * @returns 主题上下文；无偏好时返回 `null`。
 */
export function resolveTableThemeContext(
  preferences: Preferences | null | undefined
): null | ResolvedTableThemeContext {
  if (!preferences) {
    return null;
  }

  const actualMode = getActualThemeMode(preferences.theme.mode);
  const isDark = actualMode === 'dark';
  const themePrimary = preferences.theme.builtinType === 'custom'
    ? preferences.theme.colorPrimary
    : getThemePrimaryColor(preferences.theme.builtinType, isDark);
  const cssVarPrimary = typeof document !== 'undefined'
    ? getComputedStyle(document.documentElement)
        .getPropertyValue('--primary')
        .trim()
    : '';

  return {
    actualMode,
    preferences,
    resolvedPrimary: normalizeThemePrimaryColor(cssVarPrimary || themePrimary),
  };
}
