import { getDefaultPreferencesStore } from '@admin-core/preferences';
import { normalizeTableLocale } from '@admin-core/table-core';
import { onBeforeUnmount, onMounted, ref } from 'vue';

const preferencesStore = getDefaultPreferencesStore();

function resolvePreferencesLocale() {
  const preferences = preferencesStore.getPreferences();
  return normalizeTableLocale(preferences?.app?.locale);
}

export function usePreferencesLocale() {
  const locale = ref(resolvePreferencesLocale());
  let unsubscribe: null | (() => void) = null;

  onMounted(() => {
    locale.value = resolvePreferencesLocale();
    unsubscribe = preferencesStore.subscribe((preferences) => {
      locale.value = normalizeTableLocale(preferences?.app?.locale);
    });
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return locale;
}
