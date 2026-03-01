import { describe, expect, it } from 'vitest';
import {
  createFormPropsSyncTracker,
  mergeFormProps,
  omitFormApiProp,
  pickFormProps,
  pickSubmitPageProps,
} from '../utils/form-props-shared';

describe('form props shared utils', () => {
  it('should merge props with later source priority', () => {
    const merged = mergeFormProps(
      { a: 1, same: 'first' },
      { b: 2 },
      { same: 'last' }
    );
    expect(merged).toEqual({ a: 1, b: 2, same: 'last' });
  });

  it('should omit formApi prop', () => {
    const props = {
      formApi: { id: 1 },
      schema: [],
      layout: 'horizontal',
    };
    expect(omitFormApiProp(props)).toEqual({
      schema: [],
      layout: 'horizontal',
    });
  });

  it('should track deep changes for sync', () => {
    const tracker = createFormPropsSyncTracker();
    expect(tracker.hasChanges({ a: 1, nest: { b: 2 } })).toBe(true);
    expect(tracker.hasChanges({ a: 1, nest: { b: 2 } })).toBe(false);
    expect(tracker.hasChanges({ a: 1, nest: { b: 3 } })).toBe(true);
    tracker.reset();
    expect(tracker.hasChanges({ a: 1 })).toBe(true);
  });

  it('should pick only safe form props', () => {
    const picked = pickFormProps({
      labelAlign: 'right',
      onVnodeUnmounted: () => undefined,
      queryMode: true,
      requiredMarkFollowTheme: true,
      ref: { current: null },
      schema: [],
      showDefaultActions: false,
      values: { name: 'x' },
      wrapperClass: 'w',
    });
    expect(picked).toEqual({
      labelAlign: 'right',
      queryMode: true,
      requiredMarkFollowTheme: true,
      schema: [],
      showDefaultActions: false,
      wrapperClass: 'w',
    });
  });

  it('should pick submit-page props and drop runtime internals', () => {
    const picked = pickSubmitPageProps({
      mode: 'modal',
      onVnodeUnmounted: () => undefined,
      open: true,
      resetOnClose: false,
      resetOnSubmit: false,
      ref: { current: null },
      steps: [],
    });
    expect(picked).toEqual({
      mode: 'modal',
      open: true,
      resetOnClose: false,
      resetOnSubmit: false,
      steps: [],
    });
  });
});
