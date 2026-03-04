/**
 * 支持的语言标识。
 * @description 目前内置中文与英文两种语言包。
 */
export type SupportedLocale = 'en-US' | 'zh-CN';

/**
 * 表格国际化文案结构。
 * @description 统一覆盖工具栏、分页、列自定义和导出等场景文案。
 */
export interface TableLocaleMessages {
  /** 表格模块文案。 */
  table: {
    /** 列自定义入口文案。 */
    custom: string;
    /** 全选文案。 */
    customAll: string;
    /** 取消文案。 */
    customCancel: string;
    /** 确认文案。 */
    customConfirm: string;
    /** 筛选文案。 */
    customFilter: string;
    /** 固定到左侧文案。 */
    customFixedLeft: string;
    /** 固定到右侧文案。 */
    customFixedRight: string;
    /** 取消固定文案。 */
    customFixedUnset: string;
    /** 下移文案。 */
    customMoveDown: string;
    /** 上移文案。 */
    customMoveUp: string;
    /** 重置文案。 */
    customReset: string;
    /** 恢复确认文案。 */
    customRestoreConfirm: string;
    /** 排序文案。 */
    customSort: string;
    /** 空值占位文案。 */
    emptyValue: string;
    /** 导出入口文案。 */
    export: string;
    /** 导出全部文案。 */
    exportAll: string;
    /** 缺少全量导出处理器提示文案。 */
    exportAllMissingHandler: string;
    /** 导出当前页文案。 */
    exportCurrentPage: string;
    /** 导出选中文案。 */
    exportSelected: string;
    /** 收起查询面板文案。 */
    hideSearchPanel: string;
    /** 空数据文案。 */
    noData: string;
    /** 操作列文案。 */
    operation: string;
    /** 分页首页文案。 */
    pagerFirstPage: string;
    /** 分页末页文案。 */
    pagerLastPage: string;
    /** 分页总数文案。 */
    pagerTotal: string;
    /** 刷新文案。 */
    refresh: string;
    /** 序号列文案。 */
    seq: string;
    /** 查询文案。 */
    search: string;
    /** 展开查询面板文案。 */
    showSearchPanel: string;
    /** 放大文案。 */
    zoomIn: string;
    /** 缩小文案。 */
    zoomOut: string;
  };
}
