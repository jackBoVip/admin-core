import { describe, expect, it } from 'vitest';
import {
  calculateTabbarScrollOffset,
  calculateTabbarScrollPosition,
} from '../utils/tabbar';

describe('tabbar scroll utils', () => {
  it('calculateTabbarScrollOffset should use provided ratio/min values', () => {
    expect(calculateTabbarScrollOffset(300, 0.25, 50)).toBe(75);
    expect(calculateTabbarScrollOffset(100, 0.1, 30)).toBe(30);
  });

  it('calculateTabbarScrollPosition should scroll left when target is hidden on the left', () => {
    const next = calculateTabbarScrollPosition({
      containerWidth: 300,
      scrollLeft: 120,
      targetLeft: 80,
      targetWidth: 60,
      offsetRatio: 0.2,
      minOffset: 40,
    });
    expect(next).toBe(20);
  });

  it('calculateTabbarScrollPosition should scroll right when target is hidden on the right', () => {
    const next = calculateTabbarScrollPosition({
      containerWidth: 300,
      scrollLeft: 100,
      targetLeft: 430,
      targetWidth: 80,
      offsetRatio: 0.2,
      minOffset: 40,
    });
    expect(next).toBe(270);
  });

  it('calculateTabbarScrollPosition should keep position when target is visible', () => {
    const next = calculateTabbarScrollPosition({
      containerWidth: 300,
      scrollLeft: 100,
      targetLeft: 150,
      targetWidth: 120,
      offsetRatio: 0.2,
      minOffset: 40,
    });
    expect(next).toBe(100);
  });

  it('calculateTabbarScrollPosition should clamp to zero', () => {
    const next = calculateTabbarScrollPosition({
      containerWidth: 300,
      scrollLeft: 10,
      targetLeft: 5,
      targetWidth: 20,
      offsetRatio: 0.5,
      minOffset: 200,
    });
    expect(next).toBe(0);
  });
});
