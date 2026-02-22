import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/form-core';
import { onBeforeUnmount, onMounted, ref } from 'vue';

export function useLocaleVersion() {
  const version = ref(getLocaleVersion());
  let unsubscribe: null | (() => void) = null;

  onMounted(() => {
    unsubscribe = subscribeLocaleChange(() => {
      version.value = getLocaleVersion();
    });
  });

  onBeforeUnmount(() => {
    unsubscribe?.();
    unsubscribe = null;
  });

  return version;
}
