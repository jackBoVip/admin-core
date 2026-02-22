<script lang="ts" setup>
import type {
  VxeGridInstance,
  VxeGridListeners,
  VxeGridProps as VxeTableGridProps,
} from 'vxe-table';

import type {
  AdminTableApi,
  ColumnCustomDragHoverState,
  ColumnCustomDragPosition,
  ColumnCustomDragState,
  ColumnCustomFlipRect,
  ColumnCustomSnapshot,
  ResolvedToolbarActionTool,
  TableColumnFixedValue,
  TableColumnRecord,
} from '@admin-core/table-core';
import type { AdminTableVueProps } from '../types';

import {
  computed,
  defineComponent,
  getCurrentInstance,
  h,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  toRaw,
  useSlots,
  watch,
  withDirectives,
} from 'vue';

import {
  alignSelectionKeysToRows,
  applySelectionCheckFieldToRows,
  applyColumnCustomFlipOffsets,
  applyColumnCustomDragMove,
  buildBuiltinToolbarTools,
  buildColumnCustomControls,
  buildColumnRuntimeItems,
  buildDefaultColumnFilterOptions,
  collectSelectionKeysByField,
  collectSelectionKeysByRows,
  collectColumnCustomFlipOffsets,
  collectColumnCustomFlipRects,
  createTableComparableSelectionKeySet,
  createColumnCustomDragResetState,
  createColumnCustomChangePayload,
  createTableLocaleText,
  deepEqual,
  ensureSeqColumn,
  ensureSelectionColumn,
  extendProxyOptions,
  getColumnFilterValueKey,
  getSearchPanelToggleTitle,
  getColumnValueByPath,
  getSeparatorStyle,
  getLocaleMessages,
  getGlobalTableFormatterRegistry,
  forceColumnCustomFlipReflow,
  flattenTableRows,
  hasTableRowStrategyStyle,
  hasColumnCustomSnapshot,
  isProxyEnabled,
  mergeWithArrayOverride,
  normalizeTableSelectionKeys,
  readColumnCustomStateFromStorage,
  resetColumnCustomFlipTransforms,
  resolveColumnCustomAutoScrollTop,
  resolveColumnCustomCancelState,
  resolveColumnCustomConfirmState,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomOpenState,
  resolveColumnCustomResetState,
  resolveColumnCustomWorkingSnapshot,
  resolveToolbarActionButtonRenderState,
  resolveColumnCustomState,
  resolveColumnCustomPersistenceConfig,
  resolveToolbarInlinePosition,
  resolveToolbarHintConfig,
  resolveSelectionMode,
  resolveSelectionRowsByKeys,
  resolveTableCellStrategyResult,
  resolveTableRowStrategyInlineStyle,
  resolveTableRowStrategyResult,
  resolveOperationColumnConfig,
  resolveOperationCellAlignClass,
  resolveVisibleOperationActionTools,
  resolveVisibleToolbarActionTools,
  resolveToolbarToolVisibility,
  shouldShowSeparator,
  resolveToolbarToolsSlotPosition,
  shallowEqualObjectRecord,
  triggerOperationActionTool,
  triggerTableCellStrategyClick,
  triggerTableRowStrategyClick,
  triggerToolbarActionTool,
  toggleAllColumnCustomVisible,
  toggleColumnCustomFilterable,
  toggleColumnCustomFixed,
  toggleColumnCustomSortable,
  toggleColumnCustomVisible,
  toTableComparableSelectionKey,
  writeColumnCustomStateToStorage,
} from '@admin-core/table-core';
import { useAdminForm } from '@admin-core/form-vue';
import { VxeGrid, VxeUI } from 'vxe-table';

import { useLocaleVersion } from '../composables/useLocaleVersion';
import { getAdminTableVueSetupState, syncAdminTableVueWithPreferences } from '../setup';
import '../styles/index.css';

interface Props extends AdminTableVueProps {
  api: AdminTableApi;
}

type TableSelectionKey = number | string;
type TableSelectionMode = 'checkbox' | 'radio';

const props = defineProps<Props>();
const slots = useSlots() as Record<string, (...args: any[]) => any>;
const setupState = getAdminTableVueSetupState();
const appDirectives = (getCurrentInstance()?.appContext.directives ?? {}) as Record<string, any>;
const gridRef = ref<VxeGridInstance>();
const toolbarHintViewportRef = ref<HTMLDivElement | null>(null);
const toolbarHintTextRef = ref<HTMLSpanElement | null>(null);
const toolbarHintShouldScroll = ref(false);
const localeVersion = useLocaleVersion();
const localeText = computed(() => {
  const tick = localeVersion.value;
  void tick;
  return createTableLocaleText(getLocaleMessages().table);
});

const state = ref(props.api.getSnapshot().props as AdminTableVueProps);
const unsub = props.api.store.subscribeSelector(
  (snapshot) => snapshot.props,
  (next) => {
    state.value = next as AdminTableVueProps;
  }
);
let latestIncomingProps: null | AdminTableVueProps = null;

watch(
  () => [
    props.class,
    props.formOptions,
    props.gridEvents,
    props.gridOptions,
    props.separator,
    props.showSearchForm,
    props.tableTitle,
    props.tableTitleHelp,
  ],
  () => {
    const { api: _api, ...rest } = props;
    const nextProps = rest as AdminTableVueProps;
    if (
      latestIncomingProps &&
      shallowEqualObjectRecord(
        latestIncomingProps as Record<string, any>,
        nextProps as Record<string, any>
      )
    ) {
      return;
    }
    latestIncomingProps = nextProps;
    props.api.setState(nextProps as any);
  },
  { immediate: true }
);

const [SearchForm, formApi] = useAdminForm({
  compact: true,
  commonConfig: {
    componentProps: {
      class: 'w-full',
    },
  },
  handleSubmit: async () => {
    const values = await formApi.getValues();
    formApi.setLatestSubmissionValues(values);
    await props.api.reload(values);
  },
  handleReset: async () => {
    const prevValues = await formApi.getValues();
    await formApi.resetForm();
    const values = await formApi.getValues();
    formApi.setLatestSubmissionValues(values);
    if (deepEqual(prevValues, values) || !state.value.formOptions?.submitOnChange) {
      await props.api.reload(values);
    }
  },
  showCollapseButton: true,
  submitButtonOptions: {
    content: localeText.value.search,
  },
  wrapperClass: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
});

watch(
  () => state.value.formOptions,
  (next) => {
    formApi.setState((prev) => mergeWithArrayOverride(next ?? {}, prev));
  },
  { deep: true, immediate: true }
);

watch(
  localeText,
  (next) => {
    formApi.setState((prev) => ({
      ...prev,
      submitButtonOptions: {
        ...(prev?.submitButtonOptions ?? {}),
        content: next.search,
      },
    }));
  },
  { immediate: true }
);

const isMobile = ref(false);
const maximized = ref(false);
const refreshing = ref(false);

const customPanelOpen = ref(false);
const customDraftVisibleColumns = ref<Record<string, boolean>>({});
const customDraftFilterableColumns = ref<Record<string, boolean>>({});
const customDraftFixedColumns = ref<Record<string, TableColumnFixedValue>>({});
const customDraftOrder = ref<string[]>([]);
const customDraftSortableColumns = ref<Record<string, boolean>>({});
const initialCustomDragState = createColumnCustomDragResetState();
const customDragState = ref<ColumnCustomDragState>(initialCustomDragState.dragState);
const innerSelectedRowKeys = ref<TableSelectionKey[]>([]);

const visibleColumns = ref<Record<string, boolean>>({});
const filterableColumns = ref<Record<string, boolean>>({});
const fixedColumns = ref<Record<string, TableColumnFixedValue>>({});
const columnOrder = ref<string[]>([]);
const sortableColumns = ref<Record<string, boolean>>({});

const customOriginState = ref<ColumnCustomSnapshot>({
  filterable: {},
  fixed: {},
  order: [],
  sortable: {},
  visible: {},
});
const customRowRefs = ref<Record<string, HTMLDivElement | null>>({});
const customBodyRef = ref<HTMLDivElement | null>(null);
const customPopoverRef = ref<HTMLDivElement | null>(null);
const customTriggerRef = ref<HTMLButtonElement | null>(null);

let customRowRects = new Map<string, ColumnCustomFlipRect>();
let customRowAnimationFrame: null | number = null;
let customMoveAnimationFrame: null | number = null;
let customPendingMove: null | {
  dragKey: string;
  overKey: string;
  position: ColumnCustomDragPosition;
} = null;
const customDraggingKey = ref<null | string>(null);
const customDragHover = ref<ColumnCustomDragHoverState>(initialCustomDragState.dragHover);
let syncingSelectionFromState = false;
let hasAppliedDefaultSelection = false;

const updateMobile = () => {
  if (typeof window === 'undefined') return;
  isMobile.value = window.matchMedia('(max-width: 768px)').matches;
  void nextTick(syncToolbarHintOverflow);
};

const toolbarConfig = computed(() => {
  return (state.value.gridOptions?.toolbarConfig ?? {}) as Record<string, any>;
});

const toolbarTools = computed<ResolvedToolbarActionTool[]>(() => {
  return resolveVisibleToolbarActionTools({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    excludeCodes: ['search'],
    maximized: maximized.value,
    permissionChecker: setupState.permissionChecker,
    showSearchForm: state.value.showSearchForm,
    tools: toolbarConfig.value.tools,
    useDirectiveWhenNoAccess: true,
  });
});

const toolbarHintConfig = computed(() => {
  return resolveToolbarHintConfig(toolbarConfig.value.hint);
});

const hasToolbarCenterSlot = computed(() => {
  return !!slots['toolbar-center'];
});

const showToolbarCenter = computed(() => {
  return hasToolbarCenterSlot.value || !!toolbarHintConfig.value;
});

const toolbarHintAlignClass = computed(() => {
  const align = toolbarHintConfig.value?.align ?? 'center';
  return `is-${align}`;
});

const toolbarHintOverflowClass = computed(() => {
  return toolbarHintConfig.value?.overflow === 'scroll' ? 'is-scroll' : 'is-wrap';
});

const toolbarHintTextStyle = computed(() => {
  const config = toolbarHintConfig.value;
  if (!config) {
    return undefined;
  }
  const style: Record<string, string> = {};
  if (config.color) {
    style.color = config.color;
  }
  if (config.fontSize) {
    style.fontSize = config.fontSize;
  }
  if (config.overflow === 'scroll') {
    style['--admin-table-toolbar-hint-duration'] = `${config.speed}s`;
  }
  return style;
});

const toolbarToolsPosition = computed(() => {
  return resolveToolbarInlinePosition(toolbarConfig.value.toolsPosition, 'after');
});

const toolbarToolsSlotPosition = computed(() => {
  return resolveToolbarToolsSlotPosition(toolbarConfig.value.toolsSlotPosition);
});

const hasToolbarToolsSlot = computed(() => {
  return !!slots['toolbar-tools'];
});

const hasToolbarToolsSlotReplaceBuiltin = computed(() => {
  return hasToolbarToolsSlot.value && toolbarToolsSlotPosition.value === 'replace';
});

const hasToolbarToolsSlotBeforeBuiltin = computed(() => {
  return hasToolbarToolsSlot.value && toolbarToolsSlotPosition.value === 'before';
});

const hasToolbarToolsSlotAfterBuiltin = computed(() => {
  return hasToolbarToolsSlot.value && toolbarToolsSlotPosition.value !== 'before';
});

const toolbarToolsBeforeBuiltin = computed(() => {
  return toolbarToolsPosition.value === 'before' ? toolbarTools.value : [];
});

const toolbarToolsAfterBuiltin = computed(() => {
  return toolbarToolsPosition.value === 'before' ? [] : toolbarTools.value;
});

const builtinToolbarTools = computed(() => {
  return buildBuiltinToolbarTools(toolbarConfig.value as any, localeText.value, {
    hasToolbarToolsSlot: hasToolbarToolsSlotReplaceBuiltin.value,
    maximized: maximized.value,
  });
});

const showSearchButton = computed(() => {
  return !!toolbarConfig.value.search && !!state.value.formOptions;
});

const showTableTitle = computed<boolean>(() => {
  return !!slots['table-title'] || !!state.value.tableTitle;
});

const showToolbar = computed<boolean>(() => {
  return (
    showTableTitle.value ||
    showToolbarCenter.value ||
    toolbarTools.value.length > 0 ||
    builtinToolbarTools.value.length > 0 ||
    showSearchButton.value ||
    !!slots['toolbar-actions'] ||
    hasToolbarToolsSlot.value
  );
});

const sourceGridOptions = computed(() => {
  const globalGridConfig = (VxeUI?.getConfig()?.grid ?? {}) as VxeTableGridProps;
  const merged = mergeWithArrayOverride(
    ({
      ...(state.value.gridOptions as Record<string, any>),
    } as Partial<VxeTableGridProps>),
    globalGridConfig
  ) as VxeTableGridProps;

  if (merged.proxyConfig) {
    merged.proxyConfig = {
      ...merged.proxyConfig,
      autoLoad: false,
      enabled: !!merged.proxyConfig.ajax,
    };
  }

  if (merged.formConfig) {
    merged.formConfig = {
      ...merged.formConfig,
      enabled: false,
    };
  }

  if (merged.toolbarConfig) {
    merged.toolbarConfig = {
      ...merged.toolbarConfig,
      enabled: false,
    } as any;
  }

  if (merged.pagerConfig) {
    const mobileLayouts = ['PrevJump', 'PrevPage', 'Number', 'NextPage', 'NextJump'];
    const layouts = ['Total', 'Sizes', 'Home', ...mobileLayouts, 'End'];

    merged.pagerConfig = {
      ...merged.pagerConfig,
      background: true,
      className: 'mt-2 w-full',
      layouts: isMobile.value ? mobileLayouts : layouts,
      pageSize: merged.pagerConfig.pageSize ?? 20,
      pageSizes: merged.pagerConfig.pageSizes ?? [10, 20, 30, 50, 100, 200],
      size: 'mini',
    } as any;
  }

  return merged;
});

const sourceColumns = computed<TableColumnRecord[]>(() => {
  return (sourceGridOptions.value.columns as TableColumnRecord[]) ?? [];
});

const columnCustomPersistenceConfig = computed(() => {
  return resolveColumnCustomPersistenceConfig(
    sourceGridOptions.value as Record<string, any>,
    sourceColumns.value
  );
});

const externalColumnCustomState = computed(() => {
  const external = resolveColumnCustomState(sourceGridOptions.value as Record<string, any>);
  if (hasColumnCustomSnapshot(external)) {
    return external;
  }
  return readColumnCustomStateFromStorage(columnCustomPersistenceConfig.value);
});

const runtimeColumns = computed<TableColumnRecord[]>(() => {
  const sourceData = Array.isArray(sourceGridOptions.value.data)
    ? (sourceGridOptions.value.data as Array<Record<string, any>>)
    : [];
  const emptyFilterLabel = localeText.value.emptyValue;
  const sourceGridOptionsRecord = sourceGridOptions.value as Record<string, any>;
  const formatterRegistry = getGlobalTableFormatterRegistry();
  const defaultFilterOptionsCache = new Map<
    string,
    ReturnType<typeof buildDefaultColumnFilterOptions>
  >();
  const resolveDefaultFilterOptions = (field: string) => {
    const cached = defaultFilterOptionsCache.get(field);
    if (cached) {
      return cached;
    }
    const next = buildDefaultColumnFilterOptions(sourceData, field, {
      emptyLabel: emptyFilterLabel,
    });
    defaultFilterOptionsCache.set(field, next);
    return next;
  };

  return buildColumnRuntimeItems(
    sourceColumns.value,
    {
      filterable: filterableColumns.value,
      fixed: fixedColumns.value,
      order: columnOrder.value,
      sortable: sortableColumns.value,
      visible: visibleColumns.value,
    },
    {
      includeVisibilityFlags: true,
    }
  ).map((item) => {
    const column = {
      ...(item.column as Record<string, any>),
    } as TableColumnRecord;
    const field = String(column.field ?? column.dataIndex ?? '');

    if (
      item.filterable &&
      field &&
      !Array.isArray(column.filters) &&
      typeof column.filterRender === 'undefined' &&
      typeof column.filterMethod !== 'function'
    ) {
      const filters = resolveDefaultFilterOptions(field);
      if (filters.length > 0) {
        column.filters = filters.map((option) => ({
          data: option.value,
          label: option.label,
          value: option.value,
        }));
        column.filterMethod = ({ option, row }: { option?: Record<string, any>; row: Record<string, any> }) => {
          const rowValue = getColumnValueByPath(row, field);
          const rowKey = getColumnFilterValueKey(rowValue);
          return rowKey === option?.value;
        };
      }
    }

    if (field) {
      const sourceFormatter = column.formatter;
      const sourceCellClassName = column.cellClassName;
      const sourceCellStyle = column.cellStyle;

      column.formatter = (params: Record<string, any>) => {
        const row = (params?.row ?? {}) as Record<string, any>;
        const rowIndex =
          typeof params?.rowIndex === 'number'
            ? params.rowIndex
            : typeof params?._rowIndex === 'number'
              ? params._rowIndex
              : -1;
        const rawValue = Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field);
        const strategyResult = resolveTableCellStrategyResult({
          column,
          field,
          gridOptions: sourceGridOptionsRecord,
          row,
          rowIndex,
          value: rawValue,
        });
        const strategyValue = strategyResult ? strategyResult.value : rawValue;

        if (typeof sourceFormatter === 'function') {
          try {
            return sourceFormatter({
              ...(params ?? {}),
              cellValue: strategyValue,
              value: strategyValue,
            });
          } catch {
            return strategyValue;
          }
        }
        if (typeof sourceFormatter === 'string') {
          const formatter = formatterRegistry.get(sourceFormatter);
          if (formatter) {
            return formatter(strategyValue, {
              column,
              row,
            });
          }
        }
        return strategyResult?.hasDisplayOverride
          ? strategyResult.displayValue
          : strategyValue;
      };

      column.cellClassName = (params: Record<string, any>) => {
        const sourceClassName = typeof sourceCellClassName === 'function'
          ? sourceCellClassName(params)
          : sourceCellClassName;
        const row = (params?.row ?? {}) as Record<string, any>;
        const rowIndex =
          typeof params?.rowIndex === 'number'
            ? params.rowIndex
            : typeof params?._rowIndex === 'number'
              ? params._rowIndex
              : -1;
        const rawValue = Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field);
        const strategyResult = resolveTableCellStrategyResult({
          column,
          field,
          gridOptions: sourceGridOptionsRecord,
          row,
          rowIndex,
          value: rawValue,
        });
        return [
          sourceClassName,
          strategyResult?.className,
          strategyResult?.clickable ? 'admin-table__strategy-clickable' : '',
        ]
          .filter(Boolean)
          .join(' ');
      };

      column.cellStyle = (params: Record<string, any>) => {
        const sourceStyle = typeof sourceCellStyle === 'function'
          ? sourceCellStyle(params)
          : sourceCellStyle;
        const row = (params?.row ?? {}) as Record<string, any>;
        const rowIndex =
          typeof params?.rowIndex === 'number'
            ? params.rowIndex
            : typeof params?._rowIndex === 'number'
              ? params._rowIndex
              : -1;
        const rawValue = Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field);
        const strategyResult = resolveTableCellStrategyResult({
          column,
          field,
          gridOptions: sourceGridOptionsRecord,
          row,
          rowIndex,
          value: rawValue,
        });
        return {
          ...((sourceStyle as Record<string, any> | undefined) ?? {}),
          ...((strategyResult?.style ?? {}) as Record<string, any>),
        };
      };
    }

    return column;
  });
});

const runtimeColumnsWithSeq = computed(() => {
  return ensureSeqColumn(
    runtimeColumns.value,
    (sourceGridOptions.value as Record<string, any>)?.seqColumn,
    {
      title: localeText.value.seq,
    }
  );
});

const operationColumnConfig = computed(() => {
  return resolveOperationColumnConfig(
    (sourceGridOptions.value as Record<string, any>)?.operationColumn as any,
    localeText.value
  );
});

const operationTools = computed<ResolvedToolbarActionTool[]>(() => {
  if (!operationColumnConfig.value) {
    return [];
  }
  return resolveVisibleOperationActionTools({
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    maximized: maximized.value,
    operationColumn: (sourceGridOptions.value as Record<string, any>)
      ?.operationColumn as any,
    permissionChecker: setupState.permissionChecker,
    showSearchForm: state.value.showSearchForm,
    useDirectiveWhenNoAccess: true,
  });
});

const selectionMode = computed<TableSelectionMode | undefined>(() => {
  return resolveSelectionMode(
    sourceGridOptions.value as Record<string, any>,
    runtimeColumnsWithSeq.value
  );
});

const rowSelectionConfig = computed(() => {
  return ((sourceGridOptions.value as Record<string, any>)?.rowSelection ??
    undefined) as Record<string, any> | undefined;
});

const modeSelectionConfig = computed(() => {
  if (selectionMode.value === 'radio') {
    return (sourceGridOptions.value as Record<string, any>)?.radioConfig as Record<string, any> | undefined;
  }
  if (selectionMode.value === 'checkbox') {
    return (sourceGridOptions.value as Record<string, any>)?.checkboxConfig as Record<string, any> | undefined;
  }
  return undefined;
});

const selectionRowKeyField = computed(() => {
  const rowConfig = (sourceGridOptions.value as Record<string, any>)?.rowConfig as Record<string, any> | undefined;
  const keyField = rowConfig?.keyField;
  return typeof keyField === 'string' && keyField.trim().length > 0
    ? keyField.trim()
    : 'id';
});

const selectionCheckField = computed(() => {
  const modeValue = modeSelectionConfig.value?.checkField;
  const rowValue = rowSelectionConfig.value?.checkField;
  const value = typeof modeValue === 'string'
    ? modeValue
    : typeof rowValue === 'string'
      ? rowValue
      : undefined;
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
});

const selectionCheckMethod = computed(() => {
  if (typeof modeSelectionConfig.value?.checkMethod === 'function') {
    return modeSelectionConfig.value.checkMethod as ((ctx: { row: Record<string, any>; rowIndex: number }) => boolean);
  }
  if (typeof rowSelectionConfig.value?.checkMethod === 'function') {
    return rowSelectionConfig.value.checkMethod as ((ctx: { row: Record<string, any>; rowIndex: number }) => boolean);
  }
  return undefined;
});

const selectionTrigger = computed(() => {
  const trigger = modeSelectionConfig.value?.trigger ?? rowSelectionConfig.value?.trigger;
  if (
    trigger === 'cell' ||
    trigger === 'default' ||
    trigger === 'manual' ||
    trigger === 'row'
  ) {
    return trigger;
  }
  return undefined;
});

const selectionHighlight = computed(() => {
  const modeValue = modeSelectionConfig.value?.highlight;
  if (typeof modeValue === 'boolean') {
    return modeValue;
  }
  const rowValue = rowSelectionConfig.value?.highlight;
  if (typeof rowValue === 'boolean') {
    return rowValue;
  }
  return selectionMode.value ? true : undefined;
});

const selectionStrict = computed(() => {
  const modeValue = modeSelectionConfig.value?.strict;
  if (typeof modeValue === 'boolean') {
    return modeValue;
  }
  const rowValue = rowSelectionConfig.value?.strict;
  if (typeof rowValue === 'boolean') {
    return rowValue;
  }
  return undefined;
});

const controlledSelectedRowKeys = computed<TableSelectionKey[] | undefined>(() => {
  const mode = selectionMode.value;
  if (!mode) {
    return undefined;
  }
  const value = rowSelectionConfig.value?.selectedRowKeys;
  if (!Array.isArray(value)) {
    return undefined;
  }
  return normalizeTableSelectionKeys<TableSelectionKey>(value, mode);
});

const defaultSelectedRowKeys = computed<TableSelectionKey[]>(() => {
  const mode = selectionMode.value;
  if (!mode) {
    return [];
  }
  const value = rowSelectionConfig.value?.defaultSelectedRowKeys;
  if (!Array.isArray(value)) {
    return [];
  }
  return normalizeTableSelectionKeys<TableSelectionKey>(value, mode);
});

const effectiveSelectedRowKeys = computed<TableSelectionKey[]>(() => {
  if (!selectionMode.value) {
    return [];
  }
  return controlledSelectedRowKeys.value ?? innerSelectedRowKeys.value;
});

const gridOptions = computed(() => {
  const sourceGridOptionsRecord =
    sourceGridOptions.value as Record<string, any>;
  const runtimeColumnsWithSelection = ensureSelectionColumn(
    runtimeColumnsWithSeq.value,
    selectionMode.value,
    {
      key: '__admin-table-auto-selection',
    }
  );
  const runtimeColumnsWithOperation =
    operationColumnConfig.value && operationTools.value.length > 0
      ? [
          ...runtimeColumnsWithSelection,
          {
            align: operationColumnConfig.value.align,
            fixed: operationColumnConfig.value.fixed,
            key: operationColumnConfig.value.key,
            slots: {
              default: '__admin_table_operation',
            },
            title: operationColumnConfig.value.title,
            width: operationColumnConfig.value.width,
            ...(operationColumnConfig.value.attrs ?? {}),
          } as TableColumnRecord,
        ]
      : runtimeColumnsWithSelection;
  const merged = {
    ...sourceGridOptionsRecord,
    columns: runtimeColumnsWithOperation,
  } as VxeTableGridProps;
  const sourceRowClassName = (merged as Record<string, any>).rowClassName;
  const sourceRowStyle = (merged as Record<string, any>).rowStyle;

  (merged as Record<string, any>).rowClassName = (params: Record<string, any>) => {
    const sourceClassName = typeof sourceRowClassName === 'function'
      ? sourceRowClassName(params)
      : sourceRowClassName;
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const rowStrategyResult = resolveTableRowStrategyResult({
      gridOptions: sourceGridOptionsRecord,
      row,
      rowIndex,
    });
    return [
      sourceClassName,
      hasTableRowStrategyStyle(rowStrategyResult?.style)
        ? 'admin-table__row--strategy'
        : '',
      rowStrategyResult?.className,
    ]
      .filter(Boolean)
      .join(' ');
  };

  (merged as Record<string, any>).rowStyle = (params: Record<string, any>) => {
    const sourceStyle = typeof sourceRowStyle === 'function'
      ? sourceRowStyle(params)
      : sourceRowStyle;
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const rowStrategyResult = resolveTableRowStrategyResult({
      gridOptions: sourceGridOptionsRecord,
      row,
      rowIndex,
    });
    const strategyInlineStyle = resolveTableRowStrategyInlineStyle(
      rowStrategyResult?.style
    );
    return {
      ...((sourceStyle as Record<string, any> | undefined) ?? {}),
      ...((strategyInlineStyle ?? {}) as Record<string, any>),
    };
  };

  const mode = selectionMode.value;
  const selectedKeys = controlledSelectedRowKeys.value;
  const defaultKeys = defaultSelectedRowKeys.value;

  if (mode === 'checkbox') {
    const checkboxConfig = {
      ...((merged as Record<string, any>).checkboxConfig ?? {}),
    } as Record<string, any>;
    if (
      typeof checkboxConfig.checkField !== 'string' &&
      selectionCheckField.value
    ) {
      checkboxConfig.checkField = selectionCheckField.value;
    }
    if (
      typeof checkboxConfig.checkMethod !== 'function' &&
      selectionCheckMethod.value
    ) {
      checkboxConfig.checkMethod = selectionCheckMethod.value;
    }
    if (
      (checkboxConfig.trigger === null ||
        checkboxConfig.trigger === undefined ||
        checkboxConfig.trigger === '') &&
      selectionTrigger.value
    ) {
      checkboxConfig.trigger = selectionTrigger.value;
    }
    if (typeof checkboxConfig.highlight !== 'boolean') {
      checkboxConfig.highlight = selectionHighlight.value ?? true;
    }
    if (
      typeof checkboxConfig.strict !== 'boolean' &&
      typeof selectionStrict.value === 'boolean'
    ) {
      checkboxConfig.strict = selectionStrict.value;
    }
    if (Array.isArray(selectedKeys)) {
      checkboxConfig.checkRowKeys = selectedKeys;
    } else if (
      (!Array.isArray(checkboxConfig.checkRowKeys) ||
        checkboxConfig.checkRowKeys.length <= 0) &&
      defaultKeys.length > 0
    ) {
      checkboxConfig.checkRowKeys = defaultKeys;
    }
    (merged as Record<string, any>).checkboxConfig = checkboxConfig;
  } else if (mode === 'radio') {
    const radioConfig = {
      ...((merged as Record<string, any>).radioConfig ?? {}),
    } as Record<string, any>;
    if (
      typeof radioConfig.checkMethod !== 'function' &&
      selectionCheckMethod.value
    ) {
      radioConfig.checkMethod = selectionCheckMethod.value;
    }
    if (
      (radioConfig.trigger === null ||
        radioConfig.trigger === undefined ||
        radioConfig.trigger === '') &&
      selectionTrigger.value
    ) {
      radioConfig.trigger = selectionTrigger.value;
    }
    if (typeof radioConfig.highlight !== 'boolean') {
      radioConfig.highlight = selectionHighlight.value ?? true;
    }
    if (
      typeof radioConfig.strict !== 'boolean' &&
      typeof selectionStrict.value === 'boolean'
    ) {
      radioConfig.strict = selectionStrict.value;
    }
    if (Array.isArray(selectedKeys)) {
      radioConfig.checkRowKey = selectedKeys[0];
    } else if (
      (radioConfig.checkRowKey === null ||
        radioConfig.checkRowKey === undefined ||
        radioConfig.checkRowKey === '') &&
      defaultKeys.length > 0
    ) {
      radioConfig.checkRowKey = defaultKeys[0];
    }
    (merged as Record<string, any>).radioConfig = radioConfig;
  }

  delete (merged as Record<string, any>).seqColumn;

  return extendProxyOptions(merged as Record<string, any>, () => {
    return formApi.getLatestSubmissionValues?.() ?? {};
  });
});

const runtimeGridEvents = computed(() => {
  return (state.value.gridEvents ?? {}) as Record<string, any>;
});

function getSelectionRows() {
  const sourceRows = Array.isArray(sourceGridOptions.value.data)
    ? (sourceGridOptions.value.data as Array<Record<string, any>>)
    : [];
  return flattenTableRows(sourceRows);
}

function getSelectionKeysByRows(rows: Array<Record<string, any>>) {
  return collectSelectionKeysByRows<
    Record<string, any>,
    TableSelectionKey
  >(rows, {
    keyField: selectionRowKeyField.value,
    mode: selectionMode.value,
  });
}

function resolveSelectedRowsByKeys(keys: TableSelectionKey[]) {
  return resolveSelectionRowsByKeys(getSelectionRows(), {
    keyField: selectionRowKeyField.value,
    selectedKeys: keys,
  });
}

function applySelectionCheckField(keys: TableSelectionKey[]) {
  const checkField = selectionCheckField.value;
  if (!checkField) {
    return;
  }
  const rowKeyField = selectionRowKeyField.value;
  const sourceRows = Array.isArray(sourceGridOptions.value.data)
    ? (sourceGridOptions.value.data as Array<Record<string, any>>)
    : [];
  if (sourceRows.length <= 0) {
    return;
  }
  const nextRows = applySelectionCheckFieldToRows(sourceRows, {
    checkField,
    keyField: rowKeyField,
    selectedKeys: keys,
  });
  if (nextRows.changed) {
    props.api.setGridOptions({
      data: nextRows.rows as any,
    });
  }
}

function updateSelectionState(
  keys: TableSelectionKey[],
  params?: Record<string, any>
) {
  const mode = selectionMode.value;
  if (!mode) {
    return;
  }
  const normalizedKeys = normalizeTableSelectionKeys<TableSelectionKey>(keys, mode);
  const alignedKeys = alignSelectionKeysToRows<
    Record<string, any>,
    TableSelectionKey
  >(
    normalizedKeys,
    getSelectionRows(),
    selectionRowKeyField.value
  );
  if (!controlledSelectedRowKeys.value) {
    if (!deepEqual(innerSelectedRowKeys.value, alignedKeys)) {
      innerSelectedRowKeys.value = alignedKeys;
    }
  } else {
    void nextTick(() => syncGridSelectionFromState());
  }
  if (mode === 'radio' && selectionCheckField.value) {
    applySelectionCheckField(alignedKeys);
  }
  const onChange = rowSelectionConfig.value?.onChange;
  if (typeof onChange === 'function') {
    onChange(
      alignedKeys,
      resolveSelectedRowsByKeys(alignedKeys),
      params
    );
  }
}

function handleSelectionRadioChange(params: Record<string, any>) {
  if (syncingSelectionFromState) {
    return;
  }
  const selectedRow =
    gridRef.value?.getRadioRecord?.(true) ??
    params?.row ??
    null;
  const keyField = selectionRowKeyField.value;
  const rowKey = selectedRow?.[keyField];
  const keys =
    rowKey === null || rowKey === undefined
      ? []
      : [rowKey as TableSelectionKey];
  updateSelectionState(keys, params);
}

function handleSelectionCheckboxChange(params: Record<string, any>) {
  if (syncingSelectionFromState) {
    return;
  }
  const records = Array.isArray(params?.records)
    ? (params.records as Array<Record<string, any>>)
    : (gridRef.value?.getCheckboxRecords?.(true) as Array<Record<string, any>> | undefined) ?? [];
  updateSelectionState(getSelectionKeysByRows(records), params);
}

async function syncGridSelectionFromState() {
  const grid = gridRef.value as any;
  const mode = selectionMode.value;
  if (!grid || !mode) {
    return;
  }
  const controlledKeys = controlledSelectedRowKeys.value;
  if (!Array.isArray(controlledKeys)) {
    return;
  }
  const keys = normalizeTableSelectionKeys<TableSelectionKey>(controlledKeys, mode);
  const keySet = createTableComparableSelectionKeySet(keys);
  const rows = getSelectionRows();
  const keyField = selectionRowKeyField.value;

  syncingSelectionFromState = true;
  try {
    if (mode === 'radio') {
      const selectedKey = keys[0];
      if (selectedKey !== null && selectedKey !== undefined) {
        if (typeof grid.setRadioRowKey === 'function') {
          await grid.setRadioRowKey(selectedKey);
        } else {
          const selectedRow = rows.find((row) =>
            keySet.has(
              toTableComparableSelectionKey(row?.[keyField] as TableSelectionKey) ?? ''
            )
          );
          if (selectedRow) {
            await grid.setRadioRow?.(selectedRow);
          } else {
            await grid.clearRadioRow?.();
          }
        }
      } else {
        await grid.clearRadioRow?.();
      }
      return;
    }

    await grid.clearCheckboxRow?.();
    if (keys.length <= 0) {
      return;
    }
    if (typeof grid.setCheckboxRowKey === 'function') {
      await grid.setCheckboxRowKey(keys, true);
      return;
    }
    const selectedRows = rows.filter((row) =>
      keySet.has(
        toTableComparableSelectionKey(row?.[keyField] as TableSelectionKey) ?? ''
      )
    );
    if (selectedRows.length > 0 && typeof grid.setCheckboxRow === 'function') {
      await grid.setCheckboxRow(selectedRows, true);
    }
  } finally {
    syncingSelectionFromState = false;
  }
}

const gridEvents = computed(() => {
  const source = runtimeGridEvents.value;
  const sourceGridOptionsRecord = sourceGridOptions.value as Record<string, any>;
  const next = {
    ...source,
  } as Record<string, any>;
  const sourceRadioChange = source.radioChange;
  const sourceCheckboxChange = source.checkboxChange;
  const sourceCheckboxAll = source.checkboxAll;
  const sourceCellClick = source.cellClick;
  const sourceRowClick = source.rowClick;

  next.radioChange = (params: Record<string, any>) => {
    handleSelectionRadioChange(params);
    if (typeof sourceRadioChange === 'function') {
      sourceRadioChange(params);
    }
  };
  next.checkboxChange = (params: Record<string, any>) => {
    handleSelectionCheckboxChange(params);
    if (typeof sourceCheckboxChange === 'function') {
      sourceCheckboxChange(params);
    }
  };
  next.checkboxAll = (params: Record<string, any>) => {
    handleSelectionCheckboxChange(params);
    if (typeof sourceCheckboxAll === 'function') {
      sourceCheckboxAll(params);
    }
  };
  next.cellClick = (params: Record<string, any>) => {
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const field = String(
      params?.column?.field ??
      params?.column?.property ??
      params?.column?.dataIndex ??
      ''
    );
    if (field) {
      const column = (params?.column ?? {}) as Record<string, any>;
      const strategyResult = resolveTableCellStrategyResult({
        column,
        field,
        gridOptions: sourceGridOptionsRecord,
        row,
        rowIndex,
        value: Object.prototype.hasOwnProperty.call(params ?? {}, 'cellValue')
          ? params.cellValue
          : getColumnValueByPath(row, field),
      });
      const triggerResult = triggerTableCellStrategyClick({
        column,
        event: params?.$event ?? params?.event,
        field,
        respectDefaultPrevented: false,
        row,
        rowIndex,
        strategyResult,
      });
      if (triggerResult.blocked) {
        return;
      }
    }
    if (typeof sourceCellClick === 'function') {
      sourceCellClick(params);
    }
  };
  next.rowClick = (params: Record<string, any>) => {
    const row = (params?.row ?? {}) as Record<string, any>;
    const rowIndex =
      typeof params?.rowIndex === 'number'
        ? params.rowIndex
        : typeof params?._rowIndex === 'number'
          ? params._rowIndex
          : -1;
    const rowStrategyResult = resolveTableRowStrategyResult({
      gridOptions: sourceGridOptionsRecord,
      row,
      rowIndex,
    });
    const triggerResult = triggerTableRowStrategyClick({
      event: params?.$event ?? params?.event,
      respectDefaultPrevented: false,
      row,
      rowIndex,
      strategyResult: rowStrategyResult,
    });
    if (triggerResult.blocked) {
      return;
    }
    if (typeof sourceRowClick === 'function') {
      sourceRowClick(params);
    }
  };

  return next as VxeGridListeners;
});

watch(
  selectionMode,
  (nextMode, prevMode) => {
    if (nextMode !== prevMode) {
      hasAppliedDefaultSelection = false;
    }
    if (!nextMode) {
      innerSelectedRowKeys.value = [];
    }
  },
  { immediate: true }
);

watch(
  [
    () => sourceGridOptions.value.data,
    selectionCheckField,
    selectionMode,
    controlledSelectedRowKeys,
    defaultSelectedRowKeys,
    selectionRowKeyField,
  ],
  ([
    _rows,
    checkField,
    mode,
    controlledKeys,
    defaultKeys,
    rowKeyField,
  ]) => {
    if (!mode) {
      if (innerSelectedRowKeys.value.length > 0) {
        innerSelectedRowKeys.value = [];
      }
      hasAppliedDefaultSelection = false;
      return;
    }
    if (Array.isArray(controlledKeys)) {
      if (!deepEqual(innerSelectedRowKeys.value, controlledKeys)) {
        innerSelectedRowKeys.value = controlledKeys;
      }
      hasAppliedDefaultSelection = true;
      return;
    }
    if (checkField) {
      const derivedKeys = collectSelectionKeysByField(
        getSelectionRows(),
        {
          checkField,
          keyField: rowKeyField,
          mode,
        }
      );
      if (!deepEqual(innerSelectedRowKeys.value, derivedKeys)) {
        innerSelectedRowKeys.value = derivedKeys;
      }
      hasAppliedDefaultSelection = true;
      return;
    }
    if (!hasAppliedDefaultSelection) {
      if (
        defaultKeys.length > 0 &&
        !deepEqual(innerSelectedRowKeys.value, defaultKeys)
      ) {
        innerSelectedRowKeys.value = defaultKeys;
      }
      hasAppliedDefaultSelection = true;
    }
  },
  { immediate: true }
);

watch(
  [
    () => gridRef.value,
    () => sourceGridOptions.value.data,
    effectiveSelectedRowKeys,
    selectionMode,
    selectionRowKeyField,
  ],
  () => {
    void nextTick(() => syncGridSelectionFromState());
  },
  { flush: 'post', immediate: true }
);

function getCurrentColumnCustomState() {
  return {
    filterable: filterableColumns.value,
    fixed: fixedColumns.value,
    order: columnOrder.value,
    sortable: sortableColumns.value,
    visible: visibleColumns.value,
  };
}

function getDraftColumnCustomState() {
  return {
    filterable: customDraftFilterableColumns.value,
    fixed: customDraftFixedColumns.value,
    order: customDraftOrder.value,
    sortable: customDraftSortableColumns.value,
    visible: customDraftVisibleColumns.value,
  };
}

function applyCurrentColumnCustomSnapshot(snapshot: ColumnCustomSnapshot) {
  if (!deepEqual(visibleColumns.value, snapshot.visible)) {
    visibleColumns.value = snapshot.visible;
  }
  if (!deepEqual(fixedColumns.value, snapshot.fixed)) {
    fixedColumns.value = snapshot.fixed;
  }
  if (!deepEqual(sortableColumns.value, snapshot.sortable)) {
    sortableColumns.value = snapshot.sortable;
  }
  if (!deepEqual(filterableColumns.value, snapshot.filterable)) {
    filterableColumns.value = snapshot.filterable;
  }
  if (!deepEqual(columnOrder.value, snapshot.order)) {
    columnOrder.value = snapshot.order;
  }
}

function applyDraftColumnCustomSnapshot(snapshot: ColumnCustomSnapshot) {
  if (!deepEqual(customDraftVisibleColumns.value, snapshot.visible)) {
    customDraftVisibleColumns.value = snapshot.visible;
  }
  if (!deepEqual(customDraftFixedColumns.value, snapshot.fixed)) {
    customDraftFixedColumns.value = snapshot.fixed;
  }
  if (!deepEqual(customDraftOrder.value, snapshot.order)) {
    customDraftOrder.value = snapshot.order;
  }
  if (!deepEqual(customDraftSortableColumns.value, snapshot.sortable)) {
    customDraftSortableColumns.value = snapshot.sortable;
  }
  if (!deepEqual(customDraftFilterableColumns.value, snapshot.filterable)) {
    customDraftFilterableColumns.value = snapshot.filterable;
  }
}

watch(
  [sourceColumns, externalColumnCustomState],
  ([nextColumns, nextExternalState]) => {
    const snapshot = resolveColumnCustomWorkingSnapshot(nextColumns, {
      current: getCurrentColumnCustomState(),
      external: nextExternalState,
    });
    applyCurrentColumnCustomSnapshot(snapshot);
  },
  { immediate: true }
);

watch(
  [
    sourceColumns,
    customPanelOpen,
    visibleColumns,
    fixedColumns,
    columnOrder,
    sortableColumns,
    filterableColumns,
  ],
  () => {
    if (customPanelOpen.value) {
      return;
    }
    const snapshot = resolveColumnCustomOpenSnapshot(
      sourceColumns.value,
      getCurrentColumnCustomState()
    );
    applyDraftColumnCustomSnapshot(snapshot);
  },
  {
    immediate: true,
  }
);

const customColumnControls = computed(() => {
  return buildColumnCustomControls(sourceColumns.value, {
    filterable: customDraftFilterableColumns.value,
    fixed: customDraftFixedColumns.value,
    order: customDraftOrder.value,
    sortable: customDraftSortableColumns.value,
    visible: customDraftVisibleColumns.value,
  });
});

const customAllChecked = computed(() => {
  return (
    customColumnControls.value.length > 0 &&
    customColumnControls.value.every((column) => column.checked)
  );
});

const customAllIndeterminate = computed(() => {
  return (
    customColumnControls.value.some((column) => column.checked) &&
    !customAllChecked.value
  );
});

const customPanelDirty = computed(() => {
  return !deepEqual(
    {
      filterable: customDraftFilterableColumns.value,
      fixed: customDraftFixedColumns.value,
      order: customDraftOrder.value,
      sortable: customDraftSortableColumns.value,
      visible: customDraftVisibleColumns.value,
    },
    customOriginState.value
  );
});

watch(
  [customColumnControls, customPanelOpen],
  async ([controls, open]) => {
    if (typeof window === 'undefined') {
      return;
    }

    if (!open) {
      customRowRects.clear();
      clearCustomMoveFrame();
      cancelCustomRowAnimation();
      resetColumnCustomFlipTransforms(Object.values(customRowRefs.value));
      return;
    }

    await nextTick();

    const nextRects = collectColumnCustomFlipRects({
      controls,
      resolveNode: (key) => customRowRefs.value[key],
    });

    if (customRowRects.size > 0) {
      const flipOffsets = collectColumnCustomFlipOffsets({
        controls,
        draggingKey: customDraggingKey.value,
        nextRects,
        prevRects: customRowRects,
      });
      const movedNodes = applyColumnCustomFlipOffsets({
        offsets: flipOffsets,
        resolveNode: (key) => customRowRefs.value[key],
      });

      if (movedNodes.length > 0) {
        forceColumnCustomFlipReflow(movedNodes);

        cancelCustomRowAnimation();
        customRowAnimationFrame = window.requestAnimationFrame(() => {
          resetColumnCustomFlipTransforms(movedNodes);
          customRowAnimationFrame = null;
        });
      }
    }

    customRowRects = nextRects;
  },
  { flush: 'post' }
);

const delegatedSlots = computed<string[]>(() => {
  return Object.keys(slots).filter(
    (name) =>
      ![
        'table-title',
        'toolbar-center',
        'toolbar-actions',
        'toolbar-tools',
        'form',
        'empty',
        'loading',
      ].includes(name) && !name.startsWith('form-')
  );
});

const delegatedFormSlots = computed<string[]>(() => {
  return Object.keys(slots)
    .filter((name) => name.startsWith('form-'))
    .map((name) => name.replace('form-', ''));
});

const showSeparator = computed(() => {
  return shouldShowSeparator({
    hasFormOptions: !!state.value.formOptions,
    separator: state.value.separator,
    showSearchForm: state.value.showSearchForm,
  });
});

const separatorStyle = computed(() => {
  return getSeparatorStyle(state.value.separator);
});

function syncToolbarHintOverflow() {
  const config = toolbarHintConfig.value;
  if (!config || config.overflow !== 'scroll' || hasToolbarCenterSlot.value) {
    toolbarHintShouldScroll.value = false;
    return;
  }
  const viewport = toolbarHintViewportRef.value;
  const textNode = toolbarHintTextRef.value;
  if (!viewport || !textNode) {
    toolbarHintShouldScroll.value = false;
    return;
  }
  toolbarHintShouldScroll.value = textNode.scrollWidth > viewport.clientWidth + 1;
}

watch(
  () => [
    toolbarHintConfig.value?.align,
    toolbarHintConfig.value?.overflow,
    toolbarHintConfig.value?.speed,
    toolbarHintConfig.value?.text,
    hasToolbarCenterSlot.value,
    showToolbar.value,
  ],
  () => {
    void nextTick(syncToolbarHintOverflow);
  },
  { immediate: true }
);

function cancelCustomRowAnimation() {
  if (typeof window !== 'undefined' && customRowAnimationFrame !== null) {
    window.cancelAnimationFrame(customRowAnimationFrame);
  }
  customRowAnimationFrame = null;
}

function clearCustomMoveFrame() {
  customPendingMove = null;
  if (typeof window !== 'undefined' && customMoveAnimationFrame !== null) {
    window.cancelAnimationFrame(customMoveAnimationFrame);
  }
  customMoveAnimationFrame = null;
}

function resetCustomDragState() {
  clearCustomMoveFrame();
  const nextState = createColumnCustomDragResetState();
  customDraggingKey.value = nextState.draggingKey;
  customDragHover.value = nextState.dragHover;
  customDragState.value = nextState.dragState;
}

function setCustomRowRef(key: string, node: HTMLDivElement | null) {
  if (node) {
    customRowRefs.value[key] = node;
    return;
  }
  delete customRowRefs.value[key];
}

function autoScrollCustomBody(clientY: number) {
  const body = customBodyRef.value;
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
}

function applyDraftToGrid(snapshot: ColumnCustomSnapshot) {
  writeColumnCustomStateToStorage(columnCustomPersistenceConfig.value, snapshot);
  const nextColumns = buildColumnRuntimeItems(
    sourceColumns.value,
    snapshot,
    {
      includeVisibilityFlags: true,
    }
  ).map((item) => item.column);

  props.api.setGridOptions({
    columnCustomState: snapshot as any,
    columns: nextColumns as any,
  });
}

function emitColumnCustomChange(action: 'cancel' | 'confirm' | 'open' | 'reset', snapshot: ColumnCustomSnapshot) {
  runtimeGridEvents.value?.columnCustomChange?.(
    createColumnCustomChangePayload(
      sourceColumns.value,
      action,
      snapshot
    ) as any
  );
}

function openCustomPanel() {
  const { draft, origin, snapshot } = resolveColumnCustomOpenState(
    sourceColumns.value,
    getCurrentColumnCustomState()
  );
  customOriginState.value = origin;
  applyDraftColumnCustomSnapshot(draft);
  resetCustomDragState();
  customPanelOpen.value = true;

  runtimeGridEvents.value?.toolbarToolClick?.({
    code: 'custom',
  } as any);
  emitColumnCustomChange('open', snapshot);
}

function handleCustomCancel() {
  const { draft, snapshot } = resolveColumnCustomCancelState(
    sourceColumns.value,
    {
      current: getCurrentColumnCustomState(),
      origin: customOriginState.value,
    }
  );
  applyDraftColumnCustomSnapshot(draft);
  customPanelOpen.value = false;
  resetCustomDragState();
  emitColumnCustomChange('cancel', snapshot);
}

function handleCustomConfirm() {
  const { current, origin, snapshot } = resolveColumnCustomConfirmState(
    sourceColumns.value,
    getDraftColumnCustomState()
  );
  customOriginState.value = origin;
  applyCurrentColumnCustomSnapshot(current);
  applyDraftToGrid(snapshot);

  customPanelOpen.value = false;
  resetCustomDragState();
  emitColumnCustomChange('confirm', snapshot);
}

function handleCustomReset() {
  if (!customPanelDirty.value) {
    return;
  }
  const confirmed = typeof window === 'undefined'
    ? true
    : window.confirm(localeText.value.customRestoreConfirm);
  if (!confirmed) {
    return;
  }

  const { current, draft, origin, snapshot } = resolveColumnCustomResetState(
    sourceColumns.value
  );
  customOriginState.value = origin;
  applyDraftColumnCustomSnapshot(draft);
  applyCurrentColumnCustomSnapshot(current);
  applyDraftToGrid(snapshot);

  customPanelOpen.value = false;
  resetCustomDragState();
  emitColumnCustomChange('reset', snapshot);
}

function toggleCustomAllColumns() {
  const next = toggleAllColumnCustomVisible(
    sourceColumns.value,
    customDraftVisibleColumns.value
  );
  if (!deepEqual(customDraftVisibleColumns.value, next)) {
    customDraftVisibleColumns.value = next;
  }
}

function toggleCustomColumnVisibleByKey(key: string) {
  const next = toggleColumnCustomVisible(customDraftVisibleColumns.value, key);
  if (!deepEqual(customDraftVisibleColumns.value, next)) {
    customDraftVisibleColumns.value = next;
  }
}

function toggleCustomColumnFixedByKey(
  key: string,
  value: TableColumnFixedValue
) {
  const next = toggleColumnCustomFixed(customDraftFixedColumns.value, key, value);
  if (!deepEqual(customDraftFixedColumns.value, next)) {
    customDraftFixedColumns.value = next;
  }
}

function toggleCustomColumnSortableByKey(key: string) {
  const next = toggleColumnCustomSortable(customDraftSortableColumns.value, key);
  if (!deepEqual(customDraftSortableColumns.value, next)) {
    customDraftSortableColumns.value = next;
  }
}

function toggleCustomColumnFilterableByKey(key: string) {
  const next = toggleColumnCustomFilterable(customDraftFilterableColumns.value, key);
  if (!deepEqual(customDraftFilterableColumns.value, next)) {
    customDraftFilterableColumns.value = next;
  }
}

function moveCustomColumnTo(
  dragKey: string,
  overKey: string,
  position: ColumnCustomDragPosition
) {
  const next = applyColumnCustomDragMove(
    sourceColumns.value,
    customDraftOrder.value,
    dragKey,
    overKey,
    position
  );
  if (!deepEqual(customDraftOrder.value, next)) {
    customDraftOrder.value = next;
  }
}

function queueCustomMove(
  dragKey: string,
  overKey: string,
  position: ColumnCustomDragPosition
) {
  customPendingMove = {
    dragKey,
    overKey,
    position,
  };

  if (typeof window === 'undefined') {
    const pending = customPendingMove;
    customPendingMove = null;
    if (!pending) {
      return;
    }
    moveCustomColumnTo(pending.dragKey, pending.overKey, pending.position);
    return;
  }

  if (customMoveAnimationFrame !== null) {
    return;
  }

  customMoveAnimationFrame = window.requestAnimationFrame(() => {
    customMoveAnimationFrame = null;
    const pending = customPendingMove;
    customPendingMove = null;
    if (!pending) {
      return;
    }
    moveCustomColumnTo(pending.dragKey, pending.overKey, pending.position);
  });
}

function handleCustomDragStart(key: string, event: DragEvent) {
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', key);
  }

  const nextState = resolveColumnCustomDragStartState(key);
  customDraggingKey.value = nextState.draggingKey;
  customDragHover.value = nextState.dragHover;
  customDragState.value = nextState.dragState;
}

function handleCustomDragOver(key: string, event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  const dragKey = resolveColumnCustomDraggingKey(
    customDraggingKey.value,
    customDragState.value
  );
  if (!dragKey) {
    return;
  }

  const target = event.currentTarget as HTMLElement | null;
  if (!target) {
    return;
  }

  if (typeof event.clientY === 'number') {
    autoScrollCustomBody(event.clientY);
  }

  const rect = target.getBoundingClientRect();
  const nextState = resolveColumnCustomDragOverState({
    dragKey,
    offsetY: event.clientY - rect.top,
    overKey: key,
    previousHover: customDragHover.value,
    rowHeight: rect.height,
  });
  if (!nextState) {
    return;
  }

  if (!deepEqual(customDragState.value, nextState.dragState)) {
    customDragState.value = nextState.dragState;
  }

  if (!nextState.shouldQueueMove) {
    return;
  }

  customDragHover.value = nextState.dragHover;
  queueCustomMove(
    dragKey,
    key,
    nextState.dragState.position as ColumnCustomDragPosition
  );
}

function handleCustomBodyDragOver(event: DragEvent) {
  const dragKey = resolveColumnCustomDraggingKey(
    customDraggingKey.value,
    customDragState.value
  );
  if (!dragKey) {
    return;
  }

  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  if (typeof event.clientY === 'number') {
    autoScrollCustomBody(event.clientY);
  }
}

function handleCustomDrop(_key: string, event: DragEvent) {
  event.preventDefault();
  resetCustomDragState();
}

function handleCustomDragEnd() {
  resetCustomDragState();
}

function toggleCustomPanel() {
  if (customPanelOpen.value) {
    handleCustomCancel();
    return;
  }
  openCustomPanel();
}

function handleSearchToggle() {
  props.api.toggleSearchForm();
  runtimeGridEvents.value?.toolbarToolClick?.({
    code: 'search',
  } as any);
}

async function runCommitProxy(mode: 'query' | 'reload', params: Record<string, any>) {
  if (!gridRef.value?.commitProxy) {
    return undefined;
  }
  return await gridRef.value.commitProxy(mode, toRaw(params));
}

async function handleBuiltinToolClick(code: 'refresh' | 'zoom') {
  if (code === 'refresh') {
    const hasProxy = isProxyEnabled(gridOptions.value.proxyConfig as Record<string, any> | undefined);
    refreshing.value = true;
    try {
      if (hasProxy) {
        const values = formApi.getLatestSubmissionValues?.() ?? {};
        await props.api.query(values);
      } else {
        const nextData = [...((state.value.gridOptions?.data as any[]) ?? [])];
        props.api.setLoading(true);
        props.api.setGridOptions({
          data: nextData,
        });
        await new Promise((resolve) => {
          setTimeout(resolve, 220);
        });
        props.api.setLoading(false);
      }
    } finally {
      refreshing.value = false;
    }
  }

  if (code === 'zoom') {
    maximized.value = !maximized.value;
  }

  runtimeGridEvents.value?.toolbarToolClick?.({
    code,
  } as any);
}

function handleCustomToolClick(tool: Record<string, any>, index: number) {
  if (tool?.disabled) {
    return;
  }
  triggerToolbarActionTool(tool, index, {
    onToolbarToolClick: (payload) => {
      runtimeGridEvents.value?.toolbarToolClick?.(payload as any);
    },
  });
}

function handleOperationToolClick(
  tool: Record<string, any>,
  index: number,
  row: Record<string, any>,
  rowIndex: number
) {
  if (tool?.disabled) {
    return;
  }
  triggerOperationActionTool(tool, index, {
    onOperationToolClick: (payload) => {
      runtimeGridEvents.value?.operationToolClick?.(payload as any);
    },
    row,
    rowIndex,
  });
}

function toButtonDirectiveTuple(
  tool: ResolvedToolbarActionTool
): null | [any, any, any, Record<string, boolean>] {
  const permission = tool.permission;
  if (!permission) {
    return null;
  }
  const directiveName =
    typeof permission.name === 'string' && permission.name.trim().length > 0
      ? permission.name
      : 'access';
  const directive = appDirectives[directiveName];
  if (!directive) {
    return null;
  }
  const modifiers = {
    ...(permission.modifiers ?? {}),
  };
  if (
    !Object.prototype.hasOwnProperty.call(modifiers, 'and') &&
    !Object.prototype.hasOwnProperty.call(modifiers, 'or') &&
    (permission.mode === 'and' || permission.mode === 'or')
  ) {
    modifiers[permission.mode] = true;
  }
  return [
    directive,
    permission.value,
    permission.arg,
    modifiers,
  ];
}

function canRenderToolbarActionTool(
  tool: null | Record<string, any> | undefined
) {
  return resolveToolbarToolVisibility(tool, {
    accessCodes: setupState.accessCodes,
    accessRoles: setupState.accessRoles,
    directiveRenderer: (candidate) =>
      !!toButtonDirectiveTuple(candidate as ResolvedToolbarActionTool),
    permissionChecker: setupState.permissionChecker,
    useDirectiveWhenNoAccess: true,
  });
}

const ToolbarActionButton = defineComponent({
  name: 'AdminTableToolbarActionButton',
  props: {
    tool: {
      required: true,
      type: Object as any,
    },
  },
  setup(buttonProps) {
    return () => {
      const tool = buttonProps.tool as ResolvedToolbarActionTool;
      if (!canRenderToolbarActionTool(tool)) {
        return null;
      }
      const { attrs, classList, disabled, presentation, title } =
        resolveToolbarActionButtonRenderState(tool);
      const iconNode = presentation.hasIcon
        ? h('i', {
            'aria-hidden': 'true',
            class: [
              'admin-table__toolbar-action-icon',
              presentation.iconClass,
            ],
          })
        : null;
      const textNode = presentation.text
        ? h(
            'span',
            {
              class: 'admin-table__toolbar-action-text',
            },
            presentation.text
          )
        : null;
      const children = [iconNode, textNode].filter(Boolean);
      const node = h(
        'button',
        {
          ...attrs,
          class: classList,
          disabled,
          title,
          type: 'button',
          onClick: () => {
            handleCustomToolClick(tool, tool.index);
          },
        },
        children
      );

      const tuple = toButtonDirectiveTuple(tool);
      if (!tuple) {
        return node;
      }
      return withDirectives(node, [tuple]);
    };
  },
});

const OperationActionButton = defineComponent({
  name: 'AdminTableOperationActionButton',
  props: {
    row: {
      required: true,
      type: Object as any,
    },
    rowIndex: {
      default: -1,
      type: Number,
    },
    tool: {
      required: true,
      type: Object as any,
    },
  },
  setup(buttonProps) {
    return () => {
      const tool = buttonProps.tool as ResolvedToolbarActionTool;
      if (!canRenderToolbarActionTool(tool)) {
        return null;
      }
      const { attrs, classList, disabled, presentation, title } =
        resolveToolbarActionButtonRenderState(tool);
      const iconNode = presentation.hasIcon
        ? h('i', {
            'aria-hidden': 'true',
            class: [
              'admin-table__toolbar-action-icon',
              presentation.iconClass,
            ],
          })
        : null;
      const textNode = presentation.text
        ? h(
            'span',
            {
              class: 'admin-table__toolbar-action-text',
            },
            presentation.text
          )
        : null;
      const children = [iconNode, textNode].filter(Boolean);
      const node = h(
        'button',
        {
          ...attrs,
          class: classList,
          disabled,
          title,
          type: 'button',
          onClick: (event: MouseEvent) => {
            event.stopPropagation();
            handleOperationToolClick(
              tool,
              tool.index,
              buttonProps.row as Record<string, any>,
              buttonProps.rowIndex
            );
          },
        },
        children
      );

      const tuple = toButtonDirectiveTuple(tool);
      if (!tuple) {
        return node;
      }
      return withDirectives(node, [tuple]);
    };
  },
});

function handleDocumentMouseDown(event: MouseEvent) {
  if (!customPanelOpen.value) {
    return;
  }
  const target = event.target as Node | null;
  if (!target) {
    return;
  }
  if (customPopoverRef.value?.contains(target)) {
    return;
  }
  if (customTriggerRef.value?.contains(target)) {
    return;
  }
  handleCustomCancel();
}

function handleWindowKeydown(event: KeyboardEvent) {
  if (event.key !== 'Escape') {
    return;
  }

  if (customPanelOpen.value) {
    handleCustomCancel();
    return;
  }

  if (maximized.value) {
    maximized.value = false;
  }
}

watch(maximized, (enabled) => {
  if (typeof document === 'undefined') {
    return;
  }
  document.body.style.overflow = enabled ? 'hidden' : '';
});

async function initialize() {
  await nextTick();

  props.api.mount(gridRef.value, {
    executors: {
      query: ({ params }) => runCommitProxy('query', params),
      reload: ({ params }) => runCommitProxy('reload', params),
    },
    formApi,
  });

  const autoLoad = !!gridOptions.value.proxyConfig?.autoLoad;
  const enableProxy = !!gridOptions.value.proxyConfig?.enabled;

  if (autoLoad && enableProxy) {
    const values = state.value.formOptions ? await formApi.getValues() : {};
    await runCommitProxy('query', values ?? {});
  }
}

onMounted(() => {
  syncAdminTableVueWithPreferences();
  updateMobile();
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateMobile);
    window.addEventListener('keydown', handleWindowKeydown);
  }
  if (typeof document !== 'undefined') {
    document.addEventListener('mousedown', handleDocumentMouseDown);
  }
  void initialize();
});

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateMobile);
    window.removeEventListener('keydown', handleWindowKeydown);
  }
  if (typeof document !== 'undefined') {
    document.removeEventListener('mousedown', handleDocumentMouseDown);
    document.body.style.overflow = '';
  }
  cancelCustomRowAnimation();
  clearCustomMoveFrame();
  formApi.unmount();
  props.api.unmount();
  unsub();
});
</script>

<template>
  <div :class="['admin-table', state.class, maximized ? 'admin-table--maximized' : '']">
    <div v-if="showToolbar" class="admin-table__toolbar">
      <div class="admin-table__toolbar-actions">
        <slot v-if="showTableTitle" name="table-title">
          <div class="admin-table__toolbar-title">
            <span>{{ state.tableTitle }}</span>
            <span
              v-if="state.tableTitleHelp"
              class="admin-table__toolbar-help"
              :title="state.tableTitleHelp"
              :aria-label="state.tableTitleHelp"
            >
              ?
            </span>
          </div>
        </slot>
        <div v-if="slots['toolbar-actions']" class="admin-table__toolbar-slot-content">
          <slot name="toolbar-actions" />
        </div>
      </div>

      <div
        v-if="showToolbarCenter"
        :class="[
          'admin-table__toolbar-center',
          toolbarHintAlignClass,
          toolbarHintOverflowClass,
        ]"
      >
        <div v-if="slots['toolbar-center']" class="admin-table__toolbar-center-slot">
          <slot name="toolbar-center" />
        </div>
        <div
          v-else-if="toolbarHintConfig"
          ref="toolbarHintViewportRef"
          class="admin-table__toolbar-hint-viewport"
        >
          <span
            ref="toolbarHintTextRef"
            :class="['admin-table__toolbar-hint-text', toolbarHintShouldScroll ? 'is-running' : '']"
            :style="toolbarHintTextStyle"
          >
            {{ toolbarHintConfig.text }}
          </span>
        </div>
      </div>

      <div class="admin-table__toolbar-tools">
        <ToolbarActionButton
          v-for="tool in toolbarToolsBeforeBuiltin"
          :key="`${tool?.code ?? tool?.title ?? 'tool'}-${tool.index}`"
          :tool="tool"
        />

        <div v-if="hasToolbarToolsSlotBeforeBuiltin" class="admin-table__toolbar-slot-content">
          <slot name="toolbar-tools" />
        </div>

        <button
          v-for="tool in builtinToolbarTools.filter((item) => item.code !== 'custom')"
          :key="`builtin-${tool.code}`"
          :class="[
            'admin-table__toolbar-tool-btn',
            tool.code === 'zoom' && maximized ? 'is-active' : '',
          ]"
          :title="tool.title"
          type="button"
          @click="() => handleBuiltinToolClick(tool.code as 'refresh' | 'zoom')"
        >
          <i
            v-if="tool.code === 'refresh'"
            class="admin-table__toolbar-tool-icon vxe-table-icon-repeat"
            :class="{ roll: refreshing }"
          />
          <i
            v-else-if="tool.code === 'zoom'"
            class="admin-table__toolbar-tool-icon"
            :class="maximized ? 'vxe-table-icon-minimize' : 'vxe-table-icon-fullscreen'"
          />
        </button>

        <div
          v-if="builtinToolbarTools.some((item) => item.code === 'custom')"
          class="admin-table__toolbar-custom-wrap"
        >
          <button
            ref="customTriggerRef"
            :class="['admin-table__toolbar-tool-btn', customPanelOpen ? 'is-active' : '']"
            :title="localeText.custom"
            type="button"
            @click="toggleCustomPanel"
          >
            <i class="admin-table__toolbar-tool-icon vxe-table-icon-custom-column" />
          </button>

          <div
            v-if="customPanelOpen"
            ref="customPopoverRef"
            class="admin-table__toolbar-custom-popover admin-table__toolbar-custom-popover-panel"
          >
            <div class="admin-table__toolbar-custom-panel">
              <div class="admin-table__toolbar-custom-header">
                <button
                  :class="[
                    'admin-table__toolbar-custom-checkbox',
                    customAllChecked ? 'is-checked' : '',
                    customAllIndeterminate ? 'is-indeterminate' : '',
                  ]"
                  type="button"
                  @click="toggleCustomAllColumns"
                >
                  <i
                    :class="[
                      'vxe-checkbox--icon',
                      customAllIndeterminate
                        ? 'vxe-table-icon-checkbox-indeterminate-fill'
                        : customAllChecked
                          ? 'vxe-table-icon-checkbox-checked-fill'
                          : 'vxe-table-icon-checkbox-unchecked',
                    ]"
                  />
                  <span class="vxe-checkbox--label">{{ localeText.customAll }}</span>
                </button>
              </div>

              <div
                ref="customBodyRef"
                :class="['admin-table__toolbar-custom-body', customDragState.dragKey ? 'is-dragging' : '']"
                @dragover="handleCustomBodyDragOver"
              >
                <div
                  v-for="column in customColumnControls"
                  :key="column.key"
                  :ref="(node) => setCustomRowRef(column.key, node as HTMLDivElement | null)"
                  :class="[
                    'admin-table__toolbar-custom-row',
                    customDragState.dragKey === column.key ? 'is-drag-origin' : '',
                    customDragState.overKey === column.key ? 'is-drag-over' : '',
                    customDragState.overKey === column.key && customDragState.position === 'top'
                      ? 'is-drag-over-top'
                      : '',
                    customDragState.overKey === column.key && customDragState.position === 'bottom'
                      ? 'is-drag-over-bottom'
                      : '',
                  ]"
                  @dragover="(event) => handleCustomDragOver(column.key, event as DragEvent)"
                  @drop="(event) => handleCustomDrop(column.key, event as DragEvent)"
                >
                  <div class="admin-table__toolbar-custom-main">
                    <button
                      :class="[
                        'admin-table__toolbar-custom-checkbox',
                        column.checked ? 'is-checked' : '',
                      ]"
                      type="button"
                      @click="() => toggleCustomColumnVisibleByKey(column.key)"
                    >
                      <i
                        :class="[
                          'vxe-checkbox--icon',
                          column.checked
                            ? 'vxe-table-icon-checkbox-checked-fill'
                            : 'vxe-table-icon-checkbox-unchecked',
                        ]"
                      />
                    </button>
                    <div class="admin-table__toolbar-custom-name-option">
                      <button
                        :class="[
                          'admin-table__toolbar-custom-sort-btn',
                          column.checked ? '' : 'is-disabled',
                        ]"
                        :disabled="!column.checked"
                        :draggable="column.checked"
                        :title="localeText.customMoveUp"
                        type="button"
                        @dragend="handleCustomDragEnd"
                        @dragstart="(event) => handleCustomDragStart(column.key, event as DragEvent)"
                      >
                        <i class="vxe-table-icon-drag-handle" />
                      </button>
                      <span class="admin-table__toolbar-custom-title">{{ column.title }}</span>
                    </div>
                  </div>

                  <div class="admin-table__toolbar-custom-fixed-option">
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.sortable ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customSort"
                      type="button"
                      @click="() => toggleCustomColumnSortableByKey(column.key)"
                    >
                      <i class="admin-table__toolbar-custom-icon-sort" />
                    </button>
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.filterable ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customFilter"
                      type="button"
                      @click="() => toggleCustomColumnFilterableByKey(column.key)"
                    >
                      <i class="admin-table__toolbar-custom-icon-filter" />
                    </button>
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.fixed === 'left' ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customFixedLeft"
                      type="button"
                      @click="() => toggleCustomColumnFixedByKey(column.key, 'left')"
                    >
                      <i
                        :class="
                          column.fixed === 'left'
                            ? 'vxe-table-icon-fixed-left-fill'
                            : 'vxe-table-icon-fixed-left'
                        "
                      />
                    </button>
                    <button
                      :class="[
                        'admin-table__toolbar-custom-icon-btn',
                        column.fixed === 'right' ? 'is-active' : '',
                      ]"
                      :disabled="!column.checked"
                      :title="localeText.customFixedRight"
                      type="button"
                      @click="() => toggleCustomColumnFixedByKey(column.key, 'right')"
                    >
                      <i
                        :class="
                          column.fixed === 'right'
                            ? 'vxe-table-icon-fixed-right-fill'
                            : 'vxe-table-icon-fixed-right'
                        "
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div class="admin-table__toolbar-custom-footer">
                <button
                  class="admin-table__toolbar-custom-btn"
                  :disabled="!customPanelDirty"
                  type="button"
                  @click="handleCustomReset"
                >
                  {{ localeText.customReset }}
                </button>
                <button
                  class="admin-table__toolbar-custom-btn"
                  type="button"
                  @click="handleCustomCancel"
                >
                  {{ localeText.customCancel }}
                </button>
                <button
                  class="admin-table__toolbar-custom-btn is-primary"
                  type="button"
                  @click="handleCustomConfirm"
                >
                  {{ localeText.customConfirm }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ToolbarActionButton
          v-for="tool in toolbarToolsAfterBuiltin"
          :key="`${tool?.code ?? tool?.title ?? 'tool'}-${tool.index}`"
          :tool="tool"
        />

        <div v-if="hasToolbarToolsSlotAfterBuiltin" class="admin-table__toolbar-slot-content">
          <slot name="toolbar-tools" />
        </div>

        <button
          v-if="showSearchButton"
          :class="['admin-table__toolbar-action-btn', state.showSearchForm ? 'is-primary' : '']"
          type="button"
          @click="handleSearchToggle"
        >
          {{ getSearchPanelToggleTitle(state.showSearchForm, localeText) }}
        </button>
      </div>
    </div>

    <div v-if="state.formOptions && state.showSearchForm !== false" class="admin-table__search">
      <slot name="form">
        <SearchForm>
          <template v-for="slotName in delegatedFormSlots" :key="slotName" #[slotName]="slotProps">
            <slot :name="`form-${slotName}`" v-bind="slotProps ?? {}" />
          </template>
          <template #reset-before="slotProps">
            <slot name="reset-before" v-bind="slotProps ?? {}" />
          </template>
          <template #submit-before="slotProps">
            <slot name="submit-before" v-bind="slotProps ?? {}" />
          </template>
          <template #expand-before="slotProps">
            <slot name="expand-before" v-bind="slotProps ?? {}" />
          </template>
          <template #expand-after="slotProps">
            <slot name="expand-after" v-bind="slotProps ?? {}" />
          </template>
        </SearchForm>
      </slot>
      <div v-if="showSeparator" class="admin-table__separator" :style="separatorStyle" />
    </div>

    <VxeGrid
      ref="gridRef"
      :class="['admin-table-vxe', state.gridClass]"
      v-bind="gridOptions"
      v-on="gridEvents"
    >
      <template v-for="slotName in delegatedSlots" :key="slotName" #[slotName]="slotProps">
        <slot :name="slotName" v-bind="slotProps" />
      </template>

      <template #__admin_table_operation="slotProps">
        <div
          :class="[
            'admin-table__operation-cell',
            resolveOperationCellAlignClass(operationColumnConfig?.align),
          ]"
        >
          <OperationActionButton
            v-for="tool in operationTools"
            :key="`${tool?.code ?? tool?.title ?? 'operation'}-${tool.index}`"
            :row="slotProps?.row ?? {}"
            :row-index="slotProps?.rowIndex ?? -1"
            :tool="tool"
          />
        </div>
      </template>

      <template #loading>
        <slot name="loading">
          <div class="admin-table__empty">Loading...</div>
        </slot>
      </template>

      <template #empty>
        <slot name="empty">
          <div class="admin-table__empty">{{ localeText.noData }}</div>
        </slot>
      </template>
    </VxeGrid>
  </div>
</template>
