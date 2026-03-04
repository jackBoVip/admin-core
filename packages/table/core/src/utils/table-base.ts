/**
 * Table Core 基础配置工具。
 * @description 提供基础 props 解析、斑马纹配置与容器样式类名处理能力。
 */
import type {
  AdminTableOptions,
  SeparatorOptions,
  TableStripeConfig,
} from '../types';
import { deepEqual } from './deep';
import { isTableNonEmptyString } from './table-permission';

/**
 * 斑马纹配置的标准化结果。
 */
export interface ResolvedTableStripeConfig {
  /** 是否启用斑马纹。 */
  enabled: boolean;
  /** 斑马纹颜色是否跟随主题主色。 */
  followTheme: boolean;
}

/**
 * 斑马纹展示层配置。
 */
export interface ResolvedTableStripePresentation
  extends ResolvedTableStripeConfig {
  /** 斑马纹对应的容器类名。未启用时为空字符串。 */
  className: '' | 'admin-table--stripe-neutral' | 'admin-table--stripe-theme';
}

/**
 * 表格主题 CSS 变量来源。
 */
export interface TableThemeCssVarSource {
  /** 主题主色。 */
  colorPrimary?: null | string;
}

/**
 * 表格移动端媒体查询默认表达式。
 */
export const TABLE_MOBILE_MEDIA_QUERY = '(max-width: 768px)';

/**
 * 具备卸载能力的运行时对象最小约束。
 */
type UnmountableLike = {
  /** 卸载方法。 */
  unmount?: () => void;
};

/**
 * 运行时状态对比时需提取的表格配置键集合。
 */
type TableRuntimeStateKeys =
  | 'class'
  | 'formOptions'
  | 'gridClass'
  | 'gridEvents'
  | 'gridOptions'
  | 'separator'
  | 'showSearchForm'
  | 'tableTitle'
  | 'tableTitleHelp';

/**
 * 提取会影响运行时状态的表格配置子集。
 * 该结果用于判断配置变更并减少无关字段干扰。
 * @template TData 表格数据类型。
 * @template TFormValues 查询表单值类型。
 * @param options 原始表格配置对象。
 * @returns 运行时状态关心的配置切片。
 */
export function pickTableRuntimeStateOptions<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(
  options: Record<string, any> | undefined
): Pick<AdminTableOptions<TData, TFormValues>, TableRuntimeStateKeys> {
  const source = (options ?? {}) as Partial<
    Pick<AdminTableOptions<TData, TFormValues>, TableRuntimeStateKeys>
  >;
  return {
    class: source.class,
    formOptions: source.formOptions,
    gridClass: source.gridClass,
    gridEvents: source.gridEvents,
    gridOptions: source.gridOptions,
    separator: source.separator,
    showSearchForm: source.showSearchForm,
    tableTitle: source.tableTitle,
    tableTitleHelp: source.tableTitleHelp,
  };
}

/**
 * 清理表格运行时 API 时使用的参数。
 * @description 用于声明表单/表格 API 及其生命周期归属。
 */
export interface CleanupTableRuntimeApisOptions {
  /** 查询表单 API。 */
  formApi?: null | UnmountableLike;
  /** 当前上下文是否持有 `formApi` 生命周期。 */
  ownsFormApi?: boolean;
  /** 当前上下文是否持有 `tableApi` 生命周期。 */
  ownsTableApi?: boolean;
  /** 表格 API。 */
  tableApi?: null | UnmountableLike;
}

/**
 * 清理由当前上下文托管的表格运行时 API。
 * 仅在 `owns*Api` 为 `true` 时调用对应 `unmount`。
 * @param options 清理参数。
 * @returns 无返回值。
 */
export function cleanupTableRuntimeApis(options: CleanupTableRuntimeApisOptions) {
  if (options.ownsFormApi && options.formApi?.unmount) {
    options.formApi.unmount();
  }
  if (options.ownsTableApi && options.tableApi?.unmount) {
    options.tableApi.unmount();
  }
}

/**
 * 表格查询表单值对象类型。
 */
type TableSearchFormValues = Record<string, any>;

/**
 * 查询表单运行时 API 约束。
 */
export interface TableSearchFormRuntimeApi {
  /** 读取当前表单值。 */
  getValues: () => Promise<TableSearchFormValues>;
  /** 重置表单。 */
  resetForm: () => Promise<void> | void;
  /** 记录最近一次提交值（可选）。 */
  setLatestSubmissionValues?: (values: TableSearchFormValues) => void;
}

/** 查询表单动作处理器创建参数。 */
export interface CreateTableSearchFormActionHandlersOptions {
  /** 获取查询表单 API。 */
  getFormApi: () => TableSearchFormRuntimeApi;
  /** 读取到表单值后的回调。 */
  onValuesResolved?: (values: TableSearchFormValues) => void;
  /** 触发表格重新加载。 */
  reload: (values: TableSearchFormValues) => Promise<any>;
  /** 重置后是否强制触发重载。 */
  shouldReloadOnReset: () => boolean;
}

/** 查询表单动作处理器。 */
export interface TableSearchFormActionHandlers {
  /** 提交表单并触发重载。 */
  handleSubmit: () => Promise<void>;
  /** 重置表单并按策略触发重载。 */
  handleReset: () => Promise<void>;
}

/**
 * 创建查询表单提交/重置行为处理器。
 * @param options 行为处理所需依赖。
 * @returns 包含 `handleSubmit` 与 `handleReset` 的处理器对象。
 */
export function createTableSearchFormActionHandlers(
  options: CreateTableSearchFormActionHandlersOptions
): TableSearchFormActionHandlers {
  /**
   * 读取并同步当前查询表单值。
   * 会回调 `onValuesResolved`，并将值写入最近一次提交缓存。
   * @returns 最新表单值对象。
   */
  const readValues = async () => {
    const values = await options.getFormApi().getValues();
    options.onValuesResolved?.(values);
    options.getFormApi().setLatestSubmissionValues?.(values);
    return values;
  };

  return {
    /**
     * 重置查询表单并按策略决定是否触发表格重载。
     * @returns 无返回值。
     */
    handleReset: async () => {
      const formApi = options.getFormApi();
      const prevValues = await formApi.getValues();
      await formApi.resetForm();
      const values = await readValues();
      if (deepEqual(prevValues, values) || options.shouldReloadOnReset()) {
        await options.reload(values);
      }
    },
    /**
     * 提交查询表单并触发表格重载。
     * @returns 无返回值。
     */
    handleSubmit: async () => {
      const values = await readValues();
      await options.reload(values);
    },
  };
}

/**
 * 对两个普通对象做浅比较。
 * 仅比较第一层键集合和对应值（`Object.is`）。
 * @param previous 上一次对象。
 * @param next 下一次对象。
 * @returns 浅层结构和值均一致时返回 `true`。
 */
export function shallowEqualObjectRecord(
  previous: null | Record<string, any> | undefined,
  next: null | Record<string, any> | undefined
) {
  if (previous === next) {
    return true;
  }
  if (!previous || !next) {
    return false;
  }
  const previousKeys = Object.keys(previous);
  const nextKeys = Object.keys(next);
  if (previousKeys.length !== nextKeys.length) {
    return false;
  }
  for (const key of previousKeys) {
    if (!Object.prototype.hasOwnProperty.call(next, key)) {
      return false;
    }
    if (!Object.is(previous[key], next[key])) {
      return false;
    }
  }
  return true;
}

/**
 * 判断代理请求功能是否开启。
 * 需要同时满足 `enabled` 为真且存在 `ajax` 方法。
 * @param proxyConfig 代理配置。
 * @returns 代理可用时返回 `true`。
 */
export function isProxyEnabled(proxyConfig?: Record<string, any> | null) {
  return !!proxyConfig?.enabled && !!proxyConfig?.ajax;
}

/** 分隔线显示判定参数。 */
export interface ShouldShowSeparatorOptions {
  /** 是否存在表单配置。 */
  hasFormOptions?: boolean;
  /** 分隔线配置。 */
  separator?: boolean | SeparatorOptions;
  /** 是否显示查询表单。 */
  showSearchForm?: boolean;
}

/**
 * 判断是否显示查询区域与表格之间的分隔线。
 * @param options 判定参数。
 * @returns 需要展示分隔线时返回 `true`。
 */
export function shouldShowSeparator(options: ShouldShowSeparatorOptions) {
  const { hasFormOptions, separator, showSearchForm } = options;
  if (!hasFormOptions || showSearchForm === false || separator === false) {
    return false;
  }
  if (separator === undefined || separator === true) {
    return true;
  }
  return separator.show !== false;
}

/**
 * 解析分隔线内联样式。
 * 仅在对象配置且 `backgroundColor` 有效时返回样式对象。
 * @param separator 分隔线配置。
 * @returns 分隔线样式；不可用时返回 `undefined`。
 */
export function getSeparatorStyle(separator?: boolean | SeparatorOptions) {
  if (!separator || typeof separator === 'boolean') {
    return undefined;
  }
  if (!isTableNonEmptyString(separator.backgroundColor)) {
    return undefined;
  }
  return {
    backgroundColor: separator.backgroundColor,
  };
}

/**
 * 解析斑马纹配置并补齐默认值。
 * 支持布尔开关与对象配置两种输入形式。
 * @param stripe 原始斑马纹配置。
 * @param defaults 兜底默认值。
 * @returns 标准化后的斑马纹配置。
 */
export function resolveTableStripeConfig(
  stripe?: boolean | null | TableStripeConfig,
  defaults?: Partial<ResolvedTableStripeConfig>
): ResolvedTableStripeConfig {
  const fallbackEnabled = defaults?.enabled ?? false;
  const fallbackFollowTheme = defaults?.followTheme ?? false;

  if (typeof stripe === 'boolean') {
    return {
      enabled: stripe,
      followTheme: stripe ? fallbackFollowTheme : false,
    };
  }

  if (!stripe || typeof stripe !== 'object' || Array.isArray(stripe)) {
    return {
      enabled: fallbackEnabled,
      followTheme: fallbackEnabled ? fallbackFollowTheme : false,
    };
  }

  const enabled = typeof stripe.enabled === 'boolean' ? stripe.enabled : true;
  return {
    enabled,
    followTheme: enabled ? stripe.followTheme === true : false,
  };
}

/**
 * 将斑马纹配置转换为展示层配置。
 * 主要用于生成斑马纹状态类名。
 * @param config 标准化斑马纹配置。
 * @returns 包含启用状态、跟随主题状态和类名的展示配置。
 */
export function resolveTableStripePresentation(
  config?: null | Partial<ResolvedTableStripeConfig>
): ResolvedTableStripePresentation {
  const enabled = config?.enabled === true;
  const followTheme = enabled && config?.followTheme === true;
  return {
    className: enabled
      ? followTheme
        ? 'admin-table--stripe-theme'
        : 'admin-table--stripe-neutral'
      : '',
    enabled,
    followTheme,
  };
}

/**
 * 解析表格主题 CSS 变量映射。
 * 当前仅输出选择态相关主题变量。
 * @param source 主题变量来源。
 * @returns CSS 变量键值对；无有效主色时返回 `undefined`。
 */
export function resolveTableThemeCssVars(
  source: null | TableThemeCssVarSource | undefined
): Record<string, string> | undefined {
  const colorPrimary = source?.colorPrimary?.trim();
  if (!colorPrimary) {
    return undefined;
  }
  return {
    '--admin-table-selection-color': colorPrimary,
  };
}

/** `matchMedia` 匹配结果。 */
export interface TableMatchMediaResult {
  /** 是否命中当前媒体查询。 */
  matches: boolean;
}

/** 移动端媒体查询 provider。 */
export interface TableMobileMatchMediaProvider {
  /** 媒体查询匹配方法。 */
  matchMedia?: (query: string) => TableMatchMediaResult;
}

/**
 * 判断当前运行环境是否命中移动端媒体查询。
 * @param provider 可选 `matchMedia` 提供者；未传入时默认使用全局 `window`。
 * @param query 媒体查询表达式。
 * @returns 命中查询时返回 `true`。
 */
export function resolveTableMobileMatched(
  provider?: null | TableMobileMatchMediaProvider,
  query = TABLE_MOBILE_MEDIA_QUERY
) {
  const matchMediaProvider =
    provider ?? (typeof window === 'undefined' ? undefined : window);
  if (!matchMediaProvider?.matchMedia) {
    return false;
  }
  return !!matchMediaProvider.matchMedia(query).matches;
}
