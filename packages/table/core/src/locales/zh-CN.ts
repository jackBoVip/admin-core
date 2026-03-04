/**
 * Table Core 简体中文语言包定义。
 * @description 提供表格列设置、分页、查询、导出等模块的默认中文文案。
 */
import type { TableLocaleMessages } from '../types';

/**
 * 表格模块简体中文语言包。
 */
export const zhCN: TableLocaleMessages = {
  table: {
    /** 列设置入口文案。 */
    custom: '列设置',
    /** 全选列文案。 */
    customAll: '全部',
    /** 取消文案。 */
    customCancel: '取消',
    /** 确认文案。 */
    customConfirm: '确认',
    /** 筛选文案。 */
    customFilter: '筛选',
    /** 固定左侧文案。 */
    customFixedLeft: '固定到左侧',
    /** 固定右侧文案。 */
    customFixedRight: '固定到右侧',
    /** 取消固定文案。 */
    customFixedUnset: '取消固定',
    /** 下移文案。 */
    customMoveDown: '下移',
    /** 上移/拖拽排序文案。 */
    customMoveUp: '拖拽排序',
    /** 恢复默认文案。 */
    customReset: '恢复默认',
    /** 恢复默认确认提示。 */
    customRestoreConfirm: '请确认是否恢复成默认列配置？',
    /** 排序文案。 */
    customSort: '排序',
    /** 空值占位文案。 */
    emptyValue: '空值',
    /** 导出文案。 */
    export: '导出',
    /** 导出全部文案。 */
    exportAll: '导出全部',
    /** 缺少导出全部处理器提示。 */
    exportAllMissingHandler: '请配置导出全部接口（pagerConfig.exportConfig.exportAll）',
    /** 导出当前页文案。 */
    exportCurrentPage: '导出当前页',
    /** 导出已选文案。 */
    exportSelected: '导出已选择',
    /** 隐藏查询面板文案。 */
    hideSearchPanel: '隐藏搜索面板',
    /** 无数据文案。 */
    noData: '暂无数据',
    /** 操作列标题。 */
    operation: '操作',
    /** 分页首页文案。 */
    pagerFirstPage: '首页',
    /** 分页末页文案。 */
    pagerLastPage: '末页',
    /** 分页总数文案。 */
    pagerTotal: '共 {total} 条记录',
    /** 刷新文案。 */
    refresh: '刷新',
    /** 序号列标题。 */
    seq: '序号',
    /** 搜索按钮文案。 */
    search: '搜索',
    /** 显示查询面板文案。 */
    showSearchPanel: '显示搜索面板',
    /** 全屏文案。 */
    zoomIn: '全屏',
    /** 还原文案。 */
    zoomOut: '还原',
  },
};
