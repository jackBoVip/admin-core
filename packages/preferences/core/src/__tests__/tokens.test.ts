/**
 * 设计令牌测试
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  configureDesignTokens,
  getDesignTokens,
  getDefaultDesignTokens,
  resetDesignTokens,
  DEFAULT_DESIGN_TOKENS,
  drawer,
  iconSizes,
  generateCSSVariables,
} from '../tokens';

describe('设计令牌', () => {
  beforeEach(() => {
    // 每个测试前重置令牌
    resetDesignTokens();
  });

  describe('getDefaultDesignTokens', () => {
    it('应该返回默认令牌', () => {
      const tokens = getDefaultDesignTokens();
      expect(tokens).toEqual(DEFAULT_DESIGN_TOKENS);
    });
  });

  describe('getDesignTokens', () => {
    it('初始应该返回默认令牌', () => {
      const tokens = getDesignTokens();
      expect(tokens.drawer.width).toBe(DEFAULT_DESIGN_TOKENS.drawer.width);
    });
  });

  describe('configureDesignTokens', () => {
    it('应该覆盖指定的令牌', () => {
      configureDesignTokens({
        drawer: { width: 500 },
      });
      const tokens = getDesignTokens();
      expect(tokens.drawer.width).toBe(500);
    });

    it('应该保留未覆盖的令牌', () => {
      configureDesignTokens({
        drawer: { width: 500 },
      });
      const tokens = getDesignTokens();
      expect(tokens.iconSizes.md).toBe(DEFAULT_DESIGN_TOKENS.iconSizes.md);
    });

    it('应该支持深层覆盖', () => {
      configureDesignTokens({
        iconSizes: { md: 24 },
      });
      const tokens = getDesignTokens();
      expect(tokens.iconSizes.md).toBe(24);
      expect(tokens.iconSizes.sm).toBe(DEFAULT_DESIGN_TOKENS.iconSizes.sm);
    });
  });

  describe('resetDesignTokens', () => {
    it('应该重置为默认值', () => {
      configureDesignTokens({
        drawer: { width: 500 },
      });
      resetDesignTokens();
      const tokens = getDesignTokens();
      expect(tokens.drawer.width).toBe(DEFAULT_DESIGN_TOKENS.drawer.width);
    });
  });

  describe('Proxy 访问器', () => {
    it('drawer 应该响应配置变化', () => {
      expect(drawer.width).toBe(DEFAULT_DESIGN_TOKENS.drawer.width);
      configureDesignTokens({ drawer: { width: 600 } });
      expect(drawer.width).toBe(600);
    });

    it('iconSizes 应该响应配置变化', () => {
      expect(iconSizes.md).toBe(DEFAULT_DESIGN_TOKENS.iconSizes.md);
      configureDesignTokens({ iconSizes: { md: 32 } });
      expect(iconSizes.md).toBe(32);
    });
  });

  describe('generateCSSVariables', () => {
    it('应该生成有效的 CSS', () => {
      const css = generateCSSVariables();
      expect(css).toContain(':root {');
      expect(css).toContain('--admin-drawer-width');
      expect(css).toContain('--admin-icon-size-md');
    });

    it('应该反映当前配置', () => {
      configureDesignTokens({ drawer: { width: 450 } });
      const css = generateCSSVariables();
      expect(css).toContain('--admin-drawer-width: 450px');
    });
  });
});
