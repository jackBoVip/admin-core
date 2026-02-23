import { getDefaultPreferencesStore } from '@admin-core/preferences';
import { useSyncExternalStore } from 'react';

const preferencesStore = getDefaultPreferencesStore();

function getThemeSnapshotVersion() {
  const preferences = preferencesStore.getPreferences();
  if (!preferences) {
    return '';
  }
  const theme = preferences.theme;
  return [
    theme.mode,
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

