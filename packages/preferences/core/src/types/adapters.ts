/**
 * 适配器相关类型定义
 */

import type { DeepPartial, I18nAdapter, StorageAdapter } from './utils';
import type { Preferences } from './preferences';

/**
 * DOM 选择器配置
 * @description 用于定位需要应用样式的 DOM 元素
 */
export interface DOMSelectors {
  /** 侧边栏选择器，默认 '.admin-sidebar' */
  sidebar?: string;
  /** 顶栏选择器，默认 '.admin-header' */
  header?: string;
}

/**
 * 偏好设置初始化选项
 */
export interface PreferencesInitOptions {
  /** 命名空间，用于隔离不同应用的配置 */
  namespace: string;
  /** 覆盖默认配置 */
  overrides?: DeepPartial<Preferences>;
  /** 自定义存储适配器 */
  storage?: StorageAdapter;
  /** 自定义国际化适配器 */
  i18n?: I18nAdapter;
  /** DOM 选择器配置 */
  selectors?: DOMSelectors;
}
