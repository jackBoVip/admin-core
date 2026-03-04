/**
 * Table Core 列模型工具。
 * @description 提供列键解析、标题解析、字段取值与列类型判定能力。
 */
import type { TableColumnRecord } from './table-contracts';
import {
  isTableNonEmptyString,
  isTablePlainObject,
} from './table-permission';

/**
 * 解析列的稳定标识。
 * 优先使用 `key`，其次 `dataIndex`、`field`，最后回退为基于索引的默认值。
 *
 * @param column 列配置对象。
 * @param index 当前列在列数组中的序号（从 0 开始）。
 * @returns 可用于缓存、对比和渲染追踪的列唯一键。
 */
export function resolveColumnKey(column: TableColumnRecord, index: number) {
  return String(column.key ?? column.dataIndex ?? column.field ?? `column-${index}`);
}

/**
 * 解析列标题文本。
 * 优先级：`title` > `field` > `dataIndex` > `Column N`。
 *
 * @param column 列配置对象。
 * @param index 当前列在列数组中的序号（从 0 开始）。
 * @returns 最终用于展示的列标题。
 */
export function resolveColumnTitle(column: TableColumnRecord, index: number) {
  if (isTableNonEmptyString(column.title)) {
    return column.title;
  }
  if (isTableNonEmptyString(column.field)) {
    return column.field;
  }
  if (isTableNonEmptyString(column.dataIndex)) {
    return column.dataIndex;
  }
  return `Column ${index + 1}`;
}

/**
 * 解析列类型并统一为小写字符串。
 * 当列为空或类型不可识别时返回空字符串。
 *
 * @param column 列配置对象，可为空。
 * @returns 归一化后的列类型，例如 `seq`、`checkbox`、`radio`。
 */
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

/**
 * 根据字段路径读取行数据值。
 * 支持普通字段（`name`）和点路径字段（`user.profile.name`）。
 *
 * @param row 行数据对象。
 * @param field 字段路径。
 * @returns 目标字段对应的值；路径无效时返回 `undefined`。
 */
export function getColumnValueByPath(
  row: Record<string, any> | undefined,
  field?: string
) {
  if (!row || !isTableNonEmptyString(field)) {
    return undefined;
  }
  if (!field.includes('.')) {
    return row[field];
  }
  return field.split('.').reduce((value: any, key) => value?.[key], row);
}

/**
 * 根据字段路径写入行数据值。
 * 支持点路径写入，缺失的中间层级会自动补齐为空对象。
 *
 * @param row 行数据对象。
 * @param field 目标字段路径。
 * @param value 要写入的值。
 * @returns 写入是否成功。
 */
export function setColumnValueByPath(
  row: Record<string, any> | undefined,
  field: null | string | undefined,
  value: any
) {
  if (!row || !isTableNonEmptyString(field)) {
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
    if (!isTablePlainObject(nextValue)) {
      current[key] = {};
    }
    current = current[key] as Record<string, any>;
  }
  current[keys[keys.length - 1]] = value;
  return true;
}
