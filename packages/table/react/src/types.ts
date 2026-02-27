import type {
  AdminTableApi,
  AdminTableProps,
  TableCellStrategy,
  TableRowStrategy,
  TableStrategyConfig,
  ColumnCustomPersistenceConfig,
  ColumnCustomState,
  ProxyConfig,
  SeparatorOptions,
  TableOperationColumnConfig,
  TablePagerConfig,
  TableSeqColumnConfig,
  TableStripeConfig,
  ToolbarToolPermissionDirective,
  ToolbarConfig,
} from '@admin-core/table-core';
import type { AdminFormProps } from '@admin-core/form-react';
import type { TableProps } from 'antd';
import type { ReactNode } from 'react';

export interface AntdRowSelectionRuleContext<TData extends Record<string, any> = Record<string, any>> {
  row: TData;
  rowIndex: number;
}

export interface AntdCheckboxConfig<TData extends Record<string, any> = Record<string, any>> {
  [key: string]: any;
  checkField?: string;
  checkMethod?: (ctx: AntdRowSelectionRuleContext<TData>) => boolean;
  highlight?: boolean;
  labelField?: string;
  trigger?: 'cell' | 'row';
}

export interface AntdRadioConfig<TData extends Record<string, any> = Record<string, any>> {
  [key: string]: any;
  checkField?: string;
  checkMethod?: (ctx: AntdRowSelectionRuleContext<TData>) => boolean;
  highlight?: boolean;
  labelField?: string;
  trigger?: 'cell' | 'row';
}

export interface AntdRowSelectionConfig<
  TData extends Record<string, any> = Record<string, any>,
> extends NonNullable<TableProps<TData>['rowSelection']> {
  checkField?: string;
  checkMethod?: (ctx: AntdRowSelectionRuleContext<TData>) => boolean;
  highlight?: boolean;
  strict?: boolean;
  trigger?: 'cell' | 'row';
}

export interface AntdTableColumn extends Record<string, any> {
  cellRender?: {
    attrs?: Record<string, any>;
    name?: string;
    options?: any[];
    props?: Record<string, any>;
  };
  dataIndex?: string;
  editRender?: {
    name?: string;
    props?: Record<string, any>;
  };
  filterable?: boolean;
  field?: string;
  fixed?: 'left' | 'right';
  slots?: {
    default?: string;
  };
  type?: string;
  sortable?: boolean;
  title?: ReactNode;
  width?: number | string;
}

export interface AntdGridOptions<
  TData extends Record<string, any> = Record<string, any>,
> extends Omit<TableProps<TData>, 'columns' | 'dataSource' | 'onChange' | 'pagination' | 'rowSelection'> {
  border?: boolean;
  checkboxConfig?: AntdCheckboxConfig<TData>;
  cellStrategy?: Record<string, TableCellStrategy>;
  columnCustomPersistence?: boolean | ColumnCustomPersistenceConfig;
  columnCustomState?: ColumnCustomState;
  columns?: AntdTableColumn[];
  data?: TData[];
  tableId?: string;
  editConfig?: {
    mode?: 'cell' | 'row';
    trigger?: 'click' | 'dblclick';
  };
  onChange?: TableProps<TData>['onChange'];
  operationColumn?: boolean | TableOperationColumnConfig;
  pagerConfig?: (Record<string, any> & {
    /**
     * 是否在切换 pageSize 时自动回到第一页
     */
    resetToFirstOnPageSizeChange?: boolean;
  } & TablePagerConfig<TData>);
  proxyConfig?: ProxyConfig;
  radioConfig?: AntdRadioConfig<TData>;
  rowStrategy?: TableRowStrategy[];
  rowSelection?: AntdRowSelectionConfig<TData>;
  seqColumn?: boolean | TableSeqColumnConfig;
  strategy?: TableStrategyConfig;
  height?: number | string;
  rowConfig?: {
    keyField?: string;
  };
  scrollY?: {
    enabled?: boolean;
    gt?: number;
  };
  sortConfig?: {
    defaultSort?: {
      field?: string;
      order?: 'asc' | 'desc';
    };
    remote?: boolean;
  };
  stripe?: boolean | TableStripeConfig;
  toolbarConfig?: ToolbarConfig;
  treeConfig?: {
    parentField?: string;
    rowField?: string;
    transform?: boolean;
  };
}

export interface AdminTableSlots {
  [name: string]: ReactNode | ((params?: any) => ReactNode);
  empty?: ReactNode | (() => ReactNode);
  form?: ReactNode | (() => ReactNode);
  loading?: ReactNode | (() => ReactNode);
  'table-title'?: ReactNode | (() => ReactNode);
  'toolbar-actions'?: ReactNode | ((params?: any) => ReactNode);
  'toolbar-center'?: ReactNode | ((params?: any) => ReactNode);
  'toolbar-tools'?: ReactNode | ((params?: any) => ReactNode);
  'pager-left'?: ReactNode | ((params?: any) => ReactNode);
  'pager-center'?: ReactNode | ((params?: any) => ReactNode);
  'pager-tools'?: ReactNode | ((params?: any) => ReactNode);
  [key: `form-${string}`]: ReactNode | ((params?: any) => ReactNode);
}

export interface AdminTableReactProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> extends Omit<AdminTableProps<TData, TFormValues>, 'formOptions' | 'gridOptions'> {
  formOptions?: AdminFormProps;
  gridOptions?: AntdGridOptions<TData>;
  separator?: boolean | SeparatorOptions;
  slots?: AdminTableSlots;
}

export type ExtendedAdminTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> = AdminTableApi<TData, TFormValues> & {
  useStore: <TSlice = AdminTableReactProps<TData, TFormValues>>(
    selector?: (
      state: AdminTableReactProps<TData, TFormValues>
    ) => TSlice
  ) => TSlice;
};

export interface SetupAdminTableReactOptions {
  accessCodes?: string[] | (() => null | string[] | undefined);
  accessRoles?: string[] | (() => null | string[] | undefined);
  bindPreferences?: boolean;
  defaultGridOptions?: Partial<AntdGridOptions>;
  locale?: 'en-US' | 'zh-CN';
  permissionChecker?: (
    permission: ToolbarToolPermissionDirective,
    tool: Record<string, any>
  ) => boolean;
}
