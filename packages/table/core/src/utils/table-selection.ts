import { getLocaleMessages } from '../locales';
import type {
  TableColumnFixedValue,
  TableOperationColumnConfig,
  TableSeqColumnConfig,
  ToolbarConfig,
} from '../types';
import type {
  TableColumnRecord,
  TableToolbarLocaleText,
} from './table-contracts';
import {
  getColumnValueByPath,
  resolveColumnType,
  setColumnValueByPath,
} from './table-columns';
import {
  isTableNonEmptyString,
  isTablePlainObject,
} from './table-permission';

const defaultSeqTitle = '序号';

export type TableSelectionMode = 'checkbox' | 'radio';

export interface ResolvedTableSeqColumnConfig {
  align: string;
  fixed?: TableColumnFixedValue;
  key?: string;
  title?: string;
  width: number | string;
}

export interface ResolveSeqColumnConfigOptions {
  title?: string;
}

export interface EnsureSelectionColumnOptions {
  align?: string;
  checkboxWidth?: number | string;
  key?: string;
  radioWidth?: number | string;
  title?: string;
}

export interface ResolvedOperationColumnConfig {
  align: string;
  attrs?: Record<string, any>;
  fixed?: TableColumnFixedValue;
  key: string;
  title: string;
  width: number | string;
}

export interface ApplySelectionCheckFieldToRowsOptions {
  checkField: string;
  childrenField?: string;
  keyField: string;
  selectedKeys: unknown[];
}

export function isSeqColumnTypeColumn(
  column: TableColumnRecord | null | undefined
) {
  return resolveColumnType(column) === 'seq';
}

export function resolveSeqColumn(columns: TableColumnRecord[] = []) {
  return columns.find((column) => isSeqColumnTypeColumn(column));
}

export function resolveSeqColumnConfig(
  value?: boolean | TableSeqColumnConfig | null,
  options: ResolveSeqColumnConfigOptions = {}
): ResolvedTableSeqColumnConfig | undefined {
  if (value === false || value === null || value === undefined) {
    return undefined;
  }

  let rawConfig: TableSeqColumnConfig | undefined;
  if (isTablePlainObject(value)) {
    rawConfig = value;
  }
  if (rawConfig?.enabled === false) {
    return undefined;
  }

  const localeSeqTitle = getLocaleMessages()?.table?.seq;
  const fallbackTitle = isTableNonEmptyString(options.title)
    ? options.title.trim()
    : isTableNonEmptyString(localeSeqTitle)
      ? localeSeqTitle.trim()
      : defaultSeqTitle;

  return {
    align: isTableNonEmptyString(rawConfig?.align)
      ? rawConfig.align.trim()
      : 'center',
    fixed: rawConfig?.fixed === 'left' || rawConfig?.fixed === 'right'
      ? rawConfig.fixed
      : undefined,
    key: isTableNonEmptyString(rawConfig?.key)
      ? rawConfig.key.trim()
      : undefined,
    title: isTableNonEmptyString(rawConfig?.title)
      ? rawConfig.title.trim()
      : fallbackTitle,
    width: rawConfig?.width ?? 60,
  };
}

export function ensureSeqColumn(
  columns: TableColumnRecord[] = [],
  seqColumn?: boolean | TableSeqColumnConfig | null,
  options: ResolveSeqColumnConfigOptions = {}
) {
  const sourceColumns = Array.isArray(columns) ? columns : [];
  const config = resolveSeqColumnConfig(seqColumn, options);
  if (!config || resolveSeqColumn(sourceColumns)) {
    return sourceColumns;
  }

  const nextColumn: TableColumnRecord = {
    align: config.align,
    key: config.key ?? '__admin-table-auto-seq',
    title: config.title,
    type: 'seq',
    width: config.width,
  };
  if (config.fixed) {
    nextColumn.fixed = config.fixed;
  }
  return [nextColumn, ...sourceColumns];
}

export function isSelectionColumnTypeColumn(
  column: TableColumnRecord | null | undefined,
  mode?: TableSelectionMode
) {
  const type = resolveColumnType(column);
  if (mode) {
    return type === mode;
  }
  return type === 'checkbox' || type === 'radio';
}

export function resolveSelectionColumn(
  columns: TableColumnRecord[] = [],
  mode?: TableSelectionMode
) {
  return columns.find((column) => isSelectionColumnTypeColumn(column, mode));
}

export function resolveSelectionMode(
  gridOptions?: Record<string, any>,
  columns: TableColumnRecord[] = []
): TableSelectionMode | undefined {
  const explicitType =
    gridOptions?.rowSelection?.type ?? gridOptions?.selectionType;
  if (explicitType === 'checkbox' || explicitType === 'radio') {
    return explicitType;
  }
  if (gridOptions?.radioConfig) {
    return 'radio';
  }
  if (gridOptions?.checkboxConfig) {
    return 'checkbox';
  }
  const selectionColumn = resolveSelectionColumn(columns);
  return isSelectionColumnTypeColumn(selectionColumn)
    ? (resolveColumnType(selectionColumn) as TableSelectionMode)
    : undefined;
}

export function ensureSelectionColumn(
  columns: TableColumnRecord[] = [],
  mode?: TableSelectionMode,
  options: EnsureSelectionColumnOptions = {}
) {
  const sourceColumns = Array.isArray(columns) ? columns : [];
  if (!mode || resolveSelectionColumn(sourceColumns)) {
    return sourceColumns;
  }
  const align = isTableNonEmptyString(options.align)
    ? options.align.trim()
    : 'center';
  const nextColumn: TableColumnRecord = {
    align,
    type: mode,
    width: mode === 'radio'
      ? (options.radioWidth ?? 64)
      : (options.checkboxWidth ?? 72),
  };
  if (isTableNonEmptyString(options.key)) {
    nextColumn.key = options.key.trim();
  }
  if (isTableNonEmptyString(options.title)) {
    nextColumn.title = options.title.trim();
  }
  return [nextColumn, ...sourceColumns];
}

export function flattenTableRows<T extends Record<string, any>>(rows: T[]) {
  const result: T[] = [];
  const walk = (list: T[]) => {
    list.forEach((row) => {
      result.push(row);
      const children = (row as Record<string, any>).children;
      if (Array.isArray(children) && children.length > 0) {
        walk(children as T[]);
      }
    });
  };
  walk(Array.isArray(rows) ? rows : []);
  return result;
}

export function normalizeTableSelectionKeys<TKey = string | number>(
  keys: unknown,
  mode: TableSelectionMode
) {
  const unique = Array.from(new Set(Array.isArray(keys) ? keys : []));
  if (mode === 'radio') {
    return unique.slice(0, 1) as TKey[];
  }
  return unique as TKey[];
}

export function toTableComparableSelectionKey(key: unknown) {
  if (key === null || key === undefined) {
    return null;
  }
  return typeof key === 'string' ||
    typeof key === 'number' ||
    typeof key === 'bigint'
    ? String(key)
    : null;
}

export function createTableComparableSelectionKeySet(
  keys: unknown[] | undefined
) {
  const set = new Set<string>();
  (Array.isArray(keys) ? keys : []).forEach((key) => {
    const comparable = toTableComparableSelectionKey(key);
    if (comparable !== null) {
      set.add(comparable);
    }
  });
  return set;
}

export function collectSelectionKeysByField<
  TRow extends Record<string, any>,
  TKey = string | number
>(
  rows: TRow[],
  options: {
    checkField: null | string | undefined;
    keyField: string;
    mode: TableSelectionMode;
  }
) {
  const checkField = isTableNonEmptyString(options.checkField)
    ? options.checkField.trim()
    : '';
  if (!checkField) {
    return [] as TKey[];
  }
  const keyField = isTableNonEmptyString(options.keyField)
    ? options.keyField.trim()
    : 'id';
  const keys = (Array.isArray(rows) ? rows : [])
    .filter((row) => !!getColumnValueByPath(row, checkField))
    .map((row) => row?.[keyField])
    .filter((key) => key !== null && key !== undefined) as TKey[];
  return normalizeTableSelectionKeys<TKey>(keys, options.mode);
}

export function collectSelectionKeysByRows<
  TRow extends Record<string, any>,
  TKey = string | number
>(
  rows: TRow[],
  options: {
    keyField: string;
    mode?: TableSelectionMode;
  }
) {
  const keyField = isTableNonEmptyString(options.keyField)
    ? options.keyField.trim()
    : 'id';
  const keys = flattenTableRows(Array.isArray(rows) ? rows : [])
    .map((row) => row?.[keyField])
    .filter((key) => key !== null && key !== undefined) as TKey[];
  if (options.mode) {
    return normalizeTableSelectionKeys<TKey>(keys, options.mode);
  }
  return keys;
}

export function resolveSelectionRowsByKeys<
  TRow extends Record<string, any>
>(
  rows: TRow[],
  options: {
    keyField: string;
    selectedKeys: unknown[] | undefined;
  }
) {
  const keyField = isTableNonEmptyString(options.keyField)
    ? options.keyField.trim()
    : 'id';
  const keySet = createTableComparableSelectionKeySet(options.selectedKeys);
  if (keySet.size <= 0) {
    return [] as TRow[];
  }
  return flattenTableRows(Array.isArray(rows) ? rows : []).filter((row) =>
    keySet.has(toTableComparableSelectionKey(row?.[keyField]) ?? '')
  );
}

export function alignSelectionKeysToRows<
  TRow extends Record<string, any>,
  TKey = string | number
>(
  keys: TKey[],
  rows: TRow[],
  keyField: string
) {
  const normalizedKeyField = isTableNonEmptyString(keyField)
    ? keyField.trim()
    : 'id';
  const comparableKeyMap = new Map<string, TKey>();
  flattenTableRows(rows).forEach((row) => {
    const rowKey = row?.[normalizedKeyField] as TKey | null | undefined;
    const comparable = toTableComparableSelectionKey(rowKey);
    if (comparable !== null && !comparableKeyMap.has(comparable)) {
      comparableKeyMap.set(comparable, rowKey as TKey);
    }
  });
  const aligned: TKey[] = [];
  const seen = new Set<string>();
  (Array.isArray(keys) ? keys : []).forEach((key) => {
    const comparable = toTableComparableSelectionKey(key);
    if (comparable === null || seen.has(comparable)) {
      return;
    }
    seen.add(comparable);
    aligned.push(comparableKeyMap.get(comparable) ?? key);
  });
  return aligned;
}

export function resolveRowClickSelectionKeys<TKey = string | number>(
  options: {
    currentKeys: TKey[];
    mode: TableSelectionMode;
    rowKey: null | TKey | undefined;
    strict?: boolean;
  }
) {
  const comparableRowKey = toTableComparableSelectionKey(options.rowKey);
  if (comparableRowKey === null || options.rowKey === null || options.rowKey === undefined) {
    return undefined;
  }
  const currentSet = createTableComparableSelectionKeySet(options.currentKeys);
  if (options.mode === 'radio') {
    const shouldClear =
      options.strict === false && currentSet.has(comparableRowKey);
    return shouldClear
      ? ([] as TKey[])
      : ([options.rowKey] as TKey[]);
  }
  const keyMap = new Map<string, TKey>();
  (Array.isArray(options.currentKeys) ? options.currentKeys : []).forEach((key) => {
    const comparable = toTableComparableSelectionKey(key);
    if (comparable !== null && !keyMap.has(comparable)) {
      keyMap.set(comparable, key);
    }
  });
  if (keyMap.has(comparableRowKey)) {
    keyMap.delete(comparableRowKey);
  } else {
    keyMap.set(comparableRowKey, options.rowKey);
  }
  return Array.from(keyMap.values());
}

export function resolveOperationColumnConfig(
  operationColumn: boolean | TableOperationColumnConfig | null | undefined,
  localeText: Pick<TableToolbarLocaleText, 'operation'>
): ResolvedOperationColumnConfig | undefined {
  if (operationColumn === undefined || operationColumn === null || operationColumn === false) {
    return undefined;
  }
  const config = operationColumn === true
    ? {}
    : (isTablePlainObject(operationColumn) ? operationColumn : {});
  if (config.enabled === false) {
    return undefined;
  }
  const key = isTableNonEmptyString(config.key)
    ? config.key.trim()
    : '__admin-table-operation';
  const title = isTableNonEmptyString(config.title)
    ? config.title.trim()
    : localeText.operation;
  const align = isTableNonEmptyString(config.align)
    ? config.align.trim()
    : 'center';
  const fixed = config.fixed === 'left' || config.fixed === 'right'
    ? config.fixed
    : 'right';
  const width = config.width ?? 200;
  const attrs = isTablePlainObject(config.attrs) ? { ...config.attrs } : undefined;

  return {
    align,
    attrs,
    fixed,
    key,
    title,
    width,
  };
}

export function resolveOperationColumnTools(
  operationColumn: boolean | TableOperationColumnConfig | null | undefined
): ToolbarConfig['tools'] {
  if (!isTablePlainObject(operationColumn)) {
    return [];
  }
  return Array.isArray(operationColumn.tools)
    ? operationColumn.tools
    : [];
}

export function resolveOperationCellAlignClass(
  align: null | string | undefined
): 'is-center' | 'is-left' | 'is-right' {
  if (align === 'left') {
    return 'is-left';
  }
  if (align === 'right') {
    return 'is-right';
  }
  return 'is-center';
}

export function applySelectionCheckFieldToRows<
  TRow extends Record<string, any> = Record<string, any>,
>(
  rows: TRow[] | undefined,
  options: ApplySelectionCheckFieldToRowsOptions
): {
  changed: boolean;
  rows: TRow[];
} {
  const sourceRows = Array.isArray(rows) ? rows : [];
  const checkField = isTableNonEmptyString(options.checkField)
    ? options.checkField.trim()
    : '';
  const keyField = isTableNonEmptyString(options.keyField)
    ? options.keyField.trim()
    : '';
  const childrenField = isTableNonEmptyString(options.childrenField)
    ? options.childrenField.trim()
    : 'children';
  if (!checkField || !keyField || sourceRows.length <= 0) {
    return {
      changed: false,
      rows: sourceRows,
    };
  }

  const keySet = new Set(
    (Array.isArray(options.selectedKeys) ? options.selectedKeys : [])
      .map((key) =>
        typeof key === 'number' || typeof key === 'string'
          ? String(key)
          : ''
      )
      .filter((key) => key.length > 0)
  );

  const walk = (list: TRow[]): { changed: boolean; rows: TRow[] } => {
    let changed = false;
    const nextRows = list.map((row) => {
      const sourceRow = (row ?? {}) as Record<string, any>;
      const rowKey = sourceRow[keyField];
      const checked =
        (typeof rowKey === 'number' || typeof rowKey === 'string') &&
        keySet.has(String(rowKey));
      const current = !!getColumnValueByPath(sourceRow, checkField);
      const children = Array.isArray(sourceRow[childrenField])
        ? (sourceRow[childrenField] as TRow[])
        : undefined;
      const nextChildren = children
        ? walk(children)
        : undefined;
      const hasChildChanged = !!nextChildren?.changed;

      if (current === checked && !hasChildChanged) {
        return row;
      }

      const nextRow: Record<string, any> = {
        ...sourceRow,
      };
      setColumnValueByPath(nextRow, checkField, checked);
      if (hasChildChanged) {
        nextRow[childrenField] = nextChildren?.rows ?? [];
      }
      changed = true;
      return nextRow as TRow;
    });
    return {
      changed,
      rows: changed ? nextRows : list,
    };
  };

  return walk(sourceRows);
}
