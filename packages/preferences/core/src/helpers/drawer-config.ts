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
 * 验证配置数据
 * @param data - 待验证的数据
 * @returns 验证结果
 */
export function validatePreferencesConfig(data: unknown): ConfigValidationResult {
  // 检查是否为对象
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return { valid: false, error: 'INVALID_FORMAT' };
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
 * 默认头部操作配置（与 Vben Admin 保持一致）
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
