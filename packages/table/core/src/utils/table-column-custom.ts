/**
 * Table Core 列自定义工具。
 * @description 提供列显示、顺序、固定状态等自定义快照与变更解析能力。
 */
import { getLocaleMessages } from '../locales';
import type {
  ColumnCustomAction,
  ColumnCustomChangePayload,
  ColumnCustomSnapshot,
  TableColumnFixedValue,
} from '../types';
import type { TableColumnRecord } from './table-contracts';
import {
  getColumnValueByPath,
  resolveColumnKey,
  resolveColumnTitle,
} from './table-columns';
import { isTableNonEmptyString } from './table-permission';
import { isSeqColumnTypeColumn } from './table-selection';

/**
 * 列拖拽插入位置。
 * `top` 表示插入到目标项上方，`bottom` 表示插入到目标项下方。
 */
export type ColumnCustomDragPosition = 'bottom' | 'top';

/**
 * 列拖拽状态。
 */
export interface ColumnCustomDragState {
  /** 当前被拖拽列键。 */
  dragKey: null | string;
  /** 当前悬停目标列键。 */
  overKey: null | string;
  /** 当前插入位置。 */
  position: ColumnCustomDragPosition | null;
}

/**
 * 列拖拽悬停状态。
 */
export interface ColumnCustomDragHoverState {
  /** 当前悬停目标列键。 */
  overKey: null | string;
  /** 当前插入位置。 */
  position: ColumnCustomDragPosition | null;
}

/**
 * 列自定义面板控制项。
 */
export interface ColumnCustomControlItem {
  /** 是否显示该列。 */
  checked: boolean;
  /** 是否允许筛选。 */
  filterable: boolean;
  /** 固定列位置。 */
  fixed: TableColumnFixedValue;
  /** 列唯一键。 */
  key: string;
  /** 在控制面板中的排序索引。 */
  orderIndex: number;
  /** 是否允许排序。 */
  sortable: boolean;
  /** 列标题。 */
  title: string;
}

/**
 * 运行时列条目。
 */
export interface ColumnRuntimeItem {
  /** 合并列自定义状态后的列配置。 */
  column: TableColumnRecord;
  /** 是否允许筛选。 */
  filterable: boolean;
  /** 固定列位置。 */
  fixed: TableColumnFixedValue;
  /** 列唯一键。 */
  key: string;
  /** 是否允许排序。 */
  sortable: boolean;
  /** 在原始列数组中的索引。 */
  sourceIndex: number;
  /** 是否可见。 */
  visible: boolean;
}

/**
 * FLIP 动画测量矩形数据。
 */
export interface ColumnCustomFlipRect {
  /** 元素顶部坐标。 */
  top: number;
}

/**
 * FLIP 动画位移数据。
 */
export interface ColumnCustomFlipOffset {
  /** 纵向偏移量。 */
  deltaY: number;
  /** 对应列键。 */
  key: string;
}

/**
 * 列自定义快照输入源。
 */
export type ColumnCustomSnapshotSource = Partial<ColumnCustomSnapshot>;

/**
 * 默认筛选项定义。
 */
export interface TableDefaultFilterOption {
  /** 选项键。 */
  key: string;
  /** 选项显示文案。 */
  label: string;
  /** 选项值。 */
  value: string;
}

/**
 * 构建默认筛选项时的参数。
 */
export interface BuildDefaultColumnFilterOptionsOptions {
  /** 空值显示文案。 */
  emptyLabel?: string;
  /** 最大选项数量。 */
  limit?: number;
}

/**
 * 解析取消列自定义快照时的输入参数。
 */
export interface ResolveColumnCustomCancelSnapshotOptions {
  /** 当前快照。 */
  current?: Partial<ColumnCustomSnapshot>;
  /** 原始快照。 */
  origin?: Partial<ColumnCustomSnapshot> | null;
}

/**
 * 解析取消列自定义状态时的输入参数。
 */
export interface ResolveColumnCustomCancelStateOptions {
  /** 当前快照。 */
  current?: ColumnCustomSnapshotSource;
  /** 原始快照。 */
  origin?: ColumnCustomSnapshotSource | null;
}

/**
 * 构建运行时列条目时的附加选项。
 */
export interface BuildColumnRuntimeItemsOptions {
  /** 是否写入 `hidden/visible` 标记。 */
  includeVisibilityFlags?: boolean;
}

/**
 * 控制项顺序摘要所需的最小字段。
 */
export interface ColumnCustomControlDigestItem {
  /** 列键。 */
  key: string;
}

/**
 * 拖拽重置时的状态对象。
 */
export interface ColumnCustomDragResetStateResult {
  /** 当前悬停状态。 */
  dragHover: ColumnCustomDragHoverState;
  /** 当前拖拽状态。 */
  dragState: ColumnCustomDragState;
  /** 当前拖拽列键。 */
  draggingKey: null;
}

/**
 * 拖拽开始时的状态对象。
 */
export interface ColumnCustomDragStartStateResult {
  /** 当前悬停状态。 */
  dragHover: ColumnCustomDragHoverState;
  /** 当前拖拽状态。 */
  dragState: ColumnCustomDragState;
  /** 当前拖拽列键。 */
  draggingKey: string;
}

/**
 * 将筛选值转换为稳定键字符串。
 * 用于去重和在筛选项列表中做唯一标识。
 * @param value 原始筛选值。
 * @returns 对应的稳定键字符串。
 */
export function getColumnFilterValueKey(value: unknown) {
  if (value === null) {
    return '__NULL__';
  }
  if (value === undefined) {
    return '__UNDEFINED__';
  }
  const type = typeof value;
  if (type === 'string') {
    return `string:${value}`;
  }
  if (type === 'number') {
    return `number:${value}`;
  }
  if (type === 'boolean') {
    return `boolean:${value}`;
  }
  try {
    return `json:${JSON.stringify(value)}`;
  } catch {
    return `other:${String(value)}`;
  }
}

/**
 * 解析筛选项显示文案。
 * @param value 原始值。
 * @param emptyLabel 空值占位文案。
 * @returns 可展示的筛选项文本。
 */
function toColumnFilterLabel(value: unknown, emptyLabel: string) {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }
  return String(value);
}

/**
 * 基于当前行数据生成默认筛选项。
 * 会按出现顺序去重并限制最大数量。
 * @param rows 行数据集合。
 * @param field 参与筛选的字段路径。
 * @param options 生成选项。
 * @returns 默认筛选项数组。
 */
export function buildDefaultColumnFilterOptions(
  rows: Record<string, any>[] | undefined,
  field?: string,
  options: BuildDefaultColumnFilterOptionsOptions = {}
): TableDefaultFilterOption[] {
  if (!Array.isArray(rows) || rows.length <= 0 || !isTableNonEmptyString(field)) {
    return [];
  }
  const limit = Math.max(1, options.limit ?? 20);
  const emptyLabel = isTableNonEmptyString(options.emptyLabel)
    ? options.emptyLabel.trim()
    : getLocaleMessages().table.emptyValue;
  const result: TableDefaultFilterOption[] = [];
  const visited = new Set<string>();

  for (const row of rows) {
    const rawValue = getColumnValueByPath(row, field);
    const key = getColumnFilterValueKey(rawValue);
    if (visited.has(key)) {
      continue;
    }
    visited.add(key);
    result.push({
      key,
      label: toColumnFilterLabel(rawValue, emptyLabel),
      value: key,
    });
    if (result.length >= limit) {
      break;
    }
  }

  return result;
}

/**
 * 构建列可见性映射。
 * @param columns 列定义数组。
 * @param source 外部可见性映射。
 * @param preferColumnDefault 当外部未提供时是否使用列默认可见性。
 * @returns 按列键组织的可见性映射。
 */
export function buildColumnVisibilityMap(
  columns: TableColumnRecord[],
  source?: Record<string, boolean>,
  preferColumnDefault = false
) {
  const next: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key] !== false;
      return;
    }
    if (preferColumnDefault) {
      next[key] = column.visible !== false && column.hidden !== true;
      return;
    }
    next[key] = true;
  });
  return next;
}

/**
 * 构建列固定位置映射。
 * @param columns 列定义数组。
 * @param source 外部固定列映射。
 * @param preferColumnDefault 当外部未提供时是否使用列默认固定配置。
 * @returns 按列键组织的固定位置映射。
 */
export function buildColumnFixedMap(
  columns: TableColumnRecord[],
  source?: Record<string, TableColumnFixedValue>,
  preferColumnDefault = false
) {
  const next: Record<string, TableColumnFixedValue> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      const fixed = source[key];
      next[key] = fixed === 'left' || fixed === 'right' ? fixed : '';
      return;
    }
    if (preferColumnDefault) {
      const fixed = column.fixed;
      next[key] = fixed === 'left' || fixed === 'right' ? fixed : '';
      return;
    }
    next[key] = '';
  });
  return next;
}

/**
 * 判断列是否支持排序。
 * @param column 列配置。
 * @returns 是否可排序。
 */
function resolveColumnSortable(column: TableColumnRecord) {
  if (typeof column.sortable === 'boolean') {
    return column.sortable;
  }
  if (typeof column.sorter === 'boolean') {
    return column.sorter;
  }
  if (typeof column.sorter === 'function') {
    return true;
  }
  return false;
}

/**
 * 判断列是否支持筛选。
 * @param column 列配置。
 * @returns 是否可筛选。
 */
function resolveColumnFilterable(column: TableColumnRecord) {
  if (typeof column.filterable === 'boolean') {
    return column.filterable;
  }
  if (Array.isArray(column.filters)) {
    return column.filters.length > 0;
  }
  if (
    typeof column.filterDropdown === 'function' ||
    typeof column.filterMethod === 'function' ||
    typeof column.onFilter === 'function'
  ) {
    return true;
  }
  return !!column.filterRender;
}

/**
 * 构建列排序能力映射。
 * @param columns 列定义数组。
 * @param source 外部排序能力映射。
 * @param preferColumnDefault 当外部未提供时是否使用列默认排序能力。
 * @returns 按列键组织的排序能力映射。
 */
export function buildColumnSortableMap(
  columns: TableColumnRecord[],
  source?: Record<string, boolean>,
  preferColumnDefault = false
) {
  const next: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key] !== false;
      return;
    }
    if (preferColumnDefault) {
      next[key] = resolveColumnSortable(column);
      return;
    }
    next[key] = false;
  });
  return next;
}

/**
 * 构建列筛选能力映射。
 * @param columns 列定义数组。
 * @param source 外部筛选能力映射。
 * @param preferColumnDefault 当外部未提供时是否使用列默认筛选能力。
 * @returns 按列键组织的筛选能力映射。
 */
export function buildColumnFilterableMap(
  columns: TableColumnRecord[],
  source?: Record<string, boolean>,
  preferColumnDefault = false
) {
  const next: Record<string, boolean> = {};
  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    if (source && Object.prototype.hasOwnProperty.call(source, key)) {
      next[key] = source[key] !== false;
      return;
    }
    if (preferColumnDefault) {
      next[key] = resolveColumnFilterable(column);
      return;
    }
    next[key] = false;
  });
  return next;
}

/**
 * 构建列顺序数组。
 * 会保留已存在键顺序，并将新增序号列优先插入前部。
 * @param columns 列定义数组。
 * @param source 外部顺序数组。
 * @returns 规范化后的列顺序。
 */
export function buildColumnOrder(
  columns: TableColumnRecord[],
  source?: string[]
) {
  const allKeys = columns.map((column, index) => resolveColumnKey(column, index));
  if (!Array.isArray(source) || source.length <= 0) {
    return allKeys;
  }
  const allKeysSet = new Set(allKeys);
  const sourceSet = new Set(source);
  const next: string[] = source.filter((key) => allKeysSet.has(key));
  const missingSeq: string[] = [];
  const missingCommon: string[] = [];
  allKeys.forEach((key, index) => {
    if (sourceSet.has(key)) {
      return;
    }
    if (isSeqColumnTypeColumn(columns[index])) {
      missingSeq.push(key);
      return;
    }
    missingCommon.push(key);
  });
  return [...missingSeq, ...next, ...missingCommon];
}

/**
 * 在数组中移动元素位置。
 * @template T 数组元素类型。
 * @param list 原数组。
 * @param fromIndex 起始索引。
 * @param toIndex 目标索引。
 * @returns 移动后的新数组；索引无效时返回原数组。
 */
export function moveArrayItem<T = string>(list: T[], fromIndex: number, toIndex: number) {
  if (fromIndex === toIndex) {
    return list;
  }
  const next = [...list];
  const item = next[fromIndex];
  if (typeof item === 'undefined') {
    return list;
  }
  next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

/**
 * 基于已解析列键构建顺序数组。
 * @param columns 列定义数组。
 * @param keys 已解析列键数组。
 * @param source 外部顺序数组。
 * @returns 对齐后的列顺序。
 */
function buildColumnOrderByResolvedKeys(
  columns: TableColumnRecord[],
  keys: string[],
  source?: string[]
) {
  if (!Array.isArray(source) || source.length <= 0) {
    return keys;
  }
  const keysSet = new Set(keys);
  const sourceSet = new Set(source);
  const next: string[] = source.filter((key) => keysSet.has(key));
  const missingSeq: string[] = [];
  const missingCommon: string[] = [];
  keys.forEach((key, index) => {
    if (sourceSet.has(key)) {
      return;
    }
    if (isSeqColumnTypeColumn(columns[index])) {
      missingSeq.push(key);
      return;
    }
    missingCommon.push(key);
  });
  return [...missingSeq, ...next, ...missingCommon];
}

/**
 * 创建列自定义快照。
 * 快照包含列可见性、固定、排序、筛选与顺序信息。
 * @param columns 列定义数组。
 * @param source 外部快照输入。
 * @param preferColumnDefault 当外部未提供时是否使用列默认配置。
 * @returns 规范化后的列自定义快照。
 */
export function createColumnCustomSnapshot(
  columns: TableColumnRecord[],
  source: ColumnCustomSnapshotSource = {},
  preferColumnDefault = true
): ColumnCustomSnapshot {
  if (columns.length <= 0) {
    return {
      filterable: {},
      fixed: {},
      order: [],
      sortable: {},
      visible: {},
    };
  }

  const visible: Record<string, boolean> = {};
  const fixed: Record<string, TableColumnFixedValue> = {};
  const sortable: Record<string, boolean> = {};
  const filterable: Record<string, boolean> = {};
  const allKeys: string[] = [];

  columns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    allKeys.push(key);

    const visibleSource = source.visible;
    if (visibleSource && Object.prototype.hasOwnProperty.call(visibleSource, key)) {
      visible[key] = visibleSource[key] !== false;
    } else if (preferColumnDefault) {
      visible[key] = column.visible !== false && column.hidden !== true;
    } else {
      visible[key] = true;
    }

    const fixedSource = source.fixed;
    if (fixedSource && Object.prototype.hasOwnProperty.call(fixedSource, key)) {
      const sourceFixed = fixedSource[key];
      fixed[key] = sourceFixed === 'left' || sourceFixed === 'right' ? sourceFixed : '';
    } else if (preferColumnDefault) {
      const columnFixed = column.fixed;
      fixed[key] = columnFixed === 'left' || columnFixed === 'right' ? columnFixed : '';
    } else {
      fixed[key] = '';
    }

    const sortableSource = source.sortable;
    if (sortableSource && Object.prototype.hasOwnProperty.call(sortableSource, key)) {
      sortable[key] = sortableSource[key] !== false;
    } else if (preferColumnDefault) {
      sortable[key] = resolveColumnSortable(column);
    } else {
      sortable[key] = false;
    }

    const filterableSource = source.filterable;
    if (filterableSource && Object.prototype.hasOwnProperty.call(filterableSource, key)) {
      filterable[key] = filterableSource[key] !== false;
    } else if (preferColumnDefault) {
      filterable[key] = resolveColumnFilterable(column);
    } else {
      filterable[key] = false;
    }
  });

  return {
    filterable,
    fixed,
    order: buildColumnOrderByResolvedKeys(columns, allKeys, source.order),
    sortable,
    visible,
  };
}

/**
 * 解析打开列自定义面板时使用的快照。
 * @param columns 列定义数组。
 * @param current 当前快照来源。
 * @returns 归一化后的打开态快照。
 */
export function resolveColumnCustomOpenSnapshot(
  columns: TableColumnRecord[],
  current?: ColumnCustomSnapshotSource
) {
  return createColumnCustomSnapshot(columns, current ?? {}, true);
}

/**
 * 深拷贝列自定义快照。
 * @param snapshot 快照来源。
 * @returns 克隆后的快照对象。
 */
export function cloneColumnCustomSnapshot(
  snapshot?: ColumnCustomSnapshotSource | null
): ColumnCustomSnapshot {
  const source = snapshot ?? {};
  return {
    filterable: { ...(source.filterable ?? {}) },
    fixed: { ...(source.fixed ?? {}) },
    order: [...(source.order ?? [])],
    sortable: { ...(source.sortable ?? {}) },
    visible: { ...(source.visible ?? {}) },
  };
}

/**
 * 解析工作快照时的输入参数。
 */
export interface ResolveColumnCustomWorkingSnapshotOptions {
  /** 当前内部快照。 */
  current?: ColumnCustomSnapshotSource;
  /** 外部传入快照。 */
  external?: ColumnCustomSnapshotSource | null;
}

/**
 * 解析当前应使用的列自定义工作快照。
 * 外部快照有效时优先使用外部快照，否则使用内部当前快照。
 * @param columns 列定义数组。
 * @param options 快照来源配置。
 * @returns 归一化后的工作快照。
 */
export function resolveColumnCustomWorkingSnapshot(
  columns: TableColumnRecord[],
  options: ResolveColumnCustomWorkingSnapshotOptions = {}
) {
  const source = hasColumnCustomSnapshot(options.external)
    ? (options.external ?? {})
    : (options.current ?? {});
  return createColumnCustomSnapshot(columns, source, true);
}

/**
 * 打开列自定义时的状态结果。
 */
export interface ResolveColumnCustomOpenStateResult {
  /** 可编辑草稿快照。 */
  draft: ColumnCustomSnapshot;
  /** 打开时的原始快照。 */
  origin: ColumnCustomSnapshot;
  /** 当前生效快照。 */
  snapshot: ColumnCustomSnapshot;
}

/**
 * 解析“打开列自定义面板”状态。
 * @param columns 列定义数组。
 * @param current 当前快照来源。
 * @returns 打开态所需的完整状态对象。
 */
export function resolveColumnCustomOpenState(
  columns: TableColumnRecord[],
  current?: ColumnCustomSnapshotSource
): ResolveColumnCustomOpenStateResult {
  const snapshot = resolveColumnCustomOpenSnapshot(columns, current);
  return {
    draft: cloneColumnCustomSnapshot(snapshot),
    origin: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

/**
 * 判断快照是否包含有效列自定义数据。
 * @param snapshot 待判断快照。
 * @returns 只要任一维度存在数据即返回 `true`。
 */
export function hasColumnCustomSnapshot(
  snapshot?: Partial<ColumnCustomSnapshot> | null
) {
  if (!snapshot) {
    return false;
  }
  return (
    (Array.isArray(snapshot.order) && snapshot.order.length > 0) ||
    (snapshot.visible ? Object.keys(snapshot.visible).length > 0 : false) ||
    (snapshot.fixed ? Object.keys(snapshot.fixed).length > 0 : false) ||
    (snapshot.sortable ? Object.keys(snapshot.sortable).length > 0 : false) ||
    (snapshot.filterable ? Object.keys(snapshot.filterable).length > 0 : false)
  );
}

/**
 * 解析“取消列自定义”后的快照。
 * 有 origin 时回退到 origin，否则回退到 current。
 * @param columns 列定义数组。
 * @param options 快照来源。
 * @returns 取消后的目标快照。
 */
export function resolveColumnCustomCancelSnapshot(
  columns: TableColumnRecord[],
  options: ResolveColumnCustomCancelSnapshotOptions
) {
  if (hasColumnCustomSnapshot(options.origin)) {
    return createColumnCustomSnapshot(columns, options.origin ?? {}, true);
  }
  return createColumnCustomSnapshot(columns, options.current ?? {}, true);
}

/**
 * 取消列自定义时的状态结果。
 */
export interface ResolveColumnCustomCancelStateResult {
  /** 取消后草稿快照。 */
  draft: ColumnCustomSnapshot;
  /** 取消后生效快照。 */
  snapshot: ColumnCustomSnapshot;
}

/**
 * 解析“取消列自定义”状态。
 * @param columns 列定义数组。
 * @param options 快照来源。
 * @returns 取消态所需状态对象。
 */
export function resolveColumnCustomCancelState(
  columns: TableColumnRecord[],
  options: ResolveColumnCustomCancelStateOptions
): ResolveColumnCustomCancelStateResult {
  const snapshot = resolveColumnCustomCancelSnapshot(columns, options);
  return {
    draft: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

/**
 * 解析“确认列自定义”后的快照。
 * @param columns 列定义数组。
 * @param draft 草稿快照。
 * @returns 确认后的目标快照。
 */
export function resolveColumnCustomConfirmSnapshot(
  columns: TableColumnRecord[],
  draft?: Partial<ColumnCustomSnapshot>
) {
  return createColumnCustomSnapshot(columns, draft ?? {}, true);
}

/**
 * 确认列自定义时的状态结果。
 */
export interface ResolveColumnCustomConfirmStateResult {
  /** 确认后的当前快照。 */
  current: ColumnCustomSnapshot;
  /** 确认后的原始快照。 */
  origin: ColumnCustomSnapshot;
  /** 当前生效快照。 */
  snapshot: ColumnCustomSnapshot;
}

/**
 * 解析“确认列自定义”状态。
 * @param columns 列定义数组。
 * @param draft 草稿快照。
 * @returns 确认态所需状态对象。
 */
export function resolveColumnCustomConfirmState(
  columns: TableColumnRecord[],
  draft?: ColumnCustomSnapshotSource
): ResolveColumnCustomConfirmStateResult {
  const snapshot = resolveColumnCustomConfirmSnapshot(columns, draft);
  return {
    current: cloneColumnCustomSnapshot(snapshot),
    origin: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

/**
 * 解析“重置列自定义”后的快照。
 * @param columns 列定义数组。
 * @returns 重置后的默认快照。
 */
export function resolveColumnCustomResetSnapshot(columns: TableColumnRecord[]) {
  return createColumnCustomSnapshot(columns, {}, true);
}

/**
 * 重置列自定义时的状态结果。
 */
export interface ResolveColumnCustomResetStateResult {
  /** 重置后的当前快照。 */
  current: ColumnCustomSnapshot;
  /** 重置后的草稿快照。 */
  draft: ColumnCustomSnapshot;
  /** 重置后的原始快照。 */
  origin: ColumnCustomSnapshot;
  /** 当前生效快照。 */
  snapshot: ColumnCustomSnapshot;
}

/**
 * 解析“重置列自定义”状态。
 * @param columns 列定义数组。
 * @returns 重置态所需状态对象。
 */
export function resolveColumnCustomResetState(
  columns: TableColumnRecord[]
): ResolveColumnCustomResetStateResult {
  const snapshot = resolveColumnCustomResetSnapshot(columns);
  return {
    current: cloneColumnCustomSnapshot(snapshot),
    draft: cloneColumnCustomSnapshot(snapshot),
    origin: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

/**
 * 创建列自定义变更事件载荷。
 * @param columns 原始列配置。
 * @param action 变更动作类型。
 * @param snapshotInput 快照输入。
 * @returns 可用于通知外部的变更载荷。
 */
export function createColumnCustomChangePayload(
  columns: TableColumnRecord[],
  action: ColumnCustomAction,
  snapshotInput?: Partial<ColumnCustomSnapshot>
): ColumnCustomChangePayload {
  const snapshot = createColumnCustomSnapshot(columns, snapshotInput ?? {}, true);
  const runtimeColumns = buildColumnRuntimeItems(
    columns,
    snapshot,
    {
      includeVisibilityFlags: true,
    }
  ).map((item) => item.column);
  return {
    action,
    columns: runtimeColumns,
    snapshot,
    sourceColumns: [...columns],
  };
}

/**
 * 切换单列可见状态。
 * @param visibleMap 当前可见性映射。
 * @param key 目标列键。
 * @returns 新的可见性映射。
 */
export function toggleColumnCustomVisible(
  visibleMap: Record<string, boolean>,
  key: string
) {
  return {
    ...visibleMap,
    [key]: visibleMap[key] === false,
  };
}

/**
 * 切换布尔映射中的目标键状态。
 * @param flagMap 当前布尔映射。
 * @param key 目标键。
 * @returns 切换后的映射。
 */
function toggleColumnCustomBooleanFlag(
  flagMap: Record<string, boolean>,
  key: string
) {
  return {
    ...flagMap,
    [key]: flagMap[key] === false,
  };
}

/**
 * 切换全部列可见状态。
 * 当前存在任意隐藏列时将全部设为显示，否则全部设为隐藏。
 * @param columns 列定义数组。
 * @param visibleMap 当前可见性映射。
 * @returns 更新后的可见性映射。
 */
export function toggleAllColumnCustomVisible(
  columns: TableColumnRecord[],
  visibleMap: Record<string, boolean>
) {
  const normalized = buildColumnVisibilityMap(
    columns,
    visibleMap,
    true
  );
  const keys = Object.keys(normalized);
  if (keys.length <= 0) {
    return visibleMap;
  }
  const shouldCheck = keys.some((item) => normalized[item] === false);
  const next = {
    ...normalized,
  };
  keys.forEach((item) => {
    next[item] = shouldCheck;
  });
  return next;
}

/**
 * 切换列固定位置。
 * 目标位置与当前一致时会取消固定。
 * @param fixedMap 当前固定列映射。
 * @param key 目标列键。
 * @param value 目标固定位置。
 * @returns 更新后的固定列映射。
 */
export function toggleColumnCustomFixed(
  fixedMap: Record<string, TableColumnFixedValue>,
  key: string,
  value: TableColumnFixedValue
) {
  const current = fixedMap[key] ?? '';
  const nextValue = current === value ? '' : value;
  return {
    ...fixedMap,
    [key]: nextValue,
  };
}

/**
 * 切换列排序开关。
 * @param sortableMap 当前排序映射。
 * @param key 目标列键。
 * @returns 更新后的排序映射。
 */
export function toggleColumnCustomSortable(
  sortableMap: Record<string, boolean>,
  key: string
) {
  return toggleColumnCustomBooleanFlag(sortableMap, key);
}

/**
 * 切换列筛选开关。
 * @param filterableMap 当前筛选映射。
 * @param key 目标列键。
 * @returns 更新后的筛选映射。
 */
export function toggleColumnCustomFilterable(
  filterableMap: Record<string, boolean>,
  key: string
) {
  return toggleColumnCustomBooleanFlag(filterableMap, key);
}

/**
 * 根据拖拽状态计算新的列顺序。
 * @param columns 列定义数组。
 * @param order 当前列顺序。
 * @param dragKey 被拖拽列键。
 * @param overKey 悬停目标列键。
 * @param position 插入位置。
 * @returns 变更后的列顺序。
 */
export function applyColumnCustomDragMove(
  columns: TableColumnRecord[],
  order: string[],
  dragKey: string,
  overKey: string,
  position: ColumnCustomDragPosition
) {
  const normalized = buildColumnOrder(columns, order);
  const fromIndex = normalized.findIndex((item) => item === dragKey);
  const overIndex = normalized.findIndex((item) => item === overKey);
  if (fromIndex < 0 || overIndex < 0 || fromIndex === overIndex) {
    return order;
  }
  let toIndex = position === 'bottom' ? overIndex + 1 : overIndex;
  if (fromIndex < toIndex) {
    toIndex -= 1;
  }
  if (toIndex < 0 || toIndex >= normalized.length) {
    return order;
  }
  return moveArrayItem(normalized, fromIndex, toIndex);
}

/**
 * 解析拖拽插入位置时的参数。
 */
export interface ResolveColumnCustomDragPositionOptions {
  /** 死区最大值。 */
  deadZoneMax?: number;
  /** 死区最小值。 */
  deadZoneMin?: number;
  /** 死区占行高比例。 */
  deadZoneRatio?: number;
  /** 鼠标相对当前行顶部的偏移。 */
  offsetY: number;
  /** 上一次插入位置。 */
  previousPosition?: ColumnCustomDragPosition | null;
  /** 当前行高度。 */
  rowHeight: number;
}

/**
 * 解析拖拽悬停时的插入位置。
 * @param options 位置判定参数。
 * @returns `top` 或 `bottom`。
 */
export function resolveColumnCustomDragPosition(
  options: ResolveColumnCustomDragPositionOptions
): ColumnCustomDragPosition {
  const rowHeight = Number.isFinite(options.rowHeight)
    ? Math.max(1, options.rowHeight)
    : 1;
  const offsetY = Number.isFinite(options.offsetY)
    ? options.offsetY
    : rowHeight / 2;
  const centerY = rowHeight / 2;
  const deadZone = Math.max(
    options.deadZoneMin ?? 3,
    Math.min(options.deadZoneMax ?? 10, rowHeight * (options.deadZoneRatio ?? 0.16))
  );

  if (offsetY <= centerY - deadZone) {
    return 'top';
  }
  if (offsetY >= centerY + deadZone) {
    return 'bottom';
  }
  if (options.previousPosition === 'top' || options.previousPosition === 'bottom') {
    return options.previousPosition;
  }
  return offsetY >= centerY ? 'bottom' : 'top';
}

/**
 * 创建拖拽状态重置值。
 * @returns 拖拽相关状态的初始对象。
 */
export function createColumnCustomDragResetState(): ColumnCustomDragResetStateResult {
  return {
    dragHover: {
      overKey: null,
      position: null,
    },
    dragState: {
      dragKey: null,
      overKey: null,
      position: null,
    },
    draggingKey: null,
  };
}

/**
 * 解析当前拖拽列键。
 * @param draggingKey 独立拖拽键状态。
 * @param dragState 拖拽状态对象。
 * @returns 当前有效拖拽键。
 */
export function resolveColumnCustomDraggingKey(
  draggingKey: null | string | undefined,
  dragState?: Pick<ColumnCustomDragState, 'dragKey'>
) {
  return draggingKey ?? dragState?.dragKey ?? null;
}

/**
 * 创建拖拽开始时的状态。
 * @param key 被拖拽列键。
 * @returns 拖拽开始态对象。
 */
export function resolveColumnCustomDragStartState(
  key: string
): ColumnCustomDragStartStateResult {
  return {
    dragHover: {
      overKey: null,
      position: null,
    },
    dragState: {
      dragKey: key,
      overKey: null,
      position: null,
    },
    draggingKey: key,
  };
}

/**
 * 解析拖拽悬停状态时的参数。
 */
export interface ResolveColumnCustomDragOverStateOptions {
  /** 当前拖拽列键。 */
  dragKey: null | string;
  /** 鼠标相对行顶部偏移。 */
  offsetY: number;
  /** 当前悬停列键。 */
  overKey: string;
  /** 上一次悬停状态。 */
  previousHover?: ColumnCustomDragHoverState | null;
  /** 当前行高度。 */
  rowHeight: number;
}

/**
 * 解析拖拽悬停时的状态对象。
 * @param options 悬停判定参数。
 * @returns 悬停状态结果；无效悬停时返回 `null`。
 */
export function resolveColumnCustomDragOverState(
  options: ResolveColumnCustomDragOverStateOptions
) {
  const dragKey = options.dragKey ?? null;
  const overKey = options.overKey;
  if (!dragKey || !overKey || dragKey === overKey) {
    return null;
  }
  const previousHover = options.previousHover ?? {
    overKey: null,
    position: null,
  };
  const position = resolveColumnCustomDragPosition({
    offsetY: options.offsetY,
    previousPosition:
      previousHover.overKey === overKey
        ? previousHover.position
        : null,
    rowHeight: options.rowHeight,
  });
  const dragHover: ColumnCustomDragHoverState = {
    overKey,
    position,
  };
  const dragState: ColumnCustomDragState = {
    dragKey,
    overKey,
    position,
  };
  const shouldQueueMove =
    previousHover.overKey !== overKey || previousHover.position !== position;
  return {
    dragHover,
    dragState,
    shouldQueueMove,
  };
}

/**
 * 解析拖拽自动滚动目标 scrollTop 时的参数。
 */
export interface ResolveColumnCustomAutoScrollTopOptions {
  /** 当前鼠标 Y 坐标。 */
  clientY: number;
  /** 容器底部 Y 坐标。 */
  containerBottom: number;
  /** 容器高度。 */
  containerHeight: number;
  /** 容器顶部 Y 坐标。 */
  containerTop: number;
  /** 当前滚动位置。 */
  scrollTop: number;
  /** 距离到滚动步长的换算除数。 */
  stepDivider?: number;
  /** 最小滚动步长。 */
  stepMin?: number;
  /** 自动滚动区域最大值。 */
  zoneMax?: number;
  /** 自动滚动区域最小值。 */
  zoneMin?: number;
  /** 自动滚动区域占比。 */
  zoneRatio?: number;
}

/**
 * 计算拖拽时容器自动滚动目标值。
 * @param options 自动滚动参数。
 * @returns 下一帧建议的 `scrollTop`。
 */
export function resolveColumnCustomAutoScrollTop(
  options: ResolveColumnCustomAutoScrollTopOptions
) {
  const height = Number.isFinite(options.containerHeight)
    ? options.containerHeight
    : 0;
  if (height <= 0) {
    return options.scrollTop;
  }
  const zoneSize = Math.max(
    options.zoneMin ?? 20,
    Math.min(options.zoneMax ?? 48, height * (options.zoneRatio ?? 0.24))
  );
  const topZone = options.containerTop + zoneSize;
  const bottomZone = options.containerBottom - zoneSize;
  const stepDivider = options.stepDivider ?? 6;
  const minStep = options.stepMin ?? 4;

  let nextScrollTop = options.scrollTop;
  if (options.clientY < topZone) {
    const distance = topZone - options.clientY;
    nextScrollTop -= Math.max(minStep, Math.ceil(distance / stepDivider));
  } else if (options.clientY > bottomZone) {
    const distance = options.clientY - bottomZone;
    nextScrollTop += Math.max(minStep, Math.ceil(distance / stepDivider));
  }
  return nextScrollTop;
}

/**
 * 列自定义控制项引用类型。
 */
export type ColumnCustomControlRef = string | { key?: string };

/**
 * 收集 FLIP 位移数据时的参数。
 */
export interface CollectColumnCustomFlipOffsetsOptions {
  /** 当前控制项集合。 */
  controls: ColumnCustomControlRef[];
  /** 当前正在拖拽的列键。 */
  draggingKey?: null | string;
  /** 新布局矩形映射。 */
  nextRects?: Map<string, ColumnCustomFlipRect> | null;
  /** 旧布局矩形映射。 */
  prevRects?: Map<string, ColumnCustomFlipRect> | null;
  /** 位移忽略阈值。 */
  threshold?: number;
}

/**
 * FLIP 动画节点最小能力约束。
 */
export interface ColumnCustomFlipNodeLike {
  /** 读取节点矩形信息。 */
  getBoundingClientRect: () => {
    /** 节点顶部坐标。 */
    top: number;
  };
  /** 节点样式对象。 */
  style: {
    /** 位移样式值。 */
    transform: string;
    /** 过渡样式值。 */
    transition: string;
  };
}

/**
 * 收集 FLIP 矩形数据时的参数。
 */
export interface CollectColumnCustomFlipRectsOptions {
  /** 当前控制项集合。 */
  controls: ColumnCustomControlRef[];
  /** 根据列键解析对应节点。 */
  resolveNode: (key: string) => ColumnCustomFlipNodeLike | null | undefined;
}

/**
 * 解析控制项对应的列键。
 * @param control 控制项引用。
 * @returns 列键；无效时返回空字符串。
 */
function resolveColumnCustomFlipKey(control: ColumnCustomControlRef) {
  if (typeof control === 'string') {
    return control;
  }
  if (control && isTableNonEmptyString(control.key)) {
    return control.key;
  }
  return '';
}

/**
 * 计算 FLIP 动画位移列表。
 * @param options 位移计算参数。
 * @returns 需要执行动画的位移列表。
 */
export function collectColumnCustomFlipOffsets(
  options: CollectColumnCustomFlipOffsetsOptions
) {
  const prevRects = options.prevRects;
  const nextRects = options.nextRects;
  if (
    !prevRects ||
    !nextRects ||
    prevRects.size <= 0 ||
    nextRects.size <= 0
  ) {
    return [] as ColumnCustomFlipOffset[];
  }
  const threshold =
    typeof options.threshold === 'number' && Number.isFinite(options.threshold)
      ? Math.max(0, options.threshold)
      : 0.5;
  const draggingKey = options.draggingKey;
  const result: ColumnCustomFlipOffset[] = [];

  options.controls.forEach((control) => {
    const key = resolveColumnCustomFlipKey(control);
    if (!key || key === draggingKey) {
      return;
    }
    const prevRect = prevRects.get(key);
    const nextRect = nextRects.get(key);
    if (!prevRect || !nextRect) {
      return;
    }
    const deltaY = prevRect.top - nextRect.top;
    if (Math.abs(deltaY) < threshold) {
      return;
    }
    result.push({
      deltaY,
      key,
    });
  });

  return result;
}

/**
 * 收集控制项当前矩形数据。
 * @param options 矩形收集参数。
 * @returns 以列键为索引的矩形映射。
 */
export function collectColumnCustomFlipRects(
  options: CollectColumnCustomFlipRectsOptions
) {
  const rects = new Map<string, ColumnCustomFlipRect>();
  options.controls.forEach((control) => {
    const key = resolveColumnCustomFlipKey(control);
    if (!key) {
      return;
    }
    const node = options.resolveNode(key);
    if (!node) {
      return;
    }
    rects.set(key, {
      top: node.getBoundingClientRect().top,
    });
  });
  return rects;
}

/**
 * 应用 FLIP 位移时的参数。
 */
export interface ApplyColumnCustomFlipOffsetsOptions {
  /** 位移列表。 */
  offsets: ColumnCustomFlipOffset[];
  /** 根据列键解析节点。 */
  resolveNode: (key: string) => ColumnCustomFlipNodeLike | null | undefined;
}

/**
 * 将位移应用到对应节点上，准备执行 FLIP 动画。
 * @param options 位移应用参数。
 * @returns 被移动的节点列表。
 */
export function applyColumnCustomFlipOffsets(
  options: ApplyColumnCustomFlipOffsetsOptions
) {
  const movedNodes: ColumnCustomFlipNodeLike[] = [];
  options.offsets.forEach((offset) => {
    const node = options.resolveNode(offset.key);
    if (!node) {
      return;
    }
    node.style.transition = 'none';
    node.style.transform = `translateY(${offset.deltaY}px)`;
    movedNodes.push(node);
  });
  return movedNodes;
}

/**
 * 强制触发布局重排。
 * @param nodes 节点列表。
 * @returns 无返回值。
 */
export function forceColumnCustomFlipReflow(
  nodes: Array<ColumnCustomFlipNodeLike | null | undefined>
) {
  nodes.forEach((node) => {
    node?.getBoundingClientRect();
  });
}

/**
 * 清理 FLIP 动画相关样式。
 * @param nodes 节点列表。
 * @returns 无返回值。
 */
export function resetColumnCustomFlipTransforms(
  nodes: Array<ColumnCustomFlipNodeLike | null | undefined>
) {
  nodes.forEach((node) => {
    if (!node) {
      return;
    }
    node.style.transition = '';
    node.style.transform = '';
  });
}

/**
 * 构建列自定义面板控制项列表。
 * @param columns 列定义数组。
 * @param draft 草稿快照。
 * @returns 面板控制项列表。
 */
export function buildColumnCustomControls(
  columns: TableColumnRecord[],
  draft: Partial<ColumnCustomSnapshot>
) {
  const sourceColumns = columns ?? [];
  if (sourceColumns.length <= 0) {
    return [] as ColumnCustomControlItem[];
  }
  const snapshot = createColumnCustomSnapshot(sourceColumns, draft, true);
  const columnEntryMap = new Map<string, {
    column: TableColumnRecord;
    index: number;
  }>();

  sourceColumns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    columnEntryMap.set(key, {
      column,
      index,
    });
  });

  const controls: ColumnCustomControlItem[] = [];
  snapshot.order.forEach((key, orderIndex) => {
    const entry = columnEntryMap.get(key);
    if (!entry) {
      return;
    }
    const fixed = snapshot.fixed[key];
    controls.push({
      checked: snapshot.visible[key] !== false,
      filterable: snapshot.filterable[key] !== false,
      fixed: fixed === 'left' || fixed === 'right' ? fixed : '',
      key,
      orderIndex,
      sortable: snapshot.sortable[key] !== false,
      title: resolveColumnTitle(entry.column, entry.index),
    });
  });
  return controls;
}

/**
 * 生成控制项顺序摘要。
 * 可用于快速比对控制项顺序是否变化。
 * @param controls 控制项数组。
 * @returns 顺序摘要字符串。
 */
export function createColumnCustomControlsOrderDigest(
  controls: ColumnCustomControlDigestItem[] = []
) {
  if (!Array.isArray(controls) || controls.length <= 0) {
    return '';
  }
  const keys = controls.map((item) => String(item?.key ?? ''));
  return `${keys.length}:${keys.join('\u001f')}`;
}

const COLUMN_FILTER_META_KEY = '__adminTableFilterMeta';
const COLUMN_FILTER_META_FIELDS = [
  'defaultFilteredValue',
  'filterDropdown',
  'filterIcon',
  'filterMethod',
  'filterMode',
  'filterMultiple',
  'filterRecoverMethod',
  'filterRender',
  'filterResetMethod',
  'filterSearch',
  'filteredValue',
  'filters',
  'onFilter',
] as const;

/**
 * 列筛选元数据字段名。
 */
type ColumnFilterMetaField = (typeof COLUMN_FILTER_META_FIELDS)[number];

/**
 * 列筛选元数据对象。
 */
type ColumnFilterMeta = Partial<Record<ColumnFilterMetaField, unknown>>;

/**
 * 提取列上的筛选元数据字段。
 * @param column 列配置。
 * @returns 提取后的筛选元数据。
 */
function pickColumnFilterMeta(column: TableColumnRecord) {
  const meta: ColumnFilterMeta = {};
  COLUMN_FILTER_META_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(column, field)) {
      meta[field] = column[field];
    }
  });
  return meta;
}

/**
 * 判断筛选元数据是否包含任意字段。
 * @param meta 筛选元数据对象。
 * @returns 包含任意字段时返回 `true`。
 */
function hasColumnFilterMeta(meta: ColumnFilterMeta) {
  for (const field of COLUMN_FILTER_META_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(meta, field)) {
      return true;
    }
  }
  return false;
}

/**
 * 根据快照构建运行时列条目。
 * @param columns 列定义数组。
 * @param snapshot 列自定义快照。
 * @param options 构建选项。
 * @returns 运行时列条目数组。
 */
export function buildColumnRuntimeItems(
  columns: TableColumnRecord[],
  snapshot: Partial<ColumnCustomSnapshot>,
  options: BuildColumnRuntimeItemsOptions = {}
) {
  const includeVisibilityFlags = options.includeVisibilityFlags !== false;
  const sourceColumns = columns ?? [];
  if (sourceColumns.length <= 0) {
    return [] as ColumnRuntimeItem[];
  }
  const normalized = createColumnCustomSnapshot(sourceColumns, snapshot, true);
  const columnEntryMap = new Map<string, {
    column: TableColumnRecord;
    index: number;
  }>();

  sourceColumns.forEach((column, index) => {
    const key = resolveColumnKey(column, index);
    columnEntryMap.set(key, {
      column,
      index,
    });
  });

  const runtimeItems: ColumnRuntimeItem[] = [];
  normalized.order.forEach((key) => {
    const entry = columnEntryMap.get(key);
    if (!entry) {
      return;
    }
    const sourceColumn = entry.column;
    const sourceIndex = entry.index;
    const visible = normalized.visible[key] !== false;
    const fixed = normalized.fixed[key];
    const sortable = normalized.sortable[key] !== false;
    const filterable = normalized.filterable[key] !== false;
    const nextColumn: TableColumnRecord = {
      ...sourceColumn,
    };

    const sourceFilterMeta = (
      nextColumn[COLUMN_FILTER_META_KEY] ??
      pickColumnFilterMeta(sourceColumn)
    ) as ColumnFilterMeta;
    const hasSourceFilterMeta = hasColumnFilterMeta(sourceFilterMeta);
    if (hasSourceFilterMeta) {
      nextColumn[COLUMN_FILTER_META_KEY] = sourceFilterMeta;
    }

    if (fixed === 'left' || fixed === 'right') {
      nextColumn.fixed = fixed;
    } else {
      delete nextColumn.fixed;
    }

    nextColumn.sortable = sortable;

    if (filterable) {
      if (hasSourceFilterMeta) {
        COLUMN_FILTER_META_FIELDS.forEach((field) => {
          if (Object.prototype.hasOwnProperty.call(sourceFilterMeta, field)) {
            nextColumn[field] = sourceFilterMeta[field];
          }
        });
      }
    } else {
      COLUMN_FILTER_META_FIELDS.forEach((field) => {
        delete nextColumn[field];
      });
    }
    nextColumn.filterable = filterable;

    if (includeVisibilityFlags) {
      nextColumn.hidden = !visible;
      nextColumn.visible = visible;
    } else {
      delete nextColumn.hidden;
      delete nextColumn.visible;
    }

    runtimeItems.push({
      column: nextColumn,
      filterable,
      fixed: fixed === 'left' || fixed === 'right' ? fixed : '',
      key,
      sortable,
      sourceIndex,
      visible,
    });
  });

  return runtimeItems;
}
