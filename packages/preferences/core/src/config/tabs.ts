/**
 * Tab 内容配置
 * @description 定义各 Tab 的控件配置，Vue/React 可共享此配置进行渲染
 */

import { get } from '../utils/helpers';
import type { LocaleMessages } from '../locales';
import type { Preferences } from '../types';

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
          labelKey: 'widget.globalSearch',
          preferencePath: 'widget.globalSearch',
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
          disabledWhen: (p) => p.app.layout === 'header-nav',
        },
        {
          type: 'switch',
          labelKey: 'sidebar.collapsedButton',
          preferencePath: 'sidebar.collapsedShowTitle',
          disabledWhen: (p) => p.app.layout === 'header-nav',
        },
        {
          type: 'switch',
          labelKey: 'sidebar.expandOnHover',
          preferencePath: 'sidebar.expandOnHover',
          disabledWhen: (p) => p.app.layout === 'header-nav',
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
          labelKey: 'tabbar.persist',
          preferencePath: 'tabbar.persist',
        },
        {
          type: 'select',
          labelKey: 'tabbar.maxCount',
          preferencePath: 'tabbar.maxCount',
          optionsSource: 'static',
          options: [
            { label: '0', value: 0 },
            { label: '10', value: 10 },
            { label: '20', value: 20 },
            { label: '30', value: 30 },
          ],
        },
        {
          type: 'switch',
          labelKey: 'tabbar.draggable',
          preferencePath: 'tabbar.draggable',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.wheelable',
          preferencePath: 'tabbar.wheelable',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.middleClickClose',
          preferencePath: 'tabbar.middleClickToClose',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.showIcon',
          preferencePath: 'tabbar.showIcon',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.showMore',
          preferencePath: 'tabbar.showMore',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.showMaximize',
          preferencePath: 'tabbar.showMaximize',
        },
        {
          type: 'switch',
          labelKey: 'tabbar.keepAlive',
          preferencePath: 'tabbar.keepAlive',
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
          disabledWhen: (p) => p.app.layout === 'header-nav',
        },
        {
          type: 'switch',
          labelKey: 'breadcrumb.showIcon',
          preferencePath: 'breadcrumb.showIcon',
          disabledWhen: (p) => p.app.layout === 'header-nav',
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
 * 从嵌套路径获取值（使用 helpers.get 统一实现）
 * @param obj - 对象
 * @param path - 路径，如 'app.locale'
 */
export function getNestedValue<T>(obj: Record<string, unknown>, path: string): T {
  return get<T>(obj, path);
}

/**
 * 从本地化键获取文本（使用 helpers.get 统一实现）
 * @param locale - 语言包
 * @param key - 键路径，如 'general.title'
 */
export function getLocaleText(locale: LocaleMessages, key: string): string {
  const result = get<string>(locale, key, key);
  return typeof result === 'string' ? result : key;
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
