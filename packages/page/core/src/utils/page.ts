import {
  DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS,
  DEFAULT_SCROLL_OPTIONS,
} from '../constants';
import { getLocaleMessages } from '../locales';
import type {
  AdminPageApi,
  AdminPageItem,
  AdminPageOptions,
  NormalizedPageFormTableBridgeOptions,
  NormalizedPageScrollOptions,
  PageFormTableBridgeOptions,
  PageComputedState,
  PageRouterLike,
  RoutePageItem,
} from '../types';
import {
  isPageComponentItem,
  isPageRouteItem,
} from './guards';

type PageRuntimeStateKeys =
  | 'activeKey'
  | 'keepInactivePages'
  | 'onActiveChange'
  | 'onPagesChange'
  | 'pages'
  | 'router'
  | 'scroll';

export function resolvePageStoreSelector<TState, TSlice = TState>(
  selector?: (state: TState) => TSlice
) {
  return (
    selector
    ?? ((state: TState) => state as unknown as TSlice)
  );
}

export function pickPageRuntimeStateOptions<TComponent = unknown>(
  options: Record<string, unknown> | undefined
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

export function syncPageRuntimeState<TComponent = unknown>(
  api: Pick<AdminPageApi<TComponent>, 'setState' | 'syncRoute'>,
  options: Record<string, unknown> | undefined
) {
  const runtimeOptions = pickPageRuntimeStateOptions<TComponent>(options);
  api.setState(runtimeOptions);
  const currentPath = runtimeOptions.router?.currentPath;
  if (currentPath) {
    api.syncRoute(currentPath);
  }
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
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
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

export function resolvePageItemContent<
  TComponent = unknown,
  TResult = unknown,
>(options: {
  page: AdminPageItem<TComponent>;
  renderComponent: (
    component: TComponent,
    props?: Record<string, unknown>
  ) => TResult;
  renderRoute: (page: RoutePageItem<TComponent>) => TResult;
}) {
  if (isPageComponentItem(options.page)) {
    return options.renderComponent(
      options.page.component,
      options.page.props
    );
  }

  const routePage = options.page as RoutePageItem<TComponent>;
  if (routePage.component !== undefined && routePage.component !== null) {
    return options.renderComponent(
      routePage.component,
      routePage.props
    );
  }

  return options.renderRoute(routePage);
}

export function resolvePageActiveContent<
  TComponent = unknown,
  TResult = unknown,
>(options: {
  activePage: AdminPageItem<TComponent> | null;
  renderEmpty: () => TResult;
  renderPage: (page: AdminPageItem<TComponent>) => TResult;
}) {
  if (!options.activePage) {
    return options.renderEmpty();
  }
  return options.renderPage(options.activePage);
}

export type PagePaneDescriptor<TComponent = unknown> = {
  active: boolean;
  className: string;
  page: AdminPageItem<TComponent>;
};

export type KeepInactivePagePaneState<TComponent = unknown> = {
  activeKey: null | string;
  descriptors: Array<PagePaneDescriptor<TComponent>>;
  indexByKey: Map<string, number>;
  pagesRef: AdminPageItem<TComponent>[];
};

export function resolvePageContentClassName(scrollEnabled: boolean) {
  return [
    'admin-page__content',
    scrollEnabled
      ? 'admin-page__content--scroll'
      : 'admin-page__content--static',
  ].join(' ');
}

export function isPagePaneActive(
  pageKey: string | undefined,
  activeKey: null | string
) {
  return pageKey === activeKey;
}

export function resolvePagePaneClassName(active: boolean) {
  return [
    'admin-page__pane',
    active ? 'is-active' : 'is-inactive',
  ].join(' ');
}

export function resolveKeepInactivePagePanes<TComponent = unknown>(
  pages: AdminPageItem<TComponent>[],
  activeKey: null | string
): Array<PagePaneDescriptor<TComponent>> {
  return pages.map((page) => {
    const active = isPagePaneActive(page.key, activeKey);
    return {
      active,
      className: resolvePagePaneClassName(active),
      page,
    };
  });
}

export function createKeepInactivePagePaneState<TComponent = unknown>(
  pages: AdminPageItem<TComponent>[],
  activeKey: null | string
): KeepInactivePagePaneState<TComponent> {
  const descriptors = resolveKeepInactivePagePanes(pages, activeKey);
  const indexByKey = new Map<string, number>();
  for (let index = 0; index < pages.length; index += 1) {
    const key = pages[index]?.key;
    if (!key || indexByKey.has(key)) {
      continue;
    }
    indexByKey.set(key, index);
  }
  return {
    activeKey,
    descriptors,
    indexByKey,
    pagesRef: pages,
  };
}

export function reconcileKeepInactivePagePaneState<TComponent = unknown>(
  previous: KeepInactivePagePaneState<TComponent> | null | undefined,
  pages: AdminPageItem<TComponent>[],
  activeKey: null | string
): KeepInactivePagePaneState<TComponent> {
  if (!previous || previous.pagesRef !== pages) {
    return createKeepInactivePagePaneState(pages, activeKey);
  }
  if (previous.activeKey === activeKey) {
    return previous;
  }

  const descriptors = previous.descriptors.slice();
  const previousActiveKey = previous.activeKey;
  if (previousActiveKey) {
    const previousIndex = previous.indexByKey.get(previousActiveKey);
    if (previousIndex !== undefined) {
      const previousDescriptor = descriptors[previousIndex];
      if (previousDescriptor?.active) {
        descriptors[previousIndex] = {
          ...previousDescriptor,
          active: false,
          className: resolvePagePaneClassName(false),
        };
      }
    }
  }

  if (activeKey) {
    const nextIndex = previous.indexByKey.get(activeKey);
    if (nextIndex !== undefined) {
      const nextDescriptor = descriptors[nextIndex];
      if (nextDescriptor && !nextDescriptor.active) {
        descriptors[nextIndex] = {
          ...nextDescriptor,
          active: true,
          className: resolvePagePaneClassName(true),
        };
      }
    }
  }

  return {
    activeKey,
    descriptors,
    indexByKey: previous.indexByKey,
    pagesRef: pages,
  };
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
