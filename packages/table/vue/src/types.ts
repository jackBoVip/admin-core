import type {
  AdminTableApi,
  AdminTableProps,
  SeparatorOptions,
  ToolbarConfig,
} from '@admin-core/table-core';
import type { AdminFormProps } from '@admin-core/form-vue';
import type {
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
  VxeUIExport,
} from 'vxe-table';
import type { Ref } from 'vue';

export interface VxeToolbarConfig extends ToolbarConfig {
  search?: boolean;
}

export interface VxeTableGridOptions<T = any> extends VxeTableGridProps<T> {
  toolbarConfig?: VxeToolbarConfig;
}

export interface AdminTableVueProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> extends Omit<AdminTableProps<TData, TFormValues>, 'formOptions' | 'gridEvents' | 'gridOptions'> {
  formOptions?: AdminFormProps;
  gridEvents?: Partial<VxeGridListeners<TData>>;
  gridOptions?: Partial<VxeTableGridOptions<TData>>;
  separator?: boolean | SeparatorOptions;
}

export type ExtendedAdminTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> = AdminTableApi<TData, TFormValues> & {
  useStore: <TSlice = AdminTableVueProps<TData, TFormValues>>(
    selector?: (
      state: AdminTableVueProps<TData, TFormValues>
    ) => TSlice
  ) => Readonly<Ref<TSlice>>;
};

export interface SetupAdminTableVueOptions {
  configVxeTable?: (ui: VxeUIExport) => void;
  locale?: 'en-US' | 'zh-CN';
  setupThemeAndLocale?: (ui: VxeUIExport) => void;
}
