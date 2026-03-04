/**
 * Page Core 页面 API 实现。
 * @description 提供页面状态管理、路由同步、派生快照计算与对外操作接口。
 */
import { ensurePageCoreSetup } from './config';
import { createDefaultPageOptions } from './constants';
import {
  deepEqual,
  isFunction,
  isPageRouteItem,
  mergeWithArrayOverride,
  navigateToRoutePage,
  normalizePageItems,
  pickPageRuntimeStateOptions,
  resolveComputedState,
  resolveRoutePageByPath,
  resolveScrollEnabled,
} from './utils';
import { createStore } from '@admin-core/shared-core';
import type {
  AddPageOptions,
  AdminPageApi,
  AdminPageItem,
  AdminPageOptions,
  AdminPageSnapshot,
  PageComputedState,
  RemovePageOptions,
  RoutePageItem,
  SetActivePageOptions,
} from './types';

/** 路由命中结果缓存上限，超限后整体清空避免长期增长。 */
const ROUTE_MATCH_CACHE_LIMIT = 128;

/**
 * AdminPageApi 内部实现。
 * @description 负责维护页面状态、派生快照、路由同步与增删改查行为。
 */
class AdminPageApiImpl<TComponent = unknown>
  implements AdminPageApi<TComponent>
{
  /** 组件实例引用，由宿主框架在 mount 时注入。 */
  private instance: unknown = null;

  /** 组件是否已挂载。 */
  private mounted = false;

  /** 当前页面容器状态。 */
  private state: AdminPageOptions<TComponent>;

  /** 最近一次已同步的路由路径，用于去重。 */
  private lastSyncedRoutePath: string | undefined = undefined;

  /** 页面索引缓存对应的 pages 引用。 */
  private pageLookupPagesRef: AdminPageItem<TComponent>[] | null = null;

  /** 页面 key 到页面项映射。 */
  private pageByKey = new Map<string, AdminPageItem<TComponent>>();

  /** 路由精确路径到页面项映射。 */
  private routeByExactPath = new Map<string, RoutePageItem<TComponent>>();

  /** 路由匹配缓存。 */
  private routeMatchCache = new Map<string, null | RoutePageItem<TComponent>>();

  /** 是否存在前缀匹配路由（`exact === false`）。 */
  private hasPrefixRoute = false;

  /** 对外暴露的只读快照仓库。 */
  public store = createStore<AdminPageSnapshot<TComponent>>({
    computed: resolveComputedState(createDefaultPageOptions<TComponent>()),
    instance: null,
    mounted: false,
    props: createDefaultPageOptions<TComponent>(),
  });

  /**
   * 构造页面 API。
   * @param options 初始化配置。
   * @returns 无返回值。
   */
  constructor(options: AdminPageOptions<TComponent> = {}) {
    ensurePageCoreSetup();
    this.state = this.sealState(
      this.withNormalizedPages(
        mergeWithArrayOverride(
          options,
          createDefaultPageOptions<TComponent>()
        )
      )
    );
    this.updateSnapshot(true);
  }

  /**
   * 获取当前页面状态。
   *
   * @returns 当前页面配置对象引用。
   */
  getState() {
    return this.state;
  }

  /**
   * 获取当前快照。
   *
   * @returns 当前页面快照对象。
   */
  getSnapshot() {
    return this.store.getState();
  }

  /**
   * 归一化页面列表，确保 key/title 等派生字段稳定。
   * @param state 原始状态。
   * @returns 补全后的状态。
   */
  private withNormalizedPages(
    state: AdminPageOptions<TComponent>
  ): AdminPageOptions<TComponent> {
    if (state.pages === undefined) {
      return state;
    }
    return {
      ...state,
      pages: normalizePageItems(state.pages),
    };
  }

  /**
   * 冻结状态对象与页面项，避免外部突变。
   * @param state 待冻结状态。
   * @returns 冻结后的状态。
   */
  private sealState(
    state: AdminPageOptions<TComponent>
  ): AdminPageOptions<TComponent> {
    const pages = state.pages as undefined | AdminPageItem<TComponent>[];
    if (pages && !Object.isFrozen(pages)) {
      for (const page of pages) {
        if (!Object.isFrozen(page)) {
          Object.freeze(page);
        }
      }
      Object.freeze(pages);
    }
    if (!Object.isFrozen(state)) {
      Object.freeze(state);
    }
    return state;
  }

  /**
   * 冻结派生状态对象。
   * @param computed 派生状态。
   * @returns 冻结后的派生状态。
   */
  private sealComputed(
    computed: PageComputedState<TComponent>
  ): PageComputedState<TComponent> {
    if (!Object.isFrozen(computed)) {
      Object.freeze(computed);
    }
    return computed;
  }

  /**
   * 冻结快照对象。
   * @param snapshot 待冻结快照。
   * @returns 冻结后的快照。
   */
  private sealSnapshot(
    snapshot: AdminPageSnapshot<TComponent>
  ): AdminPageSnapshot<TComponent> {
    if (!Object.isFrozen(snapshot)) {
      Object.freeze(snapshot);
    }
    return snapshot;
  }

  /**
   * 快速计算页面派生状态。
   * @returns 当前派生状态。
   */
  private resolveComputedStateFast(): PageComputedState<TComponent> {
    const pages = (this.state.pages ?? []) as AdminPageItem<TComponent>[];
    this.syncPageLookup(pages);
    const activeKey = this.resolveActiveKeyFast(pages);
    const activePage =
      activeKey === null
        ? null
        : this.pageByKey.get(activeKey) ?? null;

    return {
      activeKey,
      activePage,
      pages,
      scrollEnabled: resolveScrollEnabled(this.state.scroll, activePage),
    };
  }

  /**
   * 基于当前页面列表重建 key/path 索引与路由缓存能力。
   * @param pages 当前页面列表。
   * @returns 无返回值。
   */
  private syncPageLookup(pages: AdminPageItem<TComponent>[]) {
    if (this.pageLookupPagesRef === pages) {
      return;
    }
    this.pageLookupPagesRef = pages;
    this.pageByKey.clear();
    this.routeByExactPath.clear();
    this.routeMatchCache.clear();
    this.hasPrefixRoute = false;

    for (const page of pages) {
      if (page.key && !this.pageByKey.has(page.key)) {
        this.pageByKey.set(page.key, page);
      }
      if (!isPageRouteItem(page)) {
        continue;
      }
      if (page.exact === false) {
        this.hasPrefixRoute = true;
      }
      if (!this.routeByExactPath.has(page.path)) {
        this.routeByExactPath.set(page.path, page);
      }
    }
  }

  /**
   * 带缓存地按路径匹配路由页面。
   * @param path 当前路径。
   * @param pages 页面列表。
   * @returns 命中的路由页面。
   */
  private resolveRoutePageByPathFast(
    path: string,
    pages: AdminPageItem<TComponent>[]
  ) {
    if (this.routeMatchCache.has(path)) {
      return this.routeMatchCache.get(path) ?? null;
    }

    const matched = this.hasPrefixRoute
      ? resolveRoutePageByPath(pages, path)
      : this.routeByExactPath.get(path) ?? null;

    if (
      !this.routeMatchCache.has(path)
      && this.routeMatchCache.size >= ROUTE_MATCH_CACHE_LIMIT
    ) {
      this.routeMatchCache.clear();
    }
    this.routeMatchCache.set(path, matched);
    return matched;
  }

  /**
   * 快速解析激活页 key。
   * @param pages 页面列表。
   * @returns 激活页 key。
   */
  private resolveActiveKeyFast(pages: AdminPageItem<TComponent>[]) {
    if (pages.length === 0) {
      return null;
    }

    const requestedKey = this.state.activeKey;
    if (requestedKey && this.pageByKey.has(requestedKey)) {
      return requestedKey;
    }

    const currentPath = this.state.router?.currentPath;
    if (currentPath) {
      const routePage = this.resolveRoutePageByPathFast(currentPath, pages);
      if (routePage?.key) {
        return routePage.key;
      }
    }

    return pages[0]?.key ?? null;
  }

  /**
   * 判断两个状态对象是否共享关键字段引用。
   * @param previous 旧状态。
   * @param next 新状态。
   * @returns 关键字段引用是否一致。
   */
  private isStateReferenceEqual(
    previous: AdminPageOptions<TComponent>,
    next: AdminPageOptions<TComponent>
  ) {
    return (
      previous.activeKey === next.activeKey
      && previous.keepInactivePages === next.keepInactivePages
      && previous.onActiveChange === next.onActiveChange
      && previous.onPagesChange === next.onPagesChange
      && previous.pages === next.pages
      && previous.router === next.router
      && previous.scroll === next.scroll
    );
  }

  /**
   * 判断快照是否完全一致，用于跳过无效广播。
   * @param previous 旧快照。
   * @param next 新快照。
   * @returns 快照关键字段是否一致。
   */
  private isSnapshotEqual(
    previous: AdminPageSnapshot<TComponent>,
    next: AdminPageSnapshot<TComponent>
  ) {
    return (
      previous.instance === next.instance
      && previous.mounted === next.mounted
      && previous.props === next.props
      && previous.computed.activeKey === next.computed.activeKey
      && previous.computed.activePage === next.computed.activePage
      && previous.computed.pages === next.computed.pages
      && previous.computed.scrollEnabled === next.computed.scrollEnabled
    );
  }

  /**
   * 更新并推送快照。
   * @param force 是否强制推送（忽略相等判断）。
   * @returns 最新派生状态。
   */
  private updateSnapshot(force = false): PageComputedState<TComponent> {
    const computed = this.sealComputed(this.resolveComputedStateFast());
    if (this.state.activeKey !== computed.activeKey) {
      this.state = this.sealState({
        ...this.state,
        activeKey: computed.activeKey,
      });
    }

    const nextSnapshot = this.sealSnapshot({
      computed,
      instance: this.instance,
      mounted: this.mounted,
      props: this.state,
    });

    if (force) {
      this.store.setState(nextSnapshot);
      return computed;
    }

    this.store.setState((prev) => {
      if (this.isSnapshotEqual(prev, nextSnapshot)) {
        return prev;
      }
      return nextSnapshot;
    });
    return computed;
  }

  /**
   * 触发激活页变更回调。
   * @param computed 可选预计算派生状态。
   * @returns 无返回值。
   */
  private emitActiveChange(computed?: PageComputedState<TComponent>) {
    const resolvedComputed = computed ?? this.resolveComputedStateFast();
    this.state.onActiveChange?.({
      activeKey: resolvedComputed.activeKey,
      activePage: resolvedComputed.activePage,
    });
  }

  /**
   * 触发页面列表变更回调。
   * @param computed 可选预计算派生状态。
   * @returns 无返回值。
   */
  private emitPagesChange(computed?: PageComputedState<TComponent>) {
    const resolvedComputed = computed ?? this.resolveComputedStateFast();
    this.state.onPagesChange?.({
      pages: resolvedComputed.pages,
    });
  }

  /**
   * 标记挂载并更新快照。
   * @param instance 可选组件实例引用。
   * @returns 无返回值。
   */
  mount(instance?: unknown) {
    this.instance = instance ?? this.instance;
    this.mounted = true;
    this.updateSnapshot();
  }

  /**
   * 标记卸载并清理实例引用。
   *
   * @returns 无返回值。
   */
  unmount() {
    this.instance = null;
    this.mounted = false;
    this.updateSnapshot();
  }

  /**
   * 合并并更新页面状态。
   * @param stateOrFn 状态补丁或补丁工厂。
   * @returns 无返回值。
   */
  setState(
    stateOrFn:
      | Partial<AdminPageOptions<TComponent>>
      | ((prev: AdminPageOptions<TComponent>) => Partial<AdminPageOptions<TComponent>>)
  ) {
    const patch =
      (isFunction(stateOrFn) ? stateOrFn(this.state) : stateOrFn) as Partial<
        AdminPageOptions<TComponent>
      >;
    const next = mergeWithArrayOverride(
      patch.pages === undefined
        ? patch
        : {
            ...patch,
            pages: normalizePageItems(patch.pages),
        },
      this.state
    );
    if (this.isStateReferenceEqual(this.state, next)) {
      return;
    }
    if (deepEqual(next, this.state)) {
      return;
    }
    this.state = this.sealState(next);
    this.updateSnapshot();
  }

  /**
   * 整体替换页面列表。
   * @param pages 新页面列表。
   * @returns 无返回值。
   */
  setPages(pages: AdminPageOptions<TComponent>['pages']) {
    this.state = this.sealState(
      mergeWithArrayOverride(
        {
          pages: normalizePageItems(pages),
        },
        this.state
      )
    );

    const computed = this.updateSnapshot();
    this.emitPagesChange(computed);
    this.emitActiveChange(computed);
  }

  /**
   * 新增页面并按需激活。
   * @param page 待新增页面。
   * @param options 新增行为选项。
   * @returns 无返回值。
   */
  addPage(
    page: NonNullable<AdminPageOptions<TComponent>['pages']>[number],
    options: AddPageOptions = {}
  ) {
    const pages = [...(this.state.pages ?? [])];
    const index =
      options.index === undefined
        ? pages.length
        : Math.max(0, Math.min(options.index, pages.length));

    pages.splice(index, 0, page);
    const normalizedPages = normalizePageItems(pages);
    const inserted = normalizedPages[index];

    this.state = this.sealState(
      mergeWithArrayOverride(
        {
          activeKey: options.activate === false ? this.state.activeKey : inserted?.key ?? this.state.activeKey,
          pages: normalizedPages,
        },
        this.state
      )
    );

    const computed = this.updateSnapshot();
    this.emitPagesChange(computed);
    this.emitActiveChange(computed);
  }

  /**
   * 删除指定页面并按需激活相邻页面。
   * @param key 待删除页面 key。
   * @param options 删除行为选项。
   * @returns 无返回值。
   */
  removePage(key: string, options: RemovePageOptions = {}) {
    const pages = (this.state.pages ?? []) as AdminPageItem<TComponent>[];
    const index = pages.findIndex((page) => page.key === key);
    if (index < 0) {
      return;
    }

    const nextPages = pages.filter((page) => page.key !== key);
    const activeNeighbor =
      options.activateNeighbor === false
        ? this.state.activeKey
        : nextPages[index - 1]?.key ?? nextPages[index]?.key ?? null;

    const isRemovingActive = this.state.activeKey === key;
    this.state = this.sealState(
      mergeWithArrayOverride(
        {
          activeKey: isRemovingActive ? activeNeighbor : this.state.activeKey,
          pages: nextPages,
        },
        this.state
      )
    );

    const computed = this.updateSnapshot();
    this.emitPagesChange(computed);
    if (isRemovingActive) {
      this.emitActiveChange(computed);
    }
  }

  /**
   * 设置激活页并按需触发路由导航。
   * @param key 目标页面 key。
   * @param options 激活行为选项。
   * @returns 无返回值。
   */
  setActiveKey(key: null | string, options: SetActivePageOptions = {}) {
    const computed = this.resolveComputedStateFast();
    if (!key) {
      if (computed.activeKey === null) {
        return;
      }
      this.state = this.sealState(
        mergeWithArrayOverride(
          {
            activeKey: null,
          },
          this.state
        )
      );
      const nextComputed = this.updateSnapshot();
      this.emitActiveChange(nextComputed);
      return;
    }

    const nextPage = this.pageByKey.get(key) ?? null;
    if (!nextPage || computed.activeKey === key) {
      return;
    }

    this.state = this.sealState(
      mergeWithArrayOverride(
        {
          activeKey: key,
        },
        this.state
      )
    );

    if (options.triggerNavigate !== false && isPageRouteItem(nextPage)) {
      navigateToRoutePage(this.state.router, nextPage);
    }

    const nextComputed = this.updateSnapshot();
    this.emitActiveChange(nextComputed);
  }

  /**
   * 根据当前路由路径同步激活页。
   * @param path 目标路径，不传时读取 router.currentPath。
   * @returns 无返回值。
   */
  syncRoute(path = this.state.router?.currentPath) {
    if (!path) {
      this.lastSyncedRoutePath = undefined;
      return;
    }
    if (path === this.lastSyncedRoutePath) {
      return;
    }
    this.lastSyncedRoutePath = path;
    const pages = (this.state.pages ?? []) as AdminPageItem<TComponent>[];
    this.syncPageLookup(pages);
    const matched = this.resolveRoutePageByPathFast(path, pages);
    if (!matched?.key) {
      return;
    }
    this.setActiveKey(matched.key, { triggerNavigate: false });
  }

  /**
   * 解析指定页面（或当前激活页）是否启用滚动。
   * @param key 页面 key，不传时读取当前激活页。
   * @returns 页面是否启用滚动。
   */
  resolveScrollEnabled(key?: null | string) {
    const computed = this.resolveComputedStateFast();
    const page =
      key === undefined
        ? computed.activePage
        : (key ? this.pageByKey.get(key) ?? null : null);
    return resolveScrollEnabled(this.state.scroll, page);
  }
}

/**
 * 创建页面 API 实例。
 * @param options 页面配置。
 * @returns 页面 API。
 */
export function createPageApi<TComponent = unknown>(
  options: AdminPageOptions<TComponent> = {}
): AdminPageApi<TComponent> {
  return new AdminPageApiImpl(options);
}

/**
 * 从运行态配置创建页面 API 实例。
 * @param options 运行态配置。
 * @returns 页面 API。
 */
export function createPageApiWithRuntimeOptions<TComponent = unknown>(
  options: Record<string, unknown> | undefined
): AdminPageApi<TComponent> {
  return createPageApi<TComponent>(
    pickPageRuntimeStateOptions<TComponent>(options)
  );
}
