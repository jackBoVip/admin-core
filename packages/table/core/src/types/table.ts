export interface ToolbarToolConfig {
  [key: string]: any;
  code?: string;
  icon?: string;
  title?: string;
}

export interface ToolbarConfig {
  [key: string]: any;
  search?: boolean;
  tools?: ToolbarToolConfig[];
}

export interface SeparatorOptions {
  backgroundColor?: string;
  show?: boolean;
}

export interface ProxyAjaxHandlers {
  [key: string]: any;
  query?: (...args: any[]) => any;
  queryAll?: (...args: any[]) => any;
  queryAllError?: (...args: any[]) => any;
  queryAllSuccess?: (...args: any[]) => any;
  queryError?: (...args: any[]) => any;
  querySuccess?: (...args: any[]) => any;
  reload?: (...args: any[]) => any;
  reloadError?: (...args: any[]) => any;
  reloadSuccess?: (...args: any[]) => any;
}

export interface ProxyConfig {
  [key: string]: any;
  ajax?: ProxyAjaxHandlers;
  autoLoad?: boolean;
  enabled?: boolean;
  response?: {
    [key: string]: any;
    list?: string;
    result?: string;
    total?: string;
  };
  showActiveMsg?: boolean;
  showResponseMsg?: boolean;
  sort?: boolean;
}

export interface AdminTableOptions<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  class?: string;
  formOptions?: Record<string, any>;
  gridClass?: string;
  gridEvents?: Record<string, (...args: any[]) => any>;
  gridOptions?: Record<string, any> & {
    columns?: Array<Record<string, any>>;
    data?: TData[];
    proxyConfig?: ProxyConfig;
    toolbarConfig?: ToolbarConfig;
  };
  separator?: boolean | SeparatorOptions;
  showSearchForm?: boolean;
  tableTitle?: string;
  tableTitleHelp?: string;
  // for future extension
  __formValuesType?: TFormValues;
}

export type AdminTableProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> = AdminTableOptions<TData, TFormValues>;

export interface TableQueryContext {
  mode: 'query' | 'reload';
  params: Record<string, any>;
}

export interface TableExecutors {
  query?: (ctx: TableQueryContext) => Promise<any> | any;
  reload?: (ctx: TableQueryContext) => Promise<any> | any;
}

export interface TableFormApiLike {
  getLatestSubmissionValues?: () => Record<string, any>;
  getValues?: () => Promise<Record<string, any>>;
}
