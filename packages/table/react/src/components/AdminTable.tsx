import type { SortOrder, TablePaginationConfig } from 'antd/es/table/interface';
import type { AdminTableApi } from '@admin-core/table-core';
import type { ReactNode } from 'react';

import type {
  AdminTableReactProps,
  AdminTableSlots,
  AntdGridOptions,
} from '../types';

import {
  createTableApi,
  deepEqual,
  extendProxyOptions,
  getGlobalTableFormatterRegistry,
  getLocaleMessages,
  mergeWithArrayOverride,
} from '@admin-core/table-core';
import { useAdminForm } from '@admin-core/form-react';
import { Button, Empty, Input, Table } from 'antd';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { getReactTableRenderer } from '../renderers';
import { getAdminTableReactSetupState } from '../setup';

function getByPath(data: Record<string, any>, path?: string) {
  if (!path) return undefined;
  return path.split('.').reduce((value: any, key) => value?.[key], data);
}

function setByPath(data: Record<string, any>, path: string, value: any) {
  const keys = path.split('.');
  let current: Record<string, any> = data;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  current[keys[keys.length - 1]] = value;
}

function resolveSlot(
  slots: AdminTableSlots | undefined,
  name: string,
  params?: any
): ReactNode {
  const slot = slots?.[name];
  if (typeof slot === 'function') {
    return slot(params);
  }
  return slot ?? null;
}

function transformTreeData<TData extends Record<string, any>>(
  data: TData[],
  rowField = 'id',
  parentField = 'parentId'
): TData[] {
  const map = new Map<any, TData & { children?: TData[] }>();
  const roots: Array<TData & { children?: TData[] }> = [];

  for (const item of data) {
    map.set(item[rowField], { ...item, children: [] });
  }

  for (const item of data) {
    const node = map.get(item[rowField]);
    if (!node) continue;
    const parentId = item[parentField];
    if (parentId === null || parentId === undefined || !map.has(parentId)) {
      roots.push(node);
    } else {
      const parent = map.get(parentId);
      if (!parent) continue;
      if (!parent.children) parent.children = [];
      parent.children.push(node);
    }
  }

  return roots as TData[];
}

export const AdminTable = memo(function AdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(props: AdminTableReactProps<TData, TFormValues> & { api?: AdminTableApi<TData, TFormValues> }) {
  const api = useMemo(() => props.api ?? createTableApi<TData, TFormValues>(props), [props.api]);
  const setupState = getAdminTableReactSetupState();

  const [tableState, setTableState] = useState(() => api.getSnapshot().props as AdminTableReactProps<TData, TFormValues>);
  const [dataSource, setDataSource] = useState<TData[]>(() => (tableState.gridOptions?.data as TData[]) ?? []);
  const [loading, setLoading] = useState<boolean>(() => !!tableState.gridOptions?.loading);
  const [sortState, setSortState] = useState<{ field?: string; order?: SortOrder }>(() => {
    const defaultSort = tableState.gridOptions?.sortConfig?.defaultSort;
    if (!defaultSort?.field || !defaultSort.order) return {};
    return {
      field: defaultSort.field,
      order: defaultSort.order === 'asc' ? 'ascend' : 'descend',
    };
  });
  const [pagination, setPagination] = useState<TablePaginationConfig>(() => ({
    current: tableState.gridOptions?.pagerConfig?.currentPage ?? 1,
    pageSize: tableState.gridOptions?.pagerConfig?.pageSize ?? 20,
    total: tableState.gridOptions?.pagerConfig?.total ?? dataSource.length,
    showSizeChanger: true,
    pageSizeOptions: (tableState.gridOptions?.pagerConfig?.pageSizes ?? [10, 20, 30, 50, 100]).map((item) => String(item)),
  }));

  const [editingRowKey, setEditingRowKey] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{ dataIndex: string; rowKey: any } | null>(null);
  const rowKeyField = tableState.gridOptions?.rowConfig?.keyField ?? 'id';

  const latestPropsRef = useRef(props);
  const latestFormValuesRef = useRef<Record<string, any>>({});
  const tableStateRef = useRef(tableState);
  const paginationRef = useRef(pagination);
  const sortStateRef = useRef(sortState);
  const editingRowKeyRef = useRef<any>(editingRowKey);
  const rowKeyFieldRef = useRef<string>(rowKeyField);

  const [SearchForm, formApi] = useAdminForm({
    compact: true,
    commonConfig: {
      componentProps: {
        className: 'w-full',
      },
    },
    handleSubmit: async () => {
      const values = await formApi.getValues();
      latestFormValuesRef.current = values;
      formApi.setLatestSubmissionValues(values);
      await api.reload(values);
    },
    handleReset: async () => {
      const prevValues = await formApi.getValues();
      await formApi.resetForm();
      const values = await formApi.getValues();
      latestFormValuesRef.current = values;
      formApi.setLatestSubmissionValues(values);
      if (deepEqual(prevValues, values) || !tableStateRef.current.formOptions?.submitOnChange) {
        await api.reload(values);
      }
    },
    showCollapseButton: true,
    submitButtonOptions: {
      content: getLocaleMessages().table.search,
    },
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  });

  useEffect(() => {
    const unsubscribe = api.store.subscribeSelector(
      (snapshot) => snapshot.props,
      (next) => {
        const value = next as AdminTableReactProps<TData, TFormValues>;
        setTableState(value);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [api]);

  useEffect(() => {
    const { api: _api, ...nextProps } = props;
    if (deepEqual(latestPropsRef.current, props)) {
      return;
    }
    latestPropsRef.current = props;
    api.setState(nextProps as AdminTableReactProps<TData, TFormValues>);
  }, [api, props]);

  useEffect(() => {
    setDataSource((tableState.gridOptions?.data as TData[]) ?? []);
    setLoading(!!tableState.gridOptions?.loading);
    setPagination((prev) => ({
      ...prev,
      current: tableState.gridOptions?.pagerConfig?.currentPage ?? prev.current,
      pageSize: tableState.gridOptions?.pagerConfig?.pageSize ?? prev.pageSize,
      total: tableState.gridOptions?.pagerConfig?.total ?? prev.total,
      pageSizeOptions: (tableState.gridOptions?.pagerConfig?.pageSizes ?? [10, 20, 30, 50, 100]).map((item) => String(item)),
    }));
  }, [tableState.gridOptions]);

  useEffect(() => {
    tableStateRef.current = tableState;
  }, [tableState]);

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    sortStateRef.current = sortState;
  }, [sortState]);

  useEffect(() => {
    formApi.setState((prev) => mergeWithArrayOverride(tableState.formOptions ?? {}, prev));
  }, [formApi, tableState.formOptions]);

  const tableLikeGridRef = useRef({
    clearEdit: async () => {
      setEditingRowKey(null);
      setEditingCell(null);
    },
    isEditByRow: (row: TData) => {
      return row?.[rowKeyFieldRef.current] === editingRowKeyRef.current;
    },
    setEditRow: (row: TData) => {
      setEditingRowKey(row?.[rowKeyFieldRef.current]);
    },
  });

  const executeProxy = useCallback(async (mode: 'query' | 'reload', params: Record<string, any>) => {
    const currentTableState = tableStateRef.current;
    const currentPagination = paginationRef.current;
    const currentSortState = sortStateRef.current;
    const baseOptions = mergeWithArrayOverride(
      currentTableState.gridOptions ?? {},
      setupState.defaultGridOptions as AntdGridOptions<TData>
    ) as AntdGridOptions<TData>;

    const mergedOptions = extendProxyOptions(
      baseOptions as Record<string, any>,
      () => latestFormValuesRef.current
    ) as AntdGridOptions<TData>;

    const proxyConfig = mergedOptions.proxyConfig;
    const ajax = proxyConfig?.ajax;
    if (!ajax) return undefined;

    const handler =
      mode === 'reload'
        ? ajax.reload || ajax.query
        : ajax.query;

    if (typeof handler !== 'function') {
      return undefined;
    }

    const nextCurrent = mode === 'reload' ? 1 : currentPagination.current ?? 1;
    const nextPageSize = currentPagination.pageSize ?? 20;

    setLoading(true);
    try {
      const result = await handler(
        {
          page: {
            currentPage: nextCurrent,
            pageSize: nextPageSize,
          },
          sort: {
            field: currentSortState.field,
            order:
              currentSortState.order === 'ascend'
                ? 'asc'
                : currentSortState.order === 'descend'
                  ? 'desc'
                  : undefined,
          },
        },
        params
      );

      const response = proxyConfig?.response ?? {};
      const resultKey = response.result ?? 'items';
      const listKey = response.list || resultKey;
      const totalKey = response.total ?? 'total';

      const list = Array.isArray(result)
        ? result
        : (result?.[listKey] ?? result?.[resultKey] ?? []);
      const total = Array.isArray(result)
        ? result.length
        : Number(result?.[totalKey] ?? list.length);

      setDataSource(list as TData[]);
      setPagination((prev) => ({
        ...prev,
        current: nextCurrent,
        pageSize: nextPageSize,
        total,
      }));

      return result;
    } finally {
      setLoading(false);
    }
  }, [setupState.defaultGridOptions]);

  useEffect(() => {
    editingRowKeyRef.current = editingRowKey;
  }, [editingRowKey]);

  useEffect(() => {
    rowKeyFieldRef.current = rowKeyField;
  }, [rowKeyField]);

  useEffect(() => {
    api.mount(tableLikeGridRef.current, {
      executors: {
        query: ({ params }) => executeProxy('query', params),
        reload: ({ params }) => executeProxy('reload', params),
      },
      formApi,
    });

    return () => {
      api.unmount();
      formApi.unmount();
    };
  }, [api, executeProxy, formApi]);

  useEffect(() => {
    const proxy = tableState.gridOptions?.proxyConfig;
    if (proxy?.enabled && proxy.autoLoad) {
      void executeProxy('query', latestFormValuesRef.current);
    }
  }, [
    executeProxy,
    tableState.gridOptions?.proxyConfig?.autoLoad,
    tableState.gridOptions?.proxyConfig?.enabled,
  ]);

  const mergedGridOptions = useMemo(() => {
    return mergeWithArrayOverride(
      tableState.gridOptions ?? {},
      setupState.defaultGridOptions as AntdGridOptions<TData>
    ) as AntdGridOptions<TData>;
  }, [setupState.defaultGridOptions, tableState.gridOptions]);

  const mobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

  const computedDataSource = useMemo(() => {
    const treeConfig = mergedGridOptions.treeConfig;
    if (!treeConfig?.transform) {
      return dataSource;
    }
    return transformTreeData(
      dataSource,
      treeConfig.rowField ?? 'id',
      treeConfig.parentField ?? 'parentId'
    );
  }, [dataSource, mergedGridOptions.treeConfig]);

  const columns = useMemo(() => {
    const list = mergedGridOptions.columns ?? [];

    return list.map((column) => {
      const dataIndex = String(column.dataIndex ?? column.field ?? '');

      return {
        ...column,
        dataIndex,
        key: column.key ?? dataIndex ?? String(column.title),
        sorter: column.sortable ? true : column.sorter,
        sortOrder: sortState.field === dataIndex ? sortState.order : undefined,
        onCell: (record: TData) => {
          const trigger = mergedGridOptions.editConfig?.trigger ?? 'click';
          const clickEventName = trigger === 'dblclick' ? 'onDoubleClick' : 'onClick';
          const editable = !!column.editRender;

          return {
            [clickEventName]: () => {
              if (!editable) return;
              const key = record[rowKeyField];
              if (mergedGridOptions.editConfig?.mode === 'row') {
                setEditingRowKey(key);
              } else {
                setEditingCell({ rowKey: key, dataIndex });
              }
            },
          };
        },
        render: (value: any, record: TData) => {
          const rowKey = record[rowKeyField];
          const inRowEdit = mergedGridOptions.editConfig?.mode === 'row' && rowKey === editingRowKey;
          const inCellEdit =
            mergedGridOptions.editConfig?.mode === 'cell' &&
            editingCell?.rowKey === rowKey &&
            editingCell?.dataIndex === dataIndex;

          if ((inRowEdit || inCellEdit) && column.editRender?.name === 'input' && dataIndex) {
            return (
              <Input
                value={getByPath(record, dataIndex) as any}
                onChange={(event) => {
                  setByPath(record, dataIndex, event.target.value);
                  setDataSource((prev) => [...prev]);
                }}
              />
            );
          }

          const slotName = column.slots?.default;
          if (slotName) {
            const slotResult = resolveSlot(tableState.slots, slotName, {
              row: record,
              value,
              column,
            });
            if (slotResult) {
              return slotResult;
            }
          }

          const rendererName = column.cellRender?.name;
          if (rendererName) {
            const renderer = getReactTableRenderer(rendererName);
            if (renderer) {
              return renderer({
                attrs: column.cellRender?.attrs,
                column: {
                  ...column,
                  dataIndex,
                  field: dataIndex,
                },
                options: column.cellRender?.options,
                props: column.cellRender?.props,
                row: record,
                value: dataIndex ? getByPath(record, dataIndex) : value,
              });
            }
          }

          const formatter = column.formatter;
          if (formatter) {
            const currentValue = dataIndex ? getByPath(record, dataIndex) : value;
            if (typeof formatter === 'function') {
              return formatter(currentValue, {
                column,
                row: record,
              });
            }
            if (typeof formatter === 'string') {
              const formatterRegistry = getGlobalTableFormatterRegistry();
              const formatterFn = formatterRegistry.get(formatter);
              if (formatterFn) {
                return formatterFn(currentValue, {
                  column,
                  row: record,
                });
              }
            }
          }

          return value;
        },
      };
    });
  }, [
    mergedGridOptions.columns,
    mergedGridOptions.editConfig,
    rowKeyField,
    editingRowKey,
    editingCell,
    sortState,
    tableState.slots,
  ]);

  const showTableTitle = !!resolveSlot(tableState.slots, 'table-title') || !!tableState.tableTitle;
  const showToolbar =
    showTableTitle ||
    !!resolveSlot(tableState.slots, 'toolbar-actions') ||
    !!resolveSlot(tableState.slots, 'toolbar-tools');

  const toolbarTools = Array.isArray(mergedGridOptions.toolbarConfig?.tools)
    ? mergedGridOptions.toolbarConfig.tools
    : [];

  const showSearchButton =
    !!mergedGridOptions.toolbarConfig?.search && !!tableState.formOptions;

  const showSeparator = (() => {
    const separator = tableState.separator;
    if (!tableState.formOptions || tableState.showSearchForm === false || separator === false) {
      return false;
    }
    if (separator === undefined || separator === true) {
      return true;
    }
    return separator.show !== false;
  })();

  const separatorStyle =
    tableState.separator && typeof tableState.separator === 'object'
      ? tableState.separator.backgroundColor
        ? { backgroundColor: tableState.separator.backgroundColor }
        : undefined
      : undefined;

  const paginationEnabled = mergedGridOptions.pagerConfig?.enabled !== false;
  const striped = !!mergedGridOptions.stripe;
  const rowClassName = (record: TData, index: number, indent: number) => {
    const sourceRowClassName = mergedGridOptions.rowClassName;
    const baseClass =
      typeof sourceRowClassName === 'function'
        ? sourceRowClassName(record, index, indent)
        : (sourceRowClassName ?? '');
    if (!striped || index % 2 === 0) {
      return baseClass;
    }
    return [baseClass, 'admin-table__row--stripe'].filter(Boolean).join(' ');
  };

  return (
    <div className={["admin-table", tableState.class ?? ''].join(' ')}>
      {showToolbar ? (
        <div className="admin-table__toolbar">
          <div className="admin-table__toolbar-actions">
            {showTableTitle ? (
              <div className="admin-table__toolbar-title">
                {resolveSlot(tableState.slots, 'table-title') ?? tableState.tableTitle}
                {tableState.tableTitleHelp ? <span title={tableState.tableTitleHelp}>?</span> : null}
              </div>
            ) : null}
            {resolveSlot(tableState.slots, 'toolbar-actions')}
          </div>
          <div className="admin-table__toolbar-tools">
            {toolbarTools
              .filter((tool: any) => tool?.code !== 'search')
              .map((tool: any, index: number) => (
                <Button
                  key={`${tool?.code ?? tool?.title ?? 'tool'}-${index}`}
                  size="small"
                  type="default"
                  onClick={() => {
                    tableState.gridEvents?.toolbarToolClick?.({
                      code: tool?.code,
                      tool,
                    });
                  }}
                >
                  {tool?.title ?? tool?.code ?? `Tool-${index + 1}`}
                </Button>
              ))}
            {resolveSlot(tableState.slots, 'toolbar-tools')}
            {showSearchButton ? (
              <Button
                size="small"
                type={tableState.showSearchForm ? 'primary' : 'default'}
                onClick={() => {
                  api.toggleSearchForm();
                  tableState.gridEvents?.toolbarToolClick?.({
                    code: 'search',
                  });
                }}
              >
                {getLocaleMessages().table.search}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}

      {tableState.formOptions && tableState.showSearchForm !== false ? (
        <div className="admin-table__search">
          {resolveSlot(tableState.slots, 'form') ?? (
            <SearchForm />
          )}
          {showSeparator ? <div className="admin-table__separator" style={separatorStyle} /> : null}
        </div>
      ) : null}

      <Table<TData>
        columns={columns as any}
        dataSource={computedDataSource}
        bordered={mergedGridOptions.border ?? mergedGridOptions.bordered}
        loading={loading}
        rowClassName={rowClassName}
        rowKey={rowKeyField as any}
        pagination={
          paginationEnabled
            ? {
                ...pagination,
                size: 'small',
                showTotal: (total) => `Total ${total}`,
                position: mobile ? ['bottomCenter'] : ['bottomRight'],
              }
            : false
        }
        scroll={
          mergedGridOptions.scrollY?.enabled &&
          (computedDataSource.length > (mergedGridOptions.scrollY.gt ?? 100))
            ? {
                y:
                  typeof mergedGridOptions.height === 'number'
                    ? mergedGridOptions.height
                    : 500,
              }
            : mergedGridOptions.scroll
        }
        locale={{
          emptyText: resolveSlot(tableState.slots, 'empty') ?? <Empty description={getLocaleMessages().table.noData} />,
        }}
        onChange={(nextPagination, _filters, sorter) => {
          setPagination((prev) => ({
            ...prev,
            current: nextPagination.current,
            pageSize: nextPagination.pageSize,
          }));

          const normalizeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
          const field = normalizeSorter?.field ? String(normalizeSorter.field) : undefined;
          const order = normalizeSorter?.order;

          setSortState({ field, order });

          if (mergedGridOptions.proxyConfig?.enabled) {
            void executeProxy('query', latestFormValuesRef.current);
          }
        }}
      />

      {resolveSlot(tableState.slots, 'loading')}
    </div>
  );
});
