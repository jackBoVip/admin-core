/**
 * Tab 内容配置
 * @description 定义各 Tab 的控件配置，Vue/React 可共享此配置进行渲染
 */

import type { Preferences } from '../types';
import type { LocaleMessages } from '../locales';

/**
 * 控件类型
 */
export type ControlType = 'switch' | 'select' | 'color' | 'slider' | 'layout-picker';

/**
 * 开关控件配置
 */
export interface SwitchControlConfig {
  type: 'switch';
  /** 本地化键路径，如 'general.dynamicTitle' */
  labelKey: string;
  /** 偏好设置路径，如 'app.dynamicTitle' */
  preferencePath: string;
  /** 禁用条件（可选） */
  disabledWhen?: (preferences: Preferences) => boolean;
}

/**
 * 选择控件配置
 */
export interface SelectControlConfig {
  type: 'select';
  /** 本地化键路径 */
  labelKey: string;
  /** 偏好设置路径 */
  preferencePath: string;
  /** 选项来源：静态数组或需要翻译的常量名 */
  optionsSource: 'static' | 'translated' | 'locales';
  /** 静态选项或常量名 */
  options?: Array<{ label: string; value: string | number }> | string;
  /** 禁用条件（可选） */
  disabledWhen?: (preferences: Preferences) => boolean;
}

/**
 * 区块配置
 */
export interface BlockConfig {
  /** 标题本地化键路径 */
  titleKey: string;
  /** 控件列表 */
  controls: Array<SwitchControlConfig | SelectControlConfig>;
}

/**
 * Tab 配置
 */
export interface TabConfig {
  /** Tab ID */
  id: string;
  /** 区块列表 */
  blocks: BlockConfig[];
}

// ========== 通用设置 Tab 配置 ==========
export const GENERAL_TAB_CONFIG: TabConfig = {
  id: 'general',
  blocks: [
    {
      titleKey: 'general.title',
      controls: [
        {
          type: 'select',
          labelKey: 'general.language',
          preferencePath: 'app.locale',
          optionsSource: 'locales',
        },
        {
          type: 'switch',
          labelKey: 'general.dynamicTitle',
          preferencePath: 'app.dynamicTitle',
        },
        {
          type: 'switch',
          labelKey: 'general.watermark',
          preferencePath: 'app.watermark',
        },
        {
          type: 'switch',
          labelKey: 'general.colorWeakMode',
          preferencePath: 'app.colorWeakMode',
        },
        {
          type: 'switch',
          labelKey: 'general.colorGrayMode',
          preferencePath: 'app.colorGrayMode',
        },
      ],
    },
    {
      titleKey: 'transition.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'transition.enable',
          preferencePath: 'transition.enable',
        },
        {
          type: 'switch',
          labelKey: 'transition.progress',
          preferencePath: 'transition.progress',
        },
        {
          type: 'select',
          labelKey: 'transition.name',
          preferencePath: 'transition.name',
          optionsSource: 'translated',
          options: 'PAGE_TRANSITION_OPTIONS',
        },
      ],
    },
    {
      titleKey: 'widget.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'widget.fullscreen',
          preferencePath: 'widget.fullscreen',
        },
        {
          type: 'switch',
          labelKey: 'widget.themeToggle',
          preferencePath: 'widget.themeToggle',
        },
        {
          type: 'switch',
          labelKey: 'widget.languageToggle',
          preferencePath: 'widget.languageToggle',
        },
      ],
    },
  ],
};

// ========== 快捷键 Tab 配置 ==========
export const SHORTCUT_KEYS_TAB_CONFIG: TabConfig = {
  id: 'shortcutKeys',
  blocks: [
    {
      titleKey: 'shortcutKeys.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'shortcutKeys.enable',
          preferencePath: 'shortcutKeys.enable',
        },
        {
          type: 'switch',
          labelKey: 'shortcutKeys.globalSearch',
          preferencePath: 'shortcutKeys.globalSearch',
          disabledWhen: (p) => !p.shortcutKeys.enable,
        },
        {
          type: 'switch',
          labelKey: 'shortcutKeys.globalLockScreen',
          preferencePath: 'shortcutKeys.globalLockScreen',
          disabledWhen: (p) => !p.shortcutKeys.enable,
        },
      ],
    },
  ],
};

// ========== 布局 Tab 配置 ==========
export const LAYOUT_TAB_CONFIG: TabConfig = {
  id: 'layout',
  blocks: [
    {
      titleKey: 'sidebar.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'sidebar.collapsed',
          preferencePath: 'sidebar.collapsed',
        },
        {
          type: 'switch',
          labelKey: 'sidebar.collapsedButton',
          preferencePath: 'sidebar.collapsedShowTitle',
        },
        {
          type: 'switch',
          labelKey: 'sidebar.expandOnHover',
          preferencePath: 'sidebar.expandOnHover',
        },
      ],
    },
    {
      titleKey: 'header.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'header.enable',
          preferencePath: 'header.enable',
        },
        {
          type: 'select',
          labelKey: 'header.mode',
          preferencePath: 'header.mode',
          optionsSource: 'translated',
          options: 'HEADER_MODE_OPTIONS',
        },
      ],
    },
    {
      titleKey: 'tabbar.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'tabbar.enable',
          preferencePath: 'tabbar.enable',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.showIcon',
          preferencePath: 'tabbar.showIcon',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.draggable',
          preferencePath: 'tabbar.draggable',
        },
        {
          type: 'select',
          labelKey: 'tabbar.styleType',
          preferencePath: 'tabbar.styleType',
          optionsSource: 'translated',
          options: 'TABS_STYLE_OPTIONS',
        },
      ],
    },
    {
      titleKey: 'breadcrumb.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'breadcrumb.enable',
          preferencePath: 'breadcrumb.enable',
        },
        {
          type: 'switch',
          labelKey: 'breadcrumb.showIcon',
          preferencePath: 'breadcrumb.showIcon',
        },
      ],
    },
    {
      titleKey: 'footer.title',
      controls: [
        {
          type: 'switch',
          labelKey: 'footer.enable',
          preferencePath: 'footer.enable',
        },
        {
          type: 'switch',
          labelKey: 'footer.fixed',
          preferencePath: 'footer.fixed',
        },
      ],
    },
  ],
};

// ========== 工具函数 ==========

/**
 * 从嵌套路径获取值
 * @param obj - 对象
 * @param path - 路径，如 'app.locale'
 */
export function getNestedValue<T>(obj: Record<string, unknown>, path: string): T {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined as T;
    }
  }

  return current as T;
}

/**
 * 从本地化键获取文本
 * @param locale - 语言包
 * @param key - 键路径，如 'general.title'
 */
export function getLocaleText(locale: LocaleMessages, key: string): string {
  const parts = key.split('.');
  let current: unknown = locale;

  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return key;
    }
  }

  return typeof current === 'string' ? current : key;
}

/**
 * 创建偏好设置更新对象
 * @param path - 路径，如 'app.locale'
 * @param value - 新值
 */
export function createPreferencesUpdate(path: string, value: unknown): Record<string, unknown> {
  const parts = path.split('.');
  const result: Record<string, unknown> = {};
  let current = result;

  for (let i = 0; i < parts.length - 1; i++) {
    current[parts[i]] = {};
    current = current[parts[i]] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}
