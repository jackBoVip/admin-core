import type {
  ColumnCustomAction,
  ColumnCustomChangePayload,
  ColumnCustomPersistenceConfig,
  ColumnCustomSnapshot,
  ColumnCustomState,
  SeparatorOptions,
  TableCellStrategy,
  TableCellStrategyContext,
  TableCellStrategyRule,
  SupportedLocale,
  TableColumnFixedValue,
  TableFormatter,
  TableLocaleMessages,
  TableOperationColumnConfig,
  TableRowStrategy,
  TableRowStrategyContext,
  TableSeqColumnConfig,
  TableStrategyCondition,
  TableStrategyConfig,
  TableStrategyContextBase,
  TableStrategyResolver,
  TableStrategyStyle,
  TableStrategyWhen,
  ToolbarConfig,
  ToolbarHintAlign,
  ToolbarHintConfig,
  ToolbarHintOverflow,
  ToolbarInlinePosition,
  ToolbarToolConfig,
  ToolbarToolPermissionDirective,
  ToolbarToolRule,
  ToolbarToolRuleContext,
  ToolbarToolsSlotPosition,
} from '../types';
import { getLocaleMessages } from '../locales';

export type TableColumnRecord = Record<string, any>;

export type ColumnCustomDragPosition = 'bottom' | 'top';
export type TableSelectionMode = 'checkbox' | 'radio';

export interface ColumnCustomDragState {
  dragKey: null | string;
  overKey: null | string;
  position: ColumnCustomDragPosition | null;
}

export interface ColumnCustomDragHoverState {
  overKey: null | string;
  position: ColumnCustomDragPosition | null;
}

export interface ColumnCustomControlItem {
  checked: boolean;
  filterable: boolean;
  fixed: TableColumnFixedValue;
  key: string;
  orderIndex: number;
  sortable: boolean;
  title: string;
}

export interface ColumnRuntimeItem {
  column: TableColumnRecord;
  filterable: boolean;
  fixed: TableColumnFixedValue;
  key: string;
  sortable: boolean;
  sourceIndex: number;
  visible: boolean;
}

export interface ColumnCustomFlipRect {
  top: number;
}

export interface ColumnCustomFlipOffset {
  deltaY: number;
  key: string;
}

export type ColumnCustomSnapshotSource = Partial<ColumnCustomSnapshot>;

export interface TableDefaultFilterOption {
  key: string;
  label: string;
  value: string;
}

export interface TableToolbarLocaleText {
  custom: string;
  customAll: string;
  customCancel: string;
  customConfirm: string;
  customFilter: string;
  customFixedLeft: string;
  customFixedRight: string;
  customFixedUnset: string;
  customMoveDown: string;
  customMoveUp: string;
  customReset: string;
  customRestoreConfirm: string;
  customSort: string;
  emptyValue: string;
  hideSearchPanel: string;
  noData: string;
  operation: string;
  refresh: string;
  seq: string;
  search: string;
  showSearchPanel: string;
  zoomIn: string;
  zoomOut: string;
}

export interface BuiltinToolbarTool {
  code: 'custom' | 'refresh' | 'zoom';
  title: string;
}

export interface ResolvedOperationColumnConfig {
  align: string;
  attrs?: Record<string, any>;
  fixed?: TableColumnFixedValue;
  key: string;
  title: string;
  width: number | string;
}

export type ResolvedToolbarInlinePosition = 'after' | 'before';

export type ResolvedToolbarToolsSlotPosition =
  | ResolvedToolbarInlinePosition
  | 'replace';

export interface ToolbarActionEventPayload {
  code?: string;
  tool?: Record<string, any>;
}

export interface ToolbarOperationEventPayload extends ToolbarActionEventPayload {
  row?: Record<string, any>;
  rowIndex?: number;
}

export interface ToolbarActionToolPayload extends ToolbarActionEventPayload {
  index: number;
}

export interface ToolbarOperationToolPayload extends ToolbarOperationEventPayload {
  index: number;
}

export interface ResolvedToolbarActionTool extends ToolbarToolConfig {
  disabled: boolean;
  index: number;
  permission?: ToolbarToolPermissionDirective;
  text?: string;
  title: string;
}

export interface ResolvedToolbarActionPresentation {
  hasIcon: boolean;
  iconClass?: string;
  iconOnly: boolean;
  text: string;
}

export interface ResolvedToolbarActionButtonClassState {
  classList: string[];
  presentation: ResolvedToolbarActionPresentation;
}

export interface ResolvedToolbarActionButtonRenderState
  extends ResolvedToolbarActionButtonClassState {
  attrs: Record<string, any>;
  disabled: boolean;
  key: string;
  title?: string;
}

export type ToolbarAccessValueSource =
  | null
  | string
  | string[]
  | (() => null | string | string[] | undefined)
  | undefined;

export interface ToolbarPermissionResolveOptions {
  accessCodes?: ToolbarAccessValueSource;
  accessRoles?: ToolbarAccessValueSource;
  defaultWhenNoAccess?: boolean;
}

export interface ToolbarToolRenderOptions
  extends ToolbarPermissionResolveOptions {
  permissionChecker?: (
    permission: ToolbarToolPermissionDirective,
    tool: Record<string, any>
  ) => boolean;
}

export interface ToolbarToolVisibilityOptions
  extends ToolbarToolRenderOptions {
  directiveRenderer?: (tool: Record<string, any>) => boolean;
  useDirectiveWhenNoAccess?: boolean;
}

export interface ResolvedToolbarCustomConfig {
  enabled: boolean;
}

export interface ResolvedToolbarHintConfig {
  align: ToolbarHintAlign;
  color?: string;
  fontSize?: string;
  overflow: ToolbarHintOverflow;
  speed: number;
  text: string;
}

export interface ResolvedColumnCustomPersistenceConfig {
  enabled: boolean;
  key: string;
  storage: 'local' | 'session';
}

export interface ResolvedTableCellStrategyResult {
  className: string;
  clickable: boolean;
  displayValue: any;
  hasDisplayOverride: boolean;
  onClick?: (ctx: TableCellStrategyContext, event?: unknown) => any;
  stopPropagation: boolean;
  style?: Record<string, any>;
  value: any;
}

export interface ResolvedTableRowStrategyResult {
  className: string;
  clickable: boolean;
  onClick?: (ctx: TableRowStrategyContext, event?: unknown) => any;
  stopPropagation: boolean;
  style?: Record<string, any>;
}

export interface TriggerTableStrategyClickResult {
  blocked: boolean;
  handled: boolean;
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
  hideSearchPanel: '隐藏搜索面板',
  noData: '暂无数据',
  operation: '操作',
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function normalizeLocaleTextValue(value: unknown, fallback: string) {
  return isNonEmptyString(value) ? value : fallback;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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

function getColumnPersistenceSignature(columns: TableColumnRecord[] = []) {
  if (!Array.isArray(columns) || columns.length <= 0) {
    return 'empty';
  }
  return columns
    .map((column, index) => resolveColumnKey(column, index))
    .join('|');
}

function getPathnameForPersistence() {
  if (typeof window === 'undefined') {
    return 'server';
  }
  return window.location?.pathname || 'browser';
}

function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

function buildColumnCustomPersistenceKey(columns?: TableColumnRecord[]) {
  const source = `${getPathnameForPersistence()}::${getColumnPersistenceSignature(columns)}`;
  return `admin-table:column-custom:${hashString(source)}`;
}

function resolveColumnCustomPersistenceStorage(
  value: unknown
): 'local' | 'session' {
  return value === 'session' ? 'session' : 'local';
}

export function resolveColumnCustomPersistenceConfig(
  gridOptions?: Record<string, any>,
  columns?: TableColumnRecord[]
): ResolvedColumnCustomPersistenceConfig | undefined {
  if (!isPlainObject(gridOptions)) {
    return undefined;
  }
  const raw = gridOptions.columnCustomPersistence;
  if (raw === undefined || raw === null || raw === false) {
    return undefined;
  }

  let rawConfig: ColumnCustomPersistenceConfig | null = null;
  if (isPlainObject(raw)) {
    rawConfig = raw as ColumnCustomPersistenceConfig;
  }

  const enabled = rawConfig ? rawConfig.enabled !== false : true;
  if (!enabled) {
    return undefined;
  }

  const key = isNonEmptyString(rawConfig?.key)
    ? rawConfig?.key
    : buildColumnCustomPersistenceKey(columns);
  const storage = resolveColumnCustomPersistenceStorage(rawConfig?.storage);

  return {
    enabled: true,
    key,
    storage,
  };
}

function getColumnCustomStateStorage(
  config?: ResolvedColumnCustomPersistenceConfig
) {
  if (!config || typeof window === 'undefined') {
    return null;
  }
  try {
    return config.storage === 'session'
      ? window.sessionStorage
      : window.localStorage;
  } catch {
    return null;
  }
}

export function resolveColumnCustomState(
  gridOptions?: Record<string, any>
): ColumnCustomState | undefined {
  if (!isPlainObject(gridOptions)) {
    return undefined;
  }
  if (isPlainObject(gridOptions.columnCustomState)) {
    return gridOptions.columnCustomState as ColumnCustomState;
  }
  return undefined;
}

export function readColumnCustomStateFromStorage(
  config?: ResolvedColumnCustomPersistenceConfig
): ColumnCustomState | undefined {
  const storage = getColumnCustomStateStorage(config);
  if (!storage || !config?.enabled) {
    return undefined;
  }
  try {
    const raw = storage.getItem(config.key);
    if (!raw) {
      return undefined;
    }
    const parsed = JSON.parse(raw);
    if (!isPlainObject(parsed)) {
      return undefined;
    }
    return parsed as ColumnCustomState;
  } catch {
    return undefined;
  }
}

export function writeColumnCustomStateToStorage(
  config: ResolvedColumnCustomPersistenceConfig | undefined,
  state: ColumnCustomState
) {
  const storage = getColumnCustomStateStorage(config);
  if (!storage || !config?.enabled) {
    return false;
  }
  try {
    storage.setItem(config.key, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
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
    hideSearchPanel: normalizeLocaleTextValue(source.hideSearchPanel, defaultTableToolbarLocaleText.hideSearchPanel),
    noData: normalizeLocaleTextValue(source.noData, defaultTableToolbarLocaleText.noData),
    operation: normalizeLocaleTextValue(source.operation, defaultTableToolbarLocaleText.operation),
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

export function resolveColumnKey(column: TableColumnRecord, index: number) {
  return String(column.key ?? column.dataIndex ?? column.field ?? `column-${index}`);
}

export function resolveColumnTitle(column: TableColumnRecord, index: number) {
  if (isNonEmptyString(column.title)) {
    return column.title;
  }
  if (isNonEmptyString(column.field)) {
    return column.field;
  }
  if (isNonEmptyString(column.dataIndex)) {
    return column.dataIndex;
  }
  return `Column ${index + 1}`;
}

export function resolveColumnType(
  column: TableColumnRecord | null | undefined
) {
  if (!column || typeof column !== 'object') {
    return '';
  }
  return typeof column.type === 'string'
    ? column.type.trim().toLowerCase()
    : '';
}

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
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    rawConfig = value;
  }
  if (rawConfig?.enabled === false) {
    return undefined;
  }
  const localeSeqTitle = getLocaleMessages()?.table?.seq;
  const fallbackTitle = isNonEmptyString(options.title)
    ? options.title.trim()
    : isNonEmptyString(localeSeqTitle)
      ? localeSeqTitle.trim()
      : defaultTableToolbarLocaleText.seq;

  return {
    align: isNonEmptyString(rawConfig?.align)
      ? rawConfig.align.trim()
      : 'center',
    fixed: rawConfig?.fixed === 'left' || rawConfig?.fixed === 'right'
      ? rawConfig.fixed
      : undefined,
    key: isNonEmptyString(rawConfig?.key)
      ? rawConfig.key.trim()
      : undefined,
    title: isNonEmptyString(rawConfig?.title)
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

export interface EnsureSelectionColumnOptions {
  align?: string;
  checkboxWidth?: number | string;
  key?: string;
  radioWidth?: number | string;
  title?: string;
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
  const align = isNonEmptyString(options.align)
    ? options.align.trim()
    : 'center';
  const nextColumn: TableColumnRecord = {
    align,
    type: mode,
    width: mode === 'radio'
      ? (options.radioWidth ?? 64)
      : (options.checkboxWidth ?? 72),
  };
  if (isNonEmptyString(options.key)) {
    nextColumn.key = options.key.trim();
  }
  if (isNonEmptyString(options.title)) {
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
  const checkField = isNonEmptyString(options.checkField)
    ? options.checkField.trim()
    : '';
  if (!checkField) {
    return [] as TKey[];
  }
  const keyField = isNonEmptyString(options.keyField)
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
  const keyField = isNonEmptyString(options.keyField)
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
  const keyField = isNonEmptyString(options.keyField)
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
  const normalizedKeyField = isNonEmptyString(keyField)
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

export function shallowEqualObjectRecord(
  previous: null | Record<string, any> | undefined,
  next: null | Record<string, any> | undefined
) {
  if (previous === next) {
    return true;
  }
  if (!previous || !next) {
    return false;
  }
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  if (previousKeys.length !== nextKeys.length) {
    return false;
  }
  for (const key of previousKeys) {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      return false;
    }
    if (!Object.is(previous[key], next[key])) {
      return false;
    }
  }
  return true;
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
    : (isPlainObject(operationColumn) ? operationColumn : {});
  if (config.enabled === false) {
    return undefined;
  }
  const key = isNonEmptyString(config.key)
    ? config.key.trim()
    : '__admin-table-operation';
  const title = isNonEmptyString(config.title)
    ? config.title.trim()
    : localeText.operation;
  const align = isNonEmptyString(config.align)
    ? config.align.trim()
    : 'center';
  const fixed = config.fixed === 'left' || config.fixed === 'right'
    ? config.fixed
    : 'right';
  const width = config.width ?? 200;
  const attrs = isPlainObject(config.attrs) ? { ...config.attrs } : undefined;

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
  if (!isPlainObject(operationColumn)) {
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

export function getColumnValueByPath(
  row: Record<string, any> | undefined,
  field?: string
) {
  if (!row || !isNonEmptyString(field)) {
    return undefined;
  }
  if (!field.includes('.')) {
    return row[field];
  }
  return field.split('.').reduce((value: any, key) => value?.[key], row);
}

export function setColumnValueByPath(
  row: Record<string, any> | undefined,
  field: null | string | undefined,
  value: any
) {
  if (!row || !isNonEmptyString(field)) {
    return false;
  }
  if (!field.includes('.')) {
    row[field] = value;
    return true;
  }
  const keys = field.split('.');
  let current: Record<string, any> = row;
  for (let index = 0; index < keys.length - 1; index += 1) {
    const key = keys[index];
    const nextValue = current[key];
    if (!isPlainObject(nextValue)) {
      current[key] = {};
    }
    current = current[key] as Record<string, any>;
  }
  current[keys[keys.length - 1]] = value;
  return true;
}

export interface ApplySelectionCheckFieldToRowsOptions {
  checkField: string;
  childrenField?: string;
  keyField: string;
  selectedKeys: unknown[];
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
  const checkField = isNonEmptyString(options.checkField)
    ? options.checkField.trim()
    : '';
  const keyField = isNonEmptyString(options.keyField)
    ? options.keyField.trim()
    : '';
  const childrenField = isNonEmptyString(options.childrenField)
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

function toArrayValue<T>(value: null | T | T[] | undefined) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [] as T[];
  }
  return [value];
}

function joinClassNames(...values: unknown[]) {
  return values
    .flatMap((value) => String(value ?? '').split(' '))
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .join(' ');
}

function normalizeStyleValue(value: unknown) {
  if (value === undefined || value === null) {
    return undefined;
  }
  if (typeof value === 'number') {
    return `${value}px`;
  }
  if (typeof value === 'string') {
    const next = value.trim();
    return next.length > 0 ? next : undefined;
  }
  return undefined;
}

function mergeTableStrategyStyle(
  base: Record<string, any> | undefined,
  patch: Record<string, any> | undefined
) {
  if (!base && !patch) {
    return undefined;
  }
  return {
    ...(base ?? {}),
    ...(patch ?? {}),
  };
}

function buildTableStrategyStyle(
  source: null | TableStrategyStyle | undefined
) {
  const style = mergeTableStrategyStyle(undefined, source?.style);
  const nextStyle = {
    ...(style ?? {}),
  } as Record<string, any>;
  if (source?.backgroundColor) {
    nextStyle.backgroundColor = source.backgroundColor;
  }
  if (source?.color) {
    nextStyle.color = source.color;
  }
  if (source?.cursor) {
    nextStyle.cursor = source.cursor;
  }
  const fontSize = normalizeStyleValue(source?.fontSize);
  if (fontSize) {
    nextStyle.fontSize = fontSize;
  }
  if (source?.fontWeight !== undefined && source?.fontWeight !== null) {
    nextStyle.fontWeight = source.fontWeight;
  }
  const lineHeight = normalizeStyleValue(source?.lineHeight);
  if (lineHeight) {
    nextStyle.lineHeight = lineHeight;
  }
  if (source?.textDecoration) {
    nextStyle.textDecoration = source.textDecoration;
  }
  return Object.keys(nextStyle).length > 0 ? nextStyle : undefined;
}

function parseNumberValue(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  if (typeof value === 'string') {
    const next = Number(value);
    return Number.isFinite(next) ? next : NaN;
  }
  return NaN;
}

function resolveStrategyRegExp(source: unknown): null | RegExp {
  if (source instanceof RegExp) {
    return source;
  }
  if (typeof source === 'string') {
    const input = source.trim();
    if (!input) {
      return null;
    }
    const match = input.match(/^\/(.+)\/([a-z]*)$/i);
    if (match) {
      try {
        return new RegExp(match[1] ?? '', match[2] ?? '');
      } catch {
        return null;
      }
    }
    try {
      return new RegExp(input);
    } catch {
      return null;
    }
  }
  if (isPlainObject(source)) {
    const pattern = (source as Record<string, any>).pattern;
    const flags = (source as Record<string, any>).flags;
    if (typeof pattern !== 'string' || pattern.trim() === '') {
      return null;
    }
    if (flags !== undefined && typeof flags !== 'string') {
      return null;
    }
    try {
      return new RegExp(pattern, typeof flags === 'string' ? flags : undefined);
    } catch {
      return null;
    }
  }
  return null;
}

function testStrategyRegExp(value: unknown, matcher: unknown) {
  const source = resolveStrategyRegExp(matcher);
  if (!source) {
    return false;
  }
  const regex = new RegExp(source.source, source.flags);
  return regex.test(String(value ?? ''));
}

function compareStrategyValues(
  left: unknown,
  right: unknown,
  op: string
): boolean {
  if (op === 'eq') {
    return left === right;
  }
  if (op === 'neq') {
    return left !== right;
  }
  if (op === 'empty') {
    return (
      left === undefined ||
      left === null ||
      (typeof left === 'string' && left.trim() === '') ||
      (Array.isArray(left) && left.length <= 0)
    );
  }
  if (op === 'notEmpty') {
    return !compareStrategyValues(left, undefined, 'empty');
  }
  if (op === 'truthy') {
    return !!left;
  }
  if (op === 'falsy') {
    return !left;
  }
  if (op === 'in') {
    return Array.isArray(right) && right.includes(left);
  }
  if (op === 'notIn') {
    return Array.isArray(right) && !right.includes(left);
  }
  if (op === 'includes' || op === 'contains') {
    if (Array.isArray(left)) {
      return left.includes(right);
    }
    return String(left ?? '').includes(String(right ?? ''));
  }
  if (op === 'startsWith') {
    return String(left ?? '').startsWith(String(right ?? ''));
  }
  if (op === 'endsWith') {
    return String(left ?? '').endsWith(String(right ?? ''));
  }
  if (op === 'regex') {
    return testStrategyRegExp(left, right);
  }
  if (op === 'notRegex') {
    return !testStrategyRegExp(left, right);
  }
  if (op === 'between') {
    const [min, max] = Array.isArray(right)
      ? right
      : [undefined, undefined];
    const leftNumber = parseNumberValue(left);
    const minNumber = parseNumberValue(min);
    const maxNumber = parseNumberValue(max);
    if (
      Number.isNaN(leftNumber) ||
      Number.isNaN(minNumber) ||
      Number.isNaN(maxNumber)
    ) {
      return false;
    }
    return leftNumber >= minNumber && leftNumber <= maxNumber;
  }
  const leftNumber = parseNumberValue(left);
  const rightNumber = parseNumberValue(right);
  if (!Number.isNaN(leftNumber) && !Number.isNaN(rightNumber)) {
    if (op === 'gt') {
      return leftNumber > rightNumber;
    }
    if (op === 'gte') {
      return leftNumber >= rightNumber;
    }
    if (op === 'lt') {
      return leftNumber < rightNumber;
    }
    if (op === 'lte') {
      return leftNumber <= rightNumber;
    }
  }
  const leftText = String(left ?? '');
  const rightText = String(right ?? '');
  if (op === 'gt') {
    return leftText > rightText;
  }
  if (op === 'gte') {
    return leftText >= rightText;
  }
  if (op === 'lt') {
    return leftText < rightText;
  }
  if (op === 'lte') {
    return leftText <= rightText;
  }
  return false;
}

function resolveStrategyContextValue<TContext>(
  source: TableStrategyResolver<TContext> | undefined,
  ctx: TContext
) {
  if (typeof source === 'function') {
    try {
      return source(ctx);
    } catch {
      return undefined;
    }
  }
  return source;
}

function evaluateStrategyConditionObject<TContext extends TableStrategyContextBase>(
  condition: TableStrategyCondition,
  ctx: TContext
): boolean {
  if (!isPlainObject(condition)) {
    return false;
  }
  const andList = toArrayValue(condition.and);
  if (andList.length > 0) {
    return andList.every((item) =>
      evaluateStrategyCondition(item as TableStrategyCondition, ctx)
    );
  }

  const orList = toArrayValue(condition.or);
  if (orList.length > 0) {
    return orList.some((item) =>
      evaluateStrategyCondition(item as TableStrategyCondition, ctx)
    );
  }

  if (condition.not) {
    return !evaluateStrategyCondition(condition.not, ctx);
  }

  const leftValue = isNonEmptyString(condition.field)
    ? ctx.getValue(condition.field.trim())
    : ctx.value;

  if (Object.prototype.hasOwnProperty.call(condition, 'between')) {
    return compareStrategyValues(leftValue, condition.between, 'between');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'in')) {
    return compareStrategyValues(leftValue, condition.in, 'in');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'notIn')) {
    return compareStrategyValues(leftValue, condition.notIn, 'notIn');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'gt')) {
    return compareStrategyValues(leftValue, condition.gt, 'gt');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'gte')) {
    return compareStrategyValues(leftValue, condition.gte, 'gte');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'lt')) {
    return compareStrategyValues(leftValue, condition.lt, 'lt');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'lte')) {
    return compareStrategyValues(leftValue, condition.lte, 'lte');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'eq')) {
    return compareStrategyValues(leftValue, condition.eq, 'eq');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'neq')) {
    return compareStrategyValues(leftValue, condition.neq, 'neq');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'includes')) {
    return compareStrategyValues(leftValue, condition.includes, 'includes');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'startsWith')) {
    return compareStrategyValues(leftValue, condition.startsWith, 'startsWith');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'regex')) {
    return compareStrategyValues(leftValue, condition.regex, 'regex');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'notRegex')) {
    return compareStrategyValues(leftValue, condition.notRegex, 'notRegex');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'empty')) {
    return condition.empty === true
      ? compareStrategyValues(leftValue, undefined, 'empty')
      : compareStrategyValues(leftValue, undefined, 'notEmpty');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'notEmpty')) {
    return condition.notEmpty === true
      ? compareStrategyValues(leftValue, undefined, 'notEmpty')
      : compareStrategyValues(leftValue, undefined, 'empty');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'truthy')) {
    return condition.truthy === true
      ? compareStrategyValues(leftValue, undefined, 'truthy')
      : compareStrategyValues(leftValue, undefined, 'falsy');
  }
  if (Object.prototype.hasOwnProperty.call(condition, 'falsy')) {
    return condition.falsy === true
      ? compareStrategyValues(leftValue, undefined, 'falsy')
      : compareStrategyValues(leftValue, undefined, 'truthy');
  }

  const op = typeof condition.op === 'string'
    ? condition.op.trim()
    : '';
  if (op) {
    const compareTarget = Object.prototype.hasOwnProperty.call(condition, 'target')
      ? condition.target
      : condition.value;
    return compareStrategyValues(leftValue, compareTarget, op);
  }

  if (Object.prototype.hasOwnProperty.call(condition, 'value')) {
    return compareStrategyValues(leftValue, condition.value, 'eq');
  }

  return !!leftValue;
}

function evaluateStrategyCondition<TContext extends TableStrategyContextBase>(
  when: null | TableStrategyWhen<TContext> | undefined,
  ctx: TContext
): boolean {
  if (typeof when === 'boolean') {
    return when;
  }
  if (typeof when === 'function') {
    try {
      return !!when(ctx);
    } catch {
      return false;
    }
  }
  if (isPlainObject(when)) {
    return evaluateStrategyConditionObject(when as TableStrategyCondition, ctx);
  }
  return true;
}

const tableFormulaHelpers = {
  ABS(value: unknown) {
    const next = parseNumberValue(value);
    return Number.isNaN(next) ? 0 : Math.abs(next);
  },
  AVG(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return list.reduce((sum, value) => sum + value, 0) / list.length;
  },
  IF(condition: unknown, onTrue: unknown, onFalse: unknown) {
    return condition ? onTrue : onFalse;
  },
  MAX(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return Math.max(...list);
  },
  MIN(...values: unknown[]) {
    const list = values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item));
    if (list.length <= 0) {
      return 0;
    }
    return Math.min(...list);
  },
  ROUND(value: unknown, digits = 0) {
    const numberValue = parseNumberValue(value);
    const digitsValue = parseNumberValue(digits);
    if (Number.isNaN(numberValue)) {
      return 0;
    }
    const precision = Number.isNaN(digitsValue)
      ? 0
      : Math.max(0, Math.min(12, Math.trunc(digitsValue)));
    return Number(numberValue.toFixed(precision));
  },
  SUM(...values: unknown[]) {
    return values
      .map((item) => parseNumberValue(item))
      .filter((item) => !Number.isNaN(item))
      .reduce((sum, value) => sum + value, 0);
  },
} as const;

type TableFormulaTokenType =
  | 'colon'
  | 'comma'
  | 'eof'
  | 'identifier'
  | 'number'
  | 'operator'
  | 'paren'
  | 'question'
  | 'string';

interface TableFormulaToken {
  type: TableFormulaTokenType;
  value: string;
}

type TableFormulaNode =
  | {
      value: string | number;
      type: 'literal';
    }
  | {
      name: string;
      type: 'identifier';
    }
  | {
      argument: TableFormulaNode;
      operator: '!' | '+' | '-';
      type: 'unary';
    }
  | {
      left: TableFormulaNode;
      operator: '%' | '*' | '+' | '-' | '/' | '<' | '<=' | '==' | '===' | '>' | '>=' | '!=' | '!==';
      right: TableFormulaNode;
      type: 'binary';
    }
  | {
      left: TableFormulaNode;
      operator: '&&' | '||';
      right: TableFormulaNode;
      type: 'logical';
    }
  | {
      alternate: TableFormulaNode;
      consequent: TableFormulaNode;
      test: TableFormulaNode;
      type: 'conditional';
    }
  | {
      args: TableFormulaNode[];
      callee: string;
      type: 'call';
    };

interface TableFormulaParserState {
  index: number;
  tokens: TableFormulaToken[];
}

const tableFormulaOperators = [
  '===',
  '!==',
  '>=',
  '<=',
  '&&',
  '||',
  '==',
  '!=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '>',
  '<',
  '!',
] as const;

const compiledFormulaCache = new Map<string, TableFormulaNode>();
interface CachedCellStrategyEntry {
  columnStrategyRef: unknown;
  legacyStrategyRef: unknown;
  strategyConfigRef: unknown;
  value: TableCellStrategy | undefined;
}

const cachedCellStrategiesByGrid = new WeakMap<
  Record<string, any>,
  WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>
>();
const cachedCellStrategiesWithoutGrid = new WeakMap<
  TableColumnRecord,
  Map<string, CachedCellStrategyEntry>
>();
const cachedRowStrategiesByGrid = new WeakMap<
  Record<string, any>,
  {
    legacyRowStrategyRef: unknown;
    strategyConfigRef: unknown;
    value: TableRowStrategy[];
  }
>();

function getCachedCellStrategyEntry(
  column: TableColumnRecord,
  field: string,
  gridOptions?: Record<string, any>
) {
  if (gridOptions) {
    let cacheByColumn = cachedCellStrategiesByGrid.get(gridOptions);
    if (!cacheByColumn) {
      cacheByColumn = new WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>();
      cachedCellStrategiesByGrid.set(gridOptions, cacheByColumn);
    }
    let cacheByField = cacheByColumn.get(column);
    if (!cacheByField) {
      cacheByField = new Map<string, CachedCellStrategyEntry>();
      cacheByColumn.set(column, cacheByField);
    }
    return cacheByField.get(field);
  }

  let cacheByField = cachedCellStrategiesWithoutGrid.get(column);
  if (!cacheByField) {
    cacheByField = new Map<string, CachedCellStrategyEntry>();
    cachedCellStrategiesWithoutGrid.set(column, cacheByField);
  }
  return cacheByField.get(field);
}

function setCachedCellStrategyEntry(
  column: TableColumnRecord,
  field: string,
  entry: CachedCellStrategyEntry,
  gridOptions?: Record<string, any>
) {
  if (gridOptions) {
    let cacheByColumn = cachedCellStrategiesByGrid.get(gridOptions);
    if (!cacheByColumn) {
      cacheByColumn = new WeakMap<TableColumnRecord, Map<string, CachedCellStrategyEntry>>();
      cachedCellStrategiesByGrid.set(gridOptions, cacheByColumn);
    }
    let cacheByField = cacheByColumn.get(column);
    if (!cacheByField) {
      cacheByField = new Map<string, CachedCellStrategyEntry>();
      cacheByColumn.set(column, cacheByField);
    }
    cacheByField.set(field, entry);
    return;
  }

  let cacheByField = cachedCellStrategiesWithoutGrid.get(column);
  if (!cacheByField) {
    cacheByField = new Map<string, CachedCellStrategyEntry>();
    cachedCellStrategiesWithoutGrid.set(column, cacheByField);
  }
  cacheByField.set(field, entry);
}

function isTableFormulaIdentifierStart(char: string) {
  return /[A-Za-z_$]/.test(char);
}

function isTableFormulaIdentifierPart(char: string) {
  return /[A-Za-z0-9_$]/.test(char);
}

function readTableFormulaStringToken(
  expression: string,
  startIndex: number
): {
  nextIndex: number;
  token?: TableFormulaToken;
} {
  const quote = expression[startIndex];
  let currentIndex = startIndex + 1;
  let value = '';
  let escaped = false;

  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (escaped) {
      value += char;
      escaped = false;
      currentIndex += 1;
      continue;
    }
    if (char === '\\') {
      escaped = true;
      currentIndex += 1;
      continue;
    }
    if (char === quote) {
      return {
        nextIndex: currentIndex + 1,
        token: {
          type: 'string',
          value,
        },
      };
    }
    value += char;
    currentIndex += 1;
  }

  return {
    nextIndex: expression.length,
  };
}

function readTableFormulaNumberToken(
  expression: string,
  startIndex: number
): {
  nextIndex: number;
  token?: TableFormulaToken;
} {
  let currentIndex = startIndex;
  let hasDot = false;

  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (char === '.') {
      if (hasDot) {
        break;
      }
      hasDot = true;
      currentIndex += 1;
      continue;
    }
    if (!/[0-9]/.test(char)) {
      break;
    }
    currentIndex += 1;
  }

  const raw = expression.slice(startIndex, currentIndex);
  if (!raw) {
    return {
      nextIndex: startIndex,
    };
  }
  return {
    nextIndex: currentIndex,
    token: {
      type: 'number',
      value: raw,
    },
  };
}

function readTableFormulaIdentifierToken(
  expression: string,
  startIndex: number
): {
  nextIndex: number;
  token?: TableFormulaToken;
} {
  if (!isTableFormulaIdentifierStart(expression[startIndex] ?? '')) {
    return {
      nextIndex: startIndex,
    };
  }

  let currentIndex = startIndex + 1;
  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (isTableFormulaIdentifierPart(char)) {
      currentIndex += 1;
      continue;
    }
    if (
      char === '.' &&
      isTableFormulaIdentifierStart(expression[currentIndex + 1] ?? '')
    ) {
      currentIndex += 1;
      continue;
    }
    break;
  }

  return {
    nextIndex: currentIndex,
    token: {
      type: 'identifier',
      value: expression.slice(startIndex, currentIndex),
    },
  };
}

function tokenizeTableFormula(
  expression: string
): TableFormulaToken[] | undefined {
  const tokens: TableFormulaToken[] = [];
  let currentIndex = 0;

  while (currentIndex < expression.length) {
    const char = expression[currentIndex];
    if (/\s/.test(char)) {
      currentIndex += 1;
      continue;
    }

    if (char === '"' || char === '\'') {
      const result = readTableFormulaStringToken(expression, currentIndex);
      if (!result.token) {
        return undefined;
      }
      tokens.push(result.token);
      currentIndex = result.nextIndex;
      continue;
    }

    const nextChar = expression[currentIndex + 1] ?? '';
    if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(nextChar))) {
      const result = readTableFormulaNumberToken(expression, currentIndex);
      if (!result.token) {
        return undefined;
      }
      tokens.push(result.token);
      currentIndex = result.nextIndex;
      continue;
    }

    if (isTableFormulaIdentifierStart(char)) {
      const result = readTableFormulaIdentifierToken(expression, currentIndex);
      if (!result.token) {
        return undefined;
      }
      tokens.push(result.token);
      currentIndex = result.nextIndex;
      continue;
    }

    const operator = tableFormulaOperators.find((item) =>
      expression.startsWith(item, currentIndex)
    );
    if (operator) {
      tokens.push({
        type: 'operator',
        value: operator,
      });
      currentIndex += operator.length;
      continue;
    }

    if (char === '(' || char === ')') {
      tokens.push({
        type: 'paren',
        value: char,
      });
      currentIndex += 1;
      continue;
    }
    if (char === ',') {
      tokens.push({
        type: 'comma',
        value: char,
      });
      currentIndex += 1;
      continue;
    }
    if (char === '?') {
      tokens.push({
        type: 'question',
        value: char,
      });
      currentIndex += 1;
      continue;
    }
    if (char === ':') {
      tokens.push({
        type: 'colon',
        value: char,
      });
      currentIndex += 1;
      continue;
    }

    return undefined;
  }

  tokens.push({
    type: 'eof',
    value: '',
  });
  return tokens;
}

function getTableFormulaCurrentToken(state: TableFormulaParserState) {
  return state.tokens[state.index] ?? { type: 'eof', value: '' };
}

function matchTableFormulaToken(
  state: TableFormulaParserState,
  type: TableFormulaTokenType,
  value?: string
) {
  const current = getTableFormulaCurrentToken(state);
  if (current.type !== type) {
    return false;
  }
  if (value !== undefined && current.value !== value) {
    return false;
  }
  state.index += 1;
  return true;
}

function expectTableFormulaToken(
  state: TableFormulaParserState,
  type: TableFormulaTokenType,
  value?: string
) {
  const current = getTableFormulaCurrentToken(state);
  if (current.type !== type) {
    throw new Error('Unexpected token type');
  }
  if (value !== undefined && current.value !== value) {
    throw new Error('Unexpected token value');
  }
  state.index += 1;
  return current;
}

function parseTableFormulaPrimary(state: TableFormulaParserState): TableFormulaNode {
  const current = getTableFormulaCurrentToken(state);
  if (current.type === 'number') {
    state.index += 1;
    return {
      type: 'literal',
      value: Number(current.value),
    };
  }
  if (current.type === 'string') {
    state.index += 1;
    return {
      type: 'literal',
      value: current.value,
    };
  }
  if (current.type === 'identifier') {
    state.index += 1;
    const identifier = current.value;
    if (matchTableFormulaToken(state, 'paren', '(')) {
      const args: TableFormulaNode[] = [];
      if (!matchTableFormulaToken(state, 'paren', ')')) {
        do {
          args.push(parseTableFormulaConditional(state));
        } while (matchTableFormulaToken(state, 'comma'));
        expectTableFormulaToken(state, 'paren', ')');
      }
      return {
        args,
        callee: identifier,
        type: 'call',
      };
    }
    return {
      name: identifier,
      type: 'identifier',
    };
  }
  if (matchTableFormulaToken(state, 'paren', '(')) {
    const node = parseTableFormulaConditional(state);
    expectTableFormulaToken(state, 'paren', ')');
    return node;
  }
  throw new Error('Invalid formula primary expression');
}

function parseTableFormulaUnary(state: TableFormulaParserState): TableFormulaNode {
  const current = getTableFormulaCurrentToken(state);
  if (
    current.type === 'operator' &&
    (current.value === '!' || current.value === '+' || current.value === '-')
  ) {
    state.index += 1;
    return {
      argument: parseTableFormulaUnary(state),
      operator: current.value,
      type: 'unary',
    };
  }
  return parseTableFormulaPrimary(state);
}

function parseTableFormulaMultiplicative(
  state: TableFormulaParserState
): TableFormulaNode {
  let node = parseTableFormulaUnary(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      (current.value !== '*' &&
        current.value !== '/' &&
        current.value !== '%')
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value,
      right: parseTableFormulaUnary(state),
      type: 'binary',
    };
  }
  return node;
}

function parseTableFormulaAdditive(state: TableFormulaParserState): TableFormulaNode {
  let node = parseTableFormulaMultiplicative(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      (current.value !== '+' && current.value !== '-')
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value,
      right: parseTableFormulaMultiplicative(state),
      type: 'binary',
    };
  }
  return node;
}

function parseTableFormulaComparison(
  state: TableFormulaParserState
): TableFormulaNode {
  let node = parseTableFormulaAdditive(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      !['<', '<=', '>', '>='].includes(current.value)
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value as '<' | '<=' | '>' | '>=',
      right: parseTableFormulaAdditive(state),
      type: 'binary',
    };
  }
  return node;
}

function parseTableFormulaEquality(state: TableFormulaParserState): TableFormulaNode {
  let node = parseTableFormulaComparison(state);
  while (true) {
    const current = getTableFormulaCurrentToken(state);
    if (
      current.type !== 'operator' ||
      !['==', '===', '!=', '!=='].includes(current.value)
    ) {
      break;
    }
    state.index += 1;
    node = {
      left: node,
      operator: current.value as '!=' | '!==' | '==' | '===',
      right: parseTableFormulaComparison(state),
      type: 'binary',
    };
  }
  return node;
}

function parseTableFormulaLogicalAnd(
  state: TableFormulaParserState
): TableFormulaNode {
  let node = parseTableFormulaEquality(state);
  while (matchTableFormulaToken(state, 'operator', '&&')) {
    node = {
      left: node,
      operator: '&&',
      right: parseTableFormulaEquality(state),
      type: 'logical',
    };
  }
  return node;
}

function parseTableFormulaLogicalOr(state: TableFormulaParserState): TableFormulaNode {
  let node = parseTableFormulaLogicalAnd(state);
  while (matchTableFormulaToken(state, 'operator', '||')) {
    node = {
      left: node,
      operator: '||',
      right: parseTableFormulaLogicalAnd(state),
      type: 'logical',
    };
  }
  return node;
}

function parseTableFormulaConditional(
  state: TableFormulaParserState
): TableFormulaNode {
  const node = parseTableFormulaLogicalOr(state);
  if (!matchTableFormulaToken(state, 'question')) {
    return node;
  }
  const consequent = parseTableFormulaConditional(state);
  expectTableFormulaToken(state, 'colon');
  const alternate = parseTableFormulaConditional(state);
  return {
    alternate,
    consequent,
    test: node,
    type: 'conditional',
  };
}

function evaluateTableFormulaNode(
  node: TableFormulaNode,
  row: Record<string, any>,
  helpers: typeof tableFormulaHelpers
): any {
  switch (node.type) {
    case 'literal': {
      return node.value;
    }
    case 'identifier': {
      const lowerCaseName = node.name.toLowerCase();
      if (lowerCaseName === 'true') {
        return true;
      }
      if (lowerCaseName === 'false') {
        return false;
      }
      if (lowerCaseName === 'null') {
        return null;
      }
      if (lowerCaseName === 'undefined') {
        return undefined;
      }
      return getColumnValueByPath(row, node.name);
    }
    case 'unary': {
      const value = evaluateTableFormulaNode(node.argument, row, helpers);
      if (node.operator === '!') {
        return !value;
      }
      if (node.operator === '+') {
        return +value;
      }
      return -value;
    }
    case 'binary': {
      const left = evaluateTableFormulaNode(node.left, row, helpers);
      const right = evaluateTableFormulaNode(node.right, row, helpers);
      switch (node.operator) {
        case '*':
          return left * right;
        case '/':
          return left / right;
        case '%':
          return left % right;
        case '+':
          return left + right;
        case '-':
          return left - right;
        case '>':
          return left > right;
        case '>=':
          return left >= right;
        case '<':
          return left < right;
        case '<=':
          return left <= right;
        case '==':
        case '===':
          return left === right;
        case '!=':
        case '!==':
          return left !== right;
      }
      return undefined;
    }
    case 'logical': {
      if (node.operator === '&&') {
        const left = evaluateTableFormulaNode(node.left, row, helpers);
        return left
          ? evaluateTableFormulaNode(node.right, row, helpers)
          : left;
      }
      const left = evaluateTableFormulaNode(node.left, row, helpers);
      return left ? left : evaluateTableFormulaNode(node.right, row, helpers);
    }
    case 'conditional': {
      const test = evaluateTableFormulaNode(node.test, row, helpers);
      return test
        ? evaluateTableFormulaNode(node.consequent, row, helpers)
        : evaluateTableFormulaNode(node.alternate, row, helpers);
    }
    case 'call': {
      const helperName = node.callee.trim().toUpperCase();
      const helper = (helpers as Record<string, (...args: any[]) => any>)[helperName];
      if (typeof helper !== 'function') {
        return undefined;
      }
      const args = node.args.map((arg) => evaluateTableFormulaNode(arg, row, helpers));
      return helper(...args);
    }
  }
}

function compileTableFormula(formula: string) {
  if (compiledFormulaCache.has(formula)) {
    return compiledFormulaCache.get(formula);
  }
  const expression = formula.trim().replace(/^=/, '');
  if (!expression) {
    return undefined;
  }
  try {
    const tokens = tokenizeTableFormula(expression);
    if (!tokens) {
      return undefined;
    }
    const state: TableFormulaParserState = {
      index: 0,
      tokens,
    };
    const compiled = parseTableFormulaConditional(state);
    expectTableFormulaToken(state, 'eof');
    compiledFormulaCache.set(formula, compiled);
    return compiled;
  } catch {
    return undefined;
  }
}

function resolveFormulaValue(
  formula: ((ctx: TableCellStrategyContext) => any) | string | undefined,
  ctx: TableCellStrategyContext
) {
  if (!formula) {
    return undefined;
  }
  if (typeof formula === 'function') {
    try {
      return formula(ctx);
    } catch {
      return undefined;
    }
  }
  if (typeof formula !== 'string') {
    return undefined;
  }
  const compiled = compileTableFormula(formula);
  if (!compiled) {
    return undefined;
  }
  try {
    return evaluateTableFormulaNode(compiled, ctx.row, tableFormulaHelpers);
  } catch {
    return undefined;
  }
}

function applyNumericPrecision(value: unknown, precision: unknown) {
  if (precision === undefined || precision === null || precision === '') {
    return value;
  }
  const numberValue = parseNumberValue(value);
  if (Number.isNaN(numberValue)) {
    return value;
  }
  const precisionValue = parseNumberValue(precision);
  if (Number.isNaN(precisionValue)) {
    return value;
  }
  const digits = Math.max(0, Math.min(12, Math.trunc(precisionValue)));
  return Number(numberValue.toFixed(digits));
}

function applyCellDisplayDecorators(
  value: unknown,
  config: Pick<
    TableCellStrategy,
    'prefix' | 'suffix' | 'text' | 'unit' | 'unitSeparator'
  >,
  ctx: TableCellStrategyContext
) {
  const textValue = resolveStrategyContextValue(config.text, ctx);
  const prefixValue = resolveStrategyContextValue(config.prefix, ctx);
  const suffixValue = resolveStrategyContextValue(config.suffix, ctx);
  const unitValue = resolveStrategyContextValue(config.unit, ctx);
  const hasDecorator =
    textValue !== undefined ||
    prefixValue !== undefined ||
    suffixValue !== undefined ||
    unitValue !== undefined;
  if (!hasDecorator) {
    return {
      hasDisplayOverride: false,
      value,
    };
  }
  let next = textValue !== undefined ? textValue : value;
  const separator = isNonEmptyString(config.unitSeparator)
    ? config.unitSeparator
    : '';
  const prefixText = prefixValue === undefined || prefixValue === null
    ? ''
    : String(prefixValue);
  const suffixText = suffixValue === undefined || suffixValue === null
    ? ''
    : String(suffixValue);
  const unitText = unitValue === undefined || unitValue === null
    ? ''
    : String(unitValue);
  if (
    prefixText ||
    suffixText ||
    unitText
  ) {
    const baseText = next === undefined || next === null
      ? ''
      : String(next);
    next = `${prefixText}${baseText}${suffixText}${unitText ? `${separator}${unitText}` : ''}`;
  }
  return {
    hasDisplayOverride: true,
    value: next,
  };
}

function normalizeTableStrategyConfig(
  value: unknown
): TableStrategyConfig | undefined {
  return isPlainObject(value)
    ? (value as TableStrategyConfig)
    : undefined;
}

function resolveCellStrategyMap(
  gridOptions: Record<string, any> | undefined
) {
  const strategyConfig = normalizeTableStrategyConfig(gridOptions?.strategy);
  const strategyColumns = strategyConfig?.columns;
  const legacyColumns = isPlainObject(gridOptions?.cellStrategy)
    ? (gridOptions?.cellStrategy as Record<string, TableCellStrategy>)
    : undefined;
  return {
    strategyColumns: isPlainObject(strategyColumns)
      ? (strategyColumns as Record<string, TableCellStrategy>)
      : undefined,
    legacyColumns,
  };
}

function resolveStrategyByColumnKey(
  map: Record<string, TableCellStrategy> | undefined,
  column: TableColumnRecord,
  field: string
) {
  if (!map) {
    return undefined;
  }
  const candidates = [
    field,
    typeof column.field === 'string' ? column.field : undefined,
    typeof column.dataIndex === 'string' ? column.dataIndex : undefined,
    typeof column.key === 'string' ? column.key : undefined,
  ].filter((item): item is string => !!item && item.trim().length > 0);

  for (const key of candidates) {
    const item = map[key];
    if (isPlainObject(item)) {
      return item as TableCellStrategy;
    }
  }
  return undefined;
}

function mergeCellStrategies(
  base: null | TableCellStrategy | undefined,
  override: null | TableCellStrategy | undefined
): TableCellStrategy | undefined {
  if (!base && !override) {
    return undefined;
  }
  const baseRules = Array.isArray(base?.rules) ? base.rules : [];
  const overrideRules = Array.isArray(override?.rules) ? override.rules : [];
  const className = joinClassNames(base?.className, override?.className);
  return {
    ...(base ?? {}),
    ...(override ?? {}),
    className: className || undefined,
    rules: [...baseRules, ...overrideRules],
    style: {
      ...(base?.style ?? {}),
      ...(override?.style ?? {}),
    },
  };
}

export function resolveTableCellStrategy(
  column: TableColumnRecord,
  field: string,
  gridOptions?: Record<string, any>
) {
  const normalizedField = isNonEmptyString(field) ? field.trim() : '';
  const cached = getCachedCellStrategyEntry(column, normalizedField, gridOptions);
  const currentEntryRefs = {
    columnStrategyRef: column?.strategy,
    legacyStrategyRef: gridOptions?.cellStrategy,
    strategyConfigRef: gridOptions?.strategy,
  };
  if (
    cached &&
    cached.columnStrategyRef === currentEntryRefs.columnStrategyRef &&
    cached.legacyStrategyRef === currentEntryRefs.legacyStrategyRef &&
    cached.strategyConfigRef === currentEntryRefs.strategyConfigRef
  ) {
    return cached.value;
  }

  const strategyFromColumn = isPlainObject(column?.strategy)
    ? (column.strategy as TableCellStrategy)
    : undefined;
  const { legacyColumns, strategyColumns } = resolveCellStrategyMap(gridOptions);
  const strategyFromStrategyMap = resolveStrategyByColumnKey(
    strategyColumns,
    column,
    field
  );
  const strategyFromLegacyMap = resolveStrategyByColumnKey(
    legacyColumns,
    column,
    field
  );
  const resolved = mergeCellStrategies(
    mergeCellStrategies(strategyFromLegacyMap, strategyFromStrategyMap),
    strategyFromColumn
  );
  setCachedCellStrategyEntry(
    column,
    normalizedField,
    {
      ...currentEntryRefs,
      value: resolved,
    },
    gridOptions
  );
  return resolved;
}

export function resolveTableRowStrategies(
  gridOptions?: Record<string, any>
) {
  if (gridOptions) {
    const cached = cachedRowStrategiesByGrid.get(gridOptions);
    if (
      cached &&
      cached.legacyRowStrategyRef === gridOptions.rowStrategy &&
      cached.strategyConfigRef === gridOptions.strategy
    ) {
      return cached.value;
    }
  }

  const strategyConfig = normalizeTableStrategyConfig(gridOptions?.strategy);
  const rowsFromStrategy = Array.isArray(strategyConfig?.rows)
    ? strategyConfig.rows
    : [];
  const rowsFromLegacy = Array.isArray(gridOptions?.rowStrategy)
    ? (gridOptions?.rowStrategy as TableRowStrategy[])
    : [];
  const resolved = [...rowsFromStrategy, ...rowsFromLegacy].filter((item) =>
    isPlainObject(item)
  ) as TableRowStrategy[];
  if (gridOptions) {
    cachedRowStrategiesByGrid.set(gridOptions, {
      legacyRowStrategyRef: gridOptions.rowStrategy,
      strategyConfigRef: gridOptions.strategy,
      value: resolved,
    });
  }
  return resolved;
}

function resolveCellBaseValue(
  strategy: TableCellStrategy,
  ctx: TableCellStrategyContext
) {
  const formulaValue = resolveFormulaValue(strategy.formula, ctx);
  if (formulaValue !== undefined) {
    return formulaValue;
  }
  const computedValue = resolveStrategyContextValue(strategy.compute, ctx);
  if (computedValue !== undefined) {
    return computedValue;
  }
  const explicitValue = resolveStrategyContextValue(strategy.value, ctx);
  if (explicitValue !== undefined) {
    return explicitValue;
  }
  return ctx.value;
}

function applyCellStyleRule(
  target: {
    className: string;
    clickable: boolean;
    onClick?: (ctx: TableCellStrategyContext, event?: unknown) => any;
    stopPropagation: boolean;
    style?: Record<string, any>;
  },
  rule: TableCellStrategy | TableCellStrategyRule
) {
  target.className = joinClassNames(target.className, rule.className);
  target.style = mergeTableStrategyStyle(
    target.style,
    buildTableStrategyStyle(rule)
  );
  if (rule.clickable === true) {
    target.clickable = true;
  }
  if (typeof rule.onClick === 'function') {
    target.onClick = rule.onClick as (
      ctx: TableCellStrategyContext,
      event?: unknown
    ) => any;
  }
  if (typeof rule.stopPropagation === 'boolean') {
    target.stopPropagation = rule.stopPropagation;
  }
}

function resolveCellRuleValue(
  rule: TableCellStrategyRule,
  ctx: TableCellStrategyContext
) {
  const formulaValue = resolveFormulaValue(rule.formula, ctx);
  if (formulaValue !== undefined) {
    return formulaValue;
  }
  const computedValue = resolveStrategyContextValue(rule.compute, ctx);
  if (computedValue !== undefined) {
    return computedValue;
  }
  const explicitValue = resolveStrategyContextValue(rule.value, ctx);
  if (explicitValue !== undefined) {
    return explicitValue;
  }
  return ctx.value;
}

export function resolveTableCellStrategyResult(options: {
  column: TableColumnRecord;
  field: string;
  gridOptions?: Record<string, any>;
  row: Record<string, any>;
  rowIndex: number;
  value: any;
}) {
  const strategy = resolveTableCellStrategy(
    options.column,
    options.field,
    options.gridOptions
  );
  if (!strategy) {
    return undefined;
  }

  const ctx: TableCellStrategyContext = {
    column: options.column,
    field: options.field,
    getValue(field) {
      return getColumnValueByPath(options.row, field ?? options.field);
    },
    row: options.row,
    rowIndex: options.rowIndex,
    value: options.value,
  };

  const visual = {
    className: '',
    clickable: false,
    onClick: undefined as
      | ((ctx: TableCellStrategyContext, event?: unknown) => any)
      | undefined,
    stopPropagation: strategy.stopPropagation !== false,
    style: undefined as Record<string, any> | undefined,
  };

  let currentValue = resolveCellBaseValue(strategy, ctx);
  currentValue = applyNumericPrecision(currentValue, strategy.precision);
  ctx.value = currentValue;

  applyCellStyleRule(visual, strategy);

  let displayResult = applyCellDisplayDecorators(currentValue, strategy, ctx);

  const rules = Array.isArray(strategy.rules) ? strategy.rules : [];
  rules.forEach((rule) => {
    if (!evaluateStrategyCondition(rule.when, ctx)) {
      return;
    }
    applyCellStyleRule(visual, rule);
    let nextValue = resolveCellRuleValue(rule, ctx);
    nextValue = applyNumericPrecision(nextValue, rule.precision);
    ctx.value = nextValue;
    currentValue = nextValue;
    const nextDisplayResult = applyCellDisplayDecorators(
      currentValue,
      rule,
      ctx
    );
    if (nextDisplayResult.hasDisplayOverride) {
      displayResult = nextDisplayResult;
    }
  });

  if (visual.clickable || visual.onClick) {
    visual.className = joinClassNames(visual.className, 'admin-table__strategy-clickable');
  }

  return {
    className: visual.className,
    clickable: visual.clickable || !!visual.onClick,
    displayValue: displayResult.hasDisplayOverride
      ? displayResult.value
      : currentValue,
    hasDisplayOverride: displayResult.hasDisplayOverride,
    onClick: visual.onClick,
    stopPropagation: visual.stopPropagation,
    style: visual.style,
    value: currentValue,
  } satisfies ResolvedTableCellStrategyResult;
}

export function resolveTableRowStrategyResult(options: {
  gridOptions?: Record<string, any>;
  row: Record<string, any>;
  rowIndex: number;
}) {
  const strategies = resolveTableRowStrategies(options.gridOptions);
  if (strategies.length <= 0) {
    return undefined;
  }
  const ctx: TableRowStrategyContext = {
    column: undefined,
    field: undefined,
    getValue(field) {
      if (!field || !isNonEmptyString(field)) {
        return undefined;
      }
      return getColumnValueByPath(options.row, field.trim());
    },
    row: options.row,
    rowIndex: options.rowIndex,
    value: undefined,
  };
  const visual = {
    className: '',
    clickable: false,
    onClick: undefined as
      | ((ctx: TableRowStrategyContext, event?: unknown) => any)
      | undefined,
    stopPropagation: true,
    style: undefined as Record<string, any> | undefined,
  };

  strategies.forEach((item) => {
    if (!evaluateStrategyCondition(item.when, ctx)) {
      return;
    }
    visual.className = joinClassNames(visual.className, item.className);
    visual.style = mergeTableStrategyStyle(
      visual.style,
      buildTableStrategyStyle(item)
    );
    if (item.clickable === true) {
      visual.clickable = true;
    }
    if (typeof item.onClick === 'function') {
      visual.onClick = item.onClick;
    }
    if (typeof item.stopPropagation === 'boolean') {
      visual.stopPropagation = item.stopPropagation;
    }
  });

  if (!visual.className && !visual.style && !visual.clickable && !visual.onClick) {
    return undefined;
  }
  if (visual.clickable || visual.onClick) {
    visual.className = joinClassNames(
      visual.className,
      'admin-table__strategy-clickable'
    );
  }

  return {
    className: visual.className,
    clickable: visual.clickable || !!visual.onClick,
    onClick: visual.onClick,
    stopPropagation: visual.stopPropagation,
    style: visual.style,
  } satisfies ResolvedTableRowStrategyResult;
}

export function triggerTableCellStrategyClick(options: {
  column: TableColumnRecord;
  event?: unknown;
  field: string;
  respectDefaultPrevented?: boolean;
  row: Record<string, any>;
  rowIndex: number;
  strategyResult: ResolvedTableCellStrategyResult | undefined;
}): TriggerTableStrategyClickResult {
  const strategyResult = options.strategyResult;
  if (!strategyResult?.onClick) {
    return {
      blocked: false,
      handled: false,
    };
  }
  const event = options.event as Record<string, any> | undefined;
  const shouldStop = strategyResult.stopPropagation !== false;
  if (shouldStop) {
    event?.stopPropagation?.();
  }
  strategyResult.onClick(
    {
      column: options.column,
      field: options.field,
      getValue(nextField?: string) {
        return getColumnValueByPath(options.row, nextField ?? options.field);
      },
      row: options.row,
      rowIndex: options.rowIndex,
      value: strategyResult.value,
    },
    options.event
  );
  const respectDefaultPrevented = options.respectDefaultPrevented !== false;
  if (respectDefaultPrevented && event?.defaultPrevented) {
    return {
      blocked: true,
      handled: true,
    };
  }
  return {
    blocked: shouldStop,
    handled: true,
  };
}

export function triggerTableRowStrategyClick(options: {
  event?: unknown;
  respectDefaultPrevented?: boolean;
  row: Record<string, any>;
  rowIndex: number;
  strategyResult: ResolvedTableRowStrategyResult | undefined;
}): TriggerTableStrategyClickResult {
  const strategyResult = options.strategyResult;
  if (!strategyResult?.onClick) {
    return {
      blocked: false,
      handled: false,
    };
  }
  const event = options.event as Record<string, any> | undefined;
  const shouldStop = strategyResult.stopPropagation !== false;
  if (shouldStop) {
    event?.stopPropagation?.();
  }
  strategyResult.onClick(
    {
      column: undefined,
      field: undefined,
      getValue(field?: string) {
        return getColumnValueByPath(options.row, field);
      },
      row: options.row,
      rowIndex: options.rowIndex,
      value: undefined,
    },
    options.event
  );
  const respectDefaultPrevented = options.respectDefaultPrevented !== false;
  if (respectDefaultPrevented && event?.defaultPrevented) {
    return {
      blocked: true,
      handled: true,
    };
  }
  return {
    blocked: shouldStop,
    handled: true,
  };
}

function hasValueForStyleVar(value: unknown) {
  return value !== undefined && value !== null && value !== '';
}

export function hasTableRowStrategyStyle(
  style: null | Record<string, any> | undefined
) {
  return !!style && Object.keys(style).length > 0;
}

export function resolveTableRowStrategyInlineStyle(
  style: null | Record<string, any> | undefined
) {
  if (!hasTableRowStrategyStyle(style)) {
    return undefined;
  }
  const source = { ...(style as Record<string, any>) };
  if (hasValueForStyleVar(source.backgroundColor)) {
    source['--admin-table-row-strategy-bg'] = String(source.backgroundColor);
    const hoverBackground =
      source['--admin-table-row-strategy-hover-bg'] ?? source.backgroundColor;
    if (hasValueForStyleVar(hoverBackground)) {
      source['--admin-table-row-strategy-hover-bg'] = String(hoverBackground);
    }
  }
  if (hasValueForStyleVar(source.color)) {
    source['--admin-table-row-strategy-color'] = String(source.color);
  }
  if (hasValueForStyleVar(source.fontWeight)) {
    source['--admin-table-row-strategy-font-weight'] = String(source.fontWeight);
  }
  return source;
}

export function getColumnFilterValueKey(value: unknown) {
  if (value === null) {
    return '__NULL__';
  }
  if (value === undefined) {
    return '__UNDEFINED__';
  }
  const type = typeof value;
  if (type === 'string') {
    return `string:${value}`;
  }
  if (type === 'number') {
    return `number:${value}`;
  }
  if (type === 'boolean') {
    return `boolean:${value}`;
  }
  try {
    return `json:${JSON.stringify(value)}`;
  } catch {
    return `other:${String(value)}`;
  }
}

function toColumnFilterLabel(value: unknown, emptyLabel: string) {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }
  return String(value);
}

export function buildDefaultColumnFilterOptions(
  rows: Record<string, any>[] | undefined,
  field?: string,
  options: {
    emptyLabel?: string;
    limit?: number;
  } = {}
): TableDefaultFilterOption[] {
  if (!Array.isArray(rows) || rows.length <= 0 || !isNonEmptyString(field)) {
    return [];
  }
  const limit = Math.max(1, options.limit ?? 20);
  const emptyLabel = isNonEmptyString(options.emptyLabel)
    ? options.emptyLabel.trim()
    : getLocaleMessages().table.emptyValue;
  const result: TableDefaultFilterOption[] = [];
  const visited = new Set<string>();

  for (const row of rows) {
    const rawValue = getColumnValueByPath(row, field);
    const key = getColumnFilterValueKey(rawValue);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);
    result.push({
      key,
      label: toColumnFilterLabel(rawValue, emptyLabel),
      value: key,
    });
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

export function buildColumnVisibilityMap(
  columns: TableColumnRecord[],
  source?: Record<string, boolean>,
  preferColumnDefault = false
) {
  const next: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key] !== false;
      return;
    }
    if (preferColumnDefault) {
      next[key] = column.visible !== false && column.hidden !== true;
      return;
    }
    next[key] = true;
  });
  return next;
}

export function buildColumnFixedMap(
  columns: TableColumnRecord[],
  source?: Record<string, TableColumnFixedValue>,
  preferColumnDefault = false
) {
  const next: Record<string, TableColumnFixedValue> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      const fixed = source[key];
      next[key] = fixed === 'left' || fixed === 'right' ? fixed : '';
      return;
    }
    if (preferColumnDefault) {
      const fixed = column.fixed;
      next[key] = fixed === 'left' || fixed === 'right' ? fixed : '';
      return;
    }
    next[key] = '';
  });
  return next;
}

function resolveColumnSortable(column: TableColumnRecord) {
  if (typeof column.sortable === 'boolean') {
    return column.sortable;
  }
  if (typeof column.sorter === 'boolean') {
    return column.sorter;
  }
  if (typeof column.sorter === 'function') {
    return true;
  }
  return false;
}

function resolveColumnFilterable(column: TableColumnRecord) {
  if (typeof column.filterable === 'boolean') {
    return column.filterable;
  }
  if (Array.isArray(column.filters)) {
    return column.filters.length > 0;
  }
  if (
    typeof column.filterDropdown === 'function' ||
    typeof column.filterMethod === 'function' ||
    typeof column.onFilter === 'function'
  ) {
    return true;
  }
  return !!column.filterRender;
}

export function buildColumnSortableMap(
  columns: TableColumnRecord[],
  source?: Record<string, boolean>,
  preferColumnDefault = false
) {
  const next: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key] !== false;
      return;
    }
    if (preferColumnDefault) {
      next[key] = resolveColumnSortable(column);
      return;
    }
    next[key] = false;
  });
  return next;
}

export function buildColumnFilterableMap(
  columns: TableColumnRecord[],
  source?: Record<string, boolean>,
  preferColumnDefault = false
) {
  const next: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key] !== false;
      return;
    }
    if (preferColumnDefault) {
      next[key] = resolveColumnFilterable(column);
      return;
    }
    next[key] = false;
  });
  return next;
}

export function buildColumnOrder(
  columns: TableColumnRecord[],
  source?: string[]
) {
  const allKeys = columns.map((column, index) => resolveColumnKey(column, index));
  if (!Array.isArray(source) || source.length <= 0) {
    return allKeys;
  }
  const sourceSet = new Set(source);
  const next: string[] = source.filter((key) => allKeys.includes(key));
  const missingSeq: string[] = [];
  const missingCommon: string[] = [];
  allKeys.forEach((key, index) => {
    if (sourceSet.has(key)) {
      return;
    }
    if (isSeqColumnTypeColumn(columns[index])) {
      missingSeq.push(key);
      return;
    }
    missingCommon.push(key);
  });
  return [...missingSeq, ...next, ...missingCommon];
}

export function moveArrayItem<T = string>(list: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return list;
  }
  const next = [...list];
  const item = next[fromIndex];
  if (typeof item === 'undefined') {
    return list;
  }
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

export function createColumnCustomSnapshot(
  columns: TableColumnRecord[],
  source: ColumnCustomSnapshotSource = {},
  preferColumnDefault = true
): ColumnCustomSnapshot {
  return {
    filterable: buildColumnFilterableMap(
      columns,
      source.filterable,
      preferColumnDefault
    ),
    fixed: buildColumnFixedMap(columns, source.fixed, preferColumnDefault),
    order: buildColumnOrder(columns, source.order),
    sortable: buildColumnSortableMap(
      columns,
      source.sortable,
      preferColumnDefault
    ),
    visible: buildColumnVisibilityMap(columns, source.visible, preferColumnDefault),
  };
}

export function resolveColumnCustomOpenSnapshot(
  columns: TableColumnRecord[],
  current?: ColumnCustomSnapshotSource
) {
  return createColumnCustomSnapshot(columns, current ?? {}, true);
}

export function cloneColumnCustomSnapshot(
  snapshot?: ColumnCustomSnapshotSource | null
): ColumnCustomSnapshot {
  const source = snapshot ?? {};
  return {
    filterable: { ...(source.filterable ?? {}) },
    fixed: { ...(source.fixed ?? {}) },
    order: [...(source.order ?? [])],
    sortable: { ...(source.sortable ?? {}) },
    visible: { ...(source.visible ?? {}) },
  };
}

export interface ResolveColumnCustomWorkingSnapshotOptions {
  current?: ColumnCustomSnapshotSource;
  external?: ColumnCustomSnapshotSource | null;
}

export function resolveColumnCustomWorkingSnapshot(
  columns: TableColumnRecord[],
  options: ResolveColumnCustomWorkingSnapshotOptions = {}
) {
  const source = hasColumnCustomSnapshot(options.external)
    ? (options.external ?? {})
    : (options.current ?? {});
  return createColumnCustomSnapshot(columns, source, true);
}

export interface ResolveColumnCustomOpenStateResult {
  draft: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

export function resolveColumnCustomOpenState(
  columns: TableColumnRecord[],
  current?: ColumnCustomSnapshotSource
): ResolveColumnCustomOpenStateResult {
  const snapshot = resolveColumnCustomOpenSnapshot(columns, current);
  return {
    draft: cloneColumnCustomSnapshot(snapshot),
    origin: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

export function hasColumnCustomSnapshot(
  snapshot?: Partial<ColumnCustomSnapshot> | null
) {
  if (!snapshot) {
    return false;
  }
  return (
    (Array.isArray(snapshot.order) && snapshot.order.length > 0) ||
    (snapshot.visible ? Object.keys(snapshot.visible).length > 0 : false) ||
    (snapshot.fixed ? Object.keys(snapshot.fixed).length > 0 : false) ||
    (snapshot.sortable ? Object.keys(snapshot.sortable).length > 0 : false) ||
    (snapshot.filterable ? Object.keys(snapshot.filterable).length > 0 : false)
  );
}

export function resolveColumnCustomCancelSnapshot(
  columns: TableColumnRecord[],
  options: {
    current?: Partial<ColumnCustomSnapshot>;
    origin?: Partial<ColumnCustomSnapshot> | null;
  }
) {
  if (hasColumnCustomSnapshot(options.origin)) {
    return createColumnCustomSnapshot(columns, options.origin ?? {}, true);
  }
  return createColumnCustomSnapshot(columns, options.current ?? {}, true);
}

export interface ResolveColumnCustomCancelStateResult {
  draft: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

export function resolveColumnCustomCancelState(
  columns: TableColumnRecord[],
  options: {
    current?: ColumnCustomSnapshotSource;
    origin?: ColumnCustomSnapshotSource | null;
  }
): ResolveColumnCustomCancelStateResult {
  const snapshot = resolveColumnCustomCancelSnapshot(columns, options);
  return {
    draft: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

export function resolveColumnCustomConfirmSnapshot(
  columns: TableColumnRecord[],
  draft?: Partial<ColumnCustomSnapshot>
) {
  return createColumnCustomSnapshot(columns, draft ?? {}, true);
}

export interface ResolveColumnCustomConfirmStateResult {
  current: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

export function resolveColumnCustomConfirmState(
  columns: TableColumnRecord[],
  draft?: ColumnCustomSnapshotSource
): ResolveColumnCustomConfirmStateResult {
  const snapshot = resolveColumnCustomConfirmSnapshot(columns, draft);
  return {
    current: cloneColumnCustomSnapshot(snapshot),
    origin: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

export function resolveColumnCustomResetSnapshot(columns: TableColumnRecord[]) {
  return createColumnCustomSnapshot(columns, {}, true);
}

export interface ResolveColumnCustomResetStateResult {
  current: ColumnCustomSnapshot;
  draft: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

export function resolveColumnCustomResetState(
  columns: TableColumnRecord[]
): ResolveColumnCustomResetStateResult {
  const snapshot = resolveColumnCustomResetSnapshot(columns);
  return {
    current: cloneColumnCustomSnapshot(snapshot),
    draft: cloneColumnCustomSnapshot(snapshot),
    origin: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

export function createColumnCustomChangePayload(
  columns: TableColumnRecord[],
  action: ColumnCustomAction,
  snapshotInput?: Partial<ColumnCustomSnapshot>
): ColumnCustomChangePayload {
  const snapshot = createColumnCustomSnapshot(columns, snapshotInput ?? {}, true);
  const runtimeColumns = buildColumnRuntimeItems(
    columns,
    snapshot,
    {
      includeVisibilityFlags: true,
    }
  ).map((item) => item.column);
  return {
    action,
    columns: runtimeColumns,
    snapshot,
    sourceColumns: [...columns],
  };
}

export function toggleColumnCustomVisible(
  visibleMap: Record<string, boolean>,
  key: string
) {
  return {
    ...visibleMap,
    [key]: visibleMap[key] === false,
  };
}

function toggleColumnCustomBooleanFlag(
  flagMap: Record<string, boolean>,
  key: string
) {
  return {
    ...flagMap,
    [key]: flagMap[key] === false,
  };
}

export function toggleAllColumnCustomVisible(
  columns: TableColumnRecord[],
  visibleMap: Record<string, boolean>
) {
  const normalized = buildColumnVisibilityMap(
    columns,
    visibleMap,
    true
  );
  const keys = Object.keys(normalized);
  if (keys.length <= 0) {
    return visibleMap;
  }
  const shouldCheck = keys.some((item) => normalized[item] === false);
  const next = {
    ...normalized,
  };
  keys.forEach((item) => {
    next[item] = shouldCheck;
  });
  return next;
}

export function toggleColumnCustomFixed(
  fixedMap: Record<string, TableColumnFixedValue>,
  key: string,
  value: TableColumnFixedValue
) {
  const current = fixedMap[key] ?? '';
  const nextValue = current === value ? '' : value;
  return {
    ...fixedMap,
    [key]: nextValue,
  };
}

export function toggleColumnCustomSortable(
  sortableMap: Record<string, boolean>,
  key: string
) {
  return toggleColumnCustomBooleanFlag(sortableMap, key);
}

export function toggleColumnCustomFilterable(
  filterableMap: Record<string, boolean>,
  key: string
) {
  return toggleColumnCustomBooleanFlag(filterableMap, key);
}

export function applyColumnCustomDragMove(
  columns: TableColumnRecord[],
  order: string[],
  dragKey: string,
  overKey: string,
  position: ColumnCustomDragPosition
) {
  const normalized = buildColumnOrder(columns, order);
  const fromIndex = normalized.findIndex((item) => item === dragKey);
  const overIndex = normalized.findIndex((item) => item === overKey);
  if (fromIndex < 0 || overIndex < 0 || fromIndex === overIndex) {
    return order;
  }
  let toIndex = position === 'bottom' ? overIndex + 1 : overIndex;
  if (fromIndex < toIndex) {
    toIndex -= 1;
  }
  if (toIndex < 0 || toIndex >= normalized.length) {
    return order;
  }
  return moveArrayItem(normalized, fromIndex, toIndex);
}

export interface ResolveColumnCustomDragPositionOptions {
  deadZoneMax?: number;
  deadZoneMin?: number;
  deadZoneRatio?: number;
  offsetY: number;
  previousPosition?: ColumnCustomDragPosition | null;
  rowHeight: number;
}

export function resolveColumnCustomDragPosition(
  options: ResolveColumnCustomDragPositionOptions
): ColumnCustomDragPosition {
  const rowHeight = Number.isFinite(options.rowHeight)
    ? Math.max(1, options.rowHeight)
    : 1;
  const offsetY = Number.isFinite(options.offsetY)
    ? options.offsetY
    : rowHeight / 2;
  const centerY = rowHeight / 2;
  const deadZone = Math.max(
    options.deadZoneMin ?? 3,
    Math.min(options.deadZoneMax ?? 10, rowHeight * (options.deadZoneRatio ?? 0.16))
  );

  if (offsetY <= centerY - deadZone) {
    return 'top';
  }
  if (offsetY >= centerY + deadZone) {
    return 'bottom';
  }
  if (options.previousPosition === 'top' || options.previousPosition === 'bottom') {
    return options.previousPosition;
  }
  return offsetY >= centerY ? 'bottom' : 'top';
}

export function createColumnCustomDragResetState(): {
  dragHover: ColumnCustomDragHoverState;
  dragState: ColumnCustomDragState;
  draggingKey: null;
} {
  return {
    dragHover: {
      overKey: null,
      position: null,
    },
    dragState: {
      dragKey: null,
      overKey: null,
      position: null,
    },
    draggingKey: null,
  };
}

export function resolveColumnCustomDraggingKey(
  draggingKey: null | string | undefined,
  dragState?: Pick<ColumnCustomDragState, 'dragKey'>
) {
  return draggingKey ?? dragState?.dragKey ?? null;
}

export function resolveColumnCustomDragStartState(key: string): {
  dragHover: ColumnCustomDragHoverState;
  dragState: ColumnCustomDragState;
  draggingKey: string;
} {
  return {
    dragHover: {
      overKey: null,
      position: null,
    },
    dragState: {
      dragKey: key,
      overKey: null,
      position: null,
    },
    draggingKey: key,
  };
}

export interface ResolveColumnCustomDragOverStateOptions {
  dragKey: null | string;
  offsetY: number;
  overKey: string;
  previousHover?: ColumnCustomDragHoverState | null;
  rowHeight: number;
}

export function resolveColumnCustomDragOverState(
  options: ResolveColumnCustomDragOverStateOptions
) {
  const dragKey = options.dragKey ?? null;
  const overKey = options.overKey;
  if (!dragKey || !overKey || dragKey === overKey) {
    return null;
  }
  const previousHover = options.previousHover ?? {
    overKey: null,
    position: null,
  };
  const position = resolveColumnCustomDragPosition({
    offsetY: options.offsetY,
    previousPosition:
      previousHover.overKey === overKey
        ? previousHover.position
        : null,
    rowHeight: options.rowHeight,
  });
  const dragHover: ColumnCustomDragHoverState = {
    overKey,
    position,
  };
  const dragState: ColumnCustomDragState = {
    dragKey,
    overKey,
    position,
  };
  const shouldQueueMove =
    previousHover.overKey !== overKey || previousHover.position !== position;
  return {
    dragHover,
    dragState,
    shouldQueueMove,
  };
}

export interface ResolveColumnCustomAutoScrollTopOptions {
  clientY: number;
  containerBottom: number;
  containerHeight: number;
  containerTop: number;
  scrollTop: number;
  stepDivider?: number;
  stepMin?: number;
  zoneMax?: number;
  zoneMin?: number;
  zoneRatio?: number;
}

export function resolveColumnCustomAutoScrollTop(
  options: ResolveColumnCustomAutoScrollTopOptions
) {
  const height = Number.isFinite(options.containerHeight)
    ? options.containerHeight
    : 0;
  if (height <= 0) {
    return options.scrollTop;
  }
  const zoneSize = Math.max(
    options.zoneMin ?? 20,
    Math.min(options.zoneMax ?? 48, height * (options.zoneRatio ?? 0.24))
  );
  const topZone = options.containerTop + zoneSize;
  const bottomZone = options.containerBottom - zoneSize;
  const stepDivider = options.stepDivider ?? 6;
  const minStep = options.stepMin ?? 4;

  let nextScrollTop = options.scrollTop;
  if (options.clientY < topZone) {
    const distance = topZone - options.clientY;
    nextScrollTop -= Math.max(minStep, Math.ceil(distance / stepDivider));
  } else if (options.clientY > bottomZone) {
    const distance = options.clientY - bottomZone;
    nextScrollTop += Math.max(minStep, Math.ceil(distance / stepDivider));
  }
  return nextScrollTop;
}

export interface CollectColumnCustomFlipOffsetsOptions {
  controls: Array<string | { key?: string }>;
  draggingKey?: null | string;
  nextRects?: Map<string, ColumnCustomFlipRect> | null;
  prevRects?: Map<string, ColumnCustomFlipRect> | null;
  threshold?: number;
}

export interface ColumnCustomFlipNodeLike {
  getBoundingClientRect: () => {
    top: number;
  };
  style: {
    transform: string;
    transition: string;
  };
}

export interface CollectColumnCustomFlipRectsOptions {
  controls: Array<string | { key?: string }>;
  resolveNode: (key: string) => ColumnCustomFlipNodeLike | null | undefined;
}

function resolveColumnCustomFlipKey(control: string | { key?: string }) {
  if (typeof control === 'string') {
    return control;
  }
  if (control && isNonEmptyString(control.key)) {
    return control.key;
  }
  return '';
}

export function collectColumnCustomFlipOffsets(
  options: CollectColumnCustomFlipOffsetsOptions
) {
  const prevRects = options.prevRects;
  const nextRects = options.nextRects;
  if (
    !prevRects ||
    !nextRects ||
    prevRects.size <= 0 ||
    nextRects.size <= 0
  ) {
    return [] as ColumnCustomFlipOffset[];
  }
  const threshold =
    typeof options.threshold === 'number' && Number.isFinite(options.threshold)
      ? Math.max(0, options.threshold)
      : 0.5;
  const draggingKey = options.draggingKey;
  const result: ColumnCustomFlipOffset[] = [];

  options.controls.forEach((control) => {
    const key = resolveColumnCustomFlipKey(control);
    if (!key || key === draggingKey) {
      return;
    }
    const prevRect = prevRects.get(key);
    const nextRect = nextRects.get(key);
    if (!prevRect || !nextRect) {
      return;
    }
    const deltaY = prevRect.top - nextRect.top;
    if (Math.abs(deltaY) < threshold) {
      return;
    }
    result.push({
      deltaY,
      key,
    });
  });

  return result;
}

export function collectColumnCustomFlipRects(
  options: CollectColumnCustomFlipRectsOptions
) {
  const rects = new Map<string, ColumnCustomFlipRect>();
  options.controls.forEach((control) => {
    const key = resolveColumnCustomFlipKey(control);
    if (!key) {
      return;
    }
    const node = options.resolveNode(key);
    if (!node) {
      return;
    }
    rects.set(key, {
      top: node.getBoundingClientRect().top,
    });
  });
  return rects;
}

export interface ApplyColumnCustomFlipOffsetsOptions {
  offsets: ColumnCustomFlipOffset[];
  resolveNode: (key: string) => ColumnCustomFlipNodeLike | null | undefined;
}

export function applyColumnCustomFlipOffsets(
  options: ApplyColumnCustomFlipOffsetsOptions
) {
  const movedNodes: ColumnCustomFlipNodeLike[] = [];
  options.offsets.forEach((offset) => {
    const node = options.resolveNode(offset.key);
    if (!node) {
      return;
    }
    node.style.transition = 'none';
    node.style.transform = `translateY(${offset.deltaY}px)`;
    movedNodes.push(node);
  });
  return movedNodes;
}

export function forceColumnCustomFlipReflow(
  nodes: Array<ColumnCustomFlipNodeLike | null | undefined>
) {
  nodes.forEach((node) => {
    node?.getBoundingClientRect();
  });
}

export function resetColumnCustomFlipTransforms(
  nodes: Array<ColumnCustomFlipNodeLike | null | undefined>
) {
  nodes.forEach((node) => {
    if (!node) {
      return;
    }
    node.style.transition = '';
    node.style.transform = '';
  });
}

export function buildColumnCustomControls(
  columns: TableColumnRecord[],
  draft: Partial<ColumnCustomSnapshot>
) {
  const sourceColumns = columns ?? [];
  const snapshot = createColumnCustomSnapshot(sourceColumns, draft, true);
  const columnMap = new Map<string, TableColumnRecord>();
  const indexMap = new Map<string, number>();

  sourceColumns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    columnMap.set(key, column);
    indexMap.set(key, index);
  });

  return snapshot.order
    .map((key, orderIndex) => {
      const column = columnMap.get(key);
      if (!column) {
        return null;
      }
      const index = indexMap.get(key) ?? 0;
      const fixed = snapshot.fixed[key];
      return {
        checked: snapshot.visible[key] !== false,
        filterable: snapshot.filterable[key] !== false,
        fixed: fixed === 'left' || fixed === 'right' ? fixed : '',
        key,
        orderIndex,
        sortable: snapshot.sortable[key] !== false,
        title: resolveColumnTitle(column, index),
      };
    })
    .filter((item): item is ColumnCustomControlItem => !!item);
}

const COLUMN_FILTER_META_KEY = '__adminTableFilterMeta';
const COLUMN_FILTER_META_FIELDS = [
  'defaultFilteredValue',
  'filterDropdown',
  'filterIcon',
  'filterMethod',
  'filterMode',
  'filterMultiple',
  'filterRecoverMethod',
  'filterRender',
  'filterResetMethod',
  'filterSearch',
  'filteredValue',
  'filters',
  'onFilter',
] as const;

type ColumnFilterMetaField = (typeof COLUMN_FILTER_META_FIELDS)[number];
type ColumnFilterMeta = Partial<Record<ColumnFilterMetaField, unknown>>;

function pickColumnFilterMeta(column: TableColumnRecord) {
  const meta: ColumnFilterMeta = {};
  COLUMN_FILTER_META_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(column, field)) {
      meta[field] = column[field];
    }
  });
  return meta;
}

function hasColumnFilterMeta(meta: ColumnFilterMeta) {
  return Object.keys(meta).length > 0;
}

export function buildColumnRuntimeItems(
  columns: TableColumnRecord[],
  snapshot: Partial<ColumnCustomSnapshot>,
  options: {
    includeVisibilityFlags?: boolean;
  } = {}
) {
  const includeVisibilityFlags = options.includeVisibilityFlags !== false;
  const sourceColumns = columns ?? [];
  const normalized = createColumnCustomSnapshot(sourceColumns, snapshot, true);
  const columnMap = new Map<string, TableColumnRecord>();
  const indexMap = new Map<string, number>();

  sourceColumns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    columnMap.set(key, column);
    indexMap.set(key, index);
  });

  return normalized.order
    .map((key) => {
      const sourceColumn = columnMap.get(key);
      if (!sourceColumn) {
        return null;
      }
      const sourceIndex = indexMap.get(key) ?? 0;
      const visible = normalized.visible[key] !== false;
      const fixed = normalized.fixed[key];
      const sortable = normalized.sortable[key] !== false;
      const filterable = normalized.filterable[key] !== false;
      const nextColumn: TableColumnRecord = {
        ...sourceColumn,
      };

      const sourceFilterMeta = (
        nextColumn[COLUMN_FILTER_META_KEY] ??
        pickColumnFilterMeta(sourceColumn)
      ) as ColumnFilterMeta;
      if (hasColumnFilterMeta(sourceFilterMeta)) {
        nextColumn[COLUMN_FILTER_META_KEY] = sourceFilterMeta;
      }

      if (fixed === 'left' || fixed === 'right') {
        nextColumn.fixed = fixed;
      } else {
        delete nextColumn.fixed;
      }

      nextColumn.sortable = sortable;

      if (filterable) {
        if (hasColumnFilterMeta(sourceFilterMeta)) {
          COLUMN_FILTER_META_FIELDS.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(sourceFilterMeta, field)) {
              nextColumn[field] = sourceFilterMeta[field];
            }
          });
        }
      } else {
        COLUMN_FILTER_META_FIELDS.forEach((field) => {
          delete nextColumn[field];
        });
      }
      nextColumn.filterable = filterable;

      if (includeVisibilityFlags) {
        nextColumn.hidden = !visible;
        nextColumn.visible = visible;
      } else {
        delete nextColumn.hidden;
        delete nextColumn.visible;
      }

      return {
        column: nextColumn,
        filterable,
        fixed: fixed === 'left' || fixed === 'right' ? fixed : '',
        key,
        sortable,
        sourceIndex,
        visible,
      };
    })
    .filter((item): item is ColumnRuntimeItem => !!item);
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

export function resolveToolbarInlinePosition(
  position: ToolbarInlinePosition | unknown,
  fallback: ResolvedToolbarInlinePosition = 'after'
): ResolvedToolbarInlinePosition {
  if (position === 'before' || position === 'left') {
    return 'before';
  }
  if (position === 'after' || position === 'right') {
    return 'after';
  }
  return fallback;
}

export function resolveToolbarToolsSlotPosition(
  position: ToolbarToolsSlotPosition | unknown
): ResolvedToolbarToolsSlotPosition {
  if (position === 'replace') {
    return 'replace';
  }
  return resolveToolbarInlinePosition(position, 'after');
}

function resolveToolbarHintAlign(
  align: ToolbarHintConfig['align'] | unknown
): ToolbarHintAlign {
  if (align === 'left' || align === 'right' || align === 'center') {
    return align;
  }
  return 'center';
}

function resolveToolbarHintOverflow(
  overflow: ToolbarHintConfig['overflow'] | unknown
): ToolbarHintOverflow {
  return overflow === 'scroll' ? 'scroll' : 'wrap';
}

function normalizeToolbarHintText(value: ToolbarHintConfig) {
  const text = isNonEmptyString(value.text)
    ? value.text
    : isNonEmptyString(value.content)
      ? value.content
      : '';
  return text.trim();
}

function normalizeToolbarHintFontSize(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return `${value}px`;
  }
  if (isNonEmptyString(value)) {
    return value.trim();
  }
  return undefined;
}

function normalizeToolbarHintSpeed(value: unknown) {
  const source =
    typeof value === 'number'
      ? value
      : isNonEmptyString(value)
        ? Number(value)
        : NaN;
  if (!Number.isFinite(source) || source <= 0) {
    return 14;
  }
  return Math.max(4, Math.min(120, source));
}

export function resolveToolbarHintConfig(
  hint: ToolbarConfig['hint'] | unknown
): ResolvedToolbarHintConfig | undefined {
  if (hint === undefined || hint === null || hint === false) {
    return undefined;
  }
  if (isNonEmptyString(hint)) {
    return {
      align: 'center',
      overflow: 'wrap',
      speed: 14,
      text: hint.trim(),
    };
  }
  if (!isPlainObject(hint)) {
    return undefined;
  }

  const text = normalizeToolbarHintText(hint as ToolbarHintConfig);
  if (!text) {
    return undefined;
  }

  const config = hint as ToolbarHintConfig;
  return {
    align: resolveToolbarHintAlign(config.align),
    color: isNonEmptyString(config.color) ? config.color.trim() : undefined,
    fontSize: normalizeToolbarHintFontSize(config.fontSize),
    overflow: resolveToolbarHintOverflow(config.overflow),
    speed: normalizeToolbarHintSpeed(config.speed),
    text,
  };
}

function resolveToolbarRule(
  rule: ToolbarToolRule | undefined,
  fallback: boolean,
  context: ToolbarToolRuleContext
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

function resolveExplicitToolbarToolText(tool: ToolbarToolConfig) {
  if (isNonEmptyString(tool.title)) {
    return tool.title.trim();
  }
  if (isNonEmptyString(tool.label)) {
    return tool.label.trim();
  }
  if (isNonEmptyString(tool.name)) {
    return tool.name.trim();
  }
  return undefined;
}

function normalizeToolbarToolIconClass(icon: unknown) {
  if (!isNonEmptyString(icon)) {
    return undefined;
  }
  return icon.trim();
}

export function resolveToolbarActionPresentation(
  tool?: Pick<ResolvedToolbarActionTool, 'icon' | 'text' | 'title'> | null
): ResolvedToolbarActionPresentation {
  const iconClass = normalizeToolbarToolIconClass(tool?.icon);
  const hasIcon = !!iconClass;
  const explicitText = isNonEmptyString(tool?.text) ? tool?.text.trim() : '';
  const fallbackText =
    !hasIcon && isNonEmptyString(tool?.title) ? tool?.title.trim() : '';
  const text = explicitText || fallbackText;
  return {
    hasIcon,
    iconClass,
    iconOnly: hasIcon && !text,
    text,
  };
}

function normalizeToolbarClassTokens(value: unknown): string[] {
  if (isNonEmptyString(value)) {
    return value
      .split(' ')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeToolbarClassTokens(item));
  }
  if (isPlainObject(value)) {
    return Object.entries(value)
      .filter(([, enabled]) => !!enabled)
      .map(([className]) => className.trim())
      .filter((className) => className.length > 0);
  }
  return [];
}

export function resolveToolbarActionButtonClassState(
  tool?: (null | Pick<ToolbarToolConfig, 'attrs' | 'type'> | Record<string, any>)
): ResolvedToolbarActionButtonClassState {
  const presentation = resolveToolbarActionPresentation(tool as any);
  const attrs = isPlainObject(tool?.attrs) ? (tool?.attrs as Record<string, any>) : {};
  const classList = presentation.iconOnly
    ? ['admin-table__toolbar-tool-btn']
    : [
        'admin-table__toolbar-action-btn',
        'admin-table__toolbar-slot-btn',
        resolveToolbarActionTypeClass(tool?.type),
        resolveToolbarActionThemeClass(tool as any),
      ];
  if (presentation.hasIcon && presentation.text) {
    classList.push('has-icon');
  }
  classList.push(
    ...normalizeToolbarClassTokens(attrs.class),
    ...normalizeToolbarClassTokens((attrs as Record<string, any>).className),
    ...normalizeToolbarClassTokens((tool as Record<string, any>)?.class),
    ...normalizeToolbarClassTokens((tool as Record<string, any>)?.className)
  );
  return {
    classList: classList.filter((item) => item.length > 0),
    presentation,
  };
}

export function resolveToolbarActionButtonRenderState(
  tool: null | Record<string, any> | undefined,
  options: {
    keyPrefix?: string;
  } = {}
): ResolvedToolbarActionButtonRenderState {
  const sourceTool = isPlainObject(tool) ? tool : {};
  const attrs = isPlainObject(sourceTool.attrs)
    ? { ...(sourceTool.attrs as Record<string, any>) }
    : {};
  delete attrs.class;
  delete attrs.className;
  const classState = resolveToolbarActionButtonClassState(sourceTool);
  const keyPrefix = isNonEmptyString(options.keyPrefix)
    ? options.keyPrefix.trim()
    : 'tool';
  const index = typeof sourceTool.index === 'number'
    ? sourceTool.index
    : 0;
  return {
    ...classState,
    attrs,
    disabled: !!sourceTool.disabled,
    key: `${sourceTool.code ?? sourceTool.title ?? keyPrefix}-${index}`,
    title: isNonEmptyString(sourceTool.title)
      ? sourceTool.title.trim()
      : undefined,
  };
}

function resolvePermissionMode(
  permission: Record<string, any>
): 'and' | 'or' {
  if (permission.mode === 'and' || permission.mode === 'or') {
    return permission.mode;
  }
  if (permission.modifiers?.and) {
    return 'and';
  }
  if (permission.modifiers?.or) {
    return 'or';
  }
  if (Object.prototype.hasOwnProperty.call(permission, 'and')) {
    return 'and';
  }
  if (Object.prototype.hasOwnProperty.call(permission, 'or')) {
    return 'or';
  }
  return 'or';
}

function normalizeAccessValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    const next = value.trim();
    return next ? [next] : [];
  }
  return [];
}

function resolveToolbarAccessSource(source: ToolbarAccessValueSource): string[] {
  if (typeof source === 'function') {
    try {
      return normalizeAccessValues(source());
    } catch {
      return [];
    }
  }
  return normalizeAccessValues(source);
}

function resolveToolbarPermissionValues(
  permission: Record<string, any>,
  mode: 'and' | 'or'
): string[] {
  const directValues = normalizeAccessValues(permission.value);
  if (directValues.length > 0) {
    return directValues;
  }
  const modeValues = normalizeAccessValues(permission[mode]);
  if (modeValues.length > 0) {
    return modeValues;
  }
  return normalizeAccessValues(permission[mode === 'and' ? 'or' : 'and']);
}

export function evaluateToolbarToolPermission(
  permission: Record<string, any> | null | undefined,
  options: ToolbarPermissionResolveOptions = {}
) {
  if (!permission || !isPlainObject(permission)) {
    return options.defaultWhenNoAccess ?? false;
  }
  const mode = resolvePermissionMode(permission);
  const values = resolveToolbarPermissionValues(permission, mode);
  if (values.length <= 0) {
    return options.defaultWhenNoAccess ?? false;
  }
  const targetValues =
    permission.arg === 'role'
      ? resolveToolbarAccessSource(options.accessRoles)
      : resolveToolbarAccessSource(options.accessCodes);
  if (targetValues.length <= 0) {
    return options.defaultWhenNoAccess ?? false;
  }
  const valueSet = new Set(targetValues);
  const matchedCount = values.filter((item) => valueSet.has(item)).length;
  return mode === 'and'
    ? matchedCount === values.length
    : matchedCount > 0;
}

export function shouldRenderToolbarTool(
  tool: Record<string, any> | null | undefined,
  options: ToolbarToolRenderOptions = {}
) {
  const permission = tool?.permission;
  if (!permission) {
    return true;
  }
  const checker = options.permissionChecker;
  if (typeof checker === 'function') {
    try {
      return !!checker(permission, tool ?? {});
    } catch {
      return true;
    }
  }
  return evaluateToolbarToolPermission(permission, options);
}

export function resolveToolbarToolVisibility(
  tool: Record<string, any> | null | undefined,
  options: ToolbarToolVisibilityOptions = {}
) {
  if (!tool) {
    return false;
  }
  const hasAccessSource =
    options.accessCodes !== undefined || options.accessRoles !== undefined;
  const useDirectiveWhenNoAccess = options.useDirectiveWhenNoAccess === true;
  if (
    !shouldRenderToolbarTool(tool, {
      ...options,
      defaultWhenNoAccess: hasAccessSource
        ? false
        : useDirectiveWhenNoAccess
          ? true
          : options.defaultWhenNoAccess,
    })
  ) {
    return false;
  }
  if (!tool.permission) {
    return true;
  }
  if (typeof options.permissionChecker === 'function' || hasAccessSource) {
    return true;
  }
  if (!useDirectiveWhenNoAccess) {
    return true;
  }
  return options.directiveRenderer
    ? options.directiveRenderer(tool)
    : false;
}

export interface ResolveVisibleToolbarActionToolsOptions
  extends ToolbarToolVisibilityOptions {
  excludeCodes?: string[];
  maximized?: boolean;
  showSearchForm?: boolean;
  tools?: ToolbarConfig['tools'];
}

export interface ResolveVisibleOperationActionToolsOptions
  extends Omit<ResolveVisibleToolbarActionToolsOptions, 'tools'> {
  operationColumn?: boolean | TableOperationColumnConfig | null;
}

export function resolveVisibleToolbarActionTools(
  options: ResolveVisibleToolbarActionToolsOptions = {}
) {
  const {
    excludeCodes,
    maximized,
    showSearchForm,
    tools,
    ...visibilityOptions
  } = options;
  const excludeCodeSet = new Set(
    Array.isArray(excludeCodes)
      ? excludeCodes
        .map((code) => (isNonEmptyString(code) ? code.trim() : ''))
        .filter((code) => code.length > 0)
      : []
  );
  return resolveToolbarActionTools(tools, {
    maximized,
    showSearchForm,
  })
    .filter((tool) => {
      if (!isNonEmptyString(tool.code)) {
        return true;
      }
      return !excludeCodeSet.has(tool.code.trim());
    })
    .filter((tool) => resolveToolbarToolVisibility(tool, visibilityOptions));
}

export function resolveVisibleOperationActionTools(
  options: ResolveVisibleOperationActionToolsOptions = {}
) {
  return resolveVisibleToolbarActionTools({
    ...options,
    tools: resolveOperationColumnTools(options.operationColumn),
  });
}

export function resolveToolbarActionTypeClass(type: unknown) {
  const value = typeof type === 'string' ? type.trim().toLowerCase() : '';
  if (!value || value === 'default') {
    return '';
  }
  if (value === 'clear' || value === 'text' || value === 'text-clear') {
    return 'is-clear';
  }
  const semanticTypes = new Set([
    'primary',
    'success',
    'warning',
    'danger',
    'error',
    'info',
  ]);
  if (semanticTypes.has(value)) {
    return `is-${value}`;
  }

  const suffixMatched = value.match(
    /^(primary|success|warning|danger|error|info)-(outline|border|text)$/
  );
  if (suffixMatched) {
    const [, color, variant] = suffixMatched;
    return variant === 'text'
      ? `is-${color}-text`
      : `is-${color}-outline`;
  }

  const prefixMatched = value.match(
    /^(outline|border|text)-(primary|success|warning|danger|error|info)$/
  );
  if (prefixMatched) {
    const [, variant, color] = prefixMatched;
    return variant === 'text'
      ? `is-${color}-text`
      : `is-${color}-outline`;
  }
  return '';
}

export function resolveToolbarActionThemeClass(
  tool: null | Pick<ToolbarToolConfig, 'followTheme' | 'themeColor' | 'type'> | undefined
) {
  if (!tool) {
    return '';
  }
  const followTheme = typeof tool.followTheme === 'boolean'
    ? tool.followTheme
    : typeof tool.themeColor === 'boolean'
      ? tool.themeColor
      : false;
  if (followTheme !== false) {
    return '';
  }
  const typeClass = resolveToolbarActionTypeClass(tool.type);
  if (!typeClass) {
    return '';
  }
  if (
    typeClass === 'is-primary' ||
    typeClass === 'is-primary-outline' ||
    typeClass === 'is-primary-text' ||
    typeClass === 'is-clear'
  ) {
    return '';
  }
  return 'is-static-color';
}

function normalizeToolbarPermission(
  permission: ToolbarToolConfig['permission']
): ToolbarToolPermissionDirective | undefined {
  if (permission === undefined || permission === null || permission === false) {
    return undefined;
  }

  if (Array.isArray(permission) || isNonEmptyString(permission)) {
    return {
      arg: 'code',
      mode: 'or',
      modifiers: {
        or: true,
      },
      name: 'access',
      value: permission,
    };
  }

  if (!isPlainObject(permission)) {
    return undefined;
  }

  const mode = resolvePermissionMode(permission);
  const hasValue = Object.prototype.hasOwnProperty.call(permission, 'value');
  const modeValue = permission[mode];
  const fallbackModeValue = permission[mode === 'and' ? 'or' : 'and'];
  const modifiers = isPlainObject(permission.modifiers)
    ? { ...(permission.modifiers as Record<string, boolean>) }
    : {};

  if (
    !Object.prototype.hasOwnProperty.call(modifiers, 'and') &&
    !Object.prototype.hasOwnProperty.call(modifiers, 'or')
  ) {
    modifiers[mode] = true;
  }

  return {
    and: permission.and,
    arg: isNonEmptyString(permission.arg) ? permission.arg : 'code',
    mode,
    modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
    name: isNonEmptyString(permission.name) ? permission.name : 'access',
    or: permission.or,
    value: hasValue
      ? permission.value
      : modeValue ?? fallbackModeValue ?? permission,
  };
}

export function resolveToolbarActionTools(
  tools: ToolbarConfig['tools'] | undefined,
  options: {
    maximized?: boolean;
    showSearchForm?: boolean;
  } = {}
): ResolvedToolbarActionTool[] {
  const list = Array.isArray(tools) ? tools : [];
  const resolved: ResolvedToolbarActionTool[] = [];

  list.forEach((rawTool, index) => {
    const tool = (isPlainObject(rawTool) ? rawTool : {}) as ToolbarToolConfig;
    const context: ToolbarToolRuleContext = {
      index,
      maximized: options.maximized,
      showSearchForm: options.showSearchForm,
      tool,
    };

    const showRule = (tool.show ?? tool.ifShow ?? tool.visible) as ToolbarToolRule | undefined;
    if (!resolveToolbarRule(showRule, true, context)) {
      return;
    }

    const disabled = resolveToolbarRule(tool.disabled, false, context);
    const explicitText = resolveExplicitToolbarToolText(tool);
    const title = explicitText
      ? explicitText
      : isNonEmptyString(tool.code)
        ? tool.code
        : `Tool-${index + 1}`;
    const rawPermission = (tool.permission ?? tool.auth) as ToolbarToolConfig['permission'];
    if (rawPermission === false) {
      return;
    }
    const permission = normalizeToolbarPermission(rawPermission);

    resolved.push({
      ...tool,
      disabled,
      index,
      permission,
      text: explicitText,
      title,
    });
  });

  return resolved;
}

export function triggerToolbarActionTool(
  tool: Record<string, any> | undefined,
  index: number,
  options: {
    onToolbarToolClick?: (payload: ToolbarActionEventPayload) => void;
  } = {}
) {
  const payload = {
    code: tool?.code,
    tool,
  };

  options.onToolbarToolClick?.(payload);

  const handler = tool?.onClick;
  if (typeof handler === 'function') {
    handler({
      ...payload,
      index,
    } as ToolbarActionToolPayload);
  }
}

export function triggerOperationActionTool(
  tool: Record<string, any> | undefined,
  index: number,
  options: {
    onOperationToolClick?: (payload: ToolbarOperationEventPayload) => void;
    row?: Record<string, any>;
    rowIndex?: number;
  } = {}
) {
  const payload = {
    code: tool?.code,
    row: options.row,
    rowIndex: options.rowIndex,
    tool,
  };

  options.onOperationToolClick?.(payload);

  const handler = tool?.onClick;
  if (typeof handler === 'function') {
    handler({
      ...payload,
      index,
    } as ToolbarOperationToolPayload);
  }
}

export function isProxyEnabled(proxyConfig?: Record<string, any> | null) {
  return !!proxyConfig?.enabled && !!proxyConfig?.ajax;
}

export function shouldShowSeparator(options: {
  hasFormOptions?: boolean;
  separator?: boolean | SeparatorOptions;
  showSearchForm?: boolean;
}) {
  const { hasFormOptions, separator, showSearchForm } = options;
  if (!hasFormOptions || showSearchForm === false || separator === false) {
    return false;
  }
  if (separator === undefined || separator === true) {
    return true;
  }
  return separator.show !== false;
}

export function getSeparatorStyle(separator?: boolean | SeparatorOptions) {
  if (!separator || typeof separator === 'boolean') {
    return undefined;
  }
  if (!isNonEmptyString(separator.backgroundColor)) {
    return undefined;
  }
  return {
    backgroundColor: separator.backgroundColor,
  };
}
