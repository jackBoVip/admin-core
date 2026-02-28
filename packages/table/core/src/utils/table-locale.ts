import type {
  SupportedLocale,
  TableFormatter,
  TableLocaleMessages,
  ToolbarConfig,
} from '../types';
import type { TableToolbarLocaleText } from './table-contracts';
import { zhCN } from '../locales/zh-CN';
import { isTableNonEmptyString } from './table-permission';

export interface BuiltinToolbarTool {
  code: 'custom' | 'refresh' | 'zoom';
  title: string;
}

export interface ResolvedToolbarCustomConfig {
  enabled: boolean;
}

const defaultTableToolbarLocaleText: TableToolbarLocaleText = zhCN.table;

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
