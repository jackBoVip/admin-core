import {
  cleanupTableRuntimeApis,
  createTableSearchFormActionHandlers,
  pickTableRuntimeStateOptions,
  resolveTableMobileMatched,
  resolveTableStripePresentation,
  resolveTableThemeCssVars,
  TABLE_MOBILE_MEDIA_QUERY,
} from '../index';

describe('table base helpers', () => {
  it('picks runtime table state options only', () => {
    const picked = pickTableRuntimeStateOptions({
      class: 'demo-table',
      formOptions: { schema: [] },
      gridClass: 'grid',
      gridEvents: { onPageChange: vi.fn() },
      gridOptions: { columns: [{ field: 'name' }] },
      separator: true,
      showSearchForm: true,
      slots: { 'table-title': () => null },
      tableTitle: 'title',
      tableTitleHelp: 'help',
      unknown: 'ignored',
    });

    expect(picked).toEqual({
      class: 'demo-table',
      formOptions: { schema: [] },
      gridClass: 'grid',
      gridEvents: { onPageChange: expect.any(Function) },
      gridOptions: { columns: [{ field: 'name' }] },
      separator: true,
      showSearchForm: true,
      tableTitle: 'title',
      tableTitleHelp: 'help',
    });
  });

  it('cleans up only owned form/table apis', () => {
    const formApi = { unmount: vi.fn() };
    const tableApi = { unmount: vi.fn() };

    cleanupTableRuntimeApis({
      formApi,
      ownsFormApi: true,
      ownsTableApi: false,
      tableApi,
    });

    expect(formApi.unmount).toHaveBeenCalledTimes(1);
    expect(tableApi.unmount).not.toHaveBeenCalled();
  });

  it('creates search form submit/reset handlers with shared reload logic', async () => {
    const getValues = vi
      .fn<() => Promise<Record<string, any>>>()
      .mockResolvedValueOnce({ keyword: 'before-reset' })
      .mockResolvedValueOnce({ keyword: 'after-reset' })
      .mockResolvedValueOnce({ keyword: 'submit' });
    const resetForm = vi.fn(async () => undefined);
    const setLatestSubmissionValues = vi.fn();
    const reload = vi.fn(async () => undefined);
    const onValuesResolved = vi.fn();

    const handlers = createTableSearchFormActionHandlers({
      getFormApi: () => ({
        getValues,
        resetForm,
        setLatestSubmissionValues,
      }),
      onValuesResolved,
      reload,
      shouldReloadOnReset: () => true,
    });

    await handlers.handleReset();
    await handlers.handleSubmit();

    expect(resetForm).toHaveBeenCalledTimes(1);
    expect(setLatestSubmissionValues).toHaveBeenCalledTimes(2);
    expect(onValuesResolved).toHaveBeenCalledTimes(2);
    expect(reload).toHaveBeenNthCalledWith(1, { keyword: 'after-reset' });
    expect(reload).toHaveBeenNthCalledWith(2, { keyword: 'submit' });
  });

  it('resolves stripe presentation class from config', () => {
    expect(
      resolveTableStripePresentation({
        enabled: true,
        followTheme: true,
      })
    ).toEqual({
      className: 'admin-table--stripe-theme',
      enabled: true,
      followTheme: true,
    });

    expect(
      resolveTableStripePresentation({
        enabled: true,
        followTheme: false,
      })
    ).toEqual({
      className: 'admin-table--stripe-neutral',
      enabled: true,
      followTheme: false,
    });

    expect(resolveTableStripePresentation()).toEqual({
      className: '',
      enabled: false,
      followTheme: false,
    });
  });

  it('resolves table theme css vars from primary color', () => {
    expect(
      resolveTableThemeCssVars({
        colorPrimary: '  #1677ff ',
      })
    ).toEqual({
      '--admin-table-selection-color': '#1677ff',
    });

    expect(
      resolveTableThemeCssVars({
        colorPrimary: '   ',
      })
    ).toBeUndefined();
    expect(resolveTableThemeCssVars(undefined)).toBeUndefined();
  });

  it('resolves mobile match status through provider matchMedia', () => {
    const provider = {
      matchMedia: vi.fn((query: string) => ({
        matches: query === TABLE_MOBILE_MEDIA_QUERY,
      })),
    };

    expect(resolveTableMobileMatched(provider)).toBe(true);
    expect(resolveTableMobileMatched(provider, '(max-width: 640px)')).toBe(false);
    expect(resolveTableMobileMatched({})).toBe(false);
  });
});
