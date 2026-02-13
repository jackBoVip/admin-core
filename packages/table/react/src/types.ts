import type {
  AdminTableApi,
  AdminTableProps,
  ProxyConfig,
  SeparatorOptions,
  ToolbarConfig,
} from '@admin-core/table-core';
import type { AdminFormProps } from '@admin-core/form-react';
import type { TableProps } from 'antd';
import type { ReactNode } from 'react';

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
  field?: string;
  fixed?: 'left' | 'right';
  slots?: {
    default?: string;
  };
  sortable?: boolean;
  title?: ReactNode;
  width?: number;
}

export interface AntdGridOptions<
  TData extends Record<string, any> = Record<string, any>,
> extends Omit<TableProps<TData>, 'columns' | 'dataSource' | 'onChange' | 'pagination'> {
  border?: boolean;
  columns?: AntdTableColumn[];
  data?: TData[];
  editConfig?: {
    mode?: 'cell' | 'row';
    trigger?: 'click' | 'dblclick';
  };
  pagerConfig?: {
    currentPage?: number;
    enabled?: boolean;
    pageSize?: number;
    pageSizes?: number[];
    total?: number;
  };
  proxyConfig?: ProxyConfig;
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
  stripe?: boolean;
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
  'toolbar-tools'?: ReactNode | ((params?: any) => ReactNode);
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
  defaultGridOptions?: Partial<AntdGridOptions>;
  locale?: 'en-US' | 'zh-CN';
}
