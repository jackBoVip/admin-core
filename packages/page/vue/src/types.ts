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
  SetupAdminFormVueOptions,
} from '@admin-core/form-vue';
import type {
  AdminTableApi,
  SetupAdminTableVueOptions,
  AdminTableVueProps,
} from '@admin-core/table-vue';
import type {
  Component,
  CSSProperties,
  Ref,
  VNodeChild,
} from 'vue';

export type VuePageComponent =
  | (() => VNodeChild)
  | Component
  | VNodeChild;

export type AdminPageVueItem = AdminPageItem<VuePageComponent>;

export interface AdminPageVueProps
  extends Omit<AdminPageOptions<VuePageComponent>, 'pages'> {
  className?: string;
  pages?: AdminPageVueItem[];
  renderEmpty?: () => VNodeChild;
  renderRoutePage?: (page: RoutePageItem<VuePageComponent>) => VNodeChild;
  routeFallback?: VNodeChild;
  style?: CSSProperties;
}

export interface ExtendedAdminPageApi
  extends AdminPageApi<VuePageComponent> {
  useStore?: <TSlice = AdminPageVueProps>(
    selector?: (state: AdminPageVueProps) => TSlice
  ) => Readonly<Ref<TSlice>>;
}

export interface SetupAdminPageVueOptions
  extends SetupAdminPageCoreOptions {
  form?: false | SetupAdminFormVueOptions;
  table?: false | SetupAdminTableVueOptions;
}

export type AdminPageQueryTableApi<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = PageQueryTableApi<
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;

export interface AdminPageQueryTableVueProps<
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
  tableOptions?: AdminTableVueProps<TData, TFormValues>;
}

export type UseAdminPageQueryTableReturn<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = readonly [
  Component<Partial<AdminPageQueryTableVueProps<TData, TFormValues>>>,
  AdminPageQueryTableApi<TData, TFormValues>,
];
