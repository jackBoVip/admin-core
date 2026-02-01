import type { Preferences } from '../types';

export function isLockScreenEnabled(preferences: Preferences): boolean {
  return preferences.widget.lockScreen === true;
}

export function hasLockScreenPassword(preferences: Preferences): boolean {
  return Boolean(preferences.lockScreen.password);
}

export function canLockScreen(preferences: Preferences): boolean {
  return isLockScreenEnabled(preferences) && hasLockScreenPassword(preferences);
}
