/**
 * Table Core 工具栏语言工具。
 * @description 负责工具栏内置动作文案解析与格式化器本地化选择。
 */
import type {
  SupportedLocale,
  TableFormatter,
  TableLocaleMessages,
  ToolbarConfig,
} from '../types';
import type { TableToolbarLocaleText } from './table-contracts';
import { zhCN } from '../locales/zh-CN';
import { isTableNonEmptyString } from './table-permission';

/**
 * 内置工具栏按钮定义。
 */
export interface BuiltinToolbarTool {
  /** 内置按钮编码。 */
  code: 'custom' | 'refresh' | 'zoom';
  /** 按钮提示文案。 */
  title: string;
}

/**
 * 列自定义面板配置解析结果。
 */
export interface ResolvedToolbarCustomConfig {
  /** 是否启用列自定义功能。 */
  enabled: boolean;
}

/**
 * 构建内置工具栏按钮时的运行时选项。
 */
export interface BuildBuiltinToolbarToolsOptions {
  /** 是否存在工具栏工具插槽。 */
  hasToolbarToolsSlot?: boolean;
  /** 当前表格是否处于最大化。 */
  maximized?: boolean;
}

const defaultTableToolbarLocaleText: TableToolbarLocaleText = zhCN.table;

/**
 * 表格日期格式化器集合。
 */
export type TableDateFormatter = Record<string, TableFormatter> & {
  /** 日期格式化函数。 */
  formatDate: TableFormatter;
  /** 日期时间格式化函数。 */
  formatDateTime: TableFormatter;
};

/**
 * 规范化本地化文案值。
 * 当输入为空字符串或非法值时回退到默认文案。
 * @param value 原始文案值。
 * @param fallback 兜底文案。
 * @returns 可用的最终文案。
 */
function normalizeLocaleTextValue(value: unknown, fallback: string) {
  return isTableNonEmptyString(value) ? value : fallback;
}

/**
 * 规范化表格语言标识。
 * 仅支持 `zh-CN` 和 `en-US`，其余值回退到默认语言。
 * @param value 原始语言标识。
 * @param fallback 默认语言。
 * @returns 标准化后的语言标识。
 */
export function normalizeTableLocale(
  value: null | string | undefined,
  fallback: SupportedLocale = 'zh-CN'
): SupportedLocale {
  if (value === 'en-US' || value === 'zh-CN') {
    return value;
  }
  return fallback;
}

/**
 * 创建基于指定语言的日期格式化器。
 * @param dateLocale 目标语言。
 * @returns 包含日期和日期时间格式化函数的对象。
 */
export function createTableDateFormatter(
  dateLocale: SupportedLocale
): TableDateFormatter {
  return {
    /**
     * 格式化日期值。
     * @param value 原始日期值。
     * @returns 日期字符串；无效值返回空字符串或原值字符串。
     */
    formatDate(value: any) {
      if (value === undefined || value === null || value === '') return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleDateString(dateLocale);
    },
    /**
     * 格式化日期时间值。
     * @param value 原始日期时间值。
     * @returns 日期时间字符串；无效值返回空字符串或原值字符串。
     */
    formatDateTime(value: any) {
      if (value === undefined || value === null || value === '') return '';
      const date = new Date(value);
      return Number.isNaN(date.getTime())
        ? String(value)
        : date.toLocaleString(dateLocale);
    },
  };
}

/**
 * 解析工具栏列自定义配置。
 * @param toolbarConfig 工具栏配置。
 * @returns 标准化结果；未配置时返回 `undefined`。
 */
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

/**
 * 判断列自定义功能是否启用。
 * @param toolbarConfig 工具栏配置。
 * @returns 启用时返回 `true`。
 */
export function isToolbarCustomEnabled(toolbarConfig?: ToolbarConfig) {
  const customConfig = resolveToolbarCustomConfig(toolbarConfig);
  if (!customConfig) {
    return false;
  }
  return customConfig.enabled !== false;
}

/**
 * 创建完整表格文案对象。
 * 会将传入的局部文案与内置中文文案合并，缺失字段自动回退默认值。
 * @param messages 局部表格文案配置。
 * @returns 完整可用的表格文案集合。
 */
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

/**
 * 获取查询面板展开/收起按钮文案。
 * @param showSearchForm 当前是否显示查询面板。
 * @param localeText 文案来源。
 * @returns 切换按钮应显示的标题文本。
 */
export function getSearchPanelToggleTitle(
  showSearchForm: boolean | undefined,
  localeText: Pick<TableToolbarLocaleText, 'hideSearchPanel' | 'showSearchPanel'>
) {
  return showSearchForm === false
    ? localeText.showSearchPanel
    : localeText.hideSearchPanel;
}

/**
 * 构建内置工具栏按钮列表。
 * 顺序为：刷新、缩放、列自定义。存在自定义插槽时不生成内置按钮。
 * @param toolbarConfig 工具栏配置。
 * @param localeText 按钮文案集合。
 * @param options 运行时构建选项。
 * @returns 内置按钮数组。
 */
export function buildBuiltinToolbarTools(
  toolbarConfig: ToolbarConfig | undefined,
  localeText: Pick<TableToolbarLocaleText, 'custom' | 'refresh' | 'zoomIn' | 'zoomOut'>,
  options: BuildBuiltinToolbarToolsOptions = {}
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
