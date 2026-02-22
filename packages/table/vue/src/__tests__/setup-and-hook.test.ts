import { describe, expect, it, vi } from 'vitest';

import { getAdminTableVueSetupState, setupAdminTableVue } from '../setup';

describe('table vue adapter', () => {
  it('setup should apply runtime options', () => {
    const permissionChecker = vi.fn(() => true);

    setupAdminTableVue({
      bindPreferences: false,
      locale: 'en-US',
      permissionChecker,
    });

    const state = getAdminTableVueSetupState();
    expect(state.permissionChecker).toBe(permissionChecker);
  });

  it('setup should keep previous checker when not provided', () => {
    const previous = getAdminTableVueSetupState().permissionChecker;
    setupAdminTableVue({
      bindPreferences: false,
      locale: 'zh-CN',
    });
    expect(getAdminTableVueSetupState().permissionChecker).toBe(previous);
  });
});
