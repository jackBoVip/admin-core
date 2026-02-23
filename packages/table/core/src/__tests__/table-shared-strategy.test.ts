import { describe, expect, it, vi } from 'vitest';
import {
  getColumnValueByPath,
  hasTableRowStrategyStyle,
  resolveTableCellStrategy,
  resolveTableCellStrategyResult,
  resolveTableRowStrategies,
  resolveTableRowStrategyInlineStyle,
  resolveTableRowStrategyResult,
  setColumnValueByPath,
  triggerTableCellStrategyClick,
  triggerTableRowStrategyClick,
} from '../utils';

describe('table shared strategy utils', () => {
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
});
