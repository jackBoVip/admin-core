import type {
  SortOrder,
  TablePaginationConfig,
  TableRowSelection,
} from 'antd/es/table/interface';
import type { Locale as AntdLocale } from 'antd/es/locale';
import type {
  AdminTableApi,
  AdminTablePaginationChangePayload,
  ColumnCustomDragHoverState,
  ColumnCustomDragPosition,
  ColumnCustomDragState,
  ColumnCustomFlipRect,
  ResolvedTablePagerExportAction,
} from '@admin-core/table-core';
import type { CSSProperties, Key, ReactNode } from 'react';

import type {
  AdminTableReactProps,
  AdminTableSlots,
  AntdGridOptions,
} from '../types';

import {
  applySelectionCheckFieldToRows,
  applyColumnCustomFlipOffsets,
  applyColumnCustomDragMove,
  alignSelectionKeysToRows,
  buildColumnCustomControls,
  buildBuiltinToolbarTools,
  buildDefaultColumnFilterOptions,
  buildColumnRuntimeItems,
  collectSelectionKeysByField,
  collectColumnCustomFlipOffsets,
  collectColumnCustomFlipRects,
  createColumnCustomControlsOrderDigest,
  createColumnCustomDragResetState,
  createColumnCustomChangePayload,
  createPagerExportEventPayload,
  createTableComparableSelectionKeySet,
  createTableLocaleText,
  createTableApi,
  deepEqual,
  ensureSeqColumn,
  exportTableRowsToExcel,
  extendProxyOptions,
  flattenTableRows,
  getColumnFilterValueKey,
  getSearchPanelToggleTitle,
  getSeparatorStyle,
  getColumnValueByPath,
  getGlobalTableFormatterRegistry,
  getLocaleMessages,
  forceColumnCustomFlipReflow,
  hasTableRowStrategyStyle,
  hasColumnCustomSnapshot,
  isProxyEnabled,
  setColumnValueByPath,
  mergeWithArrayOverride,
  normalizeTableExportFileName,
  normalizeTableSelectionKeys,
  readColumnCustomStateFromStorage,
  resetColumnCustomFlipTransforms,
  resolveColumnCustomAutoScrollTop,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomState,
  resolveColumnCustomPersistenceConfig,
  resolveColumnCustomCancelState,
  resolveColumnCustomConfirmState,
  resolveColumnCustomOpenState,
  resolveColumnCustomResetState,
  resolveColumnCustomWorkingSnapshot,
  resolveSelectionColumn,
  resolveSelectionMode,
  resolveRowClickSelectionKeys,
  resolveSelectionRowsByKeys,
  resolveOperationColumnConfig,
  resolveOperationCellAlignClass,
  resolveTableExportColumns,
  resolveTablePagerLayoutSet,
  resolveTablePagerPageSizes,
  resolveTablePagerExportConfig,
  resolveTableCellStrategyResult,
  resolveTableRowStrategyInlineStyle,
  resolveTableRowStrategyResult,
  isSeqColumnTypeColumn,
  resolveToolbarActionButtonRenderState,
  resolveToolbarInlinePosition,
  resolveToolbarHintConfig,
  resolveVisibleToolbarActionTools,
  resolveVisibleOperationActionTools,
  resolveToolbarToolVisibility,
  resolveToolbarToolsSlotPosition,
  isSelectionColumnTypeColumn,
  shallowEqualObjectRecord,
  shouldShowSeparator,
  triggerOperationActionTool,
  triggerToolbarActionTool,
  toggleAllColumnCustomVisible,
  toggleColumnCustomFilterable,
  toggleColumnCustomFixed,
  toggleColumnCustomSortable,
  toggleColumnCustomVisible,
  toTableComparableSelectionKey,
  triggerTableCellStrategyClick,
  triggerTableRowStrategyClick,
  writeColumnCustomStateToStorage,
} from '@admin-core/table-core';
import { useAdminForm } from '@admin-core/form-react';
import { ConfigProvider, Empty, Input, Table, theme as antdTheme } from 'antd';
import antdEnUS from 'antd/locale/en_US';
import antdZhCN from 'antd/locale/zh_CN';
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useLocaleVersion } from '../hooks/useLocaleVersion';
import { usePreferencesVersion } from '../hooks/usePreferencesVersion';
import { getReactTableRenderer } from '../renderers';
import {
  getAdminTableReactSetupState,
  syncAdminTableReactWithPreferences,
} from '../setup';

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

type RowSelectionMode = 'checkbox' | 'radio';

function resolveBooleanOption(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

function resolveTableMobileState() {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia('(max-width: 768px)').matches;
}

function resolveTableScrollHeight(height: unknown, fallback = 500) {
  if (typeof height === 'number' && Number.isFinite(height) && height > 0) {
    return height;
  }
  if (typeof height === 'string') {
    const parsed = Number.parseFloat(height.trim());
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

function resolveAntdTableLocale(locale: unknown): AntdLocale {
  if (locale === 'en-US') {
    return antdEnUS;
  }
  return antdZhCN;
}

function ToolbarToolIcon({
  active,
  code,
}: {
  code: 'custom' | 'refresh' | 'zoom';
  active?: boolean;
}) {
  const iconClass =
    code === 'refresh'
      ? 'vxe-table-icon-repeat'
      : code === 'zoom'
        ? active
          ? 'vxe-table-icon-minimize'
          : 'vxe-table-icon-fullscreen'
        : 'vxe-table-icon-custom-column';

  return (
    <i
      aria-hidden="true"
      className={[
        'admin-table__toolbar-tool-icon',
        iconClass,
        code === 'refresh' && active ? 'roll' : '',
      ].filter(Boolean).join(' ')}
    />
  );
}

export const AdminTable = memo(function AdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(props: AdminTableReactProps<TData, TFormValues> & { api?: AdminTableApi<TData, TFormValues> }) {
  const api = useMemo(() => props.api ?? createTableApi<TData, TFormValues>(props), [props.api]);
  const setupState = getAdminTableReactSetupState();
  const localeVersion = useLocaleVersion();
  const preferencesVersion = usePreferencesVersion();
  const localeText = useMemo(
    () => createTableLocaleText(getLocaleMessages().table),
    [localeVersion]
  );
  const antdLocale = useMemo(
    () => resolveAntdTableLocale(setupState.locale),
    [localeVersion, setupState.locale]
  );

  const [tableState, setTableState] = useState(() => api.getSnapshot().props as AdminTableReactProps<TData, TFormValues>);
  const [dataSource, setDataSource] = useState<TData[]>(() => (tableState.gridOptions?.data as TData[]) ?? []);
  const [loading, setLoading] = useState<boolean>(() => !!tableState.gridOptions?.loading);
  const [refreshing, setRefreshing] = useState(false);
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
    pageSizeOptions: resolveTablePagerPageSizes(
      tableState.gridOptions?.pagerConfig?.pageSizes
    ).map((item) => String(item)),
  }));
  const [mobile, setMobile] = useState(() => resolveTableMobileState());
  const [innerSelectedRowKeys, setInnerSelectedRowKeys] = useState<Key[]>(() => {
    const rowSelection = tableState.gridOptions?.rowSelection;
    if (Array.isArray(rowSelection?.selectedRowKeys)) {
      return rowSelection.selectedRowKeys as Key[];
    }
    if (Array.isArray(rowSelection?.defaultSelectedRowKeys)) {
      return rowSelection.defaultSelectedRowKeys as Key[];
    }
    return [];
  });

  const [maximized, setMaximized] = useState(false);
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  const [customDraftVisibleColumns, setCustomDraftVisibleColumns] = useState<Record<string, boolean>>({});
  const [customDraftFilterableColumns, setCustomDraftFilterableColumns] = useState<Record<string, boolean>>({});
  const [customDraftFixedColumns, setCustomDraftFixedColumns] = useState<Record<string, '' | 'left' | 'right'>>({});
  const [customDraftOrder, setCustomDraftOrder] = useState<string[]>([]);
  const [customDraftSortableColumns, setCustomDraftSortableColumns] = useState<Record<string, boolean>>({});
  const [customDragState, setCustomDragState] = useState<ColumnCustomDragState>(
    () => createColumnCustomDragResetState().dragState
  );
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  const [filterableColumns, setFilterableColumns] = useState<Record<string, boolean>>({});
  const [fixedColumns, setFixedColumns] = useState<Record<string, '' | 'left' | 'right'>>({});
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  const [sortableColumns, setSortableColumns] = useState<Record<string, boolean>>({});
  const [editingRowKey, setEditingRowKey] = useState<any>(null);
  const [editingCell, setEditingCell] = useState<{ dataIndex: string; rowKey: any } | null>(null);
  const rowKeyField = tableState.gridOptions?.rowConfig?.keyField ?? 'id';

  const latestPropsRef = useRef<AdminTableReactProps<TData, TFormValues> | null>(null);
  const latestFormValuesRef = useRef<Record<string, any>>({});
  const tableStateRef = useRef(tableState);
  const paginationRef = useRef(pagination);
  const sortStateRef = useRef(sortState);
  const editingRowKeyRef = useRef<any>(editingRowKey);
  const rowKeyFieldRef = useRef<string>(rowKeyField);
  const customOriginStateRef = useRef<{
    filterable: Record<string, boolean>;
    fixed: Record<string, '' | 'left' | 'right'>;
    order: string[];
    sortable: Record<string, boolean>;
    visible: Record<string, boolean>;
  }>({
    filterable: {},
    fixed: {},
    order: [],
    sortable: {},
    visible: {},
  });
  const customRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const customBodyRef = useRef<HTMLDivElement | null>(null);
  const customPopoverRef = useRef<HTMLDivElement | null>(null);
  const customTriggerRef = useRef<HTMLButtonElement | null>(null);
  const tableRootRef = useRef<HTMLDivElement | null>(null);
  const toolbarHintViewportRef = useRef<HTMLDivElement | null>(null);
  const toolbarHintTextRef = useRef<HTMLSpanElement | null>(null);
  const pagerHintViewportRef = useRef<HTMLDivElement | null>(null);
  const pagerHintTextRef = useRef<HTMLSpanElement | null>(null);
  const visibleDataSourceRef = useRef<TData[]>(dataSource);
  const customRowRectsRef = useRef<Map<string, ColumnCustomFlipRect>>(new Map());
  const customRowAnimationFrameRef = useRef<null | number>(null);
  const customMoveAnimationFrameRef = useRef<null | number>(null);
  const customPendingMoveRef = useRef<null | {
    dragKey: string;
    overKey: string;
    position: ColumnCustomDragPosition;
  }>(null);
  const customDraggingKeyRef = useRef<null | string>(null);
  const customDragHoverRef = useRef<ColumnCustomDragHoverState>(
    createColumnCustomDragResetState().dragHover
  );
  const [toolbarHintShouldScroll, setToolbarHintShouldScroll] = useState(false);
  const [pagerHintShouldScroll, setPagerHintShouldScroll] = useState(false);
  const [paginationMountNode, setPaginationMountNode] = useState<HTMLElement | null>(null);
  const hasAppliedDefaultSelectionRef = useRef(false);
  const previousSelectionModeRef = useRef<undefined | RowSelectionMode>(undefined);
  const antdThemeConfig = useMemo(() => {
    const themeState = setupState.theme;
    const hasTheme =
      !!themeState.colorPrimary ||
      !!themeState.radius ||
      typeof themeState.fontScale === 'number' ||
      !!themeState.mode;
    if (!hasTheme) {
      return undefined;
    }
    const radiusRem = Number.parseFloat(themeState.radius ?? '');
    const token: Record<string, any> = {
      colorPrimary: themeState.colorPrimary,
      fontSize:
        typeof themeState.fontScale === 'number' &&
        Number.isFinite(themeState.fontScale)
          ? Math.max(12, Number((14 * themeState.fontScale).toFixed(2)))
          : undefined,
    };
    if (Number.isFinite(radiusRem)) {
      token.borderRadius = Math.max(0, Number((radiusRem * 16).toFixed(2)));
    }
    return {
      algorithm:
        themeState.mode === 'dark'
          ? antdTheme.darkAlgorithm
          : antdTheme.defaultAlgorithm,
      token,
    };
  }, [
    preferencesVersion,
    setupState.theme.colorPrimary,
    setupState.theme.fontScale,
    setupState.theme.mode,
    setupState.theme.radius,
  ]);

  const clearCustomMoveFrame = useCallback(() => {
    customPendingMoveRef.current = null;
    if (typeof window !== 'undefined' && customMoveAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(customMoveAnimationFrameRef.current);
    }
    customMoveAnimationFrameRef.current = null;
  }, []);

  const resetCustomDragState = useCallback(() => {
    clearCustomMoveFrame();
    const nextState = createColumnCustomDragResetState();
    customDraggingKeyRef.current = nextState.draggingKey;
    customDragHoverRef.current = nextState.dragHover;
    setCustomDragState(nextState.dragState);
  }, [clearCustomMoveFrame]);

  const autoScrollCustomBody = useCallback((clientY: number) => {
    const body = customBodyRef.current;
    if (!body) {
      return;
    }
    const rect = body.getBoundingClientRect();
    if (rect.height <= 0) {
      return;
    }
    const nextScrollTop = resolveColumnCustomAutoScrollTop({
      clientY,
      containerBottom: rect.bottom,
      containerHeight: rect.height,
      containerTop: rect.top,
      scrollTop: body.scrollTop,
    });

    if (nextScrollTop !== body.scrollTop) {
      body.scrollTop = nextScrollTop;
    }
  }, []);

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
      content: localeText.search,
    },
    wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
  });

  useEffect(() => {
    syncAdminTableReactWithPreferences();
  }, []);

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
    if (
      latestPropsRef.current &&
      shallowEqualObjectRecord(
        latestPropsRef.current as Record<string, any>,
        nextProps as Record<string, any>
      )
    ) {
      return;
    }
    latestPropsRef.current = nextProps as AdminTableReactProps<TData, TFormValues>;
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
      pageSizeOptions: resolveTablePagerPageSizes(
        tableState.gridOptions?.pagerConfig?.pageSizes
      ).map((item) => String(item)),
    }));
  }, [tableState.gridOptions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const media = window.matchMedia('(max-width: 768px)');
    const update = () => {
      setMobile(media.matches);
    };
    update();
    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', update);
      return () => {
        media.removeEventListener('change', update);
      };
    }
    media.addListener(update);
    return () => {
      media.removeListener(update);
    };
  }, []);

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

  useEffect(() => {
    formApi.setState((prev) => ({
      ...prev,
      submitButtonOptions: {
        ...(prev?.submitButtonOptions ?? {}),
        content: localeText.search,
      },
    }));
  }, [formApi, localeText.search]);

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

  const executeProxy = useCallback(
    async (
      mode: 'query' | 'reload',
      params: Record<string, any>,
      context?: {
        page?: {
          current?: number;
          pageSize?: number;
        };
        sort?: {
          field?: string;
          order?: SortOrder;
        };
      }
    ) => {
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

    const nextCurrent = mode === 'reload'
      ? 1
      : context?.page?.current ?? currentPagination.current ?? 1;
    const nextPageSize = context?.page?.pageSize ?? currentPagination.pageSize ?? 20;
    const nextSortField = context?.sort?.field ?? currentSortState.field;
    const nextSortOrder = context?.sort?.order ?? currentSortState.order;

    setLoading(true);
    try {
      const result = await handler(
        {
          page: {
            currentPage: nextCurrent,
            pageSize: nextPageSize,
          },
          sort: {
            field: nextSortField,
            order:
              nextSortOrder === 'ascend'
                ? 'asc'
                : nextSortOrder === 'descend'
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
    },
    [setupState.defaultGridOptions]
  );

  useEffect(() => {
    editingRowKeyRef.current = editingRowKey;
  }, [editingRowKey]);

  useEffect(() => {
    rowKeyFieldRef.current = rowKeyField;
  }, [rowKeyField]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!maximized) {
      return undefined;
    }
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [maximized]);

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
    const merged = mergeWithArrayOverride(
      tableState.gridOptions ?? {},
      setupState.defaultGridOptions as AntdGridOptions<TData>
    ) as AntdGridOptions<TData>;
    const runtimeColumns = ensureSeqColumn(
      merged.columns ?? [],
      merged.seqColumn,
      {
        title: localeText.seq,
      }
    ) as AntdGridOptions<TData>['columns'];

    if (runtimeColumns !== merged.columns) {
      merged.columns = runtimeColumns;
    }
    return merged;
  }, [localeText.seq, setupState.defaultGridOptions, tableState.gridOptions]);

  const columnCustomPersistenceConfig = useMemo(() => {
    return resolveColumnCustomPersistenceConfig(
      mergedGridOptions as Record<string, any>,
      mergedGridOptions.columns ?? []
    );
  }, [mergedGridOptions.columnCustomPersistence, mergedGridOptions.columns]);

  const externalColumnCustomState = useMemo(() => {
    const external = resolveColumnCustomState(mergedGridOptions as Record<string, any>);
    if (hasColumnCustomSnapshot(external)) {
      return external;
    }
    return readColumnCustomStateFromStorage(columnCustomPersistenceConfig);
  }, [columnCustomPersistenceConfig, mergedGridOptions.columnCustomState]);

  const getCurrentColumnCustomState = useCallback(() => {
    return {
      filterable: filterableColumns,
      fixed: fixedColumns,
      order: columnOrder,
      sortable: sortableColumns,
      visible: visibleColumns,
    };
  }, [columnOrder, filterableColumns, fixedColumns, sortableColumns, visibleColumns]);

  const getDraftColumnCustomState = useCallback(() => {
    return {
      filterable: customDraftFilterableColumns,
      fixed: customDraftFixedColumns,
      order: customDraftOrder,
      sortable: customDraftSortableColumns,
      visible: customDraftVisibleColumns,
    };
  }, [
    customDraftFilterableColumns,
    customDraftFixedColumns,
    customDraftOrder,
    customDraftSortableColumns,
    customDraftVisibleColumns,
  ]);

  const applyCurrentColumnCustomSnapshot = useCallback(
    (snapshot: ReturnType<typeof resolveColumnCustomWorkingSnapshot>) => {
      setVisibleColumns((prev) => {
        return deepEqual(prev, snapshot.visible) ? prev : snapshot.visible;
      });
      setFilterableColumns((prev) => {
        return deepEqual(prev, snapshot.filterable) ? prev : snapshot.filterable;
      });
      setFixedColumns((prev) => {
        return deepEqual(prev, snapshot.fixed) ? prev : snapshot.fixed;
      });
      setColumnOrder((prev) => {
        return deepEqual(prev, snapshot.order) ? prev : snapshot.order;
      });
      setSortableColumns((prev) => {
        return deepEqual(prev, snapshot.sortable) ? prev : snapshot.sortable;
      });
    },
    []
  );

  const applyDraftColumnCustomSnapshot = useCallback(
    (snapshot: ReturnType<typeof resolveColumnCustomWorkingSnapshot>) => {
      setCustomDraftVisibleColumns((prev) => {
        return deepEqual(prev, snapshot.visible) ? prev : snapshot.visible;
      });
      setCustomDraftFixedColumns((prev) => {
        return deepEqual(prev, snapshot.fixed) ? prev : snapshot.fixed;
      });
      setCustomDraftOrder((prev) => {
        return deepEqual(prev, snapshot.order) ? prev : snapshot.order;
      });
      setCustomDraftSortableColumns((prev) => {
        return deepEqual(prev, snapshot.sortable) ? prev : snapshot.sortable;
      });
      setCustomDraftFilterableColumns((prev) => {
        return deepEqual(prev, snapshot.filterable) ? prev : snapshot.filterable;
      });
    },
    []
  );

  useEffect(() => {
    const snapshot = resolveColumnCustomWorkingSnapshot(
      mergedGridOptions.columns ?? [],
      {
        current: getCurrentColumnCustomState(),
        external: externalColumnCustomState,
      }
    );
    applyCurrentColumnCustomSnapshot(snapshot);
  }, [
    applyCurrentColumnCustomSnapshot,
    externalColumnCustomState,
    getCurrentColumnCustomState,
    mergedGridOptions.columns,
  ]);

  useEffect(() => {
    if (customPanelOpen) {
      return;
    }
    const snapshot = resolveColumnCustomOpenSnapshot(
      mergedGridOptions.columns ?? [],
      getCurrentColumnCustomState()
    );
    applyDraftColumnCustomSnapshot(snapshot);
  }, [
    applyDraftColumnCustomSnapshot,
    customPanelOpen,
    getCurrentColumnCustomState,
    mergedGridOptions.columns,
  ]);

  const runtimeSlots = props.slots ?? tableState.slots;
  const runtimeTableTitle = props.tableTitle ?? tableState.tableTitle;
  const runtimeTableTitleHelp = props.tableTitleHelp ?? tableState.tableTitleHelp;
  const runtimeClassName = props.class ?? tableState.class;
  const runtimeFormOptions = props.formOptions ?? tableState.formOptions;
  const runtimeShowSearchForm = props.showSearchForm ?? tableState.showSearchForm;
  const runtimeGridEvents = props.gridEvents ?? tableState.gridEvents;

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
  const flattenedDataSource = useMemo(
    () => flattenTableRows(computedDataSource),
    [computedDataSource]
  );
  const rowIndexByComparableKey = useMemo(() => {
    const map = new Map<string, number>();
    flattenedDataSource.forEach((row, index) => {
      const comparable = toTableComparableSelectionKey(
        row?.[rowKeyField] as Key
      );
      if (comparable !== null && !map.has(comparable)) {
        map.set(comparable, index);
      }
    });
    return map;
  }, [flattenedDataSource, rowKeyField]);
  useEffect(() => {
    visibleDataSourceRef.current = computedDataSource;
  }, [computedDataSource]);
  const defaultColumnFilterOptionsCacheRef = useRef(
    new Map<
      string,
      {
        emptyLabel: string;
        rows: TData[];
        options: ReturnType<typeof buildDefaultColumnFilterOptions>;
      }
    >()
  );
  const resolveDefaultColumnFilterOptions = useCallback(
    (field: string) => {
      const cache = defaultColumnFilterOptionsCacheRef.current;
      const cached = cache.get(field);
      if (
        cached?.rows === dataSource &&
        cached.emptyLabel === localeText.emptyValue
      ) {
        return cached.options;
      }
      const options = buildDefaultColumnFilterOptions(
        dataSource as Array<Record<string, any>>,
        field,
        {
          emptyLabel: localeText.emptyValue,
        }
      );
      cache.set(field, {
        emptyLabel: localeText.emptyValue,
        options,
        rows: dataSource,
      });
      return options;
    },
    [dataSource, localeText.emptyValue]
  );
  const resolveRowStrategy = useMemo(() => {
    const gridOptions = mergedGridOptions as Record<string, any>;
    const cache = new WeakMap<
      Record<string, any>,
      Map<number, ReturnType<typeof resolveTableRowStrategyResult>>
    >();
    return (record: TData, rowIndex: number) => {
      if (!record || typeof record !== 'object') {
        return resolveTableRowStrategyResult({
          gridOptions,
          row: (record ?? {}) as Record<string, any>,
          rowIndex,
        });
      }
      let rowCache = cache.get(record as Record<string, any>);
      if (!rowCache) {
        rowCache = new Map<number, ReturnType<typeof resolveTableRowStrategyResult>>();
        cache.set(record as Record<string, any>, rowCache);
      }
      if (rowCache.has(rowIndex)) {
        return rowCache.get(rowIndex);
      }
      const resolved = resolveTableRowStrategyResult({
        gridOptions,
        row: record as Record<string, any>,
        rowIndex,
      });
      rowCache.set(rowIndex, resolved);
      return resolved;
    };
  }, [computedDataSource, mergedGridOptions.rowStrategy, mergedGridOptions.strategy]);

  const sourceColumns = mergedGridOptions.columns ?? [];
  const selectionMode = useMemo(
    () => resolveSelectionMode(mergedGridOptions, sourceColumns),
    [
      mergedGridOptions.checkboxConfig,
      mergedGridOptions.radioConfig,
      mergedGridOptions.rowSelection,
      sourceColumns,
    ]
  );
  const selectionColumn = useMemo(
    () =>
      resolveSelectionColumn(
        sourceColumns as Array<Record<string, any>>,
        selectionMode
      ),
    [selectionMode, sourceColumns]
  );
  const selectionConfig = selectionMode === 'radio'
    ? mergedGridOptions.radioConfig
    : selectionMode === 'checkbox'
      ? mergedGridOptions.checkboxConfig
      : undefined;
  const rowSelectionConfig = mergedGridOptions.rowSelection as
    | (Record<string, any> & {
        checkField?: string;
        checkMethod?: (ctx: { row: TData; rowIndex: number }) => boolean;
        strict?: boolean;
        trigger?: string;
      })
    | undefined;
  const selectionCheckField = useMemo(() => {
    const value = typeof selectionConfig?.checkField === 'string'
      ? selectionConfig.checkField
      : rowSelectionConfig?.checkField;
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : undefined;
  }, [rowSelectionConfig?.checkField, selectionConfig?.checkField]);
  const selectionCheckMethod = useMemo(() => {
    if (typeof selectionConfig?.checkMethod === 'function') {
      return selectionConfig.checkMethod;
    }
    if (typeof rowSelectionConfig?.checkMethod === 'function') {
      return rowSelectionConfig.checkMethod;
    }
    return undefined;
  }, [rowSelectionConfig?.checkMethod, selectionConfig?.checkMethod]);
  const selectionTriggerByRow = useMemo(() => {
    const trigger = selectionConfig?.trigger ?? rowSelectionConfig?.trigger;
    return trigger === 'row';
  }, [rowSelectionConfig?.trigger, selectionConfig?.trigger]);
  const selectionStrict = useMemo(() => {
    if (selectionMode !== 'radio') {
      return true;
    }
    const configStrict = resolveBooleanOption(selectionConfig?.strict);
    if (typeof configStrict === 'boolean') {
      return configStrict;
    }
    const rowSelectionStrict = resolveBooleanOption(rowSelectionConfig?.strict);
    if (typeof rowSelectionStrict === 'boolean') {
      return rowSelectionStrict;
    }
    return true;
  }, [
    rowSelectionConfig?.strict,
    selectionConfig?.strict,
    selectionMode,
  ]);
  const selectionHighlight = useMemo(() => {
    const rowSelectionHighlight = resolveBooleanOption(
      rowSelectionConfig?.highlight
    );
    const configHighlight = resolveBooleanOption(selectionConfig?.highlight);
    return configHighlight ?? rowSelectionHighlight ?? !!selectionMode;
  }, [
    rowSelectionConfig?.highlight,
    selectionConfig?.highlight,
    selectionMode,
  ]);
  const controlledSelectedKeys = useMemo(() => {
    const keys = mergedGridOptions.rowSelection?.selectedRowKeys;
    if (!selectionMode || !Array.isArray(keys)) {
      return undefined;
    }
    return normalizeTableSelectionKeys<Key>(keys as Key[], selectionMode);
  }, [mergedGridOptions.rowSelection?.selectedRowKeys, selectionMode]);
  const defaultSelectedKeys = useMemo(() => {
    const keys = mergedGridOptions.rowSelection?.defaultSelectedRowKeys;
    if (!selectionMode || !Array.isArray(keys)) {
      return [];
    }
    return normalizeTableSelectionKeys<Key>(keys as Key[], selectionMode);
  }, [mergedGridOptions.rowSelection?.defaultSelectedRowKeys, selectionMode]);
  const isSelectionControlled = !!controlledSelectedKeys;
  const effectiveSelectedRowKeys = selectionMode
    ? (controlledSelectedKeys ?? innerSelectedRowKeys)
    : [];
  const effectiveSelectedKeySet = useMemo(
    () => createTableComparableSelectionKeySet(effectiveSelectedRowKeys),
    [effectiveSelectedRowKeys]
  );

  useEffect(() => {
    if (previousSelectionModeRef.current !== selectionMode) {
      previousSelectionModeRef.current = selectionMode;
      hasAppliedDefaultSelectionRef.current = false;
    }
    if (!selectionMode) {
      setInnerSelectedRowKeys([]);
      hasAppliedDefaultSelectionRef.current = false;
      return;
    }
    if (isSelectionControlled && controlledSelectedKeys) {
      setInnerSelectedRowKeys((prev) =>
        deepEqual(prev, controlledSelectedKeys) ? prev : controlledSelectedKeys
      );
      hasAppliedDefaultSelectionRef.current = true;
      return;
    }
    if (selectionCheckField) {
      const keys = collectSelectionKeysByField(
        dataSource,
        {
          checkField: selectionCheckField,
          keyField: rowKeyField,
          mode: selectionMode,
        }
      );
      setInnerSelectedRowKeys((prev) => (deepEqual(prev, keys) ? prev : keys));
      hasAppliedDefaultSelectionRef.current = true;
      return;
    }
    if (!hasAppliedDefaultSelectionRef.current) {
      hasAppliedDefaultSelectionRef.current = true;
      setInnerSelectedRowKeys((prev) =>
        deepEqual(prev, defaultSelectedKeys) ? prev : defaultSelectedKeys
      );
    }
  }, [
    controlledSelectedKeys,
    dataSource,
    defaultSelectedKeys,
    isSelectionControlled,
    rowKeyField,
    selectionCheckField,
    selectionMode,
  ]);

  const columns = useMemo(() => {
    const seqOffset = mergedGridOptions.pagerConfig?.enabled === false
      ? 0
      : ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 20);
    const list = buildColumnRuntimeItems(
      sourceColumns,
      {
        filterable: filterableColumns,
        fixed: fixedColumns,
        order: columnOrder,
        sortable: sortableColumns,
        visible: visibleColumns,
      },
      {
        includeVisibilityFlags: false,
      }
    )
      .filter((item) => item.visible)
      .filter((item) => !isSelectionColumnTypeColumn(item.column));

    const mergedGridOptionsRecord = mergedGridOptions as Record<string, any>;
    const cellStrategyCache = new WeakMap<
      Record<string, any>,
      Map<string, ReturnType<typeof resolveTableCellStrategyResult>>
    >();
    const rowCellStyleCache = new WeakMap<
      Record<string, any>,
      Map<number, CSSProperties | undefined>
    >();
    const resolveRowCellStyle = (
      record: TData,
      rowIndex: number
    ): CSSProperties | undefined => {
      const toRowCellStyle = (rowStyle?: Record<string, any>) => {
        if (!rowStyle) {
          return undefined;
        }
        const nextStyle: CSSProperties = {};
        if (
          rowStyle.backgroundColor !== undefined &&
          rowStyle.backgroundColor !== null &&
          rowStyle.backgroundColor !== ''
        ) {
          nextStyle.backgroundColor = rowStyle.backgroundColor;
        }
        if (rowStyle.color !== undefined && rowStyle.color !== null && rowStyle.color !== '') {
          nextStyle.color = rowStyle.color;
        }
        if (
          rowStyle.fontWeight !== undefined &&
          rowStyle.fontWeight !== null &&
          rowStyle.fontWeight !== ''
        ) {
          nextStyle.fontWeight = rowStyle.fontWeight;
        }
        return Object.keys(nextStyle).length > 0 ? nextStyle : undefined;
      };

      const rowRecord = record as Record<string, any>;
      if (!rowRecord || typeof rowRecord !== 'object') {
        const rowStrategyResult = resolveRowStrategy(record, rowIndex);
        return toRowCellStyle(
          (rowStrategyResult?.style as Record<string, any> | undefined) ?? undefined
        );
      }
      let rowCache = rowCellStyleCache.get(rowRecord);
      if (!rowCache) {
        rowCache = new Map<number, CSSProperties | undefined>();
        rowCellStyleCache.set(rowRecord, rowCache);
      }
      if (rowCache.has(rowIndex)) {
        return rowCache.get(rowIndex);
      }
      const rowStrategyResult = resolveRowStrategy(record, rowIndex);
      const resolved = toRowCellStyle(
        (rowStrategyResult?.style as Record<string, any> | undefined) ?? undefined
      );
      rowCache.set(rowIndex, resolved);
      return resolved;
    };

    return list.map(({ column, key }) => {
      if (isSeqColumnTypeColumn(column)) {
        return {
          ...column,
          align: column.align ?? 'center',
          key: column.key ?? key ?? '__admin-table-seq',
          sorter: undefined,
          title: column.title ?? localeText.seq,
          width: column.width ?? 60,
          render: (_value: any, _record: TData, rowIndex: number) => seqOffset + rowIndex + 1,
        };
      }
      const dataIndex = String(column.dataIndex ?? column.field ?? '');
      const columnSorter =
        column.sortable === false
          ? undefined
          : column.sortable === true
            ? (column.sorter ?? true)
            : column.sorter;
      const filterable = column.filterable !== false;
      const hasFilterConfig =
        Array.isArray(column.filters) ||
        typeof column.filterDropdown === 'function' ||
        typeof column.onFilter === 'function';
      const defaultFilters =
        filterable && !hasFilterConfig && dataIndex
          ? resolveDefaultColumnFilterOptions(dataIndex)
          : [];
      const filters = filterable
        ? Array.isArray(column.filters)
          ? column.filters
          : defaultFilters.map((item) => ({
            text: item.label,
            value: item.value,
          }))
        : undefined;
      const onFilter = filterable
        ? typeof column.onFilter === 'function'
          ? column.onFilter
          : defaultFilters.length > 0 && dataIndex
            ? (filterValue: any, record: TData) => {
              const rowValue = getColumnValueByPath(
                record as Record<string, any>,
                dataIndex
              );
              return getColumnFilterValueKey(rowValue) === String(filterValue);
            }
            : undefined
        : undefined;
      const resolveCellStrategy = (record: TData, rowIndex: number, value: any) => {
        if (!dataIndex) {
          return undefined;
        }
        const rowRecord = record as Record<string, any>;
        if (!rowRecord || typeof rowRecord !== 'object') {
          return resolveTableCellStrategyResult({
            column: column as Record<string, any>,
            field: dataIndex,
            gridOptions: mergedGridOptionsRecord,
            row: rowRecord,
            rowIndex,
            value,
          });
        }
        let rowCache = cellStrategyCache.get(rowRecord);
        if (!rowCache) {
          rowCache = new Map<string, ReturnType<typeof resolveTableCellStrategyResult>>();
          cellStrategyCache.set(rowRecord, rowCache);
        }
        const cacheKey = `${dataIndex}:${rowIndex}`;
        if (rowCache.has(cacheKey)) {
          return rowCache.get(cacheKey);
        }
        const resolved = resolveTableCellStrategyResult({
          column: column as Record<string, any>,
          field: dataIndex,
          gridOptions: mergedGridOptionsRecord,
          row: rowRecord,
          rowIndex,
          value,
        });
        rowCache.set(cacheKey, resolved);
        return resolved;
      };

      return {
        ...column,
        dataIndex,
        defaultFilteredValue: filterable ? column.defaultFilteredValue : undefined,
        filterDropdown: filterable ? column.filterDropdown : undefined,
        filterIcon: filterable ? column.filterIcon : undefined,
        filterMode: filterable ? column.filterMode : undefined,
        filterSearch: filterable ? column.filterSearch : undefined,
        filteredValue: filterable ? column.filteredValue : undefined,
        filters,
        fixed: column.fixed,
        key: column.key ?? key ?? dataIndex ?? String(column.title),
        onFilter,
        sorter: columnSorter,
        sortOrder: columnSorter && sortState.field === dataIndex ? sortState.order : undefined,
        onCell: (record: TData, rowIndex?: number) => {
          const sourceOnCell = typeof column.onCell === 'function'
            ? (column.onCell(record, rowIndex ?? -1) ?? {})
            : {};
          const sourceStyle =
            typeof (sourceOnCell as Record<string, any>).style === 'object' &&
            (sourceOnCell as Record<string, any>).style
              ? ((sourceOnCell as Record<string, any>).style as Record<string, any>)
              : undefined;
          const sourceOnClick =
            typeof (sourceOnCell as Record<string, any>).onClick === 'function'
              ? (sourceOnCell as Record<string, any>).onClick
              : undefined;
          const sourceOnDoubleClick =
            typeof (sourceOnCell as Record<string, any>).onDoubleClick === 'function'
              ? (sourceOnCell as Record<string, any>).onDoubleClick
              : undefined;
          const trigger = mergedGridOptions.editConfig?.trigger ?? 'click';
          const clickEventName = trigger === 'dblclick' ? 'onDoubleClick' : 'onClick';
          const editable = !!column.editRender;
          const strategyResult = resolveCellStrategy(
            record,
            rowIndex ?? -1,
            dataIndex ? getColumnValueByPath(record as Record<string, any>, dataIndex) : undefined
          );
          const rowCellStyle = resolveRowCellStyle(record, rowIndex ?? -1);
          const strategyClassName =
            strategyResult?.clickable || strategyResult?.onClick
              ? 'admin-table__strategy-clickable'
              : '';

          const runEditTrigger = () => {
            if (!editable) return;
            const key = record[rowKeyField];
            if (mergedGridOptions.editConfig?.mode === 'row') {
              setEditingRowKey(key);
            } else {
              setEditingCell({ rowKey: key, dataIndex });
            }
          };

          return {
            ...(sourceOnCell as Record<string, any>),
            className: [
              (sourceOnCell as Record<string, any>).className ?? '',
              strategyClassName,
            ]
              .filter(Boolean)
              .join(' '),
            style: {
              ...(sourceStyle ?? {}),
              ...(rowCellStyle ?? {}),
            },
            [clickEventName]: (event: any) => {
              const sourceHandler = clickEventName === 'onClick'
                ? sourceOnClick
                : sourceOnDoubleClick;
              sourceHandler?.(event);
              if (event?.defaultPrevented) {
                return;
              }
              const triggerResult = triggerTableCellStrategyClick({
                column: column as Record<string, any>,
                event,
                field: dataIndex,
                row: record as Record<string, any>,
                rowIndex: rowIndex ?? -1,
                strategyResult,
              });
              if (triggerResult.blocked) {
                return;
              }
              if (!editable) return;
              runEditTrigger();
            },
          };
        },
        render: (value: any, record: TData, rowIndex: number) => {
          const strategyResult = resolveCellStrategy(record, rowIndex, value);
          const strategyValue = strategyResult
            ? strategyResult.value
            : (dataIndex ? getColumnValueByPath(record as Record<string, any>, dataIndex) : value);
          const rowKey = record[rowKeyField];
          const inRowEdit = mergedGridOptions.editConfig?.mode === 'row' && rowKey === editingRowKey;
          const inCellEdit =
            mergedGridOptions.editConfig?.mode === 'cell' &&
            editingCell?.rowKey === rowKey &&
            editingCell?.dataIndex === dataIndex;

          if ((inRowEdit || inCellEdit) && column.editRender?.name === 'input' && dataIndex) {
            return (
              <Input
                value={getColumnValueByPath(record, dataIndex) as any}
                onChange={(event) => {
                  setColumnValueByPath(record, dataIndex, event.target.value);
                  setDataSource((prev) => [...prev]);
                }}
              />
            );
          }

          const slotName = column.slots?.default;
          if (slotName) {
            const slotResult = resolveSlot(runtimeSlots, slotName, {
              row: record,
              value: strategyValue,
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
                value: strategyValue,
              });
            }
          }

          const formatter = column.formatter;
          if (formatter) {
            const currentValue = strategyValue;
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

          const content = strategyResult?.hasDisplayOverride
            ? strategyResult.displayValue
            : strategyValue;

          if (
            strategyResult &&
            (
              !!strategyResult.className ||
              !!strategyResult.style ||
              strategyResult.clickable
            )
          ) {
            return (
              <span
                className={[
                  'admin-table__strategy-cell',
                  strategyResult.className,
                ].filter(Boolean).join(' ')}
                style={strategyResult.style as CSSProperties | undefined}
              >
                {content as any}
              </span>
            );
          }

          return content;
        },
      };
    });
  }, [
    columnOrder,
    filterableColumns,
    mergedGridOptions.editConfig,
    mergedGridOptions.pagerConfig?.enabled,
    mergedGridOptions.strategy,
    mergedGridOptions.cellStrategy,
    localeText.seq,
    pagination.current,
    pagination.pageSize,
    rowKeyField,
    editingRowKey,
    editingCell,
    fixedColumns,
    sortState,
    sourceColumns,
    sortableColumns,
    runtimeSlots,
    resolveDefaultColumnFilterOptions,
    resolveRowStrategy,
    visibleColumns,
  ]);

  const toolbarConfig = mergedGridOptions.toolbarConfig ?? {};
  const toolbarActionsSlot = resolveSlot(runtimeSlots, 'toolbar-actions');
  const toolbarCenterSlot = resolveSlot(runtimeSlots, 'toolbar-center');
  const toolbarToolsSlot = resolveSlot(runtimeSlots, 'toolbar-tools');
  const resolvedToolbarHint = useMemo(
    () => resolveToolbarHintConfig(toolbarConfig.hint),
    [toolbarConfig.hint]
  );
  const hasToolbarCenterSlot = !!toolbarCenterSlot;
  const showToolbarCenter = hasToolbarCenterSlot || !!resolvedToolbarHint;
  const toolbarHintClassName = [
    'admin-table__toolbar-center',
    `is-${resolvedToolbarHint?.align ?? 'center'}`,
    resolvedToolbarHint?.overflow === 'scroll' ? 'is-scroll' : 'is-wrap',
  ].join(' ');
  const toolbarHintTextStyle = useMemo(() => {
    if (!resolvedToolbarHint) {
      return undefined;
    }
    const style: CSSProperties & Record<string, string> = {};
    if (resolvedToolbarHint.color) {
      style.color = resolvedToolbarHint.color;
    }
    if (resolvedToolbarHint.fontSize) {
      style.fontSize = resolvedToolbarHint.fontSize;
    }
    if (resolvedToolbarHint.overflow === 'scroll') {
      style['--admin-table-toolbar-hint-duration'] = `${resolvedToolbarHint.speed}s`;
    }
    return style;
  }, [
    resolvedToolbarHint?.color,
    resolvedToolbarHint?.fontSize,
    resolvedToolbarHint?.overflow,
    resolvedToolbarHint?.speed,
  ]);
  const toolbarToolsPosition = resolveToolbarInlinePosition(
    toolbarConfig.toolsPosition,
    'after'
  );
  const toolbarToolsSlotPosition = resolveToolbarToolsSlotPosition(
    toolbarConfig.toolsSlotPosition
  );
  const hasToolbarToolsSlot = !!toolbarToolsSlot;
  const hasToolbarToolsSlotReplaceBuiltin =
    hasToolbarToolsSlot && toolbarToolsSlotPosition === 'replace';
  const hasToolbarToolsSlotBeforeBuiltin =
    hasToolbarToolsSlot && toolbarToolsSlotPosition === 'before';
  const hasToolbarToolsSlotAfterBuiltin =
    hasToolbarToolsSlot && toolbarToolsSlotPosition !== 'before';
  const builtinToolbarTools = useMemo(() => {
    return buildBuiltinToolbarTools(toolbarConfig, localeText, {
      hasToolbarToolsSlot: hasToolbarToolsSlotReplaceBuiltin,
      maximized,
    });
  }, [
    hasToolbarToolsSlotReplaceBuiltin,
    maximized,
    localeText.custom,
    localeText.refresh,
    localeText.zoomIn,
    localeText.zoomOut,
    toolbarConfig.custom,
    toolbarConfig.refresh,
    toolbarConfig.zoom,
  ]);
  const pagerExportConfig = useMemo(
    () =>
      resolveTablePagerExportConfig<TData>(
        mergedGridOptions.pagerConfig?.exportConfig as any,
        localeText
      ),
    [
      localeText.export,
      localeText.exportAll,
      localeText.exportCurrentPage,
      localeText.exportSelected,
      mergedGridOptions.pagerConfig?.exportConfig,
    ]
  );
  const pagerExportActions = useMemo<
    Array<ResolvedTablePagerExportAction<TData>>
  >(
    () =>
      (pagerExportConfig?.options ?? [])
        .filter((action) =>
          resolveToolbarToolVisibility(action as Record<string, any>, {
            accessCodes: setupState.accessCodes,
            accessRoles: setupState.accessRoles,
            permissionChecker: setupState.permissionChecker,
          })
        )
        .map((action) => ({ ...action })),
    [
      pagerExportConfig?.options,
      setupState.accessCodes,
      setupState.accessRoles,
      setupState.permissionChecker,
    ]
  );
  const pagerExportSingleAction =
    pagerExportActions.length === 1
      ? pagerExportActions[0]
      : undefined;
  const pagerConfigRecord = (mergedGridOptions.pagerConfig ?? {}) as Record<string, any>;
  const pagerPosition = pagerConfigRecord.position === 'left' ? 'left' : 'right';
  const pagerToolbarConfig = useMemo(() => {
    const source = (pagerConfigRecord.toolbar ??
      pagerConfigRecord.toolbarConfig) as Record<string, any> | undefined;
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return {} as Record<string, any>;
    }
    return source;
  }, [pagerConfigRecord.toolbar, pagerConfigRecord.toolbarConfig]);
  const pagerLeftSlot = resolveSlot(runtimeSlots, 'pager-left');
  const pagerCenterSlot = resolveSlot(runtimeSlots, 'pager-center');
  const pagerToolsSlot = resolveSlot(runtimeSlots, 'pager-tools');
  const resolvedPagerHint = useMemo(
    () => resolveToolbarHintConfig(pagerToolbarConfig.hint),
    [pagerToolbarConfig.hint]
  );
  const hasPagerCenterSlot = !!pagerCenterSlot;
  const showPagerCenter = hasPagerCenterSlot || !!resolvedPagerHint;
  const pagerHintClassName = [
    'admin-table__toolbar-center',
    'admin-table__pager-bar-center',
    `is-${resolvedPagerHint?.align ?? 'center'}`,
    resolvedPagerHint?.overflow === 'scroll' ? 'is-scroll' : 'is-wrap',
  ].join(' ');
  const pagerHintTextStyle = useMemo(() => {
    if (!resolvedPagerHint) {
      return undefined;
    }
    const style: CSSProperties & Record<string, string> = {};
    if (resolvedPagerHint.color) {
      style.color = resolvedPagerHint.color;
    }
    if (resolvedPagerHint.fontSize) {
      style.fontSize = resolvedPagerHint.fontSize;
    }
    if (resolvedPagerHint.overflow === 'scroll') {
      style['--admin-table-toolbar-hint-duration'] = `${resolvedPagerHint.speed}s`;
    }
    return style;
  }, [
    resolvedPagerHint?.color,
    resolvedPagerHint?.fontSize,
    resolvedPagerHint?.overflow,
    resolvedPagerHint?.speed,
  ]);
  const pagerLeftToolsPosition = resolveToolbarInlinePosition(
    pagerToolbarConfig.leftToolsPosition,
    'before'
  );
  const pagerLeftToolsSlotPosition = resolveToolbarToolsSlotPosition(
    pagerToolbarConfig.leftToolsSlotPosition
  );
  const hasPagerLeftSlot = !!pagerLeftSlot;
  const hasPagerLeftSlotReplaceTools =
    hasPagerLeftSlot && pagerLeftToolsSlotPosition === 'replace';
  const hasPagerLeftSlotBeforeTools =
    hasPagerLeftSlot && pagerLeftToolsSlotPosition === 'before';
  const hasPagerLeftSlotAfterTools =
    hasPagerLeftSlot && pagerLeftToolsSlotPosition !== 'before';
  const pagerLeftTools = useMemo(
    () =>
      resolveVisibleToolbarActionTools({
        accessCodes: setupState.accessCodes,
        accessRoles: setupState.accessRoles,
        maximized,
        permissionChecker: setupState.permissionChecker,
        showSearchForm: runtimeShowSearchForm,
        tools: pagerToolbarConfig.leftTools,
      }),
    [
      maximized,
      pagerToolbarConfig.leftTools,
      runtimeShowSearchForm,
      setupState.accessCodes,
      setupState.accessRoles,
      setupState.permissionChecker,
    ]
  );
  const pagerLeftToolsBeforeSlot = useMemo(
    () => (pagerLeftToolsPosition === 'before' ? pagerLeftTools : []),
    [pagerLeftTools, pagerLeftToolsPosition]
  );
  const pagerLeftToolsAfterSlot = useMemo(
    () => (pagerLeftToolsPosition === 'before' ? [] : pagerLeftTools),
    [pagerLeftTools, pagerLeftToolsPosition]
  );
  const pagerRightToolsSource = useMemo(() => {
    if (Array.isArray(pagerToolbarConfig.rightTools)) {
      return pagerToolbarConfig.rightTools;
    }
    return pagerToolbarConfig.tools;
  }, [pagerToolbarConfig.rightTools, pagerToolbarConfig.tools]);
  const pagerRightToolsPosition = resolveToolbarInlinePosition(
    pagerToolbarConfig.rightToolsPosition ?? pagerToolbarConfig.toolsPosition,
    'before'
  );
  const pagerRightToolsSlotPosition = resolveToolbarToolsSlotPosition(
    pagerToolbarConfig.rightToolsSlotPosition ??
      pagerToolbarConfig.toolsSlotPosition
  );
  const hasPagerToolsSlot = !!pagerToolsSlot;
  const hasPagerToolsSlotReplaceTools =
    hasPagerToolsSlot && pagerRightToolsSlotPosition === 'replace';
  const hasPagerToolsSlotBeforeTools =
    hasPagerToolsSlot && pagerRightToolsSlotPosition === 'before';
  const hasPagerToolsSlotAfterTools =
    hasPagerToolsSlot && pagerRightToolsSlotPosition !== 'before';
  const pagerRightTools = useMemo(
    () =>
      resolveVisibleToolbarActionTools({
        accessCodes: setupState.accessCodes,
        accessRoles: setupState.accessRoles,
        maximized,
        permissionChecker: setupState.permissionChecker,
        showSearchForm: runtimeShowSearchForm,
        tools: pagerRightToolsSource,
      }),
    [
      maximized,
      pagerRightToolsSource,
      runtimeShowSearchForm,
      setupState.accessCodes,
      setupState.accessRoles,
      setupState.permissionChecker,
    ]
  );
  const pagerRightToolsBeforeBuiltin = useMemo(
    () => (pagerRightToolsPosition === 'before' ? pagerRightTools : []),
    [pagerRightTools, pagerRightToolsPosition]
  );
  const pagerRightToolsAfterBuiltin = useMemo(
    () => (pagerRightToolsPosition === 'before' ? [] : pagerRightTools),
    [pagerRightTools, pagerRightToolsPosition]
  );

  const customColumnControls = useMemo(() => {
    return buildColumnCustomControls(mergedGridOptions.columns ?? [], {
      filterable: customDraftFilterableColumns,
      fixed: customDraftFixedColumns,
      order: customDraftOrder,
      sortable: customDraftSortableColumns,
      visible: customDraftVisibleColumns,
    });
  }, [
    customDraftFilterableColumns,
    customDraftFixedColumns,
    customDraftOrder,
    customDraftSortableColumns,
    customDraftVisibleColumns,
    mergedGridOptions.columns,
  ]);
  const customColumnControlOrderDigest = useMemo(
    () => createColumnCustomControlsOrderDigest(customColumnControls),
    [customColumnControls]
  );

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!customPanelOpen) {
      customRowRectsRef.current.clear();
      clearCustomMoveFrame();
      if (customRowAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(customRowAnimationFrameRef.current);
        customRowAnimationFrameRef.current = null;
      }
      resetColumnCustomFlipTransforms(Object.values(customRowRefs.current));
      return;
    }

    const nextRects = collectColumnCustomFlipRects({
      controls: customColumnControls,
      resolveNode: (key) => customRowRefs.current[key],
    });

    const prevRects = customRowRectsRef.current;
    if (prevRects.size > 0) {
      const flipOffsets = collectColumnCustomFlipOffsets({
        controls: customColumnControls,
        draggingKey: customDraggingKeyRef.current,
        nextRects,
        prevRects,
      });
      const movedNodes = applyColumnCustomFlipOffsets({
        offsets: flipOffsets,
        resolveNode: (key) => customRowRefs.current[key],
      });

      if (movedNodes.length > 0) {
        forceColumnCustomFlipReflow(movedNodes);

        if (customRowAnimationFrameRef.current !== null) {
          window.cancelAnimationFrame(customRowAnimationFrameRef.current);
        }
        customRowAnimationFrameRef.current = window.requestAnimationFrame(() => {
          resetColumnCustomFlipTransforms(movedNodes);
          customRowAnimationFrameRef.current = null;
        });
      }
    }

    customRowRectsRef.current = nextRects;

    return () => {
      if (customRowAnimationFrameRef.current !== null) {
        window.cancelAnimationFrame(customRowAnimationFrameRef.current);
        customRowAnimationFrameRef.current = null;
      }
      clearCustomMoveFrame();
    };
  }, [clearCustomMoveFrame, customColumnControlOrderDigest, customPanelOpen]);

  const customAllChecked =
    customColumnControls.length > 0 &&
    customColumnControls.every((column) => column.checked);
  const customAllIndeterminate =
    customColumnControls.some((column) => column.checked) &&
    !customAllChecked;
  const customPanelDirty = !deepEqual(
    {
      filterable: customDraftFilterableColumns,
      fixed: customDraftFixedColumns,
      order: customDraftOrder,
      sortable: customDraftSortableColumns,
      visible: customDraftVisibleColumns,
    },
    customOriginStateRef.current
  );

  const emitColumnCustomChange = useCallback(
    (action: 'cancel' | 'confirm' | 'open' | 'reset', snapshot: ReturnType<typeof resolveColumnCustomWorkingSnapshot>) => {
      runtimeGridEvents?.columnCustomChange?.(
        createColumnCustomChangePayload(
          mergedGridOptions.columns ?? [],
          action,
          snapshot
        ) as any
      );
    },
    [mergedGridOptions.columns, runtimeGridEvents]
  );

  const openCustomPanel = useCallback(() => {
    const { draft, origin, snapshot } = resolveColumnCustomOpenState(
      mergedGridOptions.columns ?? [],
      getCurrentColumnCustomState()
    );
    customOriginStateRef.current = origin;
    applyDraftColumnCustomSnapshot(draft);
    resetCustomDragState();
    setCustomPanelOpen(true);
    runtimeGridEvents?.toolbarToolClick?.({
      code: 'custom',
    });
    emitColumnCustomChange('open', snapshot);
  }, [
    applyDraftColumnCustomSnapshot,
    emitColumnCustomChange,
    getCurrentColumnCustomState,
    mergedGridOptions.columns,
    resetCustomDragState,
    runtimeGridEvents,
  ]);

  const toggleCustomColumnVisible = useCallback((key: string) => {
    setCustomDraftVisibleColumns((prev) => {
      const next = toggleColumnCustomVisible(prev, key);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  const setCustomColumnFixed = useCallback((key: string, value: '' | 'left' | 'right') => {
    setCustomDraftFixedColumns((prev) => {
      const next = toggleColumnCustomFixed(prev, key, value);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  const toggleCustomColumnSortableByKey = useCallback((key: string) => {
    setCustomDraftSortableColumns((prev) => {
      const next = toggleColumnCustomSortable(prev, key);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  const toggleCustomColumnFilterableByKey = useCallback((key: string) => {
    setCustomDraftFilterableColumns((prev) => {
      const next = toggleColumnCustomFilterable(prev, key);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  const moveCustomColumnTo = useCallback((dragKey: string, overKey: string, position: 'bottom' | 'top') => {
    setCustomDraftOrder((prev) => {
      const next = applyColumnCustomDragMove(
        mergedGridOptions.columns ?? [],
        prev,
        dragKey,
        overKey,
        position
      );
      return deepEqual(prev, next) ? prev : next;
    });
  }, [mergedGridOptions.columns]);

  const handleCustomDragStart = useCallback((key: string, event: any) => {
    if (event?.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', key);
    }
    const nextState = resolveColumnCustomDragStartState(key);
    customDraggingKeyRef.current = nextState.draggingKey;
    customDragHoverRef.current = nextState.dragHover;
    setCustomDragState(nextState.dragState);
  }, []);

  const handleCustomDragOver = useCallback((key: string, event: any) => {
    event?.preventDefault?.();
    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    const dragKey = resolveColumnCustomDraggingKey(
      customDraggingKeyRef.current,
      { dragKey: customDragState.dragKey }
    );
    if (!dragKey) {
      return;
    }
    const target = event?.currentTarget as HTMLElement | null;
    if (!target) {
      return;
    }
    if (typeof event?.clientY === 'number') {
      autoScrollCustomBody(event.clientY);
    }
    const rect = target.getBoundingClientRect();
    const nextState = resolveColumnCustomDragOverState({
      dragKey,
      offsetY: event.clientY - rect.top,
      overKey: key,
      previousHover: customDragHoverRef.current,
      rowHeight: rect.height,
    });
    if (!nextState) {
      return;
    }
    setCustomDragState((prev) => {
      return deepEqual(prev, nextState.dragState) ? prev : nextState.dragState;
    });
    if (!nextState.shouldQueueMove) {
      return;
    }
    customDragHoverRef.current = nextState.dragHover;
    customPendingMoveRef.current = {
      dragKey,
      overKey: key,
      position: nextState.dragState.position as ColumnCustomDragPosition,
    };
    if (typeof window === 'undefined') {
      const pendingMove = customPendingMoveRef.current;
      customPendingMoveRef.current = null;
      if (pendingMove) {
        moveCustomColumnTo(pendingMove.dragKey, pendingMove.overKey, pendingMove.position);
      }
      return;
    }
    if (customMoveAnimationFrameRef.current !== null) {
      return;
    }
    customMoveAnimationFrameRef.current = window.requestAnimationFrame(() => {
      customMoveAnimationFrameRef.current = null;
      const pendingMove = customPendingMoveRef.current;
      customPendingMoveRef.current = null;
      if (!pendingMove) {
        return;
      }
      moveCustomColumnTo(pendingMove.dragKey, pendingMove.overKey, pendingMove.position);
    });
  }, [autoScrollCustomBody, customDragState.dragKey, moveCustomColumnTo]);

  const handleCustomBodyDragOver = useCallback((event: any) => {
    const dragKey = resolveColumnCustomDraggingKey(
      customDraggingKeyRef.current,
      { dragKey: customDragState.dragKey }
    );
    if (!dragKey) {
      return;
    }
    event?.preventDefault?.();
    if (event?.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
    if (typeof event?.clientY === 'number') {
      autoScrollCustomBody(event.clientY);
    }
  }, [autoScrollCustomBody, customDragState.dragKey]);

  const handleCustomDrop = useCallback((_key: string, event: any) => {
    event?.preventDefault?.();
    resetCustomDragState();
  }, [resetCustomDragState]);

  const handleCustomDragEnd = useCallback(() => {
    resetCustomDragState();
  }, [resetCustomDragState]);

  const toggleCustomAllColumns = useCallback(() => {
    setCustomDraftVisibleColumns((prev) => {
      const next = toggleAllColumnCustomVisible(
        mergedGridOptions.columns ?? [],
        prev
      );
      return deepEqual(prev, next) ? prev : next;
    });
  }, [mergedGridOptions.columns]);

  const handleCustomCancel = useCallback(() => {
    const { draft, snapshot } = resolveColumnCustomCancelState(
      mergedGridOptions.columns ?? [],
      {
        current: getCurrentColumnCustomState(),
        origin: customOriginStateRef.current,
      }
    );
    applyDraftColumnCustomSnapshot(draft);
    resetCustomDragState();
    setCustomPanelOpen(false);
    emitColumnCustomChange('cancel', snapshot);
  }, [
    applyDraftColumnCustomSnapshot,
    emitColumnCustomChange,
    getCurrentColumnCustomState,
    mergedGridOptions.columns,
    resetCustomDragState,
  ]);

  const handleCustomConfirm = useCallback(() => {
    const { current, origin, snapshot } = resolveColumnCustomConfirmState(
      mergedGridOptions.columns ?? [],
      getDraftColumnCustomState()
    );
    customOriginStateRef.current = origin;
    applyCurrentColumnCustomSnapshot(current);
    resetCustomDragState();
    writeColumnCustomStateToStorage(columnCustomPersistenceConfig, snapshot);
    api.setGridOptions({
      columnCustomState: snapshot as any,
    });
    setCustomPanelOpen(false);
    emitColumnCustomChange('confirm', snapshot);
  }, [
    api,
    applyCurrentColumnCustomSnapshot,
    columnCustomPersistenceConfig,
    emitColumnCustomChange,
    getDraftColumnCustomState,
    mergedGridOptions.columns,
    resetCustomDragState,
  ]);

  const handleCustomReset = useCallback(() => {
    if (!customPanelDirty) {
      return;
    }
    if (
      typeof window !== 'undefined' &&
      !window.confirm(localeText.customRestoreConfirm)
    ) {
      return;
    }
    const { current, draft, origin, snapshot } = resolveColumnCustomResetState(
      mergedGridOptions.columns ?? []
    );
    customOriginStateRef.current = origin;
    applyDraftColumnCustomSnapshot(draft);
    applyCurrentColumnCustomSnapshot(current);
    resetCustomDragState();
    writeColumnCustomStateToStorage(columnCustomPersistenceConfig, snapshot);
    api.setGridOptions({
      columnCustomState: snapshot as any,
    });
    setCustomPanelOpen(false);
    emitColumnCustomChange('reset', snapshot);
  }, [
    api,
    applyCurrentColumnCustomSnapshot,
    applyDraftColumnCustomSnapshot,
    columnCustomPersistenceConfig,
    customPanelDirty,
    emitColumnCustomChange,
    localeText.customRestoreConfirm,
    mergedGridOptions.columns,
    resetCustomDragState,
  ]);

  const toggleCustomPanel = useCallback(() => {
    if (customPanelOpen) {
      handleCustomCancel();
      return;
    }
    openCustomPanel();
  }, [customPanelOpen, handleCustomCancel, openCustomPanel]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') {
        return;
      }
      if (customPanelOpen) {
        handleCustomCancel();
        return;
      }
      if (maximized) {
        setMaximized(false);
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [customPanelOpen, handleCustomCancel, maximized]);

  useEffect(() => {
    if (typeof document === 'undefined' || !customPanelOpen) {
      return undefined;
    }

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) {
        return;
      }
      if (customPopoverRef.current?.contains(target)) {
        return;
      }
      if (customTriggerRef.current?.contains(target)) {
        return;
      }
      handleCustomCancel();
    };

    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [customPanelOpen, handleCustomCancel]);

  const customColumnsPanel = (
    <div className="admin-table__toolbar-custom-panel">
      <div className="admin-table__toolbar-custom-header">
        <button
          className={[
            'admin-table__toolbar-custom-checkbox',
            customAllChecked ? 'is-checked' : '',
            customAllIndeterminate ? 'is-indeterminate' : '',
          ].join(' ')}
          type="button"
          onClick={toggleCustomAllColumns}
        >
          <i
            className={[
              'vxe-checkbox--icon',
              customAllIndeterminate
                ? 'vxe-table-icon-checkbox-indeterminate-fill'
                : customAllChecked
                  ? 'vxe-table-icon-checkbox-checked-fill'
                  : 'vxe-table-icon-checkbox-unchecked',
            ].join(' ')}
          />
          <span className="vxe-checkbox--label">{localeText.customAll}</span>
        </button>
      </div>
      <div
        ref={customBodyRef}
        className={['admin-table__toolbar-custom-body', customDragState.dragKey ? 'is-dragging' : ''].join(' ')}
        onDragOver={handleCustomBodyDragOver}
      >
        {customColumnControls.map((column) => (
          <div
            key={column.key}
            ref={(node) => {
              if (node) {
                customRowRefs.current[column.key] = node;
              } else {
                delete customRowRefs.current[column.key];
              }
            }}
            className={[
              'admin-table__toolbar-custom-row',
              customDragState.dragKey === column.key ? 'is-drag-origin' : '',
              customDragState.overKey === column.key ? 'is-drag-over' : '',
              customDragState.overKey === column.key && customDragState.position === 'top'
                ? 'is-drag-over-top'
                : '',
              customDragState.overKey === column.key && customDragState.position === 'bottom'
                ? 'is-drag-over-bottom'
                : '',
            ].join(' ')}
            onDragOver={(event) => {
              handleCustomDragOver(column.key, event);
            }}
            onDrop={(event) => {
              handleCustomDrop(column.key, event);
            }}
          >
            <div className="admin-table__toolbar-custom-main">
              <button
                className={[
                  'admin-table__toolbar-custom-checkbox',
                  column.checked ? 'is-checked' : '',
                ].join(' ')}
                type="button"
                onClick={() => {
                  toggleCustomColumnVisible(column.key);
                }}
              >
                <i
                  className={[
                    'vxe-checkbox--icon',
                    column.checked
                      ? 'vxe-table-icon-checkbox-checked-fill'
                      : 'vxe-table-icon-checkbox-unchecked',
                  ].join(' ')}
                />
              </button>
              <div className="admin-table__toolbar-custom-name-option">
                <button
                  className={['admin-table__toolbar-custom-sort-btn', column.checked ? '' : 'is-disabled'].join(' ')}
                  disabled={!column.checked}
                  draggable={column.checked}
                  title={localeText.customMoveUp}
                  type="button"
                  onDragEnd={handleCustomDragEnd}
                  onDragStart={(event) => {
                    handleCustomDragStart(column.key, event);
                  }}
                >
                  <i className="vxe-table-icon-drag-handle" />
                </button>
                <span className="admin-table__toolbar-custom-title">{column.title}</span>
              </div>
            </div>
            <div className="admin-table__toolbar-custom-fixed-option">
              <button
                className={['admin-table__toolbar-custom-icon-btn', column.sortable ? 'is-active' : ''].join(' ')}
                disabled={!column.checked}
                title={localeText.customSort}
                type="button"
                onClick={() => {
                  toggleCustomColumnSortableByKey(column.key);
                }}
              >
                <i className="admin-table__toolbar-custom-icon-sort" />
              </button>
              <button
                className={['admin-table__toolbar-custom-icon-btn', column.filterable ? 'is-active' : ''].join(' ')}
                disabled={!column.checked}
                title={localeText.customFilter}
                type="button"
                onClick={() => {
                  toggleCustomColumnFilterableByKey(column.key);
                }}
              >
                <i className="admin-table__toolbar-custom-icon-filter" />
              </button>
              <button
                className={['admin-table__toolbar-custom-icon-btn', column.fixed === 'left' ? 'is-active' : ''].join(' ')}
                disabled={!column.checked}
                title={localeText.customFixedLeft}
                type="button"
                onClick={() => {
                  setCustomColumnFixed(column.key, 'left');
                }}
              >
                <i className={column.fixed === 'left' ? 'vxe-table-icon-fixed-left-fill' : 'vxe-table-icon-fixed-left'} />
              </button>
              <button
                className={['admin-table__toolbar-custom-icon-btn', column.fixed === 'right' ? 'is-active' : ''].join(' ')}
                disabled={!column.checked}
                title={localeText.customFixedRight}
                type="button"
                onClick={() => {
                  setCustomColumnFixed(column.key, 'right');
                }}
              >
                <i className={column.fixed === 'right' ? 'vxe-table-icon-fixed-right-fill' : 'vxe-table-icon-fixed-right'} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="admin-table__toolbar-custom-footer">
        <button
          className="admin-table__toolbar-custom-btn"
          disabled={!customPanelDirty}
          type="button"
          onClick={handleCustomReset}
        >
          {localeText.customReset}
        </button>
        <button
          className="admin-table__toolbar-custom-btn"
          type="button"
          onClick={handleCustomCancel}
        >
          {localeText.customCancel}
        </button>
        <button
          className="admin-table__toolbar-custom-btn is-primary"
          type="button"
          onClick={handleCustomConfirm}
        >
          {localeText.customConfirm}
        </button>
      </div>
    </div>
  );

  const handleBuiltinToolClick = useCallback(
    async (code: 'refresh' | 'zoom') => {
      if (code === 'refresh') {
        const hasProxy = isProxyEnabled(mergedGridOptions.proxyConfig as Record<string, any>);
        setRefreshing(true);
        try {
          if (hasProxy) {
            await api.query(latestFormValuesRef.current);
          } else {
            setLoading(true);
            setDataSource([...(tableStateRef.current.gridOptions?.data as TData[] ?? [])]);
            await new Promise((resolve) => {
              setTimeout(resolve, 220);
            });
            setLoading(false);
          }
        } finally {
          setRefreshing(false);
        }
      }

      if (code === 'zoom') {
        setMaximized((prev) => !prev);
      }

      runtimeGridEvents?.toolbarToolClick?.({
        code,
      });
    },
    [
      api,
      mergedGridOptions.proxyConfig?.ajax,
      mergedGridOptions.proxyConfig?.enabled,
      runtimeGridEvents,
    ]
  );

  const handleToolbarActionToolClick = useCallback((tool: Record<string, any>, index: number) => {
    if (tool?.disabled) {
      return;
    }
    triggerToolbarActionTool(tool, index, {
      onToolbarToolClick: (payload) => {
        runtimeGridEvents?.toolbarToolClick?.(payload as any);
      },
    });
  }, [runtimeGridEvents]);

  const resolveCurrentRowsForExport = useCallback(() => {
    const sourceRows = flattenTableRows(
      Array.isArray(visibleDataSourceRef.current)
        ? visibleDataSourceRef.current
        : []
    );
    if (mergedGridOptions.pagerConfig?.enabled === false) {
      return sourceRows;
    }
    const current =
      paginationRef.current.current ??
      pagination.current ??
      1;
    const pageSize =
      paginationRef.current.pageSize ??
      pagination.pageSize ??
      20;
    const safeCurrent = Math.max(1, Number(current) || 1);
    const safePageSize = Math.max(1, Number(pageSize) || 20);
    if (sourceRows.length <= safePageSize) {
      return sourceRows;
    }
    const start = (safeCurrent - 1) * safePageSize;
    if (start >= sourceRows.length) {
      return sourceRows;
    }
    return sourceRows.slice(start, start + safePageSize);
  }, [
    mergedGridOptions.pagerConfig?.enabled,
    pagination.current,
    pagination.pageSize,
  ]);

  const resolveSelectedRowsForExport = useCallback(() => {
    return resolveSelectionRowsByKeys(
      flattenTableRows(
        Array.isArray(visibleDataSourceRef.current)
          ? visibleDataSourceRef.current
          : []
      ),
      {
        keyField: rowKeyField,
        selectedKeys: effectiveSelectedRowKeys,
      }
    );
  }, [effectiveSelectedRowKeys, rowKeyField]);

  const handlePagerExportAction = useCallback(
    async (action: ResolvedTablePagerExportAction<TData>) => {
      if (!action || action.disabled) {
        return;
      }
      const currentPage = Math.max(
        1,
        Number(
          paginationRef.current.current ??
            pagination.current ??
            1
        ) || 1
      );
      const pageSize = Math.max(
        1,
        Number(
          paginationRef.current.pageSize ??
            pagination.pageSize ??
            20
        ) || 20
      );
      const totalRaw =
        paginationRef.current.total ??
        pagination.total;
      const total = Number.isFinite(totalRaw as number)
        ? Number(totalRaw)
        : undefined;
      const selectedRowKeys = (effectiveSelectedRowKeys ?? [])
        .map((key) =>
          typeof key === 'number' || typeof key === 'string'
            ? key
            : null
        )
        .filter((key): key is number | string => key !== null);
      const currentRows = action.type === 'current'
        ? resolveCurrentRowsForExport()
        : [];
      const selectedRows = action.type === 'selected'
        ? resolveSelectedRowsForExport()
        : [];
      const allRows = action.type === 'all'
        ? flattenTableRows(
            Array.isArray(dataSource)
              ? dataSource
              : []
          )
        : [];
      const rows =
        action.type === 'selected'
          ? selectedRows
          : action.type === 'all'
            ? allRows
            : currentRows;
      const fileName = normalizeTableExportFileName(
        action.fileName ??
          pagerExportConfig?.fileName ??
          runtimeTableTitle ??
          'table-export'
      );
      const payload = {
        columns: columns as Array<Record<string, any>>,
        currentPage,
        fileName,
        pageSize,
        rows,
        selectedRowKeys,
        selectedRows,
        total,
        type: action.type,
      };

      if (action.type === 'all') {
        const allHandler =
          typeof action.request === 'function'
            ? action.request
            : typeof action.onClick === 'function'
              ? action.onClick
              : pagerExportConfig?.exportAll;
        if (typeof allHandler !== 'function') {
          console.warn(localeText.exportAllMissingHandler);
          return;
        }
        await Promise.resolve(allHandler(payload as any));
      } else {
        const customHandler =
          typeof action.request === 'function'
            ? action.request
            : typeof action.onClick === 'function'
              ? action.onClick
              : undefined;
        if (typeof customHandler === 'function') {
          await Promise.resolve(customHandler(payload as any));
        } else {
          const seqStart =
            action.type === 'current' &&
            mergedGridOptions.pagerConfig?.enabled !== false
              ? (currentPage - 1) * pageSize
              : 0;
          exportTableRowsToExcel({
            columns: resolveTableExportColumns<TData>(
              columns as Array<Record<string, any>>,
              {
                seqStart,
              }
            ),
            fileName,
            rows: rows as TData[],
          });
        }
      }

      runtimeGridEvents?.pagerExportClick?.(
        createPagerExportEventPayload({
          code: action.type,
          currentPage,
          fileName,
          pageSize,
          source: 'react',
          total,
        })
      );
      runtimeGridEvents?.toolbarToolClick?.({
        code: `pager-export-${action.type}`,
        tool: action,
      });
    },
    [
      dataSource,
      columns,
      effectiveSelectedRowKeys,
      localeText.exportAllMissingHandler,
      mergedGridOptions.pagerConfig?.enabled,
      pagerExportConfig?.exportAll,
      pagerExportConfig?.fileName,
      pagination.current,
      pagination.pageSize,
      pagination.total,
      resolveCurrentRowsForExport,
      resolveSelectedRowsForExport,
      runtimeGridEvents,
      runtimeTableTitle,
    ]
  );

  const handlePagerExportTriggerClick = useCallback(() => {
    if (!pagerExportSingleAction) {
      return;
    }
    void handlePagerExportAction(pagerExportSingleAction);
  }, [handlePagerExportAction, pagerExportSingleAction]);

  const handleOperationActionToolClick = useCallback(
    (
      tool: Record<string, any>,
      index: number,
      row: TData,
      rowIndex: number
    ) => {
      if (tool?.disabled) {
        return;
      }
      triggerOperationActionTool(tool, index, {
        onOperationToolClick: (payload: Record<string, any>) => {
          runtimeGridEvents?.operationToolClick?.(payload as any);
        },
        row: row as Record<string, any>,
        rowIndex,
      });
    },
    [runtimeGridEvents]
  );

  const resolveSelectedRows = useCallback((keys: Key[]) => {
    return resolveSelectionRowsByKeys(flattenedDataSource, {
      keyField: rowKeyField,
      selectedKeys: keys,
    });
  }, [flattenedDataSource, rowKeyField]);

  const applySelectionCheckField = useCallback((keys: Key[]) => {
    if (!selectionCheckField) {
      return;
    }
    setDataSource((prev) => {
      const next = applySelectionCheckFieldToRows(prev, {
        checkField: selectionCheckField,
        keyField: rowKeyField,
        selectedKeys: keys,
      });
      return next.changed ? next.rows : prev;
    });
  }, [rowKeyField, selectionCheckField]);

  const updateSelectionState = useCallback((keys: Key[], info?: Record<string, any>) => {
    if (!selectionMode) {
      return;
    }
    const normalizedKeys = normalizeTableSelectionKeys<Key>(keys, selectionMode);
    const alignedKeys = alignSelectionKeysToRows(
      normalizedKeys,
      computedDataSource,
      rowKeyField
    );
    if (!isSelectionControlled) {
      setInnerSelectedRowKeys(alignedKeys);
    }
    applySelectionCheckField(alignedKeys);
    mergedGridOptions.rowSelection?.onChange?.(
      alignedKeys,
      resolveSelectedRows(alignedKeys),
      info as any
    );
  }, [
    computedDataSource,
    applySelectionCheckField,
    isSelectionControlled,
    mergedGridOptions.rowSelection,
    rowKeyField,
    resolveSelectedRows,
    selectionMode,
  ]);

  const resolvedRowSelection = useMemo<TableRowSelection<TData> | undefined>(() => {
    const source = mergedGridOptions.rowSelection;
    if (!selectionMode && !source) {
      return undefined;
    }
    const mode = selectionMode ?? source?.type;
    if (mode !== 'checkbox' && mode !== 'radio') {
      return source as TableRowSelection<TData>;
    }
    const sourceGetCheckboxProps = source?.getCheckboxProps;
    const checkMethod = selectionCheckMethod;
    const resolveRecordSelectionProps = (record: TData, rowIndexFromTable?: number) => {
      const sourceProps =
        typeof sourceGetCheckboxProps === 'function'
          ? sourceGetCheckboxProps(record)
          : {};
      if (typeof checkMethod !== 'function') {
        return sourceProps ?? {};
      }
      const comparableRowKey = toTableComparableSelectionKey(
        record?.[rowKeyField] as Key
      );
      const rowIndex = rowIndexFromTable
        ?? (
          comparableRowKey !== null
            ? (rowIndexByComparableKey.get(comparableRowKey) ?? -1)
            : -1
        );
      let enabled = true;
      try {
        enabled = checkMethod({
          row: record,
          rowIndex,
        } as any) !== false;
      } catch {
        enabled = true;
      }
      return {
        ...(sourceProps ?? {}),
        disabled: !!(sourceProps as Record<string, any>)?.disabled || !enabled,
      };
    };
    const selection = {
      ...(source ?? {}),
      type: mode,
      columnTitle: source?.columnTitle ?? selectionColumn?.title,
      columnWidth: source?.columnWidth
        ?? selectionColumn?.width
        ?? (mode === 'radio' ? 64 : 72),
      fixed: source?.fixed ?? selectionColumn?.fixed,
      selectedRowKeys: effectiveSelectedRowKeys,
      onChange: (selectedRowKeys: Key[], _selectedRows: TData[], info: any) => {
        updateSelectionState(selectedRowKeys, info);
      },
      getCheckboxProps: (record: TData) => {
        return resolveRecordSelectionProps(record);
      },
    } satisfies TableRowSelection<TData>;

    if (mode === 'radio') {
      const sourceRenderCell = source?.renderCell;
      selection.renderCell = (
        _checked: boolean,
        record: TData,
        index: number,
        _originNode: ReactNode
      ) => {
        const recordKey = record?.[rowKeyField] as Key;
        const comparableKey = toTableComparableSelectionKey(recordKey);
        const checked =
          comparableKey !== null && effectiveSelectedKeySet.has(comparableKey);
        const recordProps =
          resolveRecordSelectionProps(record, index) as Record<string, any>;
        const disabled = !!recordProps?.disabled;
        const radioNode = (
          <button
            aria-checked={checked}
            className={[
              'admin-table__selection-radio',
              checked ? 'is-checked' : '',
              disabled ? 'is-disabled' : '',
            ].filter(Boolean).join(' ')}
            disabled={disabled}
            onClick={(event) => {
              event.stopPropagation();
              recordProps?.onClick?.(event);
              if (recordKey === null || recordKey === undefined || disabled) {
                return;
              }
              const nextKeys = resolveRowClickSelectionKeys<Key>({
                currentKeys: effectiveSelectedRowKeys,
                mode: 'radio',
                rowKey: recordKey,
                strict: selectionStrict,
              });
              if (!nextKeys) {
                return;
              }
              updateSelectionState(nextKeys, {
                type: 'radioClick',
              });
            }}
            role="radio"
            type="button"
          />
        );

        if (typeof sourceRenderCell === 'function') {
          return sourceRenderCell(checked, record, index, radioNode);
        }
        return radioNode;
      };
    }

    return selection;
  }, [
    computedDataSource,
    effectiveSelectedKeySet,
    effectiveSelectedRowKeys,
    mergedGridOptions.rowSelection,
    rowKeyField,
    rowIndexByComparableKey,
    selectionCheckMethod,
    selectionColumn,
    selectionMode,
    selectionStrict,
    updateSelectionState,
  ]);

  const mergedOnRow = useMemo(() => {
    const sourceOnRow = mergedGridOptions.onRow;
    const hasSelectionByRow = !!selectionMode && !!selectionTriggerByRow;
    const hasRowStrategy =
      Array.isArray((mergedGridOptions as Record<string, any>).rowStrategy) ||
      !!(mergedGridOptions as Record<string, any>).strategy;
    if (!hasSelectionByRow && !hasRowStrategy) {
      return sourceOnRow;
    }
    return (record: TData, index?: number) => {
      const sourceProps =
        typeof sourceOnRow === 'function'
          ? (sourceOnRow(record, index) ?? {})
          : {};
      const sourceClick =
        typeof (sourceProps as Record<string, any>).onClick === 'function'
          ? (sourceProps as Record<string, any>).onClick
          : undefined;
      const rowStrategyResult = resolveRowStrategy(record, index ?? -1);
      const rowStrategyInlineStyle = resolveTableRowStrategyInlineStyle(
        rowStrategyResult?.style as Record<string, any> | undefined
      );
      const sourceStyle = (sourceProps as Record<string, any>).style;
      return {
        ...sourceProps,
        className: [
          (sourceProps as Record<string, any>).className ?? '',
          rowStrategyResult?.className ?? '',
        ]
          .filter(Boolean)
          .join(' '),
        style: {
          ...(typeof sourceStyle === 'object' && sourceStyle
            ? sourceStyle as Record<string, any>
            : {}),
          ...(rowStrategyInlineStyle ?? {}),
        },
        onClick: (event: any) => {
          sourceClick?.(event);
          if (event?.defaultPrevented) {
            return;
          }
          const triggerResult = triggerTableRowStrategyClick({
            event,
            row: record as Record<string, any>,
            rowIndex: index ?? -1,
            strategyResult: rowStrategyResult,
          });
          if (triggerResult.blocked) {
            return;
          }
          if (!hasSelectionByRow) {
            return;
          }
          if (typeof selectionCheckMethod === 'function') {
            let enabled = true;
            try {
              enabled = selectionCheckMethod({
                row: record,
                rowIndex: index ?? -1,
              } as any) !== false;
            } catch {
              enabled = true;
            }
            if (!enabled) {
              return;
            }
          }
          const rowKey = record?.[rowKeyField] as Key;
          if (!selectionMode || rowKey === null || rowKey === undefined) {
            return;
          }
          const nextKeys = resolveRowClickSelectionKeys<Key>({
            currentKeys: effectiveSelectedRowKeys,
            mode: selectionMode,
            rowKey,
            strict: selectionStrict,
          });
          if (!nextKeys) {
            return;
          }
          updateSelectionState(nextKeys, {
            type: 'rowClick',
          });
        },
      };
    };
  }, [
    effectiveSelectedRowKeys,
    mergedGridOptions.onRow,
    mergedGridOptions.rowStrategy,
    mergedGridOptions.strategy,
    rowKeyField,
    selectionCheckMethod,
    selectionStrict,
    selectionMode,
    selectionTriggerByRow,
    resolveRowStrategy,
    updateSelectionState,
  ]);

  const renderToolbarActionToolButton = useCallback((tool: Record<string, any>) => {
    const { attrs, classList, disabled, key, presentation, title } =
      resolveToolbarActionButtonRenderState(tool, { keyPrefix: 'tool' });
    const buttonClassName = classList.join(' ');

    return (
      <button
        key={key}
        {...attrs}
        className={buttonClassName}
        disabled={disabled}
        title={title}
        type="button"
        onClick={() => {
          handleToolbarActionToolClick(tool, tool.index);
        }}
      >
        {presentation.hasIcon ? (
          <i
            aria-hidden="true"
            className={[
              'admin-table__toolbar-action-icon',
              presentation.iconClass ?? '',
            ].filter(Boolean).join(' ')}
          />
        ) : null}
        {presentation.text ? (
          <span className="admin-table__toolbar-action-text">{presentation.text}</span>
        ) : null}
      </button>
    );
  }, [handleToolbarActionToolClick]);

  const renderOperationActionToolButton = useCallback(
    (
      tool: Record<string, any>,
      row: TData,
      rowIndex: number
    ) => {
      const { attrs, classList, disabled, key, presentation, title } =
        resolveToolbarActionButtonRenderState(tool, {
          keyPrefix: 'operation',
        });
      const buttonClassName = classList.join(' ');

      return (
        <button
          key={key}
          {...attrs}
          className={buttonClassName}
          disabled={disabled}
          title={title}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            handleOperationActionToolClick(tool, tool.index, row, rowIndex);
          }}
        >
          {presentation.hasIcon ? (
            <i
              aria-hidden="true"
              className={[
                'admin-table__toolbar-action-icon',
                presentation.iconClass ?? '',
              ].filter(Boolean).join(' ')}
            />
          ) : null}
          {presentation.text ? (
            <span className="admin-table__toolbar-action-text">{presentation.text}</span>
          ) : null}
        </button>
      );
    },
    [handleOperationActionToolClick]
  );

  const showTableTitle =
    !!resolveSlot(runtimeSlots, 'table-title') || !!runtimeTableTitle;
  const toolbarTools = useMemo(
    () =>
      resolveVisibleToolbarActionTools({
        accessCodes: setupState.accessCodes,
        accessRoles: setupState.accessRoles,
        excludeCodes: ['search'],
        maximized,
        permissionChecker: setupState.permissionChecker,
        showSearchForm: runtimeShowSearchForm,
        tools: mergedGridOptions.toolbarConfig?.tools,
      }),
    [
      maximized,
      mergedGridOptions.toolbarConfig?.tools,
      runtimeShowSearchForm,
      setupState.accessCodes,
      setupState.accessRoles,
      setupState.permissionChecker,
    ]
  );
  const toolbarToolsBeforeBuiltin = useMemo(
    () => (toolbarToolsPosition === 'before' ? toolbarTools : []),
    [toolbarTools, toolbarToolsPosition]
  );
  const toolbarToolsAfterBuiltin = useMemo(
    () => (toolbarToolsPosition === 'before' ? [] : toolbarTools),
    [toolbarTools, toolbarToolsPosition]
  );

  const operationColumnConfig = useMemo(
    () =>
      resolveOperationColumnConfig(
        mergedGridOptions.operationColumn as any,
        localeText
      ),
    [localeText, mergedGridOptions.operationColumn]
  );
  const operationTools = useMemo(() => {
    if (!operationColumnConfig) {
      return [];
    }
    return resolveVisibleOperationActionTools({
      accessCodes: setupState.accessCodes,
      accessRoles: setupState.accessRoles,
      maximized,
      operationColumn: mergedGridOptions.operationColumn as any,
      permissionChecker: setupState.permissionChecker,
      showSearchForm: runtimeShowSearchForm,
    });
  }, [
    maximized,
    mergedGridOptions.operationColumn,
    operationColumnConfig,
    runtimeShowSearchForm,
    setupState.accessCodes,
    setupState.accessRoles,
    setupState.permissionChecker,
  ]);
  const tableColumns = useMemo(() => {
    if (!operationColumnConfig || operationTools.length <= 0) {
      return columns;
    }
    const actionColumn = {
      align: operationColumnConfig.align,
      fixed: operationColumnConfig.fixed,
      key: operationColumnConfig.key,
      title: operationColumnConfig.title,
      width: operationColumnConfig.width,
      ...operationColumnConfig.attrs,
      render: (_value: any, record: TData, rowIndex: number) => {
        return (
          <div
            className={[
              'admin-table__operation-cell',
              resolveOperationCellAlignClass(operationColumnConfig.align),
            ].join(' ')}
          >
            {operationTools.map((tool) =>
              renderOperationActionToolButton(tool, record, rowIndex)
            )}
          </div>
        );
      },
    };
    return [...columns, actionColumn];
  }, [
    columns,
    operationColumnConfig,
    operationTools,
    renderOperationActionToolButton,
  ]);

  const showSearchButton =
    !!mergedGridOptions.toolbarConfig?.search && !!runtimeFormOptions;

  const showToolbar =
    showTableTitle ||
    showToolbarCenter ||
    toolbarTools.length > 0 ||
    builtinToolbarTools.length > 0 ||
    showSearchButton ||
    !!toolbarActionsSlot ||
    hasToolbarToolsSlot;

  useLayoutEffect(() => {
    if (hasToolbarCenterSlot || !resolvedToolbarHint || resolvedToolbarHint.overflow !== 'scroll') {
      setToolbarHintShouldScroll(false);
      return;
    }

    const syncOverflow = () => {
      const viewport = toolbarHintViewportRef.current;
      const textNode = toolbarHintTextRef.current;
      const next =
        !!viewport && !!textNode && textNode.scrollWidth > viewport.clientWidth + 1;
      setToolbarHintShouldScroll((prev) => (prev === next ? prev : next));
    };

    syncOverflow();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        syncOverflow();
      });
      if (toolbarHintViewportRef.current) {
        observer.observe(toolbarHintViewportRef.current);
      }
      if (toolbarHintTextRef.current) {
        observer.observe(toolbarHintTextRef.current);
      }
      return () => {
        observer.disconnect();
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', syncOverflow);
      return () => {
        window.removeEventListener('resize', syncOverflow);
      };
    }

    return undefined;
  }, [
    hasToolbarCenterSlot,
    resolvedToolbarHint?.overflow,
    resolvedToolbarHint?.text,
  ]);

  useLayoutEffect(() => {
    if (hasPagerCenterSlot || !resolvedPagerHint || resolvedPagerHint.overflow !== 'scroll') {
      setPagerHintShouldScroll(false);
      return undefined;
    }

    const syncOverflow = () => {
      const viewport = pagerHintViewportRef.current;
      const textNode = pagerHintTextRef.current;
      const next =
        !!viewport && !!textNode && textNode.scrollWidth > viewport.clientWidth + 1;
      setPagerHintShouldScroll((prev) => (prev === next ? prev : next));
    };

    syncOverflow();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        syncOverflow();
      });
      if (pagerHintViewportRef.current) {
        observer.observe(pagerHintViewportRef.current);
      }
      if (pagerHintTextRef.current) {
        observer.observe(pagerHintTextRef.current);
      }
      return () => {
        observer.disconnect();
      };
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('resize', syncOverflow);
      return () => {
        window.removeEventListener('resize', syncOverflow);
      };
    }

    return undefined;
  }, [
    hasPagerCenterSlot,
    resolvedPagerHint?.overflow,
    resolvedPagerHint?.text,
  ]);

  const showSeparator = shouldShowSeparator({
    hasFormOptions: !!runtimeFormOptions,
    separator: tableState.separator,
    showSearchForm: runtimeShowSearchForm,
  });

  const separatorStyle = getSeparatorStyle(tableState.separator);

  const paginationEnabled = mergedGridOptions.pagerConfig?.enabled !== false;
  const virtualScrollEnabled = !!(
    mergedGridOptions.scrollY?.enabled &&
    computedDataSource.length > (mergedGridOptions.scrollY.gt ?? 100)
  );
  const sourceTableScroll =
    (mergedGridOptions.scroll as Record<string, any> | undefined) ?? {};
  const resolvedTableScroll = virtualScrollEnabled
    ? {
        ...sourceTableScroll,
        y:
          typeof sourceTableScroll.y === 'number'
            ? sourceTableScroll.y
            : resolveTableScrollHeight(mergedGridOptions.height, 500),
      }
    : mergedGridOptions.scroll;
  const resolvedTableVirtual =
    typeof (mergedGridOptions as Record<string, any>).virtual === 'boolean'
      ? (mergedGridOptions as Record<string, any>).virtual
      : (
          (
            mergedGridOptions.scrollY as Record<string, any> | undefined
          )?.virtual ?? virtualScrollEnabled
        );
  const tableVirtualProps =
    typeof resolvedTableVirtual === 'boolean'
      ? ({ virtual: resolvedTableVirtual } as Record<string, any>)
      : {};
  const pagerLayoutSet = useMemo(
    () =>
      resolveTablePagerLayoutSet(
        mergedGridOptions.pagerConfig?.layouts,
        mobile
      ),
    [mergedGridOptions.pagerConfig?.layouts, mobile]
  );
  const showPagerTotal = pagerLayoutSet.has('total');
  const showPagerSizes = pagerLayoutSet.has('sizes');
  const showPagerPrevPage = pagerLayoutSet.has('prevpage');
  const showPagerNextPage = pagerLayoutSet.has('nextpage');
  const showPagerPrevJump = pagerLayoutSet.has('prevjump');
  const showPagerNextJump = pagerLayoutSet.has('nextjump');
  const showPagerNumber = pagerLayoutSet.has('number');
  const showPagerHome = pagerLayoutSet.has('home');
  const showPagerEnd = pagerLayoutSet.has('end');
  const showPagerQuickJump =
    pagerLayoutSet.has('jump') ||
    pagerLayoutSet.has('fulljump') ||
    pagerLayoutSet.has('numberjump') ||
    pagerLayoutSet.has('pagecount');
  const pagerCurrentPage = Math.max(
    1,
    Number(pagination.current ?? mergedGridOptions.pagerConfig?.currentPage ?? 1) ||
      1
  );
  const pagerPageSize = Math.max(
    1,
    Number(pagination.pageSize ?? mergedGridOptions.pagerConfig?.pageSize ?? 20) ||
      20
  );
  const pagerTotal = Math.max(
    0,
    Number(
      pagination.total ??
      mergedGridOptions.pagerConfig?.total ??
      computedDataSource.length
    ) || 0
  );
  const pagerPageCount = Math.max(1, Math.ceil(pagerTotal / pagerPageSize));
  const showPagerExport = paginationEnabled && pagerExportActions.length > 0;
  const striped = !!mergedGridOptions.stripe;
  const resolvePopupContainer = useCallback((triggerNode: HTMLElement) => {
    const sourceResolver = mergedGridOptions.getPopupContainer;
    if (typeof sourceResolver === 'function') {
      const resolved = sourceResolver(triggerNode);
      if (resolved instanceof HTMLElement) {
        return resolved;
      }
    }
    if (tableRootRef.current) {
      return tableRootRef.current;
    }
    const nearest = triggerNode?.closest?.('.admin-table');
    if (nearest instanceof HTMLElement) {
      return nearest;
    }
    if (triggerNode?.parentElement) {
      return triggerNode.parentElement;
    }
    if (typeof document !== 'undefined' && document.body) {
      return document.body;
    }
    return triggerNode;
  }, [mergedGridOptions.getPopupContainer]);

  const pagerItemRender = useCallback((
    _page: number,
    type: 'jump-next' | 'jump-prev' | 'next' | 'page' | 'prev',
    element: ReactNode
  ) => {
    if (type === 'prev' && !showPagerPrevPage) {
      return null;
    }
    if (type === 'next' && !showPagerNextPage) {
      return null;
    }
    if (type === 'jump-prev' && !showPagerPrevJump) {
      return null;
    }
    if (type === 'jump-next' && !showPagerNextJump) {
      return null;
    }
    if (type === 'page' && !showPagerNumber) {
      return null;
    }
    return element;
  }, [
    showPagerNextJump,
    showPagerNextPage,
    showPagerNumber,
    showPagerPrevJump,
    showPagerPrevPage,
  ]);

  useLayoutEffect(() => {
    const hasPagerExtension =
      (showPagerExport && !hasPagerToolsSlotReplaceTools) ||
      (paginationEnabled && (showPagerHome || showPagerEnd)) ||
      showPagerCenter ||
      hasPagerLeftSlot ||
      hasPagerToolsSlot ||
      pagerLeftTools.length > 0 ||
      pagerRightTools.length > 0;
    if (!hasPagerExtension || !tableRootRef.current) {
      setPaginationMountNode(null);
      return;
    }
    const mountNode =
      tableRootRef.current.querySelector(
        '.ant-table-wrapper .ant-table-pagination.ant-pagination'
      ) ??
      tableRootRef.current.querySelector(
        '.ant-table-pagination.ant-pagination'
      );
    setPaginationMountNode(
      mountNode instanceof HTMLElement ? mountNode : null
    );
  }, [
    computedDataSource.length,
    pagination.current,
    pagination.pageSize,
    pagination.total,
    paginationEnabled,
    hasPagerLeftSlot,
    hasPagerToolsSlot,
    hasPagerToolsSlotReplaceTools,
    pagerLeftTools.length,
    pagerRightTools.length,
    showPagerCenter,
    showPagerEnd,
    showPagerExport,
    showPagerHome,
  ]);

  const handleTableChange = useCallback((
    nextPagination: TablePaginationConfig,
    nextFilters: Record<string, any> = {},
    sorter: any,
    extra: any
  ) => {
    const previousPagination = paginationRef.current;
    const nextPageSize = nextPagination.pageSize ?? previousPagination.pageSize ?? 20;
    const rawNextCurrent = nextPagination.current ?? previousPagination.current ?? 1;
    const nextTotalRaw = nextPagination.total ?? previousPagination.total;
    const nextTotal = Number.isFinite(nextTotalRaw as number)
      ? Number(nextTotalRaw)
      : undefined;
    const previousCurrent = previousPagination.current ?? 1;
    const previousPageSize = previousPagination.pageSize ?? 20;
    const pageSizeChanged = nextPageSize !== previousPageSize;
    const resetToFirstOnPageSizeChange =
      mergedGridOptions.pagerConfig?.resetToFirstOnPageSizeChange === true;
    const nextCurrent =
      pageSizeChanged && resetToFirstOnPageSizeChange
        ? 1
        : rawNextCurrent;
    const currentPageChanged = nextCurrent !== previousCurrent;
    const normalizedPagination = {
      ...nextPagination,
      current: nextCurrent,
      pageSize: nextPageSize,
      total: nextTotal ?? nextPagination.total,
    };

    setPagination((prev) => ({
      ...prev,
      current: nextCurrent,
      pageSize: nextPageSize,
      total: nextTotal ?? prev.total,
    }));

    const normalizeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = normalizeSorter?.field ? String(normalizeSorter.field) : undefined;
    const order = normalizeSorter?.order;

    paginationRef.current = {
      ...paginationRef.current,
      current: nextCurrent,
      pageSize: nextPageSize,
      total: nextTotal ?? paginationRef.current.total,
    };
    sortStateRef.current = { field, order };

    setSortState({ field, order });
    visibleDataSourceRef.current = Array.isArray(
      (extra as Record<string, any> | undefined)?.currentDataSource
    )
      ? (((extra as Record<string, any>).currentDataSource ?? []) as TData[])
      : computedDataSource;

    if (currentPageChanged || pageSizeChanged) {
      const paginationPayload: AdminTablePaginationChangePayload = {
        currentPage: nextCurrent,
        pageSize: nextPageSize,
        raw: {
          extra,
          filters: nextFilters,
          pagination: normalizedPagination,
          rawPagination: nextPagination,
          sorter,
        },
        source: 'react',
        total: nextTotal,
        type: pageSizeChanged ? 'size' : 'current',
      };

      runtimeGridEvents?.onPageChange?.(paginationPayload);
      runtimeGridEvents?.onPaginationChange?.(paginationPayload);

      if (pageSizeChanged) {
        runtimeGridEvents?.onPageSizeChange?.({
          ...paginationPayload,
          type: 'size',
        });
      }
    }

    if (mergedGridOptions.proxyConfig?.enabled) {
      void executeProxy('query', latestFormValuesRef.current, {
        page: {
          current: nextCurrent,
          pageSize: nextPageSize,
        },
        sort: {
          field,
          order,
        },
      });
    }
    mergedGridOptions.onChange?.(
      normalizedPagination,
      nextFilters as any,
      sorter as any,
      extra
    );
  }, [
    computedDataSource,
    executeProxy,
    mergedGridOptions,
    runtimeGridEvents,
  ]);

  const handlePagerNavigate = useCallback((targetPage: number) => {
    const nextCurrent = Math.max(1, Math.min(pagerPageCount, targetPage));
    const current = paginationRef.current.current ?? 1;
    if (nextCurrent === current) {
      return;
    }
    handleTableChange(
      {
        ...paginationRef.current,
        current: nextCurrent,
        pageSize: paginationRef.current.pageSize ?? pagerPageSize,
        total: paginationRef.current.total ?? pagerTotal,
      },
      {},
      sortStateRef.current.field
        ? {
            field: sortStateRef.current.field,
            order: sortStateRef.current.order,
          }
        : {},
      {
        action: 'paginate',
        currentDataSource: visibleDataSourceRef.current,
      }
    );
  }, [
    handleTableChange,
    pagerPageCount,
    pagerPageSize,
    pagerTotal,
  ]);

  const rowClassName = (record: TData, index: number, indent: number) => {
    const sourceRowClassName = mergedGridOptions.rowClassName;
    const baseClass =
      typeof sourceRowClassName === 'function'
        ? sourceRowClassName(record, index, indent)
        : (sourceRowClassName ?? '');
    const rowStrategyResult = resolveRowStrategy(record, index);
    const hasRowStrategyStyle = hasTableRowStrategyStyle(
      rowStrategyResult?.style as Record<string, any> | undefined
    );
    const classNames = [baseClass];
    if (striped && index % 2 === 1) {
      classNames.push('admin-table__row--stripe');
    }
    if (
      selectionHighlight &&
      effectiveSelectedKeySet.has(
        toTableComparableSelectionKey(record?.[rowKeyField] as Key) ?? ''
      )
      ) {
      classNames.push('admin-table__row--selected');
    }
    if (hasRowStrategyStyle) {
      classNames.push('admin-table__row--strategy');
    }
    if (rowStrategyResult?.className) {
      classNames.push(rowStrategyResult.className);
    }
    return classNames.filter(Boolean).join(' ');
  };

  const pagerHomeNode = paginationEnabled && showPagerHome
    ? (
        <li
          className={[
            'admin-table__pager-nav-host',
            'is-home',
            pagerCurrentPage <= 1 ? 'is-disabled' : '',
          ].join(' ')}
        >
          <button
            className="admin-table__pager-nav-btn"
            disabled={pagerCurrentPage <= 1}
            title={localeText.pagerFirstPage}
            type="button"
            onClick={() => {
              handlePagerNavigate(1);
            }}
          >
            <span aria-hidden="true" className="admin-table__pager-nav-glyph">
              &laquo;
            </span>
          </button>
        </li>
      )
    : null;

  const pagerEndNode = paginationEnabled && showPagerEnd
    ? (
        <li
          className={[
            'admin-table__pager-nav-host',
            'is-end',
            pagerCurrentPage >= pagerPageCount ? 'is-disabled' : '',
          ].join(' ')}
        >
          <button
            className="admin-table__pager-nav-btn"
            disabled={pagerCurrentPage >= pagerPageCount}
            title={localeText.pagerLastPage}
            type="button"
            onClick={() => {
              handlePagerNavigate(pagerPageCount);
            }}
          >
            <span aria-hidden="true" className="admin-table__pager-nav-glyph">
              &raquo;
            </span>
          </button>
        </li>
      )
    : null;

  const showPagerExportInRight = showPagerExport && !hasPagerToolsSlotReplaceTools;
  const pagerExportToolNode = showPagerExportInRight
    ? (
        <div className="admin-table__pager-export">
          <button
            className="admin-table__toolbar-tool-btn"
            title={pagerExportConfig?.title ?? localeText.export}
            type="button"
            onClick={handlePagerExportTriggerClick}
          >
            <i
              aria-hidden="true"
              className={[
                'admin-table__toolbar-tool-icon',
                pagerExportConfig?.icon ?? 'admin-table-icon-export',
              ].filter(Boolean).join(' ')}
            />
          </button>
          {pagerExportActions.length > 1 ? (
            <div className="admin-table__pager-export-menu">
              {pagerExportActions.map((action) => (
                <button
                  key={`pager-export-${action.type}-${action.index}`}
                  className="admin-table__pager-export-item"
                  disabled={action.disabled}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    void handlePagerExportAction(action);
                  }}
                >
                  {action.title}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      )
    : null;
  const showPagerLeftRegion =
    (hasPagerLeftSlot && !!pagerLeftSlot) ||
    (!hasPagerLeftSlotReplaceTools && pagerLeftTools.length > 0);
  const showPagerCenterRegion = showPagerCenter;
  const showPagerRightRegion =
    (hasPagerToolsSlot && !!pagerToolsSlot) ||
    (!hasPagerToolsSlotReplaceTools && pagerRightTools.length > 0) ||
    !!pagerExportToolNode;
  const pagerLeftNode = showPagerLeftRegion
    ? (
        <li className="admin-table__pager-region is-left">
          {!hasPagerLeftSlotReplaceTools && pagerLeftToolsBeforeSlot.map((tool) =>
            renderToolbarActionToolButton(tool)
          )}
          {hasPagerLeftSlotBeforeTools ? (
            <div className="admin-table__toolbar-slot-content">{pagerLeftSlot}</div>
          ) : null}
          {!hasPagerLeftSlotReplaceTools && pagerLeftToolsAfterSlot.map((tool) =>
            renderToolbarActionToolButton(tool)
          )}
          {hasPagerLeftSlotAfterTools || hasPagerLeftSlotReplaceTools ? (
            <div className="admin-table__toolbar-slot-content">{pagerLeftSlot}</div>
          ) : null}
        </li>
      )
    : null;
  const pagerCenterNode = showPagerCenterRegion
    ? (
        <li className="admin-table__pager-region is-center">
          {hasPagerCenterSlot ? (
            <div className="admin-table__toolbar-center-slot">{pagerCenterSlot}</div>
          ) : resolvedPagerHint ? (
            <div className={pagerHintClassName}>
              <div
                ref={pagerHintViewportRef}
                className="admin-table__toolbar-hint-viewport"
              >
                <span
                  ref={pagerHintTextRef}
                  className={[
                    'admin-table__toolbar-hint-text',
                    pagerHintShouldScroll ? 'is-running' : '',
                  ].join(' ')}
                  style={pagerHintTextStyle}
                >
                  {resolvedPagerHint.text}
                </span>
              </div>
            </div>
          ) : null}
        </li>
      )
    : null;
  const pagerRightNode = showPagerRightRegion
    ? (
        <li className="admin-table__pager-region is-right">
          {!hasPagerToolsSlotReplaceTools &&
            pagerRightToolsBeforeBuiltin.map((tool) =>
              renderToolbarActionToolButton(tool)
            )}
          {hasPagerToolsSlotBeforeTools ? (
            <div className="admin-table__toolbar-slot-content">{pagerToolsSlot}</div>
          ) : null}
          {pagerExportToolNode}
          {!hasPagerToolsSlotReplaceTools &&
            pagerRightToolsAfterBuiltin.map((tool) =>
              renderToolbarActionToolButton(tool)
            )}
          {hasPagerToolsSlotAfterTools || hasPagerToolsSlotReplaceTools ? (
            <div className="admin-table__toolbar-slot-content">{pagerToolsSlot}</div>
          ) : null}
        </li>
      )
    : null;

  return (
    <ConfigProvider locale={antdLocale} theme={antdThemeConfig as any}>
      <div
        ref={tableRootRef}
        className={[
          'admin-table',
          runtimeClassName ?? '',
          striped ? 'admin-table--striped' : '',
          paginationEnabled ? `admin-table--pager-align-${pagerPosition}` : '',
          maximized ? 'admin-table--maximized' : '',
        ].join(' ')}
      >
      {showToolbar ? (
        <div className="admin-table__toolbar">
          <div className="admin-table__toolbar-actions">
            {showTableTitle ? (
              <div className="admin-table__toolbar-title">
                {resolveSlot(runtimeSlots, 'table-title') ?? runtimeTableTitle}
                {runtimeTableTitleHelp ? (
                  <span
                    className="admin-table__toolbar-help"
                    title={runtimeTableTitleHelp}
                    aria-label={runtimeTableTitleHelp}
                  >
                    ?
                  </span>
                ) : null}
              </div>
            ) : null}
            {toolbarActionsSlot ? (
              <div className="admin-table__toolbar-slot-content">{toolbarActionsSlot}</div>
            ) : null}
          </div>
          {showToolbarCenter ? (
            <div className={toolbarHintClassName}>
              {hasToolbarCenterSlot ? (
                <div className="admin-table__toolbar-center-slot">{toolbarCenterSlot}</div>
              ) : resolvedToolbarHint ? (
                <div
                  ref={toolbarHintViewportRef}
                  className="admin-table__toolbar-hint-viewport"
                >
                  <span
                    ref={toolbarHintTextRef}
                    className={[
                      'admin-table__toolbar-hint-text',
                      toolbarHintShouldScroll ? 'is-running' : '',
                    ].join(' ')}
                    style={toolbarHintTextStyle}
                  >
                    {resolvedToolbarHint.text}
                  </span>
                </div>
              ) : null}
            </div>
          ) : null}
          <div className="admin-table__toolbar-tools">
            {toolbarToolsBeforeBuiltin.map((tool) =>
              renderToolbarActionToolButton(tool)
            )}
            {hasToolbarToolsSlotBeforeBuiltin ? (
              <div className="admin-table__toolbar-slot-content">{toolbarToolsSlot}</div>
            ) : null}
            {builtinToolbarTools
              .filter((tool) => tool.code !== 'custom')
              .map((tool) => (
                <button
                  key={`builtin-${tool.code}`}
                  className={['admin-table__toolbar-tool-btn', tool.code === 'zoom' && maximized ? 'is-active' : ''].join(' ')}
                  title={tool.title}
                  type="button"
                  onClick={() => {
                    void handleBuiltinToolClick(tool.code as 'refresh' | 'zoom');
                  }}
                >
                  <ToolbarToolIcon
                    code={tool.code}
                    active={
                      tool.code === 'zoom'
                        ? maximized
                        : tool.code === 'refresh'
                          ? refreshing
                          : false
                    }
                  />
                </button>
              ))}
            {builtinToolbarTools.some((tool) => tool.code === 'custom') ? (
              <div className="admin-table__toolbar-custom-wrap">
                <button
                  ref={customTriggerRef}
                  className={['admin-table__toolbar-tool-btn', customPanelOpen ? 'is-active' : ''].join(' ')}
                  title={localeText.custom}
                  type="button"
                  onClick={toggleCustomPanel}
                >
                  <ToolbarToolIcon code="custom" />
                </button>
                {customPanelOpen ? (
                  <div
                    ref={customPopoverRef}
                    className="admin-table__toolbar-custom-popover admin-table__toolbar-custom-popover-panel"
                  >
                    {customColumnsPanel}
                  </div>
                ) : null}
              </div>
            ) : null}
            {toolbarToolsAfterBuiltin.map((tool) =>
              renderToolbarActionToolButton(tool)
            )}
            {hasToolbarToolsSlotAfterBuiltin ? (
              <div className="admin-table__toolbar-slot-content">{toolbarToolsSlot}</div>
            ) : null}
            {showSearchButton ? (
              <button
                className={['admin-table__toolbar-action-btn', runtimeShowSearchForm ? 'is-primary' : ''].join(' ')}
                type="button"
                onClick={() => {
                  api.toggleSearchForm();
                  runtimeGridEvents?.toolbarToolClick?.({
                    code: 'search',
                  });
                }}
              >
                {getSearchPanelToggleTitle(runtimeShowSearchForm, localeText)}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {runtimeFormOptions && runtimeShowSearchForm !== false ? (
        <div className="admin-table__search">
          {resolveSlot(runtimeSlots, 'form') ?? (
            <SearchForm />
          )}
          {showSeparator ? <div className="admin-table__separator" style={separatorStyle} /> : null}
        </div>
      ) : null}

      <Table<TData>
        columns={tableColumns as any}
        dataSource={computedDataSource}
        bordered={mergedGridOptions.border ?? mergedGridOptions.bordered}
        loading={loading}
        onRow={mergedOnRow as any}
        rowClassName={rowClassName}
        rowKey={rowKeyField as any}
        rowSelection={resolvedRowSelection}
        {...tableVirtualProps}
        getPopupContainer={resolvePopupContainer}
        pagination={
          paginationEnabled
            ? {
                ...pagination,
                hideOnSinglePage:
                  mergedGridOptions.pagerConfig?.hideOnSinglePage ?? false,
                itemRender:
                  mergedGridOptions.pagerConfig?.itemRender ?? pagerItemRender,
                responsive:
                  mergedGridOptions.pagerConfig?.responsive ?? false,
                showQuickJumper:
                  mergedGridOptions.pagerConfig?.showQuickJumper ??
                  (!mobile && showPagerQuickJump),
                showSizeChanger:
                  mergedGridOptions.pagerConfig?.showSizeChanger ??
                  (!mobile && showPagerSizes),
                showTotal:
                  mergedGridOptions.pagerConfig?.showTotal ??
                  (showPagerTotal
                    ? (total: number) =>
                        localeText.pagerTotal.replace('{total}', String(total))
                    : undefined),
                size: 'small',
                position: mobile
                  ? ['bottomCenter']
                  : [pagerPosition === 'left' ? 'bottomLeft' : 'bottomRight'],
              }
            : false
        }
        scroll={resolvedTableScroll}
        locale={{
          emptyText: resolveSlot(runtimeSlots, 'empty') ?? <Empty description={localeText.noData} />,
        }}
        onChange={(nextPagination, nextFilters, sorter, extra) => {
          handleTableChange(
            nextPagination,
            nextFilters as Record<string, any>,
            sorter,
            extra
          );
        }}
      />
      {paginationMountNode &&
      (pagerLeftNode || pagerCenterNode || pagerHomeNode || pagerEndNode || pagerRightNode)
        ? createPortal(
            <>
              {pagerLeftNode}
              {pagerCenterNode}
              {pagerHomeNode}
              {pagerEndNode}
              {pagerRightNode}
            </>,
            paginationMountNode
          )
        : null}

        {resolveSlot(runtimeSlots, 'loading')}
      </div>
    </ConfigProvider>
  );
});
