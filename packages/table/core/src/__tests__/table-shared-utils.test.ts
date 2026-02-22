import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySelectionCheckFieldToRows,
  applyColumnCustomDragMove,
  applyColumnCustomFlipOffsets,
  buildColumnCustomControls,
  buildColumnFilterableMap,
  buildColumnRuntimeItems,
  buildBuiltinToolbarTools,
  collectColumnCustomFlipOffsets,
  collectColumnCustomFlipRects,
  createColumnCustomChangePayload,
  buildColumnFixedMap,
  buildColumnOrder,
  readColumnCustomStateFromStorage,
  resolveColumnCustomPersistenceConfig,
  buildColumnSortableMap,
  buildColumnVisibilityMap,
  createTableDateFormatter,
  createTableComparableSelectionKeySet,
  createColumnCustomSnapshot,
  createTableLocaleText,
  createColumnCustomDragResetState,
  collectSelectionKeysByField,
  collectSelectionKeysByRows,
  flattenTableRows,
  evaluateToolbarToolPermission,
  forceColumnCustomFlipReflow,
  getColumnValueByPath,
  getSearchPanelToggleTitle,
  getSeparatorStyle,
  hasTableRowStrategyStyle,
  hasColumnCustomSnapshot,
  isProxyEnabled,
  moveArrayItem,
  normalizeTableSelectionKeys,
  resolveColumnCustomState,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomOpenState,
  resolveColumnCustomWorkingSnapshot,
  resolveColumnCustomCancelSnapshot,
  resolveColumnCustomCancelState,
  resolveColumnCustomConfirmSnapshot,
  resolveColumnCustomConfirmState,
  resolveColumnCustomResetSnapshot,
  resolveColumnCustomResetState,
  resolveColumnCustomAutoScrollTop,
  resolveRowClickSelectionKeys,
  resolveSelectionRowsByKeys,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragPosition,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  alignSelectionKeysToRows,
  resolveToolbarActionTools,
  resolveToolbarActionButtonClassState,
  resolveToolbarInlinePosition,
  resolveToolbarHintConfig,
  resolveToolbarActionPresentation,
  resolveToolbarActionButtonRenderState,
  resolveToolbarActionThemeClass,
  resolveToolbarActionTypeClass,
  resolveVisibleToolbarActionTools,
  resolveTableRowStrategyInlineStyle,
  resolveToolbarCustomConfig,
  resolveToolbarToolVisibility,
  resolveToolbarToolsSlotPosition,
  setColumnValueByPath,
  shallowEqualObjectRecord,
  toTableComparableSelectionKey,
  shouldRenderToolbarTool,
  isToolbarCustomEnabled,
  normalizeTableLocale,
  resolveColumnKey,
  resolveColumnType,
  resolveColumnTitle,
  ensureSeqColumn,
  resolveSelectionColumn,
  resolveSelectionMode,
  resolveTableCellStrategy,
  resolveTableCellStrategyResult,
  triggerTableCellStrategyClick,
  triggerTableRowStrategyClick,
  resolveTableRowStrategies,
  resolveTableRowStrategyResult,
  ensureSelectionColumn,
  resolveOperationColumnConfig,
  resolveOperationColumnTools,
  resolveOperationCellAlignClass,
  resolveVisibleOperationActionTools,
  isSeqColumnTypeColumn,
  isSelectionColumnTypeColumn,
  resolveSeqColumn,
  resolveSeqColumnConfig,
  writeColumnCustomStateToStorage,
  shouldShowSeparator,
  triggerOperationActionTool,
  triggerToolbarActionTool,
  toggleAllColumnCustomVisible,
  toggleColumnCustomFilterable,
  toggleColumnCustomFixed,
  toggleColumnCustomSortable,
  toggleColumnCustomVisible,
  resetColumnCustomFlipTransforms,
} from '../utils';

function createMockStorage() {
  const bucket = new Map<string, string>();
  return {
    clear() {
      bucket.clear();
    },
    getItem(key: string) {
      return bucket.has(key) ? bucket.get(key) ?? null : null;
    },
    key(index: number) {
      return Array.from(bucket.keys())[index] ?? null;
    },
    removeItem(key: string) {
      bucket.delete(key);
    },
    setItem(key: string, value: string) {
      bucket.set(key, value);
    },
  };
}

describe('table shared utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should resolve column key and title', () => {
    expect(resolveColumnKey({ key: 'name' }, 0)).toBe('name');
    expect(resolveColumnTitle({ title: 'Name' }, 0)).toBe('Name');
    expect(resolveColumnTitle({}, 1)).toBe('Column 2');
  });

  it('should resolve and auto inject selection column', () => {
    const columns = [{ field: 'id' }, { field: 'name' }];

    expect(resolveSelectionMode({ checkboxConfig: {} }, columns)).toBe('checkbox');
    expect(resolveSelectionMode({ radioConfig: {} }, columns)).toBe('radio');
    expect(resolveSelectionMode({ rowSelection: { type: 'checkbox' } }, columns)).toBe('checkbox');
    expect(resolveSelectionMode({}, columns)).toBeUndefined();

    const autoColumns = ensureSelectionColumn(columns, 'checkbox');
    expect(autoColumns).toHaveLength(3);
    expect(autoColumns[0]).toMatchObject({
      align: 'center',
      type: 'checkbox',
      width: 72,
    });
    expect(resolveSelectionColumn(autoColumns)).toMatchObject({
      type: 'checkbox',
    });
    expect(resolveColumnType(autoColumns[0])).toBe('checkbox');
    expect(isSelectionColumnTypeColumn(autoColumns[0])).toBe(true);
    expect(isSelectionColumnTypeColumn(autoColumns[0], 'checkbox')).toBe(true);
    expect(isSelectionColumnTypeColumn(autoColumns[0], 'radio')).toBe(false);

    const sourceWithSelection = [{ type: 'radio', width: 60 }, ...columns];
    expect(ensureSelectionColumn(sourceWithSelection, 'checkbox')).toBe(sourceWithSelection);
  });

  it('should normalize selection keys and shallow compare records', () => {
    expect(
      normalizeTableSelectionKeys<number>([1, 2, 2, 3], 'checkbox')
    ).toEqual([1, 2, 3]);
    expect(
      normalizeTableSelectionKeys<number | string>([1, 2, 2, 3], 'radio')
    ).toEqual([1]);
    expect(normalizeTableSelectionKeys([], 'radio')).toEqual([]);
    expect(normalizeTableSelectionKeys(undefined, 'checkbox')).toEqual([]);

    expect(shallowEqualObjectRecord(undefined, undefined)).toBe(true);
    expect(shallowEqualObjectRecord(null, null)).toBe(true);
    expect(shallowEqualObjectRecord({ a: 1 }, { a: 1 })).toBe(true);
    expect(shallowEqualObjectRecord({ a: 1 }, { a: 2 })).toBe(false);
    expect(shallowEqualObjectRecord({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('should resolve comparable selection keys and flatten rows', () => {
    expect(toTableComparableSelectionKey(1)).toBe('1');
    expect(toTableComparableSelectionKey('1')).toBe('1');
    expect(toTableComparableSelectionKey(null)).toBeNull();
    expect(toTableComparableSelectionKey(undefined)).toBeNull();

    expect(
      Array.from(
        createTableComparableSelectionKeySet([1, '1', 2, null, undefined])
      )
    ).toEqual(['1', '2']);

    const rows = [
      {
        id: 1,
        children: [
          {
            id: 11,
          },
        ],
      },
      {
        id: 2,
      },
    ];
    expect(flattenTableRows(rows).map((item) => item.id)).toEqual([1, 11, 2]);
  });

  it('should collect selection keys and align to rows', () => {
    const rows = [
      {
        id: 1,
        checked: true,
      },
      {
        id: 2,
        checked: false,
      },
      {
        id: 3,
        checked: true,
      },
    ];
    expect(
      collectSelectionKeysByField(rows, {
        checkField: 'checked',
        keyField: 'id',
        mode: 'checkbox',
      })
    ).toEqual([1, 3]);
    expect(
      collectSelectionKeysByField(rows, {
        checkField: 'checked',
        keyField: 'id',
        mode: 'radio',
      })
    ).toEqual([1]);
    expect(
      alignSelectionKeysToRows(['1', '2', '9'], rows, 'id')
    ).toEqual([1, 2, '9']);

    expect(
      collectSelectionKeysByRows(rows, {
        keyField: 'id',
      })
    ).toEqual([1, 2, 3]);
    expect(
      collectSelectionKeysByRows(rows, {
        keyField: 'id',
        mode: 'radio',
      })
    ).toEqual([1]);
    expect(
      resolveSelectionRowsByKeys(rows, {
        keyField: 'id',
        selectedKeys: ['1', 3, '9'],
      })
    ).toEqual([
      {
        id: 1,
        checked: true,
      },
      {
        id: 3,
        checked: true,
      },
    ]);
  });

  it('should resolve next row-click selection keys', () => {
    expect(
      resolveRowClickSelectionKeys({
        currentKeys: [1, 2],
        mode: 'checkbox',
        rowKey: 2,
      })
    ).toEqual([1]);
    expect(
      resolveRowClickSelectionKeys({
        currentKeys: [1, 2],
        mode: 'checkbox',
        rowKey: 3,
      })
    ).toEqual([1, 2, 3]);
    expect(
      resolveRowClickSelectionKeys({
        currentKeys: [1],
        mode: 'radio',
        rowKey: 1,
        strict: false,
      })
    ).toEqual([]);
    expect(
      resolveRowClickSelectionKeys({
        currentKeys: [1],
        mode: 'radio',
        rowKey: 2,
        strict: true,
      })
    ).toEqual([2]);
    expect(
      resolveRowClickSelectionKeys({
        currentKeys: [1],
        mode: 'radio',
        rowKey: null,
      })
    ).toBeUndefined();
  });

  it('should resolve operation column defaults and overrides', () => {
    const localeText = createTableLocaleText({
      operation: 'Actions',
    });

    expect(resolveOperationColumnConfig(undefined, localeText)).toBeUndefined();
    expect(resolveOperationColumnConfig(false, localeText)).toBeUndefined();
    expect(
      resolveOperationColumnConfig(
        {
          enabled: false,
        },
        localeText
      )
    ).toBeUndefined();
    expect(resolveOperationColumnConfig(true, localeText)).toEqual({
      align: 'center',
      attrs: undefined,
      fixed: 'right',
      key: '__admin-table-operation',
      title: 'Actions',
      width: 200,
    });
    expect(
      resolveOperationColumnConfig(
        {
          align: 'left',
          attrs: {
            className: 'custom-op-col',
          },
          fixed: 'left',
          key: 'op-col',
          title: '操作',
          width: 280,
        },
        localeText
      )
    ).toEqual({
      align: 'left',
      attrs: {
        className: 'custom-op-col',
      },
      fixed: 'left',
      key: 'op-col',
      title: '操作',
      width: 280,
    });
  });

  it('should resolve operation tools and align class with shared helpers', () => {
    const operationColumn = {
      tools: [
        {
          code: 'view',
          title: '查看',
        },
        {
          code: 'delete',
          permission: ['TABLE_DELETE'],
          title: '删除',
        },
      ],
    };

    expect(resolveOperationColumnTools(undefined)).toEqual([]);
    expect(resolveOperationColumnTools(true)).toEqual([]);
    expect(resolveOperationColumnTools(operationColumn)).toEqual(
      operationColumn.tools
    );

    expect(resolveOperationCellAlignClass(undefined)).toBe('is-center');
    expect(resolveOperationCellAlignClass('left')).toBe('is-left');
    expect(resolveOperationCellAlignClass('right')).toBe('is-right');
    expect(resolveOperationCellAlignClass('unknown')).toBe('is-center');

    expect(
      resolveVisibleOperationActionTools({
        accessCodes: ['TABLE_DELETE'],
        operationColumn,
      }).map((item) => item.code)
    ).toEqual(['view', 'delete']);
    expect(
      resolveVisibleOperationActionTools({
        accessCodes: ['TABLE_VIEW'],
        operationColumn,
      }).map((item) => item.code)
    ).toEqual(['view']);
  });

  it('should resolve and auto inject seq column', () => {
    const columns = [{ field: 'name' }, { field: 'age' }];

    expect(resolveSeqColumnConfig(true)).toEqual({
      align: 'center',
      fixed: undefined,
      key: undefined,
      title: '序号',
      width: 60,
    });
    expect(resolveSeqColumnConfig(false)).toBeUndefined();
    expect(
      resolveSeqColumnConfig({
        align: 'left',
        enabled: true,
        fixed: 'left',
        key: 'seq-col',
        title: 'No.',
        width: 88,
      })
    ).toEqual({
      align: 'left',
      fixed: 'left',
      key: 'seq-col',
      title: 'No.',
      width: 88,
    });
    expect(
      resolveSeqColumnConfig(
        true,
        {
          title: 'No.',
        }
      )
    ).toMatchObject({
      title: 'No.',
    });

    const autoColumns = ensureSeqColumn(columns, true);
    expect(autoColumns).toHaveLength(3);
    expect(autoColumns[0]).toMatchObject({
      align: 'center',
      title: '序号',
      type: 'seq',
      width: 60,
    });
    expect(resolveSeqColumn(autoColumns)).toMatchObject({
      type: 'seq',
    });
    expect(isSeqColumnTypeColumn(autoColumns[0])).toBe(true);

    const sourceWithSeq = [{ type: 'seq', width: 70 }, ...columns];
    expect(ensureSeqColumn(sourceWithSeq, true)).toBe(sourceWithSeq);
  });

  it('should build visibility/fixed/sortable/filterable maps', () => {
    const columns = [
      { field: 'id', fixed: 'left', filters: [{ data: 'A', value: 'a' }], sortable: true },
      { field: 'name', hidden: true },
    ];

    expect(buildColumnVisibilityMap(columns, undefined, true)).toEqual({
      id: true,
      name: false,
    });
    expect(buildColumnFixedMap(columns, undefined, true)).toEqual({
      id: 'left',
      name: '',
    });
    expect(buildColumnSortableMap(columns, undefined, true)).toEqual({
      id: true,
      name: false,
    });
    expect(buildColumnFilterableMap(columns, undefined, true)).toEqual({
      id: true,
      name: false,
    });
  });

  it('should build order and move items', () => {
    const columns = [{ field: 'id' }, { field: 'name' }, { field: 'age' }];
    expect(buildColumnOrder(columns, ['age', 'id'])).toEqual(['age', 'id', 'name']);
    expect(moveArrayItem(['a', 'b', 'c'], 0, 2)).toEqual(['b', 'c', 'a']);

    const withSeqColumns = [
      { key: '__admin-table-auto-seq', type: 'seq' },
      { field: 'name' },
      { field: 'age' },
    ];
    expect(buildColumnOrder(withSeqColumns, ['name', 'age'])).toEqual([
      '__admin-table-auto-seq',
      'name',
      'age',
    ]);
  });

  it('should resolve custom snapshot lifecycle (open/cancel/confirm/reset)', () => {
    const columns = [{ field: 'id' }, { field: 'name', hidden: true }];
    const current = createColumnCustomSnapshot(
      columns,
      {
        filterable: { id: true, name: false },
        fixed: { id: 'left' },
        order: ['name', 'id'],
        sortable: { id: true, name: false },
        visible: { id: true, name: false },
      },
      true
    );

    expect(hasColumnCustomSnapshot(current)).toBe(true);

    const confirmed = resolveColumnCustomConfirmSnapshot(columns, {
      filterable: { id: false, name: true },
      fixed: { id: '' },
      order: ['id', 'name'],
      sortable: { id: false, name: true },
      visible: { id: true, name: true },
    });
    expect(confirmed).toEqual({
      filterable: { id: false, name: true },
      fixed: { id: '', name: '' },
      order: ['id', 'name'],
      sortable: { id: false, name: true },
      visible: { id: true, name: true },
    });

    const canceled = resolveColumnCustomCancelSnapshot(columns, {
      current: confirmed,
      origin: current,
    });
    expect(canceled).toEqual(current);

    const reset = resolveColumnCustomResetSnapshot(columns);
    expect(reset).toEqual({
      filterable: { id: false, name: false },
      fixed: { id: '', name: '' },
      order: ['id', 'name'],
      sortable: { id: false, name: false },
      visible: { id: true, name: false },
    });
  });

  it('should resolve open snapshot from current column-custom state', () => {
    const columns = [{ field: 'id' }, { field: 'name', hidden: true }];
    const opened = resolveColumnCustomOpenSnapshot(columns, {
      filterable: { id: true },
      fixed: { id: 'left' },
      order: ['name', 'id'],
      sortable: { id: true },
      visible: { id: true, name: false },
    });

    expect(opened).toEqual({
      filterable: { id: true, name: false },
      fixed: { id: 'left', name: '' },
      order: ['name', 'id'],
      sortable: { id: true, name: false },
      visible: { id: true, name: false },
    });
  });

  it('should resolve column-custom state transitions for open/cancel/confirm/reset', () => {
    const columns = [{ field: 'id' }, { field: 'name' }];
    const current = {
      filterable: { id: true, name: false },
      fixed: { id: 'left', name: '' },
      order: ['id', 'name'],
      sortable: { id: true, name: false },
      visible: { id: true, name: true },
    };

    const openState = resolveColumnCustomOpenState(columns, current);
    expect(openState.snapshot).toEqual(current);
    expect(openState.origin).toEqual(current);
    expect(openState.draft).toEqual(current);
    expect(openState.origin).not.toBe(openState.draft);

    const cancelState = resolveColumnCustomCancelState(columns, {
      current: {
        ...current,
        order: ['name', 'id'],
      },
      origin: openState.origin,
    });
    expect(cancelState.snapshot.order).toEqual(['id', 'name']);
    expect(cancelState.draft.order).toEqual(['id', 'name']);

    const confirmState = resolveColumnCustomConfirmState(columns, {
      ...openState.draft,
      visible: {
        id: true,
        name: false,
      },
    });
    expect(confirmState.snapshot.visible).toEqual({
      id: true,
      name: false,
    });
    expect(confirmState.current.visible).toEqual({
      id: true,
      name: false,
    });
    expect(confirmState.origin.visible).toEqual({
      id: true,
      name: false,
    });

    const resetState = resolveColumnCustomResetState(columns);
    expect(resetState.current.order).toEqual(['id', 'name']);
    expect(resetState.draft.order).toEqual(['id', 'name']);
    expect(resetState.origin.order).toEqual(['id', 'name']);
  });

  it('should resolve working snapshot by external priority', () => {
    const columns = [{ field: 'id' }, { field: 'name' }];
    const snapshot = resolveColumnCustomWorkingSnapshot(columns, {
      current: {
        visible: { id: true, name: true },
      },
      external: {
        visible: { id: true, name: false },
      },
    });
    expect(snapshot.visible).toEqual({ id: true, name: false });
  });

  it('should resolve custom panel controls and operations', () => {
    const columns = [{ field: 'id' }, { field: 'name' }, { field: 'age' }];
    const snapshot = createColumnCustomSnapshot(
      columns,
      {
        filterable: { id: true, name: false, age: true },
        fixed: { id: 'left' },
        order: ['id', 'name', 'age'],
        sortable: { id: true, name: false, age: true },
        visible: { id: true, name: false, age: true },
      },
      true
    );

    expect(
      toggleColumnCustomVisible(snapshot.visible, 'name')
    ).toEqual({ id: true, name: true, age: true });

    expect(
      toggleAllColumnCustomVisible(columns, snapshot.visible)
    ).toEqual({ id: true, name: true, age: true });

    expect(
      toggleColumnCustomFixed(snapshot.fixed, 'id', 'left')
    ).toEqual({ id: '', name: '', age: '' });

    expect(
      toggleColumnCustomSortable(snapshot.sortable, 'name')
    ).toEqual({ id: true, name: true, age: true });

    expect(
      toggleColumnCustomFilterable(snapshot.filterable, 'name')
    ).toEqual({ id: true, name: true, age: true });

    expect(
      applyColumnCustomDragMove(columns, snapshot.order, 'id', 'age', 'bottom')
    ).toEqual(['name', 'age', 'id']);

    const controls = buildColumnCustomControls(columns, snapshot);
    expect(controls).toHaveLength(3);
    expect(controls[0]).toMatchObject({
      checked: true,
      filterable: true,
      fixed: 'left',
      key: 'id',
      sortable: true,
      title: 'id',
    });
  });

  it('should build runtime items from custom snapshot', () => {
    const columns = [
      { field: 'id', sortable: true },
      { field: 'name', hidden: true, filters: [{ data: 'Admin', value: 'admin' }] },
      { field: 'age' },
    ];
    const runtimeItems = buildColumnRuntimeItems(
      columns,
      {
        filterable: { age: false, name: false, id: true },
        fixed: { name: 'left' },
        order: ['age', 'name', 'id'],
        sortable: { age: true, name: false, id: true },
        visible: { age: true, name: false, id: true },
      },
      {
        includeVisibilityFlags: true,
      }
    );

    expect(runtimeItems.map((item) => item.key)).toEqual(['age', 'name', 'id']);
    expect(runtimeItems[1]).toMatchObject({
      filterable: false,
      fixed: 'left',
      key: 'name',
      sortable: false,
      visible: false,
    });
    expect(runtimeItems[1]?.column).toMatchObject({
      filterable: false,
      field: 'name',
      fixed: 'left',
      hidden: true,
      sortable: false,
      visible: false,
    });
    expect(runtimeItems[1]?.column.filters).toBeUndefined();

    const withoutVisibilityFlags = buildColumnRuntimeItems(
      columns,
      {
        filterable: { id: true, name: true, age: false },
        order: ['id', 'name', 'age'],
        sortable: { id: true, name: false, age: true },
        visible: { id: true, name: false, age: true },
      },
      {
        includeVisibilityFlags: false,
      }
    );
    expect(withoutVisibilityFlags[1]?.column.hidden).toBeUndefined();
    expect(withoutVisibilityFlags[1]?.column.visible).toBeUndefined();
    expect(withoutVisibilityFlags[1]?.column.filters).toEqual([
      { data: 'Admin', value: 'admin' },
    ]);
  });

  it('should resolve drag position and auto scroll top', () => {
    expect(
      resolveColumnCustomDragPosition({
        offsetY: 3,
        rowHeight: 40,
      })
    ).toBe('top');
    expect(
      resolveColumnCustomDragPosition({
        offsetY: 38,
        rowHeight: 40,
      })
    ).toBe('bottom');
    expect(
      resolveColumnCustomDragPosition({
        offsetY: 20,
        previousPosition: 'top',
        rowHeight: 40,
      })
    ).toBe('top');

    expect(
      resolveColumnCustomAutoScrollTop({
        clientY: 90,
        containerBottom: 300,
        containerHeight: 200,
        containerTop: 100,
        scrollTop: 120,
      })
    ).toBeLessThan(120);
    expect(
      resolveColumnCustomAutoScrollTop({
        clientY: 295,
        containerBottom: 300,
        containerHeight: 200,
        containerTop: 100,
        scrollTop: 120,
      })
    ).toBeGreaterThan(120);
    expect(
      resolveColumnCustomAutoScrollTop({
        clientY: 200,
        containerBottom: 300,
        containerHeight: 200,
        containerTop: 100,
        scrollTop: 120,
      })
    ).toBe(120);
  });

  it('should resolve drag helper states', () => {
    const resetState = createColumnCustomDragResetState();
    expect(resetState.draggingKey).toBeNull();
    expect(resetState.dragState).toEqual({
      dragKey: null,
      overKey: null,
      position: null,
    });
    expect(resetState.dragHover).toEqual({
      overKey: null,
      position: null,
    });

    const startState = resolveColumnCustomDragStartState('name');
    expect(startState.draggingKey).toBe('name');
    expect(startState.dragState).toEqual({
      dragKey: 'name',
      overKey: null,
      position: null,
    });
    expect(
      resolveColumnCustomDraggingKey(startState.draggingKey, startState.dragState)
    ).toBe('name');
    expect(resolveColumnCustomDraggingKey(null, startState.dragState)).toBe('name');

    const firstOverState = resolveColumnCustomDragOverState({
      dragKey: 'name',
      offsetY: 4,
      overKey: 'age',
      previousHover: startState.dragHover,
      rowHeight: 40,
    });
    expect(firstOverState).toMatchObject({
      dragHover: {
        overKey: 'age',
      },
      dragState: {
        dragKey: 'name',
        overKey: 'age',
      },
      shouldQueueMove: true,
    });

    const stableOverState = resolveColumnCustomDragOverState({
      dragKey: 'name',
      offsetY: 5,
      overKey: 'age',
      previousHover: firstOverState?.dragHover,
      rowHeight: 40,
    });
    expect(stableOverState?.shouldQueueMove).toBe(false);

    expect(
      resolveColumnCustomDragOverState({
        dragKey: 'name',
        offsetY: 20,
        overKey: 'name',
        rowHeight: 40,
      })
    ).toBeNull();
  });

  it('should collect flip offsets for moved rows', () => {
    const prevRects = new Map<string, { top: number }>([
      ['a', { top: 10 }],
      ['b', { top: 50 }],
      ['c', { top: 90 }],
    ]);
    const nextRects = new Map<string, { top: number }>([
      ['a', { top: 10 }],
      ['b', { top: 90 }],
      ['c', { top: 50 }],
    ]);

    expect(
      collectColumnCustomFlipOffsets({
        controls: ['a', 'b', 'c'],
        nextRects,
        prevRects,
      })
    ).toEqual([
      { deltaY: -40, key: 'b' },
      { deltaY: 40, key: 'c' },
    ]);

    expect(
      collectColumnCustomFlipOffsets({
        controls: ['a', 'b', 'c'],
        draggingKey: 'b',
        nextRects,
        prevRects,
      })
    ).toEqual([{ deltaY: 40, key: 'c' }]);

    expect(
      collectColumnCustomFlipOffsets({
        controls: ['a', 'b', 'c'],
        nextRects,
        prevRects,
        threshold: 100,
      })
    ).toEqual([]);
  });

  it('should collect/apply/reset flip transforms by helpers', () => {
    const nodeA = {
      getBoundingClientRect: vi.fn(() => ({ top: 12 })),
      style: {
        transform: '',
        transition: '',
      },
    };
    const nodeB = {
      getBoundingClientRect: vi.fn(() => ({ top: 42 })),
      style: {
        transform: '',
        transition: '',
      },
    };
    const nodes: Record<string, typeof nodeA> = {
      a: nodeA,
      b: nodeB,
    };

    const rects = collectColumnCustomFlipRects({
      controls: ['a', 'b'],
      resolveNode: (key) => nodes[key],
    });
    expect(rects.get('a')?.top).toBe(12);
    expect(rects.get('b')?.top).toBe(42);

    const moved = applyColumnCustomFlipOffsets({
      offsets: [
        { deltaY: 10, key: 'a' },
        { deltaY: -20, key: 'b' },
      ],
      resolveNode: (key) => nodes[key],
    });
    expect(moved).toHaveLength(2);
    expect(nodeA.style.transition).toBe('none');
    expect(nodeA.style.transform).toBe('translateY(10px)');
    expect(nodeB.style.transition).toBe('none');
    expect(nodeB.style.transform).toBe('translateY(-20px)');

    forceColumnCustomFlipReflow(moved);
    expect(nodeA.getBoundingClientRect).toHaveBeenCalledTimes(2);
    expect(nodeB.getBoundingClientRect).toHaveBeenCalledTimes(2);

    resetColumnCustomFlipTransforms(moved);
    expect(nodeA.style.transition).toBe('');
    expect(nodeA.style.transform).toBe('');
    expect(nodeB.style.transition).toBe('');
    expect(nodeB.style.transform).toBe('');
  });

  it('should build locale text with fallback values', () => {
    const localeText = createTableLocaleText({
      custom: 'Columns',
      customFilter: '',
      seq: '',
      search: '',
    });

    expect(localeText.custom).toBe('Columns');
    expect(localeText.customFilter).toBe('筛选');
    expect(localeText.emptyValue).toBe('空值');
    expect(localeText.seq).toBe('序号');
    expect(localeText.search).toBe('搜索');
    expect(getSearchPanelToggleTitle(false, localeText)).toBe('显示搜索面板');
    expect(getSearchPanelToggleTitle(true, localeText)).toBe('隐藏搜索面板');
  });

  it('should build builtin tools by toolbar config', () => {
    const localeText = createTableLocaleText();
    expect(
      buildBuiltinToolbarTools(
        { custom: true, refresh: true, zoom: true },
        localeText,
        {
          maximized: true,
        }
      )
    ).toEqual([
      { code: 'refresh', title: localeText.refresh },
      { code: 'zoom', title: localeText.zoomOut },
      { code: 'custom', title: localeText.custom },
    ]);

    expect(
      buildBuiltinToolbarTools(
        { custom: true, refresh: true, zoom: true },
        localeText,
        {
          hasToolbarToolsSlot: true,
        }
      )
    ).toEqual([]);

    expect(
      buildBuiltinToolbarTools(
        { custom: false, refresh: true, zoom: true },
        localeText
      )
    ).toEqual([
      { code: 'refresh', title: localeText.refresh },
      { code: 'zoom', title: localeText.zoomIn },
    ]);
  });

  it('should resolve toolbar tool positions', () => {
    expect(resolveToolbarInlinePosition('left')).toBe('before');
    expect(resolveToolbarInlinePosition('right')).toBe('after');
    expect(resolveToolbarInlinePosition('before')).toBe('before');
    expect(resolveToolbarInlinePosition('after')).toBe('after');
    expect(resolveToolbarInlinePosition(undefined)).toBe('after');

    expect(resolveToolbarToolsSlotPosition('before')).toBe('before');
    expect(resolveToolbarToolsSlotPosition('after')).toBe('after');
    expect(resolveToolbarToolsSlotPosition('left')).toBe('before');
    expect(resolveToolbarToolsSlotPosition('right')).toBe('after');
    expect(resolveToolbarToolsSlotPosition('replace')).toBe('replace');
    expect(resolveToolbarToolsSlotPosition(undefined)).toBe('after');
  });

  it('should resolve toolbar hint config', () => {
    expect(resolveToolbarHintConfig('  提示内容  ')).toEqual({
      align: 'center',
      overflow: 'wrap',
      speed: 14,
      text: '提示内容',
    });

    expect(
      resolveToolbarHintConfig({
        align: 'right',
        color: '#f43f5e',
        content: '滚动提示',
        fontSize: 15,
        overflow: 'scroll',
        speed: 9,
      })
    ).toEqual({
      align: 'right',
      color: '#f43f5e',
      fontSize: '15px',
      overflow: 'scroll',
      speed: 9,
      text: '滚动提示',
    });

    expect(
      resolveToolbarHintConfig({
        text: '无效配置',
        speed: -3,
      })
    ).toMatchObject({
      speed: 14,
    });
    expect(resolveToolbarHintConfig({ text: '' })).toBeUndefined();
    expect(resolveToolbarHintConfig(undefined)).toBeUndefined();
  });

  it('should resolve toolbar custom config and external custom state', () => {
    expect(resolveToolbarCustomConfig({ custom: true })).toEqual({
      enabled: true,
    });
    expect(resolveToolbarCustomConfig({ custom: false })).toEqual({
      enabled: false,
    });
    expect(isToolbarCustomEnabled({ custom: true })).toBe(true);
    expect(isToolbarCustomEnabled({ custom: false })).toBe(false);
    expect(isToolbarCustomEnabled()).toBe(false);

    expect(
      resolveColumnCustomState({
        columnCustomState: {
          visible: {
            name: false,
          },
        },
      })
    ).toEqual({
      visible: {
        name: false,
      },
    });
  });

  it('should resolve and use column custom persistence config', () => {
    const localStorage = createMockStorage();
    const sessionStorage = createMockStorage();
    vi.stubGlobal('window', {
      localStorage,
      location: {
        pathname: '/demo/table/basic',
      },
      sessionStorage,
    });

    const columns = [{ field: 'id' }, { field: 'name' }];
    const defaultConfig = resolveColumnCustomPersistenceConfig(
      {
        columnCustomPersistence: true,
      },
      columns
    );
    expect(defaultConfig?.enabled).toBe(true);
    expect(defaultConfig?.storage).toBe('local');
    expect(typeof defaultConfig?.key).toBe('string');
    expect((defaultConfig?.key ?? '').startsWith('admin-table:column-custom:')).toBe(true);

    const explicitConfig = resolveColumnCustomPersistenceConfig(
      {
        columnCustomPersistence: {
          key: 'custom-key',
          storage: 'session',
        },
      },
      columns
    );
    expect(explicitConfig).toEqual({
      enabled: true,
      key: 'custom-key',
      storage: 'session',
    });

    expect(
      writeColumnCustomStateToStorage(defaultConfig, {
        visible: {
          id: true,
          name: false,
        },
      })
    ).toBe(true);
    expect(
      readColumnCustomStateFromStorage(defaultConfig)
    ).toEqual({
      visible: {
        id: true,
        name: false,
      },
    });

    expect(
      writeColumnCustomStateToStorage(explicitConfig, {
        order: ['name', 'id'],
      })
    ).toBe(true);
    expect(
      readColumnCustomStateFromStorage(explicitConfig)
    ).toEqual({
      order: ['name', 'id'],
    });

    expect(
      resolveColumnCustomPersistenceConfig({
        columnCustomPersistence: false,
      })
    ).toBeUndefined();
  });

  it('should create column custom change payload', () => {
    const columns = [{ field: 'id' }, { field: 'name', hidden: true }];
    const payload = createColumnCustomChangePayload(columns, 'confirm', {
      visible: {
        id: true,
        name: false,
      },
    });

    expect(payload.action).toBe('confirm');
    expect(payload.snapshot.visible).toEqual({
      id: true,
      name: false,
    });
    expect(payload.columns).toHaveLength(2);
    expect(payload.sourceColumns).toHaveLength(2);
  });

  it('should resolve separator visibility and style', () => {
    expect(
      shouldShowSeparator({
        hasFormOptions: true,
        separator: true,
        showSearchForm: true,
      })
    ).toBe(true);
    expect(
      shouldShowSeparator({
        hasFormOptions: true,
        separator: {
          show: false,
        },
        showSearchForm: true,
      })
    ).toBe(false);
    expect(
      getSeparatorStyle({
        backgroundColor: '#eee',
      })
    ).toEqual({ backgroundColor: '#eee' });
  });

  it('should detect proxy enabled state', () => {
    expect(
      isProxyEnabled({
        ajax: {
          query: () => undefined,
        },
        enabled: true,
      })
    ).toBe(true);

    expect(
      isProxyEnabled({
        ajax: {},
        enabled: false,
      })
    ).toBe(false);
  });

  it('should trigger toolbar action tool callbacks', () => {
    const logs: string[] = [];
    const tool = {
      code: 'export',
      onClick(payload: { code?: string; index: number }) {
        logs.push(`tool:${payload.code}:${payload.index}`);
      },
    };

    triggerToolbarActionTool(tool, 2, {
      onToolbarToolClick(payload) {
        logs.push(`event:${payload.code}`);
      },
    });

    expect(logs).toEqual(['event:export', 'tool:export:2']);
  });

  it('should resolve toolbar action tools with rules and permissions', () => {
    const resolved = resolveToolbarActionTools(
      [
        {
          code: 'export',
          disabled: ({ maximized }) => !!maximized,
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
          title: '导出',
        },
        {
          code: 'print',
          show: false,
          title: '打印',
        },
        {
          code: 'hidden',
          permission: false,
          title: '隐藏',
        },
        {
          code: 'sync',
          label: '同步',
        },
      ],
      {
        maximized: true,
        showSearchForm: true,
      }
    );

    expect(resolved).toHaveLength(2);
    expect(resolved[0]).toMatchObject({
      code: 'export',
      disabled: true,
      index: 0,
      title: '导出',
      permission: {
        arg: 'code',
        name: 'access',
        value: ['TABLE_EXPORT'],
      },
    });
    expect(resolved[1]).toMatchObject({
      code: 'sync',
      disabled: false,
      index: 3,
      title: '同步',
    });
    expect(resolved.find((item) => item.code === 'hidden')).toBeUndefined();
  });

  it('should normalize toolbar permission shorthand with and/or modes', () => {
    const resolved = resolveToolbarActionTools([
      {
        code: 'array-or',
        permission: ['TABLE_A', 'TABLE_B'],
      },
      {
        code: 'object-or',
        permission: {
          or: ['TABLE_A', 'TABLE_B'],
        },
      },
      {
        code: 'object-and',
        permission: {
          and: ['TABLE_A', 'TABLE_B'],
        },
      },
    ]);

    expect(resolved[0]?.permission).toMatchObject({
      arg: 'code',
      mode: 'or',
      modifiers: {
        or: true,
      },
      value: ['TABLE_A', 'TABLE_B'],
    });
    expect(resolved[1]?.permission).toMatchObject({
      arg: 'code',
      mode: 'or',
      modifiers: {
        or: true,
      },
      value: ['TABLE_A', 'TABLE_B'],
    });
    expect(resolved[2]?.permission).toMatchObject({
      arg: 'code',
      mode: 'and',
      modifiers: {
        and: true,
      },
      value: ['TABLE_A', 'TABLE_B'],
    });
  });

  it('should evaluate toolbar permission and render rule', () => {
    expect(
      evaluateToolbarToolPermission(
        {
          arg: 'code',
          mode: 'or',
          value: ['TABLE_A'],
        },
        {
          accessCodes: ['TABLE_A', 'TABLE_B'],
        }
      )
    ).toBe(true);

    expect(
      evaluateToolbarToolPermission(
        {
          arg: 'role',
          mode: 'and',
          value: ['admin', 'manager'],
        },
        {
          accessRoles: ['admin', 'manager', 'viewer'],
        }
      )
    ).toBe(true);

    expect(
      shouldRenderToolbarTool(
        {
          code: 'export',
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
        },
        {
          accessCodes: ['TABLE_READ'],
        }
      )
    ).toBe(false);

    expect(
      shouldRenderToolbarTool(
        {
          code: 'export',
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
        },
        {
          defaultWhenNoAccess: true,
        }
      )
    ).toBe(true);
  });

  it('should resolve toolbar tool visibility with unified strategy', () => {
    const tool = {
      code: 'export',
      permission: {
        arg: 'code',
        value: ['TABLE_EXPORT'],
      },
    };

    expect(
      resolveToolbarToolVisibility(tool, {
        accessCodes: ['TABLE_EXPORT'],
      })
    ).toBe(true);
    expect(
      resolveToolbarToolVisibility(tool, {
        useDirectiveWhenNoAccess: true,
        directiveRenderer: () => true,
      })
    ).toBe(true);
    expect(
      resolveToolbarToolVisibility(tool, {
        useDirectiveWhenNoAccess: true,
        directiveRenderer: () => false,
      })
    ).toBe(false);
    expect(resolveToolbarToolVisibility(tool)).toBe(false);
  });

  it('should resolve visible toolbar tools with shared pipeline', () => {
    const tools = resolveVisibleToolbarActionTools({
      accessCodes: ['TABLE_EXPORT'],
      excludeCodes: ['search'],
      showSearchForm: true,
      tools: [
        {
          code: 'search',
          title: 'Search',
        },
        {
          code: 'export',
          permission: {
            arg: 'code',
            value: ['TABLE_EXPORT'],
          },
          title: 'Export',
        },
        {
          code: 'hidden',
          show: false,
          title: 'Hidden',
        },
      ],
    });

    expect(tools).toHaveLength(1);
    expect(tools[0]?.code).toBe('export');
    expect(tools[0]?.title).toBe('Export');
  });

  it('should apply selection check field recursively for tree rows', () => {
    const sourceRows = [
      {
        id: 1,
        checked: false,
        children: [
          {
            id: 11,
            checked: false,
          },
        ],
      },
      {
        id: '2',
        checked: true,
      },
    ];

    const nextRows = applySelectionCheckFieldToRows(sourceRows, {
      checkField: 'checked',
      keyField: 'id',
      selectedKeys: ['1', 11, '2'],
    });

    expect(nextRows.changed).toBe(true);
    expect(nextRows.rows[0]).not.toBe(sourceRows[0]);
    expect(nextRows.rows[0]?.checked).toBe(true);
    expect(nextRows.rows[0]?.children?.[0]?.checked).toBe(true);
    expect(nextRows.rows[1]).toBe(sourceRows[1]);
    expect(nextRows.rows[1]?.checked).toBe(true);
  });

  it('should resolve toolbar action type class', () => {
    expect(resolveToolbarActionTypeClass('clear')).toBe('is-clear');
    expect(resolveToolbarActionTypeClass('text')).toBe('is-clear');
    expect(resolveToolbarActionTypeClass('text-clear')).toBe('is-clear');
    expect(resolveToolbarActionTypeClass('primary')).toBe('is-primary');
    expect(resolveToolbarActionTypeClass(' warning ')).toBe('is-warning');
    expect(resolveToolbarActionTypeClass('error')).toBe('is-error');
    expect(resolveToolbarActionTypeClass('primary-outline')).toBe('is-primary-outline');
    expect(resolveToolbarActionTypeClass('primary-text')).toBe('is-primary-text');
    expect(resolveToolbarActionTypeClass('text-danger')).toBe('is-danger-text');
    expect(resolveToolbarActionTypeClass('warning-border')).toBe('is-warning-outline');
    expect(resolveToolbarActionTypeClass('outline-danger')).toBe('is-danger-outline');
    expect(resolveToolbarActionTypeClass('border-info')).toBe('is-info-outline');
    expect(resolveToolbarActionTypeClass('default')).toBe('');
    expect(resolveToolbarActionTypeClass('unknown')).toBe('');
  });

  it('should resolve toolbar action button class state', () => {
    const classState = resolveToolbarActionButtonClassState({
      attrs: {
        class: 'from-attrs',
        className: {
          'attrs-enabled': true,
          'attrs-disabled': false,
        },
      },
      class: ['from-tool', { 'tool-enabled': true }],
      icon: 'icon-test',
      text: 'Click',
      type: 'danger-outline',
    });

    expect(classState.presentation).toMatchObject({
      hasIcon: true,
      iconOnly: false,
      text: 'Click',
    });
    expect(classState.classList).toEqual(
      expect.arrayContaining([
        'admin-table__toolbar-action-btn',
        'admin-table__toolbar-slot-btn',
        'is-danger-outline',
        'is-static-color',
        'has-icon',
        'from-attrs',
        'attrs-enabled',
        'from-tool',
        'tool-enabled',
      ])
    );

    const iconOnlyState = resolveToolbarActionButtonClassState({
      icon: 'icon-only',
      text: '',
    });
    expect(iconOnlyState.classList).toEqual(['admin-table__toolbar-tool-btn']);
  });

  it('should resolve toolbar action button render state', () => {
    const renderState = resolveToolbarActionButtonRenderState({
      attrs: {
        class: 'custom-class',
        className: 'custom-name',
        disabled: false,
        'data-test': 'ok',
      },
      code: 'auto',
      disabled: true,
      icon: 'icon-auto',
      index: 2,
      text: 'Auto',
      title: 'Auto Build',
      type: 'primary',
    });

    expect(renderState.key).toBe('auto-2');
    expect(renderState.disabled).toBe(true);
    expect(renderState.title).toBe('Auto Build');
    expect(renderState.attrs).toEqual({
      'data-test': 'ok',
      disabled: false,
    });
    expect(renderState.classList).toEqual(
      expect.arrayContaining([
        'admin-table__toolbar-action-btn',
        'admin-table__toolbar-slot-btn',
        'is-primary',
        'has-icon',
      ])
    );
  });

  it('should resolve toolbar action theme class', () => {
    expect(
      resolveToolbarActionThemeClass({
        type: 'success',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'clear',
      })
    ).toBe('');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'primary-text',
      })
    ).toBe('');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'success',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'success-text',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'success-outline',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: false,
        type: 'primary',
      })
    ).toBe('');
    expect(
      resolveToolbarActionThemeClass({
        themeColor: false,
        type: 'warning',
      })
    ).toBe('is-static-color');
    expect(
      resolveToolbarActionThemeClass({
        followTheme: true,
        type: 'danger',
      })
    ).toBe('');
  });

  it('should get and set record value by nested path', () => {
    const row: Record<string, any> = {
      id: 1,
      profile: {
        name: 'admin',
      },
    };

    expect(getColumnValueByPath(row, 'profile.name')).toBe('admin');
    expect(setColumnValueByPath(row, 'profile.name', 'coder')).toBe(true);
    expect(getColumnValueByPath(row, 'profile.name')).toBe('coder');
    expect(setColumnValueByPath(row, 'meta.level', 2)).toBe(true);
    expect(getColumnValueByPath(row, 'meta.level')).toBe(2);
    expect(setColumnValueByPath(undefined, 'meta.level', 2)).toBe(false);
  });

  it('should resolve table cell strategy from grid and column config', () => {
    const column = {
      dataIndex: 'age',
      field: 'age',
      strategy: {
        className: 'column-age',
        color: '#1677ff',
      },
    };
    const gridOptions = {
      strategy: {
        columns: {
          age: {
            className: 'global-age',
            unit: '岁',
          },
        },
      },
    };
    const resolved = resolveTableCellStrategy(column, 'age', gridOptions);
    expect(resolved?.className).toBe('global-age column-age');
    expect(resolved?.unit).toBe('岁');
    expect(resolved?.color).toBe('#1677ff');
  });

  it('should resolve table cell strategy result by formula and rules', () => {
    const row = {
      age: 36,
      score: 80,
    };
    const result = resolveTableCellStrategyResult({
      column: {
        field: 'age',
      },
      field: 'age',
      gridOptions: {
        strategy: {
          columns: {
            age: {
              formula: '=age + score / 10',
              unit: '岁',
              unitSeparator: '',
              rules: [
                {
                  color: '#dc2626',
                  fontSize: 16,
                  when: {
                    gte: 40,
                  },
                },
                {
                  onClick: () => {},
                  when: {
                    gt: 40,
                  },
                },
              ],
            },
          },
        },
      },
      row,
      rowIndex: 0,
      value: row.age,
    });

    expect(result?.value).toBe(44);
    expect(result?.displayValue).toBe('44岁');
    expect(result?.hasDisplayOverride).toBe(true);
    expect(result?.className.includes('admin-table__strategy-clickable')).toBe(true);
    expect(result?.style).toMatchObject({
      color: '#dc2626',
      fontSize: '16px',
    });
  });

  it('should support regex conditions in strategy rules', () => {
    const row = {
      code: 'VIP-2026',
      name: 'Alice',
      role: 'Admin',
    };
    const result = resolveTableCellStrategyResult({
      column: {
        field: 'code',
      },
      field: 'code',
      gridOptions: {
        strategy: {
          columns: {
            code: {
              rules: [
                {
                  text: '命中-regexp',
                  when: {
                    regex: /^VIP-\d+$/,
                  },
                },
                {
                  color: '#16a34a',
                  when: {
                    field: 'name',
                    op: 'regex',
                    target: '/^ali/i',
                  },
                },
                {
                  fontWeight: 700,
                  when: {
                    field: 'role',
                    notRegex: {
                      flags: 'i',
                      pattern: '^guest$',
                    },
                  },
                },
              ],
            },
          },
        },
      },
      row,
      rowIndex: 0,
      value: row.code,
    });

    expect(result?.displayValue).toBe('命中-regexp');
    expect(result?.style).toMatchObject({
      color: '#16a34a',
      fontWeight: 700,
    });
  });

  it('should resolve row strategy list and computed row style', () => {
    const gridOptions = {
      rowStrategy: [
        {
          className: 'legacy-row',
          when: {
            field: 'age',
            gte: 30,
          },
        },
      ],
      strategy: {
        rows: [
          {
            backgroundColor: '#eff6ff',
            when: {
              field: 'age',
              gte: 30,
            },
          },
        ],
      },
    };
    const row = {
      age: 33,
    };
    const strategyList = resolveTableRowStrategies(gridOptions);
    expect(strategyList).toHaveLength(2);

    const rowResult = resolveTableRowStrategyResult({
      gridOptions,
      row,
      rowIndex: 2,
    });
    expect(rowResult?.className).toContain('legacy-row');
    expect(rowResult?.style).toMatchObject({
      backgroundColor: '#eff6ff',
    });
  });

  it('should trigger row/cell strategy click with shared executor', () => {
    const cellClick = vi.fn();
    const rowClick = vi.fn();
    const event = {
      defaultPrevented: false,
      stopPropagation: vi.fn(),
    };
    const row = {
      age: 33,
      score: 97,
    };

    const cellResult = resolveTableCellStrategyResult({
      column: {
        field: 'score',
      },
      field: 'score',
      gridOptions: {
        strategy: {
          columns: {
            score: {
              onClick: cellClick,
              stopPropagation: true,
            },
          },
        },
      },
      row,
      rowIndex: 1,
      value: row.score,
    });
    const cellTrigger = triggerTableCellStrategyClick({
      column: {
        field: 'score',
      },
      event,
      field: 'score',
      row,
      rowIndex: 1,
      strategyResult: cellResult,
    });
    expect(cellTrigger).toEqual({
      blocked: true,
      handled: true,
    });
    expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    expect(cellClick).toHaveBeenCalledTimes(1);
    expect(cellClick.mock.calls[0]?.[0]).toMatchObject({
      field: 'score',
      row,
      rowIndex: 1,
      value: 97,
    });

    const rowResult = resolveTableRowStrategyResult({
      gridOptions: {
        rowStrategy: [
          {
            onClick: rowClick,
            stopPropagation: false,
            when: true,
          },
        ],
      },
      row,
      rowIndex: 2,
    });
    const rowEvent = {
      defaultPrevented: false,
      stopPropagation: vi.fn(),
    };
    const rowTrigger = triggerTableRowStrategyClick({
      event: rowEvent,
      row,
      rowIndex: 2,
      strategyResult: rowResult,
    });
    expect(rowTrigger).toEqual({
      blocked: false,
      handled: true,
    });
    expect(rowEvent.stopPropagation).not.toHaveBeenCalled();
    expect(rowClick).toHaveBeenCalledTimes(1);
    expect(rowClick.mock.calls[0]?.[0]).toMatchObject({
      row,
      rowIndex: 2,
    });

    const cellBypassResult = resolveTableCellStrategyResult({
      column: {
        field: 'score',
      },
      field: 'score',
      gridOptions: {
        strategy: {
          columns: {
            score: {
              onClick: cellClick,
              stopPropagation: false,
            },
          },
        },
      },
      row,
      rowIndex: 1,
      value: row.score,
    });
    const cellBypassEvent = {
      defaultPrevented: true,
      stopPropagation: vi.fn(),
    };
    const cellBypassTrigger = triggerTableCellStrategyClick({
      column: {
        field: 'score',
      },
      event: cellBypassEvent,
      field: 'score',
      respectDefaultPrevented: false,
      row,
      rowIndex: 1,
      strategyResult: cellBypassResult,
    });
    expect(cellBypassTrigger).toEqual({
      blocked: false,
      handled: true,
    });
    expect(cellBypassEvent.stopPropagation).not.toHaveBeenCalled();

    const rowBypassEvent = {
      defaultPrevented: true,
      stopPropagation: vi.fn(),
    };
    const rowBypassTrigger = triggerTableRowStrategyClick({
      event: rowBypassEvent,
      respectDefaultPrevented: false,
      row,
      rowIndex: 2,
      strategyResult: rowResult,
    });
    expect(rowBypassTrigger).toEqual({
      blocked: false,
      handled: true,
    });
    expect(rowBypassEvent.stopPropagation).not.toHaveBeenCalled();
  });

  it('should normalize row strategy inline style and class marker', () => {
    expect(hasTableRowStrategyStyle(undefined)).toBe(false);
    expect(hasTableRowStrategyStyle({})).toBe(false);
    expect(hasTableRowStrategyStyle({ color: '#0ea5e9' })).toBe(true);

    expect(
      resolveTableRowStrategyInlineStyle({
        backgroundColor: '#dcfce7',
        color: '#166534',
        fontWeight: 700,
      })
    ).toEqual({
      '--admin-table-row-strategy-bg': '#dcfce7',
      '--admin-table-row-strategy-color': '#166534',
      '--admin-table-row-strategy-font-weight': '700',
      '--admin-table-row-strategy-hover-bg': '#dcfce7',
      backgroundColor: '#dcfce7',
      color: '#166534',
      fontWeight: 700,
    });
    expect(resolveTableRowStrategyInlineStyle(undefined)).toBeUndefined();
  });

  it('should normalize locale and create shared date formatter', () => {
    expect(normalizeTableLocale('en-US')).toBe('en-US');
    expect(normalizeTableLocale('zh-CN')).toBe('zh-CN');
    expect(normalizeTableLocale('en-GB')).toBe('zh-CN');
    expect(normalizeTableLocale('en-GB', 'en-US')).toBe('en-US');

    const formatter = createTableDateFormatter('en-US');
    expect(formatter.formatDate('2024-01-02')).toContain('2024');
    expect(formatter.formatDateTime('2024-01-02T03:04:05Z')).toContain('2024');
    expect(formatter.formatDate('invalid')).toBe('invalid');
    expect(formatter.formatDateTime('')).toBe('');
  });

  it('should resolve toolbar action presentation by icon and text config', () => {
    expect(
      resolveToolbarActionPresentation({
        icon: 'vxe-table-icon-refresh',
        text: '',
        title: 'refresh',
      })
    ).toEqual({
      hasIcon: true,
      iconClass: 'vxe-table-icon-refresh',
      iconOnly: true,
      text: '',
    });

    expect(
      resolveToolbarActionPresentation({
        icon: 'vxe-table-icon-refresh',
        text: '刷新',
        title: '刷新',
      })
    ).toEqual({
      hasIcon: true,
      iconClass: 'vxe-table-icon-refresh',
      iconOnly: false,
      text: '刷新',
    });

    expect(
      resolveToolbarActionPresentation({
        title: '导出',
      })
    ).toEqual({
      hasIcon: false,
      iconClass: undefined,
      iconOnly: false,
      text: '导出',
    });
  });

  it('should trigger operation tool click with row payload', () => {
    const onOperationToolClick = vi.fn();
    const onClick = vi.fn();
    const tool = {
      code: 'edit',
      onClick,
    };
    const row = {
      id: 1,
      name: 'demo',
    };

    triggerOperationActionTool(tool, 2, {
      onOperationToolClick,
      row,
      rowIndex: 4,
    });

    expect(onOperationToolClick).toHaveBeenCalledWith({
      code: 'edit',
      row,
      rowIndex: 4,
      tool,
    });
    expect(onClick).toHaveBeenCalledWith({
      code: 'edit',
      index: 2,
      row,
      rowIndex: 4,
      tool,
    });
  });
});
