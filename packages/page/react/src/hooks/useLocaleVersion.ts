import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/page-core';
import { useSyncExternalStore } from 'react';

export function useLocaleVersion() {
  return useSyncExternalStore(
    subscribeLocaleChange,
    getLocaleVersion,
    getLocaleVersion
  );
}
