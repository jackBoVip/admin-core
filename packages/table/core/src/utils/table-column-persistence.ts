import type {
  ColumnCustomPersistenceConfig,
  ColumnCustomState,
} from '../types';
import type { TableColumnRecord } from './table-contracts';
import { resolveColumnKey } from './table-columns';
import {
  isTableNonEmptyString,
  isTablePlainObject,
} from './table-permission';

export interface ResolvedColumnCustomPersistenceConfig {
  enabled: boolean;
  key: string;
  storage: 'local' | 'session';
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

function buildColumnCustomPersistenceKey(
  columns?: TableColumnRecord[],
  scope?: string
) {
  const normalizedScope = isTableNonEmptyString(scope)
    ? scope.trim()
    : '';
  const source = normalizedScope
    ? `${getPathnameForPersistence()}::${normalizedScope}::${getColumnPersistenceSignature(columns)}`
    : `${getPathnameForPersistence()}::${getColumnPersistenceSignature(columns)}`;
  return `admin-table:column-custom:${hashString(source)}`;
}

function resolveColumnCustomPersistenceStorage(
  value: unknown
): 'local' | 'session' {
  return value === 'session' ? 'session' : 'local';
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

export function resolveColumnCustomPersistenceConfig(
  gridOptions?: Record<string, any>,
  columns?: TableColumnRecord[]
): ResolvedColumnCustomPersistenceConfig | undefined {
  if (!isTablePlainObject(gridOptions)) {
    return undefined;
  }
  const raw = gridOptions.columnCustomPersistence;
  if (raw === undefined || raw === null || raw === false) {
    return undefined;
  }

  let rawConfig: ColumnCustomPersistenceConfig | null = null;
  if (isTablePlainObject(raw)) {
    rawConfig = raw as ColumnCustomPersistenceConfig;
  }

  const enabled = rawConfig ? rawConfig.enabled !== false : true;
  if (!enabled) {
    return undefined;
  }

  const scope = isTableNonEmptyString(rawConfig?.scope)
    ? rawConfig.scope.trim()
    : isTableNonEmptyString(gridOptions.tableId)
      ? gridOptions.tableId.trim()
      : '';
  const key = isTableNonEmptyString(rawConfig?.key)
    ? rawConfig?.key
    : buildColumnCustomPersistenceKey(columns, scope);
  const storage = resolveColumnCustomPersistenceStorage(rawConfig?.storage);

  return {
    enabled: true,
    key,
    storage,
  };
}

export function resolveColumnCustomState(
  gridOptions?: Record<string, any>
): ColumnCustomState | undefined {
  if (!isTablePlainObject(gridOptions)) {
    return undefined;
  }
  if (isTablePlainObject(gridOptions.columnCustomState)) {
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
    if (!isTablePlainObject(parsed)) {
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
