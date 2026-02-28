import type {
  AdminTableApi,
  AdminTableGridEvents,
  AdminTableProps,
  TableCellStrategy,
  TableRowStrategy,
  TableStrategyConfig,
  ColumnCustomPersistenceConfig,
  ColumnCustomState,
  SeparatorOptions,
  TableOperationColumnConfig,
  TablePagerConfig,
  TableSeqColumnConfig,
  TableStripeConfig,
  ToolbarConfig,
} from '@admin-core/table-core';
import type { AdminFormProps } from '@admin-core/form-vue';
import type {
  BuiltInTableLocale,
  SetupAdminTableSharedOptions,
} from '@admin-core/table-shared';
import type {
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
  VxeUIExport,
} from 'vxe-table';
import type { Ref } from 'vue';

export interface VxeToolbarConfig extends ToolbarConfig {
  search?: boolean;
}

export interface VxeRowSelectionRuleContext<
  TData extends Record<string, any> = Record<string, any>,
> {
  row: TData;
  rowIndex: number;
}

export interface VxeRowSelectionConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  [key: string]: any;
  checkField?: string;
  checkMethod?: (ctx: VxeRowSelectionRuleContext<TData>) => boolean;
  defaultSelectedRowKeys?: Array<number | string>;
  highlight?: boolean;
  onChange?: (
    selectedRowKeys: Array<number | string>,
    selectedRows: TData[],
    params?: Record<string, any>
  ) => void;
  selectedRowKeys?: Array<number | string>;
  strict?: boolean;
  trigger?: 'cell' | 'row';
  type?: 'checkbox' | 'radio';
}

export interface VxeTableGridOptions<
  T extends Record<string, any> = Record<string, any>,
> extends Omit<VxeTableGridProps<T>, 'pagerConfig' | 'stripe' | 'toolbarConfig'> {
  cellStrategy?: Record<string, TableCellStrategy>;
  columnCustomPersistence?: boolean | ColumnCustomPersistenceConfig;
  columnCustomState?: ColumnCustomState;
  operationColumn?: boolean | TableOperationColumnConfig;
  pagerConfig?: (Record<string, any> & {
    /**
     * 是否在切换 pageSize 时自动回到第一页
     */
    resetToFirstOnPageSizeChange?: boolean;
  } & TablePagerConfig<T>);
  rowStrategy?: TableRowStrategy[];
  rowSelection?: VxeRowSelectionConfig<T>;
  seqColumn?: boolean | TableSeqColumnConfig;
  tableId?: string;
  stripe?: boolean | TableStripeConfig;
  strategy?: TableStrategyConfig;
  toolbarConfig?: VxeToolbarConfig;
}

export interface AdminTableVueProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> extends Omit<AdminTableProps<TData, TFormValues>, 'formOptions' | 'gridEvents' | 'gridOptions'> {
  formOptions?: AdminFormProps;
  gridEvents?: AdminTableGridEvents & Partial<VxeGridListeners<TData>>;
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

export interface SetupAdminTableVueOptions extends SetupAdminTableSharedOptions {
  configVxeTable?: (ui: VxeUIExport) => void;
  locale?: BuiltInTableLocale;
  setupThemeAndLocale?: (ui: VxeUIExport) => void;
}
