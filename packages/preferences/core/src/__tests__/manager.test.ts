/**
 * PreferencesManager 测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createPreferencesManager,
  DEFAULT_PREFERENCES,
} from '../index';
import type { PreferencesManager } from '../types';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(global, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe('PreferencesManager', () => {
  let manager: PreferencesManager;

  beforeEach(() => {
    localStorageMock.clear();
    manager = createPreferencesManager({ namespace: 'test' });
  });

  describe('创建和初始化', () => {
    it('应该使用默认配置创建', () => {
      const prefs = manager.getPreferences();
      expect(prefs.theme.mode).toBe(DEFAULT_PREFERENCES.theme.mode);
      expect(prefs.app.layout).toBe(DEFAULT_PREFERENCES.app.layout);
    });

    it('应该支持配置覆盖', () => {
      const customManager = createPreferencesManager({
        namespace: 'test',
        overrides: {
          theme: { mode: 'dark' },
        },
      });
      const prefs = customManager.getPreferences();
      expect(prefs.theme.mode).toBe('dark');
    });
  });

  describe('getPreferences', () => {
    it('应该返回当前偏好设置', () => {
      const prefs = manager.getPreferences();
      expect(prefs).toBeDefined();
      expect(prefs.theme).toBeDefined();
      expect(prefs.app).toBeDefined();
    });
  });

  describe('get', () => {
    it('应该返回指定分类的设置', () => {
      const theme = manager.get('theme');
      expect(theme).toBeDefined();
      expect(theme.mode).toBeDefined();
    });
  });

  describe('setPreferences', () => {
    it('应该更新偏好设置', () => {
      manager.setPreferences({ theme: { mode: 'dark' } });
      const prefs = manager.getPreferences();
      expect(prefs.theme.mode).toBe('dark');
    });

    it('应该支持深度部分更新', () => {
      const originalLayout = manager.getPreferences().app.layout;
      manager.setPreferences({ theme: { fontScale: 1.2 } });
      const prefs = manager.getPreferences();
      expect(prefs.theme.fontScale).toBe(1.2);
      expect(prefs.app.layout).toBe(originalLayout);
    });
  });

  describe('set', () => {
    it('应该更新指定分类', () => {
      manager.set('theme', { mode: 'light' });
      const theme = manager.get('theme');
      expect(theme.mode).toBe('light');
    });
  });

  describe('reset', () => {
    it('应该重置为默认值', () => {
      manager.setPreferences({ theme: { mode: 'dark', fontScale: 1.3 } });
      manager.reset();
      const prefs = manager.getPreferences();
      expect(prefs.theme.mode).toBe(DEFAULT_PREFERENCES.theme.mode);
      expect(prefs.theme.fontScale).toBe(DEFAULT_PREFERENCES.theme.fontScale);
    });

    it('应该保留语言设置', () => {
      manager.setPreferences({ app: { locale: 'en-US' } });
      manager.reset();
      const prefs = manager.getPreferences();
      expect(prefs.app.locale).toBe('en-US');
    });
  });

  describe('subscribe', () => {
    it('应该在偏好设置变更时触发回调', () => {
      const callback = vi.fn();
      manager.subscribe(callback);
      manager.setPreferences({ theme: { mode: 'dark' } });
      expect(callback).toHaveBeenCalled();
    });

    it('应该返回取消订阅函数', () => {
      const callback = vi.fn();
      const unsubscribe = manager.subscribe(callback);
      unsubscribe();
      manager.setPreferences({ theme: { mode: 'dark' } });
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe('toggleThemeMode', () => {
    it('应该切换主题模式', () => {
      manager.setPreferences({ theme: { mode: 'light' } });
      manager.toggleThemeMode();
      expect(manager.get('theme').mode).toBe('dark');
      manager.toggleThemeMode();
      expect(manager.get('theme').mode).toBe('light');
    });
  });

  describe('toggleSidebarCollapsed', () => {
    it('应该切换侧边栏折叠状态', () => {
      manager.setPreferences({ sidebar: { collapsed: false } });
      manager.toggleSidebarCollapsed();
      expect(manager.get('sidebar').collapsed).toBe(true);
      manager.toggleSidebarCollapsed();
      expect(manager.get('sidebar').collapsed).toBe(false);
    });
  });

  describe('exportConfig / importConfig', () => {
    it('应该导出配置为 JSON', () => {
      const config = manager.exportConfig();
      expect(typeof config).toBe('string');
      expect(() => JSON.parse(config)).not.toThrow();
    });

    it('应该导入 JSON 配置', () => {
      const config = JSON.stringify({ theme: { mode: 'dark' } });
      manager.importConfig(config);
      expect(manager.get('theme').mode).toBe('dark');
    });

    it('应该导入对象配置', () => {
      manager.importConfig({ theme: { mode: 'light' } });
      expect(manager.get('theme').mode).toBe('light');
    });
  });

  describe('getDiff', () => {
    it('应该返回与默认值的差异', () => {
      manager.setPreferences({ theme: { mode: 'dark' } });
      const diff = manager.getDiff();
      expect(diff.theme?.mode).toBe('dark');
    });

    it('未修改应该返回空对象', () => {
      const diff = manager.getDiff();
      expect(Object.keys(diff).length).toBe(0);
    });
  });
});
