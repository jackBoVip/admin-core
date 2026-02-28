import type {
  AdminPageItem,
  AdminPageOptions,
  PageFormTableBridgeOptions,
  PageQueryTableApi,
  PageQueryTableExecutor,
  PageQueryTableLayoutOptions,
  RoutePageItem,
} from '@admin-core/page-core';

export type AdminPageAdapterItem<TComponent> = AdminPageItem<TComponent>;

export interface AdminPageAdapterProps<
  TComponent,
  TRenderNode,
  TStyle = unknown,
> extends Omit<AdminPageOptions<TComponent>, 'pages'> {
  className?: string;
  pages?: AdminPageAdapterItem<TComponent>[];
  renderEmpty?: () => TRenderNode;
  renderRoutePage?: (page: RoutePageItem<TComponent>) => TRenderNode;
  routeFallback?: TRenderNode;
  style?: TStyle;
}

export type AdminPageQueryTableAdapterApi<
  _TData extends Record<string, unknown>,
  _TFormValues extends Record<string, unknown>,
  TFormApi,
  TTableApi extends PageQueryTableExecutor,
> = PageQueryTableApi<TFormApi, TTableApi>;

export interface AdminPageQueryTableAdapterProps<
  TData extends Record<string, unknown>,
  TFormValues extends Record<string, unknown>,
  TFormApi,
  TTableApi extends PageQueryTableExecutor,
  TFormOptions,
  TTableOptions,
  TStyle = unknown,
> extends PageQueryTableLayoutOptions {
  api?: AdminPageQueryTableAdapterApi<TData, TFormValues, TFormApi, TTableApi>;
  bridge?: boolean | PageFormTableBridgeOptions<TFormValues, TFormApi, TTableApi>;
  className?: string;
  formApi?: TFormApi;
  formOptions?: TFormOptions;
  style?: TStyle;
  tableHeight?: number | string;
  tableApi?: TTableApi;
  tableOptions?: TTableOptions;
}

export type UseAdminPageQueryTableAdapterReturn<
  TQueryTableComponent,
  TData extends Record<string, unknown>,
  TFormValues extends Record<string, unknown>,
  TFormApi,
  TTableApi extends PageQueryTableExecutor,
> = readonly [
  TQueryTableComponent,
  AdminPageQueryTableAdapterApi<TData, TFormValues, TFormApi, TTableApi>,
];
