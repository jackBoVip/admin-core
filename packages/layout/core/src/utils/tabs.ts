/**
 * 标签页相关的通用工具函数
 */

import { createStorageManager, type StorageManager } from '@admin-core/preferences';
import { logger } from './logger';
import type { MenuItem, TabItem } from '../types';

/**
 * 获取不包含查询参数的路径
 */
export function getPathWithoutQuery(path: string): string {
  if (!path) return '';
  const base = path.split('?')[0];
  return base || '';
}

/**
 * 从路径中解析 pageKey
 */
export function getPageKeyFromPath(fullPath: string): string {
  if (!fullPath || !fullPath.includes('?')) return '';
  const query = fullPath.split('?')[1]?.split('#')[0] || '';
  if (!query) return '';
  try {
    const params = new URLSearchParams(query);
    return params.get('pageKey') || '';
  } catch {
    return '';
  }
}

/**
 * 解析标签页 key（支持 pageKey 与 fullPathKey）
 */
export function resolveTabKey(fullPath: string, menu?: MenuItem): string {
  const basePath = getPathWithoutQuery(fullPath);
  const meta = menu?.meta as Record<string, unknown> | undefined;
  const fullPathKey = meta?.fullPathKey;
  const pageKey = getPageKeyFromPath(fullPath);
  const rawKey =
    pageKey || (fullPathKey === false ? basePath : fullPath || basePath);
  const fallbackKey = menu?.key || basePath;
  try {
    return decodeURIComponent(rawKey) || fallbackKey;
  } catch {
    return rawKey || fallbackKey;
  }
}

/**
 * 从菜单构建标签页
 */
export function buildTabFromMenu(
  menu: MenuItem,
  fullPath: string,
  createTab: (menu: MenuItem, options?: { affix?: boolean }) => TabItem
): TabItem {
  const resolvedFullPath = fullPath || menu.path || '';
  const basePath = getPathWithoutQuery(resolvedFullPath || menu.path || '');
  const key = resolveTabKey(resolvedFullPath || basePath, menu);
  const baseTab = createTab(menu, { affix: menu.affix });
  const pageKey = getPageKeyFromPath(resolvedFullPath || basePath) || undefined;

  return {
    ...baseTab,
    key,
    path: resolvedFullPath || baseTab.path || basePath,
    meta: {
      ...(baseTab.meta || {}),
      fullPath: resolvedFullPath || basePath,
      fullPathKey: (menu.meta as Record<string, unknown> | undefined)?.fullPathKey,
      pageKey,
    },
  };
}

/**
 * 获取标签页缓存名称
 */
export function getTabCacheName(tab: TabItem): string | undefined {
  const meta = tab.meta as Record<string, unknown> | undefined;
  return (
    tab.cacheName ||
    (meta?.cacheName as string | undefined) ||
    tab.name
  );
}

/**
 * 解析 keep-alive include 列表
 */
export function resolveKeepAliveIncludes(
  tabs: TabItem[],
  keepAliveEnabled: boolean
): string[] {
  if (!keepAliveEnabled) return [];
  return tabs
    .filter((tab) => (tab.meta as Record<string, unknown> | undefined)?.keepAlive !== false)
    .map((tab) => getTabCacheName(tab))
    .filter(Boolean) as string[];
}

// ============================================================
// 标签管理器
// ============================================================

/**
 * 标签项（内部使用，带额外状态）
 */
export interface TabItemWithState extends TabItem {
  /** 是否来自菜单 */
  fromMenu?: boolean;
  /** 打开时间（用于排序） */
  openTime?: number;
}

const TAB_STORAGE_PREFIX = 'layout-tabs';

/**
 * 标签管理器
 * @description 自动管理标签的添加、删除、排序等
 */
export class TabManager {
  private tabs: TabItemWithState[] = [];
  private tabMap: Map<string, TabItemWithState> = new Map();
  private tabIndexMap: Map<string, number> = new Map();
  private maxCount: number;
  private affixTabs: Set<string> = new Set();
  private persistKey: string | null = null;
  private storage: StorageManager | null = null;
  private onChange?: (tabs: TabItem[]) => void;
  /** 防抖定时器，用于优化 localStorage 写入频率 */
  private saveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  /** 防抖延迟时间（毫秒） */
  private static readonly SAVE_DEBOUNCE_DELAY = 300;

  constructor(options?: {
    maxCount?: number;
    affixTabs?: string[];
    persistKey?: string;
    onChange?: (tabs: TabItem[]) => void;
  }) {
    this.maxCount = options?.maxCount || 0;
    this.persistKey = options?.persistKey || null;
    this.initStorage();
    this.onChange = options?.onChange;
    if (options?.affixTabs) {
      options.affixTabs.forEach((key) => this.affixTabs.add(key));
    }
    // 从持久化存储恢复
    this.restoreFromStorage();
    this.syncTabMaps();
  }

  /**
   * 更新变更回调（用于复用缓存实例时重绑订阅）
   */
  setOnChange(onChange?: (tabs: TabItem[]) => void): void {
    this.onChange = onChange;
  }

  /**
   * 验证标签数据格式
   */
  private isValidTabData(data: unknown): data is TabItem[] {
    if (!Array.isArray(data)) return false;
    return data.every(
      (item) =>
        typeof item === 'object' &&
        item !== null &&
        typeof item.key === 'string' &&
        typeof item.path === 'string' &&
        typeof item.name === 'string'
    );
  }

  private initStorage(): void {
    if (!this.persistKey || this.storage) return;
    this.storage = createStorageManager({
      prefix: TAB_STORAGE_PREFIX,
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
          `[TabManager] storage ${error.type} error${error.key ? ` for key \"${error.key}\"` : ''}:`,
          error.error
        );
      },
    });
  }

  /**
   * 从持久化存储恢复标签
   */
  private restoreFromStorage(): void {
    if (!this.persistKey) return;
    this.initStorage();
    const storage = this.storage;
    if (!storage) return;

    const stored = storage.getItem<TabItem[]>(this.persistKey, null);
    if (stored) {
      if (this.isValidTabData(stored)) {
        this.setTabs(stored);
        return;
      }
      logger.warn('Invalid tabs data format, clearing storage');
      storage.removeItem(this.persistKey);
    }

    // 兼容旧的未包裹存储格式（直接 localStorage）
    if (typeof localStorage === 'undefined') return;
    try {
      const legacyStored = localStorage.getItem(this.persistKey);
      if (!legacyStored) return;
      const parsed = JSON.parse(legacyStored);
      if (this.isValidTabData(parsed)) {
        this.setTabs(parsed);
        storage.setItem(this.persistKey, parsed);
      } else {
        logger.warn('Invalid legacy tabs data format, clearing legacy storage');
      }
      localStorage.removeItem(this.persistKey);
    } catch (error) {
      logger.warn('Failed to restore tabs from legacy storage:', error);
      localStorage.removeItem(this.persistKey);
    }
  }

  /**
   * 保存到持久化存储
   */
  private saveToStorage(): void {
    if (!this.persistKey) return;
    this.initStorage();
    this.storage?.setItem(this.persistKey, this.tabs);
  }

  /**
   * 通知变更
   * @description 使用防抖机制优化 localStorage 写入频率
   */
  private notifyChange(): void {
    // 先触发回调，确保 UI 立即更新
    this.onChange?.(this.getTabs());

    // 使用防抖延迟保存到 localStorage，避免频繁写入
    if (this.saveDebounceTimer) {
      clearTimeout(this.saveDebounceTimer);
    }
    this.saveDebounceTimer = setTimeout(() => {
      this.saveToStorage();
      this.saveDebounceTimer = null;
    }, TabManager.SAVE_DEBOUNCE_DELAY);
  }

  private syncTabMaps(): void {
    this.tabMap.clear();
    this.tabIndexMap.clear();
    this.tabs.forEach((tab, index) => {
      this.tabMap.set(tab.key, tab);
      this.tabIndexMap.set(tab.key, index);
    });
  }

  private getTabIndex(key: string): number {
    const index = this.tabIndexMap.get(key);
    return index === undefined ? -1 : index;
  }

  /**
   * 从菜单创建标签
   */
  createTabFromMenu(menu: MenuItem, options?: { affix?: boolean }): TabItem {
    const meta = {
      ...(menu.meta || {}),
      // 同步常用元数据，方便 tabbar 显示/控制
      keepAlive: menu.keepAlive,
      affixOrder: menu.affixOrder,
      title: menu.title ?? menu.name,
      externalLink: menu.externalLink,
      menuKey: menu.key,
    };
    return {
      key: menu.key,
      name: menu.name,
      icon: menu.icon,
      path: menu.path || '',
      closable: !options?.affix && !this.affixTabs.has(menu.key),
      affix: options?.affix || this.affixTabs.has(menu.key),
      cacheName: menu.meta?.cacheName as string | undefined,
      meta,
    };
  }

  /**
   * 验证标签数据
   */
  private validateTab(tab: TabItem): boolean {
    return (
      tab &&
      typeof tab.key === 'string' &&
      tab.key.trim() !== '' &&
      typeof tab.path === 'string' &&
      tab.path.trim() !== '' &&
      typeof tab.name === 'string'
    );
  }

  /**
   * 添加标签（如果不存在）
   */
  addTab(tab: TabItem): TabItem[] {
    // 验证标签数据
    if (!this.validateTab(tab)) {
      logger.warn('Invalid tab data:', tab);
      return this.getTabs();
    }

    const existingIndex = this.getTabIndex(tab.key);
    if (existingIndex !== -1) {
      const currentTab = this.tabs[existingIndex];
      const mergedTab: TabItemWithState = {
        ...currentTab,
        ...tab,
        meta: {
          ...(currentTab?.meta || {}),
          ...(tab.meta || {}),
        },
      };
      // 保留固定/不可关闭状态
      if (currentTab?.affix) {
        mergedTab.affix = true;
        mergedTab.closable = false;
      }
      // 保留自定义标题
      if (currentTab?.meta && 'newTabTitle' in currentTab.meta) {
        mergedTab.meta = {
          ...mergedTab.meta,
          newTabTitle: (currentTab.meta as Record<string, unknown>).newTabTitle,
        };
      }
      this.tabs.splice(existingIndex, 1, mergedTab);
      this.normalizeAffixOrder();
      this.syncTabMaps();
      this.notifyChange();
      return this.getTabs();
    }

    const newTab: TabItemWithState = {
      ...tab,
      fromMenu: true,
      openTime: Date.now(),
    };

    const maxNumOfOpenTab = Number(
      (newTab.meta as Record<string, unknown> | undefined)?.maxNumOfOpenTab ?? -1
    );
    if (maxNumOfOpenTab > 0) {
      const sameNameTabs = this.tabs.filter((item) => item.name === newTab.name);
      if (sameNameTabs.length >= maxNumOfOpenTab) {
        const index = this.tabs.findIndex((item) => item.name === newTab.name);
        if (index !== -1) {
          this.tabs.splice(index, 1);
        }
      }
    } else if (this.maxCount > 0 && this.tabs.length >= this.maxCount) {
      const index = this.tabs.findIndex((item) => !item.affix && item.closable !== false);
      if (index !== -1) {
        this.tabs.splice(index, 1);
      }
    }

    this.tabs.push(newTab);

    this.normalizeAffixOrder();

    this.syncTabMaps();
    this.notifyChange();
    return this.getTabs();
  }

  /**
   * 从菜单添加标签
   */
  addTabFromMenu(menu: MenuItem, options?: { affix?: boolean }): TabItem[] {
    const tab = this.createTabFromMenu(menu, options);
    return this.addTab(tab);
  }

  /**
   * 移除标签
   */
  removeTab(key: string): TabItem[] {
    const tab = this.findTab(key);
    if (tab && tab.closable !== false && !tab.affix) {
      const nextTabs: TabItemWithState[] = [];
      for (const item of this.tabs) {
        if (item.key !== key) nextTabs.push(item);
      }
      this.tabs = nextTabs;
      this.syncTabMaps();
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 移除其他标签
   */
  removeOtherTabs(exceptKey: string): TabItem[] {
    const nextTabs: TabItemWithState[] = [];
    for (const item of this.tabs) {
      if (item.key === exceptKey || item.closable === false || item.affix) {
        nextTabs.push(item);
      }
    }
    this.tabs = nextTabs;
    this.syncTabMaps();
    this.notifyChange();
    return this.getTabs();
  }

  /**
   * 移除左侧标签
   */
  removeLeftTabs(key: string): TabItem[] {
    const index = this.getTabIndex(key);
    if (index > 0) {
      const nextTabs: TabItemWithState[] = [];
      for (let i = 0; i < this.tabs.length; i += 1) {
        const item = this.tabs[i];
        if (i >= index || item.closable === false || item.affix) {
          nextTabs.push(item);
        }
      }
      this.tabs = nextTabs;
      this.syncTabMaps();
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 移除右侧标签
   */
  removeRightTabs(key: string): TabItem[] {
    const index = this.getTabIndex(key);
    if (index >= 0) {
      const nextTabs: TabItemWithState[] = [];
      for (let i = 0; i < this.tabs.length; i += 1) {
        const item = this.tabs[i];
        if (i <= index || item.closable === false || item.affix) {
          nextTabs.push(item);
        }
      }
      this.tabs = nextTabs;
      this.syncTabMaps();
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 移除所有可关闭标签
   */
  removeAllTabs(): TabItem[] {
    const nextTabs: TabItemWithState[] = [];
    for (const item of this.tabs) {
      if (item.closable === false || item.affix) {
        nextTabs.push(item);
      }
    }
    this.tabs = nextTabs;
    this.syncTabMaps();
    this.notifyChange();
    return this.getTabs();
  }

  /**
   * 设置固定标签
   */
  setAffixTabs(keys: string[]): void {
    const nextAffixTabs = new Set(
      (keys || []).map((key) => String(key ?? '').trim()).filter(Boolean)
    );
    this.affixTabs = nextAffixTabs;

    let changed = false;
    // 更新现有标签的 affix 状态，仅在实际变化时触发更新
    for (const tab of this.tabs) {
      const meta = tab.meta as Record<string, unknown> | undefined;
      const menuKey = meta?.menuKey as string | undefined;
      const isAffix =
        nextAffixTabs.has(tab.key) || (menuKey ? nextAffixTabs.has(menuKey) : false);
      const closable = !isAffix;
      if (tab.affix !== isAffix || tab.closable !== closable) {
        tab.affix = isAffix;
        tab.closable = closable;
        changed = true;
      }
    }

    if (!changed) return;
    this.normalizeAffixOrder();
    this.syncTabMaps();
    this.notifyChange();
  }

  /**
   * 切换固定状态
   */
  toggleAffix(key: string): TabItem[] {
    const tab = this.findTab(key);
    if (tab) {
      const meta = tab.meta as Record<string, unknown> | undefined;
      const menuKey = meta?.menuKey as string | undefined;
      const isAffix =
        this.affixTabs.has(key) || (menuKey ? this.affixTabs.has(menuKey) : false);
      if (isAffix) {
        this.affixTabs.delete(key);
        if (menuKey) {
          this.affixTabs.delete(menuKey);
        }
        tab.affix = false;
        tab.closable = true;
      } else {
        this.affixTabs.add(key);
        tab.affix = true;
        tab.closable = false;
      }
      this.normalizeAffixOrder();
      this.syncTabMaps();
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 排序标签（拖拽后）
   */
  sortTabs(fromIndex: number, toIndex: number): TabItem[] {
    const [removed] = this.tabs.splice(fromIndex, 1);
    if (removed) {
      this.tabs.splice(toIndex, 0, removed);
      this.normalizeAffixOrder();
      this.syncTabMaps();
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 清除持久化存储
   */
  clearStorage(): void {
    if (!this.persistKey) return;
    this.storage?.removeItem(this.persistKey);
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(this.persistKey);
    }
  }

  /**
   * 更新配置
   */
  updateOptions(options: { maxCount?: number; persistKey?: string }): void {
    if (options.maxCount !== undefined) {
      this.maxCount = options.maxCount;
    }
    if (options.persistKey !== undefined) {
      this.persistKey = options.persistKey;
      this.initStorage();
    }
  }

  /**
   * 获取所有标签
   */
  getTabs(): TabItem[] {
    return [...this.tabs];
  }

  /**
   * 设置标签（用于初始化或持久化恢复）
   */
  setTabs(tabs: TabItem[]): void {
    const now = Date.now();
    const nextTabs: TabItemWithState[] = [];
    for (const tab of tabs) {
      const isAffix = this.affixTabs.has(tab.key) || tab.affix;
      nextTabs.push({
        ...tab,
        affix: isAffix,
        closable: !isAffix && tab.closable !== false,
        openTime: now,
      });
    }
    this.tabs = nextTabs;
    this.normalizeAffixOrder();
    this.syncTabMaps();
  }

  /**
   * 确保固定标签靠前，并按 affixOrder 排序（稳定排序）
   */
  private normalizeAffixOrder(): void {
    if (this.tabs.length === 0) return;
    const withIndex = this.tabs.map((tab, index) => ({
      tab,
      index,
      order: (() => {
        const order = (tab.meta as Record<string, unknown> | undefined)?.affixOrder;
        return typeof order === 'number' ? order : Number.MAX_SAFE_INTEGER;
      })(),
    }));
    const affixTabs = withIndex.filter((item) => item.tab.affix);
    const normalTabs = withIndex.filter((item) => !item.tab.affix);
    affixTabs.sort((a, b) => (a.order === b.order ? a.index - b.index : a.order - b.order));
    this.tabs = [
      ...affixTabs.map((item) => item.tab),
      ...normalTabs.map((item) => item.tab),
    ];
  }

  /**
   * 查找标签
   */
  findTab(key: string): TabItem | undefined {
    return this.tabMap.get(key);
  }

  /**
   * 检查标签是否存在
   */
  hasTab(key: string): boolean {
    return this.tabMap.has(key);
  }
}
