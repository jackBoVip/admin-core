import type {
  AdminPageReactProps,
  ExtendedAdminPageApi,
  ReactPageComponent,
} from '../types';

import {
  createPageApi,
  pickPageRuntimeStateOptions,
} from '@admin-core/page-core';
import { useEffect, useMemo, useRef } from 'react';

import { AdminPage } from '../components/AdminPage';
import { usePageSelector } from './use-page-selector';

export function useAdminPage(
  options: AdminPageReactProps = {}
) {
  const apiRef = useRef<ExtendedAdminPageApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = createPageApi<ReactPageComponent>(
      options
    ) as ExtendedAdminPageApi;
  }

  const api = apiRef.current;

  useEffect(() => {
    api.setState(pickPageRuntimeStateOptions(options));
    if (options.router?.currentPath) {
      api.syncRoute(options.router.currentPath);
    }
  }, [
    api,
    options.activeKey,
    options.keepInactivePages,
    options.onActiveChange,
    options.onPagesChange,
    options.pages,
    options.router,
    options.scroll,
  ]);

  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  function useStore<TSlice = AdminPageReactProps>(
    selector?: (state: AdminPageReactProps) => TSlice
  ) {
    const safeSelector =
      selector ??
      ((state: AdminPageReactProps) => state as unknown as TSlice);
    return usePageSelector(api, safeSelector);
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
