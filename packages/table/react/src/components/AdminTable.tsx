/**
 * Table React 主表格组件实现。
 * @description 负责表格渲染、列自定义、查询联动、工具栏与分页交互等核心逻辑。
 */
/* eslint-disable react-hooks/exhaustive-deps -- large stateful table module with intentional hook dependency partitioning */
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
  createTableSearchFormActionHandlers,
  createTableLocaleText,
  createTableApi,
  deepEqual,
  ensureSeqColumn,
  executeTablePagerExportAction,
  extendProxyOptions,
  flattenTableRows,
  getColumnFilterValueKey,
  getSearchPanelToggleTitle,
  getSeparatorStyle,
  getColumnValueByPath,
  getGlobalTableFormatterRegistry,
  getLocaleMessages,
  forceColumnCustomFlipReflow,
  hasColumnCustomDraftChanges,
  hasTableRowStrategyStyle,
  hasColumnCustomSnapshot,
  isProxyEnabled,
  setColumnValueByPath,
  mergeWithArrayOverride,
  normalizeTableSelectionKeys,
  readColumnCustomStateFromStorage,
  resetColumnCustomFlipTransforms,
  resolveColumnCustomAutoScrollTop,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomOpenTransition,
  resolveColumnCustomState,
  resolveColumnCustomPersistenceConfig,
  resolveColumnCustomCancelTransition,
  resolveColumnCustomConfirmTransition,
  resolveColumnCustomResetTransition,
  resolveColumnCustomWorkingSnapshot,
  resolveSelectionColumn,
  resolveSelectionMode,
  resolveRowClickSelectionKeys,
  resolveSelectionRowsByKeys,
  resolveTableSelectionChange,
  resolveOperationColumnConfig,
  resolveOperationCellAlignClass,
  resolveTablePagerLayoutSet,
  resolveTablePagerPageSizes,
  resolveTablePagerExportConfig,
  resolveTableStripeConfig,
  resolveTableStripePresentation,
  resolveTableThemeCssVars,
  resolveTableCellStrategyResult,
  resolveTableRowStrategyInlineStyle,
  resolveTableRowStrategyResult,
  isSeqColumnTypeColumn,
  resolveToolbarActionButtonRenderState,
  resolveToolbarConfigRecord,
  resolveToolbarInlinePosition,
  resolveToolbarHintConfig,
  resolveToolbarHintOverflowEnabled,
  resolveToolbarHintPresentation,
  resolveToolbarHintShouldScroll,
  resolveToolbarCenterVisible,
  resolveToolbarVisible,
  resolvePagerVisibilityState,
  resolveToolbarToolsPlacement,
  resolveToolbarToolsSlotState,
  resolveTablePagerExportPagination,
  resolveTablePagerExportTriggerState,
  resolveTablePagerExportVisible,
  resolveVisibleTablePagerExportActions,
  resolveVisibleToolbarActionTools,
  resolveVisibleOperationActionTools,
  cleanupTableRuntimeApis,
  pickTableRuntimeStateOptions,
  resolveTableMobileMatched,
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
  TABLE_MOBILE_MEDIA_QUERY,
  writeColumnCustomStateToStorage,
} from '@admin-core/table-core';
import { useAdminForm } from '@admin-core/form-react';
import { ConfigProvider, Input, Table, theme as antdTheme } from 'antd';
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

/**
 * 解析具名插槽，兼容静态节点与函数插槽。
 * @param slots 插槽映射表。
 * @param name 插槽名称。
 * @param params 传给函数插槽的参数。
 * @returns 渲染节点；未命中时返回 `null`。
 */
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

/**
 * 比较两个单元格值，优先按数字/时间语义比较，回退到文本比较。
 * @param left 左值。
 * @param right 右值。
 * @returns 排序比较结果：负数表示左值更小，正数表示左值更大，`0` 表示相等。
 */
function compareTableSortValues(left: unknown, right: unknown) {
  if (left === right) {
    return 0;
  }
  if (left === null || left === undefined || left === '') {
    return 1;
  }
  if (right === null || right === undefined || right === '') {
    return -1;
  }

  /**
   * 将单元格值解析为可比较的数值（数值、日期、数字字符串）。
   *
   * @param value 原始值。
   * @returns 可比较数值；无法转换时返回 `undefined`。
   */
  const toComparableNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    if (value instanceof Date) {
      const timestamp = value.getTime();
      return Number.isFinite(timestamp) ? timestamp : undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) {
        return undefined;
      }
      const numeric = Number(trimmed);
      if (Number.isFinite(numeric) && /^[-+]?(\d+\.?\d*|\.\d+)$/.test(trimmed)) {
        return numeric;
      }
      const timestamp = Date.parse(trimmed);
      if (Number.isFinite(timestamp)) {
        return timestamp;
      }
    }
    return undefined;
  };

  const leftNumber = toComparableNumber(left);
  const rightNumber = toComparableNumber(right);
  if (leftNumber !== undefined && rightNumber !== undefined) {
    return leftNumber - rightNumber;
  }

  const leftText = String(left);
  const rightText = String(right);
  return leftText.localeCompare(rightText, undefined, {
    numeric: true,
    sensitivity: 'base',
  });
}

/**
 * 浅比较两个字符串数组是否完全一致。
 * @param previous 上一次值。
 * @param next 下一次值。
 * @returns 两个数组内容与顺序都一致时返回 `true`。
 */
function shallowEqualStringList(
  previous: Array<string> | undefined,
  next: Array<string>
) {
  if (previous === next) {
    return true;
  }
  if (!Array.isArray(previous) || previous.length !== next.length) {
    return false;
  }
  for (let index = 0; index < previous.length; index += 1) {
    if (previous[index] !== next[index]) {
      return false;
    }
  }
  return true;
}

/** 用于检测分页配置输入变化的关键信号。 */
interface TablePagerSignal {
  /** 当前页码。 */
  currentPage: null | number;
  /** 每页条数。 */
  pageSize: null | number;
  /** 总记录数。 */
  total: null | number;
}

/**
 * 树形行节点类型。
 * @description 在原始行数据基础上附加可选 `children`，用于树表构建。
 */
type TreeNodeWithChildren<TData extends Record<string, any>> = TData & {
  /** 子节点列表。 */
  children?: TreeNodeWithChildren<TData>[];
};

/**
 * 表格排序状态。
 */
interface TableSortState {
  /** 当前排序字段。 */
  field?: string;
  /** 当前排序方向。 */
  order?: SortOrder;
}

/**
 * 单元格编辑状态。
 */
interface TableEditingCellState {
  /** 编辑中的字段。 */
  dataIndex: string;
  /** 编辑中的行主键值。 */
  rowKey: any;
}

/**
 * 列自定义面板初始快照。
 */
interface ColumnCustomOriginStateSnapshot {
  /** 初始筛选能力开关快照。 */
  filterable: Record<string, boolean>;
  /** 初始固定列方向快照。 */
  fixed: Record<string, '' | 'left' | 'right'>;
  /** 初始列排序顺序快照。 */
  order: string[];
  /** 初始排序能力开关快照。 */
  sortable: Record<string, boolean>;
  /** 初始可见性开关快照。 */
  visible: Record<string, boolean>;
}

/**
 * 列自定义拖拽待应用移动信息。
 */
interface ColumnCustomPendingMoveState {
  /** 当前拖拽列 key。 */
  dragKey: string;
  /** 当前悬停列 key。 */
  overKey: string;
  /** 插入位置。 */
  position: ColumnCustomDragPosition;
}

/**
 * 将输入值标准化为分页信号数字，非法值返回 `null`。
 * @param value 原始输入值。
 * @returns 可用数值；无效输入返回 `null`。
 */
function toPagerSignalNumber(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 提取分页配置中的关键字段，构建可比较信号。
 * @param pagerConfig 分页配置对象。
 * @returns 仅包含 `currentPage/pageSize/total` 的信号对象。
 */
function resolvePagerSignal(pagerConfig: unknown): TablePagerSignal {
  const record =
    pagerConfig && typeof pagerConfig === 'object'
      ? (pagerConfig as Record<string, unknown>)
      : {};
  return {
    currentPage: toPagerSignalNumber(record.currentPage),
    pageSize: toPagerSignalNumber(record.pageSize),
    total: toPagerSignalNumber(record.total),
  };
}

/**
 * 判断分页信号是否包含至少一个有效值。
 * @param signal 分页信号。
 * @returns 至少存在一个非空分页字段时返回 `true`。
 */
function hasPagerSignal(signal: null | TablePagerSignal) {
  return !!signal && (
    signal.currentPage !== null ||
    signal.pageSize !== null ||
    signal.total !== null
  );
}

/**
 * 判断两次分页信号是否相同。
 * @param previous 上一次信号。
 * @param next 下一次信号。
 * @returns 两次分页信号字段值完全一致时返回 `true`。
 */
function isSamePagerSignal(
  previous: null | TablePagerSignal,
  next: TablePagerSignal
) {
  return !!previous &&
    previous.currentPage === next.currentPage &&
    previous.pageSize === next.pageSize &&
    previous.total === next.total;
}

/**
 * 将平铺数组按父子关系转换为树形结构。
 * @param data 原始平铺数据。
 * @param rowField 当前节点主键字段。
 * @param parentField 父节点字段。
 * @returns 树形数据。
 */
function transformTreeData<TData extends Record<string, any>>(
  data: TData[],
  rowField = 'id',
  parentField = 'parentId'
): TData[] {
  const map = new Map<any, TreeNodeWithChildren<TData>>();
  const roots: TreeNodeWithChildren<TData>[] = [];

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

/** 行选择模式。 */
type RowSelectionMode = 'checkbox' | 'radio';

/**
 * 从未知输入中读取布尔值配置。
 * @param value 原始输入。
 * @returns 布尔值或 `undefined`。
 */
function resolveBooleanOption(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * 解析表格纵向滚动高度。
 * @param height 高度配置。
 * @param fallback 回退高度。
 * @returns 解析后的滚动高度（正数像素值）。
 */
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

/**
 * 解析 CSS 像素值字符串。
 * @param value CSS 值。
 * @returns 有效像素数值；无法解析时返回 `0`。
 */
function parseCssPixel(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 计算元素外部高度（包含上下 margin）。
 * @param element 目标元素。
 * @returns 元素外部高度（像素）。
 */
function resolveElementOuterHeight(element: null | HTMLElement) {
  if (!element || typeof window === 'undefined') {
    return 0;
  }
  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);
  return Math.max(
    0,
    rect.height + parseCssPixel(styles.marginTop) + parseCssPixel(styles.marginBottom)
  );
}

/**
 * 从显式像素配置中解析数值高度，仅接受正值。
 * @param value 高度配置。
 * @returns 解析得到的高度；无效输入返回 `null`。
 */
function resolveExplicitPixelHeight(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0 ? value : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  if (!/^[+]?\d+(\.\d+)?(px)?$/i.test(text)) {
    return null;
  }
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

/**
 * 主体滚动锁类名。
 * @description 命中该类名时启用“锁定主体高度”滚动策略。
 */
const BODY_SCROLL_LOCK_CLASS = 'admin-table--lock-body-scroll';
/**
 * 主体滚动高度安全间隙（像素）。
 * @description 用于避免临界高度产生滚动条抖动。
 */
const BODY_SCROLL_SAFE_GAP = 2;
/**
 * 主体滚动高度比较容差（像素）。
 * @description 用于判断高度是否可视为“近似不变”。
 */
const BODY_SCROLL_HEIGHT_EPSILON = 4;

/**
 * 将表格语言标识映射到 antd locale 对象。
 * @param locale 语言标识。
 * @returns antd locale。
 */
function resolveAntdTableLocale(locale: unknown): AntdLocale {
  if (locale === 'en-US') {
    return antdEnUS;
  }
  return antdZhCN;
}

/**
 * 表格工具栏图标渲染器。
 *
 * @param options 图标类型与激活状态。
 * @returns 工具栏图标节点。
 */
function ToolbarToolIcon({
  active,
  code,
}: {
  /** 图标类型编码。 */
  code: 'custom' | 'refresh' | 'zoom';
  /** 是否激活（如最大化中、刷新中）。 */
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

/**
 * React 版 `AdminTable` 组件内部入参。
 */
interface AdminTableInternalProps<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
> extends AdminTableReactProps<TData, TFormValues> {
  /** 外部注入的表格 API 实例。 */
  api?: AdminTableApi<TData, TFormValues>;
}

/**
 * React 版 `AdminTable` 主组件。
 * @description 负责整合表格配置、数据代理请求、列自定义、选择态、分页与工具栏交互逻辑。
 *
 * @param props 表格运行时配置与可选外部注入 API。
 * @returns 表格渲染节点。
 */
export const AdminTable = memo(function AdminTable<
  TData extends Record<string, any> = Record<string, any>,
  TFormValues extends Record<string, any> = Record<string, any>,
>(props: AdminTableInternalProps<TData, TFormValues>) {
  /**
   * 当前生效的表格 API。
   * @description 优先复用外部注入实例，缺省时在组件内惰性创建。
   */
  const api = useMemo(
    () =>
      props.api
      ?? createTableApi<TData, TFormValues>(
        pickTableRuntimeStateOptions<TData, TFormValues>(
          props as Record<string, any>
        )
      ),
    [props.api]
  );
  /**
   * 是否由当前组件持有并负责释放表格 API。
   */
  const ownsTableApi = !props.api;
  /**
   * React 端表格全局 setup 状态快照。
   */
  const setupState = getAdminTableReactSetupState();
  /**
   * 表格语言版本号订阅值。
   */
  const localeVersion = useLocaleVersion();
  /**
   * 偏好主题版本号订阅值。
   */
  const preferencesVersion = usePreferencesVersion();
  /**
   * 当前语言下表格文案集合。
   */
  const localeText = useMemo(
    () => createTableLocaleText(getLocaleMessages().table),
    [localeVersion]
  );
  /**
   * 当前语言对应的 antd locale 对象。
   */
  const antdLocale = useMemo(
    () => resolveAntdTableLocale(setupState.locale),
    [localeVersion, setupState.locale]
  );

  /**
   * 表格运行时 props 快照。
   */
  const [tableState, setTableState] = useState(() => api.getSnapshot().props as AdminTableReactProps<TData, TFormValues>);
  /**
   * 当前渲染数据源。
   */
  const [dataSource, setDataSource] = useState<TData[]>(() => (tableState.gridOptions?.data as TData[]) ?? []);
  /**
   * 表格加载状态。
   */
  const [loading, setLoading] = useState<boolean>(() => !!tableState.gridOptions?.loading);
  /**
   * 工具栏刷新按钮加载状态。
   */
  const [refreshing, setRefreshing] = useState(false);
  /**
   * 当前排序状态。
   */
  const [sortState, setSortState] = useState<TableSortState>(() => {
    const defaultSort = tableState.gridOptions?.sortConfig?.defaultSort;
    if (!defaultSort?.field || !defaultSort.order) return {};
    return {
      field: defaultSort.field,
      order: defaultSort.order === 'asc' ? 'ascend' : 'descend',
    };
  });
  /**
   * 当前分页状态（传给 antd Table）。
   */
  const [pagination, setPagination] = useState<TablePaginationConfig>(() => ({
    current: tableState.gridOptions?.pagerConfig?.currentPage ?? 1,
    pageSize: tableState.gridOptions?.pagerConfig?.pageSize ?? 20,
    total: tableState.gridOptions?.pagerConfig?.total ?? dataSource.length,
    showSizeChanger: true,
    pageSizeOptions: resolveTablePagerPageSizes(
      tableState.gridOptions?.pagerConfig?.pageSizes
    ).map((item) => String(item)),
  }));
  /**
   * 是否命中移动端断点。
   */
  const [mobile, setMobile] = useState(() => resolveTableMobileMatched());
  /**
   * 非受控场景下的内部选中键集合。
   */
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

  /**
   * 表格最大化状态。
   */
  const [maximized, setMaximized] = useState(false);
  /**
   * 列自定义面板显隐状态。
   */
  const [customPanelOpen, setCustomPanelOpen] = useState(false);
  /**
   * 列自定义草稿态：可见性映射。
   */
  const [customDraftVisibleColumns, setCustomDraftVisibleColumns] = useState<Record<string, boolean>>({});
  /**
   * 列自定义草稿态：可筛选能力映射。
   */
  const [customDraftFilterableColumns, setCustomDraftFilterableColumns] = useState<Record<string, boolean>>({});
  /**
   * 列自定义草稿态：固定方向映射。
   */
  const [customDraftFixedColumns, setCustomDraftFixedColumns] = useState<Record<string, '' | 'left' | 'right'>>({});
  /**
   * 列自定义草稿态：列顺序。
   */
  const [customDraftOrder, setCustomDraftOrder] = useState<string[]>([]);
  /**
   * 列自定义草稿态：可排序能力映射。
   */
  const [customDraftSortableColumns, setCustomDraftSortableColumns] = useState<Record<string, boolean>>({});
  /**
   * 列自定义拖拽状态。
   */
  const [customDragState, setCustomDragState] = useState<ColumnCustomDragState>(
    () => createColumnCustomDragResetState().dragState
  );
  /**
   * 当前生效列状态：可见性映射。
   */
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({});
  /**
   * 当前生效列状态：可筛选能力映射。
   */
  const [filterableColumns, setFilterableColumns] = useState<Record<string, boolean>>({});
  /**
   * 当前生效列状态：固定方向映射。
   */
  const [fixedColumns, setFixedColumns] = useState<Record<string, '' | 'left' | 'right'>>({});
  /**
   * 当前生效列顺序。
   */
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  /**
   * 当前生效列状态：可排序能力映射。
   */
  const [sortableColumns, setSortableColumns] = useState<Record<string, boolean>>({});
  /**
   * 行编辑模式下的当前编辑行键。
   */
  const [editingRowKey, setEditingRowKey] = useState<any>(null);
  /**
   * 单元格编辑模式下的当前编辑单元格状态。
   */
  const [editingCell, setEditingCell] = useState<TableEditingCellState | null>(null);
  /**
   * 行主键字段名。
   */
  const rowKeyField = tableState.gridOptions?.rowConfig?.keyField ?? 'id';

  /**
   * 最新外部运行时 props 快照。
   */
  const latestPropsRef = useRef<AdminTableReactProps<TData, TFormValues> | null>(null);
  /**
   * 最新入参分页信号快照。
   */
  const latestIncomingPagerSignalRef = useRef<null | TablePagerSignal>(null);
  /**
   * 最近一次 `gridOptions.data` 引用快照。
   */
  const latestGridOptionsDataRef = useRef<unknown>(tableState.gridOptions?.data);
  /**
   * 最新查询表单值快照。
   */
  const latestFormValuesRef = useRef<Record<string, any>>({});
  /**
   * 最新表格状态引用。
   */
  const tableStateRef = useRef(tableState);
  /**
   * 最新分页状态引用。
   */
  const paginationRef = useRef(pagination);
  /**
   * 最新排序状态引用。
   */
  const sortStateRef = useRef(sortState);
  /**
   * 最新编辑行键引用。
   */
  const editingRowKeyRef = useRef<any>(editingRowKey);
  /**
   * 最新行主键字段名引用。
   */
  const rowKeyFieldRef = useRef<string>(rowKeyField);
  /**
   * 列自定义面板打开时的原始状态快照。
   */
  const customOriginStateRef = useRef<ColumnCustomOriginStateSnapshot>({
    filterable: {},
    fixed: {},
    order: [],
    sortable: {},
    visible: {},
  });
  /**
   * 列自定义面板行节点引用表。
   */
  const customRowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  /**
   * 列自定义面板主体节点引用。
   */
  const customBodyRef = useRef<HTMLDivElement | null>(null);
  /**
   * 列自定义面板弹层节点引用。
   */
  const customPopoverRef = useRef<HTMLDivElement | null>(null);
  /**
   * 列自定义工具按钮节点引用。
   */
  const customTriggerRef = useRef<HTMLButtonElement | null>(null);
  /**
   * 表格根容器节点引用。
   */
  const tableRootRef = useRef<HTMLDivElement | null>(null);
  /**
   * 工具栏提示可视区节点引用。
   */
  const toolbarHintViewportRef = useRef<HTMLDivElement | null>(null);
  /**
   * 工具栏提示文本节点引用。
   */
  const toolbarHintTextRef = useRef<HTMLSpanElement | null>(null);
  /**
   * 分页栏提示可视区节点引用。
   */
  const pagerHintViewportRef = useRef<HTMLDivElement | null>(null);
  /**
   * 分页栏提示文本节点引用。
   */
  const pagerHintTextRef = useRef<HTMLSpanElement | null>(null);
  /**
   * 当前可见数据源引用（用于导出与分页扩展）。
   */
  const visibleDataSourceRef = useRef<TData[]>(dataSource);
  /**
   * 列自定义行位置信息缓存（FLIP 动画）。
   */
  const customRowRectsRef = useRef<Map<string, ColumnCustomFlipRect>>(new Map());
  /**
   * 列自定义行过渡动画帧句柄。
   */
  const customRowAnimationFrameRef = useRef<null | number>(null);
  /**
   * 列拖拽重排调度动画帧句柄。
   */
  const customMoveAnimationFrameRef = useRef<null | number>(null);
  /**
   * 待执行的列拖拽移动信息。
   */
  const customPendingMoveRef = useRef<ColumnCustomPendingMoveState | null>(null);
  /**
   * 当前拖拽列键引用。
   */
  const customDraggingKeyRef = useRef<null | string>(null);
  /**
   * 当前拖拽悬停状态引用。
   */
  const customDragHoverRef = useRef<ColumnCustomDragHoverState>(
    createColumnCustomDragResetState().dragHover
  );
  /**
   * 工具栏提示是否需要滚动跑马灯。
   */
  const [toolbarHintShouldScroll, setToolbarHintShouldScroll] = useState(false);
  /**
   * 分页栏提示是否需要滚动跑马灯。
   */
  const [pagerHintShouldScroll, setPagerHintShouldScroll] = useState(false);
  /**
   * 分页扩展节点挂载目标。
   */
  const [paginationMountNode, setPaginationMountNode] = useState<HTMLElement | null>(null);
  /**
   * 自动测量得到的表格主体纵向滚动高度。
   */
  const [autoBodyScrollY, setAutoBodyScrollY] = useState<null | number>(null);
  /**
   * 默认选中值是否已在当前模式应用过。
   */
  const hasAppliedDefaultSelectionRef = useRef(false);
  /**
   * 上一次选择模式快照。
   */
  const previousSelectionModeRef = useRef<undefined | RowSelectionMode>(undefined);
  /**
   * 生成 antd 主题配置。
   * @description 将系统主题设置映射为 antd 的 token 与亮暗算法；无有效主题配置时返回 `undefined`。
   */
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

  /**
   * 清理列自定义拖拽动画帧
   * @description 取消未执行的移动动画并重置待处理移动状态。
   */
  const clearCustomMoveFrame = useCallback(() => {
    customPendingMoveRef.current = null;
    if (typeof window !== 'undefined' && customMoveAnimationFrameRef.current !== null) {
      window.cancelAnimationFrame(customMoveAnimationFrameRef.current);
    }
    customMoveAnimationFrameRef.current = null;
  }, []);

  /**
   * 重置列自定义拖拽状态
   * @description 清理拖拽动画并恢复拖拽相关状态到初始值。
   * @returns 无返回值。
   */
  const resetCustomDragState = useCallback(() => {
    clearCustomMoveFrame();
    const nextState = createColumnCustomDragResetState();
    customDraggingKeyRef.current = nextState.draggingKey;
    customDragHoverRef.current = nextState.dragHover;
    setCustomDragState(nextState.dragState);
  }, [clearCustomMoveFrame]);

  /**
   * 自动滚动列自定义面板
   * @description 在拖拽接近容器边缘时自动调整滚动条位置。
   * @param clientY 当前指针纵坐标。
   * @returns 无返回值。
   */
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

  /**
   * 创建查询表单动作处理器。
   * @description 统一封装提交、重置与代理查询刷新流程。
   */
  const tableSearchFormActions = createTableSearchFormActionHandlers({
    getFormApi: () => formApi as any,
    onValuesResolved: (values) => {
      latestFormValuesRef.current = values;
    },
    reload: async (values) => api.reload(values),
    shouldReloadOnReset: () => !tableStateRef.current.formOptions?.submitOnChange,
  });

  const [SearchForm, formApi] = useAdminForm({
    compact: true,
    commonConfig: {
      componentProps: {
        className: 'w-full',
      },
    },
    handleSubmit: tableSearchFormActions.handleSubmit,
    handleReset: tableSearchFormActions.handleReset,
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
    let nextProps = pickTableRuntimeStateOptions<TData, TFormValues>(
      props as Record<string, any>
    );
    const nextGridOptions =
      nextProps.gridOptions && typeof nextProps.gridOptions === 'object'
        ? (nextProps.gridOptions as Record<string, any>)
        : null;
    const nextPagerConfig =
      nextGridOptions?.pagerConfig && typeof nextGridOptions.pagerConfig === 'object'
        ? (nextGridOptions.pagerConfig as Record<string, any>)
        : null;
    const nextPagerSignal = resolvePagerSignal(nextPagerConfig);
    const incomingPagerUnchanged = isSamePagerSignal(
      latestIncomingPagerSignalRef.current,
      nextPagerSignal
    );
    const shouldPreservePager =
      incomingPagerUnchanged &&
      hasPagerSignal(nextPagerSignal) &&
      !!nextGridOptions;
    if (shouldPreservePager) {
      const runtimeSnapshot = api.getSnapshot().props as AdminTableReactProps<
        TData,
        TFormValues
      >;
      const runtimeGridOptions =
        runtimeSnapshot.gridOptions && typeof runtimeSnapshot.gridOptions === 'object'
          ? (runtimeSnapshot.gridOptions as Record<string, any>)
          : null;
      const runtimePagerConfig =
        runtimeGridOptions?.pagerConfig && typeof runtimeGridOptions.pagerConfig === 'object'
          ? (runtimeGridOptions.pagerConfig as Record<string, any>)
          : null;
      if (runtimePagerConfig) {
        nextProps = {
          ...nextProps,
          gridOptions: {
            ...nextGridOptions,
            pagerConfig: {
              ...(nextPagerConfig ?? {}),
              currentPage: runtimePagerConfig.currentPage ?? nextPagerConfig?.currentPage,
              pageSize: runtimePagerConfig.pageSize ?? nextPagerConfig?.pageSize,
              total: runtimePagerConfig.total ?? nextPagerConfig?.total,
            },
          } as any,
        };
      }
    }
    latestIncomingPagerSignalRef.current = nextPagerSignal;
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
    api.setState(nextProps as any);
  }, [
    api,
    props.class,
    props.formOptions,
    props.gridClass,
    props.gridEvents,
    props.gridOptions,
    props.separator,
    props.showSearchForm,
    props.tableTitle,
    props.tableTitleHelp,
  ]);

  useEffect(() => {
    const nextGridData = tableState.gridOptions?.data;
    if (!Object.is(latestGridOptionsDataRef.current, nextGridData)) {
      latestGridOptionsDataRef.current = nextGridData;
      setDataSource(Array.isArray(nextGridData) ? (nextGridData as TData[]) : []);
    }
    setLoading(!!tableState.gridOptions?.loading);
    setPagination((prev) => {
      const nextCurrent = tableState.gridOptions?.pagerConfig?.currentPage ?? prev.current;
      const nextPageSize = tableState.gridOptions?.pagerConfig?.pageSize ?? prev.pageSize;
      const nextTotal = tableState.gridOptions?.pagerConfig?.total ?? prev.total;
      const nextPageSizeOptions = resolveTablePagerPageSizes(
        tableState.gridOptions?.pagerConfig?.pageSizes
      ).map((item) => String(item));
      const previousPageSizeOptions = Array.isArray(prev.pageSizeOptions)
        ? prev.pageSizeOptions.map((item) => String(item))
        : [];
      if (
        prev.current === nextCurrent &&
        prev.pageSize === nextPageSize &&
        prev.total === nextTotal &&
        shallowEqualStringList(previousPageSizeOptions, nextPageSizeOptions)
      ) {
        return prev;
      }
      return {
        ...prev,
        current: nextCurrent,
        pageSize: nextPageSize,
        total: nextTotal,
        pageSizeOptions: nextPageSizeOptions,
      };
    });
  }, [tableState.gridOptions]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const media = window.matchMedia(TABLE_MOBILE_MEDIA_QUERY);

    /**
     * 同步移动端匹配状态。
     * @returns 无返回值。
     */
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

  /**
   * 兼容 `table-core` 的表格实例桥接对象。
   * @description 向 runtime 暴露编辑态操作能力，供 API 层统一调用。
   */
  const tableLikeGridRef = useRef({
    /**
     * 清空当前编辑状态（行编辑与单元格编辑）。
     * @returns 无返回值。
     */
    clearEdit: async () => {
      setEditingRowKey(null);
      setEditingCell(null);
    },
    /**
     * 判断指定行是否处于行编辑状态。
     *
     * @param row 行数据。
     * @returns 是否处于行编辑状态。
     */
    isEditByRow: (row: TData) => {
      return row?.[rowKeyFieldRef.current] === editingRowKeyRef.current;
    },
    /**
     * 将指定行设置为当前编辑行。
     *
     * @param row 行数据。
     * @returns 无返回值。
     */
    setEditRow: (row: TData) => {
      setEditingRowKey(row?.[rowKeyFieldRef.current]);
    },
  });

  /**
   * 执行代理查询或刷新
   * @description 统一处理 query/reload 两种模式，解析分页与排序上下文并驱动数据请求。
   * @param mode 执行模式（查询或刷新）。
   * @param params 额外请求参数。
   * @param context 分页与排序上下文信息。
   * @returns 请求完成后的结果数据。
   */
  const executeProxy = useCallback(
    async (
      mode: 'query' | 'reload',
      params: Record<string, any>,
      context?: {
        /** 分页上下文。 */
        page?: {
          /** 当前页码。 */
          current?: number;
          /** 每页条数。 */
          pageSize?: number;
        };
        /** 排序上下文。 */
        sort?: {
          /** 排序字段。 */
          field?: string;
          /** 排序信息。 */
          order?: SortOrder;
        };
      }
    ) => {
      const currentTableState = tableStateRef.current;
      const currentPagination = paginationRef.current;
      const currentSortState = sortStateRef.current;
      const sourceGridOptions =
        (currentTableState.gridOptions ?? {}) as AntdGridOptions<TData>;
      const baseOptions = mergeWithArrayOverride(
        sourceGridOptions,
        setupState.defaultGridOptions as AntdGridOptions<TData>
      ) as AntdGridOptions<TData>;
      if (Array.isArray(sourceGridOptions.data)) {
        baseOptions.data = sourceGridOptions.data;
      }
      if (Array.isArray(sourceGridOptions.columns)) {
        baseOptions.columns = sourceGridOptions.columns;
      }

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
      cleanupTableRuntimeApis({
        formApi,
        ownsFormApi: true,
        ownsTableApi,
        tableApi: api,
      });
    };
  }, [api, executeProxy, formApi, ownsTableApi]);

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

  /**
   * 合并运行时表格配置。
   * @description 以页面入参与全局默认配置做深合并，并补齐序号列定义。
   */
  const mergedGridOptions = useMemo(() => {
    const sourceGridOptions = tableState.gridOptions as
      | AntdGridOptions<TData>
      | undefined;
    const merged = mergeWithArrayOverride(
      sourceGridOptions ?? {},
      setupState.defaultGridOptions as AntdGridOptions<TData>
    ) as AntdGridOptions<TData>;
    if (Array.isArray(sourceGridOptions?.data)) {
      merged.data = sourceGridOptions.data;
    }
    if (Array.isArray(sourceGridOptions?.columns)) {
      merged.columns = sourceGridOptions.columns;
    }
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

  /**
   * 解析列自定义持久化配置。
   * @description 基于当前列配置计算本地存储键、作用域与开关。
   */
  const columnCustomPersistenceConfig = useMemo(() => {
    return resolveColumnCustomPersistenceConfig(
      mergedGridOptions as Record<string, any>,
      mergedGridOptions.columns ?? []
    );
  }, [mergedGridOptions.columnCustomPersistence, mergedGridOptions.columns]);

  /**
   * 读取外部列自定义状态。
   * @description 优先使用外部传入快照，缺省时回退到持久化存储。
   */
  const externalColumnCustomState = useMemo(() => {
    const external = resolveColumnCustomState(mergedGridOptions as Record<string, any>);
    if (hasColumnCustomSnapshot(external)) {
      return external;
    }
    return readColumnCustomStateFromStorage(columnCustomPersistenceConfig);
  }, [columnCustomPersistenceConfig, mergedGridOptions.columnCustomState]);

  /**
   * 获取当前列自定义状态
   * @description 返回当前已生效的可见性、固定列、顺序及可排序/可筛选状态。
   * @returns 当前列自定义状态快照。
   */
  const getCurrentColumnCustomState = useCallback(() => {
    return {
      filterable: filterableColumns,
      fixed: fixedColumns,
      order: columnOrder,
      sortable: sortableColumns,
      visible: visibleColumns,
    };
  }, [columnOrder, filterableColumns, fixedColumns, sortableColumns, visibleColumns]);

  /**
   * 获取草稿列自定义状态
   * @description 返回自定义面板中的草稿状态，用于预览与确认操作。
   * @returns 草稿列自定义状态快照。
   */
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

  /**
   * 应用当前列自定义快照
   * @description 将解析后的快照同步到当前生效状态，保持引用稳定以减少无效重渲染。
   * @param snapshot 列自定义工作快照。
   * @returns 无返回值。
   */
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

  /**
   * 应用草稿列自定义快照
   * @description 将解析后的快照同步到面板草稿状态，用于编辑过程中的临时展示。
   * @param snapshot 列自定义工作快照。
   * @returns 无返回值。
   */
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

  /**
   * 当前生效插槽映射。
   */
  const runtimeSlots = props.slots ?? tableState.slots;
  /**
   * 当前生效表格标题。
   */
  const runtimeTableTitle = props.tableTitle ?? tableState.tableTitle;
  /**
   * 当前生效表格标题提示文案。
   */
  const runtimeTableTitleHelp = props.tableTitleHelp ?? tableState.tableTitleHelp;
  /**
   * 当前生效根节点 className。
   */
  const runtimeClassName = props.class ?? tableState.class;
  /**
   * 当前生效查询表单配置。
   */
  const runtimeFormOptions = props.formOptions ?? tableState.formOptions;
  /**
   * 当前查询表单展示状态。
   */
  const runtimeShowSearchForm = props.showSearchForm ?? tableState.showSearchForm;
  /**
   * 当前生效表格事件回调集合。
   */
  const runtimeGridEvents = props.gridEvents ?? tableState.gridEvents;
  /**
   * 解析表格根节点 CSS 变量。
   * @description 按主题配置生成运行时样式变量，供表格容器透传。
   */
  const runtimeRootStyle = useMemo<CSSProperties | undefined>(
    () => resolveTableThemeCssVars(setupState.theme) as CSSProperties | undefined,
    [preferencesVersion, setupState.theme.colorPrimary]
  );
  /**
   * 判断是否开启主体滚动锁定模式。
   * @description 通过 className 是否包含锁定标识类决定布局测量策略。
   */
  const bodyScrollLockEnabled = useMemo(() => {
    if (typeof runtimeClassName !== 'string' || !runtimeClassName.trim()) {
      return false;
    }
    return runtimeClassName
      .split(/\s+/)
      .filter(Boolean)
      .includes(BODY_SCROLL_LOCK_CLASS);
  }, [runtimeClassName]);

  /**
   * 计算最终可渲染数据源。
   * @description 在树形转换开启时把平铺数据转为树结构，否则直接使用原始数据。
   */
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
  /**
   * 展平当前数据源。
   * @description 用于选择态、导出与行索引映射等依赖平铺结构的场景。
   */
  const flattenedDataSource = useMemo(
    () => flattenTableRows(computedDataSource),
    [computedDataSource]
  );
  /**
   * 构建可比较行键到行索引的映射表。
   * @description 便于在行选择校验中由 rowKey 快速定位到行索引。
   */
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
        /** 生成过滤选项时使用的空值文案。 */
        emptyLabel: string;
        /** 行数据集合。 */
        rows: TData[];
        /** 默认筛选项数组。 */
        options: ReturnType<typeof buildDefaultColumnFilterOptions>;
      }
    >()
  );
  /**
   * 解析列默认筛选选项
   * @description 按字段缓存默认筛选项，减少重复扫描数据源带来的开销。
   * @param field 列字段名。
   * @returns 列默认筛选配置项。
   */
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
  /**
   * 解析行策略结果。
   * @description 针对同一行对象按行索引缓存策略计算，减少重复求值。
   */
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

  /**
   * 原始列定义集合（含隐藏与选择列）。
   */
  const sourceColumns = mergedGridOptions.columns ?? [];
  /**
   * 解析行选择模式。
   * @description 兼容 `checkboxConfig`、`radioConfig` 与 `rowSelection` 三种输入来源。
   */
  const selectionMode = useMemo(
    () => resolveSelectionMode(mergedGridOptions, sourceColumns),
    [
      mergedGridOptions.checkboxConfig,
      mergedGridOptions.radioConfig,
      mergedGridOptions.rowSelection,
      sourceColumns,
    ]
  );
  /**
   * 解析选择列配置。
   * @description 根据当前选择模式从列配置中提取对应的选择列定义。
   */
  const selectionColumn = useMemo(
    () =>
      resolveSelectionColumn(
        sourceColumns as Array<Record<string, any>>,
        selectionMode
      ),
    [selectionMode, sourceColumns]
  );
  /**
   * 当前选择模式对应的配置源（radio/checkbox）。
   */
  const selectionConfig = selectionMode === 'radio'
    ? mergedGridOptions.radioConfig
    : selectionMode === 'checkbox'
      ? mergedGridOptions.checkboxConfig
      : undefined;
  /**
   * 行选择判定上下文。
   */
  interface RowSelectionCheckMethodContext {
    /** 当前行数据。 */
    row: TData;
    /** 当前行索引。 */
    rowIndex: number;
  }

  /**
   * 行选择配置的运行时结构。
   */
  interface RowSelectionRuntimeConfig extends Record<string, any> {
    /** 使用行字段值驱动选中状态时的字段名。 */
    checkField?: string;
    /** 按行动态判定是否允许选中。 */
    checkMethod?: (ctx: RowSelectionCheckMethodContext) => boolean;
    /** 树表场景中是否启用严格父子节点联动。 */
    strict?: boolean;
    /** 触发选中的交互区域。 */
    trigger?: string;
  }

  /**
   * 标准化后的 `rowSelection` 运行时配置。
   */
  const rowSelectionConfig = mergedGridOptions.rowSelection as
    | RowSelectionRuntimeConfig
    | undefined;
  /**
   * 解析勾选字段名。
   * @description 兼容选择配置与 rowSelection 中的 `checkField` 并做字符串标准化。
   */
  const selectionCheckField = useMemo(() => {
    const value = typeof selectionConfig?.checkField === 'string'
      ? selectionConfig.checkField
      : rowSelectionConfig?.checkField;
    return typeof value === 'string' && value.trim().length > 0
      ? value.trim()
      : undefined;
  }, [rowSelectionConfig?.checkField, selectionConfig?.checkField]);
  /**
   * 解析行可选判定函数。
   * @description 优先读取选择配置中的 `checkMethod`，回退到 rowSelection 的同名配置。
   */
  const selectionCheckMethod = useMemo(() => {
    if (typeof selectionConfig?.checkMethod === 'function') {
      return selectionConfig.checkMethod;
    }
    if (typeof rowSelectionConfig?.checkMethod === 'function') {
      return rowSelectionConfig.checkMethod;
    }
    return undefined;
  }, [rowSelectionConfig?.checkMethod, selectionConfig?.checkMethod]);
  /**
   * 判断是否开启“点击整行触发选择”。
   */
  const selectionTriggerByRow = useMemo(() => {
    const trigger = selectionConfig?.trigger ?? rowSelectionConfig?.trigger;
    return trigger === 'row';
  }, [rowSelectionConfig?.trigger, selectionConfig?.trigger]);
  /**
   * 解析单选严格模式。
   * @description 仅在 radio 模式下读取 strict 配置，未配置时默认开启。
   */
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
  /**
   * 解析选中高亮开关。
   * @description 支持从选择配置或 rowSelection 继承；默认跟随是否启用选择模式。
   */
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
  /**
   * 解析受控选中键集合。
   * @description 当外部传入 `selectedRowKeys` 时进行标准化并视为受控模式。
   */
  const controlledSelectedKeys = useMemo(() => {
    const keys = mergedGridOptions.rowSelection?.selectedRowKeys;
    if (!selectionMode || !Array.isArray(keys)) {
      return undefined;
    }
    return normalizeTableSelectionKeys<Key>(keys as Key[], selectionMode);
  }, [mergedGridOptions.rowSelection?.selectedRowKeys, selectionMode]);
  /**
   * 解析默认选中键集合。
   * @description 非受控模式下首次初始化时使用。
   */
  const defaultSelectedKeys = useMemo(() => {
    const keys = mergedGridOptions.rowSelection?.defaultSelectedRowKeys;
    if (!selectionMode || !Array.isArray(keys)) {
      return [];
    }
    return normalizeTableSelectionKeys<Key>(keys as Key[], selectionMode);
  }, [mergedGridOptions.rowSelection?.defaultSelectedRowKeys, selectionMode]);
  /**
   * 当前是否处于受控选择模式。
   */
  const isSelectionControlled = !!controlledSelectedKeys;
  /**
   * 当前生效选中键集合（受控优先，回退内部状态）。
   */
  const effectiveSelectedRowKeys = selectionMode
    ? (controlledSelectedKeys ?? innerSelectedRowKeys)
    : [];
  /**
   * 构建当前选中键集合（可比较形式）。
   * @description 用于高频判断某行是否处于选中态。
   */
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

  /**
   * 生成运行时列定义。
   * @description 统一处理列可见性、排序、筛选、编辑、单元格策略与渲染器扩展。
   */
  const columns = useMemo(() => {
    /**
     * 是否启用远程排序。
     */
    const isRemoteSortEnabled =
      mergedGridOptions.sortConfig?.remote === true ||
      isProxyEnabled(mergedGridOptions.proxyConfig as Record<string, any>);
    /**
     * 序号列分页偏移量。
     */
    const seqOffset = mergedGridOptions.pagerConfig?.enabled === false
      ? 0
      : ((pagination.current ?? 1) - 1) * (pagination.pageSize ?? 20);
    /**
     * 列运行时构建结果（含可见性与顺序控制）。
     */
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
      Map<
        string,
        {
          /** 参与策略计算的原始单元格值。 */
          rawValue: unknown;
          /** 对应原始值的策略计算结果。 */
          result: ReturnType<typeof resolveTableCellStrategyResult>;
        }
      >
    >();
    const rowCellStyleCache = new WeakMap<
      Record<string, any>,
      Map<number, CSSProperties | undefined>
    >();
    /**
     * 解析指定行在当前索引下的策略样式并缓存结果。
     * @param record 行数据。
     * @param rowIndex 行索引。
     * @returns 可应用到单元格的样式对象；无策略样式时返回 `undefined`。
     */
    const resolveRowCellStyle = (
      record: TData,
      rowIndex: number
    ): CSSProperties | undefined => {
      /**
       * 从行策略样式中提取可应用到单元格的基础样式字段。
       *
       * @param rowStyle 行策略样式对象。
       * @returns 可用于单元格的样式对象。
       */
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
      /**
       * 当前列数据字段名。
       */
      const dataIndex = String(column.dataIndex ?? column.field ?? '');
      /**
       * 默认本地排序器。
       * @description 仅在可解析字段且未启用远程排序时生效。
       */
      const defaultLocalSorter =
        dataIndex && !isRemoteSortEnabled
          ? (leftRecord: TData, rightRecord: TData) =>
              compareTableSortValues(
                getColumnValueByPath(leftRecord as Record<string, any>, dataIndex),
                getColumnValueByPath(rightRecord as Record<string, any>, dataIndex)
              )
          : undefined;
      /**
       * 当前列最终排序配置。
       */
      const columnSorter =
        column.sortable === false
          ? undefined
          : column.sortable === true
            ? (column.sorter ?? defaultLocalSorter ?? true)
            : column.sorter;
      /**
       * 当前列是否启用筛选能力。
       */
      const filterable = column.filterable !== false;
      /**
       * 当前列是否显式声明筛选配置。
       */
      const hasFilterConfig =
        (Array.isArray(column.filters) && column.filters.length > 0) ||
        typeof column.filterDropdown === 'function' ||
        typeof column.onFilter === 'function';
      /**
       * 当前列自动生成的默认筛选项。
       */
      const defaultFilters =
        filterable && !hasFilterConfig && dataIndex
          ? resolveDefaultColumnFilterOptions(dataIndex)
          : [];
      /**
       * 当前列最终筛选项列表。
       */
      const filters = filterable
        ? Array.isArray(column.filters)
          ? column.filters
          : defaultFilters.map((item) => ({
            text: item.label,
            value: item.value,
          }))
        : undefined;
      /**
       * 当前列筛选执行函数。
       */
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

      /**
       * 解析并缓存单元格点击策略结果。
       *
       * @param record 行数据。
       * @param rowIndex 行索引。
       * @param value 单元格值。
       * @returns 单元格策略结果。
       */
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
          rowCache = new Map<
            string,
            {
              /** 参与策略计算的原始单元格值。 */
              rawValue: unknown;
              /** 对应原始值的策略计算结果。 */
              result: ReturnType<typeof resolveTableCellStrategyResult>;
            }
          >();
          cellStrategyCache.set(rowRecord, rowCache);
        }
        const cacheKey = `${dataIndex}:${rowIndex}`;
        const cached = rowCache.get(cacheKey);
        if (cached && Object.is(cached.rawValue, value)) {
          return cached.result;
        }
        const resolved = resolveTableCellStrategyResult({
          column: column as Record<string, any>,
          field: dataIndex,
          gridOptions: mergedGridOptionsRecord,
          row: rowRecord,
          rowIndex,
          value,
        });
        rowCache.set(cacheKey, {
          rawValue: value,
          result: resolved,
        });
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
          /**
           * 外部原始 `onCell` 返回对象。
           */
          const sourceOnCell = typeof column.onCell === 'function'
            ? (column.onCell(record, rowIndex ?? -1) ?? {})
            : {};
          /**
           * 外部单元格样式。
           */
          const sourceStyle =
            typeof (sourceOnCell as Record<string, any>).style === 'object' &&
            (sourceOnCell as Record<string, any>).style
              ? ((sourceOnCell as Record<string, any>).style as Record<string, any>)
              : undefined;
          /**
           * 外部单击处理函数。
           */
          const sourceOnClick =
            typeof (sourceOnCell as Record<string, any>).onClick === 'function'
              ? (sourceOnCell as Record<string, any>).onClick
              : undefined;
          /**
           * 外部双击处理函数。
           */
          const sourceOnDoubleClick =
            typeof (sourceOnCell as Record<string, any>).onDoubleClick === 'function'
              ? (sourceOnCell as Record<string, any>).onDoubleClick
              : undefined;
          /**
           * 编辑触发方式。
           */
          const trigger = mergedGridOptions.editConfig?.trigger ?? 'click';
          /**
           * 对应触发方式的事件键名。
           */
          const clickEventName = trigger === 'dblclick' ? 'onDoubleClick' : 'onClick';
          /**
           * 当前列是否可编辑。
           */
          const editable = !!column.editRender;
          /**
           * 当前单元格策略计算结果。
           */
          const strategyResult = resolveCellStrategy(
            record,
            rowIndex ?? -1,
            dataIndex ? getColumnValueByPath(record as Record<string, any>, dataIndex) : undefined
          );
          /**
           * 当前行策略带入的单元格样式。
           */
          const rowCellStyle = resolveRowCellStyle(record, rowIndex ?? -1);
          /**
           * 策略点击态 className。
           */
          const strategyClassName =
            strategyResult?.clickable || strategyResult?.onClick
              ? 'admin-table__strategy-clickable'
              : '';

          /**
           * 按编辑模式触发行/单元格编辑状态切换。
           * @returns 无返回值。
           */
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
          /**
           * 当前单元格策略结果。
           */
          const strategyResult = resolveCellStrategy(record, rowIndex, value);
          /**
           * 策略解析后的单元格值。
           */
          const strategyValue = strategyResult
            ? strategyResult.value
            : (dataIndex ? getColumnValueByPath(record as Record<string, any>, dataIndex) : value);
          /**
           * 当前行键。
           */
          const rowKey = record[rowKeyField];
          /**
           * 当前行是否处于行编辑状态。
           */
          const inRowEdit = mergedGridOptions.editConfig?.mode === 'row' && rowKey === editingRowKey;
          /**
           * 当前单元格是否处于单元格编辑状态。
           */
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

          /**
           * 单元格具名插槽名称。
           */
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

          /**
           * 单元格渲染器名称。
           */
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

          /**
           * 单元格格式化器配置。
           */
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

          /**
           * 最终展示内容。
           */
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
    mergedGridOptions.proxyConfig,
    mergedGridOptions.sortConfig?.remote,
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

  /** 运行时工具栏配置记录。 */
  const toolbarConfig = mergedGridOptions.toolbarConfig ?? {};
  const toolbarActionsSlot = resolveSlot(runtimeSlots, 'toolbar-actions');
  const toolbarCenterSlot = resolveSlot(runtimeSlots, 'toolbar-center');
  const toolbarToolsSlot = resolveSlot(runtimeSlots, 'toolbar-tools');
  /**
   * 解析工具栏提示配置。
   * @description 统一标准化提示文本、对齐方式与溢出滚动策略。
   */
  const resolvedToolbarHint = useMemo(
    () => resolveToolbarHintConfig(toolbarConfig.hint),
    [toolbarConfig.hint]
  );
  const toolbarHintPresentation = resolveToolbarHintPresentation(resolvedToolbarHint);
  const hasToolbarCenterSlot = !!toolbarCenterSlot;
  const showToolbarCenter = resolveToolbarCenterVisible({
    hasCenterSlot: hasToolbarCenterSlot,
    hasHint: !!resolvedToolbarHint,
  });
  const toolbarHintClassName = [
    'admin-table__toolbar-center',
    toolbarHintPresentation.alignClass,
    toolbarHintPresentation.overflowClass,
  ].join(' ');
  const toolbarHintTextStyle = toolbarHintPresentation.textStyle as
    | (CSSProperties & Record<string, string>)
    | undefined;
  const toolbarToolsPosition = resolveToolbarInlinePosition(
    toolbarConfig.toolsPosition,
    'after'
  );
  const toolbarToolsSlotPosition = resolveToolbarToolsSlotPosition(
    toolbarConfig.toolsSlotPosition
  );
  const toolbarToolsSlotState = resolveToolbarToolsSlotState(
    !!toolbarToolsSlot,
    toolbarToolsSlotPosition
  );
  const hasToolbarToolsSlot = toolbarToolsSlotState.hasSlot;
  const hasToolbarToolsSlotReplaceBuiltin = toolbarToolsSlotState.replace;
  const hasToolbarToolsSlotBeforeBuiltin = toolbarToolsSlotState.before;
  const hasToolbarToolsSlotAfterBuiltin = toolbarToolsSlotState.after;
  /**
   * 解析内置工具按钮列表。
   * @description 根据工具栏配置与当前状态（例如最大化）生成可渲染工具集合。
   */
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
  /**
   * 解析分页导出配置。
   * @description 标准化导出动作、标题与文件名规则。
   */
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
  /**
   * 过滤并解析可见导出动作。
   * @description 按权限与业务开关生成当前可操作的分页导出动作列表。
   */
  const pagerExportActions = useMemo<
    Array<ResolvedTablePagerExportAction<TData>>
  >(
    () =>
      resolveVisibleTablePagerExportActions<TData>({
        accessCodes: setupState.accessCodes,
        accessRoles: setupState.accessRoles,
        actions: pagerExportConfig?.options,
        permissionChecker: setupState.permissionChecker,
      }),
    [
      pagerExportConfig?.options,
      setupState.accessCodes,
      setupState.accessRoles,
      setupState.permissionChecker,
    ]
  );
  /**
   * 解析导出触发器展示状态。
   * @description 根据动作数量决定是直接执行单动作还是显示下拉菜单。
   */
  const pagerExportTriggerState = useMemo(
    () =>
      resolveTablePagerExportTriggerState<TData>({
        actions: pagerExportActions,
      }),
    [pagerExportActions]
  );
  const pagerExportSingleAction = pagerExportTriggerState.singleAction;
  const pagerConfigRecord = (mergedGridOptions.pagerConfig ?? {}) as Record<string, any>;
  const pagerPosition = pagerConfigRecord.position === 'left' ? 'left' : 'right';
  /**
   * 解析分页栏工具配置。
   * @description 兼容 `toolbar` 与 `toolbarConfig` 两种字段写法。
   */
  const pagerToolbarConfig = useMemo(() => {
    return resolveToolbarConfigRecord(
      pagerConfigRecord.toolbar ?? pagerConfigRecord.toolbarConfig
    );
  }, [pagerConfigRecord.toolbar, pagerConfigRecord.toolbarConfig]);
  const pagerLeftSlot = resolveSlot(runtimeSlots, 'pager-left');
  const pagerCenterSlot = resolveSlot(runtimeSlots, 'pager-center');
  const pagerToolsSlot = resolveSlot(runtimeSlots, 'pager-tools');
  /**
   * 解析分页栏提示配置。
   * @description 与主工具栏提示保持同构能力，支持滚动提示文本。
   */
  const resolvedPagerHint = useMemo(
    () => resolveToolbarHintConfig(pagerToolbarConfig.hint),
    [pagerToolbarConfig.hint]
  );
  const pagerHintPresentation = resolveToolbarHintPresentation(resolvedPagerHint);
  const hasPagerCenterSlot = !!pagerCenterSlot;
  const showPagerCenter = resolveToolbarCenterVisible({
    hasCenterSlot: hasPagerCenterSlot,
    hasHint: !!resolvedPagerHint,
  });
  const pagerHintClassName = [
    'admin-table__toolbar-center',
    'admin-table__pager-bar-center',
    pagerHintPresentation.alignClass,
    pagerHintPresentation.overflowClass,
  ].join(' ');
  const pagerHintTextStyle = pagerHintPresentation.textStyle as
    | (CSSProperties & Record<string, string>)
    | undefined;
  const pagerLeftToolsPosition = resolveToolbarInlinePosition(
    pagerToolbarConfig.leftToolsPosition,
    'before'
  );
  const pagerLeftToolsSlotPosition = resolveToolbarToolsSlotPosition(
    pagerToolbarConfig.leftToolsSlotPosition
  );
  const pagerLeftSlotState = resolveToolbarToolsSlotState(
    !!pagerLeftSlot,
    pagerLeftToolsSlotPosition
  );
  const hasPagerLeftSlot = pagerLeftSlotState.hasSlot;
  const hasPagerLeftSlotReplaceTools = pagerLeftSlotState.replace;
  const hasPagerLeftSlotBeforeTools = pagerLeftSlotState.before;
  const hasPagerLeftSlotAfterTools = pagerLeftSlotState.after;
  /**
   * 解析分页栏左侧工具列表。
   * @description 基于权限、搜索态与最大化状态筛选可显示工具。
   */
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
  const pagerLeftToolsPlacement = useMemo(
    () =>
      resolveToolbarToolsPlacement(
        pagerLeftTools,
        pagerLeftToolsPosition,
        'before'
      ),
    [pagerLeftTools, pagerLeftToolsPosition]
  );
  const pagerLeftToolsBeforeSlot = pagerLeftToolsPlacement.before;
  const pagerLeftToolsAfterSlot = pagerLeftToolsPlacement.after;
  /**
   * 解析分页栏右侧工具原始配置。
   * @description 优先使用 `rightTools`，未提供时回退到 `tools`。
   */
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
  const pagerToolsSlotState = resolveToolbarToolsSlotState(
    !!pagerToolsSlot,
    pagerRightToolsSlotPosition
  );
  const hasPagerToolsSlot = pagerToolsSlotState.hasSlot;
  const hasPagerToolsSlotReplaceTools = pagerToolsSlotState.replace;
  const hasPagerToolsSlotBeforeTools = pagerToolsSlotState.before;
  const hasPagerToolsSlotAfterTools = pagerToolsSlotState.after;
  /**
   * 解析分页栏右侧工具列表。
   * @description 按权限与状态过滤后用于与导出按钮合并渲染。
   */
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
  const pagerRightToolsPlacement = useMemo(
    () =>
      resolveToolbarToolsPlacement(
        pagerRightTools,
        pagerRightToolsPosition,
        'before'
      ),
    [pagerRightTools, pagerRightToolsPosition]
  );
  const pagerRightToolsBeforeBuiltin = pagerRightToolsPlacement.before;
  const pagerRightToolsAfterBuiltin = pagerRightToolsPlacement.after;

  /**
   * 构建列自定义面板控制项。
   * @description 将当前草稿状态映射为可渲染的列控制列表。
   */
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
  /** 列控制顺序摘要，用于检测拖拽重排后的 FLIP 动画触发条件。 */
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
  /**
   * 判断列自定义草稿是否有变更。
   * @description 用于控制“重置/确认”按钮可用状态。
   * @returns 草稿状态是否发生变更。
   */
  const customPanelDirty = useMemo(
    () =>
      hasColumnCustomDraftChanges(
        getDraftColumnCustomState(),
        customOriginStateRef.current
      ),
    [getDraftColumnCustomState]
  );

  /**
   * 触发列自定义变更事件
   * @description 按动作类型构建并派发列自定义事件载荷。
   * @param action 变更动作类型。
   * @param snapshot 列状态快照。
   * @returns 无返回值。
   */
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

  /**
   * 打开列自定义面板
   * @description 生成打开态快照、初始化草稿状态并通知工具栏与外部事件。
   * @returns 无返回值。
   */
  const openCustomPanel = useCallback(() => {
    const transition = resolveColumnCustomOpenTransition(
      mergedGridOptions.columns ?? [],
      getCurrentColumnCustomState()
    );
    customOriginStateRef.current = transition.origin;
    applyDraftColumnCustomSnapshot(transition.draft);
    resetCustomDragState();
    setCustomPanelOpen(transition.panelOpen);
    runtimeGridEvents?.toolbarToolClick?.({
      code: 'custom',
    });
    emitColumnCustomChange(transition.action, transition.snapshot);
  }, [
    applyDraftColumnCustomSnapshot,
    emitColumnCustomChange,
    getCurrentColumnCustomState,
    mergedGridOptions.columns,
    resetCustomDragState,
    runtimeGridEvents,
  ]);

  /**
   * 切换指定列可见性
   * @param key 列键值。
   * @returns 无返回值。
   */
  const toggleCustomColumnVisible = useCallback((key: string) => {
    setCustomDraftVisibleColumns((prev) => {
      const next = toggleColumnCustomVisible(prev, key);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  /**
   * 设置指定列固定方向
   * @param key 列键值。
   * @param value 固定方向（左/右/取消固定）。
   * @returns 无返回值。
   */
  const setCustomColumnFixed = useCallback((key: string, value: '' | 'left' | 'right') => {
    setCustomDraftFixedColumns((prev) => {
      const next = toggleColumnCustomFixed(prev, key, value);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  /**
   * 切换指定列排序能力
   * @param key 列键值。
   * @returns 无返回值。
   */
  const toggleCustomColumnSortableByKey = useCallback((key: string) => {
    setCustomDraftSortableColumns((prev) => {
      const next = toggleColumnCustomSortable(prev, key);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  /**
   * 切换指定列筛选能力
   * @param key 列键值。
   * @returns 无返回值。
   */
  const toggleCustomColumnFilterableByKey = useCallback((key: string) => {
    setCustomDraftFilterableColumns((prev) => {
      const next = toggleColumnCustomFilterable(prev, key);
      return deepEqual(prev, next) ? prev : next;
    });
  }, []);

  /**
   * 移动列到目标位置
   * @param dragKey 被拖拽列键值。
   * @param overKey 目标列键值。
   * @param position 放置位置（上方或下方）。
   * @returns 无返回值。
   */
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

  /**
   * 处理列拖拽开始
   * @param key 当前拖拽列键值。
   * @param event 拖拽事件对象。
   * @returns 无返回值。
   */
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

  /**
   * 处理列拖拽悬停
   * @description 更新拖拽悬停状态并在必要时排队执行列重排。
   * @param key 当前悬停列键值。
   * @param event 拖拽事件对象。
   * @returns 无返回值。
   */
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

  /**
   * 处理拖拽经过列面板主体区域
   * @description 维持拖拽可放置状态并按需触发自动滚动。
   * @param event 拖拽事件对象。
   * @returns 无返回值。
   */
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

  /**
   * 处理列拖拽放下
   * @description 阻止默认行为并重置拖拽状态。
   * @param _key 占位参数，保留与调用方签名一致。
   * @param event 拖拽事件对象。
   * @returns 无返回值。
   */
  const handleCustomDrop = useCallback((_key: string, event: any) => {
    event?.preventDefault?.();
    resetCustomDragState();
  }, [resetCustomDragState]);

  /**
   * 处理列拖拽结束
   * @description 无论是否成功放置都统一重置拖拽状态。
   * @returns 无返回值。
   */
  const handleCustomDragEnd = useCallback(() => {
    resetCustomDragState();
  }, [resetCustomDragState]);

  /**
   * 切换全部列可见性
   * @description 基于当前状态在“全显/部分显示”之间切换。
   * @returns 无返回值。
   */
  const toggleCustomAllColumns = useCallback(() => {
    setCustomDraftVisibleColumns((prev) => {
      const next = toggleAllColumnCustomVisible(
        mergedGridOptions.columns ?? [],
        prev
      );
      return deepEqual(prev, next) ? prev : next;
    });
  }, [mergedGridOptions.columns]);

  /**
   * 取消列自定义编辑
   * @description 恢复到打开面板前的状态并关闭面板。
   */
  const handleCustomCancel = useCallback(() => {
    const transition = resolveColumnCustomCancelTransition(
      mergedGridOptions.columns ?? [],
      {
        current: getCurrentColumnCustomState(),
        origin: customOriginStateRef.current,
      }
    );
    applyDraftColumnCustomSnapshot(transition.draft);
    resetCustomDragState();
    setCustomPanelOpen(transition.panelOpen);
    emitColumnCustomChange(transition.action, transition.snapshot);
  }, [
    applyDraftColumnCustomSnapshot,
    emitColumnCustomChange,
    getCurrentColumnCustomState,
    mergedGridOptions.columns,
    resetCustomDragState,
  ]);

  /**
   * 确认列自定义编辑
   * @description 应用草稿状态、持久化到存储并同步到表格配置。
   */
  const handleCustomConfirm = useCallback(() => {
    const transition = resolveColumnCustomConfirmTransition(
      mergedGridOptions.columns ?? [],
      getDraftColumnCustomState()
    );
    customOriginStateRef.current = transition.origin;
    applyCurrentColumnCustomSnapshot(transition.current);
    resetCustomDragState();
    writeColumnCustomStateToStorage(
      columnCustomPersistenceConfig,
      transition.snapshot
    );
    api.setGridOptions({
      columnCustomState: transition.snapshot as any,
    });
    setCustomPanelOpen(transition.panelOpen);
    emitColumnCustomChange(transition.action, transition.snapshot);
  }, [
    api,
    applyCurrentColumnCustomSnapshot,
    columnCustomPersistenceConfig,
    emitColumnCustomChange,
    getDraftColumnCustomState,
    mergedGridOptions.columns,
    resetCustomDragState,
  ]);

  /**
   * 重置列自定义设置
   * @description 根据用户确认恢复默认列配置并刷新草稿状态。
   */
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
    const transition = resolveColumnCustomResetTransition(
      mergedGridOptions.columns ?? []
    );
    customOriginStateRef.current = transition.origin;
    applyDraftColumnCustomSnapshot(transition.draft);
    applyCurrentColumnCustomSnapshot(transition.current);
    resetCustomDragState();
    writeColumnCustomStateToStorage(
      columnCustomPersistenceConfig,
      transition.snapshot
    );
    api.setGridOptions({
      columnCustomState: transition.snapshot as any,
    });
    setCustomPanelOpen(transition.panelOpen);
    emitColumnCustomChange(transition.action, transition.snapshot);
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

  /**
   * 切换列自定义面板显隐
   * @description 已打开时执行取消流程，未打开时执行打开流程。
   * @returns 无返回值。
   */
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

    /**
     * 处理全局按键：`Escape` 优先关闭自定义面板，其次退出最大化。
     *
     * @param event 键盘事件。
     * @returns 无返回值。
     */
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

    /**
     * 监听文档点击，点击面板外区域时关闭自定义面板。
     *
     * @param event 鼠标事件。
     * @returns 无返回值。
     */
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

  /**
   * 处理内置工具栏按钮点击
   * @description 支持刷新与全屏切换，并在执行后触发工具点击事件。
   * @param code 内置工具编码。
   * @returns 无返回值。
   */
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

  /**
   * 处理扩展工具栏按钮点击
   * @description 按工具配置触发回调并同步派发工具栏点击事件。
   * @param tool 工具配置项。
   * @param index 工具索引。
   * @returns 无返回值。
   */
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

  /**
   * 解析当前页可导出行
   * @description 根据分页配置与当前页信息返回当前页导出数据。
   * @returns 当前页数据行数组。
   */
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

  /**
   * 解析已选中可导出行
   * @description 按选择键集合从当前可见数据中筛出已选行。
   * @returns 已选数据行数组。
   */
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

  /**
   * 执行分页导出动作
   * @description 按动作类型准备导出数据并触发导出执行与事件回调。
   * @param action 分页导出动作配置。
   * @returns 无返回值。
   */
  const handlePagerExportAction = useCallback(
    async (action: ResolvedTablePagerExportAction<TData>) => {
      if (!action || action.disabled) {
        return;
      }
      const { currentPage, pageSize, total } = resolveTablePagerExportPagination({
        currentPage:
          paginationRef.current.current ??
          pagination.current,
        pageSize:
          paginationRef.current.pageSize ??
          pagination.pageSize,
        total:
          paginationRef.current.total ??
          pagination.total,
      });
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
      const result = await executeTablePagerExportAction<TData>({
        action,
        allRows: allRows as TData[],
        columns: columns as Array<Record<string, any>>,
        currentPage,
        currentRows: currentRows as TData[],
        exportAll: pagerExportConfig?.exportAll,
        fileNameFallback: runtimeTableTitle ?? 'table-export',
        missingAllHandlerMessage: localeText.exportAllMissingHandler,
        onMissingAllHandler: (message: string) => {
          console.warn(message);
        },
        pageSize,
        pagerEnabled: mergedGridOptions.pagerConfig?.enabled !== false,
        pagerFileName: pagerExportConfig?.fileName,
        selectedRowKeys: effectiveSelectedRowKeys,
        selectedRows: selectedRows as TData[],
        total,
      });
      if (!result.executed || !result.payload) {
        return;
      }

      runtimeGridEvents?.pagerExportClick?.(
        createPagerExportEventPayload({
          code: result.payload.type,
          currentPage: result.payload.currentPage,
          fileName: result.payload.fileName,
          pageSize: result.payload.pageSize,
          source: 'react',
          total: result.payload.total,
        })
      );
      runtimeGridEvents?.toolbarToolClick?.({
        code: `pager-export-${result.payload.type}`,
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

  /**
   * 处理分页导出触发按钮点击
   * @description 当仅存在单个导出动作时直接执行该动作。
   * @returns 无返回值。
   */
  const handlePagerExportTriggerClick = useCallback(() => {
    if (!pagerExportSingleAction) {
      return;
    }
    void handlePagerExportAction(pagerExportSingleAction);
  }, [handlePagerExportAction, pagerExportSingleAction]);

  /**
   * 处理行操作工具点击
   * @description 校验禁用状态后触发行操作并透传外部事件。
   * @param tool 工具配置项。
   * @param index 工具索引。
   * @param row 当前行数据。
   * @param rowIndex 当前行索引。
   * @returns 无返回值。
   */
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

  /**
   * 应用勾选字段同步
   * @description 将选择键集合同步到数据行勾选字段。
   * @param keys 选中键集合。
   * @returns 无返回值。
   */
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

  /**
   * 更新选择状态
   * @description 统一处理受控/非受控选择更新，并触发行选择变更回调。
   * @param keys 选中键集合。
   * @param info 选择变更附加信息。
   * @returns 无返回值。
   */
  const updateSelectionState = useCallback((keys: Key[], info?: Record<string, any>) => {
    const resolved = resolveTableSelectionChange<TData, Key>({
      keys,
      mode: selectionMode,
      rowKeyField,
      rows: computedDataSource,
    });
    if (!resolved) {
      return;
    }
    const alignedKeys = resolved.alignedKeys;
    if (!isSelectionControlled) {
      setInnerSelectedRowKeys(alignedKeys);
    }
    applySelectionCheckField(alignedKeys);
    mergedGridOptions.rowSelection?.onChange?.(
      alignedKeys,
      resolved.selectedRows,
      info as any
    );
  }, [
    computedDataSource,
    applySelectionCheckField,
    isSelectionControlled,
    mergedGridOptions.rowSelection,
    rowKeyField,
    selectionMode,
  ]);

  /**
   * 解析最终传给 antd 的行选择配置。
   * @description 统一处理 checkbox/radio、禁用态、点击行为及受控/非受控联动。
   */
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

    /**
     * 解析单行选择能力参数，叠加 `checkMethod` 的禁用控制。
     *
     * @param record 行数据。
     * @param rowIndexFromTable 表格传入的行索引。
     * @returns 行选择参数。
     */
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

  /**
   * 合并表格行事件。
   * @description 在保留外部 `onRow` 的前提下叠加行策略点击与整行选择逻辑。
   */
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

  /**
   * 渲染工具栏操作按钮
   * @description 根据工具配置生成按钮节点并绑定点击行为。
   * @param tool 工具配置项。
   * @returns 工具栏按钮节点。
   */
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

  /**
   * 渲染行内操作按钮
   * @description 根据工具配置生成操作按钮并阻止事件冒泡到行点击。
   * @param tool 工具配置项。
   * @param row 当前行数据。
   * @param rowIndex 当前行索引。
   * @returns 行操作按钮节点。
   */
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

  /**
   * 是否显示表格标题区域。
   */
  const showTableTitle =
    !!resolveSlot(runtimeSlots, 'table-title') || !!runtimeTableTitle;
  /**
   * 可见扩展工具集合（排除内置 search）。
   */
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
  const toolbarToolsPlacement = useMemo(
    () =>
      resolveToolbarToolsPlacement(
        toolbarTools,
        toolbarToolsPosition,
        'after'
      ),
    [toolbarTools, toolbarToolsPosition]
  );
  const toolbarToolsBeforeBuiltin = toolbarToolsPlacement.before;
  const toolbarToolsAfterBuiltin = toolbarToolsPlacement.after;

  const operationColumnConfig = useMemo(
    () =>
      resolveOperationColumnConfig(
        mergedGridOptions.operationColumn as any,
        localeText
      ),
    [localeText, mergedGridOptions.operationColumn]
  );
  /**
   * 解析操作列可见动作集合。
   * @description 基于权限、全屏与查询面板状态过滤不可用操作项。
   */
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
  /**
   * 构建最终渲染列集合。
   * @description 当存在可见操作动作时追加操作列，否则返回原始列配置。
   */
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

  const showToolbar = resolveToolbarVisible({
    builtinToolsLength: builtinToolbarTools.length,
    hasActionsSlot: !!toolbarActionsSlot,
    hasToolsSlot: hasToolbarToolsSlot,
    showCenter: showToolbarCenter,
    showSearchButton,
    showTableTitle,
    toolsLength: toolbarTools.length,
  });

  useLayoutEffect(() => {
    if (
      !resolveToolbarHintOverflowEnabled({
        hasCenterSlot: hasToolbarCenterSlot,
        hint: resolvedToolbarHint,
      })
    ) {
      setToolbarHintShouldScroll(false);
      return;
    }

    /**
     * 同步工具栏提示文本溢出状态。
     * @returns 无返回值。
     */
    const syncOverflow = () => {
      const viewport = toolbarHintViewportRef.current;
      const textNode = toolbarHintTextRef.current;
      const next = resolveToolbarHintShouldScroll({
        hasCenterSlot: hasToolbarCenterSlot,
        hint: resolvedToolbarHint,
        textScrollWidth: textNode?.scrollWidth,
        viewportClientWidth: viewport?.clientWidth,
      });
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
    if (
      !resolveToolbarHintOverflowEnabled({
        hasCenterSlot: hasPagerCenterSlot,
        hint: resolvedPagerHint,
      })
    ) {
      setPagerHintShouldScroll(false);
      return undefined;
    }

    /**
     * 同步分页提示文本溢出状态。
     * @returns 无返回值。
     */
    const syncOverflow = () => {
      const viewport = pagerHintViewportRef.current;
      const textNode = pagerHintTextRef.current;
      const next = resolveToolbarHintShouldScroll({
        hasCenterSlot: hasPagerCenterSlot,
        hint: resolvedPagerHint,
        textScrollWidth: textNode?.scrollWidth,
        viewportClientWidth: viewport?.clientWidth,
      });
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
  const hasExplicitGridHeight = Object.prototype.hasOwnProperty.call(
    (tableState.gridOptions ?? {}) as Record<string, any>,
    'height'
  );

  /**
   * 解析表格滚动配置，统一处理自动高度、锁定滚动与虚拟滚动场景。
   * @returns 最终传给 antd Table 的滚动配置对象。
   */
  const resolvedTableScroll = (() => {
    if (bodyScrollLockEnabled) {
      if (
        typeof autoBodyScrollY === 'number'
        && Number.isFinite(autoBodyScrollY)
        && autoBodyScrollY > 0
      ) {
        const normalizedMeasuredHeight = Math.max(1, Math.floor(autoBodyScrollY));
        const explicitHeight = resolveExplicitPixelHeight(sourceTableScroll.y);
        return {
          ...sourceTableScroll,
          y:
            typeof explicitHeight === 'number'
              ? Math.max(
                1,
                Math.floor(Math.min(explicitHeight, normalizedMeasuredHeight))
              )
              : normalizedMeasuredHeight,
        };
      }
      if (
        typeof sourceTableScroll.y === 'number' ||
        typeof sourceTableScroll.y === 'string'
      ) {
        return mergedGridOptions.scroll;
      }
      return {
        ...sourceTableScroll,
        y: '100%',
      };
    }
    if (virtualScrollEnabled) {
      return {
        ...sourceTableScroll,
        y:
          typeof sourceTableScroll.y === 'number'
            ? sourceTableScroll.y
            : resolveTableScrollHeight(mergedGridOptions.height, 500),
      };
    }
    if (typeof sourceTableScroll.y === 'number') {
      return mergedGridOptions.scroll;
    }
    const heightFromGrid = hasExplicitGridHeight
      ? resolveTableScrollHeight(
          mergedGridOptions.height,
          0
        )
      : 0;
    if (heightFromGrid > 0) {
      return {
        ...sourceTableScroll,
        y: heightFromGrid,
      };
    }
    return mergedGridOptions.scroll;
  })();
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
  const showPagerExport = resolveTablePagerExportVisible({
    actionsLength: pagerExportActions.length,
    pagerEnabled: paginationEnabled,
  });
  /**
   * 解析分页区域可见性。
   * @description 统一决定左/中/右区域与扩展节点（首页、末页、导出）的显示条件。
   */
  const pagerVisibilityState = useMemo(
    () =>
      resolvePagerVisibilityState({
        hasLeftSlot: hasPagerLeftSlot,
        hasLeftSlotContent: !!pagerLeftSlot,
        hasRightSlot: hasPagerToolsSlot,
        hasRightSlotContent: !!pagerToolsSlot,
        leftSlotReplace: hasPagerLeftSlotReplaceTools,
        leftToolsLength: pagerLeftTools.length,
        paginationEnabled,
        rightSlotReplace: hasPagerToolsSlotReplaceTools,
        rightToolsLength: pagerRightTools.length,
        showCenter: showPagerCenter,
        showExport: showPagerExport,
        showPageEnd: showPagerEnd,
        showPageHome: showPagerHome,
      }),
    [
      hasPagerLeftSlot,
      hasPagerLeftSlotReplaceTools,
      hasPagerToolsSlot,
      hasPagerToolsSlotReplaceTools,
      pagerLeftTools.length,
      pagerLeftSlot,
      pagerRightTools.length,
      pagerToolsSlot,
      paginationEnabled,
      showPagerCenter,
      showPagerEnd,
      showPagerExport,
      showPagerHome,
    ]
  );
  /**
   * 解析斑马纹展示配置。
   * @description 计算是否启用条纹行以及对应的样式类名。
   */
  const stripePresentation = useMemo(
    () =>
      resolveTableStripePresentation(
        resolveTableStripeConfig(mergedGridOptions.stripe, {
          enabled: false,
          followTheme: false,
        })
      ),
    [mergedGridOptions.stripe]
  );
  const striped = stripePresentation.enabled;
  const stripeClassName = stripePresentation.className;
  /**
   * 解析弹层容器节点
   * @description 优先使用外部配置，兜底到表格根节点或触发节点父级。
   * @param triggerNode 触发弹层的 DOM 节点。
   * @returns 弹层挂载容器节点。
   */
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

  /**
   * 自定义分页项渲染
   * @description 根据布局配置决定分页项是否显示。
   * @param _page 当前页码（未使用）。
   * @param type 分页项类型。
   * @param element 默认分页项节点。
   * @returns 可渲染的分页项节点或 `null`。
   */
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
    const hasPagerExtension = pagerVisibilityState.hasExtension;
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
    pagerVisibilityState.hasExtension,
  ]);

  useLayoutEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    if (!bodyScrollLockEnabled) {
      setAutoBodyScrollY((previous) => (previous === null ? previous : null));
      return undefined;
    }

    let rafId = 0;
    let resizeObserver: null | ResizeObserver = null;

    /**
     * 测量并同步表格主体纵向可滚动高度。
     * @returns 无返回值。
     */
    const syncBodyScrollY = () => {
      const rootElement = tableRootRef.current;
      if (!rootElement) {
        setAutoBodyScrollY((previous) => (previous === null ? previous : null));
        return;
      }
      const wrapperElement = rootElement.querySelector(
        '.ant-table-wrapper'
      ) as HTMLElement | null;
      const bodyElement = rootElement.querySelector(
        '.ant-table-body'
      ) as HTMLElement | null;
      if (!wrapperElement || !bodyElement) {
        setAutoBodyScrollY((previous) => (previous === null ? previous : null));
        return;
      }

      const wrapperRect = wrapperElement.getBoundingClientRect();
      const tableElement = wrapperElement.querySelector(
        '.ant-table'
      ) as HTMLElement | null;
      const tableRect = tableElement?.getBoundingClientRect() ?? wrapperRect;
      const bodyRect = bodyElement.getBoundingClientRect();
      const paginationElement = wrapperElement.querySelector(
        '.ant-table-pagination'
      ) as HTMLElement | null;
      const wrapperAvailableHeight = Math.max(
        0,
        wrapperRect.height - resolveElementOuterHeight(paginationElement)
      );
      const bodyTopOffset = Math.max(0, bodyRect.top - tableRect.top);
      const bodyBottomOffset = Math.max(0, tableRect.bottom - bodyRect.bottom);
      let nextBodyScrollY = Math.floor(
        wrapperAvailableHeight
        - bodyTopOffset
        - bodyBottomOffset
        - BODY_SCROLL_SAFE_GAP
      );

      if (!(nextBodyScrollY > 0)) {
        const rootRect = rootElement.getBoundingClientRect();
        const bodyTopByRoot = Math.max(0, bodyRect.top - rootRect.top);
        const bodyBottomByRoot = Math.max(0, rootRect.bottom - bodyRect.bottom);
        nextBodyScrollY = Math.floor(
          rootElement.clientHeight
          - bodyTopByRoot
          - bodyBottomByRoot
          - BODY_SCROLL_SAFE_GAP
        );
      }

      setAutoBodyScrollY((previous) => {
        if (!(nextBodyScrollY > 0)) {
          return previous === null ? previous : null;
        }
        const normalized = Math.max(1, nextBodyScrollY);
        if (
          typeof previous === 'number' &&
          Number.isFinite(previous) &&
          Math.abs(previous - normalized) < BODY_SCROLL_HEIGHT_EPSILON
        ) {
          return previous;
        }
        return previous === normalized ? previous : normalized;
      });
    };

    /**
     * 将高度同步任务压入动画帧，避免重复测量。
     * @returns 无返回值。
     */
    const scheduleSync = () => {
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        syncBodyScrollY();
      });
    };

    scheduleSync();
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        scheduleSync();
      });
      const rootElement = tableRootRef.current;
      if (rootElement) {
        const observedElements = new Set<HTMLElement>();
        observedElements.add(rootElement);
        for (const element of observedElements) {
          resizeObserver.observe(element);
        }
      }
    } else {
      window.addEventListener('resize', scheduleSync, { passive: true });
    }

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = 0;
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', scheduleSync);
      }
    };
  }, [
    bodyScrollLockEnabled,
    computedDataSource.length,
    loading,
    pagination.current,
    pagination.pageSize,
    pagination.total,
  ]);

  /**
   * 处理表格分页/筛选/排序变更
   * @description 同步分页与排序状态，触发相关事件并在代理模式下发起查询。
   * @param nextPagination 最新分页信息。
   * @param nextFilters 最新筛选条件。
   * @param sorter 最新排序信息。
   * @param extra Ant Design 额外上下文。
   * @returns 无返回值。
   */
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

    const sourceGridOptionsRecord =
      (tableStateRef.current.gridOptions ?? {}) as Record<string, any>;
    const sourcePagerConfig = (sourceGridOptionsRecord.pagerConfig ?? {}) as Record<string, any>;
    const sourceCurrentPage = Number(sourcePagerConfig.currentPage);
    const sourcePageSize = Number(sourcePagerConfig.pageSize);
    const sourcePagerTotal = Number(sourcePagerConfig.total);
    const shouldSyncPagerConfig =
      !Number.isFinite(sourceCurrentPage) ||
      sourceCurrentPage !== nextCurrent ||
      !Number.isFinite(sourcePageSize) ||
      sourcePageSize !== nextPageSize ||
      (Number.isFinite(nextTotal) &&
        (!Number.isFinite(sourcePagerTotal) || sourcePagerTotal !== nextTotal));
    if (shouldSyncPagerConfig) {
      const pagerConfigPatch: Record<string, any> = {
        currentPage: nextCurrent,
        pageSize: nextPageSize,
      };
      if (Number.isFinite(nextTotal)) {
        pagerConfigPatch.total = nextTotal;
      }
      api.setGridOptions({
        pagerConfig: pagerConfigPatch as any,
      });
    }

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
    api,
    computedDataSource,
    executeProxy,
    mergedGridOptions,
    runtimeGridEvents,
  ]);

  /**
   * 分页导航跳转
   * @description 规范化目标页后复用 `handleTableChange` 触发分页变更。
   * @param targetPage 目标页码。
   * @returns 无返回值。
   */
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

  /**
   * 计算表格行 className，合并条纹、选中、策略样式与外部配置。
   *
   * @param record 行数据。
   * @param index 行索引。
   * @param indent 树形缩进层级。
   * @returns 行 className 字符串。
   */
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

  /**
   * 分页首页快捷按钮节点。
   */
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

  /**
   * 分页末页快捷按钮节点。
   */
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

  const showPagerExportInRight = pagerVisibilityState.showExportInRight;
  /**
   * 分页栏导出工具节点。
   * @description 当导出功能可见时渲染按钮及可选下拉动作列表。
   */
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
          {pagerExportTriggerState.showMenu ? (
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
  const showPagerLeftRegion = pagerVisibilityState.showLeft;
  const showPagerCenterRegion = pagerVisibilityState.showCenter;
  const showPagerRightRegion = pagerVisibilityState.showRight;
  /**
   * 分页栏左区域节点。
   */
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
  /**
   * 分页栏中区域节点。
   */
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
  /**
   * 分页栏右区域节点。
   */
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
          stripeClassName,
          paginationEnabled ? `admin-table--pager-align-${pagerPosition}` : '',
          paginationEnabled && showPagerCenterRegion ? 'admin-table--pager-has-center' : '',
          maximized ? 'admin-table--maximized' : '',
        ].join(' ')}
        style={runtimeRootStyle}
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
                placement: mobile
                  ? ['bottomCenter']
                  : [pagerPosition === 'left' ? 'bottomStart' : 'bottomEnd'],
              }
            : false
        }
        scroll={resolvedTableScroll}
        locale={{
          emptyText:
            resolveSlot(runtimeSlots, 'empty') ?? (
              <div className="admin-table__empty admin-table__empty--no-data">
                <svg
                  aria-hidden="true"
                  className="admin-table__empty-illustration"
                  viewBox="0 0 88 72"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <ellipse cx="44" cy="62" rx="24" ry="6" fill="currentColor" opacity="0.1" />
                  <rect x="16" y="18" width="56" height="38" rx="8" fill="currentColor" opacity="0.14" />
                  <path
                    d="M28 36h32v14a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V36Z"
                    fill="currentColor"
                    opacity="0.22"
                  />
                  <rect x="30" y="8" width="28" height="30" rx="4" fill="currentColor" opacity="0.28" />
                  <path
                    d="M36 16h16M36 22h16M36 28h10"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeWidth="2"
                    opacity="0.75"
                  />
                  <circle cx="66" cy="14" r="7" fill="currentColor" opacity="0.18" />
                  <circle cx="64" cy="14" r="1.5" fill="currentColor" opacity="0.8" />
                  <circle cx="68" cy="14" r="1.5" fill="currentColor" opacity="0.8" />
                </svg>
                <span className="admin-table__empty-text">{localeText.noData}</span>
              </div>
            ),
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
