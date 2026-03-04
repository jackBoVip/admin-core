/**
 * Page Core 简体中文语言包定义。
 * @description 提供页面容器及查询表格相关的默认中文文案。
 */
import type { PageLocaleMessages } from '../types';

/**
 * 简体中文语言包。
 */
export const zhCN: PageLocaleMessages = {
  page: {
    /** 空页面提示。 */
    empty: '暂无页面',
    /** 路由页未命中提示。 */
    noMatchRoute: '未配置路由页面渲染内容',
    /** 切换到固定模式文案。 */
    queryTableSwitchToFixed: '切换为固定模式',
    /** 切换到流式模式文案。 */
    queryTableSwitchToFlow: '切换为滚动模式',
    /** 未命名页面标题前缀。 */
    untitled: '未命名页面',
  },
};
