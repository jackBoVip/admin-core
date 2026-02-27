import type { AdminPageOptions, PageComputedState } from './page';
import type { StoreApi } from './store';

export interface AdminPageSnapshot<TComponent = unknown> {
  computed: PageComputedState<TComponent>;
  instance: unknown;
  mounted: boolean;
  props: AdminPageOptions<TComponent>;
}

export interface AddPageOptions {
  activate?: boolean;
  index?: number;
}

export interface RemovePageOptions {
  activateNeighbor?: boolean;
}

export interface SetActivePageOptions {
  triggerNavigate?: boolean;
}

export interface AdminPageApi<TComponent = unknown> {
  store: StoreApi<AdminPageSnapshot<TComponent>>;
  getState(): AdminPageOptions<TComponent>;
  getSnapshot(): AdminPageSnapshot<TComponent>;
  mount(instance?: unknown): void;
  unmount(): void;
  setState(
    stateOrFn:
      | Partial<AdminPageOptions<TComponent>>
      | ((prev: AdminPageOptions<TComponent>) => Partial<AdminPageOptions<TComponent>>)
  ): void;
  setPages(pages: AdminPageOptions<TComponent>['pages']): void;
  addPage(
    page: NonNullable<AdminPageOptions<TComponent>['pages']>[number],
    options?: AddPageOptions
  ): void;
  removePage(key: string, options?: RemovePageOptions): void;
  setActiveKey(key: null | string, options?: SetActivePageOptions): void;
  syncRoute(path?: string): void;
  resolveScrollEnabled(key?: null | string): boolean;
}
