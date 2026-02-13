import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { isFieldRequiredMark } from '../utils/required';

describe('required mark', () => {
  it('should treat required/selectRequired as required mark', () => {
    expect(isFieldRequiredMark({ rules: 'required' })).toBe(true);
    expect(isFieldRequiredMark({ rules: 'selectRequired' })).toBe(true);
  });

  it('should not treat custom string rules as required mark', () => {
    expect(isFieldRequiredMark({ rules: 'reservedName' as any })).toBe(false);
  });

  it('should infer required mark from zod optionality', () => {
    expect(isFieldRequiredMark({ rules: z.string().email() })).toBe(true);
    expect(isFieldRequiredMark({ rules: z.string().optional() })).toBe(false);
  });
});

