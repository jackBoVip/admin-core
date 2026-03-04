/**
 * Page Core 默认配置常量。
 * @description 汇总页面滚动、查询联动与页面容器初始状态的默认值。
 */
import type {
  AdminPageOptions,
  NormalizedPageFormTableBridgeOptions,
  NormalizedPageScrollOptions,
} from '../types';

/**
 * 页面滚动默认配置。
 */
export const DEFAULT_SCROLL_OPTIONS: NormalizedPageScrollOptions = {
  /** 是否启用容器滚动。 */
  enabled: true,
  /** 横向滚动策略。 */
  x: 'hidden',
  /** 纵向滚动策略。 */
  y: 'auto',
};

/**
 * 查询表单与表格联动默认配置。
 */
export const DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS: NormalizedPageFormTableBridgeOptions =
  {
    /** 是否启用查询表单与表格联动。 */
    enabled: true,
    /** 提交查询时是否触发表格查询。 */
    queryOnSubmit: true,
    /** 重置查询时是否自动刷新表格。 */
    reloadOnReset: true,
  };

/**
 * 创建页面默认配置。
 * @returns 默认页面配置。
 */
export function createDefaultPageOptions<TComponent = unknown>(): AdminPageOptions<TComponent> {
  return {
    /** 当前激活页签 key。 */
    activeKey: null,
    /** 切换页签时是否保留非激活页。 */
    keepInactivePages: false,
    /** 页面项配置列表。 */
    pages: [],
    /** 路由适配器实例。 */
    router: undefined,
    /** 页面滚动配置。 */
    scroll: { ...DEFAULT_SCROLL_OPTIONS },
  };
}
