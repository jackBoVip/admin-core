import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  applySelectionCheckFieldToRows,
  alignSelectionKeysToRows,
  collectSelectionKeysByField,
  collectSelectionKeysByRows,
  createTableComparableSelectionKeySet,
  createTableDateFormatter,
  createTableLocaleText,
  defaultTableDesktopPagerLayouts,
  defaultTableMobilePagerLayouts,
  defaultTablePagerPageSizes,
  ensureSelectionColumn,
  ensureSeqColumn,
  flattenTableRows,
  getSearchPanelToggleTitle,
  getSeparatorStyle,
  isProxyEnabled,
  isSelectionColumnTypeColumn,
  isSeqColumnTypeColumn,
  normalizeTableLocale,
  normalizeTablePagerLayoutKey,
  normalizeTableSelectionKeys,
  resolveColumnKey,
  resolveColumnTitle,
  resolveColumnType,
  resolveOperationCellAlignClass,
  resolveOperationColumnConfig,
  resolveOperationColumnTools,
  resolveRowClickSelectionKeys,
  resolveSelectionColumn,
  resolveSelectionMode,
  resolveSelectionRowsByKeys,
  resolveSeqColumn,
  resolveSeqColumnConfig,
  resolveTablePagerLayouts,
  resolveTablePagerLayoutSet,
  resolveTablePagerPageSizes,
  resolveVisibleOperationActionTools,
  shallowEqualObjectRecord,
  shouldShowSeparator,
  toTableComparableSelectionKey,
  triggerOperationActionTool,
} from '../utils';

describe('table shared utils', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should resolve column key and title', () => {
    expect(resolveColumnKey({ key: 'name' }, 0)).toBe('name');
    expect(resolveColumnTitle({ title: 'Name' }, 0)).toBe('Name');
    expect(resolveColumnTitle({}, 1)).toBe('Column 2');
  });

  it('should resolve pager layouts and page sizes', () => {
    expect(resolveTablePagerLayouts(undefined, false)).toEqual([
      ...defaultTableDesktopPagerLayouts,
    ]);
    expect(resolveTablePagerLayouts(undefined, true)).toEqual([
      ...defaultTableMobilePagerLayouts,
    ]);
    expect(
      resolveTablePagerLayouts([' Total ', ['Prev-Page', 'Next_Page']], false)
    ).toEqual(['Total', 'Prev-Page', 'Next_Page']);
    expect(
      Array.from(
        resolveTablePagerLayoutSet([' Total ', ['Prev-Page', 'Next_Page']], false)
      )
    ).toEqual(['total', 'prevpage', 'nextpage']);
    expect(normalizeTablePagerLayoutKey(' Prev_Page ')).toBe('prevpage');

    expect(resolveTablePagerPageSizes(undefined)).toEqual([
      ...defaultTablePagerPageSizes,
    ]);
    expect(resolveTablePagerPageSizes([20, '50', 20, 0, -1, 30.8])).toEqual([
      20,
      50,
      30,
    ]);
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
