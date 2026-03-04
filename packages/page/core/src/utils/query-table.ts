/**
 * Page 查询表格工具函数集合。
 * @description 提供查询表单与表格 API 的配置标准化、工厂封装、懒初始化与资源清理能力。
 */

import type {
  NormalizedPageFormTableBridgeOptions,
  PageFormTableBridgeContext,
  PageQueryTableApi,
  PageQueryTableExecutor,
} from '../types';
import { resolveSearchFormDefaults } from '@admin-core/form-core';
import {
  PAGE_QUERY_FIXED_TABLE_CLASS,
  PAGE_QUERY_LAYOUT_FIXED_ICON,
  PAGE_QUERY_LAYOUT_FLOW_ICON,
  PAGE_QUERY_LAYOUT_SWITCH_DEFAULT_TITLES,
  PAGE_QUERY_LAYOUT_TOOL_CODE,
} from '../constants';
import {
  appendClassToken,
  removeClassToken,
} from './query-table-layout';

/** 查询表单最小配置形状。 */
type QueryFormLikeOptions = {
  /** 查询区栅格列数。 */
  gridColumns?: number;
  /** 是否启用查询模式。 */
  queryMode?: boolean;
  /** 查询字段 schema。 */
  schema?: unknown[];
};

/**
 * 配置来源类型。
 * @description 支持直接传递配置对象，或通过函数按需惰性返回配置。
 */
type OptionSource<TOptions> = TOptions | undefined | (() => TOptions | undefined);

/**
 * 延迟 API 持有方当前状态。
 * @description 标记 form/table API 的当前实例及其是否由 owner 创建并负责释放。
 */
type PageQueryTableLazyApiOwnerState<TFormApi, TTableApi> = {
  /** 当前表单 API 实例。 */
  formApi: null | TFormApi;
  /** 是否由当前 owner 创建并持有表单 API。 */
  ownsFormApi: boolean;
  /** 是否由当前 owner 创建并持有表格 API。 */
  ownsTableApi: boolean;
  /** 当前表格 API 实例。 */
  tableApi: null | TTableApi;
};

/**
 * 查询表格斑马纹默认配置。
 * @description 默认启用斑马纹，且不跟随主题自动切换。
 */
export const DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS = {
  enabled: true,
  followTheme: false,
} as const;

/**
 * 查询表格工具栏默认开关配置。
 * @description 默认开启列自定义、刷新与缩放入口。
 */
export const DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS = {
  custom: true,
  refresh: true,
  zoom: true,
} as const;

/**
 * 查询表格分页默认配置。
 * @description 默认允许分页导出能力配置。
 */
export const DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS = {
  exportConfig: true,
} as const;

/** 查询表格默认固定布局开关（默认启用固定高度）。 */
export const DEFAULT_PAGE_QUERY_TABLE_FIXED = true;

/**
 * 解析查询表格是否固定高度模式。
 * @description 未显式指定时回退到全局默认开关。
 * @param fixed 外部配置值。
 * @returns 是否启用固定高度模式。
 */
export function resolvePageQueryTableFixed(fixed: null | undefined | boolean) {
  return fixed ?? DEFAULT_PAGE_QUERY_TABLE_FIXED;
}

/**
 * 解析表格高度配置，仅接受正数像素值。
 * @param height 高度配置。
 * @returns 标准化后的高度像素值；无效时返回 `null`。
 */
export function resolvePageQueryTableHeight(height: unknown) {
  if (typeof height === 'number') {
    return Number.isFinite(height) && height > 0
      ? Math.max(1, Math.floor(height))
      : null;
  }
  if (typeof height !== 'string') {
    return null;
  }
  const text = height.trim();
  if (!text) {
    return null;
  }
  if (!/^[+]?\d+(\.\d+)?(px)?$/i.test(text)) {
    return null;
  }
  const parsed = Number.parseFloat(text);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return Math.max(1, Math.floor(parsed));
}

/** 固定模式下表格高度计算参数。 */
export interface ResolvePageQueryTableFixedHeightOptions {
  /** 表格容器距离视口顶部的像素值。 */
  elementTop: number;
  /** 最小高度。 */
  minHeight?: number;
  /** 需要预留的底部空间。 */
  reserve?: number;
  /** 当前视口高度。 */
  viewportHeight: number;
}

/**
 * 根据视口与元素位置计算固定模式下表格高度。
 * @param options 计算参数。
 * @returns 计算后的表格高度。
 */
export function resolvePageQueryTableFixedHeight(
  options: ResolvePageQueryTableFixedHeightOptions
) {
  const viewportHeight = Number(options.viewportHeight);
  const elementTop = Number(options.elementTop);
  const reserve = Number(options.reserve ?? 0);
  const minHeight = Number(options.minHeight ?? 0);

  if (!Number.isFinite(viewportHeight) || !Number.isFinite(elementTop)) {
    return 0;
  }

  const safeReserve = Number.isFinite(reserve) ? reserve : 0;
  const safeMinHeight = Number.isFinite(minHeight) ? Math.max(0, minHeight) : 0;
  const next = viewportHeight - elementTop - safeReserve;
  return Math.max(safeMinHeight, next, 0);
}

/**
 * 判断输入是否为普通对象记录。
 * @param value 待判断值。
 * @returns 是否为对象记录。
 */
function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/** 具备 `unmount` 能力的对象形状。 */
type UnmountableLike = {
  /** 释放资源。 */
  unmount?: () => void;
};

/**
 * 解析查询表单配置并套用搜索表单默认值策略。
 * @param options 原始表单配置。
 * @param resolveSearchDefaults 默认值解析器。
 * @returns 标准化并补齐默认值后的表单配置。
 */
export function resolvePageQuerySearchFormOptions<
  TOptions extends QueryFormLikeOptions & Record<string, unknown>,
>(
  options: TOptions | undefined,
  resolveSearchDefaults: (options: TOptions) => TOptions
) {
  const source = resolvePageQueryFormDefaults(
    (options ?? {}) as TOptions & Record<string, unknown>
  );

  return resolveSearchDefaults({
    ...source,
  } as TOptions);
}

/**
 * 标准化查询表单配置。
 * @param options 原始配置。
 * @returns 标准化后的查询表单配置。
 */
export function normalizePageQueryFormOptions<
  TOptions extends QueryFormLikeOptions & Record<string, unknown>,
>(options: TOptions | undefined) {
  return resolvePageQuerySearchFormOptions(
    (options ?? {}) as TOptions & Record<string, unknown>,
    (resolved) =>
      resolveSearchFormDefaults(
        resolved as Record<string, unknown>
      ) as TOptions & Record<string, unknown>
  ) as TOptions;
}

/**
 * 创建查询表格配置解析器集合。
 * @param options 解析器依赖。
 * @returns 配置解析器集合。
 */
export interface CreatePageQueryTableOptionResolversOptions<
  TFormOptions extends Record<string, unknown>,
  TStripe,
  TStripeDefaults extends Record<string, unknown>,
> {
  /** 标准化表单配置。 */
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  /** 解析斑马纹配置。 */
  resolveStripeConfig: (stripe: TStripe, defaults: TStripeDefaults) => unknown;
}

/**
 * 创建查询表格配置解析器集合。
 * @param options 解析器依赖。
 * @returns 统一封装后的表单与斑马纹配置解析器。
 */
export function createPageQueryTableOptionResolvers<
  TFormOptions extends Record<string, unknown>,
  TStripe,
  TStripeDefaults extends Record<string, unknown>,
>(
  options: CreatePageQueryTableOptionResolversOptions<
    TFormOptions,
    TStripe,
    TStripeDefaults
  >
) {
  return {
    normalizeFormOptions: (formOptions: TFormOptions | undefined) =>
      options.normalizeFormOptions((formOptions ?? {}) as TFormOptions),
    resolveStripeConfig: (stripe: unknown, stripeDefaults: Record<string, unknown>) =>
      options.resolveStripeConfig(
        stripe as TStripe,
        stripeDefaults as TStripeDefaults
      ),
  };
}

/**
 * 解析查询表单默认配置。
 * @param options 原始配置。
 * @returns 补齐默认值后的表单配置。
 */
export function resolvePageQueryFormDefaults<
  TOptions extends QueryFormLikeOptions & Record<string, unknown>,
>(options: TOptions | undefined) {
  const source = (options ?? {}) as TOptions;
  const schemaCount = Array.isArray(source.schema) ? source.schema.length : 0;
  const autoGridColumns = source.gridColumns ?? (schemaCount <= 1 ? 2 : 3);

  return {
    ...source,
    gridColumns: autoGridColumns,
    queryMode: source.queryMode ?? true,
  } as TOptions;
}

/**
 * 创建 Page 查询表格组合 API。
 * @param formApi 表单 API。
 * @param tableApi 表格 API。
 * @returns 组合后的查询表格 API。
 */
export function createPageQueryTableApi<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
>(
  formApi: TFormApi,
  tableApi: TTableApi
): PageQueryTableApi<TFormApi, TTableApi> {
  return {
    formApi,
    query: (params?: Record<string, unknown>) => tableApi.query(params),
    reload: (params?: Record<string, unknown>) => tableApi.reload(params),
    tableApi,
  };
}

/**
 * 将配置源统一转换为 getter。
 * @param source 配置源。
 * @returns 读取配置的统一 getter。
 */
function resolveOptionSourceGetter<TOptions>(source: OptionSource<TOptions>) {
  if (typeof source === 'function') {
    return source as () => TOptions | undefined;
  }
  return () => source;
}

/**
 * 页面查询表格 API 工厂创建参数。
 * @description 定义 form/table API 的创建与配置归一化策略。
 */
export interface CreatePageQueryTableApiFactoriesWithOptionsOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions = Record<string, unknown>,
  TTableOptions = Record<string, unknown>,
> {
  /** 创建表单 API。 */
  createFormApi: (options: TFormOptions) => TFormApi;
  /** 创建表格 API。 */
  createTableApi: (options: TTableOptions) => TTableApi;
  /** 表单配置来源。 */
  formOptions: OptionSource<TFormOptions>;
  /** 标准化表单配置。 */
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  /** 标准化表格配置。 */
  normalizeTableOptions: (options: TTableOptions | undefined) => TTableOptions;
  /** 表格配置来源。 */
  tableOptions: OptionSource<TTableOptions>;
}

/**
 * 基于表单/表格配置来源创建 API 工厂。
 * @param options 工厂与标准化配置。
 * @returns 延迟读取配置并创建 API 的工厂集合。
 */
export function createPageQueryTableApiFactoriesWithOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions = Record<string, unknown>,
  TTableOptions = Record<string, unknown>,
>(
  options: CreatePageQueryTableApiFactoriesWithOptionsOptions<
    TFormApi,
    TTableApi,
    TFormOptions,
    TTableOptions
  >
) {
  const readFormOptions = resolveOptionSourceGetter(options.formOptions);
  const readTableOptions = resolveOptionSourceGetter(options.tableOptions);

  return {
    /**
     * 创建并返回标准化后的表单 API。
     * @returns 标准化后的表单 API 实例。
     */
    createFormApi: () =>
      options.createFormApi(
        options.normalizeFormOptions(readFormOptions())
      ),
    /**
     * 创建并返回标准化后的表格 API。
     * @returns 标准化后的表格 API 实例。
     */
    createTableApi: () =>
      options.createTableApi(
        options.normalizeTableOptions(readTableOptions())
      ),
  };
}

/**
 * 创建带斑马纹默认值能力的 API 工厂参数。
 * @description 在基础工厂参数上增加斑马纹配置解析与默认值注入能力。
 */
export interface CreatePageQueryTableApiFactoriesWithStripeDefaultsOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 创建表单 API。 */
  createFormApi: (options: TFormOptions) => TFormApi;
  /** 创建表格 API。 */
  createTableApi: (options: TTableOptions) => TTableApi;
  /** 表单配置来源。 */
  formOptions: OptionSource<TFormOptions>;
  /** 标准化表单配置。 */
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  /** 解析斑马纹配置。 */
  resolveStripeConfig: (value: unknown, defaults: TStripeDefaults) => unknown;
  /** 斑马纹默认配置。 */
  stripeDefaults: TStripeDefaults;
  /** 表格配置来源。 */
  tableOptions: OptionSource<TTableOptions>;
}

/**
 * 创建带斑马纹默认值能力的 API 工厂。
 * @param options 工厂与斑马纹解析依赖。
 * @returns 带斑马纹默认值处理能力的 API 工厂集合。
 */
export function createPageQueryTableApiFactoriesWithStripeDefaults<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreatePageQueryTableApiFactoriesWithStripeDefaultsOptions<
    TFormApi,
    TTableApi,
    TFormOptions,
    TTableOptions,
    TStripeDefaults
  >
) {
  return createPageQueryTableApiFactoriesWithOptions({
    createFormApi: options.createFormApi,
    createTableApi: options.createTableApi,
    formOptions: options.formOptions,
    normalizeFormOptions: options.normalizeFormOptions,
    normalizeTableOptions: (tableOptions) =>
      resolvePageQueryTableOptionsWithStripeDefaults(
        tableOptions,
        options.resolveStripeConfig,
        options.stripeDefaults
      ) as TTableOptions,
    tableOptions: options.tableOptions,
  });
}

/**
 * 创建带斑马纹默认值能力的 Lazy API owner 参数。
 * @description 组合 API 工厂参数与 Lazy owner 生命周期策略。
 */
export interface CreatePageQueryTableLazyApiOwnerWithStripeDefaultsOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
> extends CreatePageQueryTableApiFactoriesWithStripeDefaultsOptions<
    TFormApi,
    TTableApi,
    TFormOptions,
    TTableOptions,
    TStripeDefaults
  > {}

/**
 * 创建带斑马纹默认值能力的 Lazy API owner。
 * @param options owner 创建参数。
 * @returns Lazy API owner。
 */
export function createPageQueryTableLazyApiOwnerWithStripeDefaults<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
>(
  options: CreatePageQueryTableLazyApiOwnerWithStripeDefaultsOptions<
    TFormApi,
    TTableApi,
    TFormOptions,
    TTableOptions,
    TStripeDefaults
  >
) {
  const factories = createPageQueryTableApiFactoriesWithStripeDefaults({
    createFormApi: options.createFormApi,
    createTableApi: options.createTableApi,
    formOptions: options.formOptions,
    normalizeFormOptions: options.normalizeFormOptions,
    resolveStripeConfig: options.resolveStripeConfig,
    stripeDefaults: options.stripeDefaults,
    tableOptions: options.tableOptions,
  });

  return createPageQueryTableLazyApiOwner({
    createFormApi: factories.createFormApi,
    createTableApi: factories.createTableApi,
  });
}

/**
 * 创建懒加载 API owner（按需初始化 form/table API）。
 * @param options API 创建器。
 * @returns Lazy API owner 能力对象。
 */
export interface CreatePageQueryTableLazyApiOwnerOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
> {
  /** 创建表单 API。 */
  createFormApi: () => TFormApi;
  /** 创建表格 API。 */
  createTableApi: () => TTableApi;
}

/**
 * 懒加载 API owner。
 * @description 按需创建并缓存 form/table API，并记录实例所有权。
 */
export interface PageQueryTableLazyApiOwner<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
> {
  /** 获取或创建表单 API。 */
  ensureFormApi: () => TFormApi;
  /** 获取或创建表格 API。 */
  ensureTableApi: () => TTableApi;
  /** 读取当前 owner 持有状态。 */
  getOwnedState: () => PageQueryTableLazyApiOwnerState<TFormApi, TTableApi>;
}

/**
 * 创建懒加载 API owner（按需初始化 form/table API）。
 * @param options API 创建器。
 * @returns Lazy API owner 能力对象。
 */
export function createPageQueryTableLazyApiOwner<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
>(
  options: CreatePageQueryTableLazyApiOwnerOptions<TFormApi, TTableApi>
): PageQueryTableLazyApiOwner<TFormApi, TTableApi> {
  let internalFormApi: null | TFormApi = null;
  let internalTableApi: null | TTableApi = null;
  let ownsInternalFormApi = false;
  let ownsInternalTableApi = false;

  return {
    /**
     * 获取或创建表单 API。
     * @returns 表单 API 实例。
     */
    ensureFormApi: () => {
      if (!internalFormApi) {
        internalFormApi = options.createFormApi();
        ownsInternalFormApi = true;
      }
      return internalFormApi;
    },
    /**
     * 获取或创建表格 API。
     * @returns 表格 API 实例。
     */
    ensureTableApi: () => {
      if (!internalTableApi) {
        internalTableApi = options.createTableApi();
        ownsInternalTableApi = true;
      }
      return internalTableApi;
    },
    /**
     * 读取当前 owner 的资源持有状态。
     * @returns 当前持有状态快照。
     */
    getOwnedState: (): PageQueryTableLazyApiOwnerState<TFormApi, TTableApi> => ({
      formApi: internalFormApi,
      ownsFormApi: ownsInternalFormApi,
      ownsTableApi: ownsInternalTableApi,
      tableApi: internalTableApi,
    }),
  };
}

/**
 * 解析查询表格 API 组合包（支持外部注入与内部创建混合）。
 * @param options 解析参数。
 * @returns API 组合包与注入来源信息。
 */
export interface ResolvePageQueryTableApiBundleOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TApi extends PageQueryTableApi<TFormApi, TTableApi> = PageQueryTableApi<
    TFormApi,
    TTableApi
  >,
> {
  /** 外部注入的组合 API。 */
  api?: TApi;
  /** 自定义组合 API 创建器。 */
  createApi?: (formApi: TFormApi, tableApi: TTableApi) => TApi;
  /** 创建表单 API。 */
  createFormApi: () => TFormApi;
  /** 创建表格 API。 */
  createTableApi: () => TTableApi;
  /** 外部注入表单 API。 */
  formApi?: TFormApi;
  /** 外部注入表格 API。 */
  tableApi?: TTableApi;
}

/**
 * 查询表格 API 组合包。
 * @description 汇总最终 form/table/api 实例，并保留外部注入实例引用用于调试和资源管理。
 */
export interface PageQueryTableApiBundle<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TApi extends PageQueryTableApi<TFormApi, TTableApi> = PageQueryTableApi<
    TFormApi,
    TTableApi
  >,
> {
  /** 最终组合 API。 */
  api: TApi;
  /** 最终表单 API。 */
  formApi: TFormApi;
  /** 外部注入表单 API（若有）。 */
  providedFormApi?: TFormApi;
  /** 外部注入表格 API（若有）。 */
  providedTableApi?: TTableApi;
  /** 最终表格 API。 */
  tableApi: TTableApi;
}

/**
 * 解析查询表格 API 组合包（支持外部注入与内部创建混合）。
 * @param options 解析参数。
 * @returns API 组合包与注入来源信息。
 */
export function resolvePageQueryTableApiBundle<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TApi extends PageQueryTableApi<TFormApi, TTableApi> = PageQueryTableApi<
    TFormApi,
    TTableApi
  >,
>(
  options: ResolvePageQueryTableApiBundleOptions<TFormApi, TTableApi, TApi>
): PageQueryTableApiBundle<TFormApi, TTableApi, TApi> {
  const providedFormApi = options.formApi ?? options.api?.formApi;
  const providedTableApi = options.tableApi ?? options.api?.tableApi;
  const formApi = providedFormApi ?? options.createFormApi();
  const tableApi = providedTableApi ?? options.createTableApi();
  const api =
    options.api
    ?? (options.createApi
      ? options.createApi(formApi, tableApi)
      : (createPageQueryTableApi(formApi, tableApi) as TApi));

  return {
    api,
    formApi,
    providedFormApi,
    providedTableApi,
    tableApi,
  };
}

/**
 * 解析带斑马纹默认值能力的查询表格 API 组合包。
 * @param options 解析参数。
 * @returns API 组合包与注入来源信息。
 */
export interface ResolvePageQueryTableApiBundleWithStripeDefaultsOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TApi extends PageQueryTableApi<TFormApi, TTableApi> = PageQueryTableApi<
    TFormApi,
    TTableApi
  >,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 外部注入的组合 API。 */
  api?: TApi;
  /** 自定义组合 API 创建器。 */
  createApi?: (formApi: TFormApi, tableApi: TTableApi) => TApi;
  /** 创建表单 API。 */
  createFormApi: (options: TFormOptions) => TFormApi;
  /** 创建表格 API。 */
  createTableApi: (options: TTableOptions) => TTableApi;
  /** 外部注入表单 API。 */
  formApi?: TFormApi;
  /** 表单配置来源。 */
  formOptions: OptionSource<TFormOptions>;
  /** 标准化表单配置。 */
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  /** 解析斑马纹配置。 */
  resolveStripeConfig: (value: unknown, defaults: TStripeDefaults) => unknown;
  /** 斑马纹默认配置。 */
  stripeDefaults: TStripeDefaults;
  /** 外部注入表格 API。 */
  tableApi?: TTableApi;
  /** 表格配置来源。 */
  tableOptions: OptionSource<TTableOptions>;
}

/**
 * 解析带斑马纹默认值能力的查询表格 API 组合包。
 * @param options 解析参数。
 * @returns API 组合包与注入来源信息。
 */
export function resolvePageQueryTableApiBundleWithStripeDefaults<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TApi extends PageQueryTableApi<TFormApi, TTableApi> = PageQueryTableApi<
    TFormApi,
    TTableApi
  >,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
>(
  options: ResolvePageQueryTableApiBundleWithStripeDefaultsOptions<
    TFormApi,
    TTableApi,
    TApi,
    TFormOptions,
    TTableOptions,
    TStripeDefaults
  >
) {
  const factories = createPageQueryTableApiFactoriesWithStripeDefaults({
    createFormApi: options.createFormApi,
    createTableApi: options.createTableApi,
    formOptions: options.formOptions,
    normalizeFormOptions: options.normalizeFormOptions,
    resolveStripeConfig: options.resolveStripeConfig,
    stripeDefaults: options.stripeDefaults,
    tableOptions: options.tableOptions,
  });

  return resolvePageQueryTableApiBundle({
    api: options.api,
    createApi: options.createApi,
    createFormApi: factories.createFormApi,
    createTableApi: factories.createTableApi,
    formApi: options.formApi,
    tableApi: options.tableApi,
  });
}

/**
 * 接口资源清理参数。
 * @description 描述 cleanup 阶段可选的 API 实例以及所有权标记。
 */
export interface CleanupPageQueryTableApisOptions {
  /** 表单 API。 */
  formApi?: null | UnmountableLike;
  /** 是否持有表单 API。 */
  ownsFormApi?: boolean;
  /** 是否持有表格 API。 */
  ownsTableApi?: boolean;
  /** 表格 API。 */
  tableApi?: null | UnmountableLike;
}

/**
 * 清理由当前生命周期创建并持有的 API 资源。
 * @param options 清理参数。
 * @returns 无返回值。
 */
export function cleanupPageQueryTableApis(options: CleanupPageQueryTableApisOptions) {
  if (options.ownsFormApi && options.formApi?.unmount) {
    options.formApi.unmount();
  }
  if (options.ownsTableApi && options.tableApi?.unmount) {
    options.tableApi.unmount();
  }
}

/**
 * 解析查询表格基础配置并补齐工具栏/分页默认值。
 * @param options 原始表格配置。
 * @param resolveStripe 斑马纹配置解析器。
 * @returns 补齐默认项后的查询表格配置。
 */
export function resolvePageQueryTableOptions<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  options: TOptions | undefined,
  resolveStripe: (value: unknown) => unknown
) {
  const source = (options ?? {}) as TOptions & {
    /** 表格配置对象。 */
    gridOptions?: Record<string, unknown>;
  };
  const sourceGridOptions = isObjectRecord(source.gridOptions)
    ? source.gridOptions
    : {};
  const sourceToolbarConfig = isObjectRecord(sourceGridOptions.toolbarConfig)
    ? sourceGridOptions.toolbarConfig
    : {};
  const sourcePagerConfig = isObjectRecord(sourceGridOptions.pagerConfig)
    ? sourceGridOptions.pagerConfig
    : {};

  return {
    ...source,
    gridOptions: {
      ...sourceGridOptions,
      pagerConfig: {
        ...sourcePagerConfig,
        autoHidden:
          sourcePagerConfig.autoHidden
          ?? false,
        exportConfig:
          sourcePagerConfig.exportConfig
          ?? DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS.exportConfig,
      },
      stripe: resolveStripe(sourceGridOptions.stripe),
      toolbarConfig: {
        ...sourceToolbarConfig,
        custom:
          sourceToolbarConfig.custom
          ?? DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS.custom,
        refresh:
          sourceToolbarConfig.refresh
          ?? DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS.refresh,
        zoom:
          sourceToolbarConfig.zoom
          ?? DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS.zoom,
      },
    },
    showSearchForm: false,
  };
}

/**
 * 解析查询表格配置，并在解析斑马纹时注入默认值。
 * @param options 原始配置。
 * @param resolveStripeConfig 斑马纹解析器。
 * @param stripeDefaults 斑马纹默认配置。
 * @returns 注入斑马纹默认值后的查询表格配置。
 */
export function resolvePageQueryTableOptionsWithStripeDefaults<
  TOptions extends Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown>,
>(
  options: TOptions | undefined,
  resolveStripeConfig: (
    value: unknown,
    defaults: TStripeDefaults
  ) => unknown,
  stripeDefaults: TStripeDefaults
) {
  return resolvePageQueryTableOptions(options, (value) =>
    resolveStripeConfig(value, stripeDefaults)
  );
}

/** 带斑马纹默认值的展示层查询表格配置解析参数。 */
export interface ResolvePageQueryTableDisplayOptionsWithStripeDefaultsOptions<
  TOptions extends Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown>,
> {
  /** 显式表格高度。 */
  explicitTableHeight: null | number;
  /** 是否固定高度模式。 */
  fixedMode: boolean;
  /** 固定模式下计算出的表格高度。 */
  fixedTableHeight: null | number;
  /** 切换到固定模式的提示文案。 */
  layoutModeTitleToFixed: string;
  /** 切换到流式模式的提示文案。 */
  layoutModeTitleToFlow: string;
  /** 布局模式切换回调。 */
  onLayoutModeToggle: () => void;
  /** 斑马纹解析器。 */
  resolveStripeConfig: (value: unknown, defaults: TStripeDefaults) => unknown;
  /** 斑马纹默认配置。 */
  stripeDefaults: TStripeDefaults;
  /** 原始表格配置。 */
  tableOptions: TOptions | undefined;
}

/**
 * 解析带斑马纹默认值的展示层查询表格配置。
 * @param options 解析参数。
 * @returns 展示层查询表格配置。
 */
export function resolvePageQueryTableDisplayOptionsWithStripeDefaults<
  TOptions extends Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown>,
>(
  options: ResolvePageQueryTableDisplayOptionsWithStripeDefaultsOptions<
    TOptions,
    TStripeDefaults
  >
) {
  const resolvedOptions = resolvePageQueryTableOptionsWithStripeDefaults(
    options.tableOptions,
    options.resolveStripeConfig,
    options.stripeDefaults
  ) as TOptions;

  return resolvePageQueryTableDisplayOptions({
    explicitTableHeight: options.explicitTableHeight,
    fixedMode: options.fixedMode,
    fixedTableHeight: options.fixedTableHeight,
    layoutModeTitleToFixed: options.layoutModeTitleToFixed,
    layoutModeTitleToFlow: options.layoutModeTitleToFlow,
    onLayoutModeToggle: options.onLayoutModeToggle,
    resolvedOptions,
  });
}

/** 布局模式切换文案解析参数。 */
export interface ResolvePageQueryTableLayoutModeTitlesOptions {
  /** 基础语言文本。 */
  localeText?: Record<string, unknown> | null | undefined;
  /** 优先级更高的语言文本。 */
  preferredLocaleText?: Record<string, unknown> | null | undefined;
}

/** 布局模式切换文案。 */
export interface PageQueryTableLayoutModeTitles {
  /** 切换到固定模式的文案。 */
  layoutModeTitleToFixed: string;
  /** 切换到流式模式的文案。 */
  layoutModeTitleToFlow: string;
}

/**
 * 解析布局模式切换按钮文案。
 * @param options 语言文本来源。
 * @returns 切换文案集合。
 */
export function resolvePageQueryTableLayoutModeTitles(
  options?: ResolvePageQueryTableLayoutModeTitlesOptions
): PageQueryTableLayoutModeTitles {
  const localeText =
    (options?.localeText ?? {}) as Record<string, unknown>;
  const preferredLocaleText =
    (options?.preferredLocaleText ?? {}) as Record<string, unknown>;

  return {
    layoutModeTitleToFixed:
      (preferredLocaleText.queryTableSwitchToFixed as string | undefined)
      ?? (localeText.queryTableSwitchToFixed as string | undefined)
      ?? PAGE_QUERY_LAYOUT_SWITCH_DEFAULT_TITLES.toFixed,
    layoutModeTitleToFlow:
      (preferredLocaleText.queryTableSwitchToFlow as string | undefined)
      ?? (localeText.queryTableSwitchToFlow as string | undefined)
      ?? PAGE_QUERY_LAYOUT_SWITCH_DEFAULT_TITLES.toFlow,
  };
}

/** 展示层查询表格配置解析参数。 */
export interface ResolvePageQueryTableDisplayOptionsOptions<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 显式表格高度。 */
  explicitTableHeight: null | number;
  /** 是否固定高度模式。 */
  fixedMode: boolean;
  /** 固定模式下计算出的表格高度。 */
  fixedTableHeight: null | number;
  /** 切换到固定模式的提示文案。 */
  layoutModeTitleToFixed: string;
  /** 切换到流式模式的提示文案。 */
  layoutModeTitleToFlow: string;
  /** 布局模式切换回调。 */
  onLayoutModeToggle: () => void;
  /** 已解析过基础默认值的配置。 */
  resolvedOptions: TOptions;
}

/**
 * 基于运行态信息解析最终展示用查询表格配置。
 * @param options 展示层参数。
 * @returns 最终展示用查询表格配置。
 */
export function resolvePageQueryTableDisplayOptions<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  options: ResolvePageQueryTableDisplayOptionsOptions<TOptions>
) {
  const source = options.resolvedOptions as TOptions & {
    /** 容器 class。 */
    class?: unknown;
    /** 表格配置对象。 */
    gridOptions?: Record<string, unknown>;
  };
  const sourceGridOptions = isObjectRecord(source.gridOptions)
    ? source.gridOptions
    : {};
  const sourceToolbarConfig = isObjectRecord(sourceGridOptions.toolbarConfig)
    ? sourceGridOptions.toolbarConfig
    : {};
  const sourceToolbarTools = Array.isArray(sourceToolbarConfig.tools)
    ? sourceToolbarConfig.tools
    : [];
  const mergedToolbarTools = sourceToolbarTools.filter((tool) => {
    return (tool as Record<string, unknown>)?.code !== PAGE_QUERY_LAYOUT_TOOL_CODE;
  });

  if (options.explicitTableHeight === null) {
    mergedToolbarTools.push({
      code: PAGE_QUERY_LAYOUT_TOOL_CODE,
      icon: options.fixedMode
        ? PAGE_QUERY_LAYOUT_FIXED_ICON
        : PAGE_QUERY_LAYOUT_FLOW_ICON,
      iconOnly: true,
      onClick: options.onLayoutModeToggle,
      title: options.fixedMode
        ? options.layoutModeTitleToFlow
        : options.layoutModeTitleToFixed,
    });
  }

  const nextGridOptions = {
    ...sourceGridOptions,
    toolbarConfig: {
      ...sourceToolbarConfig,
      tools: mergedToolbarTools,
    },
  };

  if (!options.fixedMode) {
    const nextFlowGridOptions = {
      ...nextGridOptions,
      height: options.explicitTableHeight ?? null,
      maxHeight: null,
    };
    return {
      ...source,
      class: removeClassToken(
        source.class,
        PAGE_QUERY_FIXED_TABLE_CLASS
      ),
      gridOptions: nextFlowGridOptions,
    } as TOptions;
  }

  return {
    ...source,
    class: appendClassToken(
      source.class,
      PAGE_QUERY_FIXED_TABLE_CLASS
    ),
    gridOptions: {
      ...nextGridOptions,
      height:
        typeof options.fixedTableHeight === 'number'
        && Number.isFinite(options.fixedTableHeight)
        && options.fixedTableHeight > 0
          ? Math.max(1, Math.floor(options.fixedTableHeight))
          : '100%',
      maxHeight: null,
    },
  } as TOptions;
}

/** 查询表单处理器上下文。 */
type FormHandlerContext = {
  /** 外部触发信号。 */
  signal: unknown;
  /** 触发版本号。 */
  version: number;
};

/** 查询表单提交/重置处理器类型。 */
type FormHandler<TValues extends Record<string, unknown>, TContext> = (
  values: TValues,
  context?: TContext
) => Promise<void> | void;

/** 查询表单与表格桥接处理器创建参数。 */
export interface CreatePageQueryBridgeHandlersOptions<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TContext = FormHandlerContext,
> {
  /** 桥接配置。 */
  bridge: NormalizedPageFormTableBridgeOptions<TValues, TFormApi, TTableApi>;
  /** 表单 API。 */
  formApi: TFormApi;
  /** 重置事件回调。 */
  onReset?: FormHandler<TValues, TContext>;
  /** 提交事件回调。 */
  onSubmit?: FormHandler<TValues, TContext>;
  /** 表格 API。 */
  tableApi: TTableApi;
}

/** 查询表单与表格桥接处理器集合。 */
export interface PageQueryBridgeHandlers<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TContext = FormHandlerContext,
> {
  /** 表单重置处理器。 */
  handleReset: (values: TValues, context?: TContext) => Promise<void>;
  /** 表单提交处理器。 */
  handleSubmit: (values: TValues, context?: TContext) => Promise<void>;
}

/**
 * 创建查询表单与表格联动桥接处理器。
 * @param options 桥接依赖。
 * @returns 桥接处理器集合。
 */
export function createPageQueryBridgeHandlers<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TContext = FormHandlerContext,
>(
  options: CreatePageQueryBridgeHandlersOptions<TValues, TFormApi, TTableApi, TContext>
): PageQueryBridgeHandlers<TValues, TContext> {
  /**
   * 执行桥接动作。
   * @description 先调用原始处理器，再按桥接配置触发表格查询或刷新。
   * @param action 触发动作类型。
   * @param values 当前表单值。
   * @param context 处理上下文。
   * @returns 无返回值。
   */
  const runAction = async (
    action: 'reset' | 'submit',
    values: TValues,
    context: undefined | TContext
  ) => {
    const sourceHandler =
      action === 'submit' ? options.onSubmit : options.onReset;
    await sourceHandler?.(values, context);

    const isEnabled =
      options.bridge.enabled
      && (action === 'submit'
        ? options.bridge.queryOnSubmit
        : options.bridge.reloadOnReset);
    if (!isEnabled) {
      return;
    }

    const bridgeContext: PageFormTableBridgeContext<TFormApi, TTableApi> = {
      action,
      formApi: options.formApi,
      tableApi: options.tableApi,
    };
    const mappedValues = options.bridge.mapParams
      ? await options.bridge.mapParams(values, bridgeContext)
      : values;

    if (action === 'submit') {
      await options.tableApi.query(mappedValues ?? values);
    } else {
      await options.tableApi.reload(mappedValues ?? values);
    }
  };

  return {
    /**
     * 表单重置处理器。
     * @param values 当前表单值。
     * @param context 可选上下文。
     * @returns 重置流程结束后的 Promise。
     */
    handleReset: (values: TValues, context?: TContext) =>
      runAction('reset', values, context),
    /**
     * 表单提交处理器。
     * @param values 当前表单值。
     * @param context 可选上下文。
     * @returns 提交流程结束后的 Promise。
     */
    handleSubmit: (values: TValues, context?: TContext) =>
      runAction('submit', values, context),
  };
}

/** 注入桥接处理后的查询表单配置解析参数。 */
export interface ResolvePageQueryFormOptionsWithBridgeOptions<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
> {
  /** 桥接配置。 */
  bridge: NormalizedPageFormTableBridgeOptions<TValues, TFormApi, TTableApi>;
  /** 表单 API。 */
  formApi: TFormApi;
  /** 原始表单配置。 */
  formOptions: TOptions | undefined;
  /** 标准化表单配置。 */
  normalizeFormOptions: (options: TOptions | undefined) => TOptions;
  /** 表格 API。 */
  tableApi: TTableApi;
}

/**
 * 解析并注入表单-表格桥接后的查询表单配置。
 * @param options 解析参数。
 * @returns 注入桥接处理器后的表单配置。
 */
export function resolvePageQueryFormOptionsWithBridge<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  options: ResolvePageQueryFormOptionsWithBridgeOptions<
    TValues,
    TFormApi,
    TTableApi,
    TOptions
  >
) {
  const source = (options.formOptions ?? {}) as TOptions & {
    /** 原始重置处理器。 */
    handleReset?: FormHandler<TValues, unknown>;
    /** 原始提交处理器。 */
    handleSubmit?: FormHandler<TValues, unknown>;
  };
  const normalizedSource = options.normalizeFormOptions(source);
  const handlers = createPageQueryBridgeHandlers({
    bridge: options.bridge,
    formApi: options.formApi,
    onReset: source.handleReset,
    onSubmit: source.handleSubmit,
    tableApi: options.tableApi,
  });

  return {
    ...normalizedSource,
    handleReset: handlers.handleReset,
    handleSubmit: handlers.handleSubmit,
  } as TOptions;
}
