/**
 * Table Core 列自定义持久化工具。
 * @description 负责列自定义状态序列化、反序列化与本地存储读写。
 */
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

/**
 * 列自定义状态持久化配置解析结果。
 */
export interface ResolvedColumnCustomPersistenceConfig {
  /** 是否启用持久化。 */
  enabled: boolean;
  /** 存储键。 */
  key: string;
  /** 存储介质类型。 */
  storage: 'local' | 'session';
}

/**
 * 生成列结构签名。
 * 用于区分不同列配置下的持久化数据。
 * @param columns 列定义数组。
 * @returns 列签名字符串。
 */
function getColumnPersistenceSignature(columns: TableColumnRecord[] = []) {
  if (!Array.isArray(columns) || columns.length <= 0) {
    return 'empty';
  }
  return columns
    .map((column, index) => resolveColumnKey(column, index))
    .join('|');
}

/**
 * 获取持久化作用域路径。
 * 服务端环境返回固定标识，浏览器环境返回当前 pathname。
 * @returns 持久化路径标识。
 */
function getPathnameForPersistence() {
  if (typeof window === 'undefined') {
    return 'server';
  }
  return window.location?.pathname || 'browser';
}

/**
 * 对字符串执行简易哈希，生成稳定短键。
 * @param value 原始字符串。
 * @returns Base36 哈希值。
 */
function hashString(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash).toString(36);
}

/**
 * 构建列自定义持久化键。
 * 键由路径、作用域和列签名共同决定，避免不同页面间冲突。
 * @param columns 列定义数组。
 * @param scope 业务作用域标识。
 * @returns 持久化存储键。
 */
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

/**
 * 解析列自定义持久化存储类型。
 * @param value 原始存储类型。
 * @returns `session` 或 `local`（默认）。
 */
function resolveColumnCustomPersistenceStorage(
  value: unknown
): 'local' | 'session' {
  return value === 'session' ? 'session' : 'local';
}

/**
 * 根据配置获取可用存储对象。
 * @param config 持久化配置。
 * @returns `localStorage/sessionStorage` 或 `null`。
 */
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

/**
 * 解析列自定义持久化配置。
 * 支持布尔开关与对象配置；对象可指定 `key/scope/storage`。
 * @param gridOptions 表格配置对象。
 * @param columns 当前列定义。
 * @returns 标准化持久化配置；禁用时返回 `undefined`。
 */
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

/**
 * 读取配置中内联定义的列自定义状态。
 * @param gridOptions 表格配置对象。
 * @returns 列自定义状态；未配置时返回 `undefined`。
 */
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

/**
 * 从存储中读取列自定义状态。
 * @param config 持久化配置。
 * @returns 解析后的列自定义状态；读取失败时返回 `undefined`。
 */
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

/**
 * 将列自定义状态写入存储。
 * @param config 持久化配置。
 * @param state 待写入的列自定义状态。
 * @returns 写入是否成功。
 */
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
