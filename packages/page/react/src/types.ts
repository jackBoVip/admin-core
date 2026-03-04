/**
 * Page React 适配层类型定义。
 * @description 描述 React 组件侧页面模型、组合 API 以及 setup 入参与返回值契约。
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
  SetupAdminFormReactOptions,
} from '@admin-core/form-react';
import type {
  AdminTableApi,
  SetupAdminTableReactOptions,
  AdminTableReactProps,
} from '@admin-core/table-react';
import type {
  ComponentType,
  CSSProperties,
  ReactNode,
} from 'react';

/**
 * React 页面组件类型。
 * @description 可为组件类型或可直接渲染的 React 节点。
 */
export type ReactPageComponent = ComponentType<unknown> | ReactNode;

/**
 * React 页面项类型。
 * @description 描述单个页面标签对应的数据结构，包含标题、组件与滚动策略等信息。
 */
export type AdminPageReactItem = AdminPageAdapterItem<ReactPageComponent>;

/**
 * React Page 组件属性。
 * @description 统一约束页面容器渲染、样式透传与内容插槽输入。
 */
export interface AdminPageReactProps
  extends AdminPageAdapterProps<ReactPageComponent, ReactNode, CSSProperties> {}

/**
 * React 侧扩展页面 API。
 * @description 在通用 Page API 基础上扩展 React 生态常用的 selector 订阅能力。
 */
export interface ExtendedAdminPageApi
  extends AdminPageApi<ReactPageComponent> {
  /**
   * 基于 selector 的状态订阅 Hook。
   * @template TSlice 订阅切片类型。
   * @param selector 状态切片选择器；未传时返回完整 `AdminPageReactProps`。
   * @returns 当前切片值。
   */
  useStore?: <TSlice = AdminPageReactProps>(
    selector?: (state: AdminPageReactProps) => TSlice
  ) => TSlice;
}

/**
 * React Page 适配层初始化参数。
 * @description 用于统一注入 Form/Table 子系统的 React 适配配置。
 */
export interface SetupAdminPageReactOptions
  extends PageAdapterSetupOptions<
    SetupAdminFormReactOptions,
    SetupAdminTableReactOptions
  > {}

/**
 * `useAdminPage` 返回值类型（React）。
 * @description 依次返回绑定当前 API 的页面组件与扩展页面 API 实例。
 */
export type UseAdminPageReturn = readonly [
  ComponentType<AdminPageReactProps>,
  ExtendedAdminPageApi
];

/**
 * Query+Table 页面组合 API（React）。
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
 * Query+Table 页面组合组件属性（React）。
 * @description 组合查询区、表格区与布局参数，支持统一传参与样式扩展。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export interface AdminPageQueryTableReactProps<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> extends AdminPageQueryTableAdapterProps<
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>,
  AdminFormProps,
  AdminTableReactProps<TData, TFormValues>,
  CSSProperties
> {}

/**
 * `useAdminPageQueryTable` 返回值类型（React）。
 * @description 依次返回组合组件、查询/表格联合 API 及其控制句柄。
 * @template TData 表格行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export type UseAdminPageQueryTableReturn<
  TData extends Record<string, unknown> = Record<string, unknown>,
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
> = UseAdminPageQueryTableAdapterReturn<
  ComponentType<Partial<AdminPageQueryTableReactProps<TData, TFormValues>>>,
  TData,
  TFormValues,
  AdminFormApi,
  AdminTableApi<TData, TFormValues>
>;
