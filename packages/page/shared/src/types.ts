/**
 * Page Shared 共享类型定义。
 * @description 统一跨框架 Page 适配层的组件属性与 QueryTable 组合类型契约。
 */
import type {
  AdminPageItem,
  AdminPageOptions,
  PageFormTableBridgeOptions,
  PageQueryTableApi,
  PageQueryTableExecutor,
  PageQueryTableLayoutOptions,
  RoutePageItem,
} from '@admin-core/page-core';

/**
 * Page 适配层页面项类型别名。
 * @description 复用 core 页面项结构，供 React/Vue 侧统一声明页面列表类型。
 * @template TComponent 页面组件类型。
 */
export type AdminPageAdapterItem<TComponent> = AdminPageItem<TComponent>;

/**
 * Page 适配组件属性。
 * @description 定义跨框架 Page 容器的通用输入，包括页面数组、空态与路由页渲染器。
 * @template TComponent 页面组件类型。
 * @template TRenderNode 渲染节点类型。
 * @template TStyle 样式对象类型。
 */
export interface AdminPageAdapterProps<
  TComponent,
  TRenderNode,
  TStyle = unknown,
> extends Omit<AdminPageOptions<TComponent>, 'pages'> {
  /** 根节点样式类名。 */
  className?: string;
  /** 页面配置列表。 */
  pages?: AdminPageAdapterItem<TComponent>[];
  /** 无可渲染页面时的空态渲染函数。 */
  renderEmpty?: () => TRenderNode;
  /** 路由页面渲染函数。 */
  renderRoutePage?: (page: RoutePageItem<TComponent>) => TRenderNode;
  /** 路由未命中时展示的兜底内容。 */
  routeFallback?: TRenderNode;
  /** 根节点样式对象。 */
  style?: TStyle;
}

/**
 * Page 查询表单 + 表格适配 API 类型别名。
 * @description 在共享层保持 Query+Table 组合 API 的泛型签名一致性。
 * @template _TData 表格行数据类型（占位，保持与上层泛型一致）。
 * @template _TFormValues 查询表单值类型（占位，保持与上层泛型一致）。
 * @template TFormApi 表单 API 类型。
 * @template TTableApi 表格 API 类型。
 */
export type AdminPageQueryTableAdapterApi<
  _TData extends Record<string, unknown>,
  _TFormValues extends Record<string, unknown>,
  TFormApi,
  TTableApi extends PageQueryTableExecutor,
> = PageQueryTableApi<TFormApi, TTableApi>;

/**
 * 查询表单 + 表格适配组件属性。
 * @description 封装组合页中表单、表格、桥接配置与布局参数的统一契约。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 * @template TFormApi 表单 API 类型。
 * @template TTableApi 表格 API 类型。
 * @template TFormOptions 表单组件配置类型。
 * @template TTableOptions 表格组件配置类型。
 * @template TStyle 样式对象类型。
 */
export interface AdminPageQueryTableAdapterProps<
  TData extends Record<string, unknown>,
  TFormValues extends Record<string, unknown>,
  TFormApi,
  TTableApi extends PageQueryTableExecutor,
  TFormOptions,
  TTableOptions,
  TStyle = unknown,
> extends PageQueryTableLayoutOptions {
  /** 外部传入的查询表单 + 表格桥接 API。 */
  api?: AdminPageQueryTableAdapterApi<TData, TFormValues, TFormApi, TTableApi>;
  /** 是否启用 form/table 桥接，或桥接配置对象。 */
  bridge?: boolean | PageFormTableBridgeOptions<TFormValues, TFormApi, TTableApi>;
  /** 根节点样式类名。 */
  className?: string;
  /** 外部传入的表单 API。 */
  formApi?: TFormApi;
  /** 表单组件初始化配置。 */
  formOptions?: TFormOptions;
  /** 根节点样式对象。 */
  style?: TStyle;
  /** 表格区域高度。 */
  tableHeight?: number | string;
  /** 外部传入的表格 API。 */
  tableApi?: TTableApi;
  /** 表格组件初始化配置。 */
  tableOptions?: TTableOptions;
}

/**
 * `useAdminPageQueryTableAdapter` 返回值类型。
 * @description 依次返回组合组件类型与对应的 Query+Table 组合 API。
 * @template TQueryTableComponent 组合页组件类型。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 * @template TFormApi 表单 API 类型。
 * @template TTableApi 表格 API 类型。
 */
export type UseAdminPageQueryTableAdapterReturn<
  TQueryTableComponent,
  TData extends Record<string, unknown>,
  TFormValues extends Record<string, unknown>,
  TFormApi,
  TTableApi extends PageQueryTableExecutor,
> = readonly [
  TQueryTableComponent,
  AdminPageQueryTableAdapterApi<TData, TFormValues, TFormApi, TTableApi>,
];
