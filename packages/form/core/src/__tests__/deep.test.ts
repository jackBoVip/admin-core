import { describe, expect, it } from 'vitest';
import { deepClone } from '../utils/deep';

class MockDayjsLike {
  constructor(public readonly value: string) {}
}

describe('deep utils', () => {
  it('should keep non-plain object references when cloning form values', () => {
    const dateLike = new MockDayjsLike('2026-02-13');
    const input = {
      range: [dateLike],
    };

    const cloned = deepClone(input);

    expect(cloned).not.toBe(input);
    expect(cloned.range).not.toBe(input.range);
    expect(cloned.range[0]).toBe(dateLike);
    expect(cloned.range[0]).toBeInstanceOf(MockDayjsLike);
  });
});
