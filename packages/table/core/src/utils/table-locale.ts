import type {
  SupportedLocale,
  TableFormatter,
  TableLocaleMessages,
  ToolbarConfig,
} from '../types';
import type { TableToolbarLocaleText } from './table-contracts';
import { isTableNonEmptyString } from './table-permission';

export interface BuiltinToolbarTool {
  code: 'custom' | 'refresh' | 'zoom';
  title: string;
}

export interface ResolvedToolbarCustomConfig {
  enabled: boolean;
}

const defaultTableToolbarLocaleText: TableToolbarLocaleText = {
  custom: '列设置',
  customAll: '全部',
  customCancel: '取消',
  customConfirm: '确认',
  customFilter: '筛选',
  customFixedLeft: '固定到左侧',
  customFixedRight: '固定到右侧',
  customFixedUnset: '取消固定',
  customMoveDown: '下移',
  customMoveUp: '拖拽排序',
  customReset: '恢复默认',
  customRestoreConfirm: '请确认是否恢复成默认列配置？',
  customSort: '排序',
  emptyValue: '空值',
  export: '导出',
  exportAll: '导出全部',
  exportAllMissingHandler: '请配置导出全部接口（pagerConfig.exportConfig.exportAll）',
  exportCurrentPage: '导出当前页',
  exportSelected: '导出已选择',
  hideSearchPanel: '隐藏搜索面板',
  noData: '暂无数据',
  operation: '操作',
  pagerFirstPage: '首页',
  pagerLastPage: '末页',
  pagerTotal: '共 {total} 条记录',
  refresh: '刷新',
  seq: '序号',
  search: '搜索',
  showSearchPanel: '显示搜索面板',
  zoomIn: '全屏',
  zoomOut: '还原',
};

export type TableDateFormatter = Record<string, TableFormatter> & {
  formatDate: TableFormatter;
  formatDateTime: TableFormatter;
};

function normalizeLocaleTextValue(value: unknown, fallback: string) {
  return isTableNonEmptyString(value) ? value : fallback;
}

export function normalizeTableLocale(
  value: null | string | undefined,
  fallback: SupportedLocale = 'zh-CN'
): SupportedLocale {
  if (value === 'en-US' || value === 'zh-CN') {
    return value;
  }
  return fallback;
}

export function createTableDateFormatter(
  dateLocale: SupportedLocale
): TableDateFormatter {
  return {
    formatDate(value: any) {
      if (value === undefined || value === null || value === '') return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString(dateLocale);
    },
    formatDateTime(value: any) {
      if (value === undefined || value === null || value === '') return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString(dateLocale);
    },
  };
}

export function resolveToolbarCustomConfig(
  toolbarConfig?: ToolbarConfig
): ResolvedToolbarCustomConfig | undefined {
  const custom = toolbarConfig?.custom;
  if (custom === undefined || custom === null) {
    return undefined;
  }
  return {
    enabled: custom !== false,
  };
}

export function isToolbarCustomEnabled(toolbarConfig?: ToolbarConfig) {
  const customConfig = resolveToolbarCustomConfig(toolbarConfig);
  if (!customConfig) {
    return false;
  }
  return customConfig.enabled !== false;
}

export function createTableLocaleText(
  messages?: Partial<TableLocaleMessages['table']>
): TableToolbarLocaleText {
  const source = messages ?? {};
  return {
    custom: normalizeLocaleTextValue(source.custom, defaultTableToolbarLocaleText.custom),
    customAll: normalizeLocaleTextValue(source.customAll, defaultTableToolbarLocaleText.customAll),
    customCancel: normalizeLocaleTextValue(source.customCancel, defaultTableToolbarLocaleText.customCancel),
    customConfirm: normalizeLocaleTextValue(source.customConfirm, defaultTableToolbarLocaleText.customConfirm),
    customFilter: normalizeLocaleTextValue(source.customFilter, defaultTableToolbarLocaleText.customFilter),
    customFixedLeft: normalizeLocaleTextValue(source.customFixedLeft, defaultTableToolbarLocaleText.customFixedLeft),
    customFixedRight: normalizeLocaleTextValue(source.customFixedRight, defaultTableToolbarLocaleText.customFixedRight),
    customFixedUnset: normalizeLocaleTextValue(source.customFixedUnset, defaultTableToolbarLocaleText.customFixedUnset),
    customMoveDown: normalizeLocaleTextValue(source.customMoveDown, defaultTableToolbarLocaleText.customMoveDown),
    customMoveUp: normalizeLocaleTextValue(source.customMoveUp, defaultTableToolbarLocaleText.customMoveUp),
    customReset: normalizeLocaleTextValue(source.customReset, defaultTableToolbarLocaleText.customReset),
    customRestoreConfirm: normalizeLocaleTextValue(
      source.customRestoreConfirm,
      defaultTableToolbarLocaleText.customRestoreConfirm
    ),
    customSort: normalizeLocaleTextValue(source.customSort, defaultTableToolbarLocaleText.customSort),
    emptyValue: normalizeLocaleTextValue(source.emptyValue, defaultTableToolbarLocaleText.emptyValue),
    export: normalizeLocaleTextValue(source.export, defaultTableToolbarLocaleText.export),
    exportAll: normalizeLocaleTextValue(source.exportAll, defaultTableToolbarLocaleText.exportAll),
    exportAllMissingHandler: normalizeLocaleTextValue(
      source.exportAllMissingHandler,
      defaultTableToolbarLocaleText.exportAllMissingHandler
    ),
    exportCurrentPage: normalizeLocaleTextValue(
      source.exportCurrentPage,
      defaultTableToolbarLocaleText.exportCurrentPage
    ),
    exportSelected: normalizeLocaleTextValue(
      source.exportSelected,
      defaultTableToolbarLocaleText.exportSelected
    ),
    hideSearchPanel: normalizeLocaleTextValue(source.hideSearchPanel, defaultTableToolbarLocaleText.hideSearchPanel),
    noData: normalizeLocaleTextValue(source.noData, defaultTableToolbarLocaleText.noData),
    operation: normalizeLocaleTextValue(source.operation, defaultTableToolbarLocaleText.operation),
    pagerFirstPage: normalizeLocaleTextValue(
      source.pagerFirstPage,
      defaultTableToolbarLocaleText.pagerFirstPage
    ),
    pagerLastPage: normalizeLocaleTextValue(
      source.pagerLastPage,
      defaultTableToolbarLocaleText.pagerLastPage
    ),
    pagerTotal: normalizeLocaleTextValue(
      source.pagerTotal,
      defaultTableToolbarLocaleText.pagerTotal
    ),
    refresh: normalizeLocaleTextValue(source.refresh, defaultTableToolbarLocaleText.refresh),
    seq: normalizeLocaleTextValue(source.seq, defaultTableToolbarLocaleText.seq),
    search: normalizeLocaleTextValue(source.search, defaultTableToolbarLocaleText.search),
    showSearchPanel: normalizeLocaleTextValue(source.showSearchPanel, defaultTableToolbarLocaleText.showSearchPanel),
    zoomIn: normalizeLocaleTextValue(source.zoomIn, defaultTableToolbarLocaleText.zoomIn),
    zoomOut: normalizeLocaleTextValue(source.zoomOut, defaultTableToolbarLocaleText.zoomOut),
  };
}

export function getSearchPanelToggleTitle(
  showSearchForm: boolean | undefined,
  localeText: Pick<TableToolbarLocaleText, 'hideSearchPanel' | 'showSearchPanel'>
) {
  return showSearchForm === false
    ? localeText.showSearchPanel
    : localeText.hideSearchPanel;
}

export function buildBuiltinToolbarTools(
  toolbarConfig: ToolbarConfig | undefined,
  localeText: Pick<TableToolbarLocaleText, 'custom' | 'refresh' | 'zoomIn' | 'zoomOut'>,
  options: {
    hasToolbarToolsSlot?: boolean;
    maximized?: boolean;
  } = {}
): BuiltinToolbarTool[] {
  if (options.hasToolbarToolsSlot) {
    return [];
  }
  const tools: BuiltinToolbarTool[] = [];
  if (toolbarConfig?.refresh) {
    tools.push({ code: 'refresh', title: localeText.refresh });
  }
  if (toolbarConfig?.zoom) {
    tools.push({
      code: 'zoom',
      title: options.maximized ? localeText.zoomOut : localeText.zoomIn,
    });
  }
  if (isToolbarCustomEnabled(toolbarConfig)) {
    tools.push({ code: 'custom', title: localeText.custom });
  }
  return tools;
}
