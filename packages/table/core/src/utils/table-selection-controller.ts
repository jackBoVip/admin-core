import { isTableNonEmptyString } from './table-permission';
import {
  alignSelectionKeysToRows,
  normalizeTableSelectionKeys,
  resolveSelectionRowsByKeys,
  type TableSelectionMode,
} from './table-selection';

export interface ResolveTableSelectionChangeOptions<
  TRow extends Record<string, any> = Record<string, any>,
  TKey = string | number,
> {
  keys: TKey[];
  mode?: TableSelectionMode;
  rowKeyField?: string;
  rows: TRow[];
}

export interface ResolvedTableSelectionChangeResult<
  TRow extends Record<string, any> = Record<string, any>,
  TKey = string | number,
> {
  alignedKeys: TKey[];
  normalizedKeys: TKey[];
  selectedRows: TRow[];
}

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
