import { describe, expect, it } from 'vitest';
import { calculateVirtualRange, shouldVirtualize } from '../utils/virtual-scroll';

describe('virtual-scroll utils', () => {
  it('calculateVirtualRange should return empty range for invalid dimensions', () => {
    expect(
      calculateVirtualRange({
        scrollTop: 0,
        viewportHeight: 0,
        itemHeight: 40,
        totalItems: 10,
      })
    ).toEqual({
      startIndex: 0,
      endIndex: 0,
      visibleCount: 0,
    });
  });

  it('calculateVirtualRange should calculate range with overscan', () => {
    const range = calculateVirtualRange({
      scrollTop: 100,
      viewportHeight: 300,
      itemHeight: 50,
      totalItems: 100,
      overscan: 2,
    });
    expect(range).toEqual({
      startIndex: 0,
      endIndex: 10,
      visibleCount: 10,
    });
  });

  it('calculateVirtualRange should clamp end index to total items', () => {
    const range = calculateVirtualRange({
      scrollTop: 980,
      viewportHeight: 200,
      itemHeight: 20,
      totalItems: 50,
      overscan: 4,
    });
    expect(range.endIndex).toBe(50);
    expect(range.startIndex).toBeGreaterThanOrEqual(0);
  });

  it('shouldVirtualize should match expected thresholds', () => {
    expect(
      shouldVirtualize({
        enabled: false,
        viewportHeight: 400,
        itemHeight: 40,
        totalItems: 20,
      })
    ).toBe(false);

    expect(
      shouldVirtualize({
        enabled: true,
        viewportHeight: 400,
        itemHeight: 40,
        totalItems: 10,
      })
    ).toBe(false);

    expect(
      shouldVirtualize({
        enabled: true,
        viewportHeight: 400,
        itemHeight: 40,
        totalItems: 11,
      })
    ).toBe(true);
  });
});
