/**
 * Table Vue 类型定义。
 * @description 汇总 Vue 表格适配层配置、插槽、渲染器与初始化相关类型。
 */
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

/**
 * VXE 工具栏配置（基于公共 `ToolbarConfig` 扩展）。
 * @description 在核心工具栏能力基础上补充 VXE 查询展开按钮语义。
 */
export interface VxeToolbarConfig extends ToolbarConfig {
  /** 是否显示查询区展开/收起按钮。 */
  search?: boolean;
}

/**
 * 行选择规则回调上下文。
 * @description 为按行动态启禁选择提供当前行数据与索引信息。
 * @template TData 行数据类型。
 */
export interface VxeRowSelectionRuleContext<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 当前命中的行数据。 */
  row: TData;
  /** 当前行在渲染数据中的索引（从 0 开始）。 */
  rowIndex: number;
}

/**
 * VXE 行选择配置。
 * @description 对 vxe-table 行选择能力做统一封装，并补充跨端约定字段。
 * @template TData 行数据类型。
 */
export interface VxeRowSelectionConfig<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 透传给 vxe 行选择配置的其余字段。 */
  [key: string]: any;
  /** 使用行字段值驱动选中状态时的字段名。 */
  checkField?: string;
  /** 按行动态判定是否允许选中。 */
  checkMethod?: (ctx: VxeRowSelectionRuleContext<TData>) => boolean;
  /** 默认选中行键集合（非受控）。 */
  defaultSelectedRowKeys?: Array<number | string>;
  /** 选中时是否高亮整行。 */
  highlight?: boolean;
  /** 行选择变化回调（选中键、选中行、额外参数）。 */
  onChange?: (
    selectedRowKeys: Array<number | string>,
    selectedRows: TData[],
    params?: Record<string, any>
  ) => void;
  /** 受控选中行键集合。 */
  selectedRowKeys?: Array<number | string>;
  /** 树表场景中是否启用严格父子节点联动。 */
  strict?: boolean;
  /** 触发选中的交互区域。 */
  trigger?: 'cell' | 'row';
  /** 选择模式。 */
  type?: 'checkbox' | 'radio';
}

/**
 * Vue(VXE) 表格配置。
 * @description 在 VXE `GridProps` 基础上补充核心层策略、分页与工具栏配置。
 * @template T 行数据类型。
 */
export interface VxeTableGridOptions<
  T extends Record<string, any> = Record<string, any>,
> extends Omit<VxeTableGridProps<T>, 'pagerConfig' | 'stripe' | 'toolbarConfig'> {
  /** 字段级单元格策略。 */
  cellStrategy?: Record<string, TableCellStrategy>;
  /** 列自定义持久化配置。 */
  columnCustomPersistence?: boolean | ColumnCustomPersistenceConfig;
  /** 列自定义初始状态。 */
  columnCustomState?: ColumnCustomState;
  /** 操作列配置。 */
  operationColumn?: boolean | TableOperationColumnConfig;
  /** 分页配置。 */
  pagerConfig?: (Record<string, any> & {
    /**
     * 是否在切换 pageSize 时自动回到第一页。
     */
    resetToFirstOnPageSizeChange?: boolean;
  } & TablePagerConfig<T>);
  /** 行策略配置。 */
  rowStrategy?: TableRowStrategy[];
  /** 行选择配置。 */
  rowSelection?: VxeRowSelectionConfig<T>;
  /** 序号列配置。 */
  seqColumn?: boolean | TableSeqColumnConfig;
  /** 表格实例标识（用于列自定义持久化作用域等场景）。 */
  tableId?: string;
  /** 斑马纹配置。 */
  stripe?: boolean | TableStripeConfig;
  /** 整体策略配置。 */
  strategy?: TableStrategyConfig;
  /** 顶部工具栏配置。 */
  toolbarConfig?: VxeToolbarConfig;
}

/**
 * Vue 版 AdminTable 组件 props。
 * @description 聚合查询表单、表格渲染与事件扩展等 Vue 端完整输入。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export interface AdminTableVueProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> extends Omit<AdminTableProps<TData, TFormValues>, 'formOptions' | 'gridEvents' | 'gridOptions'> {
  /** 查询表单配置。 */
  formOptions?: AdminFormProps;
  /** 表格事件集合。 */
  gridEvents?: AdminTableGridEvents & Partial<VxeGridListeners<TData>>;
  /** 表格配置。 */
  gridOptions?: Partial<VxeTableGridOptions<TData>>;
  /** 查询区与表格区分隔条配置。 */
  separator?: boolean | SeparatorOptions;
}

/**
 * Vue 侧扩展后的表格 API。
 * @description 在核心 API 基础上扩展 `useStore` 订阅接口，返回只读 `Ref`。
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
   * @returns 当前切片的只读响应式引用。
   */
  useStore: <TSlice = AdminTableVueProps<TData, TFormValues>>(
    selector?: (
      state: AdminTableVueProps<TData, TFormValues>
    ) => TSlice
  ) => Readonly<Ref<TSlice>>;
};

/**
 * Vue 版本全局安装配置。
 * @description 在共享配置基础上补充 vxe-table 侧扩展入口。
 */
export interface SetupAdminTableVueOptions extends SetupAdminTableSharedOptions {
  /** 允许在安装阶段扩展 vxe-table 全局配置。 */
  configVxeTable?: (ui: VxeUIExport) => void;
  /** 全局语言。 */
  locale?: BuiltInTableLocale;
  /** 自定义主题与语言同步逻辑。 */
  setupThemeAndLocale?: (ui: VxeUIExport) => void;
}
