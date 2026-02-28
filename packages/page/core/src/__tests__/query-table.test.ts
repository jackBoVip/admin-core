import {
  DEFAULT_PAGE_QUERY_TABLE_FIXED,
  DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS,
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS,
  PAGE_QUERY_FIXED_TABLE_CLASS,
  PAGE_QUERY_LAYOUT_TOOL_CODE,
  PAGE_SCROLL_LOCK_ATTR,
  appendClassToken,
  cleanupPageQueryTableApis,
  createPageQueryTableApiFactoriesWithOptions,
  createPageQueryTableApiFactoriesWithStripeDefaults,
  createPageQueryFrameScheduler,
  createPageQueryBridgeHandlers,
  createPageQueryTableApi,
  createPageQueryTableLazyApiOwner,
  createPageQueryTableLazyApiOwnerWithStripeDefaults,
  isHeightAlmostEqual,
  lockPageScrollTargets,
  removeClassToken,
  resolvePageQueryTableDisplayOptions,
  resolvePageQueryTableDisplayOptionsWithStripeDefaults,
  resolvePageQueryTableLayoutModeTitles,
  resolvePageQueryFormOptionsWithBridge,
  resolvePageQuerySearchFormOptions,
  resolvePageQueryTableApiBundle,
  resolvePageQueryTableApiBundleWithStripeDefaults,
  resolvePageQueryFormDefaults,
  resolvePageQueryTableOptions,
  reconcilePageScrollLocks,
  resolvePageQueryTableFixed,
  resolvePageQueryTableHeight,
  resolvePageQueryTableFixedHeight,
  resolvePageQueryTableRootStyleVariables,
  resolvePageQueryTableOptionsWithStripeDefaults,
  schedulePageQueryStabilizedRecalc,
  isPageScrollableContainerOverflow,
  resolvePreferredPageScrollLockTarget,
  unlockPageScrollTargets,
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

  it('appends/removes class tokens without duplication', () => {
    expect(appendClassToken('', 'fixed')).toBe('fixed');
    expect(appendClassToken('foo fixed', 'fixed')).toBe('foo fixed');
    expect(appendClassToken('foo', 'fixed')).toBe('foo fixed');
    expect(removeClassToken('foo fixed bar', 'fixed')).toBe('foo bar');
  });

  it('compares fixed heights with tolerance', () => {
    expect(isHeightAlmostEqual(null, null)).toBe(true);
    expect(isHeightAlmostEqual(null, 10)).toBe(false);
    expect(isHeightAlmostEqual(200, 200.4)).toBe(true);
    expect(isHeightAlmostEqual(200, 201.2)).toBe(false);
  });

  it('locks and unlocks scroll targets by snapshot state', () => {
    type TestScrollTarget = {
      removeAttribute: ReturnType<typeof vi.fn>;
      scrollTop: number;
      setAttribute: ReturnType<typeof vi.fn>;
      style: {
        overflowX: string;
        overflowY: string;
      };
    };
    const targetA: TestScrollTarget = {
      removeAttribute: vi.fn(),
      scrollTop: 12,
      setAttribute: vi.fn(),
      style: {
        overflowX: 'auto',
        overflowY: 'scroll',
      },
    };
    const targetB: TestScrollTarget = {
      removeAttribute: vi.fn(),
      scrollTop: 0,
      setAttribute: vi.fn(),
      style: {
        overflowX: '',
        overflowY: '',
      },
    };

    const locks = lockPageScrollTargets([
      targetA as unknown as HTMLElement,
      targetB as unknown as HTMLElement,
    ]);
    expect(locks).toHaveLength(2);
    expect(targetA.style.overflowY).toBe('hidden');
    expect(targetA.style.overflowX).toBe('hidden');
    expect(targetA.scrollTop).toBe(0);
    expect(targetA.setAttribute).toHaveBeenCalledWith(
      PAGE_SCROLL_LOCK_ATTR,
      'true'
    );

    const unlocked = unlockPageScrollTargets(locks);
    expect(unlocked).toEqual([]);
    expect(targetA.style.overflowY).toBe('scroll');
    expect(targetA.style.overflowX).toBe('auto');
    expect(targetB.style.overflowY).toBe('');
    expect(targetB.style.overflowX).toBe('');
    expect(targetA.removeAttribute).toHaveBeenCalledWith(
      PAGE_SCROLL_LOCK_ATTR
    );
  });

  it('reconciles scroll locks without re-locking same targets', () => {
    type TestScrollTarget = {
      removeAttribute: ReturnType<typeof vi.fn>;
      scrollTop: number;
      setAttribute: ReturnType<typeof vi.fn>;
      style: {
        overflowX: string;
        overflowY: string;
      };
    };
    const targetA: TestScrollTarget = {
      removeAttribute: vi.fn(),
      scrollTop: 0,
      setAttribute: vi.fn(),
      style: {
        overflowX: 'auto',
        overflowY: 'scroll',
      },
    };
    const targetB: TestScrollTarget = {
      removeAttribute: vi.fn(),
      scrollTop: 0,
      setAttribute: vi.fn(),
      style: {
        overflowX: '',
        overflowY: '',
      },
    };

    const firstLocks = reconcilePageScrollLocks(
      [],
      [targetA as unknown as HTMLElement, targetB as unknown as HTMLElement]
    );
    expect(firstLocks).toHaveLength(2);
    expect(targetA.setAttribute).toHaveBeenCalledTimes(1);
    expect(targetB.setAttribute).toHaveBeenCalledTimes(1);

    const reusedLocks = reconcilePageScrollLocks(
      firstLocks,
      [targetA as unknown as HTMLElement, targetB as unknown as HTMLElement]
    );
    expect(reusedLocks).toBe(firstLocks);
    expect(targetA.setAttribute).toHaveBeenCalledTimes(1);
    expect(targetB.setAttribute).toHaveBeenCalledTimes(1);

    const switchedLocks = reconcilePageScrollLocks(
      reusedLocks,
      [targetB as unknown as HTMLElement]
    );
    expect(switchedLocks).toHaveLength(1);
    expect(targetA.removeAttribute).toHaveBeenCalledWith(
      PAGE_SCROLL_LOCK_ATTR
    );
    expect(targetB.setAttribute).toHaveBeenCalledTimes(2);

    const emptyLocks = reconcilePageScrollLocks(switchedLocks, []);
    expect(emptyLocks).toEqual([]);
    expect(targetB.removeAttribute).toHaveBeenCalledWith(
      PAGE_SCROLL_LOCK_ATTR
    );
  });

  it('schedules stabilized recalculation with immediate and deferred frames', () => {
    const calls: number[] = [];
    const schedule = vi.fn((frames?: number) => {
      calls.push(frames ?? 0);
    });
    const previousWindow = (globalThis as Record<string, unknown>).window;
    const requestAnimationFrame = vi.fn((cb: (timestamp: number) => void) => {
      cb(0);
      return 1;
    });

    (globalThis as Record<string, unknown>).window = {
      requestAnimationFrame,
    };

    try {
      schedulePageQueryStabilizedRecalc(schedule, {
        deferredFrames: 4,
        immediateFrames: 2,
      });
    } finally {
      if (previousWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        (globalThis as Record<string, unknown>).window = previousWindow;
      }
    }

    expect(schedule).toHaveBeenCalledTimes(2);
    expect(calls).toEqual([2, 4]);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('schedules frame updates with deduplicated runs and supports cancel', () => {
    const calls: number[] = [];
    const previousWindow = (globalThis as Record<string, unknown>).window;
    let nextRafId = 1;
    const rafCallbacks = new Map<number, (timestamp: number) => void>();
    const requestAnimationFrame = vi.fn((cb: (timestamp: number) => void) => {
      const id = nextRafId;
      nextRafId += 1;
      rafCallbacks.set(id, cb);
      return id;
    });
    const cancelAnimationFrame = vi.fn((id: number) => {
      rafCallbacks.delete(id);
    });
    const flushRaf = () => {
      const currentCallbacks = Array.from(rafCallbacks.entries());
      rafCallbacks.clear();
      for (const [, callback] of currentCallbacks) {
        callback(0);
      }
    };

    (globalThis as Record<string, unknown>).window = {
      cancelAnimationFrame,
      requestAnimationFrame,
    };

    try {
      const scheduler = createPageQueryFrameScheduler(() => {
        calls.push(calls.length + 1);
      });

      scheduler.schedule(2);
      scheduler.schedule(4);
      expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
      while (rafCallbacks.size > 0) {
        flushRaf();
      }
      expect(calls).toHaveLength(4);

      scheduler.schedule(3);
      expect(rafCallbacks.size).toBe(1);
      scheduler.cancel();
      expect(cancelAnimationFrame).toHaveBeenCalledTimes(1);
      expect(rafCallbacks.size).toBe(0);

      scheduler.schedule(0);
      while (rafCallbacks.size > 0) {
        flushRaf();
      }
      expect(calls).toHaveLength(5);
    } finally {
      if (previousWindow === undefined) {
        delete (globalThis as Record<string, unknown>).window;
      } else {
        (globalThis as Record<string, unknown>).window = previousWindow;
      }
    }
  });

  it('resolves root style variables for fixed and flow mode', () => {
    expect(
      resolvePageQueryTableRootStyleVariables({
        fixedMode: true,
        fixedRootHeight: 560,
        fixedTableHeight: 420,
      })
    ).toEqual({
      '--admin-page-query-table-fixed-root-height': '560px',
      '--admin-page-query-table-fixed-table-height': '420px',
    });

    expect(
      resolvePageQueryTableRootStyleVariables({
        fixedMode: false,
        fixedRootHeight: 560,
        fixedTableHeight: 420,
      })
    ).toEqual({
      '--admin-page-query-table-fixed-root-height': undefined,
      '--admin-page-query-table-fixed-table-height': undefined,
    });
  });

  it('resolves query search-form options through adapter defaults', () => {
    const resolveAdapterDefaults = vi.fn((options: Record<string, unknown>) => ({
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

  it('creates api factories with normalized options from values and getters', async () => {
    const createFormApi = vi.fn((options: Record<string, unknown>) => ({
      options,
    }));
    const createTableApi = vi.fn((options: Record<string, unknown>) => ({
      options,
      query: vi.fn(async () => undefined),
      reload: vi.fn(async () => undefined),
    }));

    let dynamicTableOptions: Record<string, unknown> = { pageSize: 10 };
    const factories = createPageQueryTableApiFactoriesWithOptions({
      createFormApi,
      createTableApi,
      formOptions: { compact: true },
      normalizeFormOptions: (options) => ({
        ...(options ?? {}),
        normalized: true,
      }),
      normalizeTableOptions: (options) => ({
        ...(options ?? {}),
        normalized: true,
      }),
      tableOptions: () => dynamicTableOptions,
    });

    const formApi = factories.createFormApi();
    const tableApiA = factories.createTableApi();
    dynamicTableOptions = { pageSize: 20 };
    const tableApiB = factories.createTableApi();

    expect(formApi.options).toEqual({
      compact: true,
      normalized: true,
    });
    expect(tableApiA.options).toEqual({
      normalized: true,
      pageSize: 10,
    });
    expect(tableApiB.options).toEqual({
      normalized: true,
      pageSize: 20,
    });
    expect(createFormApi).toHaveBeenCalledTimes(1);
    expect(createTableApi).toHaveBeenCalledTimes(2);
  });

  it('creates api factories with shared stripe defaults normalizer', () => {
    const createFormApi = vi.fn((options: Record<string, unknown>) => ({ options }));
    const createTableApi = vi.fn((options: Record<string, unknown>) => ({
      options,
      query: vi.fn(async () => undefined),
      reload: vi.fn(async () => undefined),
    }));
    const resolveStripeConfig = vi.fn(
      (value: unknown, defaults: Record<string, unknown>) => ({
        defaults,
        original: value,
      })
    );

    const factories = createPageQueryTableApiFactoriesWithStripeDefaults({
      createFormApi,
      createTableApi,
      formOptions: { compact: true },
      normalizeFormOptions: (options) => ({
        ...(options ?? {}),
        normalized: true,
      }),
      resolveStripeConfig,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: {
        gridOptions: {
          stripe: { followTheme: true },
        },
      },
    });

    const formApi = factories.createFormApi();
    const tableApi = factories.createTableApi();

    expect(formApi.options).toEqual({
      compact: true,
      normalized: true,
    });
    expect(resolveStripeConfig).toHaveBeenCalledWith(
      { followTheme: true },
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    );
    expect(tableApi.options.gridOptions?.stripe).toEqual({
      defaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      original: { followTheme: true },
    });
    expect(tableApi.options.gridOptions?.toolbarConfig).toMatchObject(
      DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS
    );
    expect(tableApi.options.gridOptions?.pagerConfig).toMatchObject(
      DEFAULT_PAGE_QUERY_TABLE_PAGER_OPTIONS
    );
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

  it('creates lazy owner through shared stripe-default factories', () => {
    const createFormApi = vi.fn((options: Record<string, unknown>) => ({ options }));
    const createTableApi = vi.fn((options: Record<string, unknown>) => ({
      options,
      query: vi.fn(async () => undefined),
      reload: vi.fn(async () => undefined),
    }));
    const resolveStripeConfig = vi.fn(
      (value: unknown, defaults: Record<string, unknown>) => ({
        defaults,
        original: value,
      })
    );

    const owner = createPageQueryTableLazyApiOwnerWithStripeDefaults({
      createFormApi,
      createTableApi,
      formOptions: { compact: true },
      normalizeFormOptions: (options) => ({
        ...(options ?? {}),
        normalized: true,
      }),
      resolveStripeConfig,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: {
        gridOptions: {
          stripe: { followTheme: true },
        },
      },
    });

    const formApi = owner.ensureFormApi() as { options: Record<string, unknown> };
    const tableApi = owner.ensureTableApi() as { options: Record<string, unknown> };

    expect(createFormApi).toHaveBeenCalledTimes(1);
    expect(createTableApi).toHaveBeenCalledTimes(1);
    expect(formApi.options).toEqual({
      compact: true,
      normalized: true,
    });
    expect(resolveStripeConfig).toHaveBeenCalledWith(
      { followTheme: true },
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    );
    expect(tableApi.options.gridOptions).toMatchObject({
      toolbarConfig: DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS,
    });
    expect(owner.getOwnedState()).toMatchObject({
      ownsFormApi: true,
      ownsTableApi: true,
    });
  });

  it('resolves api bundle through shared stripe-default factories', () => {
    const createFormApi = vi.fn((options: Record<string, unknown>) => ({ options }));
    const createTableApi = vi.fn((options: Record<string, unknown>) => ({
      options,
      query: vi.fn(async () => undefined),
      reload: vi.fn(async () => undefined),
    }));
    const resolveStripeConfig = vi.fn(
      (value: unknown, defaults: Record<string, unknown>) => ({
        defaults,
        original: value,
      })
    );

    const bundle = resolvePageQueryTableApiBundleWithStripeDefaults({
      createFormApi,
      createTableApi,
      formOptions: { compact: true },
      normalizeFormOptions: (options) => ({
        ...(options ?? {}),
        normalized: true,
      }),
      resolveStripeConfig,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: {
        gridOptions: {
          stripe: { followTheme: true },
        },
      },
    });

    expect(createFormApi).toHaveBeenCalledTimes(1);
    expect(createTableApi).toHaveBeenCalledTimes(1);
    expect(resolveStripeConfig).toHaveBeenCalledWith(
      { followTheme: true },
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    );
    expect(bundle.formApi).toEqual({
      options: {
        compact: true,
        normalized: true,
      },
    });
    expect(
      (bundle.tableApi as unknown as { options: Record<string, unknown> }).options
        .gridOptions as Record<string, unknown>
    ).toMatchObject({
      toolbarConfig: DEFAULT_PAGE_QUERY_TABLE_TOOLBAR_OPTIONS,
    });
    expect(bundle.api.formApi).toBe(bundle.formApi);
    expect(bundle.api.tableApi).toBe(bundle.tableApi);
  });

  it('normalizes table options with stripe and disabled search form', () => {
    const result = resolvePageQueryTableOptions(
      {
        gridOptions: {
          stripe: { enabled: false },
        },
      },
      (stripe) => ({ ...((stripe as Record<string, unknown>) ?? {}), enabled: true })
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
      (value: unknown, defaults: Record<string, unknown>) => ({
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

  it('resolves display options using shared stripe-default pipeline', () => {
    const resolveStripe = vi.fn(
      (value: unknown, defaults: Record<string, unknown>) => ({
        defaults,
        original: value,
      })
    );

    const result = resolvePageQueryTableDisplayOptionsWithStripeDefaults({
      explicitTableHeight: null,
      fixedMode: false,
      fixedTableHeight: null,
      layoutModeTitleToFixed: 'Switch to fixed mode',
      layoutModeTitleToFlow: 'Switch to flow mode',
      onLayoutModeToggle: vi.fn(),
      resolveStripeConfig: resolveStripe,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: {
        class: 'query-table',
        gridOptions: {
          stripe: { followTheme: true },
        },
      },
    });

    expect(resolveStripe).toHaveBeenCalledWith(
      { followTheme: true },
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    );
    expect(result.class).toBe('query-table');
    expect(result.gridOptions?.stripe).toEqual({
      defaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      original: { followTheme: true },
    });
    expect(result.gridOptions?.toolbarConfig?.tools).toContainEqual(
      expect.objectContaining({
        code: PAGE_QUERY_LAYOUT_TOOL_CODE,
      })
    );
  });

  it('resolves layout mode titles from preferred/locale/default fallback', () => {
    expect(
      resolvePageQueryTableLayoutModeTitles({
        localeText: {
          queryTableSwitchToFixed: 'Locale fixed',
          queryTableSwitchToFlow: 'Locale flow',
        },
        preferredLocaleText: {
          queryTableSwitchToFixed: 'Preferred fixed',
        },
      })
    ).toEqual({
      layoutModeTitleToFixed: 'Preferred fixed',
      layoutModeTitleToFlow: 'Locale flow',
    });

    expect(
      resolvePageQueryTableLayoutModeTitles()
    ).toEqual({
      layoutModeTitleToFixed: 'Switch to fixed mode',
      layoutModeTitleToFlow: 'Switch to flow mode',
    });
  });

  it('resolves display options for fixed and flow query-table modes', () => {
    const onToggle = vi.fn();
    const fixedResolved = resolvePageQueryTableDisplayOptions({
      explicitTableHeight: null,
      fixedMode: true,
      fixedTableHeight: 420.6,
      layoutModeTitleToFixed: 'Switch to fixed mode',
      layoutModeTitleToFlow: 'Switch to flow mode',
      onLayoutModeToggle: onToggle,
      resolvedOptions: {
        class: 'foo',
        gridOptions: {
          toolbarConfig: {
            tools: [
              { code: 'refresh' },
              { code: PAGE_QUERY_LAYOUT_TOOL_CODE, title: 'stale' },
            ],
          },
        },
      },
    }) as Record<string, unknown>;

    expect(fixedResolved.class).toBe(`foo ${PAGE_QUERY_FIXED_TABLE_CLASS}`);
    expect(fixedResolved.gridOptions.height).toBe(420);
    expect(fixedResolved.gridOptions.maxHeight).toBeNull();
    expect(fixedResolved.gridOptions.toolbarConfig.tools).toEqual([
      { code: 'refresh' },
      expect.objectContaining({
        code: PAGE_QUERY_LAYOUT_TOOL_CODE,
        iconOnly: true,
        onClick: onToggle,
        title: 'Switch to flow mode',
      }),
    ]);

    const flowResolved = resolvePageQueryTableDisplayOptions({
      explicitTableHeight: 280,
      fixedMode: false,
      fixedTableHeight: 360,
      layoutModeTitleToFixed: 'Switch to fixed mode',
      layoutModeTitleToFlow: 'Switch to flow mode',
      onLayoutModeToggle: onToggle,
      resolvedOptions: {
        class: `foo ${PAGE_QUERY_FIXED_TABLE_CLASS}`,
        gridOptions: {
          toolbarConfig: {
            tools: [
              { code: 'refresh' },
              { code: PAGE_QUERY_LAYOUT_TOOL_CODE },
            ],
          },
        },
      },
    }) as Record<string, unknown>;

    expect(flowResolved.class).toBe('foo');
    expect(flowResolved.gridOptions.height).toBe(280);
    expect(flowResolved.gridOptions.maxHeight).toBeNull();
    expect(flowResolved.gridOptions.toolbarConfig.tools).toEqual([
      { code: 'refresh' },
    ]);
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
    const mapParams = vi.fn((values: Record<string, unknown>) => ({
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
    const normalized = vi.fn((options: Record<string, unknown>) => ({
      ...options,
      normalized: true,
    }));

    const resolved = resolvePageQueryFormOptionsWithBridge({
      bridge: {
        enabled: true,
        mapParams: (values: Record<string, unknown>) => ({ ...values, mapped: true }),
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
