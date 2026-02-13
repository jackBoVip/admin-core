import { describe, expect, it, vi } from 'vitest';
import { createTableApi } from '../table-api';

describe('table api', () => {
  it('should initialize with default state', () => {
    const api = createTableApi();
    expect(api.getState().showSearchForm).toBe(true);
    expect(api.getState().gridOptions).toBeTruthy();
  });

  it('should toggle search form state', () => {
    const api = createTableApi();
    const first = api.toggleSearchForm();
    const second = api.toggleSearchForm();

    expect(first).toBe(false);
    expect(second).toBe(true);
  });

  it('query and reload should use different executors', async () => {
    const api = createTableApi();
    const query = vi.fn();
    const reload = vi.fn();
    api.setExecutors({ query, reload });

    await api.query({ page: 2 });
    await api.reload({ page: 1 });

    expect(query).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(api.getSnapshot().latestQueryParams).toEqual({ page: 1 });
  });

  it('setState should merge patch', () => {
    const api = createTableApi({
      gridOptions: {
        pagerConfig: { currentPage: 2 },
      },
    });

    api.setState({
      gridOptions: {
        loading: true,
      },
    });

    expect(api.getState().gridOptions?.loading).toBe(true);
    expect(api.getState().gridOptions?.pagerConfig?.currentPage).toBe(2);
  });

  it('setLoading should only update loading state', () => {
    const api = createTableApi({
      gridOptions: {
        pagerConfig: { currentPage: 3 },
      },
    });
    api.setLoading(true);
    expect(api.getState().gridOptions?.loading).toBe(true);
    expect(api.getState().gridOptions?.pagerConfig?.currentPage).toBe(3);
  });

  it('mount and unmount should update lifecycle state', () => {
    const api = createTableApi();
    expect(api.getSnapshot().mounted).toBe(false);
    api.mount({ id: 'grid' });
    expect(api.getSnapshot().mounted).toBe(true);
    api.unmount();
    expect(api.getSnapshot().mounted).toBe(false);
  });
});
