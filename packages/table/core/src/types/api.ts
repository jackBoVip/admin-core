/**
 * Table Core API 类型定义。
 * @description 定义表格快照、挂载参数与核心 API 接口能力。
 */
import type { StoreApi } from '@admin-core/shared-core';
import type {
  AdminTableOptions,
  TableExecutors,
  TableFormApiLike,
} from './table';

/**
 * 表格 API 运行时快照。
 * @description 记录表格配置、查询参数与挂载状态，供状态订阅与调试读取。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export interface AdminTableSnapshot<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  /** 最近一次查询参数。 */
  latestQueryParams: null | Record<string, any>;
  /** 当前是否已挂载。 */
  mounted: boolean;
  /** 当前表格配置。 */
  props: AdminTableOptions<TData, TFormValues>;
}

/**
 * 表格 API 挂载附加参数。
 * @description 用于在挂载阶段注入执行器与关联表单 API。
 */
export interface AdminTableApiMountOptions {
  /** 执行器集合。 */
  executors?: TableExecutors;
  /** 表单 API。 */
  formApi?: null | TableFormApiLike;
}

/**
 * 表格 API 抽象。
 * @description 提供表格查询、状态更新、执行器管理与表单联动的统一控制入口。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 */
export interface AdminTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  /** 关联表单 API。 */
  formApi: null | TableFormApiLike;
  /** 关联表格实例。 */
  grid: unknown;
  /** 订阅式状态仓库。 */
  store: StoreApi<AdminTableSnapshot<TData, TFormValues>>;
  /** 获取当前快照。 */
  getSnapshot(): AdminTableSnapshot<TData, TFormValues>;
  /** 获取当前配置状态。 */
  getState(): AdminTableOptions<TData, TFormValues>;
  /**
   * 绑定表格实例并标记挂载。
   * @param instance 表格实例。
   * @param options 可选挂载参数。
   * @returns 无返回值。
   */
  mount(
    instance?: unknown,
    options?: AdminTableApiMountOptions
  ): void;
  /**
   * 执行查询。
   * @param params 查询参数。
   * @returns 查询执行结果。
   */
  query(params?: Record<string, any>): Promise<any>;
  /**
   * 执行刷新。
   * @param params 刷新参数。
   * @returns 刷新执行结果。
   */
  reload(params?: Record<string, any>): Promise<any>;
  /**
   * 合并更新执行器集合。
   * @param executors 执行器补丁。
   * @returns 无返回值。
   */
  setExecutors(executors: TableExecutors): void;
  /**
   * 设置表单 API。
   * @param formApi 表单 API。
   * @returns 无返回值。
   */
  setFormApi(formApi: null | TableFormApiLike): void;
  /**
   * 合并设置表格 `gridOptions`。
   * @param options 配置补丁。
   * @returns 无返回值。
   */
  setGridOptions(options: Partial<AdminTableOptions<TData>['gridOptions']>): void;
  /**
   * 设置加载态。
   * @param loading 是否加载中。
   * @returns 无返回值。
   */
  setLoading(loading: boolean): void;
  /**
   * 合并更新表格状态。
   * @param stateOrFn 状态补丁或补丁工厂。
   * @returns 无返回值。
   */
  setState(
    stateOrFn:
      | ((prev: AdminTableOptions<TData, TFormValues>) => Partial<AdminTableOptions<TData, TFormValues>>)
      | Partial<AdminTableOptions<TData, TFormValues>>
  ): void;
  /**
   * 切换查询表单显示状态。
   * @param show 指定目标状态；不传时自动取反。
   * @returns 切换后的显示状态。
   */
  toggleSearchForm(show?: boolean): boolean;
  /** 标记卸载并清理运行时引用。 */
  unmount(): void;
}
