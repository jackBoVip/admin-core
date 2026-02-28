import type {
  NormalizedPageFormTableBridgeOptions,
  PageFormTableBridgeContext,
  PageQueryTableApi,
  PageQueryTableExecutor,
} from '../types';
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

type QueryFormLikeOptions = {
  gridColumns?: number;
  queryMode?: boolean;
  schema?: unknown[];
};

type OptionSource<TOptions> = TOptions | undefined | (() => TOptions | undefined);

type PageQueryTableLazyApiOwnerState<TFormApi, TTableApi> = {
  formApi: null | TFormApi;
  ownsFormApi: boolean;
  ownsTableApi: boolean;
  tableApi: null | TTableApi;
};

export const DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS = {
  enabled: true,
  followTheme: false,
} as const;

export const DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS = {
  custom: true,
  refresh: true,
  zoom: true,
} as const;

export const DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS = {
  exportConfig: true,
} as const;

export const DEFAULT_PAGE_QUERY_TABLE_FIXED = true;

export function resolvePageQueryTableFixed(fixed: null | undefined | boolean) {
  return fixed ?? DEFAULT_PAGE_QUERY_TABLE_FIXED;
}

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

export function resolvePageQueryTableFixedHeight(options: {
  elementTop: number;
  minHeight?: number;
  reserve?: number;
  viewportHeight: number;
}) {
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

function isObjectRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

type UnmountableLike = {
  unmount?: () => void;
};

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

function resolveOptionSourceGetter<TOptions>(source: OptionSource<TOptions>) {
  if (typeof source === 'function') {
    return source as () => TOptions | undefined;
  }
  return () => source;
}

export function createPageQueryTableApiFactoriesWithOptions<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions = Record<string, unknown>,
  TTableOptions = Record<string, unknown>,
>(options: {
  createFormApi: (options: TFormOptions) => TFormApi;
  createTableApi: (options: TTableOptions) => TTableApi;
  formOptions: OptionSource<TFormOptions>;
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  normalizeTableOptions: (options: TTableOptions | undefined) => TTableOptions;
  tableOptions: OptionSource<TTableOptions>;
}) {
  const readFormOptions = resolveOptionSourceGetter(options.formOptions);
  const readTableOptions = resolveOptionSourceGetter(options.tableOptions);

  return {
    createFormApi: () =>
      options.createFormApi(
        options.normalizeFormOptions(readFormOptions())
      ),
    createTableApi: () =>
      options.createTableApi(
        options.normalizeTableOptions(readTableOptions())
      ),
  };
}

export function createPageQueryTableApiFactoriesWithStripeDefaults<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
>(options: {
  createFormApi: (options: TFormOptions) => TFormApi;
  createTableApi: (options: TTableOptions) => TTableApi;
  formOptions: OptionSource<TFormOptions>;
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  resolveStripeConfig: (
    value: unknown,
    defaults: TStripeDefaults
  ) => unknown;
  stripeDefaults: TStripeDefaults;
  tableOptions: OptionSource<TTableOptions>;
}) {
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

export function createPageQueryTableLazyApiOwnerWithStripeDefaults<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TFormOptions extends Record<string, unknown> = Record<string, unknown>,
  TTableOptions extends Record<string, unknown> = Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown> = Record<string, unknown>,
>(options: {
  createFormApi: (options: TFormOptions) => TFormApi;
  createTableApi: (options: TTableOptions) => TTableApi;
  formOptions: OptionSource<TFormOptions>;
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  resolveStripeConfig: (
    value: unknown,
    defaults: TStripeDefaults
  ) => unknown;
  stripeDefaults: TStripeDefaults;
  tableOptions: OptionSource<TTableOptions>;
}) {
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

export function createPageQueryTableLazyApiOwner<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
>(options: {
  createFormApi: () => TFormApi;
  createTableApi: () => TTableApi;
}) {
  let internalFormApi: null | TFormApi = null;
  let internalTableApi: null | TTableApi = null;
  let ownsInternalFormApi = false;
  let ownsInternalTableApi = false;

  return {
    ensureFormApi: () => {
      if (!internalFormApi) {
        internalFormApi = options.createFormApi();
        ownsInternalFormApi = true;
      }
      return internalFormApi;
    },
    ensureTableApi: () => {
      if (!internalTableApi) {
        internalTableApi = options.createTableApi();
        ownsInternalTableApi = true;
      }
      return internalTableApi;
    },
    getOwnedState: (): PageQueryTableLazyApiOwnerState<TFormApi, TTableApi> => ({
      formApi: internalFormApi,
      ownsFormApi: ownsInternalFormApi,
      ownsTableApi: ownsInternalTableApi,
      tableApi: internalTableApi,
    }),
  };
}

export function resolvePageQueryTableApiBundle<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TApi extends PageQueryTableApi<TFormApi, TTableApi> = PageQueryTableApi<
    TFormApi,
    TTableApi
  >,
>(options: {
  api?: TApi;
  createApi?: (formApi: TFormApi, tableApi: TTableApi) => TApi;
  createFormApi: () => TFormApi;
  createTableApi: () => TTableApi;
  formApi?: TFormApi;
  tableApi?: TTableApi;
}) {
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
>(options: {
  api?: TApi;
  createApi?: (formApi: TFormApi, tableApi: TTableApi) => TApi;
  createFormApi: (options: TFormOptions) => TFormApi;
  createTableApi: (options: TTableOptions) => TTableApi;
  formApi?: TFormApi;
  formOptions: OptionSource<TFormOptions>;
  normalizeFormOptions: (options: TFormOptions | undefined) => TFormOptions;
  resolveStripeConfig: (
    value: unknown,
    defaults: TStripeDefaults
  ) => unknown;
  stripeDefaults: TStripeDefaults;
  tableApi?: TTableApi;
  tableOptions: OptionSource<TTableOptions>;
}) {
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

export function cleanupPageQueryTableApis(options: {
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

export function resolvePageQueryTableOptions<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  options: TOptions | undefined,
  resolveStripe: (value: unknown) => unknown
) {
  const source = (options ?? {}) as TOptions & {
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

export function resolvePageQueryTableDisplayOptionsWithStripeDefaults<
  TOptions extends Record<string, unknown>,
  TStripeDefaults extends Record<string, unknown>,
>(options: {
  explicitTableHeight: null | number;
  fixedMode: boolean;
  fixedTableHeight: null | number;
  layoutModeTitleToFixed: string;
  layoutModeTitleToFlow: string;
  onLayoutModeToggle: () => void;
  resolveStripeConfig: (
    value: unknown,
    defaults: TStripeDefaults
  ) => unknown;
  stripeDefaults: TStripeDefaults;
  tableOptions: TOptions | undefined;
}) {
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

export function resolvePageQueryTableLayoutModeTitles(options?: {
  localeText?: Record<string, unknown> | null | undefined;
  preferredLocaleText?: Record<string, unknown> | null | undefined;
}) {
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

export function resolvePageQueryTableDisplayOptions<
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(options: {
  explicitTableHeight: null | number;
  fixedMode: boolean;
  fixedTableHeight: null | number;
  layoutModeTitleToFixed: string;
  layoutModeTitleToFlow: string;
  onLayoutModeToggle: () => void;
  resolvedOptions: TOptions;
}) {
  const source = options.resolvedOptions as TOptions & {
    class?: unknown;
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

type FormHandlerContext = {
  signal: unknown;
  version: number;
};

type FormHandler<TValues extends Record<string, unknown>, TContext> = (
  values: TValues,
  context?: TContext
) => Promise<void> | void;

export function createPageQueryBridgeHandlers<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TContext = FormHandlerContext,
>(
  options: {
    bridge: NormalizedPageFormTableBridgeOptions<TValues, TFormApi, TTableApi>;
    formApi: TFormApi;
    onReset?: FormHandler<TValues, TContext>;
    onSubmit?: FormHandler<TValues, TContext>;
    tableApi: TTableApi;
  }
) {
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
    handleReset: (values: TValues, context?: TContext) =>
      runAction('reset', values, context),
    handleSubmit: (values: TValues, context?: TContext) =>
      runAction('submit', values, context),
  };
}

export function resolvePageQueryFormOptionsWithBridge<
  TValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TOptions extends Record<string, unknown> = Record<string, unknown>,
>(
  options: {
    bridge: NormalizedPageFormTableBridgeOptions<TValues, TFormApi, TTableApi>;
    formApi: TFormApi;
    formOptions: TOptions | undefined;
    normalizeFormOptions: (options: TOptions | undefined) => TOptions;
    tableApi: TTableApi;
  }
) {
  const source = (options.formOptions ?? {}) as TOptions & {
    handleReset?: FormHandler<TValues, unknown>;
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
