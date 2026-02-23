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

export type ColumnCustomDragPosition = 'bottom' | 'top';

export interface ColumnCustomDragState {
  dragKey: null | string;
  overKey: null | string;
  position: ColumnCustomDragPosition | null;
}

export interface ColumnCustomDragHoverState {
  overKey: null | string;
  position: ColumnCustomDragPosition | null;
}

export interface ColumnCustomControlItem {
  checked: boolean;
  filterable: boolean;
  fixed: TableColumnFixedValue;
  key: string;
  orderIndex: number;
  sortable: boolean;
  title: string;
}

export interface ColumnRuntimeItem {
  column: TableColumnRecord;
  filterable: boolean;
  fixed: TableColumnFixedValue;
  key: string;
  sortable: boolean;
  sourceIndex: number;
  visible: boolean;
}

export interface ColumnCustomFlipRect {
  top: number;
}

export interface ColumnCustomFlipOffset {
  deltaY: number;
  key: string;
}

export type ColumnCustomSnapshotSource = Partial<ColumnCustomSnapshot>;

export interface TableDefaultFilterOption {
  key: string;
  label: string;
  value: string;
}

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

function toColumnFilterLabel(value: unknown, emptyLabel: string) {
  if (value === null || value === undefined || value === '') {
    return emptyLabel;
  }
  return String(value);
}

export function buildDefaultColumnFilterOptions(
  rows: Record<string, any>[] | undefined,
  field?: string,
  options: {
    emptyLabel?: string;
    limit?: number;
  } = {}
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

export function resolveColumnCustomOpenSnapshot(
  columns: TableColumnRecord[],
  current?: ColumnCustomSnapshotSource
) {
  return createColumnCustomSnapshot(columns, current ?? {}, true);
}

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

export interface ResolveColumnCustomWorkingSnapshotOptions {
  current?: ColumnCustomSnapshotSource;
  external?: ColumnCustomSnapshotSource | null;
}

export function resolveColumnCustomWorkingSnapshot(
  columns: TableColumnRecord[],
  options: ResolveColumnCustomWorkingSnapshotOptions = {}
) {
  const source = hasColumnCustomSnapshot(options.external)
    ? (options.external ?? {})
    : (options.current ?? {});
  return createColumnCustomSnapshot(columns, source, true);
}

export interface ResolveColumnCustomOpenStateResult {
  draft: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

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

export function resolveColumnCustomCancelSnapshot(
  columns: TableColumnRecord[],
  options: {
    current?: Partial<ColumnCustomSnapshot>;
    origin?: Partial<ColumnCustomSnapshot> | null;
  }
) {
  if (hasColumnCustomSnapshot(options.origin)) {
    return createColumnCustomSnapshot(columns, options.origin ?? {}, true);
  }
  return createColumnCustomSnapshot(columns, options.current ?? {}, true);
}

export interface ResolveColumnCustomCancelStateResult {
  draft: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

export function resolveColumnCustomCancelState(
  columns: TableColumnRecord[],
  options: {
    current?: ColumnCustomSnapshotSource;
    origin?: ColumnCustomSnapshotSource | null;
  }
): ResolveColumnCustomCancelStateResult {
  const snapshot = resolveColumnCustomCancelSnapshot(columns, options);
  return {
    draft: cloneColumnCustomSnapshot(snapshot),
    snapshot,
  };
}

export function resolveColumnCustomConfirmSnapshot(
  columns: TableColumnRecord[],
  draft?: Partial<ColumnCustomSnapshot>
) {
  return createColumnCustomSnapshot(columns, draft ?? {}, true);
}

export interface ResolveColumnCustomConfirmStateResult {
  current: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

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

export function resolveColumnCustomResetSnapshot(columns: TableColumnRecord[]) {
  return createColumnCustomSnapshot(columns, {}, true);
}

export interface ResolveColumnCustomResetStateResult {
  current: ColumnCustomSnapshot;
  draft: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  snapshot: ColumnCustomSnapshot;
}

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

export function toggleColumnCustomVisible(
  visibleMap: Record<string, boolean>,
  key: string
) {
  return {
    ...visibleMap,
    [key]: visibleMap[key] === false,
  };
}

function toggleColumnCustomBooleanFlag(
  flagMap: Record<string, boolean>,
  key: string
) {
  return {
    ...flagMap,
    [key]: flagMap[key] === false,
  };
}

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

export function toggleColumnCustomSortable(
  sortableMap: Record<string, boolean>,
  key: string
) {
  return toggleColumnCustomBooleanFlag(sortableMap, key);
}

export function toggleColumnCustomFilterable(
  filterableMap: Record<string, boolean>,
  key: string
) {
  return toggleColumnCustomBooleanFlag(filterableMap, key);
}

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

export interface ResolveColumnCustomDragPositionOptions {
  deadZoneMax?: number;
  deadZoneMin?: number;
  deadZoneRatio?: number;
  offsetY: number;
  previousPosition?: ColumnCustomDragPosition | null;
  rowHeight: number;
}

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

export function createColumnCustomDragResetState(): {
  dragHover: ColumnCustomDragHoverState;
  dragState: ColumnCustomDragState;
  draggingKey: null;
} {
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

export function resolveColumnCustomDraggingKey(
  draggingKey: null | string | undefined,
  dragState?: Pick<ColumnCustomDragState, 'dragKey'>
) {
  return draggingKey ?? dragState?.dragKey ?? null;
}

export function resolveColumnCustomDragStartState(key: string): {
  dragHover: ColumnCustomDragHoverState;
  dragState: ColumnCustomDragState;
  draggingKey: string;
} {
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

export interface ResolveColumnCustomDragOverStateOptions {
  dragKey: null | string;
  offsetY: number;
  overKey: string;
  previousHover?: ColumnCustomDragHoverState | null;
  rowHeight: number;
}

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

export interface ResolveColumnCustomAutoScrollTopOptions {
  clientY: number;
  containerBottom: number;
  containerHeight: number;
  containerTop: number;
  scrollTop: number;
  stepDivider?: number;
  stepMin?: number;
  zoneMax?: number;
  zoneMin?: number;
  zoneRatio?: number;
}

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

export interface CollectColumnCustomFlipOffsetsOptions {
  controls: Array<string | { key?: string }>;
  draggingKey?: null | string;
  nextRects?: Map<string, ColumnCustomFlipRect> | null;
  prevRects?: Map<string, ColumnCustomFlipRect> | null;
  threshold?: number;
}

export interface ColumnCustomFlipNodeLike {
  getBoundingClientRect: () => {
    top: number;
  };
  style: {
    transform: string;
    transition: string;
  };
}

export interface CollectColumnCustomFlipRectsOptions {
  controls: Array<string | { key?: string }>;
  resolveNode: (key: string) => ColumnCustomFlipNodeLike | null | undefined;
}

function resolveColumnCustomFlipKey(control: string | { key?: string }) {
  if (typeof control === 'string') {
    return control;
  }
  if (control && isTableNonEmptyString(control.key)) {
    return control.key;
  }
  return '';
}

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

export interface ApplyColumnCustomFlipOffsetsOptions {
  offsets: ColumnCustomFlipOffset[];
  resolveNode: (key: string) => ColumnCustomFlipNodeLike | null | undefined;
}

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

export function forceColumnCustomFlipReflow(
  nodes: Array<ColumnCustomFlipNodeLike | null | undefined>
) {
  nodes.forEach((node) => {
    node?.getBoundingClientRect();
  });
}

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

export function createColumnCustomControlsOrderDigest(
  controls: Array<{
    key: string;
  }> = []
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

type ColumnFilterMetaField = (typeof COLUMN_FILTER_META_FIELDS)[number];
type ColumnFilterMeta = Partial<Record<ColumnFilterMetaField, unknown>>;

function pickColumnFilterMeta(column: TableColumnRecord) {
  const meta: ColumnFilterMeta = {};
  COLUMN_FILTER_META_FIELDS.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(column, field)) {
      meta[field] = column[field];
    }
  });
  return meta;
}

function hasColumnFilterMeta(meta: ColumnFilterMeta) {
  for (const field of COLUMN_FILTER_META_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(meta, field)) {
      return true;
    }
  }
  return false;
}

export function buildColumnRuntimeItems(
  columns: TableColumnRecord[],
  snapshot: Partial<ColumnCustomSnapshot>,
  options: {
    includeVisibilityFlags?: boolean;
  } = {}
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
