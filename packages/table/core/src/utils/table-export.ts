import type {
  AdminTablePagerExportPayload,
  TablePagerExportConfig,
  TablePagerExportOption,
  TablePagerExportRule,
  TablePagerExportType,
} from '../types';
import type {
  ExportTableRowsToExcelOptions,
  ResolveTableExportColumnsOptions,
  ResolvedTablePagerExportAction,
  ResolvedTablePagerExportConfig,
  TableColumnRecord,
  TableExportColumn,
  TableToolbarLocaleText,
} from './table-contracts';
import {
  getColumnValueByPath,
  resolveColumnKey,
  resolveColumnTitle,
  resolveColumnType,
} from './table-columns';
import {
  isTableNonEmptyString,
  isTablePlainObject,
  normalizeToolbarPermissionDirective,
} from './table-permission';

function normalizePagerExportType(value: unknown): TablePagerExportType | undefined {
  const source = typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
  if (source === 'all' || source === 'current' || source === 'selected') {
    return source;
  }
  return undefined;
}

function resolvePagerExportTitle(
  type: TablePagerExportType,
  localeText: Pick<
    TableToolbarLocaleText,
    'exportAll' | 'exportCurrentPage' | 'exportSelected'
  >,
  source?: Record<string, any>
) {
  if (isTableNonEmptyString(source?.title)) {
    return source.title.trim();
  }
  if (isTableNonEmptyString(source?.label)) {
    return source.label.trim();
  }
  if (isTableNonEmptyString(source?.name)) {
    return source.name.trim();
  }
  if (type === 'all') {
    return localeText.exportAll;
  }
  if (type === 'selected') {
    return localeText.exportSelected;
  }
  return localeText.exportCurrentPage;
}

function resolveTablePagerExportRule(
  rule: TablePagerExportRule | undefined,
  fallback: boolean,
  context: {
    action: TablePagerExportOption;
    index: number;
  }
) {
  if (typeof rule === 'boolean') {
    return rule;
  }
  if (typeof rule === 'function') {
    try {
      return !!rule(context);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function normalizePagerExportFileName(value: unknown) {
  return isTableNonEmptyString(value) ? value.trim() : undefined;
}

function normalizePagerExportActionOption<
  TData extends Record<string, any> = Record<string, any>,
>(
  rawOption: TablePagerExportOption<TData> | TablePagerExportType,
  index: number,
  localeText: Pick<
    TableToolbarLocaleText,
    'exportAll' | 'exportCurrentPage' | 'exportSelected'
  >,
) {
  const sourceOption = isTableNonEmptyString(rawOption)
    ? ({ type: rawOption.trim().toLowerCase() } as TablePagerExportOption<TData>)
    : (isTablePlainObject(rawOption) ? rawOption as TablePagerExportOption<TData> : null);
  if (!sourceOption) {
    return undefined;
  }

  const sourceRecord = sourceOption as Record<string, any>;
  const type = normalizePagerExportType(sourceOption.type ?? sourceOption.code);
  if (!type) {
    return undefined;
  }

  const context = {
    action: sourceOption as TablePagerExportOption,
    index,
  };
  if (!resolveTablePagerExportRule(sourceOption.show, true, context)) {
    return undefined;
  }

  const title = resolvePagerExportTitle(type, localeText, sourceRecord);
  const permission = normalizeToolbarPermissionDirective(sourceOption.permission);
  const disabled = resolveTablePagerExportRule(
    sourceOption.disabled,
    false,
    context
  );

  return {
    ...sourceOption,
    disabled,
    fileName: normalizePagerExportFileName(sourceOption.fileName),
    index,
    permission,
    title,
    type,
  } as ResolvedTablePagerExportAction<TData>;
}

export function resolveTablePagerExportConfig<
  TData extends Record<string, any> = Record<string, any>,
>(
  source:
    | boolean
    | null
    | TablePagerExportConfig<TData>
    | undefined,
  localeText: Pick<
    TableToolbarLocaleText,
    | 'export'
    | 'exportAll'
    | 'exportCurrentPage'
    | 'exportSelected'
  >
): ResolvedTablePagerExportConfig<TData> | undefined {
  if (source === undefined || source === null || source === false) {
    return undefined;
  }

  const config = source === true
    ? {}
    : (isTablePlainObject(source) ? source as TablePagerExportConfig<TData> : {});
  if (config.enabled === false) {
    return undefined;
  }

  const rawOptions = Array.isArray(config.options)
    ? config.options
    : ['current'];
  const options = rawOptions
    .map((item, index) =>
      normalizePagerExportActionOption<TData>(
        item as TablePagerExportOption<TData> | TablePagerExportType,
        index,
        localeText
      )
    )
    .filter((item): item is ResolvedTablePagerExportAction<TData> => !!item);

  if (options.length <= 0) {
    return undefined;
  }

  return {
    enabled: true,
    exportAll: typeof config.exportAll === 'function' ? config.exportAll : undefined,
    fileName: normalizePagerExportFileName(config.fileName),
    icon: isTableNonEmptyString(config.icon)
      ? config.icon.trim()
      : 'admin-table-icon-export',
    options,
    title: isTableNonEmptyString(config.title)
      ? config.title.trim()
      : localeText.export,
  };
}

export function normalizeTableExportFileName(
  value: unknown,
  fallback = 'table-export'
) {
  const input = isTableNonEmptyString(value) ? value.trim() : '';
  const normalized = (input || fallback).replace(/[\\/:*?"<>|]+/g, '-').trim();
  const next = normalized || fallback;
  return /\.(xlsx?|csv)$/i.test(next) ? next : `${next}.xls`;
}

function normalizeTableExportField(column: TableColumnRecord) {
  const dataIndex = column.dataIndex;
  if (Array.isArray(dataIndex)) {
    const path = dataIndex
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0)
      .join('.');
    if (path) {
      return path;
    }
  }
  if (isTableNonEmptyString(dataIndex)) {
    return dataIndex.trim();
  }
  if (isTableNonEmptyString(column.field)) {
    return column.field.trim();
  }
  return undefined;
}

function isOperationExportColumn(column: TableColumnRecord) {
  if (resolveColumnType(column) === 'operation') {
    return true;
  }
  const key = String(column.key ?? '').trim();
  if (
    key === '__admin-table-operation' ||
    key === '__admin_table_operation'
  ) {
    return true;
  }
  return false;
}

export function resolveTableExportColumns<
  TData extends Record<string, any> = Record<string, any>,
>(
  columns: TableColumnRecord[] = [],
  options: ResolveTableExportColumnsOptions = {}
) {
  const includeHidden = options.includeHidden === true;
  const includeOperation = options.includeOperation === true;
  const includeSelection = options.includeSelection === true;
  const seqStart = Number.isFinite(options.seqStart)
    ? Math.max(0, Number(options.seqStart))
    : 0;
  const source = Array.isArray(columns) ? columns : [];

  const resolved: Array<TableExportColumn<TData>> = [];
  source.forEach((column, sourceIndex) => {
    const item = (column ?? {}) as TableColumnRecord;
    const type = resolveColumnType(item);
    if (!includeSelection && (type === 'checkbox' || type === 'radio')) {
      return;
    }
    if (!includeOperation && isOperationExportColumn(item)) {
      return;
    }
    if (!includeHidden && (item.hidden === true || item.visible === false)) {
      return;
    }

    const key = resolveColumnKey(item, sourceIndex);
    const title = resolveColumnTitle(item, sourceIndex);
    if (type === 'seq') {
      resolved.push({
        key,
        title,
        valueGetter: (_row, rowIndex) => seqStart + rowIndex + 1,
      });
      return;
    }

    const field = normalizeTableExportField(item);
    resolved.push({
      key,
      title,
      valueGetter: (row) =>
        field
          ? getColumnValueByPath(row as Record<string, any>, field)
          : (row as Record<string, any>)?.[key],
    });
  });
  return resolved;
}

function sanitizeTableExportCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

function escapeTableExportHTML(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function resolveTableExportCellValue(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function exportTableRowsToExcel<
  TData extends Record<string, any> = Record<string, any>,
>(
  options: ExportTableRowsToExcelOptions<TData>
) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false;
  }
  const columns = Array.isArray(options.columns) ? options.columns : [];
  const rows = Array.isArray(options.rows) ? options.rows : [];
  if (columns.length <= 0) {
    return false;
  }

  const headerHTML = columns
    .map((column) => `<th>${escapeTableExportHTML(column.title)}</th>`)
    .join('');
  const bodyHTML = rows
    .map((row, rowIndex) =>
      `<tr>${columns
        .map((column) => {
          const sourceValue = column.valueGetter(row, rowIndex);
          const value = sanitizeTableExportCell(
            resolveTableExportCellValue(sourceValue)
          );
          return `<td>${escapeTableExportHTML(value)}</td>`;
        })
        .join('')}</tr>`
    )
    .join('');

  const sheetName = escapeTableExportHTML(
    isTableNonEmptyString(options.sheetName) ? options.sheetName.trim() : 'Sheet1'
  );
  const html = `<!doctype html><html><head><meta charset="UTF-8"/><meta name="ProgId" content="Excel.Sheet"/><meta name="Generator" content="Admin Table"/></head><body><table data-sheet-name="${sheetName}"><thead><tr>${headerHTML}</tr></thead><tbody>${bodyHTML}</tbody></table></body></html>`;
  const blob = new Blob([`\uFEFF${html}`], {
    type: 'application/vnd.ms-excel;charset=utf-8',
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = normalizeTableExportFileName(options.fileName);
  link.style.display = 'none';
  document.body.append(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
  return true;
}

export function createPagerExportEventPayload(
  payload: {
    code: TablePagerExportType;
    currentPage: number;
    fileName: string;
    pageSize: number;
    source: 'react' | 'vue';
    total?: number;
  }
): AdminTablePagerExportPayload {
  return {
    code: payload.code,
    currentPage: payload.currentPage,
    fileName: payload.fileName,
    pageSize: payload.pageSize,
    source: payload.source,
    total: payload.total,
  };
}
