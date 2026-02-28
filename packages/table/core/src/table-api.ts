
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

class AdminTableApiImpl<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> implements AdminTableApi<TData, TFormValues>
{
  public grid: unknown = null;

  public formApi: null | TableFormApiLike = null;

  private executors: TableExecutors = {};

  private mounted = false;

  private latestQueryParams: null | Record<string, any> = null;

  private state: AdminTableOptions<TData, TFormValues>;

  public store = createStore<AdminTableSnapshot<TData, TFormValues>>({
    latestQueryParams: null,
    mounted: false,
    props: createDefaultTableOptions<TData, TFormValues>(),
  });

  constructor(options: AdminTableOptions<TData, TFormValues> = {}) {
    ensureTableCoreSetup();
    this.state = mergeWithArrayOverride(
      options,
      createDefaultTableOptions<TData, TFormValues>()
    );
    this.updateSnapshot(true);
  }

  getState() {
    return this.state;
  }

  getSnapshot() {
    return this.store.getState();
  }

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

  mount(
    instance?: unknown,
    options?: {
      executors?: TableExecutors;
      formApi?: null | TableFormApiLike;
    }
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

  setExecutors(executors: TableExecutors) {
    this.executors = {
      ...this.executors,
      ...executors,
    };
  }

  setFormApi(formApi: null | TableFormApiLike) {
    this.formApi = formApi;
  }

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

  setGridOptions(options: Partial<AdminTableOptions<TData>['gridOptions']>) {
    this.setState({
      gridOptions: options,
    });
  }

  setLoading(loading: boolean) {
    this.setState({
      gridOptions: {
        loading,
      },
    });
  }

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

  toggleSearchForm(show?: boolean) {
    const current = this.state.showSearchForm ?? true;
    const next = isBoolean(show) ? show : !current;
    this.setState({
      showSearchForm: next,
    });
    return next;
  }

  unmount() {
    this.grid = null;
    this.formApi = null;
    this.executors = {};
    this.mounted = false;
    this.updateSnapshot();
  }
}

export function createTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(
  options: AdminTableOptions<TData, TFormValues> = {}
): AdminTableApi<TData, TFormValues> {
  return new AdminTableApiImpl(options);
}
