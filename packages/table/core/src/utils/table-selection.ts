/**
 * Table Core 选择与操作列工具。
 * @description 提供选择列、序号列、操作列相关的配置解析与数据对齐能力。
 */
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

/** 序号列默认标题文案。 */
const defaultSeqTitle = '序号';

/**
 * 表格行选择模式。
 * `checkbox` 表示多选，`radio` 表示单选。
 */
export type TableSelectionMode = 'checkbox' | 'radio';

/**
 * 解析后的序号列配置。
 * 该结构用于构建自动注入的序号列定义。
 */
export interface ResolvedTableSeqColumnConfig {
  /** 序号列的单元格对齐方式。 */
  align: string;
  /** 序号列固定位置，仅支持左右固定。 */
  fixed?: TableColumnFixedValue;
  /** 序号列键名，可用于覆盖默认键。 */
  key?: string;
  /** 序号列表头文案。 */
  title?: string;
  /** 序号列宽度。 */
  width: number | string;
}

/**
 * 解析序号列配置时的附加选项。
 */
export interface ResolveSeqColumnConfigOptions {
  /** 序号列兜底标题，优先级低于显式配置标题。 */
  title?: string;
}

/**
 * 自动补全选择列时的可选参数。
 */
export interface EnsureSelectionColumnOptions {
  /** 选择列单元格对齐方式。 */
  align?: string;
  /** 多选列宽度。 */
  checkboxWidth?: number | string;
  /** 选择列键名。 */
  key?: string;
  /** 单选列宽度。 */
  radioWidth?: number | string;
  /** 选择列表头文案。 */
  title?: string;
}

/**
 * 解析后的操作列配置。
 */
export interface ResolvedOperationColumnConfig {
  /** 操作列内容对齐方式。 */
  align: string;
  /** 透传给表格列配置的额外属性。 */
  attrs?: Record<string, any>;
  /** 操作列固定位置。 */
  fixed?: TableColumnFixedValue;
  /** 操作列键名。 */
  key: string;
  /** 操作列表头文案。 */
  title: string;
  /** 操作列宽度。 */
  width: number | string;
}

/**
 * 将选中键同步回行数据勾选字段时的参数。
 */
export interface ApplySelectionCheckFieldToRowsOptions {
  /** 需要回写的勾选字段路径。 */
  checkField: string;
  /** 子节点字段名，默认 `children`。 */
  childrenField?: string;
  /** 行主键字段名。 */
  keyField: string;
  /** 当前选中主键集合。 */
  selectedKeys: unknown[];
}

/**
 * 按勾选字段收集选中键的参数。
 */
export interface CollectSelectionKeysByFieldOptions {
  /** 勾选状态字段路径。 */
  checkField: null | string | undefined;
  /** 行主键字段名。 */
  keyField: string;
  /** 选择模式。 */
  mode: TableSelectionMode;
}

/**
 * 按行数组收集选中键的参数。
 */
export interface CollectSelectionKeysByRowsOptions {
  /** 行主键字段名。 */
  keyField: string;
  /** 可选的选择模式。 */
  mode?: TableSelectionMode;
}

/**
 * 通过选中键反查行数据时的参数。
 */
export interface ResolveSelectionRowsByKeysOptions {
  /** 行主键字段名。 */
  keyField: string;
  /** 当前选中键数组。 */
  selectedKeys: unknown[] | undefined;
}

/**
 * 行点击选中行为参数。
 * @template TKey 选中键类型。
 */
export interface ResolveRowClickSelectionKeysOptions<TKey = string | number> {
  /** 点击前的选中键数组。 */
  currentKeys: TKey[];
  /** 当前选择模式。 */
  mode: TableSelectionMode;
  /** 被点击行的主键。 */
  rowKey: null | TKey | undefined;
  /** 是否严格单选；`false` 时允许再次点击取消。 */
  strict?: boolean;
}

/**
 * 回写勾选字段后的行数据结果。
 * @template TRow 行数据类型。
 */
export interface ApplySelectionCheckFieldToRowsResult<TRow extends Record<string, any>> {
  /** 行数据是否发生变更。 */
  changed: boolean;
  /** 行数据集合。 */
  rows: TRow[];
}

/**
 * 判断列定义是否为序号列。
 * @param column 待判断的列配置。
 * @returns 命中序号列类型时返回 `true`。
 */
export function isSeqColumnTypeColumn(
  column: TableColumnRecord | null | undefined
) {
  return resolveColumnType(column) === 'seq';
}

/**
 * 在列集合中查找首个序号列。
 * @param columns 列定义数组。
 * @returns 命中的序号列；未命中时返回 `undefined`。
 */
export function resolveSeqColumn(columns: TableColumnRecord[] = []) {
  return columns.find((column) => isSeqColumnTypeColumn(column));
}

/**
 * 解析并标准化序号列配置。
 * @param value 原始序号列配置。`false/null/undefined` 表示关闭序号列。
 * @param options 额外解析选项。
 * @returns 序号列标准配置；当功能被禁用时返回 `undefined`。
 */
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

/**
 * 确保列集合包含序号列。
 * 当已存在序号列或序号功能关闭时保持原数组；否则在头部注入序号列。
 * @param columns 原始列定义数组。
 * @param seqColumn 序号列开关或配置。
 * @param options 解析序号列时的附加选项。
 * @returns 处理后的列数组。
 */
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

/**
 * 判断列定义是否为选择列（单选或多选）。
 * @param column 待判断的列配置。
 * @param mode 可选模式过滤；传入后仅匹配指定模式。
 * @returns 命中目标选择列类型时返回 `true`。
 */
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

/**
 * 在列集合中查找首个选择列。
 * @param columns 列定义数组。
 * @param mode 可选模式过滤。
 * @returns 命中的选择列；未命中时返回 `undefined`。
 */
export function resolveSelectionColumn(
  columns: TableColumnRecord[] = [],
  mode?: TableSelectionMode
) {
  return columns.find((column) => isSelectionColumnTypeColumn(column, mode));
}

/**
 * 推导表格当前使用的行选择模式。
 * 优先级：`rowSelection.type/selectionType` > `radioConfig` > `checkboxConfig` > 列定义中的选择列类型。
 * @param gridOptions 表格配置对象。
 * @param columns 当前列定义数组。
 * @returns 推导出的选择模式；无法确定时返回 `undefined`。
 */
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

/**
 * 确保列集合中存在与模式匹配的选择列。
 * 当未指定模式或已存在选择列时保持原数组；否则在列头部注入选择列。
 * @param columns 原始列定义数组。
 * @param mode 目标选择模式。
 * @param options 注入选择列时的宽度、标题等配置。
 * @returns 处理后的列数组。
 */
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

/**
 * 将树形行数据拍平为一维数组。
 * 默认通过 `children` 字段递归遍历子节点。
 * @template T 行数据类型。
 * @param rows 原始行数组（可包含树节点）。
 * @returns 按深度优先顺序展开后的行数组。
 */
export function flattenTableRows<T extends Record<string, any>>(rows: T[]) {
  const result: T[] = [];

  /**
   * 深度优先遍历树形数据并写入拍平结果。
   * @param list 当前层级行数据。
   * @returns 无返回值。
   */
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

/**
 * 规范化选中键数组。
 * 会先去重；当模式为单选时仅保留第一项。
 * @template TKey 选中键类型。
 * @param keys 原始选中键输入。
 * @param mode 选择模式。
 * @returns 规范化后的选中键数组。
 */
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

/**
 * 将任意选中键转换为可比较的字符串键。
 * 仅支持 `string/number/bigint`，其余类型返回 `null`。
 * @param key 原始键值。
 * @returns 可比较键字符串或 `null`。
 */
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

/**
 * 创建可比较选中键集合。
 * 内部会过滤不可比较的键值。
 * @param keys 原始选中键数组。
 * @returns 由标准化键字符串构成的集合。
 */
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

/**
 * 根据勾选字段从行数据中收集选中键。
 * 常用于将 `checkField` 布尔状态映射为 `selectedRowKeys`。
 * @template TRow 行数据类型。
 * @template TKey 主键类型。
 * @param rows 行数据数组。
 * @param options 收集参数。
 * @returns 按模式规范化后的选中键数组。
 */
export function collectSelectionKeysByField<
  TRow extends Record<string, any>,
  TKey = string | number
>(
  rows: TRow[],
  options: CollectSelectionKeysByFieldOptions
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

/**
 * 直接根据行数组收集主键作为选中键。
 * 会先展开树形数据；指定模式时会按模式进一步归一化。
 * @template TRow 行数据类型。
 * @template TKey 主键类型。
 * @param rows 行数据数组。
 * @param options 收集参数。
 * @returns 主键数组；若提供模式则返回模式约束后的结果。
 */
export function collectSelectionKeysByRows<
  TRow extends Record<string, any>,
  TKey = string | number
>(
  rows: TRow[],
  options: CollectSelectionKeysByRowsOptions
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

/**
 * 根据选中键反查对应的行数据。
 * 会先展开树形数据，再通过可比较键匹配。
 * @template TRow 行数据类型。
 * @param rows 行数据数组。
 * @param options 反查参数。
 * @returns 与选中键匹配的行数据集合。
 */
export function resolveSelectionRowsByKeys<
  TRow extends Record<string, any>
>(
  rows: TRow[],
  options: ResolveSelectionRowsByKeysOptions
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

/**
 * 将外部选中键对齐到当前行主键值。
 * 用于解决键类型不一致（如数字/字符串）带来的回显问题，并去除重复键。
 * @template TRow 行数据类型。
 * @template TKey 主键类型。
 * @param keys 原始选中键数组。
 * @param rows 当前行数据数组。
 * @param keyField 行主键字段名。
 * @returns 与当前行数据对齐后的选中键数组。
 */
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

/**
 * 计算“点击行”后的选中键结果。
 * 单选模式下默认覆盖为当前行；当 `strict=false` 且点击已选中行时可取消选中。
 * 多选模式下执行切换逻辑（存在则移除，不存在则追加）。
 * @template TKey 选中键类型。
 * @param options 点击行为参数。
 * @returns 新的选中键数组；当行键无效时返回 `undefined`。
 */
export function resolveRowClickSelectionKeys<TKey = string | number>(
  options: ResolveRowClickSelectionKeysOptions<TKey>
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

/**
 * 解析并标准化操作列配置。
 * 支持布尔开关与对象配置，内部会补齐键名、标题、对齐、固定位置和宽度默认值。
 * @param operationColumn 原始操作列配置。
 * @param localeText 本地化文案（用于默认标题）。
 * @returns 操作列标准配置；关闭时返回 `undefined`。
 */
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

/**
 * 提取操作列工具项配置。
 * 仅当操作列配置为对象且 `tools` 为数组时返回对应列表。
 * @param operationColumn 原始操作列配置。
 * @returns 操作工具项数组。
 */
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

/**
 * 将对齐值映射为操作列单元格样式类名。
 * @param align 对齐值。
 * @returns 对应的对齐类名。
 */
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

/**
 * 按选中键集合回写行数据中的勾选字段。
 * 会递归处理树形子节点，仅在字段值发生变化时复制并更新对应行。
 * @template TRow 行数据类型。
 * @param rows 原始行数据。
 * @param options 回写参数。
 * @returns 包含是否发生变更与最终行数组的结果对象。
 */
export function applySelectionCheckFieldToRows<
  TRow extends Record<string, any> = Record<string, any>,
>(
  rows: TRow[] | undefined,
  options: ApplySelectionCheckFieldToRowsOptions
): ApplySelectionCheckFieldToRowsResult<TRow> {
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

  /**
   * 递归遍历树形行数据并同步勾选字段值。
   * @param list 待处理的行列表。
   * @returns 是否发生变更及处理后的行列表。
   */
  const walk = (list: TRow[]): ApplySelectionCheckFieldToRowsResult<TRow> => {
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
