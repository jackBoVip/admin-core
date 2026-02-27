import type {
  AdminTableOptions,
  SeparatorOptions,
  TableStripeConfig,
} from '../types';
import { deepEqual } from './deep';
import { isTableNonEmptyString } from './table-permission';

export interface ResolvedTableStripeConfig {
  enabled: boolean;
  followTheme: boolean;
}

export interface ResolvedTableStripePresentation
  extends ResolvedTableStripeConfig {
  className: '' | 'admin-table--stripe-neutral' | 'admin-table--stripe-theme';
}

export interface TableThemeCssVarSource {
  colorPrimary?: null | string;
}

export const TABLE_MOBILE_MEDIA_QUERY = '(max-width: 768px)';

type UnmountableLike = {
  unmount?: () => void;
};

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

export function cleanupTableRuntimeApis(options: {
  formApi?: null | UnmountableLike;
  ownsFormApi?: boolean;
  ownsTableApi?: boolean;
  tableApi?: null | UnmountableLike;
}) {
  if (options.ownsFormApi && options.formApi?.unmount) {
    options.formApi.unmount();
  }
  if (options.ownsTableApi && options.tableApi?.unmount) {
    options.tableApi.unmount();
  }
}

type TableSearchFormValues = Record<string, any>;

export interface TableSearchFormRuntimeApi {
  getValues: () => Promise<TableSearchFormValues>;
  resetForm: () => Promise<void> | void;
  setLatestSubmissionValues?: (values: TableSearchFormValues) => void;
}

export function createTableSearchFormActionHandlers(options: {
  getFormApi: () => TableSearchFormRuntimeApi;
  onValuesResolved?: (values: TableSearchFormValues) => void;
  reload: (values: TableSearchFormValues) => Promise<any>;
  shouldReloadOnReset: () => boolean;
}) {
  const readValues = async () => {
    const values = await options.getFormApi().getValues();
    options.onValuesResolved?.(values);
    options.getFormApi().setLatestSubmissionValues?.(values);
    return values;
  };

  return {
    handleReset: async () => {
      const formApi = options.getFormApi();
      const prevValues = await formApi.getValues();
      await formApi.resetForm();
      const values = await readValues();
      if (deepEqual(prevValues, values) || options.shouldReloadOnReset()) {
        await options.reload(values);
      }
    },
    handleSubmit: async () => {
      const values = await readValues();
      await options.reload(values);
    },
  };
}

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

export function isProxyEnabled(proxyConfig?: Record<string, any> | null) {
  return !!proxyConfig?.enabled && !!proxyConfig?.ajax;
}

export function shouldShowSeparator(options: {
  hasFormOptions?: boolean;
  separator?: boolean | SeparatorOptions;
  showSearchForm?: boolean;
}) {
  const { hasFormOptions, separator, showSearchForm } = options;
  if (!hasFormOptions || showSearchForm === false || separator === false) {
    return false;
  }
  if (separator === undefined || separator === true) {
    return true;
  }
  return separator.show !== false;
}

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

export function resolveTableMobileMatched(
  provider?:
    | null
    | {
        matchMedia?: (query: string) => {
          matches: boolean;
        };
      },
  query = TABLE_MOBILE_MEDIA_QUERY
) {
  const matchMediaProvider =
    provider ?? (typeof window === 'undefined' ? undefined : window);
  if (!matchMediaProvider?.matchMedia) {
    return false;
  }
  return !!matchMediaProvider.matchMedia(query).matches;
}
