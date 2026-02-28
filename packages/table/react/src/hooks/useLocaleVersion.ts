import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/table-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-react';

const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

export function useLocaleVersion() {
  return useLocaleVersionHook();
}
