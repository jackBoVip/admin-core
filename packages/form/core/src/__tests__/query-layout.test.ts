import { describe, expect, it } from 'vitest';
import { setLocale } from '../locales';
import {
  resolveQueryActionItems,
  resolveQueryActionsGridPlacement,
  resolveQueryInitialCollapsed,
  resolveSearchFormDefaults,
  resolveQueryVisibleFields,
} from '../utils/query-layout';

const messages = {
  collapse: '收起',
  expand: '展开',
  reset: '重置',
  submit: '提交',
};

describe('query layout utils', () => {
  it('should resolve default collapsed state for query mode', () => {
    expect(
      resolveQueryInitialCollapsed({
        queryMode: true,
      })
    ).toBe(true);
    expect(
      resolveQueryInitialCollapsed({
        collapsed: false,
        hasExplicitCollapsed: true,
        queryMode: true,
      })
    ).toBe(false);
    expect(
      resolveQueryInitialCollapsed({
        queryMode: false,
      })
    ).toBeUndefined();
  });

  it('should truncate fields by collapsedRows * gridColumns', () => {
    const fields = Array.from({ length: 7 }, (_, index) => ({ index }));
    const collapsed = resolveQueryVisibleFields({
      collapsed: true,
      collapsedRows: 2,
      fields,
      gridColumns: 3,
      queryMode: true,
    });
    expect(collapsed.fields).toHaveLength(6);
    expect(collapsed.hasOverflow).toBe(true);

    const expanded = resolveQueryVisibleFields({
      collapsed: false,
      collapsedRows: 2,
      fields,
      gridColumns: 3,
      queryMode: true,
    });
    expect(expanded.fields).toHaveLength(7);
    expect(expanded.hasOverflow).toBe(true);
  });

  it('should resolve query actions grid placement', () => {
    expect(
      resolveQueryActionsGridPlacement({
        columns: 3,
        visibleCount: 2,
      })
    ).toEqual({
      gridColumn: '3 / -1',
      newRow: false,
    });

    expect(
      resolveQueryActionsGridPlacement({
        columns: 3,
        visibleCount: 3,
      })
    ).toEqual({
      gridColumn: '1 / -1',
      newRow: true,
    });

    expect(
      resolveQueryActionsGridPlacement({
        columns: 3,
        visibleCount: 0,
      })
    ).toEqual({
      gridColumn: '1 / -1',
      newRow: true,
    });
  });

  it('should only keep collapse action when overflow exists', () => {
    const noOverflow = resolveQueryActionItems({
      collapsed: true,
      hasOverflow: false,
      messages,
      showCollapseButton: true,
    });
    expect(noOverflow.some((item) => item.kind === 'collapse')).toBe(false);

    const hasOverflow = resolveQueryActionItems({
      collapsed: true,
      hasOverflow: true,
      messages,
      showCollapseButton: true,
    });
    expect(hasOverflow.some((item) => item.kind === 'collapse')).toBe(true);
    expect(hasOverflow[0]?.kind).toBe('collapse');
  });

  it('should resolve search form defaults with user override priority', () => {
    const resolved = resolveSearchFormDefaults({
      gridColumns: 4,
      submitButtonOptions: {
        content: '筛选',
      },
    });
    expect(resolved.queryMode).toBe(true);
    expect(resolved.collapsedRows).toBe(1);
    expect(resolved.showCollapseButton).toBe(true);
    expect(resolved.showDefaultActions).toBe(true);
    expect(resolved.gridColumns).toBe(4);
    expect(resolved.submitButtonOptions.content).toBe('筛选');
  });

  it('should resolve localized query submit text when user content is not provided', () => {
    setLocale('en-US');
    const resolvedEn = resolveSearchFormDefaults({});
    expect(resolvedEn.submitButtonOptions.content).toBe('Search');

    setLocale('zh-CN');
    const resolvedZh = resolveSearchFormDefaults({});
    expect(resolvedZh.submitButtonOptions.content).toBe('查询');
  });
});
