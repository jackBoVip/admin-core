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

  constructor(options?: { persistKey?: string | null; onChange?: (keys: string[]) => void }) {
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

  private syncKeySet(): void {
    this.keySet = new Set(this.keys);
  }

  private isValidKeys(data: unknown): data is string[] {
    if (!Array.isArray(data)) return false;
    return data.every((item) => typeof item === 'string');
  }

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

    // 兼容旧的未包裹存储格式（直接 localStorage）
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

  private saveToStorage(): void {
    if (!this.persistKey) return;
    this.initStorage();
    this.storage?.setItem(this.persistKey, this.keys);
  }

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

  getKeys(): string[] {
    return [...this.keys];
  }

  /**
   * 设置完整收藏列表（用于初始化/同步）
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

  has(key: string): boolean {
    return this.keySet.has(key);
  }

  add(key: string): string[] {
    const nextKey = key?.trim();
    if (!nextKey) return this.getKeys();
    if (this.keySet.has(nextKey)) return this.getKeys();
    this.keys = [...this.keys, nextKey];
    this.keySet.add(nextKey);
    this.notifyChange();
    return this.getKeys();
  }

  remove(key: string): string[] {
    if (!this.keySet.has(key)) return this.getKeys();
    this.keys = this.keys.filter((item) => item !== key);
    this.keySet.delete(key);
    this.notifyChange();
    return this.getKeys();
  }

  toggle(key: string): { keys: string[]; favorited: boolean } {
    const nextKey = key?.trim();
    if (!nextKey) return { keys: this.getKeys(), favorited: false };
    if (this.keySet.has(nextKey)) {
      this.remove(nextKey);
      return { keys: this.getKeys(), favorited: false };
    }
    this.add(nextKey);
    return { keys: this.getKeys(), favorited: true };
  }

  clearStorage(): void {
    if (!this.persistKey) return;
    this.storage?.removeItem(this.persistKey);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.persistKey);
    }
  }
}

// ============================================================
// Favorites Manager Cache
// ============================================================

const favoritesManagerCache = new Map<string, FavoritesManager>();

export function getOrCreateFavoritesManager(options: {
  persistKey?: string | null;
  onChange?: (keys: string[]) => void;
}): FavoritesManager {
  const cacheKey = options.persistKey || '__default__';
  let manager = favoritesManagerCache.get(cacheKey);
  if (!manager) {
    manager = new FavoritesManager(options);
    favoritesManagerCache.set(cacheKey, manager);
  } else {
    manager.setOnChange(options.onChange);
  }
  return manager;
}

export function clearFavoritesManagerCache(key?: string): void {
  if (key) {
    favoritesManagerCache.delete(key);
  } else {
    favoritesManagerCache.clear();
  }
}

/**
 * 解析收藏菜单列表（返回当前菜单数据）
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
