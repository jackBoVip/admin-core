/**
 * Page Vue 适配层类型定义。
 * @description 描述 Vue 组件侧页面模型、组合 API 以及 setup 入参与返回值契约。
 */

import type {
  AdminPageApi,
  AdminPageAdapterItem,
  AdminPageAdapterProps,
  AdminPageQueryTableAdapterApi,
  AdminPageQueryTableAdapterProps,
  PageAdapterSetupOptions,
  UseAdminPageQueryTableAdapterReturn,
} from '@admin-core/page-shared';
import type {
  AdminFormApi,
  AdminFormProps,
  SetupAdminFormVueOptions,
} from '@admin-core/form-vue';
import type {
  AdminTableApi,
  SetupAdminTableVueOptions,
  AdminTableVueProps,
} from '@admin-core/table-vue';
import type {
  Component,
  CSSProperties,
  Ref,
  VNodeChild,
} from 'vue';

/**
 * Vue 页面组件类型。
 * @description 可为组件定义、渲染函数或可直接渲染的 VNode 内容。
 */
export type VuePageComponent =
  | (() => VNodeChild)
  | Component
  | VNodeChild;

/**
 * Vue 页面项类型。
 * @description 描述单个页面标签对应的数据结构，包含标题、组件与滚动策略等信息。
 */
export type AdminPageVueItem = AdminPageAdapterItem<VuePageComponent>;

/**
 * Vue Page 组件属性。
 * @description 统一约束页面容器渲染、样式透传与内容插槽输入。
 */
export interface AdminPageVueProps
  extends AdminPageAdapterProps<VuePageComponent, VNodeChild, CSSProperties> {}

/**
 * Vue 侧扩展页面 API。
 * @description 在通用 Page API 基础上扩展 Vue 生态常用的 `Ref` selector 订阅能力。
 */
export interface ExtendedAdminPageApi
  extends AdminPageApi<VuePageComponent> {
  /**
   * 基于 selector 的状态订阅接口，返回只读 `Ref`。
   * @template TSlice 订阅切片类型。
   * @param selector 状态切片选择器；未传时返回完整 `AdminPageVueProps`。
   * @returns 当前切片的只读响应式引用。
   */
  useStore?: <TSlice = AdminPageVueProps>(
    selector?: (state: AdminPageVueProps) => TSlice
  ) => Readonly<Ref<TSlice>>;
}

/**
 * Vue Page 适配层初始化参数。
 * @description 用于统一注入 Form/Table 子系统的 Vue 适配配置。
 */
export interface SetupAdminPageVueOptions
  extends PageAdapterSetupOptions<
    SetupAdminFormVueOptions,
    SetupAdminTableVueOptions
  > {}

/**
 * `useAdminPage` 返回值类型（Vue）。
 * @description 依次返回绑定当前 API 的页面组件与扩展页面 API 实例。
 */
export type UseAdminPageReturn = readonly [
  Component<AdminPageVueProps>,
  ExtendedAdminPageApi
];

/**
 * Query+Table 页面组合 API（Vue）。
 * @description 聚合查询表单与数据表格控制器，提供一体化联动操作入口。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export type AdminPageQueryTableApi<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = AdminPageQueryTableAdapterApi<
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;

/**
 * Query+Table 页面组合组件属性（Vue）。
 * @description 组合查询区、表格区与布局参数，支持统一传参与样式扩展。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export interface AdminPageQueryTableVueProps<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> extends AdminPageQueryTableAdapterProps<
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>,
  AdminFormProps,
  AdminTableVueProps<TData, TFormValues>,
  CSSProperties
> {}

/**
 * `useAdminPageQueryTable` 返回值类型（Vue）。
 * @description 依次返回组合组件、查询/表格联合 API 及其控制句柄。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export type UseAdminPageQueryTableReturn<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = UseAdminPageQueryTableAdapterReturn<
  Component<Partial<AdminPageQueryTableVueProps<TData, TFormValues>>>,
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;
