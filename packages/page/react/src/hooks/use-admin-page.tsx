import type {
  AdminPageReactProps,
  ExtendedAdminPageApi,
  ReactPageComponent,
} from '../types';

import {
  createPageApiWithRuntimeOptions,
  resolvePageStoreSelector,
  syncPageRuntimeState,
} from '@admin-core/page-core';
import { useEffect, useMemo, useRef } from 'react';

import { AdminPage } from '../components/AdminPage';
import { usePageSelector } from './use-page-selector';

export function useAdminPage(
  options: AdminPageReactProps = {}
) {
  const {
    activeKey,
    keepInactivePages,
    onActiveChange,
    onPagesChange,
    pages,
    router,
    scroll,
  } = options;
  const apiRef = useRef<ExtendedAdminPageApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = createPageApiWithRuntimeOptions<ReactPageComponent>(
      options as Record<string, unknown>
    ) as ExtendedAdminPageApi;
  }

  const api = apiRef.current;

  useEffect(() => {
    syncPageRuntimeState(api, {
      activeKey,
      keepInactivePages,
      onActiveChange,
      onPagesChange,
      pages,
      router,
      scroll,
    });
  }, [
    api,
    activeKey,
    keepInactivePages,
    onActiveChange,
    onPagesChange,
    pages,
    router,
    router?.currentPath,
    scroll,
  ]);

  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  function useStore<TSlice = AdminPageReactProps>(
    selector?: (state: AdminPageReactProps) => TSlice
  ): TSlice {
    const safeSelector = resolvePageStoreSelector<
      AdminPageReactProps,
      TSlice
    >(selector);
    return usePageSelector<ReactPageComponent, TSlice>(
      api,
      safeSelector
    );
  }

  api.useStore = useStore;

  const Page = useMemo(
    () =>
      function UseAdminPage(props: AdminPageReactProps) {
        return <AdminPage {...props} api={api} />;
      },
    [api]
  );

  return [Page, api] as const;
}

export type UseAdminPage = typeof useAdminPage;
