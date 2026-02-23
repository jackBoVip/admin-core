import type {
  TableOperationColumnConfig,
  TablePagerExportConfig,
  TablePagerExportOption,
  TablePagerExportType,
  ToolbarConfig,
  ToolbarToolConfig,
  ToolbarToolPermissionDirective,
} from '../types';

export type TableColumnRecord = Record<string, any>;

export interface TableToolbarLocaleText {
  custom: string;
  customAll: string;
  customCancel: string;
  customConfirm: string;
  customFilter: string;
  customFixedLeft: string;
  customFixedRight: string;
  customFixedUnset: string;
  customMoveDown: string;
  customMoveUp: string;
  customReset: string;
  customRestoreConfirm: string;
  customSort: string;
  emptyValue: string;
  export: string;
  exportAll: string;
  exportAllMissingHandler: string;
  exportCurrentPage: string;
  exportSelected: string;
  hideSearchPanel: string;
  noData: string;
  operation: string;
  pagerFirstPage: string;
  pagerLastPage: string;
  pagerTotal: string;
  refresh: string;
  seq: string;
  search: string;
  showSearchPanel: string;
  zoomIn: string;
  zoomOut: string;
}

export interface ResolvedTablePagerExportAction<
  TData extends Record<string, any> = Record<string, any>,
> extends TablePagerExportOption<TData> {
  disabled: boolean;
  index: number;
  permission?: ToolbarToolPermissionDirective;
  title: string;
  type: TablePagerExportType;
}

export interface ResolvedTablePagerExportConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  enabled: boolean;
  exportAll?: TablePagerExportConfig<TData>['exportAll'];
  fileName?: string;
  icon: string;
  options: Array<ResolvedTablePagerExportAction<TData>>;
  title: string;
}

export interface TableExportColumn<
  TData extends Record<string, any> = Record<string, any>,
> {
  key: string;
  title: string;
  valueGetter: (row: TData, rowIndex: number) => any;
}

export interface ResolveTableExportColumnsOptions {
  includeHidden?: boolean;
  includeOperation?: boolean;
  includeSelection?: boolean;
  seqStart?: number;
}

export interface ExportTableRowsToExcelOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  columns: Array<TableExportColumn<TData>>;
  fileName?: string;
  rows: TData[];
  sheetName?: string;
}

export interface ToolbarActionEventPayload {
  code?: string;
  tool?: Record<string, any>;
}

export interface ToolbarOperationEventPayload
  extends ToolbarActionEventPayload {
  row?: Record<string, any>;
  rowIndex?: number;
}

export interface ToolbarActionToolPayload extends ToolbarActionEventPayload {
  index: number;
}

export interface ToolbarOperationToolPayload
  extends ToolbarOperationEventPayload {
  index: number;
}

export interface ResolvedToolbarActionTool extends ToolbarToolConfig {
  disabled: boolean;
  index: number;
  permission?: ToolbarToolPermissionDirective;
  text?: string;
  title: string;
}

export interface ResolvedToolbarActionPresentation {
  hasIcon: boolean;
  iconClass?: string;
  iconOnly: boolean;
  text: string;
}

export interface ResolvedToolbarActionButtonClassState {
  classList: string[];
  presentation: ResolvedToolbarActionPresentation;
}

export interface ResolvedToolbarActionButtonRenderState
  extends ResolvedToolbarActionButtonClassState {
  attrs: Record<string, any>;
  disabled: boolean;
  key: string;
  title?: string;
}

export type ToolbarAccessValueSource =
  | null
  | string
  | string[]
  | (() => null | string | string[] | undefined)
  | undefined;

export interface ToolbarPermissionResolveOptions {
  accessCodes?: ToolbarAccessValueSource;
  accessRoles?: ToolbarAccessValueSource;
  defaultWhenNoAccess?: boolean;
}

export interface ToolbarToolRenderOptions
  extends ToolbarPermissionResolveOptions {
  permissionChecker?: (
    permission: ToolbarToolPermissionDirective,
    tool: Record<string, any>
  ) => boolean;
}

export interface ToolbarToolVisibilityOptions
  extends ToolbarToolRenderOptions {
  directiveRenderer?: (tool: Record<string, any>) => boolean;
  useDirectiveWhenNoAccess?: boolean;
}

export interface ResolveVisibleToolbarActionToolsOptions
  extends ToolbarToolVisibilityOptions {
  excludeCodes?: string[];
  maximized?: boolean;
  showSearchForm?: boolean;
  tools?: ToolbarConfig['tools'];
}

export interface ResolveVisibleOperationActionToolsOptions
  extends Omit<ResolveVisibleToolbarActionToolsOptions, 'tools'> {
  operationColumn?: boolean | TableOperationColumnConfig | null;
}
