import type { TableColumnRecord } from './table-contracts';
import {
  isTableNonEmptyString,
  isTablePlainObject,
} from './table-permission';

export function resolveColumnKey(column: TableColumnRecord, index: number) {
  return String(column.key ?? column.dataIndex ?? column.field ?? `column-${index}`);
}

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
