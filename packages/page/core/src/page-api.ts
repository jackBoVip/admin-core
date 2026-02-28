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

const ROUTE_MATCH_CACHE_LIMIT = 128;

class AdminPageApiImpl<TComponent = unknown>
  implements AdminPageApi<TComponent>
{
  private instance: unknown = null;

  private mounted = false;

  private state: AdminPageOptions<TComponent>;

  private lastSyncedRoutePath: string | undefined = undefined;

  private pageLookupPagesRef: AdminPageItem<TComponent>[] | null = null;

  private pageByKey = new Map<string, AdminPageItem<TComponent>>();

  private routeByExactPath = new Map<string, RoutePageItem<TComponent>>();

  private routeMatchCache = new Map<string, null | RoutePageItem<TComponent>>();

  private hasPrefixRoute = false;

  public store = createStore<AdminPageSnapshot<TComponent>>({
    computed: resolveComputedState(createDefaultPageOptions<TComponent>()),
    instance: null,
    mounted: false,
    props: createDefaultPageOptions<TComponent>(),
  });

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

  getState() {
    return this.state;
  }

  getSnapshot() {
    return this.store.getState();
  }

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

  private sealComputed(
    computed: PageComputedState<TComponent>
  ): PageComputedState<TComponent> {
    if (!Object.isFrozen(computed)) {
      Object.freeze(computed);
    }
    return computed;
  }

  private sealSnapshot(
    snapshot: AdminPageSnapshot<TComponent>
  ): AdminPageSnapshot<TComponent> {
    if (!Object.isFrozen(snapshot)) {
      Object.freeze(snapshot);
    }
    return snapshot;
  }

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

  private emitActiveChange(computed?: PageComputedState<TComponent>) {
    const resolvedComputed = computed ?? this.resolveComputedStateFast();
    this.state.onActiveChange?.({
      activeKey: resolvedComputed.activeKey,
      activePage: resolvedComputed.activePage,
    });
  }

  private emitPagesChange(computed?: PageComputedState<TComponent>) {
    const resolvedComputed = computed ?? this.resolveComputedStateFast();
    this.state.onPagesChange?.({
      pages: resolvedComputed.pages,
    });
  }

  mount(instance?: unknown) {
    this.instance = instance ?? this.instance;
    this.mounted = true;
    this.updateSnapshot();
  }

  unmount() {
    this.instance = null;
    this.mounted = false;
    this.updateSnapshot();
  }

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

  resolveScrollEnabled(key?: null | string) {
    const computed = this.resolveComputedStateFast();
    const page =
      key === undefined
        ? computed.activePage
        : (key ? this.pageByKey.get(key) ?? null : null);
    return resolveScrollEnabled(this.state.scroll, page);
  }
}

export function createPageApi<TComponent = unknown>(
  options: AdminPageOptions<TComponent> = {}
): AdminPageApi<TComponent> {
  return new AdminPageApiImpl(options);
}

export function createPageApiWithRuntimeOptions<TComponent = unknown>(
  options: Record<string, unknown> | undefined
): AdminPageApi<TComponent> {
  return createPageApi<TComponent>(
    pickPageRuntimeStateOptions<TComponent>(options)
  );
}
