/**
 * Page 查询表格布局常量。
 * @description 定义固定/流式模式切换、滚动锁定及工具栏文案所需的标识值。
 */
/** 固定模式下表格容器锁定滚动时使用的 class。 */
export const PAGE_QUERY_FIXED_TABLE_CLASS = 'admin-table--lock-body-scroll';
/** 页面滚动锁定标记属性。 */
export const PAGE_SCROLL_LOCK_ATTR = 'data-admin-page-query-table-scroll-lock';
/** 布局切换工具栏按钮编码。 */
export const PAGE_QUERY_LAYOUT_TOOL_CODE = 'layout-mode-toggle';
/** 切换为固定模式时使用的图标。 */
export const PAGE_QUERY_LAYOUT_FIXED_ICON = 'vxe-table-icon-fixed-left-fill';
/** 切换为流式模式时使用的图标。 */
export const PAGE_QUERY_LAYOUT_FLOW_ICON = 'vxe-table-icon-fixed-left';
/** 布局切换按钮默认文案。 */
export const PAGE_QUERY_LAYOUT_SWITCH_DEFAULT_TITLES = {
  /** 切换到固定布局时的提示文案。 */
  toFixed: 'Switch to fixed mode',
  /** 切换到流式布局时的提示文案。 */
  toFlow: 'Switch to flow mode',
} as const;
/** 固定高度计算时预留的安全间距（px）。 */
export const PAGE_QUERY_FIXED_HEIGHT_SAFE_GAP = 2;
