/**
 * Table Core 选择控制器工具。
 * @description 处理选择变化输入归一、键值对齐与回传载荷构建。
 */
import { isTableNonEmptyString } from './table-permission';
import {
  alignSelectionKeysToRows,
  normalizeTableSelectionKeys,
  resolveSelectionRowsByKeys,
  type TableSelectionMode,
} from './table-selection';

/**
 * 处理表格选中变更时的输入参数。
 */
export interface ResolveTableSelectionChangeOptions<
  TRow extends Record<string, any> = Record<string, any>,
  TKey = string | number,
> {
  /** 原始选中键数组。 */
  keys: TKey[];
  /** 选择模式。未提供时不执行解析。 */
  mode?: TableSelectionMode;
  /** 行主键字段名，默认 `id`。 */
  rowKeyField?: string;
  /** 当前数据源行数组。 */
  rows: TRow[];
}

/**
 * 表格选中变更的标准化输出结果。
 */
export interface ResolvedTableSelectionChangeResult<
  TRow extends Record<string, any> = Record<string, any>,
  TKey = string | number,
> {
  /** 与当前数据主键类型对齐后的选中键。 */
  alignedKeys: TKey[];
  /** 按模式约束并去重后的选中键。 */
  normalizedKeys: TKey[];
  /** 由选中键反查得到的已选行数据。 */
  selectedRows: TRow[];
}

/**
 * 统一处理表格选中变更结果。
 * 包含键值归一化、键值与行数据对齐、以及选中行反查三步。
 * @template TRow 行数据类型。
 * @template TKey 主键类型。
 * @param options 选中变更输入参数。
 * @returns 标准化结果；未提供选择模式时返回 `undefined`。
 */
export function resolveTableSelectionChange<
  TRow extends Record<string, any> = Record<string, any>,
  TKey = string | number,
>(
  options: ResolveTableSelectionChangeOptions<TRow, TKey>
): ResolvedTableSelectionChangeResult<TRow, TKey> | undefined {
  const mode = options.mode;
  if (!mode) {
    return undefined;
  }
  const rowKeyField = isTableNonEmptyString(options.rowKeyField)
    ? options.rowKeyField.trim()
    : 'id';
  const rows = Array.isArray(options.rows) ? options.rows : [];
  const normalizedKeys = normalizeTableSelectionKeys<TKey>(options.keys, mode);
  const alignedKeys = alignSelectionKeysToRows<TRow, TKey>(
    normalizedKeys,
    rows,
    rowKeyField
  );
  return {
    alignedKeys,
    normalizedKeys,
    selectedRows: resolveSelectionRowsByKeys(rows, {
      keyField: rowKeyField,
      selectedKeys: alignedKeys,
    }),
  };
}
