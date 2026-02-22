import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/form-core';
import { useSyncExternalStore } from 'react';

export function useLocaleVersion() {
  return useSyncExternalStore(
    subscribeLocaleChange,
    getLocaleVersion,
    getLocaleVersion
  );
}
