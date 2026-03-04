/**
 * 工具栏按钮显示/禁用规则回调的上下文。
 * @description 当 `show` 或 `disabled` 配置为函数时，运行时会将该上下文传入用于动态判断。
 */
export interface ToolbarToolRuleContext {
  /** 当前工具项在配置数组中的索引。 */
  index: number;
  /** 当前表格是否处于最大化状态。 */
  maximized?: boolean;
  /** 当前查询表单是否显示。 */
  showSearchForm?: boolean;
  /** 当前正在计算的工具按钮配置。 */
  tool: ToolbarToolConfig;
}

/**
 * 工具栏按钮规则。
 * @description 既支持静态布尔值，也支持基于运行时上下文的动态函数判断。
 */
export type ToolbarToolRule = boolean | ((ctx: ToolbarToolRuleContext) => boolean);

/**
 * 工具栏权限表达式对象。
 * @description 用于描述复杂权限组合逻辑，可按 `and`/`or` 组合多个权限码。
 */
export interface ToolbarToolPermissionDirective {
  /** 需同时满足的权限码。 */
  and?: string | string[];
  /** 传给权限检查器的附加参数。 */
  arg?: string;
  /** 权限组合模式。 */
  mode?: 'and' | 'or';
  /** 权限检查扩展修饰符。 */
  modifiers?: Record<string, boolean>;
  /** 权限指令名称（默认 `access`）。 */
  name?: string;
  /** 满足其一即可的权限码。 */
  or?: string | string[];
  /** 权限值来源（字符串、数组或表达式值）。 */
  value?: any;
}

/**
 * 工具栏按钮配置。
 * @description 描述单个工具栏按钮的展示、交互、权限和视觉属性。
 */
export interface ToolbarToolConfig {
  [key: string]: any;
  /** 透传到按钮组件的属性。 */
  attrs?: Record<string, any>;
  /** 按钮编码，用于事件识别与权限控制。 */
  code?: string;
  /** 是否禁用。 */
  disabled?: ToolbarToolRule;
  /** 是否跟随主题色渲染按钮视觉。 */
  followTheme?: boolean;
  /** 按钮图标。 */
  icon?: string;
  /** 是否仅显示图标不显示文字。 */
  iconOnly?: boolean;
  /** 显示标签（通常作为按钮文本候选）。 */
  label?: string;
  /** 名称（通常用于语义标识或回退标题）。 */
  name?: string;
  /** 工具按钮点击时触发。 */
  onClick?: (
    payload: {
      /** 当前点击按钮的编码。 */
      code?: string;
      /** 工具项在可见列表中的索引。 */
      index: number;
      /** 行内按钮场景下的当前行数据。 */
      row?: Record<string, any>;
      /** 行内按钮场景下的行索引。 */
      rowIndex?: number;
      /** 当前按钮完整配置。 */
      tool?: Record<string, any>;
    }
  ) => any;
  /** 权限约束配置。 */
  permission?: boolean | string | string[] | ToolbarToolPermissionDirective;
  /** 是否显示该工具按钮。 */
  show?: ToolbarToolRule;
  /**
   * @deprecated 请改用 `followTheme`。
   */
  themeColor?: boolean;
  /** 标题文案。 */
  title?: string;
  /** 按钮语义类型（用于映射样式类）。 */
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

/** 工具项插入内置区域的位置。 */
export type ToolbarInlinePosition = 'after' | 'before' | 'left' | 'right';

/** 工具项插槽位置，支持替换默认工具区。 */
export type ToolbarToolsSlotPosition = ToolbarInlinePosition | 'replace';

/** 工具栏提示文字对齐方式。 */
export type ToolbarHintAlign = 'center' | 'left' | 'right';

/** 工具栏提示文字超出时的展示策略。 */
export type ToolbarHintOverflow = 'scroll' | 'wrap';

/** 工具栏提示文字配置。 */
export interface ToolbarHintConfig {
  [key: string]: any;
  /** 提示文字对齐方式。 */
  align?: ToolbarHintAlign;
  /** 提示文字颜色。 */
  color?: string;
  /** 提示内容，优先级高于 `text`。 */
  content?: string;
  /** 字号。 */
  fontSize?: number | string;
  /** 超长内容处理方式。 */
  overflow?: ToolbarHintOverflow;
  /** 滚动模式下的动画时长/速度参数（秒）。 */
  speed?: number;
  /** 提示文本内容。 */
  text?: string;
}

/**
 * 条件策略支持的比较运算符。
 * @description 用于 `TableStrategyCondition.op` 字段定义可选比较语义。
 */
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

/**
 * 正则条件配置。
 * @description 支持 `RegExp` 实例、字符串表达式以及 `{ pattern, flags }` 对象写法。
 */
export type TableStrategyRegexValue =
  | RegExp
  | string
  | {
      /** 正则标志位，如 `i`、`g`。 */
      flags?: string;
      /** 正则表达式主体。 */
      pattern: string;
    };

/**
 * 策略条件表达式。
 * @description 支持字段比较、逻辑组合（`and/or/not`）以及正则/区间等判断方式。
 */
export interface TableStrategyCondition {
  /** 多个条件同时满足。 */
  and?: TableStrategyCondition[];
  /** 目标值处于区间范围内。 */
  between?: [any, any];
  /** 目标值为空（空字符串/空数组/null/undefined）。 */
  empty?: boolean;
  /** 等于指定值。 */
  eq?: any;
  /** 比较字段名，不传时默认使用当前字段。 */
  field?: string;
  /** 目标值是否为假值。 */
  falsy?: boolean;
  /** 大于。 */
  gt?: number | string;
  /** 大于等于。 */
  gte?: number | string;
  /** 目标值属于给定集合。 */
  in?: any[];
  /** 包含关系判断（字符串/数组）。 */
  includes?: any;
  /** 小于。 */
  lt?: number | string;
  /** 小于等于。 */
  lte?: number | string;
  /** 不等于指定值。 */
  neq?: any;
  /** 对子条件取反。 */
  not?: TableStrategyCondition;
  /** 目标值非空。 */
  notEmpty?: boolean;
  /** 目标值不在给定集合中。 */
  notIn?: any[];
  /** 不匹配指定正则。 */
  notRegex?: TableStrategyRegexValue;
  /** 自定义运算符（与 `target` 搭配）。 */
  op?: TableStrategyCompareOperator;
  /** 多个条件满足其一。 */
  or?: TableStrategyCondition[];
  /** 匹配指定正则。 */
  regex?: TableStrategyRegexValue;
  /** 以指定值开头。 */
  startsWith?: any;
  /** 与 `op` 搭配的比较目标值。 */
  target?: any;
  /** 目标值是否为真值。 */
  truthy?: boolean;
  /** 参与比较的候选值（用于 eq/neq/includes 等规则）。 */
  value?: any;
}

/**
 * 行/单元格策略回调共享上下文。
 * @description 为策略计算函数提供统一的数据读取能力与当前渲染位置信息。
 */
export interface TableStrategyContextBase {
  /** 当前列配置。 */
  column?: Record<string, any>;
  /** 当前字段名。 */
  field?: string;
  /** 安全读取当前行字段值。 */
  getValue: (field?: string) => any;
  /** 当前行数据。 */
  row: Record<string, any>;
  /** 当前行索引。 */
  rowIndex: number;
  /** 当前参与策略计算的值。 */
  value: any;
}

/** 行级策略回调上下文。 */
export interface TableRowStrategyContext extends TableStrategyContextBase {}

/** 单元格级策略回调上下文。 */
export interface TableCellStrategyContext extends TableStrategyContextBase {}

/**
 * 可配置为静态值或动态回调的策略解析器类型。
 * @description 允许策略字段既可直接写固定值，也可通过函数按上下文动态计算。
 */
export type TableStrategyResolver<TContext = TableStrategyContextBase> =
  | ((ctx: TContext) => any)
  | any;

/**
 * 策略生效条件。
 * @description 可传条件对象、布尔值或函数，统一用于控制策略是否命中。
 */
export type TableStrategyWhen<TContext = TableStrategyContextBase> =
  | TableStrategyCondition
  | ((ctx: TContext) => boolean)
  | boolean;

/**
 * 策略可返回的展示样式。
 * @description 既支持结构化样式字段，也支持通过 `style` 透传任意样式对象。
 */
export interface TableStrategyStyle {
  [key: string]: any;
  /** 背景色。 */
  backgroundColor?: string;
  /** 样式类名。 */
  className?: string;
  /** 文本颜色。 */
  color?: string;
  /** 鼠标指针样式。 */
  cursor?: string;
  /** 字号。 */
  fontSize?: number | string;
  /** 字重。 */
  fontWeight?: number | string;
  /** 行高。 */
  lineHeight?: number | string;
  /** 样式配置。 */
  style?: Record<string, any>;
  /** 文本修饰线。 */
  textDecoration?: string;
}

/**
 * 单元格策略规则项。
 * @description 当 `when` 命中时用于覆盖或叠加默认单元格策略配置。
 */
export interface TableCellStrategyRule extends TableStrategyStyle {
  /** 命中该规则后是否可点击。 */
  clickable?: boolean;
  /** 命中该规则后的计算值。 */
  compute?: TableStrategyResolver<TableCellStrategyContext>;
  /** 公式表达式（字符串或函数）。 */
  formula?: ((ctx: TableCellStrategyContext) => any) | string;
  /** 单元格点击时触发。 */
  onClick?: (ctx: TableCellStrategyContext) => any;
  /** 数值格式化精度。 */
  precision?: number;
  /** 前缀内容。 */
  prefix?: TableStrategyResolver<TableCellStrategyContext>;
  /** 点击时是否阻止事件冒泡。 */
  stopPropagation?: boolean;
  /** 后缀内容。 */
  suffix?: TableStrategyResolver<TableCellStrategyContext>;
  /** 展示文本。 */
  text?: TableStrategyResolver<TableCellStrategyContext>;
  /** 单位文本。 */
  unit?: TableStrategyResolver<TableCellStrategyContext>;
  /** 值与单位之间的分隔符。 */
  unitSeparator?: string;
  /** 规则命中后用于替换当前值的结果。 */
  value?: TableStrategyResolver<TableCellStrategyContext>;
  /** 规则生效条件。 */
  when?: TableStrategyWhen<TableCellStrategyContext>;
}

/**
 * 单元格策略总配置。
 * @description 定义字段默认展示、交互与值计算逻辑，并支持通过 `rules` 条件覆盖。
 */
export interface TableCellStrategy extends TableStrategyStyle {
  /** 默认是否可点击。 */
  clickable?: boolean;
  /** 默认计算逻辑。 */
  compute?: TableStrategyResolver<TableCellStrategyContext>;
  /** 默认公式表达式。 */
  formula?: ((ctx: TableCellStrategyContext) => any) | string;
  /** 单元格点击时触发。 */
  onClick?: (ctx: TableCellStrategyContext) => any;
  /** 默认数值精度。 */
  precision?: number;
  /** 默认前缀。 */
  prefix?: TableStrategyResolver<TableCellStrategyContext>;
  /** 按条件覆盖默认配置的规则列表。 */
  rules?: TableCellStrategyRule[];
  /** 点击时是否阻止冒泡。 */
  stopPropagation?: boolean;
  /** 默认后缀。 */
  suffix?: TableStrategyResolver<TableCellStrategyContext>;
  /** 默认展示文本。 */
  text?: TableStrategyResolver<TableCellStrategyContext>;
  /** 默认单位。 */
  unit?: TableStrategyResolver<TableCellStrategyContext>;
  /** 默认单位分隔符。 */
  unitSeparator?: string;
  /** 默认值（可被规则 `rules` 覆盖）。 */
  value?: TableStrategyResolver<TableCellStrategyContext>;
}

/**
 * 行策略配置。
 * @description 用于控制整行样式与点击行为，常用于状态高亮和行级交互。
 */
export interface TableRowStrategy extends TableStrategyStyle {
  /** 命中条件时该行是否可点击。 */
  clickable?: boolean;
  /** 行点击时触发。 */
  onClick?: (ctx: TableRowStrategyContext) => any;
  /** 行点击时是否阻止事件冒泡。 */
  stopPropagation?: boolean;
  /** 行策略生效条件。 */
  when?: TableStrategyWhen<TableRowStrategyContext>;
}

/**
 * 表格策略总配置。
 * @description 聚合字段级单元格策略和行级策略，是策略系统的统一入口。
 */
export interface TableStrategyConfig {
  [key: string]: any;
  /** 字段级单元格策略映射（键通常为字段名）。 */
  columns?: Record<string, TableCellStrategy>;
  /** 行级策略数组。 */
  rows?: TableRowStrategy[];
}

/** 列固定方向。 */
export type TableColumnFixedValue = '' | 'left' | 'right';

/** 序号列配置。 */
export interface TableSeqColumnConfig {
  /** 内容对齐方式。 */
  align?: string;
  /** 是否启用。 */
  enabled?: boolean;
  /** 序号列固定方向。 */
  fixed?: TableColumnFixedValue;
  /** 键名。 */
  key?: string;
  /** 标题文案。 */
  title?: string;
  /** 宽度。 */
  width?: number | string;
}

/** 操作列配置。 */
export interface TableOperationColumnConfig {
  /** 内容对齐方式。 */
  align?: string;
  /** 透传到列渲染层的附加属性。 */
  attrs?: Record<string, any>;
  /** 是否启用。 */
  enabled?: boolean;
  /** 操作列固定方向。 */
  fixed?: TableColumnFixedValue;
  /** 键名。 */
  key?: string;
  /** 标题文案。 */
  title?: string;
  /** 操作按钮列表。 */
  tools?: ToolbarToolConfig[];
  /** 宽度。 */
  width?: number | string;
}

/** 斑马纹配置。 */
export interface TableStripeConfig {
  /** 是否启用。 */
  enabled?: boolean;
  /** 是否跟随主题色生成斑马纹颜色。 */
  followTheme?: boolean;
}

/** 列自定义快照。 */
export interface ColumnCustomSnapshot {
  /** 各列筛选开关状态。 */
  filterable: Record<string, boolean>;
  /** 各列固定方向状态。 */
  fixed: Record<string, TableColumnFixedValue>;
  /** 列顺序（按列 key 组成）。 */
  order: string[];
  /** 各列排序开关状态。 */
  sortable: Record<string, boolean>;
  /** 各列可见性状态。 */
  visible: Record<string, boolean>;
}

/** 列自定义初始状态（快照的局部覆盖）。 */
export type ColumnCustomState = Partial<ColumnCustomSnapshot>;

/** 列自定义面板动作类型。 */
export type ColumnCustomAction = 'cancel' | 'confirm' | 'open' | 'reset';

/** 列自定义状态变更事件载荷。 */
export interface ColumnCustomChangePayload {
  /** 触发动作。 */
  action: ColumnCustomAction;
  /** 列配置集合。 */
  columns: Array<Record<string, any>>;
  /** 最新快照。 */
  snapshot: ColumnCustomSnapshot;
  /** 变更前列配置快照。 */
  sourceColumns: Array<Record<string, any>>;
}

/** 列自定义持久化存储介质。 */
export type ColumnCustomPersistenceStorage = 'local' | 'session';

/** 列自定义持久化配置。 */
export interface ColumnCustomPersistenceConfig {
  /** 是否启用。 */
  enabled?: boolean;
  /** 键名。 */
  key?: string;
  /** 存储作用域（用于多表隔离）。 */
  scope?: string;
  /** 使用 `localStorage` 或 `sessionStorage`。 */
  storage?: ColumnCustomPersistenceStorage;
}

/** 表格顶部工具栏配置。 */
export interface ToolbarConfig {
  [key: string]: any;
  /** 是否显示列自定义入口。 */
  custom?: boolean;
  /** 工具栏提示信息。 */
  hint?: string | ToolbarHintConfig;
  /** 是否显示刷新按钮。 */
  refresh?: boolean;
  /** 是否显示查询区展开/收起按钮。 */
  search?: boolean;
  /** 自定义工具按钮列表。 */
  tools?: ToolbarToolConfig[];
  /** 工具按钮插入位置。 */
  toolsPosition?: ToolbarInlinePosition;
  /** 工具按钮与插槽合并方式。 */
  toolsSlotPosition?: ToolbarToolsSlotPosition;
  /** 是否显示最大化按钮。 */
  zoom?: boolean;
}

/** 分页区域对齐方向。 */
export type TablePagerAlign = 'left' | 'right';

/** 分页工具条配置。 */
export interface TablePagerToolbarConfig {
  [key: string]: any;
  /** 分页区域提示信息。 */
  hint?: string | ToolbarHintConfig;
  /** 左侧工具按钮。 */
  leftTools?: ToolbarToolConfig[];
  /** 左侧工具按钮插入位置。 */
  leftToolsPosition?: ToolbarInlinePosition;
  /** 左侧工具按钮与插槽合并方式。 */
  leftToolsSlotPosition?: ToolbarToolsSlotPosition;
  /** 右侧工具按钮。 */
  rightTools?: ToolbarToolConfig[];
  /** 右侧工具按钮插入位置。 */
  rightToolsPosition?: ToolbarInlinePosition;
  /** 右侧工具按钮与插槽合并方式。 */
  rightToolsSlotPosition?: ToolbarToolsSlotPosition;
  /** 通用工具按钮（未区分左右时使用）。 */
  tools?: ToolbarToolConfig[];
  /** 通用工具按钮插入位置。 */
  toolsPosition?: ToolbarInlinePosition;
  /** 通用工具按钮与插槽合并方式。 */
  toolsSlotPosition?: ToolbarToolsSlotPosition;
}

/** 分页导出类型。 */
export type TablePagerExportType = 'all' | 'current' | 'selected';

/** 分页导出动作规则回调上下文。 */
export interface TablePagerExportRuleContext {
  /** 当前导出动作配置。 */
  action: TablePagerExportOption;
  /** 动作在配置数组中的索引。 */
  index: number;
}

/** 导出动作显示/禁用规则。 */
export type TablePagerExportRule =
  | boolean
  | ((ctx: TablePagerExportRuleContext) => boolean);

/**
 * 分页导出回调上下文。
 * @description 导出动作执行时提供分页信息、数据集、已选数据与文件名等参数。
 */
export interface TablePagerExportContext<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 列配置集合。 */
  columns: Array<Record<string, any>>;
  /** 当前页码。 */
  currentPage: number;
  /** 导出文件名（不含扩展名时由实现补全）。 */
  fileName: string;
  /** 当前分页大小。 */
  pageSize: number;
  /** 行数据集合。 */
  rows: TData[];
  /** 已选行键集合。 */
  selectedRowKeys: Array<number | string>;
  /** 已选行数据集合。 */
  selectedRows: TData[];
  /** 总记录数。 */
  total?: number;
  /** 当前导出动作类型。 */
  type: TablePagerExportType;
}

/**
 * 单个导出动作配置。
 * @description 定义某个导出菜单项的显示规则、处理函数和权限控制。
 */
export interface TablePagerExportOption<
  TData extends Record<string, any> = Record<string, any>,
> {
  [key: string]: any;
  /** 动作编码。 */
  code?: string;
  /** 是否禁用。 */
  disabled?: TablePagerExportRule;
  /** 当前动作专属文件名，优先级高于全局导出配置。 */
  fileName?: string;
  /** 动作点击回调。 */
  onClick?: (ctx: TablePagerExportContext<TData>) => any;
  /** 权限约束配置。 */
  permission?:
    | boolean
    | string
    | string[]
    | ToolbarToolPermissionDirective;
  /** 自定义导出请求处理器。 */
  request?: (ctx: TablePagerExportContext<TData>) => any;
  /** 是否显示该导出动作。 */
  show?: TablePagerExportRule;
  /** 标题文案。 */
  title?: string;
  /** 导出动作类型。 */
  type?: TablePagerExportType;
}

/**
 * 分页导出总配置。
 * @description 定义导出入口、默认文件名和各类导出动作行为。
 */
export interface TablePagerExportConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  [key: string]: any;
  /** 是否启用。 */
  enabled?: boolean;
  /** “导出全部”动作处理器。 */
  exportAll?: (ctx: TablePagerExportContext<TData>) => any;
  /** 默认导出文件名。 */
  fileName?: string;
  /** 导出入口图标。 */
  icon?: string;
  /** 导出动作列表（可直接写类型字符串快捷配置）。 */
  options?: Array<TablePagerExportOption<TData> | TablePagerExportType>;
  /** 标题文案。 */
  title?: string;
}

/**
 * 分页区配置。
 * @description 控制分页状态、每页条数、分页工具条与导出能力。
 */
export interface TablePagerConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  [key: string]: any;
  /** 当前页码。 */
  currentPage?: number;
  /** 是否启用。 */
  enabled?: boolean;
  /** 分页导出配置。 */
  exportConfig?: boolean | TablePagerExportConfig<TData>;
  /** 每页条数。 */
  pageSize?: number;
  /** 可选分页大小列表。 */
  pageSizes?: number[];
  /** 分页区对齐位置。 */
  position?: TablePagerAlign;
  /** 变更每页条数后是否自动回到第一页。 */
  resetToFirstOnPageSizeChange?: boolean;
  /** 分页区工具条配置。 */
  toolbar?: TablePagerToolbarConfig;
  /** 总记录数。 */
  total?: number;
}

/** 查询区和表格区之间分隔条配置。 */
export interface SeparatorOptions {
  /** 分隔条背景色。 */
  backgroundColor?: string;
  /** 是否显示分隔条。 */
  show?: boolean;
}

/**
 * 代理请求钩子集合。
 * @description 约定表格查询、刷新与全量查询等流程中的请求函数和生命周期回调。
 */
export interface ProxyAjaxHandlers {
  [key: string]: any;
  /** 分页查询。 */
  query?: (...args: any[]) => any;
  /** 查询全部数据。 */
  queryAll?: (...args: any[]) => any;
  /** 查询全部失败回调。 */
  queryAllError?: (...args: any[]) => any;
  /** 查询全部成功回调。 */
  queryAllSuccess?: (...args: any[]) => any;
  /** 分页查询失败回调。 */
  queryError?: (...args: any[]) => any;
  /** 分页查询成功回调。 */
  querySuccess?: (...args: any[]) => any;
  /** 刷新当前查询。 */
  reload?: (...args: any[]) => any;
  /** 刷新失败回调。 */
  reloadError?: (...args: any[]) => any;
  /** 刷新成功回调。 */
  reloadSuccess?: (...args: any[]) => any;
}

/**
 * 表格代理请求配置。
 * @description 定义表格与远端接口联动时的请求行为、响应字段映射和提示策略。
 */
export interface ProxyConfig {
  [key: string]: any;
  /** 各类请求处理器。 */
  ajax?: ProxyAjaxHandlers;
  /** 初始化后是否自动触发查询。 */
  autoLoad?: boolean;
  /** 是否启用。 */
  enabled?: boolean;
  /** 响应字段映射配置。 */
  response?: {
    [key: string]: any;
    /** 列表字段路径。 */
    list?: string;
    /** 成功标记字段路径。 */
    result?: string;
    /** 总数字段路径。 */
    total?: string;
  };
  /** 是否显示请求进行中的提示。 */
  showActiveMsg?: boolean;
  /** 是否显示接口响应提示。 */
  showResponseMsg?: boolean;
  /** 是否启用服务端排序参数拼装。 */
  sort?: boolean;
}

/** 分页变更来源类型。 */
export type AdminTablePaginationChangeType = 'current' | 'size';

/** 分页变更事件载荷。 */
export interface AdminTablePaginationChangePayload {
  /** 变更后的页码。 */
  currentPage: number;
  /** 变更后的每页条数。 */
  pageSize: number;
  /** 原始分页事件对象。 */
  raw?: Record<string, any>;
  /** 触发来源框架。 */
  source: 'react' | 'vue';
  /** 总记录数。 */
  total?: number;
  /** 分页变更类型（页码变化或每页条数变化）。 */
  type: AdminTablePaginationChangeType;
}

/** 分页导出点击事件载荷。 */
export interface AdminTablePagerExportPayload {
  /** 导出类型编码。 */
  code: TablePagerExportType;
  /** 当前页码。 */
  currentPage: number;
  /** 实际使用的文件名。 */
  fileName: string;
  /** 当前每页条数。 */
  pageSize: number;
  /** 触发来源框架。 */
  source: 'react' | 'vue';
  /** 总记录数。 */
  total?: number;
}

/**
 * 表格层对外暴露的事件集合。
 * @description 汇总分页、工具栏、列自定义等核心交互的事件回调入口。
 */
export interface AdminTableGridEvents {
  [key: string]: ((...args: any[]) => any) | undefined;
  /** 列自定义状态变更。 */
  columnCustomChange?: (payload: ColumnCustomChangePayload) => any;
  /** 页码变更回调。 */
  onPageChange?: (payload: AdminTablePaginationChangePayload) => any;
  /** 每页条数变更回调。 */
  onPageSizeChange?: (payload: AdminTablePaginationChangePayload) => any;
  /** 分页状态统一变更回调。 */
  onPaginationChange?: (payload: AdminTablePaginationChangePayload) => any;
  /** 点击分页导出动作。 */
  pagerExportClick?: (payload: AdminTablePagerExportPayload) => any;
  /** 点击行操作工具按钮。 */
  operationToolClick?: (...args: any[]) => any;
  /** 点击工具栏按钮。 */
  toolbarToolClick?: (...args: any[]) => any;
}

/**
 * 管理表格统一配置。
 * @description 跨框架（React/Vue）复用的核心配置模型，覆盖表单、表格、分页与策略能力。
 */
export interface AdminTableOptions<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  /** 外层容器类名。 */
  class?: string;
  /** 查询表单配置。 */
  formOptions?: Record<string, any>;
  /** 表格容器类名。 */
  gridClass?: string;
  /** 表格事件集合。 */
  gridEvents?: AdminTableGridEvents;
  /** 表格选项（跨框架公共层）。 */
  gridOptions?: Record<string, any> & {
    /** 列自定义持久化配置。 */
    columnCustomPersistence?: boolean | ColumnCustomPersistenceConfig;
    /** 列自定义初始状态。 */
    columnCustomState?: ColumnCustomState;
    /** 列配置集合。 */
    columns?: Array<Record<string, any>>;
    /** 字段级单元格策略。 */
    cellStrategy?: Record<string, TableCellStrategy>;
    /** 本地数据源。 */
    data?: TData[];
    /** 操作列配置。 */
    operationColumn?: boolean | TableOperationColumnConfig;
    /** 分页配置。 */
    pagerConfig?: TablePagerConfig<TData>;
    /** 代理请求配置。 */
    proxyConfig?: ProxyConfig;
    /** 行策略列表。 */
    rowStrategy?: TableRowStrategy[];
    /** 表格实例标识（用于列自定义持久化作用域等场景）。 */
    tableId?: string;
    /** 斑马纹配置。 */
    stripe?: boolean | TableStripeConfig;
    /** 序号列配置。 */
    seqColumn?: boolean | TableSeqColumnConfig;
    /** 整体策略配置。 */
    strategy?: TableStrategyConfig;
    /** 顶部工具栏配置。 */
    toolbarConfig?: ToolbarConfig;
  };
  /** 查询区与表格区分隔条配置。 */
  separator?: boolean | SeparatorOptions;
  /** 是否显示查询表单。 */
  showSearchForm?: boolean;
  /** 表格标题。 */
  tableTitle?: string;
  /** 标题帮助文案。 */
  tableTitleHelp?: string;
  /** 预留扩展字段，仅用于类型推断，不参与运行时。 */
  __formValuesType?: TFormValues;
}

/**
 * 组件 `props` 类型别名。
 * @description 与 `AdminTableOptions` 保持一致，便于在适配层统一复用。
 */
export type AdminTableProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> = AdminTableOptions<TData, TFormValues>;

/**
 * 查询执行上下文。
 * @description 在 query/reload 执行器中用于区分触发模式并携带参数。
 */
export interface TableQueryContext {
  /** 查询模式：普通查询或刷新。 */
  mode: 'query' | 'reload';
  /** 查询参数。 */
  params: Record<string, any>;
}

/**
 * 表格执行器集合。
 * @description 对查询与刷新动作的统一抽象，便于桥接到不同数据源实现。
 */
export interface TableExecutors {
  /** 执行查询。 */
  query?: (ctx: TableQueryContext) => Promise<any> | any;
  /** 执行刷新。 */
  reload?: (ctx: TableQueryContext) => Promise<any> | any;
}

/**
 * 表格依赖的最小表单 API 形状。
 * @description 约束表格与查询表单联动时需要的最小方法集合。
 */
export interface TableFormApiLike {
  /** 获取最近一次提交时的表单值。 */
  getLatestSubmissionValues?: () => Record<string, any>;
  /** 获取当前表单值。 */
  getValues?: () => Promise<Record<string, any>>;
}
