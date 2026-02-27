import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applyColumnCustomDragMove,
  applyColumnCustomFlipOffsets,
  buildColumnCustomControls,
  buildColumnFilterableMap,
  buildColumnRuntimeItems,
  buildColumnSortableMap,
  buildColumnVisibilityMap,
  collectColumnCustomFlipOffsets,
  collectColumnCustomFlipRects,
  createColumnCustomChangePayload,
  buildColumnFixedMap,
  buildColumnOrder,
  readColumnCustomStateFromStorage,
  resolveColumnCustomPersistenceConfig,
  createColumnCustomSnapshot,
  createColumnCustomDragResetState,
  forceColumnCustomFlipReflow,
  hasColumnCustomDraftChanges,
  hasColumnCustomSnapshot,
  moveArrayItem,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomOpenTransition,
  resolveColumnCustomOpenState,
  resolveColumnCustomWorkingSnapshot,
  resolveColumnCustomCancelTransition,
  resolveColumnCustomCancelSnapshot,
  resolveColumnCustomCancelState,
  resolveColumnCustomConfirmTransition,
  resolveColumnCustomConfirmSnapshot,
  resolveColumnCustomConfirmState,
  resolveColumnCustomResetTransition,
  resolveColumnCustomResetSnapshot,
  resolveColumnCustomResetState,
  resolveColumnCustomAutoScrollTop,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragPosition,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  writeColumnCustomStateToStorage,
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

describe('table shared column custom utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('should handle empty columns with normalized empty snapshots/runtime/controls', () => {
    const snapshot = createColumnCustomSnapshot([], {}, true);
    expect(snapshot).toEqual({
      filterable: {},
      fixed: {},
      order: [],
      sortable: {},
      visible: {},
    });
    expect(buildColumnRuntimeItems([], snapshot)).toEqual([]);
    expect(buildColumnCustomControls([], snapshot)).toEqual([]);
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

  it('should resolve panel transitions and draft dirty state', () => {
    const columns = [{ field: 'id' }, { field: 'name' }];
    const current = {
      filterable: { id: true, name: false },
      fixed: { id: 'left', name: '' },
      order: ['id', 'name'],
      sortable: { id: true, name: false },
      visible: { id: true, name: true },
    };

    const openTransition = resolveColumnCustomOpenTransition(columns, current);
    expect(openTransition.action).toBe('open');
    expect(openTransition.panelOpen).toBe(true);
    expect(openTransition.origin).toEqual(current);
    expect(openTransition.draft).toEqual(current);
    expect(
      hasColumnCustomDraftChanges(openTransition.draft, openTransition.origin)
    ).toBe(false);

    const dirtyDraft = {
      ...openTransition.draft,
      visible: {
        ...openTransition.draft.visible,
        name: false,
      },
    };
    expect(
      hasColumnCustomDraftChanges(dirtyDraft, openTransition.origin)
    ).toBe(true);

    const cancelTransition = resolveColumnCustomCancelTransition(columns, {
      current: dirtyDraft,
      origin: openTransition.origin,
    });
    expect(cancelTransition.action).toBe('cancel');
    expect(cancelTransition.panelOpen).toBe(false);
    expect(cancelTransition.draft).toEqual(openTransition.origin);

    const confirmTransition = resolveColumnCustomConfirmTransition(
      columns,
      dirtyDraft
    );
    expect(confirmTransition.action).toBe('confirm');
    expect(confirmTransition.panelOpen).toBe(false);
    expect(confirmTransition.current.visible).toEqual({
      id: true,
      name: false,
    });
    expect(confirmTransition.origin.visible).toEqual({
      id: true,
      name: false,
    });

    const resetTransition = resolveColumnCustomResetTransition(columns);
    expect(resetTransition.action).toBe('reset');
    expect(resetTransition.panelOpen).toBe(false);
    expect(resetTransition.current.order).toEqual(['id', 'name']);
    expect(resetTransition.draft.order).toEqual(['id', 'name']);
    expect(resetTransition.origin.order).toEqual(['id', 'name']);
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

    const tableUsersConfig = resolveColumnCustomPersistenceConfig(
      {
        columnCustomPersistence: true,
        tableId: 'users-table',
      },
      columns
    );
    const tableRolesConfig = resolveColumnCustomPersistenceConfig(
      {
        columnCustomPersistence: true,
        tableId: 'roles-table',
      },
      columns
    );
    expect(tableUsersConfig?.key).not.toBe(tableRolesConfig?.key);

    const scopedUsersConfig = resolveColumnCustomPersistenceConfig(
      {
        columnCustomPersistence: {
          scope: 'shared-admin-list',
        },
        tableId: 'users-table',
      },
      columns
    );
    const scopedRolesConfig = resolveColumnCustomPersistenceConfig(
      {
        columnCustomPersistence: {
          scope: 'shared-admin-list',
        },
        tableId: 'roles-table',
      },
      columns
    );
    expect(scopedUsersConfig?.key).toBe(scopedRolesConfig?.key);
    expect(scopedUsersConfig?.key).not.toBe(tableUsersConfig?.key);

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
});
