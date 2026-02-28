import type {
  AdminPageApi,
  AdminPageItem,
  AdminPageOptions,
  PageQueryTableLayoutOptions,
  PageFormTableBridgeOptions,
  PageQueryTableApi,
  RoutePageItem,
  SetupAdminPageCoreOptions,
} from '@admin-core/page-core';
import type {
  AdminFormApi,
  AdminFormProps,
  SetupAdminFormReactOptions,
} from '@admin-core/form-react';
import type {
  AdminTableApi,
  SetupAdminTableReactOptions,
  AdminTableReactProps,
} from '@admin-core/table-react';
import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from 'react';

export type ReactPageComponent = ComponentType<unknown> | ReactNode;

export type AdminPageReactItem = AdminPageItem<ReactPageComponent>;

export interface AdminPageReactProps
  extends Omit<AdminPageOptions<ReactPageComponent>, 'pages'> {
  className?: string;
  pages?: AdminPageReactItem[];
  renderEmpty?: () => ReactNode;
  renderRoutePage?: (page: RoutePageItem<ReactPageComponent>) => ReactNode;
  routeFallback?: ReactNode;
  style?: CSSProperties;
}

export interface ExtendedAdminPageApi
  extends AdminPageApi<ReactPageComponent> {
  useStore?: <TSlice = AdminPageReactProps>(
    selector?: (state: AdminPageReactProps) => TSlice
  ) => TSlice;
}

export interface SetupAdminPageReactOptions
  extends SetupAdminPageCoreOptions {
  form?: false | SetupAdminFormReactOptions;
  table?: false | SetupAdminTableReactOptions;
}

export type AdminPageQueryTableApi<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = PageQueryTableApi<
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;

export interface AdminPageQueryTableReactProps<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> extends PageQueryTableLayoutOptions {
  api?: AdminPageQueryTableApi<TData, TFormValues>;
  bridge?: boolean | PageFormTableBridgeOptions<
    TFormValues,
    AdminFormApi,
    AdminTableApi<TData, TFormValues>
  >;
  className?: string;
  formApi?: AdminFormApi;
  formOptions?: AdminFormProps;
  style?: CSSProperties;
  tableHeight?: number | string;
  tableApi?: AdminTableApi<TData, TFormValues>;
  tableOptions?: AdminTableReactProps<TData, TFormValues>;
}

export type UseAdminPageQueryTableReturn<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = readonly [
  ComponentType<Partial<AdminPageQueryTableReactProps<TData, TFormValues>>>,
  AdminPageQueryTableApi<TData, TFormValues>,
];
