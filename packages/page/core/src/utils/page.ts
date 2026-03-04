/**
 * Page 运行态工具函数集合。
 * @description 提供页面配置标准化、路由命中、滚动策略解析与 keep-inactive 面板状态维护能力。
 */

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

/**
 * 页面运行时状态字段白名单。
 * @description 用于从组件配置中提取可写入内部 store 的受控运行态字段。
 */
type PageRuntimeStateKeys =
  | 'activeKey'
  | 'keepInactivePages'
  | 'onActiveChange'
  | 'onPagesChange'
  | 'pages'
  | 'router'
  | 'scroll';

/**
 * 解析页面 store selector，未传时返回 identity selector。
 * @param selector 外部 selector。
 * @returns 最终 selector。
 */
export function resolvePageStoreSelector<TState, TSlice = TState>(
  selector?: (state: TState) => TSlice
) {
  return (
    selector
    ?? ((state: TState) => state as unknown as TSlice)
  );
}

/**
 * 从完整配置中提取运行时状态相关字段。
 * @param options 原始配置。
 * @returns 运行时状态字段子集。
 */
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

/**
 * 同步页面运行时状态到 API，并在可用时触发路由同步。
 * @param api 页面 API。
 * @param options 原始配置。
 * @returns 无返回值。
 */
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

/**
 * 标准化滚动配置。
 * @param scroll 原始滚动配置。
 * @returns 标准化滚动配置。
 */
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

/**
 * 标准化表单-表格桥接配置。
 * @param options 原始桥接配置。
 * @returns 标准化桥接配置。
 */
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

/**
 * 解析页面 key。
 * @param page 页面项。
 * @param index 页面索引。
 * @returns 稳定页面 key。
 */
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

/**
 * 解析页面标题，缺失时使用“未命名页面 + 序号”。
 * @param page 页面项。
 * @param index 页面索引。
 * @returns 页面标题。
 */
export function resolvePageTitle<TComponent = unknown>(
  page: AdminPageItem<TComponent>,
  index: number
): string {
  if (page.title && page.title.trim().length > 0) {
    return page.title;
  }
  return `${getLocaleMessages().page.untitled} ${index + 1}`;
}

/**
 * 标准化页面列表，补齐 key/title 与默认字段。
 * @param pages 原始页面列表。
 * @returns 标准化页面列表。
 */
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

/** 单个页面内容解析参数。 */
export interface ResolvePageItemContentOptions<
  TComponent = unknown,
  TResult = unknown,
> {
  /** 当前页面项。 */
  page: AdminPageItem<TComponent>;
  /** 组件页渲染器。 */
  renderComponent: (component: TComponent, props?: Record<string, unknown>) => TResult;
  /** 路由页渲染器。 */
  renderRoute: (page: RoutePageItem<TComponent>) => TResult;
}

/**
 * 解析单个页面项的渲染内容。
 * @param options 渲染参数。
 * @returns 渲染结果。
 */
export function resolvePageItemContent<
  TComponent = unknown,
  TResult = unknown,
>(
  options: ResolvePageItemContentOptions<TComponent, TResult>
) {
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

/** 当前激活页内容解析参数。 */
export interface ResolvePageActiveContentOptions<
  TComponent = unknown,
  TResult = unknown,
> {
  /** 当前激活页面。 */
  activePage: AdminPageItem<TComponent> | null;
  /** 空态渲染器。 */
  renderEmpty: () => TResult;
  /** 页面渲染器。 */
  renderPage: (page: AdminPageItem<TComponent>) => TResult;
}

/**
 * 渲染当前激活页内容，不存在时渲染空态。
 * @param options 渲染参数。
 * @returns 渲染结果。
 */
export function resolvePageActiveContent<
  TComponent = unknown,
  TResult = unknown,
>(
  options: ResolvePageActiveContentOptions<TComponent, TResult>
) {
  if (!options.activePage) {
    return options.renderEmpty();
  }
  return options.renderPage(options.activePage);
}

/**
 * 保留非激活页面模式下的页面面板描述。
 * @description 对单个页面在 keep-inactive 模式下的展示状态进行扁平描述。
 */
export type PagePaneDescriptor<TComponent = unknown> = {
  /** 是否当前激活。 */
  active: boolean;
  /** 样式类名。 */
  className: string;
  /** 对应页面项。 */
  page: AdminPageItem<TComponent>;
};

/**
 * 保留非激活页面模式下的面板缓存状态。
 * @description 在页面引用未变化时复用索引映射与描述数组，降低重建开销。
 */
export type KeepInactivePagePaneState<TComponent = unknown> = {
  /** 当前激活页面 key。 */
  activeKey: null | string;
  /** 面板描述列表。 */
  descriptors: Array<PagePaneDescriptor<TComponent>>;
  /** 页面 key 到索引映射。 */
  indexByKey: Map<string, number>;
  /** 当前 pages 引用，用于快速判断是否需要整体重建。 */
  pagesRef: AdminPageItem<TComponent>[];
};

/**
 * 解析页面内容容器 class。
 * @param scrollEnabled 是否启用滚动。
 * @returns 页面内容容器 class 名称。
 */
export function resolvePageContentClassName(scrollEnabled: boolean) {
  return [
    'admin-page__content',
    scrollEnabled
      ? 'admin-page__content--scroll'
      : 'admin-page__content--static',
  ].join(' ');
}

/**
 * 判断页面面板是否激活。
 * @param pageKey 页面 key。
 * @param activeKey 当前激活 key。
 * @returns 是否激活。
 */
export function isPagePaneActive(
  pageKey: string | undefined,
  activeKey: null | string
) {
  return pageKey === activeKey;
}

/**
 * 解析页面面板 class。
 * @param active 是否激活。
 * @returns 页面面板 class 名称。
 */
export function resolvePagePaneClassName(active: boolean) {
  return [
    'admin-page__pane',
    active ? 'is-active' : 'is-inactive',
  ].join(' ');
}

/**
 * 基于页面列表与激活 key 生成 keep-inactive 面板描述列表。
 * @param pages 页面列表。
 * @param activeKey 当前激活 key。
 * @returns 面板描述列表。
 */
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

/**
 * 创建 keep-inactive 面板状态。
 * @param pages 页面列表。
 * @param activeKey 当前激活 key。
 * @returns 面板状态。
 */
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

/**
 * 在页面列表引用未变化时复用并增量更新 keep-inactive 面板状态。
 * @param previous 旧状态。
 * @param pages 当前页面列表。
 * @param activeKey 当前激活 key。
 * @returns 新状态。
 */
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

/**
 * 判断路由页是否命中给定路径。
 * @param page 路由页配置。
 * @param path 当前路径。
 * @returns 命中返回 `true`，否则返回 `false`。
 */
function isRouteMatched<TComponent = unknown>(
  page: RoutePageItem<TComponent>,
  path: string
) {
  if (page.exact === false) {
    return path === page.path || path.startsWith(`${page.path}/`);
  }
  return path === page.path;
}

/**
 * 按路径查找命中的路由页。
 * @param pages 页面列表。
 * @param path 当前路径。
 * @returns 命中的路由页。
 */
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

/**
 * 解析当前激活页面 key。
 * @description 优先级为：外部受控 key > 当前路由匹配页 > 页面列表首项。
 * @param options 页面配置。
 * @param pages 标准化页面列表。
 * @returns 激活 key。
 */
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

/**
 * 解析当前激活页是否启用滚动。
 * @param globalScroll 全局滚动配置。
 * @param page 当前激活页。
 * @returns 是否启用滚动。
 */
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

/**
 * 计算页面运行态派生状态。
 * @param options 页面配置。
 * @returns 计算后的页面状态。
 */
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

/**
 * 导航到指定路由页。
 * @param router 路由能力对象。
 * @param page 目标路由页。
 * @returns 无返回值。
 */
export function navigateToRoutePage<TComponent = unknown>(
  router: PageRouterLike<TComponent> | undefined,
  page: RoutePageItem<TComponent> | null
) {
  if (!router?.navigate || !page) {
    return;
  }
  void router.navigate(page.path, page);
}
