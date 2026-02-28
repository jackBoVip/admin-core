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

export type AdminPageReactItem = AdminPageAdapterItem<ReactPageComponent>;

export interface AdminPageReactProps
  extends AdminPageAdapterProps<ReactPageComponent, ReactNode, CSSProperties> {}

export interface ExtendedAdminPageApi
  extends AdminPageApi<ReactPageComponent> {
  useStore?: <TSlice = AdminPageReactProps>(
    selector?: (state: AdminPageReactProps) => TSlice
  ) => TSlice;
}

export interface SetupAdminPageReactOptions
  extends PageAdapterSetupOptions<
    SetupAdminFormReactOptions,
    SetupAdminTableReactOptions
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

export interface AdminPageQueryTableReactProps<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> extends AdminPageQueryTableAdapterProps<
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>,
  AdminFormProps,
  AdminTableReactProps<TData, TFormValues>,
  CSSProperties
> {}

export type UseAdminPageQueryTableReturn<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = UseAdminPageQueryTableAdapterReturn<
  ComponentType<Partial<AdminPageQueryTableReactProps<TData, TFormValues>>>,
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;
