import { ensurePageCoreSetup } from './config';
import { createDefaultPageOptions } from './constants';
import { createStore } from './store';
import {
  deepEqual,
  isFunction,
  isPageRouteItem,
  mergeWithArrayOverride,
  navigateToRoutePage,
  normalizePageItems,
  resolveComputedState,
  resolveRoutePageByPath,
  resolveScrollEnabled,
} from './utils';
import type {
  AddPageOptions,
  AdminPageApi,
  AdminPageOptions,
  AdminPageSnapshot,
  RemovePageOptions,
  SetActivePageOptions,
} from './types';

class AdminPageApiImpl<TComponent = unknown>
  implements AdminPageApi<TComponent>
{
  private instance: unknown = null;

  private mounted = false;

  private state: AdminPageOptions<TComponent>;

  public store = createStore<AdminPageSnapshot<TComponent>>({
    computed: resolveComputedState(createDefaultPageOptions<TComponent>()),
    instance: null,
    mounted: false,
    props: createDefaultPageOptions<TComponent>(),
  });

  constructor(options: AdminPageOptions<TComponent> = {}) {
    ensurePageCoreSetup();
    this.state = mergeWithArrayOverride(
      options,
      createDefaultPageOptions<TComponent>()
    );
    this.updateSnapshot(true);
  }

  getState() {
    return this.state;
  }

  getSnapshot() {
    return this.store.getState();
  }

  private updateSnapshot(force = false) {
    const nextSnapshot: AdminPageSnapshot<TComponent> = {
      computed: resolveComputedState(this.state),
      instance: this.instance,
      mounted: this.mounted,
      props: this.state,
    };

    if (force) {
      this.store.setState(nextSnapshot);
      return;
    }

    this.store.setState((prev) => {
      if (deepEqual(prev, nextSnapshot)) {
        return prev;
      }
      return nextSnapshot;
    });
  }

  private emitActiveChange() {
    const computed = resolveComputedState(this.state);
    this.state.onActiveChange?.({
      activeKey: computed.activeKey,
      activePage: computed.activePage,
    });
  }

  private emitPagesChange() {
    const computed = resolveComputedState(this.state);
    this.state.onPagesChange?.({
      pages: computed.pages,
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
    const patch = isFunction(stateOrFn) ? stateOrFn(this.state) : stateOrFn;
    const next = mergeWithArrayOverride(patch, this.state);
    if (deepEqual(next, this.state)) {
      return;
    }
    this.state = next;
    this.updateSnapshot();
  }

  setPages(pages: AdminPageOptions<TComponent>['pages']) {
    this.state = mergeWithArrayOverride(
      {
        pages: normalizePageItems(pages),
      },
      this.state
    );

    const computed = resolveComputedState(this.state);
    this.state.activeKey = computed.activeKey;

    this.updateSnapshot();
    this.emitPagesChange();
    this.emitActiveChange();
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

    this.state = mergeWithArrayOverride(
      {
        activeKey: options.activate === false ? this.state.activeKey : inserted?.key ?? this.state.activeKey,
        pages: normalizedPages,
      },
      this.state
    );

    this.updateSnapshot();
    this.emitPagesChange();
    this.emitActiveChange();
  }

  removePage(key: string, options: RemovePageOptions = {}) {
    const pages = normalizePageItems(this.state.pages);
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
    this.state = mergeWithArrayOverride(
      {
        activeKey: isRemovingActive ? activeNeighbor : this.state.activeKey,
        pages: nextPages,
      },
      this.state
    );

    this.updateSnapshot();
    this.emitPagesChange();
    if (isRemovingActive) {
      this.emitActiveChange();
    }
  }

  setActiveKey(key: null | string, options: SetActivePageOptions = {}) {
    const computed = resolveComputedState(this.state);
    if (!key) {
      if (computed.activeKey === null) {
        return;
      }
      this.state = mergeWithArrayOverride(
        {
          activeKey: null,
        },
        this.state
      );
      this.updateSnapshot();
      this.emitActiveChange();
      return;
    }

    const nextPage = computed.pages.find((page) => page.key === key) ?? null;
    if (!nextPage || computed.activeKey === key) {
      return;
    }

    this.state = mergeWithArrayOverride(
      {
        activeKey: key,
      },
      this.state
    );

    if (options.triggerNavigate !== false && isPageRouteItem(nextPage)) {
      navigateToRoutePage(this.state.router, nextPage);
    }

    this.updateSnapshot();
    this.emitActiveChange();
  }

  syncRoute(path = this.state.router?.currentPath) {
    if (!path) {
      return;
    }
    const pages = normalizePageItems(this.state.pages);
    const matched = resolveRoutePageByPath(pages, path);
    if (!matched?.key) {
      return;
    }
    this.setActiveKey(matched.key, { triggerNavigate: false });
  }

  resolveScrollEnabled(key?: null | string) {
    const computed = resolveComputedState(this.state);
    const page =
      key === undefined
        ? computed.activePage
        : computed.pages.find((item) => item.key === key) ?? null;
    return resolveScrollEnabled(this.state.scroll, page);
  }
}

export function createPageApi<TComponent = unknown>(
  options: AdminPageOptions<TComponent> = {}
): AdminPageApi<TComponent> {
  return new AdminPageApiImpl(options);
}
