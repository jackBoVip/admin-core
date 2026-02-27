import type {
  AdminPageVueProps,
  ExtendedAdminPageApi,
  VuePageComponent,
} from '../types';

import { createPageApi } from '@admin-core/page-core';
import { defineComponent, h, onBeforeUnmount } from 'vue';

import { usePageStore } from './use-page-store';
import { AdminPage } from '../components/AdminPage';

export function useAdminPage(
  options: AdminPageVueProps = {}
) {
  const api = createPageApi<VuePageComponent>(options as any);
  const extendedApi = api as ExtendedAdminPageApi;

  extendedApi.useStore = <TSlice = AdminPageVueProps>(
    selector?: (state: AdminPageVueProps) => TSlice
  ) =>
    usePageStore(api.store, (snapshot) => {
      const state = snapshot.props as AdminPageVueProps;
      return selector ? selector(state) : (state as unknown as TSlice);
    });

  const Page = defineComponent(
    (props: AdminPageVueProps, { attrs, slots }) => {
      onBeforeUnmount(() => {
        api.unmount();
      });

      return () =>
        h(
          AdminPage as any,
          {
            ...(options as any),
            ...props,
            ...(attrs as any),
            api: extendedApi,
          },
          slots
        );
    },
    {
      name: 'AdminPageUse',
      inheritAttrs: false,
    }
  );

  return [Page, extendedApi] as const;
}

export type UseAdminPage = typeof useAdminPage;
