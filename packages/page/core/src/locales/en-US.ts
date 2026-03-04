/**
 * Page Core 英文语言包定义。
 * @description 提供页面容器及查询表格相关的默认英文文案。
 */
import type { PageLocaleMessages } from '../types';

/**
 * 英文语言包。
 */
export const enUS: PageLocaleMessages = {
  page: {
    /** 空页面提示。 */
    empty: 'No pages',
    /** 路由页未命中提示。 */
    noMatchRoute: 'No route page renderer is configured',
    /** 切换到固定模式文案。 */
    queryTableSwitchToFixed: 'Switch to fixed mode',
    /** 切换到流式模式文案。 */
    queryTableSwitchToFlow: 'Switch to flow mode',
    /** 未命名页面标题前缀。 */
    untitled: 'Untitled page',
  },
};
