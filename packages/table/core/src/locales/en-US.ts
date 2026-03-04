/**
 * Table Core 英文语言包定义。
 * @description 提供表格列设置、分页、查询、导出等模块的默认英文文案。
 */
import type { TableLocaleMessages } from '../types';

/**
 * 表格模块英文语言包。
 */
export const enUS: TableLocaleMessages = {
  table: {
    /** 列设置入口文案。 */
    custom: 'Columns',
    /** 全选列文案。 */
    customAll: 'All',
    /** 取消文案。 */
    customCancel: 'Cancel',
    /** 确认文案。 */
    customConfirm: 'Confirm',
    /** 筛选文案。 */
    customFilter: 'Filter',
    /** 固定左侧文案。 */
    customFixedLeft: 'Fixed Left',
    /** 固定右侧文案。 */
    customFixedRight: 'Fixed Right',
    /** 取消固定文案。 */
    customFixedUnset: 'Unfixed',
    /** 下移文案。 */
    customMoveDown: 'Move Down',
    /** 上移/拖拽排序文案。 */
    customMoveUp: 'Drag Sort',
    /** 恢复默认文案。 */
    customReset: 'Restore Default',
    /** 恢复默认确认提示。 */
    customRestoreConfirm: 'Restore default column settings?',
    /** 排序文案。 */
    customSort: 'Sort',
    /** 空值占位文案。 */
    emptyValue: '(Empty)',
    /** 导出文案。 */
    export: 'Export',
    /** 导出全部文案。 */
    exportAll: 'Export All',
    /** 缺少导出全部处理器提示。 */
    exportAllMissingHandler: 'Please configure pagerConfig.exportConfig.exportAll',
    /** 导出当前页文案。 */
    exportCurrentPage: 'Export Current Page',
    /** 导出已选文案。 */
    exportSelected: 'Export Selected',
    /** 隐藏查询面板文案。 */
    hideSearchPanel: 'Hide Search Panel',
    /** 无数据文案。 */
    noData: 'No Data',
    /** 操作列标题。 */
    operation: 'Actions',
    /** 分页首页文案。 */
    pagerFirstPage: 'First Page',
    /** 分页末页文案。 */
    pagerLastPage: 'Last Page',
    /** 分页总数文案。 */
    pagerTotal: 'Total {total} items',
    /** 刷新文案。 */
    refresh: 'Refresh',
    /** 序号列标题。 */
    seq: 'No.',
    /** 搜索按钮文案。 */
    search: 'Search',
    /** 显示查询面板文案。 */
    showSearchPanel: 'Show Search Panel',
    /** 全屏文案。 */
    zoomIn: 'Fullscreen',
    /** 还原文案。 */
    zoomOut: 'Restore',
  },
};
