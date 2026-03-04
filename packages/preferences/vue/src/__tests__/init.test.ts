/**
 * preferences-vue 初始化与管理器单例读取测试。
 */
import { describe, it, expect } from 'vitest';
import { initPreferences, getPreferencesManager, destroyPreferences } from '../composables';

describe('preferences vue init', () => {
  it('initializes and returns a manager instance', () => {
    destroyPreferences();
    const manager = initPreferences({ namespace: 'test' });
    expect(manager).toBeTruthy();
    expect(getPreferencesManager()).toBe(manager);
  });
});
