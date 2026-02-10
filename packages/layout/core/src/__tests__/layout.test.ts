/**
 * 布局工具函数测试
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DEFAULT_SIDEBAR_CONFIG, DEFAULT_HEADER_CONFIG, DEFAULT_LAYOUT_STATE } from '../constants';
import {
  getActualThemeMode,
  isLayoutInCategory,
  isFullContentLayout,
  isSidebarMixedNavLayout,
  isHeaderNavLayout,
  isMixedNavLayout,
  isHeaderMixedNavLayout,
  shouldShowSidebar,
  shouldShowHeader,
  calculateSidebarWidth,
  calculateHeaderHeight,
  calculateTabbarHeight,
  calculateFooterHeight,
  mergeConfig,
  generateThemeCSSVariables,
  generateThemeClasses,
  generateWatermarkContent,
  shouldShowLockScreen,
} from '../utils/layout';
import { TabManager } from '../utils/tabs';

// ============================================================
// 1. 布局类型判断测试
// ============================================================
describe('布局类型判断', () => {
  describe('getActualThemeMode', () => {
    it('应返回 light 当 mode 为 light', () => {
      expect(getActualThemeMode('light')).toBe('light');
    });

    it('应返回 dark 当 mode 为 dark', () => {
      expect(getActualThemeMode('dark')).toBe('dark');
    });

    it('应返回 light 当 mode 为 auto 且无 window', () => {
      expect(getActualThemeMode('auto')).toBe('light');
    });
  });

  describe('isFullContentLayout', () => {
    it('应返回 true 当布局为 full-content', () => {
      expect(isFullContentLayout('full-content')).toBe(true);
    });

    it('应返回 false 当布局不为 full-content', () => {
      expect(isFullContentLayout('sidebar-nav')).toBe(false);
    });
  });

  describe('isSidebarMixedNavLayout', () => {
    it('应返回 true 当布局为 sidebar-mixed-nav', () => {
      expect(isSidebarMixedNavLayout('sidebar-mixed-nav')).toBe(true);
    });

    it('应返回 false 当布局不为 sidebar-mixed-nav', () => {
      expect(isSidebarMixedNavLayout('sidebar-nav')).toBe(false);
    });
  });

  describe('isHeaderNavLayout', () => {
    it('应返回 true 当布局为 header-nav', () => {
      expect(isHeaderNavLayout('header-nav')).toBe(true);
    });

    it('应返回 false 当布局不为 header-nav', () => {
      expect(isHeaderNavLayout('sidebar-nav')).toBe(false);
    });
  });

  describe('shouldShowSidebar', () => {
    it('应返回 false 当布局为 full-content', () => {
      expect(shouldShowSidebar('full-content')).toBe(false);
    });

    it('应返回 false 当布局为 header-nav', () => {
      expect(shouldShowSidebar('header-nav')).toBe(false);
    });

    it('应返回 true 当布局为 sidebar-nav', () => {
      expect(shouldShowSidebar('sidebar-nav')).toBe(true);
    });
  });

  describe('shouldShowHeader', () => {
    it('应返回 false 当布局为 full-content', () => {
      expect(shouldShowHeader('full-content')).toBe(false);
    });

    it('应返回 true 当布局为 sidebar-nav', () => {
      expect(shouldShowHeader('sidebar-nav')).toBe(true);
    });
  });
});

// ============================================================
// 2. 布局尺寸计算测试
// ============================================================
describe('布局尺寸计算', () => {
  describe('calculateSidebarWidth', () => {
    it('应返回正确的侧边栏宽度', () => {
      const props = { layout: 'sidebar-nav' as const };
      const state = { ...DEFAULT_LAYOUT_STATE, sidebarCollapsed: false };
      const width = calculateSidebarWidth(props, state);
      expect(width).toBe(DEFAULT_SIDEBAR_CONFIG.width);
    });

    it('应返回折叠宽度当侧边栏折叠', () => {
      const props = { layout: 'sidebar-nav' as const };
      const state = { ...DEFAULT_LAYOUT_STATE, sidebarCollapsed: true };
      const width = calculateSidebarWidth(props, state);
      expect(width).toBe(DEFAULT_SIDEBAR_CONFIG.collapseWidth);
    });

    it('应返回 0 当布局为 full-content', () => {
      const props = { layout: 'full-content' as const };
      const state = DEFAULT_LAYOUT_STATE;
      const width = calculateSidebarWidth(props, state);
      expect(width).toBe(0);
    });
  });

  describe('calculateHeaderHeight', () => {
    it('应返回正确的顶栏高度', () => {
      const props = { layout: 'sidebar-nav' as const };
      const state = { ...DEFAULT_LAYOUT_STATE, headerHidden: false };
      const height = calculateHeaderHeight(props, state);
      expect(height).toBe(DEFAULT_HEADER_CONFIG.height);
    });

    it('应返回 0 当布局为 full-content', () => {
      const props = { layout: 'full-content' as const };
      const state = DEFAULT_LAYOUT_STATE;
      const height = calculateHeaderHeight(props, state);
      expect(height).toBe(0);
    });
  });
});

// ============================================================
// 3. 配置合并测试
// ============================================================
describe('配置合并', () => {
  describe('mergeConfig', () => {
    it('应正确合并简单对象', () => {
      const defaults = { a: 1, b: 2 };
      const overrides = { b: 3, c: 4 };
      const result = mergeConfig(defaults, overrides as any);
      expect(result).toEqual({ a: 1, b: 3, c: 4 });
    });

    it('应正确深度合并嵌套对象', () => {
      const defaults = { a: { x: 1, y: 2 }, b: 3 };
      const overrides = { a: { y: 3 } };
      const result = mergeConfig(defaults, overrides as any);
      expect(result).toEqual({ a: { x: 1, y: 3 }, b: 3 });
    });

    it('应返回默认值当 overrides 为 undefined', () => {
      const defaults = { a: 1, b: 2 };
      const result = mergeConfig(defaults, undefined);
      expect(result).toEqual({ a: 1, b: 2 });
    });

    it('应忽略 undefined 值', () => {
      const defaults = { a: 1, b: 2 };
      const overrides = { a: undefined, b: 3 };
      const result = mergeConfig(defaults, overrides as any);
      expect(result).toEqual({ a: 1, b: 3 });
    });
  });
});

// ============================================================
// 4. TabManager 测试
// ============================================================
describe('TabManager', () => {
  let tabManager: TabManager;

  beforeEach(() => {
    tabManager = new TabManager();
  });

  describe('addTab', () => {
    it('应正确添加标签', () => {
      const tab = { key: 'home', name: '首页', path: '/' };
      const tabs = tabManager.addTab(tab);
      expect(tabs).toHaveLength(1);
      expect(tabs[0].key).toBe('home');
    });

    it('不应重复添加相同 key 的标签', () => {
      const tab = { key: 'home', name: '首页', path: '/' };
      tabManager.addTab(tab);
      const tabs = tabManager.addTab(tab);
      expect(tabs).toHaveLength(1);
    });
  });

  describe('removeTab', () => {
    it('应正确移除标签', () => {
      tabManager.addTab({ key: 'home', name: '首页', path: '/', closable: true });
      tabManager.addTab({ key: 'about', name: '关于', path: '/about', closable: true });
      const tabs = tabManager.removeTab('home');
      expect(tabs).toHaveLength(1);
      expect(tabs[0].key).toBe('about');
    });

    it('不应移除固定标签', () => {
      tabManager.addTab({ key: 'home', name: '首页', path: '/', affix: true });
      const tabs = tabManager.removeTab('home');
      expect(tabs).toHaveLength(1);
    });
  });

  describe('removeOtherTabs', () => {
    it('应正确移除其他标签', () => {
      tabManager.addTab({ key: 'home', name: '首页', path: '/', closable: true });
      tabManager.addTab({ key: 'about', name: '关于', path: '/about', closable: true });
      tabManager.addTab({ key: 'contact', name: '联系', path: '/contact', closable: true });
      const tabs = tabManager.removeOtherTabs('about');
      expect(tabs).toHaveLength(1);
      expect(tabs[0].key).toBe('about');
    });
  });

  describe('removeAllTabs', () => {
    it('应移除所有可关闭标签', () => {
      tabManager.addTab({ key: 'home', name: '首页', path: '/', affix: true });
      tabManager.addTab({ key: 'about', name: '关于', path: '/about', closable: true });
      const tabs = tabManager.removeAllTabs();
      expect(tabs).toHaveLength(1);
      expect(tabs[0].key).toBe('home');
    });
  });

  describe('sortTabs', () => {
    it('应正确排序标签', () => {
      tabManager.addTab({ key: 'a', name: 'A', path: '/a' });
      tabManager.addTab({ key: 'b', name: 'B', path: '/b' });
      tabManager.addTab({ key: 'c', name: 'C', path: '/c' });
      const tabs = tabManager.sortTabs(0, 2);
      expect(tabs[0].key).toBe('b');
      expect(tabs[1].key).toBe('c');
      expect(tabs[2].key).toBe('a');
    });
  });

  describe('findTab', () => {
    it('应找到存在的标签', () => {
      tabManager.addTab({ key: 'home', name: '首页', path: '/' });
      const tab = tabManager.findTab('home');
      expect(tab).toBeDefined();
      expect(tab?.key).toBe('home');
    });

    it('应返回 undefined 当标签不存在', () => {
      const tab = tabManager.findTab('nonexistent');
      expect(tab).toBeUndefined();
    });
  });

  describe('hasTab', () => {
    it('应返回 true 当标签存在', () => {
      tabManager.addTab({ key: 'home', name: '首页', path: '/' });
      expect(tabManager.hasTab('home')).toBe(true);
    });

    it('应返回 false 当标签不存在', () => {
      expect(tabManager.hasTab('nonexistent')).toBe(false);
    });
  });
});

// ============================================================
// 5. 主题工具函数测试
// ============================================================
describe('主题工具函数', () => {
  describe('generateThemeCSSVariables', () => {
    it('应生成基本主题变量', () => {
      const vars = generateThemeCSSVariables({ mode: 'dark' });
      expect(vars['--theme-mode']).toBe('dark');
    });

    it('应生成主色变量', () => {
      const vars = generateThemeCSSVariables({ colorPrimary: '#3b82f6' });
      expect(vars['--color-primary']).toBe('#3b82f6');
    });
  });

  describe('generateThemeClasses', () => {
    it('应生成 dark 类名', () => {
      const classes = generateThemeClasses({ mode: 'dark' });
      expect(classes).toContain('dark');
    });

    it('应生成 grayscale-mode 类名', () => {
      const classes = generateThemeClasses({ colorGrayMode: true });
      expect(classes).toContain('grayscale-mode');
    });

    it('应生成 color-weak-mode 类名', () => {
      const classes = generateThemeClasses({ colorWeakMode: true });
      expect(classes).toContain('color-weak-mode');
    });
  });
});

// ============================================================
// 6. 水印工具函数测试
// ============================================================
describe('水印工具函数', () => {
  describe('generateWatermarkContent', () => {
    it('应返回水印内容', () => {
      const content = generateWatermarkContent({ content: 'Test' });
      expect(content).toBe('Test');
    });

    it('应返回空字符串当无内容', () => {
      const content = generateWatermarkContent({});
      expect(content).toBe('');
    });

    it('应附加日期当 appendDate 为 true', () => {
      const content = generateWatermarkContent({ content: 'Test', appendDate: true });
      expect(content).toContain('Test');
      expect(content.length).toBeGreaterThan(4);
    });
  });
});

// ============================================================
// 7. 锁屏工具函数测试
// ============================================================
describe('锁屏工具函数', () => {
  describe('shouldShowLockScreen', () => {
    it('应返回 true 当 isLocked 为 true', () => {
      expect(shouldShowLockScreen({ isLocked: true })).toBe(true);
    });

    it('应返回 false 当 isLocked 为 false', () => {
      expect(shouldShowLockScreen({ isLocked: false })).toBe(false);
    });

    it('应返回 false 当 isLocked 未定义', () => {
      expect(shouldShowLockScreen({})).toBe(false);
    });
  });
});
