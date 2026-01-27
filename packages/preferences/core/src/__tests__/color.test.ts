/**
 * 颜色系统测试
 */

import { describe, it, expect } from 'vitest';
import {
  parseToOklch,
  oklchToCss,
  oklchToHex,
  createOklch,
  isValidColor,
  adjustLightness,
  adjustChroma,
  rotateHue,
  generateColorScale,
  deriveSemanticColors,
  getContrastRatio,
  meetsWCAG,
  getAccessibleForeground,
} from '../color';

describe('OKLCH 工具', () => {
  describe('parseToOklch', () => {
    it('应该解析十六进制颜色', () => {
      const result = parseToOklch('#0066ff');
      expect(result).not.toBeNull();
      expect(result?.l).toBeGreaterThan(0);
      expect(result?.c).toBeGreaterThan(0);
    });

    it('应该解析 RGB 颜色', () => {
      const result = parseToOklch('rgb(0, 102, 255)');
      expect(result).not.toBeNull();
    });

    it('应该解析 OKLCH 颜色', () => {
      const result = parseToOklch('oklch(0.6 0.2 250)');
      expect(result).not.toBeNull();
      expect(result?.l).toBeCloseTo(0.6, 1);
      expect(result?.c).toBeCloseTo(0.2, 1);
      expect(result?.h).toBeCloseTo(250, 0);
    });

    it('无效颜色应该返回 null', () => {
      const result = parseToOklch('invalid');
      expect(result).toBeNull();
    });
  });

  describe('oklchToCss', () => {
    it('应该生成正确的 OKLCH CSS 字符串', () => {
      const result = oklchToCss({ l: 0.6, c: 0.2, h: 250 });
      expect(result).toContain('oklch');
      expect(result).toContain('0.6');
      expect(result).toContain('0.2');
      expect(result).toContain('250');
    });
  });

  describe('oklchToHex', () => {
    it('应该转换为十六进制颜色', () => {
      // oklchToHex 接收颜色字符串
      const result = oklchToHex('oklch(0.5 0.15 250)');
      expect(result).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  describe('createOklch', () => {
    it('应该创建 OKLCH CSS 字符串', () => {
      // createOklch 返回字符串
      const result = createOklch(0.6, 0.2, 250);
      expect(typeof result).toBe('string');
      expect(result).toContain('oklch');
    });
  });

  describe('isValidColor', () => {
    it('应该验证有效颜色', () => {
      expect(isValidColor('#ff0000')).toBe(true);
      expect(isValidColor('rgb(255, 0, 0)')).toBe(true);
      expect(isValidColor('oklch(0.6 0.2 250)')).toBe(true);
    });

    it('应该拒绝无效颜色', () => {
      expect(isValidColor('invalid')).toBe(false);
      expect(isValidColor('')).toBe(false);
    });
  });

  describe('adjustLightness', () => {
    it('应该调整亮度', () => {
      // adjustLightness 接收颜色字符串
      const original = 'oklch(0.5 0.2 250)';
      const result = adjustLightness(original, 0.1);
      expect(typeof result).toBe('string');
      const parsed = parseToOklch(result);
      expect(parsed?.l).toBeCloseTo(0.6, 1);
    });

    it('应该限制亮度在 0-1 范围内', () => {
      const original = 'oklch(0.9 0.2 250)';
      const result = adjustLightness(original, 0.5);
      const parsed = parseToOklch(result);
      expect(parsed?.l).toBeLessThanOrEqual(1);
    });
  });

  describe('adjustChroma', () => {
    it('应该调整饱和度', () => {
      const original = 'oklch(0.5 0.2 250)';
      const result = adjustChroma(original, 0.05);
      expect(typeof result).toBe('string');
      const parsed = parseToOklch(result);
      expect(parsed?.c).toBeCloseTo(0.25, 1);
    });
  });

  describe('rotateHue', () => {
    it('应该旋转色相', () => {
      const original = 'oklch(0.5 0.2 250)';
      const result = rotateHue(original, 60);
      expect(typeof result).toBe('string');
      const parsed = parseToOklch(result);
      expect(parsed?.h).toBeCloseTo(310, 0);
    });

    it('应该处理色相环绕', () => {
      const original = 'oklch(0.5 0.2 350)';
      const result = rotateHue(original, 30);
      const parsed = parseToOklch(result);
      expect(parsed?.h).toBeCloseTo(20, 0);
    });
  });
});

describe('色阶生成', () => {
  describe('generateColorScale', () => {
    it('应该生成完整的色阶', () => {
      const scale = generateColorScale('#0066ff');
      expect(Object.keys(scale)).toHaveLength(11);
      expect(scale['50']).toBeDefined();
      expect(scale['500']).toBeDefined();
      expect(scale['950']).toBeDefined();
    });

    it('较浅的色阶应该有更高的亮度', () => {
      const scale = generateColorScale('#0066ff');
      const l50 = parseToOklch(scale['50'])?.l ?? 0;
      const l500 = parseToOklch(scale['500'])?.l ?? 0;
      const l950 = parseToOklch(scale['950'])?.l ?? 0;
      expect(l50).toBeGreaterThan(l500);
      expect(l500).toBeGreaterThan(l950);
    });
  });
});

describe('语义色派生', () => {
  describe('deriveSemanticColors', () => {
    it('应该从主色派生所有语义色', () => {
      const colors = deriveSemanticColors('#0066ff');
      expect(colors.success).toBeDefined();
      expect(colors.warning).toBeDefined();
      expect(colors.destructive).toBeDefined();
      expect(colors.info).toBeDefined();
    });

    it('语义色应该是有效的颜色', () => {
      const colors = deriveSemanticColors('#0066ff');
      expect(isValidColor(colors.success)).toBe(true);
      expect(isValidColor(colors.warning)).toBe(true);
      expect(isValidColor(colors.destructive)).toBe(true);
      expect(isValidColor(colors.info)).toBe(true);
    });
  });
});

describe('对比度计算', () => {
  describe('getContrastRatio', () => {
    it('白色和黑色应该有最高对比度', () => {
      const ratio = getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 0);
    });

    it('相同颜色应该有最低对比度', () => {
      const ratio = getContrastRatio('#ffffff', '#ffffff');
      expect(ratio).toBeCloseTo(1, 0);
    });
  });

  describe('meetsWCAG', () => {
    it('应该检测 AA 标准', () => {
      expect(meetsWCAG('#000000', '#ffffff', 'AA')).toBe(true);
      expect(meetsWCAG('#777777', '#ffffff', 'AA')).toBe(false);
    });

    it('应该检测 AAA 标准', () => {
      expect(meetsWCAG('#000000', '#ffffff', 'AAA')).toBe(true);
    });
  });

  describe('getAccessibleForeground', () => {
    it('深色背景应该返回浅色前景', () => {
      const fg = getAccessibleForeground('#000000');
      const ratio = getContrastRatio(fg, '#000000');
      expect(ratio).toBeGreaterThan(4.5);
    });

    it('浅色背景应该返回深色前景', () => {
      const fg = getAccessibleForeground('#ffffff');
      const ratio = getContrastRatio(fg, '#ffffff');
      expect(ratio).toBeGreaterThan(4.5);
    });
  });
});
