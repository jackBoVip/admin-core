import { describe, expect, it } from 'vitest';
import { createRangeRule } from '../utils/range-rule';

describe('range rule utils', () => {
  it('should use default compare logic', async () => {
    const rule = createRangeRule();
    const context = {
      fieldName: 'period',
      label: '时间范围',
      values: {},
    };
    expect(await rule(['2026-01-01', '2026-01-02'], undefined, context)).toBe(true);
    expect(await rule(['2026-01-02', '2026-01-01'], undefined, context)).toBe(
      '时间范围范围无效'
    );
  });

  it('should support custom validate and message', async () => {
    const rule = createRangeRule({
      message: '区间长度不能超过 30',
      validate(start, end) {
        return Number(end) - Number(start) <= 30;
      },
    });
    const context = {
      fieldName: 'scoreRange',
      label: '分数区间',
      values: {},
    };
    expect(await rule([10, 20], undefined, context)).toBe(true);
    expect(await rule([10, 99], undefined, context)).toBe('区间长度不能超过 30');
  });
});
