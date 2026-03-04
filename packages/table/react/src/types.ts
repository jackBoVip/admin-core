/**
 * Table React 类型定义。
 * @description 汇总 React 表格适配层配置、插槽、渲染器与初始化相关类型。
 */
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
  ToolbarConfig,
} from '@admin-core/table-core';
import type { AdminFormProps } from '@admin-core/form-react';
import type {
  BuiltInTableLocale,
  SetupAdminTableSharedOptions,
} from '@admin-core/table-shared';
import type { TableProps } from 'antd';
import type { ReactNode } from 'react';

/**
 * 行选择规则回调上下文。
 * @description 为按行动态启禁勾选/单选提供当前行数据与索引信息。
 * @template TData 行数据类型。
 */
export interface AntdRowSelectionRuleContext<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 当前命中的行数据。 */
  row: TData;
  /** 当前行在渲染数据中的索引（从 0 开始）。 */
  rowIndex: number;
}

/**
 * 多选模式配置。
 * @description 对 antd 多选行为做统一封装，并补充跨端约定字段。
 * @template TData 行数据类型。
 */
export interface AntdCheckboxConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 透传给 antd `rowSelection` 的其余字段。 */
  [key: string]: any;
  /** 使用行字段值驱动勾选状态时的字段名。 */
  checkField?: string;
  /** 按行动态判定是否允许勾选。 */
  checkMethod?: (ctx: AntdRowSelectionRuleContext<TData>) => boolean;
  /** 选中时是否高亮整行。 */
  highlight?: boolean;
  /** 行选择列文本字段。 */
  labelField?: string;
  /** 触发勾选的交互区域。 */
  trigger?: 'cell' | 'row';
}

/**
 * 单选模式配置。
 * @description 对 antd 单选行为做统一封装，并补充跨端约定字段。
 * @template TData 行数据类型。
 */
export interface AntdRadioConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 透传给 antd `rowSelection` 的其余字段。 */
  [key: string]: any;
  /** 使用行字段值驱动选中状态时的字段名。 */
  checkField?: string;
  /** 按行动态判定是否允许选中。 */
  checkMethod?: (ctx: AntdRowSelectionRuleContext<TData>) => boolean;
  /** 选中时是否高亮整行。 */
  highlight?: boolean;
  /** 行选择列文本字段。 */
  labelField?: string;
  /** 触发选中的交互区域。 */
  trigger?: 'cell' | 'row';
}

/**
 * 基于 antd `rowSelection` 扩展的统一行选择配置。
 * @description 用于同时兼容核心层行选择语义与 antd 原生选择参数。
 * @template TData 行数据类型。
 */
export interface AntdRowSelectionConfig<
  TData extends Record<string, any> = Record<string, any>,
> extends NonNullable<TableProps<TData>['rowSelection']> {
  /** 使用行字段值驱动选中状态时的字段名。 */
  checkField?: string;
  /** 按行动态判定是否允许选中。 */
  checkMethod?: (ctx: AntdRowSelectionRuleContext<TData>) => boolean;
  /** 选中时是否高亮整行。 */
  highlight?: boolean;
  /** 树表场景中是否启用严格父子节点联动。 */
  strict?: boolean;
  /** 触发选中的交互区域。 */
  trigger?: 'cell' | 'row';
}

/**
 * AdminTable 在 React(antd) 侧的列配置扩展。
 * @description 在 antd 列定义基础上，补充统一渲染器与跨端字段。
 */
export interface AntdTableColumn extends Record<string, any> {
  /** 单元格渲染器配置。 */
  cellRender?: {
    /** 透传到渲染器组件的属性。 */
    attrs?: Record<string, any>;
    /** 渲染器名称（用于匹配注册表中的渲染器 key）。 */
    name?: string;
    /** 渲染器可选参数列表。 */
    options?: any[];
    /** 透传到渲染器组件的 props。 */
    props?: Record<string, any>;
  };
  /** 对应数据字段（antd 字段名）。 */
  dataIndex?: string;
  /** 可编辑渲染器配置。 */
  editRender?: {
    /** 编辑渲染器名称（用于匹配注册表中的编辑器 key）。 */
    name?: string;
    /** 透传到编辑渲染器的 props。 */
    props?: Record<string, any>;
  };
  /** 是否允许在列自定义中切换筛选能力。 */
  filterable?: boolean;
  /** 逻辑字段名（与 dataIndex 二选一或并存）。 */
  field?: string;
  /** 列固定方向。 */
  fixed?: 'left' | 'right';
  /** 预留插槽映射（兼容跨端配置）。 */
  slots?: {
    /** 默认插槽名称。 */
    default?: string;
  };
  /** 列类型标识（如 `seq`、`checkbox`、`radio`、`operation`）。 */
  type?: string;
  /** 是否允许在列自定义中切换排序能力。 */
  sortable?: boolean;
  /** 标题文案。 */
  title?: ReactNode;
  /** 宽度。 */
  width?: number | string;
}

/**
 * React(antd) 表格配置。
 * @description 在 antd `TableProps` 基础上补充核心层策略、分页与工具栏配置。
 * @template TData 行数据类型。
 */
export interface AntdGridOptions<
  TData extends Record<string, any> = Record<string, any>,
> extends Omit<TableProps<TData>, 'columns' | 'dataSource' | 'onChange' | 'pagination' | 'rowSelection'> {
  /** 是否显示边框。 */
  border?: boolean;
  /** 多选配置。 */
  checkboxConfig?: AntdCheckboxConfig<TData>;
  /** 字段级单元格策略。 */
  cellStrategy?: Record<string, TableCellStrategy>;
  /** 列自定义持久化配置。 */
  columnCustomPersistence?: boolean | ColumnCustomPersistenceConfig;
  /** 列自定义初始状态。 */
  columnCustomState?: ColumnCustomState;
  /** 列配置集合。 */
  columns?: AntdTableColumn[];
  /** 本地数据源。 */
  data?: TData[];
  /** 表格实例标识（用于列自定义持久化作用域等场景）。 */
  tableId?: string;
  /** 编辑态配置。 */
  editConfig?: {
    /** 编辑模式：单元格或整行。 */
    mode?: 'cell' | 'row';
    /** 进入编辑态的触发方式。 */
    trigger?: 'click' | 'dblclick';
  };
  /** 表格库原生变化回调（分页、筛选、排序变化时触发）。 */
  onChange?: TableProps<TData>['onChange'];
  /** 操作列配置。 */
  operationColumn?: boolean | TableOperationColumnConfig;
  /** 分页配置。 */
  pagerConfig?: (Record<string, any> & {
    /**
     * 是否在切换 pageSize 时自动回到第一页。
     */
    resetToFirstOnPageSizeChange?: boolean;
  } & TablePagerConfig<TData>);
  /** 代理请求配置。 */
  proxyConfig?: ProxyConfig;
  /** 单选配置。 */
  radioConfig?: AntdRadioConfig<TData>;
  /** 行策略配置。 */
  rowStrategy?: TableRowStrategy[];
  /** 完整行选择配置。 */
  rowSelection?: AntdRowSelectionConfig<TData>;
  /** 序号列配置。 */
  seqColumn?: boolean | TableSeqColumnConfig;
  /** 整体策略配置。 */
  strategy?: TableStrategyConfig;
  /** 高度。 */
  height?: number | string;
  /** 行配置。 */
  rowConfig?: {
    /** 行主键字段。 */
    keyField?: string;
  };
  /** 纵向滚动配置。 */
  scrollY?: {
    /** 是否启用。 */
    enabled?: boolean;
    /** 数据量大于该值时启用虚拟滚动。 */
    gt?: number;
  };
  /** 排序配置。 */
  sortConfig?: {
    /** 默认排序配置。 */
    defaultSort?: {
      /** 默认排序字段。 */
      field?: string;
      /** 排序信息。 */
      order?: 'asc' | 'desc';
    };
    /** 是否使用远程排序。 */
    remote?: boolean;
  };
  /** 斑马纹配置。 */
  stripe?: boolean | TableStripeConfig;
  /** 顶部工具栏配置。 */
  toolbarConfig?: ToolbarConfig;
  /** 树表配置。 */
  treeConfig?: {
    /** 父节点字段。 */
    parentField?: string;
    /** 当前节点主键字段。 */
    rowField?: string;
    /** 是否将平铺数据自动转换为树结构。 */
    transform?: boolean;
  };
}

/**
 * React 侧可用插槽定义。
 * @description 兼容工具栏、分页栏与查询表单具名插槽。
 */
export interface AdminTableSlots {
  /** 通用命名插槽。 */
  [name: string]: ReactNode | ((params?: any) => ReactNode);
  /** 空数据插槽。 */
  empty?: ReactNode | (() => ReactNode);
  /** 查询表单插槽。 */
  form?: ReactNode | (() => ReactNode);
  /** 加载态插槽。 */
  loading?: ReactNode | (() => ReactNode);
  /** 表格标题插槽。 */
  'table-title'?: ReactNode | (() => ReactNode);
  /** 工具栏动作区插槽。 */
  'toolbar-actions'?: ReactNode | ((params?: any) => ReactNode);
  /** 工具栏中部插槽。 */
  'toolbar-center'?: ReactNode | ((params?: any) => ReactNode);
  /** 工具栏工具区插槽。 */
  'toolbar-tools'?: ReactNode | ((params?: any) => ReactNode);
  /** 分页左侧插槽。 */
  'pager-left'?: ReactNode | ((params?: any) => ReactNode);
  /** 分页中部插槽。 */
  'pager-center'?: ReactNode | ((params?: any) => ReactNode);
  /** 分页工具区插槽。 */
  'pager-tools'?: ReactNode | ((params?: any) => ReactNode);
  /** 查询表单项具名插槽，键格式：`form-字段名`。 */
  [key: `form-${string}`]: ReactNode | ((params?: any) => ReactNode);
}

/**
 * React 版 AdminTable 组件 props。
 * @description 聚合查询表单、表格渲染与插槽扩展等 React 端完整输入。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export interface AdminTableReactProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> extends Omit<AdminTableProps<TData, TFormValues>, 'formOptions' | 'gridOptions'> {
  /** 查询表单配置。 */
  formOptions?: AdminFormProps;
  /** 表格配置。 */
  gridOptions?: AntdGridOptions<TData>;
  /** 查询区与表格区分隔条配置。 */
  separator?: boolean | SeparatorOptions;
  /** 自定义插槽集合。 */
  slots?: AdminTableSlots;
}

/**
 * React 侧扩展后的表格 API。
 * @description 在核心 API 基础上扩展 `useStore` 订阅接口，支持细粒度状态读取。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export type ExtendedAdminTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> = AdminTableApi<TData, TFormValues> & {
  /**
   * 读取内部状态仓库；可通过选择器只订阅目标切片。
   * @template TSlice 切片类型。
   * @param selector 状态切片选择器；未传时返回完整组件 props。
   * @returns 当前切片值。
   */
  useStore: <TSlice = AdminTableReactProps<TData, TFormValues>>(
    selector?: (
      state: AdminTableReactProps<TData, TFormValues>
    ) => TSlice
  ) => TSlice;
};

/**
 * React 版本全局安装配置。
 * @description 在共享配置基础上补充 React 端默认网格选项。
 */
export interface SetupAdminTableReactOptions extends SetupAdminTableSharedOptions {
  /** 全局默认 `gridOptions`，会与实例级配置合并。 */
  defaultGridOptions?: Partial<AntdGridOptions>;
  /** 全局语言。 */
  locale?: BuiltInTableLocale;
}
