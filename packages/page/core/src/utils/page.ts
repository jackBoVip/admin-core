import {
  DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS,
  DEFAULT_SCROLL_OPTIONS,
} from '../constants';
import { getLocaleMessages } from '../locales';
import type {
  AdminPageItem,
  AdminPageOptions,
  NormalizedPageFormTableBridgeOptions,
  NormalizedPageScrollOptions,
  PageFormTableBridgeOptions,
  PageComputedState,
  PageRouterLike,
  RoutePageItem,
} from '../types';
import { isPageRouteItem } from './guards';

type PageRuntimeStateKeys =
  | 'activeKey'
  | 'keepInactivePages'
  | 'onActiveChange'
  | 'onPagesChange'
  | 'pages'
  | 'router'
  | 'scroll';

export function pickPageRuntimeStateOptions<TComponent = unknown>(
  options: Record<string, any> | undefined
): Pick<AdminPageOptions<TComponent>, PageRuntimeStateKeys> {
  const source = (options ?? {}) as Partial<
    Pick<AdminPageOptions<TComponent>, PageRuntimeStateKeys>
  >;
  return {
    activeKey: source.activeKey,
    keepInactivePages: source.keepInactivePages,
    onActiveChange: source.onActiveChange,
    onPagesChange: source.onPagesChange,
    pages: source.pages,
    router: source.router,
    scroll: source.scroll,
  };
}

export function normalizeScrollOptions(
  scroll: AdminPageOptions['scroll']
): NormalizedPageScrollOptions {
  if (typeof scroll === 'boolean') {
    return {
      ...DEFAULT_SCROLL_OPTIONS,
      enabled: scroll,
    };
  }
  return {
    ...DEFAULT_SCROLL_OPTIONS,
    ...(scroll ?? {}),
  };
}

export function normalizePageFormTableBridgeOptions<
  TFormValues extends Record<string, any> = Record<string, any>,
  TFormApi = unknown,
  TTableApi = unknown,
>(
  options: boolean | PageFormTableBridgeOptions<TFormValues, TFormApi, TTableApi> | undefined
): NormalizedPageFormTableBridgeOptions<TFormValues, TFormApi, TTableApi> {
  if (typeof options === 'boolean') {
    return {
      ...DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS,
      enabled: options,
    };
  }
  return {
    ...DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS,
    ...(options ?? {}),
    enabled:
      options?.enabled ?? DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS.enabled,
    mapParams: options?.mapParams,
    queryOnSubmit: options?.queryOnSubmit
      ?? DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS.queryOnSubmit,
    reloadOnReset: options?.reloadOnReset
      ?? DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS.reloadOnReset,
  };
}

export function resolvePageKey<TComponent = unknown>(
  page: AdminPageItem<TComponent>,
  index: number
): string {
  if (page.key) {
    return page.key;
  }
  if (page.type === 'route') {
    return page.path;
  }
  return `component-${index + 1}`;
}

export function resolvePageTitle<TComponent = unknown>(
  page: AdminPageItem<TComponent>,
  index: number
): string {
  if (page.title && page.title.trim().length > 0) {
    return page.title;
  }
  return `${getLocaleMessages().page.untitled} ${index + 1}`;
}

export function normalizePageItems<TComponent = unknown>(
  pages: AdminPageOptions<TComponent>['pages']
): AdminPageItem<TComponent>[] {
  return (pages ?? []).map((page, index) => {
    const key = resolvePageKey(page, index);
    const title = resolvePageTitle(page, index);

    if (page.type === 'route') {
      return {
        ...page,
        exact: page.exact ?? true,
        key,
        title,
      };
    }

    return {
      ...page,
      key,
      title,
    };
  });
}

function isRouteMatched<TComponent = unknown>(
  page: RoutePageItem<TComponent>,
  path: string
) {
  if (page.exact === false) {
    return path === page.path || path.startsWith(`${page.path}/`);
  }
  return path === page.path;
}

export function resolveRoutePageByPath<TComponent = unknown>(
  pages: AdminPageItem<TComponent>[],
  path: string
): null | RoutePageItem<TComponent> {
  for (const page of pages) {
    if (!isPageRouteItem(page)) {
      continue;
    }
    if (isRouteMatched(page, path)) {
      return page;
    }
  }
  return null;
}

export function resolveActiveKey<TComponent = unknown>(
  options: AdminPageOptions<TComponent>,
  pages: AdminPageItem<TComponent>[]
): null | string {
  if (pages.length === 0) {
    return null;
  }

  const requestedKey = options.activeKey;
  if (requestedKey && pages.some((page) => page.key === requestedKey)) {
    return requestedKey;
  }

  const currentPath = options.router?.currentPath;
  if (currentPath) {
    const routePage = resolveRoutePageByPath(pages, currentPath);
    if (routePage?.key) {
      return routePage.key;
    }
  }

  return pages[0]?.key ?? null;
}

export function resolveScrollEnabled<TComponent = unknown>(
  globalScroll: AdminPageOptions<TComponent>['scroll'],
  page: AdminPageItem<TComponent> | null
) {
  const normalizedGlobal = normalizeScrollOptions(globalScroll);
  const pageScroll = page?.scroll;

  if (typeof pageScroll === 'boolean') {
    return pageScroll;
  }

  if (pageScroll && typeof pageScroll === 'object') {
    return pageScroll.enabled ?? normalizedGlobal.enabled;
  }

  return normalizedGlobal.enabled;
}

export function resolveComputedState<TComponent = unknown>(
  options: AdminPageOptions<TComponent>
): PageComputedState<TComponent> {
  const pages = normalizePageItems(options.pages);
  const activeKey = resolveActiveKey(options, pages);
  const activePage =
    pages.find((page) => page.key === activeKey) ?? null;

  return {
    activeKey,
    activePage,
    pages,
    scrollEnabled: resolveScrollEnabled(options.scroll, activePage),
  };
}

export function navigateToRoutePage<TComponent = unknown>(
  router: PageRouterLike<TComponent> | undefined,
  page: RoutePageItem<TComponent> | null
) {
  if (!router?.navigate || !page) {
    return;
  }
  void router.navigate(page.path, page);
}
