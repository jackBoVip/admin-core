/**
 * 偏好设置抽屉配置
 * @description 框架无关的抽屉配置和工具函数
 */

import type { Preferences } from '../types';
import { zhCN, enUS, type LocaleMessages } from '../locales';
import { ERROR_MESSAGES } from '../constants/messages';
import { getIcon, type IconName } from '../icons/common';
import { logger } from '../utils/logger';

/**
 * 标签页类型
 */
export type DrawerTabType = 'appearance' | 'layout' | 'shortcutKeys' | 'general';

/**
 * 标签页配置
 */
export interface DrawerTabConfig {
  /** 标签页类型 */
  value: DrawerTabType;
  /** 语言包路径 */
  labelKey: keyof LocaleMessages;
}

/**
 * 默认标签页配置
 */
export const DRAWER_TABS: DrawerTabConfig[] = [
  { value: 'appearance', labelKey: 'theme' },
  { value: 'layout', labelKey: 'layout' },
  { value: 'shortcutKeys', labelKey: 'shortcutKeys' },
  { value: 'general', labelKey: 'general' },
];

/**
 * 获取标签页配置（带翻译）
 */
export function getDrawerTabs(locale: LocaleMessages): Array<{ label: string; value: DrawerTabType }> {
  return DRAWER_TABS.map((tab) => ({
    value: tab.value,
    label: (locale[tab.labelKey] as { title: string }).title,
  }));
}

/**
 * 根据当前语言获取语言包
 */
export function getLocaleByPreferences(preferences: Preferences | null): LocaleMessages {
  if (!preferences) return zhCN;
  return preferences.app.locale === 'en-US' ? enUS : zhCN;
}

/**
 * 复制配置到剪贴板
 */
export async function copyPreferencesConfig(
  preferences: Preferences,
  onSuccess?: () => void,
  onError?: (error: unknown) => void
): Promise<boolean> {
  try {
    // SSR 环境检查
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      logger.warn('Clipboard API not available');
      return false;
    }
    const config = JSON.stringify(preferences, null, 2);
    await navigator.clipboard.writeText(config);
    onSuccess?.();
    return true;
  } catch (error) {
    logger.error(ERROR_MESSAGES.copyConfigFailed, error);
    onError?.(error);
    return false;
  }
}

/**
 * 配置验证结果
 */
export interface ConfigValidationResult {
  /** 是否有效 */
  valid: boolean;
  /** 错误信息（无效时） */
  error?: string;
  /** 解析后的配置（有效时） */
  config?: Preferences;
}

/**
 * 必需的顶级属性列表
 */
const REQUIRED_TOP_LEVEL_KEYS: (keyof Preferences)[] = [
  'app',
  'theme',
  'sidebar',
  'header',
  'tabbar',
  'breadcrumb',
  'navigation',
  'footer',
  'transition',
  'widget',
  'shortcutKeys',
  'copyright',
  'logo',
];

/**
 * 检查对象是否包含原型污染风险的键
 * @param obj - 待检查对象
 * @returns 是否安全
 */
function isPrototypeSafe(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return true;
  
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  for (const key of Object.keys(obj as object)) {
    if (dangerousKeys.includes(key)) {
      return false;
    }
    // 递归检查嵌套对象
    const value = (obj as Record<string, unknown>)[key];
    if (value && typeof value === 'object' && !isPrototypeSafe(value)) {
      return false;
    }
  }
  
  return true;
}

/**
 * 验证配置数据
 * @param data - 待验证的数据
 * @returns 验证结果
 */
export function validatePreferencesConfig(data: unknown): ConfigValidationResult {
  // 检查是否为对象
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'INVALID_FORMAT' };
  }

  // 检查原型污染风险
  if (!isPrototypeSafe(data)) {
    return { valid: false, error: 'PROTOTYPE_POLLUTION_RISK' };
  }

  const config = data as Record<string, unknown>;

  // 检查必需的顶级属性
  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!(key in config)) {
      return { valid: false, error: 'MISSING_REQUIRED_FIELD' };
    }
    // 检查属性值是否为对象
    if (!config[key] || typeof config[key] !== 'object') {
      return { valid: false, error: 'INVALID_FIELD_TYPE' };
    }
  }

  // 检查 app.locale 是否有效
  const app = config.app as Record<string, unknown>;
  if (app.locale && !['zh-CN', 'en-US'].includes(app.locale as string)) {
    return { valid: false, error: 'INVALID_LOCALE' };
  }

  // 检查 theme.mode 是否有效
  const theme = config.theme as Record<string, unknown>;
  if (theme.mode && !['light', 'dark', 'auto'].includes(theme.mode as string)) {
    return { valid: false, error: 'INVALID_THEME_MODE' };
  }

  return { valid: true, config: config as unknown as Preferences };
}

/**
 * 从剪贴板导入配置的结果
 */
export interface ImportConfigResult {
  /** 是否成功 */
  success: boolean;
  /** 错误类型 */
  errorType?: 'CLIPBOARD_ACCESS_DENIED' | 'EMPTY_CLIPBOARD' | 'PARSE_ERROR' | 'VALIDATION_ERROR';
  /** 错误详情 */
  errorDetail?: string;
  /** 导入的配置（成功时） */
  config?: Preferences;
}

/**
 * 从剪贴板读取并验证配置
 * @returns 导入结果
 */
export async function importPreferencesConfig(): Promise<ImportConfigResult> {
  try {
    // SSR 环境检查
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      return { success: false, errorType: 'CLIPBOARD_ACCESS_DENIED', errorDetail: 'Clipboard API not available' };
    }
    
    // 读取剪贴板
    const clipboardText = await navigator.clipboard.readText();

    // 检查是否为空
    if (!clipboardText || !clipboardText.trim()) {
      return { success: false, errorType: 'EMPTY_CLIPBOARD' };
    }

    // 解析 JSON
    let parsed: unknown;
    try {
      parsed = JSON.parse(clipboardText);
    } catch {
      return { success: false, errorType: 'PARSE_ERROR' };
    }

    // 验证配置
    const validation = validatePreferencesConfig(parsed);
    if (!validation.valid) {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        errorDetail: validation.error,
      };
    }

    return { success: true, config: validation.config };
  } catch (error) {
    // 剪贴板访问被拒绝
    logger.error('Failed to import preferences config:', error);
    return {
      success: false,
      errorType: 'CLIPBOARD_ACCESS_DENIED',
      errorDetail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 抽屉默认 Props
 */
export const DRAWER_DEFAULT_PROPS = {
  /** 默认显示遮罩 */
  showOverlay: true,
  /** 默认点击遮罩关闭 */
  closeOnOverlay: true,
  /** 默认激活的标签页 */
  defaultActiveTab: 'appearance' as DrawerTabType,
} as const;

/* ========== 头部操作按钮配置 ========== */

/**
 * 头部操作按钮类型
 */
export type DrawerHeaderActionType = 'import' | 'reset' | 'pin' | 'close';

/**
 * 头部操作按钮配置
 */
export interface DrawerHeaderAction {
  /** 操作类型 */
  type: DrawerHeaderActionType;
  /** 图标名称 */
  icon: IconName;
  /** 备用图标（如 pin/pinOff 切换） */
  altIcon?: IconName;
  /** 是否显示指示器（如重置按钮的红点） */
  showIndicator?: boolean;
  /** 语言包 key */
  tooltipKey: string;
  /** 备用 tooltip key（如 pin/pinOff 切换） */
  altTooltipKey?: string;
}

/**
 * 默认头部操作配置
 */
export const DRAWER_HEADER_ACTIONS: DrawerHeaderAction[] = [
  {
    type: 'import',
    icon: 'import',
    tooltipKey: 'preferences.importConfig',
  },
  {
    type: 'reset',
    icon: 'refresh',
    showIndicator: true, // 有变更时显示红点
    tooltipKey: 'preferences.resetTip',
  },
  {
    type: 'pin',
    icon: 'pinOff', // 默认：点击后取消固定
    altIcon: 'pin', // 切换：点击后固定
    tooltipKey: 'preferences.disableSticky',
    altTooltipKey: 'preferences.enableSticky',
  },
  {
    type: 'close',
    icon: 'close',
    tooltipKey: 'common.close',
  },
];

/**
 * 获取头部操作按钮配置
 * @param locale - 语言包
 * @param options - 选项
 * @returns 带翻译的操作配置
 */
export function getDrawerHeaderActions(
  locale: LocaleMessages,
  options: {
    /** 是否有变更 */
    hasChanges?: boolean;
    /** 是否已固定 */
    isPinned?: boolean;
    /** 包含的操作类型（默认全部） */
    include?: DrawerHeaderActionType[];
    /** 排除的操作类型 */
    exclude?: DrawerHeaderActionType[];
  } = {}
): Array<{
  type: DrawerHeaderActionType;
  icon: string;
  tooltip: string;
  disabled: boolean;
  showIndicator: boolean;
}> {
  const { hasChanges = false, isPinned = false, include, exclude } = options;

  return DRAWER_HEADER_ACTIONS
    .filter((action) => {
      if (include && !include.includes(action.type)) return false;
      if (exclude && exclude.includes(action.type)) return false;
      return true;
    })
    .map((action) => {
      // 获取图标（处理 pin/pinOff 切换）
      let iconName = action.icon;
      if (action.type === 'pin' && action.altIcon) {
        iconName = isPinned ? action.icon : action.altIcon;
      }

      // 获取 tooltip（处理 pin/pinOff 切换）
      let tooltipKey = action.tooltipKey;
      if (action.type === 'pin' && action.altTooltipKey) {
        tooltipKey = isPinned ? action.tooltipKey : action.altTooltipKey;
      }

      // 解析 tooltip key（支持嵌套路径如 'preferences.resetTip'）
      const tooltip = action.type === 'close' ? '' : resolveLocaleKey(locale, tooltipKey);

      // 计算禁用状态
      const disabled = action.type === 'reset' && !hasChanges;

      // 计算指示器显示
      const showIndicator = action.showIndicator === true && hasChanges;

      return {
        type: action.type,
        icon: getIcon(iconName),
        tooltip,
        disabled,
        showIndicator,
      };
    });
}

/**
 * 解析语言包 key（支持嵌套路径）
 * @param locale - 语言包
 * @param key - 键路径（如 'preferences.resetTip'）
 * @returns 翻译文本
 */
function resolveLocaleKey(locale: LocaleMessages, key: string): string {
  const keys = key.split('.');
  let result: unknown = locale;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = (result as Record<string, unknown>)[k];
    } else {
      return key; // 找不到时返回原 key
    }
  }

  return typeof result === 'string' ? result : key;
}

// ========== UI 配置相关 ==========

import type {
  PreferencesDrawerUIConfig,
  FeatureItemConfig,
  ResolvedFeatureConfig,
} from '../types';

/**
 * 默认 UI 配置（所有功能都显示且启用）
 */
export const DEFAULT_DRAWER_UI_CONFIG: PreferencesDrawerUIConfig = {
  headerActions: {
    import: { visible: true, disabled: false },
    reset: { visible: true, disabled: false },
    pin: { visible: true, disabled: false },
    close: { visible: true, disabled: false },
  },
  footerActions: {
    copy: { visible: true, disabled: false },
  },
  appearance: { visible: true, disabled: false },
  layout: { visible: true, disabled: false },
  general: { visible: true, disabled: false },
  shortcutKeys: { visible: true, disabled: false },
};

/**
 * 解析功能项配置
 * @param config - 用户配置（可能为 undefined）
 * @param defaultConfig - 默认配置
 * @returns 解析后的配置
 */
export function resolveFeatureConfig(
  config?: FeatureItemConfig,
  defaultConfig: FeatureItemConfig = { visible: true, disabled: false }
): ResolvedFeatureConfig {
  return {
    visible: config?.visible ?? defaultConfig.visible ?? true,
    disabled: config?.disabled ?? defaultConfig.disabled ?? false,
  };
}

/**
 * 从嵌套路径获取功能项配置
 * @param uiConfig - UI 配置对象
 * @param path - 配置路径，如 'appearance.colorMode.items.colorGrayMode'
 * @returns 解析后的配置
 */
export function getFeatureConfig(
  uiConfig: PreferencesDrawerUIConfig | undefined,
  path: string
): ResolvedFeatureConfig {
  if (!uiConfig) {
    return { visible: true, disabled: false };
  }

  const keys = path.split('.');
  let current: unknown = uiConfig;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return { visible: true, disabled: false };
    }
  }

  return resolveFeatureConfig(current as FeatureItemConfig | undefined);
}

/**
 * 检查 Tab 是否可见
 * @param uiConfig - UI 配置
 * @param tabName - Tab 名称
 * @returns 是否显示该 Tab
 */
export function isTabVisible(
  uiConfig: PreferencesDrawerUIConfig | undefined,
  tabName: DrawerTabType
): boolean {
  return getFeatureConfig(uiConfig, tabName).visible;
}

/**
 * 获取可见的 Tab 列表
 * @param locale - 语言包
 * @param uiConfig - UI 配置
 * @returns 过滤后的 Tab 列表
 */
export function getVisibleDrawerTabs(
  locale: LocaleMessages,
  uiConfig?: PreferencesDrawerUIConfig
): Array<{ label: string; value: DrawerTabType }> {
  return getDrawerTabs(locale).filter(tab => isTabVisible(uiConfig, tab.value));
}

/**
 * 合并用户配置和默认配置
 * @param userConfig - 用户配置
 * @param defaultConfig - 默认配置
 * @returns 合并后的配置
 */
export function mergeDrawerUIConfig(
  userConfig?: PreferencesDrawerUIConfig,
  defaultConfig: PreferencesDrawerUIConfig = DEFAULT_DRAWER_UI_CONFIG
): PreferencesDrawerUIConfig {
  if (!userConfig) {
    return defaultConfig;
  }
  
  // 深度合并配置
  return deepMergeUIConfig(
    defaultConfig as unknown as Record<string, unknown>,
    userConfig as unknown as Record<string, unknown>
  ) as PreferencesDrawerUIConfig;
}

/**
 * 深度合并 UI 配置（递归合并对象）
 */
function deepMergeUIConfig(
  target: Record<string, unknown>,
  source: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };
  
  for (const key of Object.keys(source)) {
    const sourceValue = source[key];
    const targetValue = target[key];
    
    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMergeUIConfig(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      );
    } else if (sourceValue !== undefined) {
      result[key] = sourceValue;
    }
  }
  
  return result;
}

// ========== Tab 配置解析辅助函数 ==========

import type {
  AppearanceTabConfig,
  LayoutTabConfig,
  GeneralTabConfig,
  ShortcutKeysTabConfig,
  FeatureBlockConfig,
} from '../types';

/** Tab UI 配置联合类型（用于 getFeatureItemConfig） */
export type UITabConfig = AppearanceTabConfig | LayoutTabConfig | GeneralTabConfig | ShortcutKeysTabConfig;

/**
 * 获取功能项配置（支持 Block disabled 继承）
 * @description 通用辅助函数，用于 Tab 组件中获取功能项的 visible/disabled 配置
 * 
 * 特性：
 * - 如果 Block 设置了 disabled，子项会继承该 disabled 状态
 * - 如果子项显式设置了 disabled，以子项的设置为准
 * - visible 不继承，各层级独立控制
 * 
 * @param tabConfig - Tab 配置对象
 * @param blockKey - 区块 key
 * @param itemKey - 可选的子项 key
 * @returns 解析后的配置 { visible, disabled }
 * 
 * @example
 * // 获取区块配置
 * getFeatureItemConfig(uiConfig, 'watermark')
 * // 获取子项配置（会继承区块的 disabled）
 * getFeatureItemConfig(uiConfig, 'watermark', 'enable')
 */
export function getFeatureItemConfig<T extends UITabConfig>(
  tabConfig: T | undefined,
  blockKey: keyof T,
  itemKey?: string
): ResolvedFeatureConfig {
  if (!tabConfig) {
    return { visible: true, disabled: false };
  }

  const block = tabConfig[blockKey] as FeatureBlockConfig | undefined;
  const blockConfig = resolveFeatureConfig(block);
  
  // 如果没有指定子项，直接返回区块配置
  if (!itemKey) {
    return blockConfig;
  }
  
  // 获取子项配置
  const items = block?.items;
  const itemConfig = items?.[itemKey];
  const resolvedItem = resolveFeatureConfig(itemConfig);
  
  // 子项的 disabled 继承 Block 的 disabled（除非子项显式设置）
  // 逻辑：Block disabled 或 子项 disabled -> 最终 disabled
  return {
    visible: resolvedItem.visible,
    disabled: blockConfig.disabled || resolvedItem.disabled,
  };
}

/**
 * 创建 Tab 配置解析器（工厂函数）
 * @description 为特定 Tab 创建配置解析函数，减少重复代码
 * 
 * @param tabConfig - Tab 配置对象
 * @returns 配置解析函数
 * 
 * @example
 * const getConfig = createTabConfigResolver(uiConfig);
 * getConfig('watermark') // 获取区块配置
 * getConfig('watermark', 'enable') // 获取子项配置
 */
export function createTabConfigResolver<T extends UITabConfig>(
  tabConfig: T | undefined
): (blockKey: keyof T, itemKey?: string) => ResolvedFeatureConfig {
  return (blockKey: keyof T, itemKey?: string) => 
    getFeatureItemConfig(tabConfig, blockKey, itemKey);
}
