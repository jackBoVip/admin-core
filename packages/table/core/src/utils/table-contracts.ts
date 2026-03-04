/**
 * Table Core 共享契约类型。
 * @description 定义工具层之间共用的列模型、工具栏动作与导出协议类型。
 */
import type {
  TableOperationColumnConfig,
  TablePagerExportConfig,
  TablePagerExportOption,
  TablePagerExportType,
  TableLocaleMessages,
  ToolbarConfig,
  ToolbarToolConfig,
  ToolbarToolPermissionDirective,
} from '../types';

/**
 * 表格列配置通用记录类型。
 */
export type TableColumnRecord = Record<string, any>;

/**
 * 表格工具栏文案结构类型。
 */
export type TableToolbarLocaleText = TableLocaleMessages['table'];

/**
 * 分页导出动作项的标准化结构。
 */
export interface ResolvedTablePagerExportAction<
  TData extends Record<string, any> = Record<string, any>,
> extends TablePagerExportOption<TData> {
  /** 当前动作是否禁用。 */
  disabled: boolean;
  /** 动作在列表中的顺序索引。 */
  index: number;
  /** 动作权限指令。 */
  permission?: ToolbarToolPermissionDirective;
  /** 动作展示标题。 */
  title: string;
  /** 动作导出类型。 */
  type: TablePagerExportType;
}

/**
 * 分页导出配置解析结果。
 */
export interface ResolvedTablePagerExportConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 是否启用分页导出。 */
  enabled: boolean;
  /** 全量导出配置。 */
  exportAll?: TablePagerExportConfig<TData>['exportAll'];
  /** 导出文件名。 */
  fileName?: string;
  /** 导出按钮图标。 */
  icon: string;
  /** 导出动作项列表。 */
  options: Array<ResolvedTablePagerExportAction<TData>>;
  /** 导出按钮文案。 */
  title: string;
}

/**
 * 导出列定义。
 */
export interface TableExportColumn<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 导出列键名。 */
  key: string;
  /** 导出列表头。 */
  title: string;
  /** 读取单元格导出值的方法。 */
  valueGetter: (row: TData, rowIndex: number) => any;
}

/**
 * 解析导出列时的附加选项。
 */
export interface ResolveTableExportColumnsOptions {
  /** 是否包含隐藏列。 */
  includeHidden?: boolean;
  /** 是否包含操作列。 */
  includeOperation?: boolean;
  /** 是否包含选择列。 */
  includeSelection?: boolean;
  /** 序号列起始值。 */
  seqStart?: number;
}

/**
 * 导出 Excel 所需参数。
 */
export interface ExportTableRowsToExcelOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 导出列配置。 */
  columns: Array<TableExportColumn<TData>>;
  /** 导出文件名。 */
  fileName?: string;
  /** 导出行数据。 */
  rows: TData[];
  /** 导出 sheet 名称。 */
  sheetName?: string;
}

/**
 * 工具栏动作事件基础载荷。
 */
export interface ToolbarActionEventPayload {
  /** 动作编码。 */
  code?: string;
  /** 动作工具对象。 */
  tool?: Record<string, any>;
}

/**
 * 行内操作动作事件载荷。
 */
export interface ToolbarOperationEventPayload
  extends ToolbarActionEventPayload {
  /** 当前操作所在行数据。 */
  row?: Record<string, any>;
  /** 当前操作所在行索引。 */
  rowIndex?: number;
}

/**
 * 工具栏动作项事件载荷。
 */
export interface ToolbarActionToolPayload extends ToolbarActionEventPayload {
  /** 工具项在可见列表中的索引。 */
  index: number;
}

/**
 * 行内操作工具项事件载荷。
 */
export interface ToolbarOperationToolPayload
  extends ToolbarOperationEventPayload {
  /** 工具项在可见列表中的索引。 */
  index: number;
}

/**
 * 工具栏动作项标准化结果。
 */
export interface ResolvedToolbarActionTool extends ToolbarToolConfig {
  /** 是否禁用。 */
  disabled: boolean;
  /** 动作项顺序索引。 */
  index: number;
  /** 权限指令。 */
  permission?: ToolbarToolPermissionDirective;
  /** 按钮文本（可选）。 */
  text?: string;
  /** 按钮标题。 */
  title: string;
}

/**
 * 工具栏动作展示态信息。
 */
export interface ResolvedToolbarActionPresentation {
  /** 是否包含图标。 */
  hasIcon: boolean;
  /** 图标类名。 */
  iconClass?: string;
  /** 是否仅显示图标。 */
  iconOnly: boolean;
  /** 展示文本。 */
  text: string;
}

/**
 * 工具栏动作按钮样式状态。
 */
export interface ResolvedToolbarActionButtonClassState {
  /** 按钮类名集合。 */
  classList: string[];
  /** 展示态信息。 */
  presentation: ResolvedToolbarActionPresentation;
}

/**
 * 工具栏动作按钮渲染态。
 */
export interface ResolvedToolbarActionButtonRenderState
  extends ResolvedToolbarActionButtonClassState {
  /** 渲染属性集合。 */
  attrs: Record<string, any>;
  /** 是否禁用。 */
  disabled: boolean;
  /** 按钮渲染键。 */
  key: string;
  /** 按钮标题。 */
  title?: string;
}

/**
 * 权限值来源类型。
 * 支持字符串、字符串数组或返回该值的函数。
 */
export type ToolbarAccessValueSource =
  | null
  | string
  | string[]
  | (() => null | string | string[] | undefined)
  | undefined;

/**
 * 权限解析参数。
 */
export interface ToolbarPermissionResolveOptions {
  /** 当前用户权限码来源。 */
  accessCodes?: ToolbarAccessValueSource;
  /** 当前用户角色来源。 */
  accessRoles?: ToolbarAccessValueSource;
  /** 未配置权限时的默认可见性。 */
  defaultWhenNoAccess?: boolean;
}

/**
 * 工具项渲染判定参数。
 */
export interface ToolbarToolRenderOptions
  extends ToolbarPermissionResolveOptions {
  /** 自定义权限校验器。 */
  permissionChecker?: (
    permission: ToolbarToolPermissionDirective,
    tool: Record<string, any>
  ) => boolean;
}

/**
 * 工具项可见性判定参数。
 */
export interface ToolbarToolVisibilityOptions
  extends ToolbarToolRenderOptions {
  /** 指令渲染器。 */
  directiveRenderer?: (tool: Record<string, any>) => boolean;
  /** 无权限配置时是否继续使用指令渲染结果。 */
  useDirectiveWhenNoAccess?: boolean;
}

/**
 * 解析可见工具栏动作项时的参数。
 */
export interface ResolveVisibleToolbarActionToolsOptions
  extends ToolbarToolVisibilityOptions {
  /** 需要排除的动作编码。 */
  excludeCodes?: string[];
  /** 当前是否最大化。 */
  maximized?: boolean;
  /** 当前是否显示查询表单。 */
  showSearchForm?: boolean;
  /** 原始工具项配置。 */
  tools?: ToolbarConfig['tools'];
}

/**
 * 解析可见行内操作项时的参数。
 */
export interface ResolveVisibleOperationActionToolsOptions
  extends Omit<ResolveVisibleToolbarActionToolsOptions, 'tools'> {
  /** 操作列配置。 */
  operationColumn?: boolean | TableOperationColumnConfig | null;
}
