import type {
  AdminPageApi,
  AdminPageAdapterItem,
  AdminPageAdapterProps,
  AdminPageQueryTableAdapterApi,
  AdminPageQueryTableAdapterProps,
  PageAdapterSetupOptions,
  UseAdminPageQueryTableAdapterReturn,
} from '@admin-core/page-shared';
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

export type AdminPageVueItem = AdminPageAdapterItem<VuePageComponent>;

export interface AdminPageVueProps
  extends AdminPageAdapterProps<VuePageComponent, VNodeChild, CSSProperties> {}

export interface ExtendedAdminPageApi
  extends AdminPageApi<VuePageComponent> {
  useStore?: <TSlice = AdminPageVueProps>(
    selector?: (state: AdminPageVueProps) => TSlice
  ) => Readonly<Ref<TSlice>>;
}

export interface SetupAdminPageVueOptions
  extends PageAdapterSetupOptions<
    SetupAdminFormVueOptions,
    SetupAdminTableVueOptions
  > {}

export type AdminPageQueryTableApi<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = AdminPageQueryTableAdapterApi<
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;

export interface AdminPageQueryTableVueProps<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> extends AdminPageQueryTableAdapterProps<
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>,
  AdminFormProps,
  AdminTableVueProps<TData, TFormValues>,
  CSSProperties
> {}

export type UseAdminPageQueryTableReturn<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = UseAdminPageQueryTableAdapterReturn<
  Component<Partial<AdminPageQueryTableVueProps<TData, TFormValues>>>,
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;
