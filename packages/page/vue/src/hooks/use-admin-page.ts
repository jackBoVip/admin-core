import type {
  AdminPageVueProps,
  ExtendedAdminPageApi,
  VuePageComponent,
} from '../types';

import {
  createPageApiWithRuntimeOptions,
  resolvePageStoreSelector,
} from '@admin-core/page-core';
import { type Component, defineComponent, h, onBeforeUnmount } from 'vue';

import { usePageStore } from './use-page-store';
import { AdminPage } from '../components/AdminPage';

export function useAdminPage(
  options: AdminPageVueProps = {}
) {
  const api = createPageApiWithRuntimeOptions<VuePageComponent>(
    options as Record<string, unknown>
  );
  const extendedApi = api as ExtendedAdminPageApi;

  onBeforeUnmount(() => {
    api.unmount();
  });

  extendedApi.useStore = <TSlice = AdminPageVueProps>(
    selector?: (state: AdminPageVueProps) => TSlice
  ) => {
    const safeSelector = resolvePageStoreSelector<
      AdminPageVueProps,
      TSlice
    >(selector);
    return usePageStore<ReturnType<typeof api.getSnapshot>, TSlice>(
      api.store,
      (snapshot) => {
        const state = snapshot.props as AdminPageVueProps;
        return safeSelector(state);
      }
    );
  };

  const Page = defineComponent(
    (props: AdminPageVueProps, { attrs, slots }) => {
      return () =>
        h(AdminPage as unknown as Component, {
          ...(options as Record<string, unknown>),
          ...(props as Record<string, unknown>),
          ...(attrs as Record<string, unknown>),
          api: extendedApi,
        }, slots);
    },
    {
      name: 'AdminPageUse',
      inheritAttrs: false,
    }
  );

  return [Page, extendedApi] as const;
}

export type UseAdminPage = typeof useAdminPage;
