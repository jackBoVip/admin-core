/**
 * Table Core API 实现。
 * @description 负责表格状态管理、挂载生命周期、执行器桥接与快照广播。
 */
import { ensureTableCoreSetup } from './config';
import { createDefaultTableOptions } from './constants/defaults';
import { deepEqual, isBoolean, isFunction, mergeWithArrayOverride } from './utils';
import { createStore } from '@admin-core/shared-core';
import type {
  AdminTableApi,
  AdminTableOptions,
  AdminTableSnapshot,
  TableExecutors,
  TableFormApiLike,
} from './types';

/**
 * 表格 API 挂载时的附加参数。
 */
export interface TableApiMountOptions {
  /** 执行器集合。 */
  executors?: TableExecutors;
  /** 表单 API。 */
  formApi?: null | TableFormApiLike;
}

/**
 * 表格 API 实现类。
 */
class AdminTableApiImpl<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> implements AdminTableApi<TData, TFormValues>
{
  /** 表格实例引用（如 VxeGrid/封装实例）。 */
  public grid: unknown = null;

  /** 关联查询表单 API。 */
  public formApi: null | TableFormApiLike = null;

  /** 当前可用的执行器集合。 */
  private executors: TableExecutors = {};

  /** 是否已挂载。 */
  private mounted = false;

  /** 最近一次查询参数快照。 */
  private latestQueryParams: null | Record<string, any> = null;

  /** 当前表格配置状态。 */
  private state: AdminTableOptions<TData, TFormValues>;

  /** 对外暴露的快照仓库。 */
  public store = createStore<AdminTableSnapshot<TData, TFormValues>>({
    latestQueryParams: null,
    mounted: false,
    props: createDefaultTableOptions<TData, TFormValues>(),
  });

  /**
   * 构造表格 API。
   * @param options 初始化表格配置。
   * @returns 无返回值。
   */
  constructor(options: AdminTableOptions<TData, TFormValues> = {}) {
    ensureTableCoreSetup();
    this.state = mergeWithArrayOverride(
      options,
      createDefaultTableOptions<TData, TFormValues>()
    );
    this.updateSnapshot(true);
  }

  /**
   * 获取当前配置状态。
   *
   * @returns 当前表格配置对象引用。
   */
  getState() {
    return this.state;
  }

  /**
   * 获取当前快照。
   *
   * @returns 当前表格快照对象。
   */
  getSnapshot() {
    return this.store.getState();
  }

  /**
   * 更新快照并按需去重广播。
   * @param force 是否强制更新快照。
   * @returns 无返回值。
   */
  private updateSnapshot(force = false) {
    const nextSnapshot: AdminTableSnapshot<TData, TFormValues> = {
      latestQueryParams: this.latestQueryParams,
      mounted: this.mounted,
      props: this.state,
    };

    if (force) {
      this.store.setState(nextSnapshot);
      return;
    }

    this.store.setState((prev) => {
      if (deepEqual(prev, nextSnapshot)) {
        return prev;
      }
      return nextSnapshot;
    });
  }

  /**
   * 标记挂载，并注入实例/执行器/表单 API。
   * @param instance 表格实例。
   * @param options 挂载附加参数。
   * @returns 无返回值。
   */
  mount(
    instance?: unknown,
    options?: TableApiMountOptions
  ) {
    this.grid = instance ?? this.grid;
    if (options?.executors) {
      this.executors = {
        ...this.executors,
        ...options.executors,
      };
    }
    if (options && 'formApi' in options) {
      this.formApi = options.formApi ?? null;
    }
    this.mounted = true;
    this.updateSnapshot();
  }

  /**
   * 更新执行器集合。
   * @param executors 执行器补丁。
   * @returns 无返回值。
   */
  setExecutors(executors: TableExecutors) {
    this.executors = {
      ...this.executors,
      ...executors,
    };
  }

  /**
   * 设置表单 API。
   * @param formApi 表单 API。
   * @returns 无返回值。
   */
  setFormApi(formApi: null | TableFormApiLike) {
    this.formApi = formApi;
  }

  /**
   * 触发查询。
   * @param params 查询参数。
   * @returns 查询结果。
   */
  async query(params: Record<string, any> = {}) {
    this.latestQueryParams = { ...params };
    this.updateSnapshot();
    if (!this.executors.query) {
      return undefined;
    }
    return await this.executors.query({
      mode: 'query',
      params: { ...params },
    });
  }

  /**
   * 触发刷新；优先使用 `reload` 执行器，不存在时回退到 `query`。
   * @param params 刷新参数。
   * @returns 刷新结果。
   */
  async reload(params: Record<string, any> = {}) {
    this.latestQueryParams = { ...params };
    this.updateSnapshot();
    if (this.executors.reload) {
      return await this.executors.reload({
        mode: 'reload',
        params: { ...params },
      });
    }
    if (this.executors.query) {
      return await this.executors.query({
        mode: 'reload',
        params: { ...params },
      });
    }
    return undefined;
  }

  /**
   * 合并设置 `gridOptions`。
   * @param options 表格配置补丁。
   * @returns 无返回值。
   */
  setGridOptions(options: Partial<AdminTableOptions<TData>['gridOptions']>) {
    this.setState({
      gridOptions: options,
    });
  }

  /**
   * 快速切换加载态。
   * @param loading 是否加载中。
   * @returns 无返回值。
   */
  setLoading(loading: boolean) {
    this.setState({
      gridOptions: {
        loading,
      },
    });
  }

  /**
   * 合并更新表格状态。
   * @param stateOrFn 状态补丁或补丁工厂。
   * @returns 无返回值。
   */
  setState(
    stateOrFn:
      | ((prev: AdminTableOptions<TData, TFormValues>) => Partial<AdminTableOptions<TData, TFormValues>>)
      | Partial<AdminTableOptions<TData, TFormValues>>
  ) {
    const patch = isFunction(stateOrFn) ? stateOrFn(this.state) : stateOrFn;
    const next = mergeWithArrayOverride(patch, this.state);
    if (deepEqual(next, this.state)) {
      return;
    }
    this.state = next;
    this.updateSnapshot();
  }

  /**
   * 切换查询表单显隐。
   * @param show 指定目标显隐；不传时取反。
   * @returns 切换后的显示状态。
   */
  toggleSearchForm(show?: boolean) {
    const current = this.state.showSearchForm ?? true;
    const next = isBoolean(show) ? show : !current;
    this.setState({
      showSearchForm: next,
    });
    return next;
  }

  /**
   * 标记卸载并清理运行时引用。
   *
   * @returns 无返回值。
   */
  unmount() {
    this.grid = null;
    this.formApi = null;
    this.executors = {};
    this.mounted = false;
    this.updateSnapshot();
  }
}

/**
 * 创建表格 API 实例。
 * @template TData 行数据类型。
 * @template TFormValues 查询表单值类型。
 * @param options 初始表格配置。
 * @returns 表格 API 实例。
 */
export function createTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(
  options: AdminTableOptions<TData, TFormValues> = {}
): AdminTableApi<TData, TFormValues> {
  return new AdminTableApiImpl(options);
}
