import { describe, expect, it } from 'vitest';
import {
  ensureDateRangeValue,
  isNativeEmptyValue,
  mergeClassValue,
  normalizeNativeInputValue,
  omitRecordKeys,
  pickAdminStateAttrs,
  resolveNativeModelValue,
  toggleCollectionValue,
  updateDateRangeValue,
} from '../utils/native-shared';

describe('native shared utils', () => {
  it('should normalize and resolve model values', () => {
    expect(normalizeNativeInputValue(undefined)).toBe('');
    expect(normalizeNativeInputValue(null)).toBe('');
    expect(normalizeNativeInputValue(0)).toBe(0);
    expect(resolveNativeModelValue(undefined, 'fallback')).toBe('fallback');
    expect(resolveNativeModelValue('model', 'fallback')).toBe('model');
  });

  it('should pick and omit attrs', () => {
    const attrs = {
      foo: 1,
      class: 'x',
      'aria-invalid': true,
      'data-admin-invalid': 'true',
      'data-admin-status': 'error',
    };
    expect(pickAdminStateAttrs(attrs)).toEqual({
      'aria-invalid': true,
      'data-admin-invalid': 'true',
      'data-admin-status': 'error',
    });
    expect(omitRecordKeys(attrs, ['class', 'aria-invalid'])).toEqual({
      foo: 1,
      'data-admin-invalid': 'true',
      'data-admin-status': 'error',
    });
  });

  it('should toggle collection values', () => {
    expect(toggleCollectionValue([], 'a', true)).toEqual(['a']);
    expect(toggleCollectionValue(['a'], 'a', false)).toEqual([]);
    expect(toggleCollectionValue(['a'], 'b', true).sort()).toEqual(['a', 'b']);
  });

  it('should support date range helpers', () => {
    expect(ensureDateRangeValue(undefined)).toEqual(['', '']);
    expect(ensureDateRangeValue(['2026-01-01', undefined])).toEqual([
      '2026-01-01',
      '',
    ]);
    expect(updateDateRangeValue(['a', 'b'], 0, 'x')).toEqual(['x', 'b']);
    expect(updateDateRangeValue(['a', 'b'], 1, 'y')).toEqual(['a', 'y']);
  });

  it('should provide class and empty helpers', () => {
    expect(mergeClassValue('base')).toBe('base');
    expect(mergeClassValue('base', 'extra')).toBe('base extra');
    expect(isNativeEmptyValue(undefined)).toBe(true);
    expect(isNativeEmptyValue(null)).toBe(true);
    expect(isNativeEmptyValue('')).toBe(true);
    expect(isNativeEmptyValue(0)).toBe(false);
  });
});
