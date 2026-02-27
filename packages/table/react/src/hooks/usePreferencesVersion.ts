import {
  getActualThemeMode,
  getDefaultPreferencesStore,
} from '@admin-core/preferences';
import { useSyncExternalStore } from 'react';

const preferencesStore = getDefaultPreferencesStore();

function getThemeSnapshotVersion() {
  const preferences = preferencesStore.getPreferences();
  if (!preferences) {
    return '';
  }
  const theme = preferences.theme;
  const actualMode = getActualThemeMode(theme.mode);
  return [
    theme.builtinType,
    theme.mode,
    actualMode,
    theme.colorPrimary,
    theme.fontScale,
    theme.radius,
  ].join('|');
}

export function usePreferencesVersion() {
  return useSyncExternalStore(
    (listener) => preferencesStore.subscribe(listener),
    getThemeSnapshotVersion,
    getThemeSnapshotVersion
  );
}
