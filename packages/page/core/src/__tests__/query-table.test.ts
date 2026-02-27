import {
  DEFAULT_PAGE_QUERY_TABLE_FIXED,
  DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS,
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS,
  cleanupPageQueryTableApis,
  createPageQueryBridgeHandlers,
  createPageQueryTableApi,
  createPageQueryTableLazyApiOwner,
  resolvePageQueryFormOptionsWithBridge,
  resolvePageQuerySearchFormOptions,
  resolvePageQueryTableApiBundle,
  resolvePageQueryFormDefaults,
  resolvePageQueryTableOptions,
  resolvePageQueryTableFixed,
  resolvePageQueryTableHeight,
  resolvePageQueryTableFixedHeight,
  resolvePageQueryTableOptionsWithStripeDefaults,
  isPageScrollableContainerOverflow,
  resolvePreferredPageScrollLockTarget,
} from '../index';

describe('page query-table helpers', () => {
  it('resolves form defaults with auto grid columns', () => {
    expect(resolvePageQueryFormDefaults({ schema: [{ field: 'name' }] })).toMatchObject({
      gridColumns: 2,
      queryMode: true,
    });
    expect(
      resolvePageQueryFormDefaults({
        queryMode: false,
        schema: [{ field: 'a' }, { field: 'b' }],
      })
    ).toMatchObject({
      gridColumns: 3,
      queryMode: false,
    });
    expect(
      resolvePageQueryFormDefaults({
        gridColumns: 4,
        schema: [{ field: 'a' }, { field: 'b' }],
      })
    ).toMatchObject({
      gridColumns: 4,
      queryMode: true,
    });
  });

  it('resolves query search-form options through adapter defaults', () => {
    const resolveAdapterDefaults = vi.fn((options: Record<string, any>) => ({
      ...options,
      compact: true,
    }));

    const result = resolvePageQuerySearchFormOptions(
      {
        schema: [{ field: 'keyword' }],
      },
      resolveAdapterDefaults
    );

    expect(resolveAdapterDefaults).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({
      compact: true,
      gridColumns: 2,
      queryMode: true,
    });
  });

  it('creates query-table api by delegating query/reload', async () => {
    const query = vi.fn(async () => ({ ok: true }));
    const reload = vi.fn(async () => ({ ok: true }));
    const tableApi = { query, reload };
    const formApi = { getValues: vi.fn() };

    const api = createPageQueryTableApi(formApi, tableApi);
    await api.query({ keyword: 'hello' });
    await api.reload({ page: 2 });

    expect(api.formApi).toBe(formApi);
    expect(api.tableApi).toBe(tableApi);
    expect(query).toHaveBeenCalledWith({ keyword: 'hello' });
    expect(reload).toHaveBeenCalledWith({ page: 2 });
  });

  it('creates lazy query-table owner for internal api lifecycle', () => {
    const formApi = { id: 'form' };
    const tableApi = {
      id: 'table',
      query: vi.fn(async () => undefined),
      reload: vi.fn(async () => undefined),
    };
    const createFormApi = vi.fn(() => formApi);
    const createTableApi = vi.fn(() => tableApi);
    const owner = createPageQueryTableLazyApiOwner({
      createFormApi,
      createTableApi,
    });

    expect(owner.getOwnedState()).toEqual({
      formApi: null,
      ownsFormApi: false,
      ownsTableApi: false,
      tableApi: null,
    });

    expect(owner.ensureFormApi()).toBe(formApi);
    expect(owner.ensureFormApi()).toBe(formApi);
    expect(createFormApi).toHaveBeenCalledTimes(1);

    expect(owner.ensureTableApi()).toBe(tableApi);
    expect(owner.ensureTableApi()).toBe(tableApi);
    expect(createTableApi).toHaveBeenCalledTimes(1);

    expect(owner.getOwnedState()).toEqual({
      formApi,
      ownsFormApi: true,
      ownsTableApi: true,
      tableApi,
    });
  });

  it('normalizes table options with stripe and disabled search form', () => {
    const result = resolvePageQueryTableOptions(
      {
        gridOptions: {
          stripe: { enabled: false },
        },
      },
      (stripe) => ({ ...((stripe as Record<string, any>) ?? {}), enabled: true })
    );

    expect(result.showSearchForm).toBe(false);
    expect(result.gridOptions?.stripe).toEqual({ enabled: true });
    expect(result.gridOptions?.toolbarConfig).toMatchObject(
      DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS
    );
    expect(result.gridOptions?.pagerConfig).toMatchObject(
      DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS
    );
  });

  it('normalizes table options using shared stripe defaults helper', () => {
    const resolveStripe = vi.fn(
      (value: unknown, defaults: Record<string, any>) => ({
        defaults,
        original: value,
      })
    );

    const result = resolvePageQueryTableOptionsWithStripeDefaults(
      {
        gridOptions: {
          stripe: { followTheme: true },
        },
      },
      resolveStripe,
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    );

    expect(resolveStripe).toHaveBeenCalledWith(
      { followTheme: true },
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    );
    expect(result.gridOptions?.stripe).toEqual({
      defaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      original: { followTheme: true },
    });
    expect(result.gridOptions?.toolbarConfig).toMatchObject(
      DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS
    );
    expect(result.gridOptions?.pagerConfig).toMatchObject(
      DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS
    );
    expect(result.showSearchForm).toBe(false);
  });

  it('keeps user toolbar and export config overrides', () => {
    const result = resolvePageQueryTableOptions(
      {
        gridOptions: {
          pagerConfig: {
            exportConfig: false,
          },
          toolbarConfig: {
            custom: false,
            refresh: false,
            zoom: true,
          },
        },
      },
      (stripe) => stripe
    );

    expect(result.gridOptions?.toolbarConfig).toMatchObject({
      custom: false,
      refresh: false,
      zoom: true,
    });
    expect(result.gridOptions?.pagerConfig).toMatchObject({
      exportConfig: false,
    });
  });

  it('resolves query-table fixed mode with default fallback', () => {
    expect(DEFAULT_PAGE_QUERY_TABLE_FIXED).toBe(true);
    expect(resolvePageQueryTableFixed(undefined)).toBe(true);
    expect(resolvePageQueryTableFixed(null)).toBe(true);
    expect(resolvePageQueryTableFixed(true)).toBe(true);
    expect(resolvePageQueryTableFixed(false)).toBe(false);
  });

  it('resolves query-table explicit height from number or px string', () => {
    expect(resolvePageQueryTableHeight(420)).toBe(420);
    expect(resolvePageQueryTableHeight(420.8)).toBe(420);
    expect(resolvePageQueryTableHeight('420')).toBe(420);
    expect(resolvePageQueryTableHeight('420px')).toBe(420);
    expect(resolvePageQueryTableHeight(' 420.9px ')).toBe(420);

    expect(resolvePageQueryTableHeight(0)).toBeNull();
    expect(resolvePageQueryTableHeight(-1)).toBeNull();
    expect(resolvePageQueryTableHeight('')).toBeNull();
    expect(resolvePageQueryTableHeight('auto')).toBeNull();
    expect(resolvePageQueryTableHeight('100%')).toBeNull();
    expect(resolvePageQueryTableHeight(undefined)).toBeNull();
  });

  it('recognizes page scrollable overflow values for fixed lock target', () => {
    expect(isPageScrollableContainerOverflow('auto')).toBe(true);
    expect(isPageScrollableContainerOverflow('overlay')).toBe(true);
    expect(isPageScrollableContainerOverflow('scroll')).toBe(true);
    expect(isPageScrollableContainerOverflow(' Auto ')).toBe(true);

    expect(isPageScrollableContainerOverflow('hidden')).toBe(false);
    expect(isPageScrollableContainerOverflow('clip')).toBe(false);
    expect(isPageScrollableContainerOverflow('visible')).toBe(false);
    expect(isPageScrollableContainerOverflow(undefined)).toBe(false);
  });

  it('resolves preferred scroll lock target by priority', () => {
    const primary = { id: 'primary' } as unknown as HTMLElement;
    const ancestorA = { id: 'ancestor-a' } as unknown as HTMLElement;
    const ancestorB = { id: 'ancestor-b' } as unknown as HTMLElement;
    const documentScroll = { id: 'document' } as unknown as HTMLElement;

    expect(
      resolvePreferredPageScrollLockTarget({
        ancestorScrollContainers: [ancestorA, ancestorB],
        documentScrollElement: documentScroll,
        primaryScrollContainer: primary,
      })
    ).toBe(primary);

    expect(
      resolvePreferredPageScrollLockTarget({
        ancestorScrollContainers: [ancestorA, ancestorB],
        documentScrollElement: documentScroll,
        primaryScrollContainer: null,
      })
    ).toBe(ancestorA);

    expect(
      resolvePreferredPageScrollLockTarget({
        ancestorScrollContainers: [],
        documentScrollElement: documentScroll,
        primaryScrollContainer: null,
      })
    ).toBe(documentScroll);

    expect(
      resolvePreferredPageScrollLockTarget({
        ancestorScrollContainers: [],
        documentScrollElement: null,
        primaryScrollContainer: null,
      })
    ).toBeNull();
  });

  it('resolves query-table fixed height from viewport and top offset', () => {
    expect(
      resolvePageQueryTableFixedHeight({
        elementTop: 200,
        viewportHeight: 900,
      })
    ).toBe(700);

    expect(
      resolvePageQueryTableFixedHeight({
        elementTop: 200,
        minHeight: 320,
        reserve: 24,
        viewportHeight: 500,
      })
    ).toBe(320);

    expect(
      resolvePageQueryTableFixedHeight({
        elementTop: Number.NaN,
        viewportHeight: 900,
      })
    ).toBe(0);
  });

  it('builds bridge submit/reset handlers', async () => {
    const query = vi.fn(async () => undefined);
    const reload = vi.fn(async () => undefined);
    const onSubmit = vi.fn(async () => undefined);
    const onReset = vi.fn(async () => undefined);
    const mapParams = vi.fn((values: Record<string, any>) => ({
      ...values,
      mapped: true,
    }));

    const handlers = createPageQueryBridgeHandlers({
      bridge: {
        enabled: true,
        mapParams,
        queryOnSubmit: true,
        reloadOnReset: true,
      },
      formApi: { id: 'form' },
      onReset,
      onSubmit,
      tableApi: { query, reload },
    });

    await handlers.handleSubmit({ keyword: 'a' });
    await handlers.handleReset({ keyword: 'b' });

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(mapParams).toHaveBeenCalledTimes(2);
    expect(query).toHaveBeenCalledWith({ keyword: 'a', mapped: true });
    expect(reload).toHaveBeenCalledWith({ keyword: 'b', mapped: true });
  });

  it('resolves form options with bridge handlers', async () => {
    const query = vi.fn(async () => undefined);
    const reload = vi.fn(async () => undefined);
    const normalized = vi.fn((options: Record<string, any>) => ({
      ...options,
      normalized: true,
    }));

    const resolved = resolvePageQueryFormOptionsWithBridge({
      bridge: {
        enabled: true,
        mapParams: (values: Record<string, any>) => ({ ...values, mapped: true }),
        queryOnSubmit: true,
        reloadOnReset: true,
      },
      formApi: { id: 'form' },
      formOptions: { schema: [{ field: 'keyword' }] },
      normalizeFormOptions: normalized,
      tableApi: { query, reload },
    });

    expect(normalized).toHaveBeenCalledTimes(1);
    expect(resolved.normalized).toBe(true);
    await resolved.handleSubmit({ keyword: 'x' });
    await resolved.handleReset({ keyword: 'y' });
    expect(query).toHaveBeenCalledWith({ keyword: 'x', mapped: true });
    expect(reload).toHaveBeenCalledWith({ keyword: 'y', mapped: true });
  });

  it('resolves api bundle with external and internal apis', () => {
    const providedFormApi = { unmount: vi.fn() };
    const providedTableApi = { query: vi.fn(), reload: vi.fn(), unmount: vi.fn() };
    const providedApi = createPageQueryTableApi(providedFormApi, providedTableApi);

    const fromProvided = resolvePageQueryTableApiBundle({
      api: providedApi,
      createFormApi: () => ({ unmount: vi.fn() }),
      createTableApi: () => ({ query: vi.fn(), reload: vi.fn(), unmount: vi.fn() }),
      formApi: undefined,
      tableApi: undefined,
    });

    expect(fromProvided.api).toBe(providedApi);
    expect(fromProvided.formApi).toBe(providedFormApi);
    expect(fromProvided.tableApi).toBe(providedTableApi);
    expect(fromProvided.providedFormApi).toBe(providedFormApi);
    expect(fromProvided.providedTableApi).toBe(providedTableApi);

    const createdFormApi = { unmount: vi.fn() };
    const createdTableApi = { query: vi.fn(), reload: vi.fn(), unmount: vi.fn() };
    const fromInternal = resolvePageQueryTableApiBundle({
      createFormApi: () => createdFormApi,
      createTableApi: () => createdTableApi,
      formApi: undefined,
      tableApi: undefined,
    });

    expect(fromInternal.api.formApi).toBe(createdFormApi);
    expect(fromInternal.api.tableApi).toBe(createdTableApi);
    expect(fromInternal.providedFormApi).toBeUndefined();
    expect(fromInternal.providedTableApi).toBeUndefined();
  });

  it('cleans up only owned query-table apis', () => {
    const formApi = { unmount: vi.fn() };
    const tableApi = { unmount: vi.fn() };

    cleanupPageQueryTableApis({
      formApi,
      ownsFormApi: true,
      ownsTableApi: false,
      tableApi,
    });

    expect(formApi.unmount).toHaveBeenCalledTimes(1);
    expect(tableApi.unmount).not.toHaveBeenCalled();
  });
});
