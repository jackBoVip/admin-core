import type { StoreApi } from './store';
import type {
  AdminTableOptions,
  TableExecutors,
  TableFormApiLike,
} from './table';

export interface AdminTableSnapshot<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  latestQueryParams: null | Record<string, any>;
  mounted: boolean;
  props: AdminTableOptions<TData, TFormValues>;
}

export interface AdminTableApi<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> {
  formApi: null | TableFormApiLike;
  getSnapshot(): AdminTableSnapshot<TData, TFormValues>;
  getState(): AdminTableOptions<TData, TFormValues>;
  grid: unknown;
  mount(
    instance?: unknown,
    options?: {
      executors?: TableExecutors;
      formApi?: null | TableFormApiLike;
    }
  ): void;
  query(params?: Record<string, any>): Promise<any>;
  reload(params?: Record<string, any>): Promise<any>;
  setExecutors(executors: TableExecutors): void;
  setFormApi(formApi: null | TableFormApiLike): void;
  setGridOptions(options: Partial<AdminTableOptions<TData>['gridOptions']>): void;
  setLoading(loading: boolean): void;
  setState(
    stateOrFn:
      | ((prev: AdminTableOptions<TData, TFormValues>) => Partial<AdminTableOptions<TData, TFormValues>>)
      | Partial<AdminTableOptions<TData, TFormValues>>
  ): void;
  store: StoreApi<AdminTableSnapshot<TData, TFormValues>>;
  toggleSearchForm(show?: boolean): boolean;
  unmount(): void;
}
