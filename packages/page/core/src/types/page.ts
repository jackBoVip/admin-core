export interface PageScrollOptions {
  enabled?: boolean;
  x?: 'auto' | 'hidden' | 'scroll';
  y?: 'auto' | 'hidden' | 'scroll';
}

export interface PageRouterLike<TComponent = unknown> {
  currentPath?: string;
  navigate?: (
    path: string,
    item: RoutePageItem<TComponent>
  ) => Promise<void> | void;
}

export interface BasePageItem {
  key?: string;
  meta?: Record<string, unknown>;
  scroll?: boolean | PageScrollOptions;
  title?: string;
}

export interface RoutePageItem<TComponent = unknown> extends BasePageItem {
  exact?: boolean;
  path: string;
  props?: Record<string, unknown>;
  component?: TComponent;
  type: 'route';
}

export interface ComponentPageItem<TComponent = unknown> extends BasePageItem {
  component: TComponent;
  props?: Record<string, unknown>;
  type: 'component';
}

export type AdminPageItem<TComponent = unknown> =
  | ComponentPageItem<TComponent>
  | RoutePageItem<TComponent>;

export interface PageActiveChangePayload<TComponent = unknown> {
  activeKey: null | string;
  activePage: AdminPageItem<TComponent> | null;
}

export interface PagePagesChangePayload<TComponent = unknown> {
  pages: AdminPageItem<TComponent>[];
}

export interface AdminPageOptions<TComponent = unknown> {
  activeKey?: null | string;
  keepInactivePages?: boolean;
  onActiveChange?: (payload: PageActiveChangePayload<TComponent>) => void;
  onPagesChange?: (payload: PagePagesChangePayload<TComponent>) => void;
  pages?: AdminPageItem<TComponent>[];
  router?: PageRouterLike<TComponent>;
  scroll?: boolean | PageScrollOptions;
}

export interface PageComputedState<TComponent = unknown> {
  activeKey: null | string;
  activePage: AdminPageItem<TComponent> | null;
  pages: AdminPageItem<TComponent>[];
  scrollEnabled: boolean;
}

export interface NormalizedPageScrollOptions {
  enabled: boolean;
  x: 'auto' | 'hidden' | 'scroll';
  y: 'auto' | 'hidden' | 'scroll';
}

export type PageFormTableAction = 'reset' | 'submit';

export interface PageFormTableBridgeContext<
  TFormApi = unknown,
  TTableApi = unknown,
> {
  action: PageFormTableAction;
  formApi: TFormApi;
  tableApi: TTableApi;
}

export interface PageFormTableBridgeOptions<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi = unknown,
> {
  enabled?: boolean;
  mapParams?: (
    values: TFormValues,
    context: PageFormTableBridgeContext<TFormApi, TTableApi>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  queryOnSubmit?: boolean;
  reloadOnReset?: boolean;
}

export interface NormalizedPageFormTableBridgeOptions<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi = unknown,
> extends Omit<
    PageFormTableBridgeOptions<TFormValues, TFormApi, TTableApi>,
    'enabled' | 'queryOnSubmit' | 'reloadOnReset'
  > {
  enabled: boolean;
  queryOnSubmit: boolean;
  reloadOnReset: boolean;
}

export interface PageQueryTableExecutor {
  query: (params?: Record<string, unknown>) => Promise<unknown>;
  reload: (params?: Record<string, unknown>) => Promise<unknown>;
}

export interface PageQueryTableApi<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
> extends PageQueryTableExecutor {
  formApi: TFormApi;
  tableApi: TTableApi;
}

export interface PageQueryTableLayoutOptions {
  /**
   * true: lock to remaining viewport and scroll inside table area.
   * false: page scrolls naturally; table stays non-scrolling unless max-height/scroll is configured on table itself.
   */
  fixed?: boolean;
  /**
   * Explicit table viewport height in px (number or `${number}px`).
   * When provided, page query-table switches to flow mode automatically and
   * applies this value to table height so data scrolls inside table body.
   */
  tableHeight?: number | string;
}
