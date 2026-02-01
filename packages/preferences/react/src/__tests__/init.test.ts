import { describe, it, expect } from 'vitest';
import { initPreferences, getPreferencesManager, destroyPreferences } from '../hooks';

describe('preferences react init', () => {
  it('initializes and returns a manager instance', () => {
    destroyPreferences();
    const manager = initPreferences({ namespace: 'test' });
    expect(manager).toBeTruthy();
    expect(getPreferencesManager()).toBe(manager);
  });
});
