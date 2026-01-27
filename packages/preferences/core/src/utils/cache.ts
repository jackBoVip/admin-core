/**
 * 缓存管理器
 * @description 支持 TTL、命名空间隔离的存储管理
 */

import type { StorageAdapter, StorageError, StorageErrorType } from '../types';
import { logger } from './logger';

/**
 * 存储项结构
 */
interface StorageItem<T> {
  /** 存储的值 */
  value: T;
  /** 过期时间戳（毫秒） */
  expiry?: number;
}

/**
 * 存储管理器配置
 */
export interface StorageManagerOptions {
  /** 存储前缀（命名空间） */
  prefix?: string;
  /** 存储实例（默认 localStorage） */
  storage?: Storage;
  /** 默认 TTL（毫秒） */
  defaultTTL?: number;
  /** 错误处理回调 */
  onError?: (error: StorageError) => void;
}

/**
 * 存储管理器
 * @description 提供统一的存储接口，支持 TTL 和命名空间
 */
export class StorageManager implements StorageAdapter {
  private prefix: string;
  private storage: Storage;
  private defaultTTL?: number;
  onError?: (error: StorageError) => void;

  constructor(options: StorageManagerOptions = {}) {
    this.prefix = options.prefix || 'admin-core';
    this.storage = options.storage || (typeof localStorage !== 'undefined' ? localStorage : createMemoryStorage());
    this.defaultTTL = options.defaultTTL;
    this.onError = options.onError;
  }

  /**
   * 处理错误
   */
  private handleError(type: StorageErrorType, error: Error, key?: string): void {
    const storageError: StorageError = { type, error, key };
    this.onError?.(storageError);
    // Logger will handle output based on configured log level
    if (!this.onError) {
      logger.warn(`[StorageManager] ${type} error${key ? ` for key "${key}"` : ''}:`, error);
    }
  }

  /**
   * 获取完整的存储键名
   */
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * 获取存储项
   * @param key - 键名
   * @param defaultValue - 默认值（获取失败或过期时返回）
   * @returns 存储的值或默认值
   */
  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const item = this.storage.getItem(fullKey);

      if (!item) return defaultValue;

      try {
        const parsed: StorageItem<T> = JSON.parse(item);

        // 检查是否过期
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
   * 设置存储项
   * @param key - 键名
   * @param value - 值
   * @param ttl - 过期时间（毫秒），可选
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
   * 移除存储项
   * @param key - 键名
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
   * 清空当前命名空间下的所有存储
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
   * 清理所有过期项
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
        // 忽略解析错误
      }
    }
  }

  /**
   * 检查键是否存在且未过期
   * @param key - 键名
   * @returns 是否存在
   */
  has(key: string): boolean {
    return this.getItem(key) !== null;
  }

  /**
   * 获取所有键名（不含前缀）
   * @returns 键名数组
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

/**
 * 创建内存存储（用于 SSR 或不支持 localStorage 的环境）
 */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();

  return {
    get length() {
      return store.size;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  };
}

/**
 * 创建默认存储管理器
 */
export function createStorageManager(options?: StorageManagerOptions): StorageManager {
  return new StorageManager(options);
}
