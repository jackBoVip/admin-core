import {
  getLocaleVersion,
  subscribeLocaleChange,
} from '@admin-core/page-core';
import { createUseLocaleVersionHook } from '@admin-core/shared-vue';

const useLocaleVersionHook = createUseLocaleVersionHook(
  getLocaleVersion,
  subscribeLocaleChange
);

export function useLocaleVersion() {
  return useLocaleVersionHook();
}
