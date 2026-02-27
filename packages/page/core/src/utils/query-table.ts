import type {
  NormalizedPageFormTableBridgeOptions,
  PageFormTableBridgeContext,
  PageQueryTableApi,
  PageQueryTableExecutor,
} from '../types';

type QueryFormLikeOptions = {
  gridColumns?: number;
  queryMode?: boolean;
  schema?: unknown[];
};

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

function isObjectRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

type UnmountableLike = {
  unmount?: () => void;
};

export function resolvePageQuerySearchFormOptions<
  TOptions extends QueryFormLikeOptions & Record<string, any>,
>(
  options: TOptions | undefined,
  resolveSearchDefaults: (options: TOptions) => TOptions
) {
  const source = resolvePageQueryFormDefaults(
    (options ?? {}) as TOptions & Record<string, any>
  );

  return resolveSearchDefaults({
    ...source,
  } as TOptions);
}

export function resolvePageQueryFormDefaults<
  TOptions extends QueryFormLikeOptions & Record<string, any>,
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
    query: (params?: Record<string, any>) => tableApi.query(params),
    reload: (params?: Record<string, any>) => tableApi.reload(params),
    tableApi,
  };
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
  TOptions extends Record<string, any> = Record<string, any>,
>(
  options: TOptions | undefined,
  resolveStripe: (value: unknown) => unknown
) {
  const source = (options ?? {}) as TOptions & {
    gridOptions?: Record<string, any>;
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
  TOptions extends Record<string, any>,
  TStripeDefaults extends Record<string, any>,
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

type FormHandlerContext = {
  signal: unknown;
  version: number;
};

type FormHandler<TValues extends Record<string, any>, TContext> = (
  values: TValues,
  context?: TContext
) => Promise<void> | void;

export function createPageQueryBridgeHandlers<
  TValues extends Record<string, any> = Record<string, any>,
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
  TValues extends Record<string, any> = Record<string, any>,
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
  TOptions extends Record<string, any> = Record<string, any>,
>(
  options: {
    bridge: NormalizedPageFormTableBridgeOptions<TValues, TFormApi, TTableApi>;
    formApi: TFormApi;
    formOptions: TOptions | undefined;
    normalizeFormOptions: (options: TOptions | undefined) => TOptions;
    tableApi: TTableApi;
  }
) {
  const source = (options.formOptions ?? {}) as TOptions;
  const normalizedSource = options.normalizeFormOptions(source);
  const handlers = createPageQueryBridgeHandlers({
    bridge: options.bridge,
    formApi: options.formApi,
    onReset: source.handleReset as any,
    onSubmit: source.handleSubmit as any,
    tableApi: options.tableApi,
  });

  return {
    ...normalizedSource,
    handleReset: handlers.handleReset,
    handleSubmit: handlers.handleSubmit,
  } as TOptions;
}
