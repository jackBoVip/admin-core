/**
 * 收藏管理器
 * @description 管理菜单收藏的持久化与查询
 */

import { createStorageManager, type StorageManager } from '@admin-core/preferences';
import { logger } from './logger';
import { getCachedMenuPathIndex } from './menu';
import type { MenuItem } from '../types';

const FAVORITES_STORAGE_PREFIX = 'layout-favorites';
const DEFAULT_FAVORITES_KEY = 'favorites';

/**
 * 收藏管理器构造参数。
 */
export interface FavoritesManagerConstructorOptions {
  /** 持久化存储键；传 `null` 表示禁用持久化。 */
  persistKey?: string | null;
  /** 收藏变更回调。 */
  onChange?: (keys: string[]) => void;
}

/**
 * 收藏切换结果。
 */
export interface FavoriteToggleResult {
  /** 切换后的收藏键列表。 */
  keys: string[];
  /** 当前键是否处于已收藏状态。 */
  favorited: boolean;
}

/**
 * 收藏管理器
 */
export class FavoritesManager {
  private keys: string[] = [];
  private keySet: Set<string> = new Set();
  private persistKey: string | null = null;
  private storage: StorageManager | null = null;
  private onChange?: (keys: string[]) => void;
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly SAVE_DEBOUNCE_DELAY = 300;

  /**
   * 创建收藏管理器。
   * @param options 初始化选项。
   */
  constructor(options?: FavoritesManagerConstructorOptions) {
    const resolvedKey = options?.persistKey;
    this.persistKey =
      resolvedKey === undefined ? DEFAULT_FAVORITES_KEY : (resolvedKey || null);
    this.onChange = options?.onChange;
    this.initStorage();
    this.restoreFromStorage();
    this.syncKeySet();
  }

  /**
   * 更新变化回调
   */
  setOnChange(onChange?: (keys: string[]) => void): void {
    this.onChange = onChange;
  }

  /**
   * 同步 `Set` 结构，确保 `has` 查询与数组内容一致。
   *
   * @returns 无返回值。
   */
  private syncKeySet(): void {
    this.keySet = new Set(this.keys);
  }

  /**
   * 校验反序列化后的收藏键数组格式。
   *
   * @param data 待校验数据。
   * @returns `true` 表示可作为收藏键数组使用。
   */
  private isValidKeys(data: unknown): data is string[] {
    if (!Array.isArray(data)) return false;
    return data.every((item) => typeof item === 'string');
  }

  /**
   * 按需初始化持久化存储实例。
   *
   * @returns 无返回值。
   */
  private initStorage(): void {
    if (!this.persistKey || this.storage) return;
    this.storage = createStorageManager({
      prefix: FAVORITES_STORAGE_PREFIX,
      onError: (error) => {
        if (
          error.type === 'write' &&
          typeof DOMException !== 'undefined' &&
          error.error instanceof DOMException &&
          error.error.name === 'QuotaExceededError'
        ) {
          logger.warn('Storage quota exceeded, clearing old data');
          this.clearStorage();
          return;
        }
        logger.warn(
          `[FavoritesManager] storage ${error.type} error${error.key ? ` for key \"${error.key}\"` : ''}:`,
          error.error
        );
      },
    });
  }

  /**
   * 从新旧存储格式恢复收藏键列表。
   *
   * @returns 无返回值。
   */
  private restoreFromStorage(): void {
    if (!this.persistKey) return;
    this.initStorage();
    const storage = this.storage;
    if (!storage) return;

    const stored = storage.getItem<string[]>(this.persistKey, null);
    if (stored) {
      if (this.isValidKeys(stored)) {
        this.keys = Array.from(new Set(stored.map((item) => String(item)).filter(Boolean)));
        return;
      }
      logger.warn('Invalid favorites data format, clearing storage');
      storage.removeItem(this.persistKey);
    }

    /* 兼容旧的未包裹存储格式（直接 localStorage）。 */
    if (typeof localStorage === 'undefined') return;
    try {
      const legacyStored = localStorage.getItem(this.persistKey);
      if (!legacyStored) return;
      const parsed = JSON.parse(legacyStored);
      if (this.isValidKeys(parsed)) {
        this.keys = Array.from(new Set(parsed.map((item) => String(item)).filter(Boolean)));
        storage.setItem(this.persistKey, this.keys);
      } else {
        logger.warn('Invalid legacy favorites data format, clearing legacy storage');
      }
      localStorage.removeItem(this.persistKey);
    } catch (error) {
      logger.warn('Failed to restore favorites from legacy storage:', error);
      localStorage.removeItem(this.persistKey);
    }
  }

  /**
   * 将当前收藏键列表写入持久化存储。
   *
   * @returns 无返回值。
   */
  private saveToStorage(): void {
    if (!this.persistKey) return;
    this.initStorage();
    this.storage?.setItem(this.persistKey, this.keys);
  }

  /**
   * 触发变更回调并防抖落盘。
   *
   * @returns 无返回值。
   */
  private notifyChange(): void {
    this.onChange?.(this.getKeys());
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveToStorage();
      this.saveDebounceTimer = null;
    }, FavoritesManager.SAVE_DEBOUNCE_DELAY);
  }

  /**
   * 获取当前收藏键列表快照。
   *
   * @returns 收藏键数组副本。
   */
  getKeys(): string[] {
    return [...this.keys];
  }

  /**
   * 设置完整收藏列表（用于初始化/同步）。
   *
   * @param keys 收藏键列表。
   * @returns 去重后的收藏键快照。
   */
  setKeys(keys: string[]): string[] {
    const deduped: string[] = [];
    const seen = new Set<string>();
    for (const key of keys || []) {
      const nextKey = String(key ?? '').trim();
      if (!nextKey || seen.has(nextKey)) continue;
      seen.add(nextKey);
      deduped.push(nextKey);
    }
    const same =
      deduped.length === this.keys.length &&
      deduped.every((item, index) => item === this.keys[index]);
    if (same) return this.getKeys();
    this.keys = deduped;
    this.syncKeySet();
    this.notifyChange();
    return this.getKeys();
  }

  /**
   * 判断给定键是否已被收藏。
   *
   * @param key 菜单键。
   * @returns 是否已收藏。
   */
  has(key: string): boolean {
    return this.keySet.has(key);
  }

  /**
   * 添加一个收藏键。
   *
   * @param key 菜单键。
   * @returns 更新后的收藏键快照。
   */
  add(key: string): string[] {
    const nextKey = key?.trim();
    if (!nextKey) return this.getKeys();
    if (this.keySet.has(nextKey)) return this.getKeys();
    this.keys = [...this.keys, nextKey];
    this.keySet.add(nextKey);
    this.notifyChange();
    return this.getKeys();
  }

  /**
   * 移除一个收藏键。
   *
   * @param key 菜单键。
   * @returns 更新后的收藏键快照。
   */
  remove(key: string): string[] {
    if (!this.keySet.has(key)) return this.getKeys();
    this.keys = this.keys.filter((item) => item !== key);
    this.keySet.delete(key);
    this.notifyChange();
    return this.getKeys();
  }

  /**
   * 切换指定键的收藏状态。
   *
   * @param key 菜单键。
   * @returns 切换结果（包含新列表与是否已收藏）。
   */
  toggle(key: string): FavoriteToggleResult {
    const nextKey = key?.trim();
    if (!nextKey) return { keys: this.getKeys(), favorited: false };
    if (this.keySet.has(nextKey)) {
      this.remove(nextKey);
      return { keys: this.getKeys(), favorited: false };
    }
    this.add(nextKey);
    return { keys: this.getKeys(), favorited: true };
  }

  /**
   * 清理当前持久化键对应的数据（含兼容旧格式）。
   *
   * @returns 无返回值。
   */
  clearStorage(): void {
    if (!this.persistKey) return;
    this.storage?.removeItem(this.persistKey);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.persistKey);
    }
  }
}

/* ============================================================ */
/* Favorites Manager Cache */
/* ============================================================ */

const favoritesManagerCache = new Map<string, FavoritesManager>();
const FAVORITES_MANAGER_CACHE_LIMIT = 50;

/**
 * 获取或创建收藏管理器（带缓存）。
 *
 * @param options 管理器配置项。
 * @returns 收藏管理器实例。
 */
export interface GetOrCreateFavoritesManagerOptions {
  /** 持久化存储键；传 `null` 表示禁用持久化。 */
  persistKey?: string | null;
  /** 收藏键集合变化时触发。 */
  onChange?: (keys: string[]) => void;
}

/**
 * 获取或创建收藏管理器（带缓存）。
 *
 * @param options 管理器配置项。
 * @returns 收藏管理器实例。
 */
export function getOrCreateFavoritesManager(
  options: GetOrCreateFavoritesManagerOptions
): FavoritesManager {
  const cacheKey = options.persistKey || '__default__';
  let manager = favoritesManagerCache.get(cacheKey);
  if (!manager) {
    if (favoritesManagerCache.size >= FAVORITES_MANAGER_CACHE_LIMIT) {
      const oldestKey = favoritesManagerCache.keys().next().value;
      if (oldestKey) {
        favoritesManagerCache.delete(oldestKey);
      }
    }
    manager = new FavoritesManager(options);
    favoritesManagerCache.set(cacheKey, manager);
  } else {
    /* 更新访问顺序，便于按最近使用淘汰。 */
    favoritesManagerCache.delete(cacheKey);
    favoritesManagerCache.set(cacheKey, manager);
    manager.setOnChange(options.onChange);
  }
  return manager;
}

/**
 * 清理收藏管理器缓存。
 *
 * @param key 可选缓存键；不传时清空全部缓存。
 */
export function clearFavoritesManagerCache(key?: string): void {
  if (key) {
    favoritesManagerCache.delete(key);
  } else {
    favoritesManagerCache.clear();
  }
}

/**
 * 按收藏键顺序解析对应菜单列表。
 *
 * @param menus 全量菜单树。
 * @param keys 收藏键列表。
 * @returns 命中的菜单列表。
 */
export function resolveFavoriteMenus(menus: MenuItem[], keys: string[]): MenuItem[] {
  if (!menus.length || !keys.length) return [];
  const index = getCachedMenuPathIndex(menus);
  const result: MenuItem[] = [];
  for (const key of keys) {
    const menu = index.byKey.get(key);
    if (menu) result.push(menu);
  }
  return result;
}
