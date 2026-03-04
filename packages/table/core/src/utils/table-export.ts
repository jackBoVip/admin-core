/**
 * Table Core 导出工具。
 * @description 提供导出动作解析、列提取与 Excel 数据生成相关能力。
 */
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

/**
 * 规范化分页导出类型值。
 * @param value 原始类型值。
 * @returns 有效导出类型；无效时返回 `undefined`。
 */
function normalizePagerExportType(value: unknown): TablePagerExportType | undefined {
  const source = typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
  if (source === 'all' || source === 'current' || source === 'selected') {
    return source;
  }
  return undefined;
}

/**
 * 解析分页导出动作标题。
 * 优先级：`title > label > name > 本地化默认文案`。
 * @param type 导出类型。
 * @param localeText 本地化文案。
 * @param source 动作配置对象。
 * @returns 最终标题。
 */
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

/**
 * 执行分页导出规则判定。
 * 支持布尔值或函数规则，函数异常时回退到默认值。
 * @param rule 规则定义。
 * @param fallback 默认值。
 * @param context 规则上下文。
 * @returns 判定结果。
 */
function resolveTablePagerExportRule(
  rule: TablePagerExportRule | undefined,
  fallback: boolean,
  context: {
    /** 当前导出动作配置。 */
    action: TablePagerExportOption;
    /** 索引。 */
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

/**
 * 规范化分页导出文件名字段。
 * @param value 原始文件名。
 * @returns 去空格后的文件名；无效时返回 `undefined`。
 */
function normalizePagerExportFileName(value: unknown) {
  return isTableNonEmptyString(value) ? value.trim() : undefined;
}

/**
 * 规范化单个分页导出动作配置。
 * @template TData 行数据类型。
 * @param rawOption 原始动作配置或动作类型字符串。
 * @param index 动作索引。
 * @param localeText 本地化文案。
 * @returns 标准化动作；不可用时返回 `undefined`。
 */
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

/**
 * 解析分页导出总配置。
 * 支持布尔开关与对象配置，内部会标准化动作列表并补齐默认图标和标题。
 * @template TData 行数据类型。
 * @param source 原始分页导出配置。
 * @param localeText 本地化文案。
 * @returns 标准化导出配置；禁用或无可用动作时返回 `undefined`。
 */
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

/**
 * 规范化导出文件名。
 * 会替换非法文件名字符，并确保带有导出后缀。
 * @param value 原始文件名。
 * @param fallback 兜底文件名。
 * @returns 最终可用于下载的文件名。
 */
export function normalizeTableExportFileName(
  value: unknown,
  fallback = 'table-export'
) {
  const input = isTableNonEmptyString(value) ? value.trim() : '';
  const normalized = (input || fallback).replace(/[\\/:*?"<>|]+/g, '-').trim();
  const next = normalized || fallback;
  return /\.(xlsx?|csv)$/i.test(next) ? next : `${next}.xls`;
}

/**
 * 解析导出字段路径。
 * 优先使用 `dataIndex`，其次使用 `field`。
 * @param column 列配置。
 * @returns 字段路径；未配置时返回 `undefined`。
 */
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

/**
 * 判断列是否为操作列。
 * @param column 列配置。
 * @returns 命中操作列时返回 `true`。
 */
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

/**
 * 解析导出列定义。
 * 可按选项过滤隐藏列、选择列、操作列，并支持序号列起始偏移。
 * @template TData 行数据类型。
 * @param columns 表格列配置数组。
 * @param options 导出列解析选项。
 * @returns 导出列定义数组。
 */
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

/**
 * 处理导出单元格值，防止公式注入。
 * @param value 单元格文本值。
 * @returns 处理后的安全文本。
 */
function sanitizeTableExportCell(value: string) {
  return /^[=+\-@]/.test(value) ? `'${value}` : value;
}

/**
 * 转义 HTML 特殊字符。
 * @param value 原始文本。
 * @returns HTML 安全文本。
 */
function escapeTableExportHTML(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

/**
 * 将任意值转换为可导出的字符串。
 * @param value 原始值。
 * @returns 导出字符串值。
 */
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

/**
 * 使用 HTML Table + Blob 方式导出 Excel 文件。
 * @template TData 行数据类型。
 * @param options 导出参数。
 * @returns 导出是否执行成功。
 */
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

/**
 * 创建分页导出事件载荷。
 * @param payload 载荷输入参数。
 * @returns 标准化后的分页导出事件对象。
 */
export function createPagerExportEventPayload(
  payload: {
    /** 导出动作编码。 */
    code: TablePagerExportType;
    /** 当前页码。 */
    currentPage: number;
    /** 导出文件名。 */
    fileName: string;
    /** 每页条数。 */
    pageSize: number;
    /** 调用来源。 */
    source: 'react' | 'vue';
    /** 总条数。 */
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
