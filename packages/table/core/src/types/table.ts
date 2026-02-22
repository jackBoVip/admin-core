export interface ToolbarToolRuleContext {
  index: number;
  maximized?: boolean;
  showSearchForm?: boolean;
  tool: ToolbarToolConfig;
}

export type ToolbarToolRule = boolean | ((ctx: ToolbarToolRuleContext) => boolean);

export interface ToolbarToolPermissionDirective {
  and?: string | string[];
  arg?: string;
  mode?: 'and' | 'or';
  modifiers?: Record<string, boolean>;
  name?: string;
  or?: string | string[];
  value?: any;
}

export interface ToolbarToolConfig {
  [key: string]: any;
  attrs?: Record<string, any>;
  code?: string;
  disabled?: ToolbarToolRule;
  followTheme?: boolean;
  icon?: string;
  label?: string;
  name?: string;
  onClick?: (
    payload: {
      code?: string;
      index: number;
      row?: Record<string, any>;
      rowIndex?: number;
      tool?: Record<string, any>;
    }
  ) => any;
  permission?: boolean | string | string[] | ToolbarToolPermissionDirective;
  show?: ToolbarToolRule;
  /**
   * @deprecated use followTheme instead
   */
  themeColor?: boolean;
  title?: string;
  type?:
    | 'clear'
    | 'danger'
    | 'default'
    | 'error'
    | 'info'
    | 'primary'
    | 'primary-text'
    | 'success'
    | 'success-text'
    | 'text'
    | 'text-clear'
    | 'warning'
    | 'warning-text'
    | 'danger-border'
    | 'danger-outline'
    | 'danger-text'
    | 'error-border'
    | 'error-outline'
    | 'error-text'
    | 'info-border'
    | 'info-outline'
    | 'info-text'
    | 'primary-border'
    | 'primary-outline'
    | 'success-border'
    | 'success-outline'
    | 'warning-border'
    | 'warning-outline';
}

export type ToolbarInlinePosition = 'after' | 'before' | 'left' | 'right';

export type ToolbarToolsSlotPosition = ToolbarInlinePosition | 'replace';

export type ToolbarHintAlign = 'center' | 'left' | 'right';

export type ToolbarHintOverflow = 'scroll' | 'wrap';

export interface ToolbarHintConfig {
  [key: string]: any;
  align?: ToolbarHintAlign;
  color?: string;
  content?: string;
  fontSize?: number | string;
  overflow?: ToolbarHintOverflow;
  speed?: number;
  text?: string;
}

export type TableStrategyCompareOperator =
  | 'between'
  | 'contains'
  | 'empty'
  | 'endsWith'
  | 'eq'
  | 'falsy'
  | 'gt'
  | 'gte'
  | 'in'
  | 'includes'
  | 'lt'
  | 'lte'
  | 'neq'
  | 'notRegex'
  | 'notEmpty'
  | 'notIn'
  | 'regex'
  | 'startsWith'
  | 'truthy';

export type TableStrategyRegexValue =
  | RegExp
  | string
  | {
      flags?: string;
      pattern: string;
    };

export interface TableStrategyCondition {
  and?: TableStrategyCondition[];
  between?: [any, any];
  empty?: boolean;
  eq?: any;
  field?: string;
  falsy?: boolean;
  gt?: number | string;
  gte?: number | string;
  in?: any[];
  includes?: any;
  lt?: number | string;
  lte?: number | string;
  neq?: any;
  not?: TableStrategyCondition;
  notEmpty?: boolean;
  notIn?: any[];
  notRegex?: TableStrategyRegexValue;
  op?: TableStrategyCompareOperator;
  or?: TableStrategyCondition[];
  regex?: TableStrategyRegexValue;
  startsWith?: any;
  target?: any;
  truthy?: boolean;
  value?: any;
}

export interface TableStrategyContextBase {
  column?: Record<string, any>;
  field?: string;
  getValue: (field?: string) => any;
  row: Record<string, any>;
  rowIndex: number;
  value: any;
}

export interface TableRowStrategyContext extends TableStrategyContextBase {}

export interface TableCellStrategyContext extends TableStrategyContextBase {}

export type TableStrategyResolver<TContext = TableStrategyContextBase> =
  | ((ctx: TContext) => any)
  | any;

export type TableStrategyWhen<TContext = TableStrategyContextBase> =
  | TableStrategyCondition
  | ((ctx: TContext) => boolean)
  | boolean;

export interface TableStrategyStyle {
  [key: string]: any;
  backgroundColor?: string;
  className?: string;
  color?: string;
  cursor?: string;
  fontSize?: number | string;
  fontWeight?: number | string;
  lineHeight?: number | string;
  style?: Record<string, any>;
  textDecoration?: string;
}

export interface TableCellStrategyRule extends TableStrategyStyle {
  clickable?: boolean;
  compute?: TableStrategyResolver<TableCellStrategyContext>;
  formula?: ((ctx: TableCellStrategyContext) => any) | string;
  onClick?: (ctx: TableCellStrategyContext) => any;
  precision?: number;
  prefix?: TableStrategyResolver<TableCellStrategyContext>;
  stopPropagation?: boolean;
  suffix?: TableStrategyResolver<TableCellStrategyContext>;
  text?: TableStrategyResolver<TableCellStrategyContext>;
  unit?: TableStrategyResolver<TableCellStrategyContext>;
  unitSeparator?: string;
  value?: TableStrategyResolver<TableCellStrategyContext>;
  when?: TableStrategyWhen<TableCellStrategyContext>;
}

export interface TableCellStrategy extends TableStrategyStyle {
  clickable?: boolean;
  compute?: TableStrategyResolver<TableCellStrategyContext>;
  formula?: ((ctx: TableCellStrategyContext) => any) | string;
  onClick?: (ctx: TableCellStrategyContext) => any;
  precision?: number;
  prefix?: TableStrategyResolver<TableCellStrategyContext>;
  rules?: TableCellStrategyRule[];
  stopPropagation?: boolean;
  suffix?: TableStrategyResolver<TableCellStrategyContext>;
  text?: TableStrategyResolver<TableCellStrategyContext>;
  unit?: TableStrategyResolver<TableCellStrategyContext>;
  unitSeparator?: string;
  value?: TableStrategyResolver<TableCellStrategyContext>;
}

export interface TableRowStrategy extends TableStrategyStyle {
  clickable?: boolean;
  onClick?: (ctx: TableRowStrategyContext) => any;
  stopPropagation?: boolean;
  when?: TableStrategyWhen<TableRowStrategyContext>;
}

export interface TableStrategyConfig {
  [key: string]: any;
  columns?: Record<string, TableCellStrategy>;
  rows?: TableRowStrategy[];
}

export type TableColumnFixedValue = '' | 'left' | 'right';

export interface TableSeqColumnConfig {
  align?: string;
  enabled?: boolean;
  fixed?: TableColumnFixedValue;
  key?: string;
  title?: string;
  width?: number | string;
}

export interface TableOperationColumnConfig {
  align?: string;
  attrs?: Record<string, any>;
  enabled?: boolean;
  fixed?: TableColumnFixedValue;
  key?: string;
  title?: string;
  tools?: ToolbarToolConfig[];
  width?: number | string;
}

export interface ColumnCustomSnapshot {
  filterable: Record<string, boolean>;
  fixed: Record<string, TableColumnFixedValue>;
  order: string[];
  sortable: Record<string, boolean>;
  visible: Record<string, boolean>;
}

export type ColumnCustomState = Partial<ColumnCustomSnapshot>;

export type ColumnCustomAction = 'cancel' | 'confirm' | 'open' | 'reset';

export interface ColumnCustomChangePayload {
  action: ColumnCustomAction;
  columns: Array<Record<string, any>>;
  snapshot: ColumnCustomSnapshot;
  sourceColumns: Array<Record<string, any>>;
}

export type ColumnCustomPersistenceStorage = 'local' | 'session';

export interface ColumnCustomPersistenceConfig {
  enabled?: boolean;
  key?: string;
  storage?: ColumnCustomPersistenceStorage;
}

export interface ToolbarConfig {
  [key: string]: any;
  custom?: boolean;
  hint?: string | ToolbarHintConfig;
  refresh?: boolean;
  search?: boolean;
  tools?: ToolbarToolConfig[];
  toolsPosition?: ToolbarInlinePosition;
  toolsSlotPosition?: ToolbarToolsSlotPosition;
  zoom?: boolean;
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

export interface AdminTableGridEvents {
  [key: string]: ((...args: any[]) => any) | undefined;
  columnCustomChange?: (payload: ColumnCustomChangePayload) => any;
  operationToolClick?: (...args: any[]) => any;
  toolbarToolClick?: (...args: any[]) => any;
}

export interface AdminTableOptions<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  class?: string;
  formOptions?: Record<string, any>;
  gridClass?: string;
  gridEvents?: AdminTableGridEvents;
  gridOptions?: Record<string, any> & {
    columnCustomPersistence?: boolean | ColumnCustomPersistenceConfig;
    columnCustomState?: ColumnCustomState;
    columns?: Array<Record<string, any>>;
    cellStrategy?: Record<string, TableCellStrategy>;
    data?: TData[];
    operationColumn?: boolean | TableOperationColumnConfig;
    proxyConfig?: ProxyConfig;
    rowStrategy?: TableRowStrategy[];
    seqColumn?: boolean | TableSeqColumnConfig;
    strategy?: TableStrategyConfig;
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
