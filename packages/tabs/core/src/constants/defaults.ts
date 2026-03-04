/**
 * Tabs Core 默认常量。
 * @description 汇总 Tabs 组件在未显式传参时使用的标准化默认配置。
 */
import type { NormalizedAdminTabsOptions } from '../types';

/**
 * Tabs Core 默认配置。
 * @description 当调用方未传入特定参数时，所有适配层将回退到该标准化默认值。
 */
export const DEFAULT_ADMIN_TABS_OPTIONS: NormalizedAdminTabsOptions = {
  align: 'left',
  contentInsetTop: 0,
  enabled: true,
  hideWhenSingle: true,
  sticky: true,
  stickyTop: 0,
};
