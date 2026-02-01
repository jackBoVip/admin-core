/**
 * 布局工具函数
 * @module utils/layout
 * 
 * 本文件包含以下功能模块：
 * 
 * 1. 布局类型判断 (第 50-120 行)
 *    - getActualThemeMode, isLayoutInCategory, isFullContentLayout 等
 * 
 * 2. 布局尺寸计算 (第 120-250 行)
 *    - calculateSidebarWidth, calculateHeaderHeight, calculateTabbarHeight 等
 * 
 * 3. 布局计算属性 (第 250-380 行)
 *    - calculateLayoutComputed, generateCSSVariables
 * 
 * 4. 菜单工具函数 (第 380-560 行)
 *    - findMenuByKey, getMenuPath, flattenMenus, generateBreadcrumbsFromMenus 等
 * 
 * 5. 标签管理器 (第 560-840 行)
 *    - TabManager 类
 * 
 * 6. 配置合并工具 (第 840-970 行)
 *    - mergeConfig, mapPreferencesToLayoutProps
 * 
 * 7. 主题工具函数 (第 970-1020 行)
 *    - generateThemeCSSVariables, generateThemeClasses
 * 
 * 8. 水印工具函数 (第 1020-1060 行)
 *    - generateWatermarkStyle, generateWatermarkContent
 * 
 * 9. 锁屏工具函数 (第 1060-1120 行)
 *    - shouldShowLockScreen, createAutoLockTimer
 * 
 * 10. 检查更新工具 (第 1120-1160 行)
 *     - createCheckUpdatesTimer
 * 
 * 11. 配置解析 (第 1160-1220 行)
 *     - getResolvedLayoutProps, generateAllCSSVariables
 */

import {
  getActualThemeMode,
  generateThemeCSSVariables,
  generateThemeClasses,
  mapPreferencesToLayoutProps,
} from '@admin-core/preferences';
import type { LayoutType } from '@admin-core/preferences';
import type { 
  BasicLayoutProps, 
  BreadcrumbItem, 
  CheckUpdatesConfig,
  LayoutComputed, 
  LayoutState, 
  LockScreenConfig,
  MenuItem, 
  TabItem,
  WatermarkConfig,
} from '../types';
import { findMenuByKey } from './menu';
import {
  CSS_VAR_NAMES,
  DEFAULT_HEADER_CONFIG,
  DEFAULT_PANEL_CONFIG,
  DEFAULT_SIDEBAR_CONFIG,
  DEFAULT_TABBAR_CONFIG,
  DEFAULT_FOOTER_CONFIG,
  DEFAULT_THEME_CONFIG,
  DEFAULT_WATERMARK_CONFIG,
  DEFAULT_LOCK_SCREEN_CONFIG,
  DEFAULT_CHECK_UPDATES_CONFIG,
  LAYOUT_CATEGORIES,
} from '../constants';

export { getActualThemeMode, generateThemeCSSVariables, generateThemeClasses, mapPreferencesToLayoutProps };

// ============================================================
// 1. 布局类型判断
// ============================================================

/**
 * 判断布局是否属于某个分类
 */
export function isLayoutInCategory(
  layout: LayoutType,
  category: keyof typeof LAYOUT_CATEGORIES
): boolean {
  return (LAYOUT_CATEGORIES[category] as readonly string[]).includes(layout);
}

/**
 * 判断是否为全屏内容布局
 */
export function isFullContentLayout(layout: LayoutType): boolean {
  return layout === 'full-content';
}

/**
 * 判断是否为侧边混合导航
 */
export function isSidebarMixedNavLayout(layout: LayoutType): boolean {
  return layout === 'sidebar-mixed-nav';
}

/**
 * 判断是否为顶部导航
 */
export function isHeaderNavLayout(layout: LayoutType): boolean {
  return layout === 'header-nav';
}

/**
 * 判断是否为混合导航
 */
export function isMixedNavLayout(layout: LayoutType): boolean {
  return layout === 'mixed-nav' || layout === 'header-sidebar-nav';
}

/**
 * 判断是否为顶部混合导航
 */
export function isHeaderMixedNavLayout(layout: LayoutType): boolean {
  return layout === 'header-mixed-nav';
}

/**
 * 判断是否应该显示侧边栏
 */
export function shouldShowSidebar(layout: LayoutType, _isMobile?: boolean): boolean {
  if (isFullContentLayout(layout)) return false;
  if (isHeaderNavLayout(layout)) return false;
  return true;
}

/**
 * 判断是否应该显示顶栏
 */
export function shouldShowHeader(layout: LayoutType): boolean {
  return !isFullContentLayout(layout);
}

// ============================================================
// 2. 布局尺寸计算
// ============================================================

/**
 * 计算侧边栏宽度
 */
export function calculateSidebarWidth(
  props: BasicLayoutProps,
  state: LayoutState
): number {
  const layout = props.layout || 'sidebar-nav';
  const sidebar = { ...DEFAULT_SIDEBAR_CONFIG, ...props.sidebar };
  const isMobile = props.isMobile || false;

  // 全屏内容或顶部导航模式无侧边栏
  if (isFullContentLayout(layout) || isHeaderNavLayout(layout)) {
    return 0;
  }

  // 侧边栏隐藏
  if (sidebar.hidden) {
    return 0;
  }

  // 移动端且折叠状态
  if (isMobile && state.sidebarCollapsed) {
    return 0;
  }

  // 混合导航模式（vben 风格）
  // 侧边栏宽度 = 图标列宽度 + 子菜单面板宽度（如果固定模式且可见）
  if (isHeaderMixedNavLayout(layout) || isSidebarMixedNavLayout(layout)) {
    if (state.sidebarCollapsed && !state.sidebarExpandOnHovering) {
      return sidebar.collapseWidth;
    }
    // 图标列宽度
    const mixedWidth = sidebar.mixedWidth || 70;
    // 子菜单面板宽度
    const extraCollapsedWidth = sidebar.extraCollapsedWidth || 60;
    const extraExpandedWidth = sidebar.width || 180;
    
    // 固定模式下（expandOnHover=true），子菜单面板占用空间
    if (state.sidebarExpandOnHover && state.sidebarExtraVisible) {
      const extraWidth = state.sidebarExtraCollapsed ? extraCollapsedWidth : extraExpandedWidth;
      return mixedWidth + extraWidth;
    }
    // 非固定模式下，只有图标列宽度
    return mixedWidth;
  }

  // 普通折叠状态
  if (state.sidebarCollapsed && !state.sidebarExpandOnHovering) {
    return sidebar.collapseWidth;
  }

  return sidebar.width;
}

/**
 * 计算顶栏高度
 */
export function calculateHeaderHeight(
  props: BasicLayoutProps,
  state: LayoutState
): number {
  const layout = props.layout || 'sidebar-nav';
  const header = { ...DEFAULT_HEADER_CONFIG, ...props.header };

  if (isFullContentLayout(layout)) {
    return 0;
  }

  if (header.hidden || state.headerHidden) {
    return 0;
  }

  return header.height;
}

/**
 * 计算标签栏高度
 */
export function calculateTabbarHeight(props: BasicLayoutProps): number {
  const tabbar = { ...DEFAULT_TABBAR_CONFIG, ...props.tabbar };

  if (!tabbar.enable) {
    return 0;
  }

  return tabbar.height;
}

/**
 * 计算页脚高度
 */
export function calculateFooterHeight(props: BasicLayoutProps): number {
  const footer = { ...DEFAULT_FOOTER_CONFIG, ...props.footer };

  if (!footer.enable) {
    return 0;
  }

  return footer.height;
}

/**
 * 计算功能区宽度
 */
export function calculatePanelWidth(
  props: BasicLayoutProps,
  state: LayoutState
): number {
  const panel = { ...DEFAULT_PANEL_CONFIG, ...props.panel };

  if (!panel.enable) {
    return 0;
  }

  if (state.panelCollapsed) {
    return panel.collapsedWidth;
  }

  return panel.width;
}

/**
 * 计算布局属性
 */
export function calculateLayoutComputed(
  props: BasicLayoutProps,
  state: LayoutState
): LayoutComputed {
  const layout = props.isMobile ? 'sidebar-nav' : (props.layout || 'sidebar-nav');
  const visibility = props.visibility || {};

  const sidebarWidth = calculateSidebarWidth(props, state);
  const headerHeight = calculateHeaderHeight(props, state);
  const tabbarHeight = calculateTabbarHeight(props);
  const footerHeight = calculateFooterHeight(props);
  const panelWidth = calculatePanelWidth(props, state);
  const panel = { ...DEFAULT_PANEL_CONFIG, ...props.panel };

  const showSidebar = shouldShowSidebar(layout, props.isMobile || false) && visibility.sidebar !== false;
  const showHeader = shouldShowHeader(layout) && visibility.header !== false;
  const showTabbar = (props.tabbar?.enable ?? true) && visibility.tabbar !== false;
  const showFooter = (props.footer?.enable ?? false) && visibility.footer !== false;
  const showBreadcrumb = (props.breadcrumb?.enable ?? true) && visibility.breadcrumb !== false;
  const showPanel = (props.panel?.enable ?? false) && visibility.panel !== false;

  // 计算主内容区域边距
  const marginLeft = showSidebar && panel.position !== 'left' 
    ? `${sidebarWidth}px` 
    : showPanel && panel.position === 'left' 
      ? `${panelWidth}px` 
      : '0';
  
  const marginRight = showPanel && panel.position === 'right' 
    ? `${panelWidth}px` 
    : '0';

  const marginTop = `${headerHeight + (showTabbar ? tabbarHeight : 0)}px`;

  // 计算实际主题模式（处理 auto 模式）
  const rawThemeMode = props.theme?.mode || 'light';
  const themeMode: 'light' | 'dark' = getActualThemeMode(rawThemeMode);
  
  const semiDarkSidebar = props.semiDarkSidebar ?? props.theme?.semiDarkSidebar ?? false;
  const semiDarkHeader = props.semiDarkHeader ?? props.theme?.semiDarkHeader ?? false;
  
  // 侧边栏主题计算逻辑
  // 优先级：semiDarkSidebar 设置 > 跟随全局主题
  // 当 semiDarkSidebar 为 true 且全局为 light 时，侧边栏用 dark
  // 当 semiDarkSidebar 为 false 时，侧边栏跟随全局主题
  let sidebarTheme: 'light' | 'dark';
  if (semiDarkSidebar && themeMode === 'light') {
    sidebarTheme = 'dark';
  } else {
    sidebarTheme = themeMode;
  }
  
  // 顶栏主题计算逻辑
  // 优先级：semiDarkHeader 设置 > 跟随全局主题
  let headerTheme: 'light' | 'dark';
  if (semiDarkHeader && themeMode === 'light') {
    headerTheme = 'dark';
  } else {
    headerTheme = themeMode;
  }

  return {
    currentLayout: layout,
    showSidebar,
    showHeader,
    showTabbar,
    showFooter,
    showBreadcrumb,
    showPanel,
    isFullContent: isFullContentLayout(layout),
    isSidebarMixedNav: isSidebarMixedNavLayout(layout),
    isHeaderNav: isHeaderNavLayout(layout),
    isMixedNav: isMixedNavLayout(layout),
    isHeaderMixedNav: isHeaderMixedNavLayout(layout),
    sidebarWidth,
    headerHeight,
    tabbarHeight,
    footerHeight,
    panelWidth,
    sidebarTheme,
    headerTheme,
    mainStyle: {
      marginLeft,
      marginRight,
      marginTop,
      width: `calc(100% - ${sidebarWidth + panelWidth}px)`,
    },
  };
}

// ============================================================
// 3. CSS 变量生成
// ============================================================

/**
 * 生成 CSS 变量对象
 */
export function generateCSSVariables(props: BasicLayoutProps, state: LayoutState): Record<string, string> {
  const header = { ...DEFAULT_HEADER_CONFIG, ...props.header };
  const sidebar = { ...DEFAULT_SIDEBAR_CONFIG, ...props.sidebar };
  const tabbar = { ...DEFAULT_TABBAR_CONFIG, ...props.tabbar };
  const footer = { ...DEFAULT_FOOTER_CONFIG, ...props.footer };
  const panel = { ...DEFAULT_PANEL_CONFIG, ...props.panel };
  const zIndex = props.zIndex || 200;

  const sidebarWidth = calculateSidebarWidth(props, state);
  const panelWidth = calculatePanelWidth(props, state);

  return {
    [CSS_VAR_NAMES.headerHeight]: `${header.height}px`,
    [CSS_VAR_NAMES.sidebarWidth]: `${sidebarWidth}px`,
    [CSS_VAR_NAMES.sidebarCollapseWidth]: `${sidebar.collapseWidth}px`,
    [CSS_VAR_NAMES.sidebarMixedWidth]: `${sidebar.mixedWidth}px`,
    [CSS_VAR_NAMES.tabbarHeight]: `${tabbar.height}px`,
    [CSS_VAR_NAMES.footerHeight]: `${footer.height}px`,
    [CSS_VAR_NAMES.panelWidth]: `${panelWidth}px`,
    [CSS_VAR_NAMES.panelCollapseWidth]: `${panel.collapsedWidth}px`,
    [CSS_VAR_NAMES.contentPadding]: `${props.contentPadding ?? 16}px`,
    [CSS_VAR_NAMES.contentPaddingTop]: `${props.contentPaddingTop ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_NAMES.contentPaddingBottom]: `${props.contentPaddingBottom ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_NAMES.contentPaddingLeft]: `${props.contentPaddingLeft ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_NAMES.contentPaddingRight]: `${props.contentPaddingRight ?? props.contentPadding ?? 16}px`,
    [CSS_VAR_NAMES.contentCompactWidth]: `${props.contentCompactWidth ?? 1200}px`,
    [CSS_VAR_NAMES.zIndex]: `${zIndex}`,
    [CSS_VAR_NAMES.zIndexHeader]: `${zIndex + 10}`,
    [CSS_VAR_NAMES.zIndexSidebar]: `${zIndex + 20}`,
    [CSS_VAR_NAMES.zIndexTabbar]: `${zIndex + 5}`,
    [CSS_VAR_NAMES.zIndexPanel]: `${zIndex + 15}`,
    [CSS_VAR_NAMES.zIndexOverlay]: `${zIndex + 50}`,
  };
}

// ============================================================
// 4. 菜单工具函数
// ============================================================

/**
 * 获取菜单路径（从根到目标的所有父级）
 */
export function getMenuPath(menus: MenuItem[], key: string): MenuItem[] {
  const path: MenuItem[] = [];

  function traverse(items: MenuItem[], target: string, currentPath: MenuItem[]): boolean {
    for (const item of items) {
      const newPath = [...currentPath, item];
      if (item.key === target) {
        path.push(...newPath);
        return true;
      }
      if (item.children && traverse(item.children, target, newPath)) {
        return true;
      }
    }
    return false;
  }

  traverse(menus, key, []);
  return path;
}

/**
 * 扁平化菜单
 */
export function flattenMenus(menus: MenuItem[]): MenuItem[] {
  const result: MenuItem[] = [];

  function traverse(items: MenuItem[]) {
    for (const item of items) {
      result.push(item);
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(menus);
  return result;
}

/**
 * 过滤隐藏菜单
 */
export function filterHiddenMenus(menus: MenuItem[]): MenuItem[] {
  return menus
    .filter((item) => !item.hidden)
    .map((item) => ({
      ...item,
      children: item.children ? filterHiddenMenus(item.children) : undefined,
    }));
}

/**
 * 根据路径从菜单中生成面包屑
 * @param menus 菜单数据
 * @param path 当前路径
 * @param options 配置选项
 */
export function generateBreadcrumbsFromMenus(
  menus: MenuItem[],
  path: string,
  options?: {
    /** 显示首页 */
    showHome?: boolean;
    /** 首页路径 */
    homePath?: string;
    /** 首页名称 */
    homeName?: string;
    /** 首页图标 */
    homeIcon?: string;
    /** 只有一项时隐藏 */
    hideOnlyOne?: boolean;
  }
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];
  // 修复：使用 getMenuPathByPath 通过路径匹配
  const menuPath = getMenuPathByPath(menus, path);

  // 添加首页（使用独特的 key 前缀避免与菜单项冲突）
  if (options?.showHome) {
    breadcrumbs.push({
      key: '__breadcrumb_home__',
      name: options.homeName || 'layout.breadcrumb.home',
      icon: options.homeIcon || 'home',
      path: options.homePath || '/',
      clickable: true,
    });
  }

  // 从菜单路径生成面包屑（跳过与首页路径相同的项，避免重复）
  const homePath = options?.homePath || '/';
  for (const menu of menuPath) {
    // 如果已经显示了首页，跳过路径相同的菜单项
    if (options?.showHome && menu.path === homePath) {
      continue;
    }
    breadcrumbs.push({
      key: `__breadcrumb_${menu.key}__`,
      name: menu.name,
      icon: menu.icon,
      path: menu.path,
      clickable: !!menu.path && menu.path !== path,
    });
  }

  // 只有一项时隐藏
  if (options?.hideOnlyOne && breadcrumbs.length <= 1) {
    return [];
  }

  return breadcrumbs;
}

/**
 * 根据路径查找菜单项（支持精确匹配和前缀匹配）
 */
export function findMenuByPath(menus: MenuItem[], path: string): MenuItem | undefined {
  // 先尝试精确匹配（兼容 key 与 path）
  const exact = findMenuByKey(menus, path) ?? findMenuByPathValue(menus, path);
  if (exact) return exact;

  // 前缀匹配（找最长匹配）
  let bestMatch: MenuItem | undefined;
  let bestMatchLength = 0;

  function traverse(items: MenuItem[]) {
    for (const item of items) {
      if (item.path && path.startsWith(item.path) && item.path.length > bestMatchLength) {
        bestMatch = item;
        bestMatchLength = item.path.length;
      }
      if (item.children) {
        traverse(item.children);
      }
    }
  }

  traverse(menus);
  return bestMatch;
}

function findMenuByPathValue(menus: MenuItem[], path: string): MenuItem | undefined {
  for (const item of menus) {
    if (item.path === path) return item;
    if (item.children?.length) {
      const found = findMenuByPathValue(item.children, path);
      if (found) return found;
    }
  }
  return undefined;
}

/**
 * 根据路径获取菜单路径（从根到目标的所有父级）
 * 支持通过 path 属性匹配
 */
export function getMenuPathByPath(menus: MenuItem[], targetPath: string): MenuItem[] {
  const path: MenuItem[] = [];

  function traverse(items: MenuItem[], currentPath: MenuItem[]): boolean {
    for (const item of items) {
      const newPath = [...currentPath, item];
      
      // 精确匹配或前缀匹配
      if (item.path === targetPath) {
        path.push(...newPath);
        return true;
      }
      
      if (item.children && traverse(item.children, newPath)) {
        return true;
      }
    }
    return false;
  }

  traverse(menus, []);
  return path;
}

// ============================================================
// 5. 标签管理器
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

/**
 * 标签管理器
 * @description 自动管理标签的添加、删除、排序等
 */
export class TabManager {
  private tabs: TabItemWithState[] = [];
  private maxCount: number;
  private affixTabs: Set<string> = new Set();
  private persistKey: string | null = null;
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
    this.onChange = options?.onChange;
    if (options?.affixTabs) {
      options.affixTabs.forEach((key) => this.affixTabs.add(key));
    }
    // 从持久化存储恢复
    this.restoreFromStorage();
  }

  /**
   * 验证标签数据格式
   */
  private isValidTabData(data: unknown): data is TabItem[] {
    if (!Array.isArray(data)) return false;
    return data.every(item => 
      typeof item === 'object' && 
      item !== null &&
      typeof item.key === 'string' &&
      typeof item.path === 'string' &&
      typeof item.name === 'string'
    );
  }

  /**
   * 从持久化存储恢复标签
   */
  private restoreFromStorage(): void {
    if (!this.persistKey || typeof localStorage === 'undefined') return;
    
    try {
      const stored = localStorage.getItem(this.persistKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // 验证数据格式
        if (this.isValidTabData(parsed)) {
          this.setTabs(parsed);
        } else {
          console.warn('Invalid tabs data format, clearing storage');
          this.clearStorage();
        }
      }
    } catch (error) {
      console.warn('Failed to restore tabs from storage:', error);
      // 清除损坏的数据
      this.clearStorage();
    }
  }

  /**
   * 保存到持久化存储
   */
  private saveToStorage(): void {
    if (!this.persistKey || typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(this.persistKey, JSON.stringify(this.tabs));
    } catch (error) {
      // 处理存储配额超出等错误
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        console.warn('Storage quota exceeded, clearing old data');
        this.clearStorage();
      } else {
        console.warn('Failed to save tabs to storage:', error);
      }
    }
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

  /**
   * 从菜单创建标签
   */
  createTabFromMenu(menu: MenuItem, options?: { affix?: boolean }): TabItem {
    return {
      key: menu.key,
      name: menu.name,
      icon: menu.icon,
      path: menu.path || '',
      closable: !options?.affix && !this.affixTabs.has(menu.key),
      affix: options?.affix || this.affixTabs.has(menu.key),
      cacheName: menu.meta?.cacheName as string | undefined,
      meta: menu.meta,
    };
  }

  /**
   * 验证标签数据
   */
  private validateTab(tab: TabItem): boolean {
    return (
      tab &&
      typeof tab.key === 'string' && tab.key.trim() !== '' &&
      typeof tab.path === 'string' && tab.path.trim() !== '' &&
      typeof tab.name === 'string'
    );
  }

  /**
   * 添加标签（如果不存在）
   */
  addTab(tab: TabItem): TabItem[] {
    // 验证标签数据
    if (!this.validateTab(tab)) {
      console.warn('Invalid tab data:', tab);
      return this.getTabs();
    }

    const exists = this.tabs.find((t) => t.key === tab.key);
    if (exists) {
      return this.getTabs();
    }

    const newTab: TabItemWithState = {
      ...tab,
      fromMenu: true,
      openTime: Date.now(),
    };

    this.tabs.push(newTab);

    // 检查是否超过最大数量（固定标签不计入）
    if (this.maxCount > 0) {
      const closableTabs = this.tabs.filter((t) => t.closable !== false && !t.affix);
      if (closableTabs.length > this.maxCount) {
        // 关闭最早打开的可关闭标签
        const oldest = closableTabs.sort((a, b) => (a.openTime || 0) - (b.openTime || 0))[0];
        if (oldest) {
          this.tabs = this.tabs.filter((t) => t.key !== oldest.key);
        }
      }
    }

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
    const tab = this.tabs.find((t) => t.key === key);
    if (tab && tab.closable !== false && !tab.affix) {
      this.tabs = this.tabs.filter((t) => t.key !== key);
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 移除其他标签
   */
  removeOtherTabs(exceptKey: string): TabItem[] {
    this.tabs = this.tabs.filter(
      (t) => t.key === exceptKey || t.closable === false || t.affix
    );
    this.notifyChange();
    return this.getTabs();
  }

  /**
   * 移除左侧标签
   */
  removeLeftTabs(key: string): TabItem[] {
    const index = this.tabs.findIndex((t) => t.key === key);
    if (index > 0) {
      this.tabs = this.tabs.filter(
        (t, i) => i >= index || t.closable === false || t.affix
      );
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 移除右侧标签
   */
  removeRightTabs(key: string): TabItem[] {
    const index = this.tabs.findIndex((t) => t.key === key);
    if (index >= 0) {
      this.tabs = this.tabs.filter(
        (t, i) => i <= index || t.closable === false || t.affix
      );
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 移除所有可关闭标签
   */
  removeAllTabs(): TabItem[] {
    this.tabs = this.tabs.filter((t) => t.closable === false || t.affix);
    this.notifyChange();
    return this.getTabs();
  }

  /**
   * 设置固定标签
   */
  setAffixTabs(keys: string[]): void {
    this.affixTabs = new Set(keys);
    // 更新现有标签的 affix 状态
    this.tabs = this.tabs.map((t) => ({
      ...t,
      affix: this.affixTabs.has(t.key),
      closable: !this.affixTabs.has(t.key),
    }));
    this.notifyChange();
  }

  /**
   * 切换固定状态
   */
  toggleAffix(key: string): TabItem[] {
    const tab = this.tabs.find((t) => t.key === key);
    if (tab) {
      if (this.affixTabs.has(key)) {
        this.affixTabs.delete(key);
        tab.affix = false;
        tab.closable = true;
      } else {
        this.affixTabs.add(key);
        tab.affix = true;
        tab.closable = false;
      }
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
      this.notifyChange();
    }
    return this.getTabs();
  }

  /**
   * 清除持久化存储
   */
  clearStorage(): void {
    if (this.persistKey && typeof localStorage !== 'undefined') {
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
    this.tabs = tabs.map((t) => ({
      ...t,
      affix: this.affixTabs.has(t.key) || t.affix,
      closable: !this.affixTabs.has(t.key) && t.closable !== false && !t.affix,
      openTime: Date.now(),
    }));
  }

  /**
   * 查找标签
   */
  findTab(key: string): TabItem | undefined {
    return this.tabs.find((t) => t.key === key);
  }

  /**
   * 检查标签是否存在
   */
  hasTab(key: string): boolean {
    return this.tabs.some((t) => t.key === key);
  }
}

// ============================================================
// 6. 配置合并工具
// ============================================================

/**
 * 合并配置（深度合并）
 */
export function mergeConfig<T extends object>(
  defaults: T,
  overrides?: Partial<T>
): T {
  if (!overrides) return { ...defaults };

  const result = { ...defaults } as T;

  for (const key in overrides) {
    if (Object.prototype.hasOwnProperty.call(overrides, key)) {
      const value = overrides[key as keyof T];
      if (value !== undefined) {
        const defaultValue = defaults[key as keyof T];
        if (
          typeof value === 'object' &&
          value !== null &&
          !Array.isArray(value) &&
          typeof defaultValue === 'object' &&
          defaultValue !== null
        ) {
          (result as Record<string, unknown>)[key] = mergeConfig(
            defaultValue as Record<string, unknown>,
            value as Record<string, unknown>
          );
        } else {
          (result as Record<string, unknown>)[key] = value;
        }
      }
    }
  }

  return result;
}

// ============================================================
// 8. 水印工具函数
// ============================================================

/**
 * 生成水印配置
 */
export function generateWatermarkStyle(config: WatermarkConfig = DEFAULT_WATERMARK_CONFIG): Record<string, string | number> {
  if (!config.enable) {
    return { display: 'none' };
  }

  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: config.zIndex || 9999,
    opacity: config.opacity || 1,
  };
}

/**
 * 生成水印内容
 */
export function generateWatermarkContent(config: WatermarkConfig = DEFAULT_WATERMARK_CONFIG): string {
  if (!config.content) return '';

  let content = config.content;

  if (config.appendDate) {
    const date = new Date().toLocaleDateString();
    content = `${content} ${date}`;
  }

  return content;
}

// ============================================================
// 9. 锁屏工具函数
// ============================================================

/**
 * 检查是否应该显示锁屏
 */
export function shouldShowLockScreen(config: LockScreenConfig = DEFAULT_LOCK_SCREEN_CONFIG): boolean {
  return config.isLocked === true;
}

/**
 * 创建自动锁屏定时器
 * @returns 清理函数
 */
export function createAutoLockTimer(
  config: LockScreenConfig,
  onLock: () => void
): () => void {
  if (!config.autoLockTime || config.autoLockTime <= 0) {
    return () => {};
  }

  // SSR 检查
  if (typeof document === 'undefined') {
    return () => {};
  }

  const timeout = config.autoLockTime * 60 * 1000; // 转换为毫秒
  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastActivity = Date.now();

  const resetTimer = () => {
    lastActivity = Date.now();
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (Date.now() - lastActivity >= timeout) {
        onLock();
      }
    }, timeout);
  };

  // 监听用户活动
  const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
  events.forEach((event) => {
    document.addEventListener(event, resetTimer, { passive: true });
  });

  // 启动定时器
  resetTimer();

  // 返回清理函数
  return () => {
    if (timer) {
      clearTimeout(timer);
    }
    events.forEach((event) => {
      document.removeEventListener(event, resetTimer);
    });
  };
}

// ============================================================
// 10. 检查更新工具
// ============================================================

/**
 * 检查更新工具
 */
export function createCheckUpdatesTimer(
  config: CheckUpdatesConfig,
  onUpdate: (hasUpdate: boolean) => void,
  checkFn: () => Promise<boolean>
): () => void {
  if (!config.enable || !config.interval || config.interval <= 0) {
    return () => {};
  }

  const interval = config.interval * 60 * 1000; // 转换为毫秒
  let timer: ReturnType<typeof setInterval> | null = null;

  const check = async () => {
    try {
      const hasUpdate = await checkFn();
      onUpdate(hasUpdate);
    } catch (error) {
      console.error('Check updates failed:', error);
    }
  };

  // 启动定时器
  timer = setInterval(check, interval);

  // 立即检查一次
  check();

  // 返回清理函数
  return () => {
    if (timer) {
      clearInterval(timer);
    }
  };
}

// ============================================================
// 11. 配置解析
// ============================================================

/**
 * 获取完整的布局 Props（合并 preferences 和单独配置）
 * @description 优先级：单独配置项 > preferences 对象 > 默认值
 */
export function getResolvedLayoutProps(props: BasicLayoutProps): BasicLayoutProps {
  // 如果传入了 preferences 对象，先映射
  let baseProps: Partial<BasicLayoutProps> = {};
  if (props.preferences) {
    baseProps = mapPreferencesToLayoutProps(props.preferences);
  }

  // 合并配置（单独配置优先）
  return {
    ...baseProps,
    ...props,
    // 深度合并对象类型的配置
    theme: mergeConfig(
      DEFAULT_THEME_CONFIG,
      mergeConfig(baseProps.theme || {}, props.theme || {})
    ),
    watermark: mergeConfig(
      DEFAULT_WATERMARK_CONFIG,
      mergeConfig(baseProps.watermark || {}, props.watermark || {})
    ),
    lockScreen: mergeConfig(
      DEFAULT_LOCK_SCREEN_CONFIG,
      mergeConfig(baseProps.lockScreen || {}, props.lockScreen || {})
    ),
    checkUpdates: mergeConfig(
      DEFAULT_CHECK_UPDATES_CONFIG,
      mergeConfig(baseProps.checkUpdates || {}, props.checkUpdates || {})
    ),
    header: mergeConfig(
      DEFAULT_HEADER_CONFIG,
      mergeConfig(baseProps.header || {}, props.header || {})
    ),
    sidebar: mergeConfig(
      DEFAULT_SIDEBAR_CONFIG,
      mergeConfig(baseProps.sidebar || {}, props.sidebar || {})
    ),
    tabbar: mergeConfig(
      DEFAULT_TABBAR_CONFIG,
      mergeConfig(baseProps.tabbar || {}, props.tabbar || {})
    ),
    footer: mergeConfig(
      DEFAULT_FOOTER_CONFIG,
      mergeConfig(baseProps.footer || {}, props.footer || {})
    ),
    panel: mergeConfig(
      DEFAULT_PANEL_CONFIG,
      mergeConfig(baseProps.panel || {}, props.panel || {})
    ),
  } as BasicLayoutProps;
}

/**
 * 生成所有 CSS 变量（布局 + 主题）
 */
export function generateAllCSSVariables(props: BasicLayoutProps, state: LayoutState): Record<string, string> {
  const layoutVars = generateCSSVariables(props, state);
  const themeVars = generateThemeCSSVariables(props.theme);

  return {
    ...layoutVars,
    ...themeVars,
  };
}
