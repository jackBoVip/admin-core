/**
 * 缓存管理器。
 * @description 提供支持 TTL、命名空间隔离与异常兜底的统一存储封装。
 */

import { logger } from './logger';
import type { StorageAdapter, StorageError, StorageErrorType } from '../types';

/**
 * 存储项结构。
 * @template T 条目值类型。
 */
interface StorageItem<T> {
  /** 存储值。 */
  value: T;
  /** 过期时间戳（毫秒）。 */
  expiry?: number;
}

/**
 * 存储管理器配置。
 */
export interface StorageManagerOptions {
  /** 存储前缀（命名空间）。 */
  prefix?: string;
  /** 存储实例（默认 `localStorage`）。 */
  storage?: Storage;
  /** 默认 TTL（毫秒）。 */
  defaultTTL?: number;
  /** 错误处理回调。 */
  onError?: (error: StorageError) => void;
}

/**
 * 存储管理器。
 * @description 提供统一存储接口，支持 TTL、命名空间隔离与过期清理。
 */
export class StorageManager implements StorageAdapter {
  /** 命名空间前缀。 */
  private prefix: string;
  /** 底层存储实现。 */
  private storage: Storage;
  /** 默认 TTL（毫秒）。 */
  private defaultTTL?: number;
  /** 错误回调。 */
  onError?: (error: StorageError) => void;

  /**
   * 创建存储管理器。
   * @param options 配置项。
   * @returns 无返回值。
   */
  constructor(options: StorageManagerOptions = {}) {
    this.prefix = options.prefix || 'admin-core';
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : createMemoryStorage());
    this.defaultTTL = options.defaultTTL;
    this.onError = options.onError;
  }

  /**
   * 处理错误并分发到回调或日志。
   * @param type 错误类型。
   * @param error 错误对象。
   * @param key 相关键名。
   * @returns 无返回值。
   */
  private handleError(type: StorageErrorType, error: Error, key?: string): void {
    const storageError: StorageError = { type, error, key };
    this.onError?.(storageError);
    /**
     * 日志输出兜底。
     * @description 未提供外部错误回调时，按日志级别输出警告信息。
     */
    if (!this.onError) {
      logger.warn(`[StorageManager] ${type} error${key ? ` for key "${key}"` : ''}:`, error);
    }
  }

  /**
   * 获取完整的存储键名。
   * @param key 原始键名。
   * @returns 含命名空间前缀的键名。
   */
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * 获取存储项。
   * @param key 键名。
   * @param defaultValue 默认值（获取失败或过期时返回）。
   * @returns 存储值或默认值。
   */
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const item = this.storage.getItem(fullKey);

      if (!item) return defaultValue;

      try {
        const parsed: StorageItem<T> = JSON.parse(item);

        /**
         * 过期检查。
         * @description 已过期条目会被移除并返回默认值。
         */
        if (parsed.expiry && Date.now() > parsed.expiry) {
          this.removeItem(key);
          return defaultValue;
        }

        return parsed.value;
      } catch (e) {
        this.handleError('parse', e instanceof Error ? e : new Error(String(e)), key);
        return defaultValue;
      }
    } catch (e) {
      this.handleError('read', e instanceof Error ? e : new Error(String(e)), key);
      return defaultValue;
    }
  }

  /**
   * 设置存储项。
   * @param key 键名。
   * @param value 值。
   * @param ttl 过期时间（毫秒），可选。
   * @returns 无返回值。
   */
  setItem<T>(key: string, value: T, ttl?: number): void {
    try {
      const fullKey = this.getFullKey(key);
      const effectiveTTL = ttl ?? this.defaultTTL;
      const expiry = effectiveTTL ? Date.now() + effectiveTTL : undefined;

      const item: StorageItem<T> = { value, expiry };
      this.storage.setItem(fullKey, JSON.stringify(item));
    } catch (e) {
      this.handleError('write', e instanceof Error ? e : new Error(String(e)), key);
    }
  }

  /**
   * 移除存储项。
   * @param key 键名。
   * @returns 无返回值。
   */
  removeItem(key: string): void {
    try {
      const fullKey = this.getFullKey(key);
      this.storage.removeItem(fullKey);
    } catch (e) {
      this.handleError('remove', e instanceof Error ? e : new Error(String(e)), key);
    }
  }

  /**
   * 清空当前命名空间下的所有存储。
   * @returns 无返回值。
   */
  clear(): void {
    try {
      const keysToRemove: string[] = [];

      for (let i = 0; i < this.storage.length; i++) {
        const key = this.storage.key(i);
        if (key?.startsWith(`${this.prefix}:`)) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => this.storage.removeItem(key));
    } catch (e) {
      this.handleError('clear', e instanceof Error ? e : new Error(String(e)));
    }
  }

  /**
   * 清理所有过期项。
   * @description 遍历当前命名空间下条目并移除已过期数据。
   * @returns 无返回值。
   */
  clearExpiredItems(): void {
    for (let i = this.storage.length - 1; i >= 0; i--) {
      const key = this.storage.key(i);
      if (!key?.startsWith(`${this.prefix}:`)) continue;

      try {
        const item = this.storage.getItem(key);
        if (!item) continue;

        const parsed: StorageItem<unknown> = JSON.parse(item);
        if (parsed.expiry && Date.now() > parsed.expiry) {
          this.storage.removeItem(key);
        }
      } catch {
        /**
         * 忽略解析失败条目。
         * @description 非法数据不影响其他缓存项清理流程。
         */
      }
    }
  }

  /**
   * 检查键是否存在且未过期。
   * @param key 键名。
   * @returns 是否存在。
   */
  has(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * 获取所有键名（不含前缀）。
   * @returns 键名数组。
   */
  keys(): string[] {
    const result: string[] = [];
    const prefixWithColon = `${this.prefix}:`;

    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(prefixWithColon)) {
        result.push(key.slice(prefixWithColon.length));
      }
    }

    return result;
  }
}

/** 内存存储最大条目数（防止 SSR 环境下内存无限增长）。 */
const MEMORY_STORAGE_MAX_SIZE = 1000;

/**
 * 创建内存存储（用于 SSR 或不支持 `localStorage` 的环境）。
 * @returns 兼容 `Storage` 接口的内存实现。
 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  /**
   * 维护存储大小限制。
   * @description 超过上限时按插入顺序清理最早 1/4 条目。
   * @returns 无返回值。
   */
  const maintainSize = () => {
    if (store.size > MEMORY_STORAGE_MAX_SIZE) {
      /**
       * 超限淘汰策略。
       * @description 按插入顺序移除最早 1/4 项，控制内存占用。
       */
      const keysToDelete = Array.from(store.keys()).slice(0, MEMORY_STORAGE_MAX_SIZE / 4);
      keysToDelete.forEach((key) => store.delete(key));
    }
  };

  return {
    get length() {
      return store.size;
    },
    /**
     * 按索引读取键名。
     * @param index 键索引。
     * @returns 键名或 `null`。
     */
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    /**
     * 读取存储项。
     * @param key 键名。
     * @returns 对应值或 `null`。
     */
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    /**
     * 写入存储项并维护容量上限。
     * @param key 键名。
     * @param value 值。
     * @returns 无返回值。
     */
    setItem(key: string, value: string) {
      store.set(key, value);
      maintainSize();
    },
    /**
     * 删除指定存储项。
     * @param key 键名。
     * @returns 无返回值。
     */
    removeItem(key: string) {
      store.delete(key);
    },
    /**
     * 清空全部存储项。
     * @returns 无返回值。
     */
    clear() {
      store.clear();
    },
  };
}

/**
 * 创建默认存储管理器。
 * @param options 存储管理器配置。
 * @returns 存储管理器实例。
 */
export function createStorageManager(options?: StorageManagerOptions): StorageManager {
  return new StorageManager(options);
}
