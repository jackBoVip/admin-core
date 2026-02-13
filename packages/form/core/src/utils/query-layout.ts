import { resolveGridColumns } from './stepped-form';
import {
  resolveFormActionPlan,
  resolveFormActionRenderItems,
  type FormActionMessages,
  type FormActionRenderItem,
} from './ui-shared';

function resolveCollapsedRows(rows: number | undefined) {
  const value = Math.trunc(Number(rows ?? 1));
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return value;
}

export function resolveQueryInitialCollapsed(input: {
  collapsed?: boolean;
  hasExplicitCollapsed?: boolean;
  queryMode?: boolean;
}) {
  if (!input.queryMode) {
    return input.collapsed;
  }
  if (input.hasExplicitCollapsed) {
    return input.collapsed;
  }
  return true;
}

export function resolveQueryVisibleFields<T>(input: {
  collapsed?: boolean;
  collapsedRows?: number;
  fields: T[];
  gridColumns?: number;
  queryMode?: boolean;
}) {
  const columns = resolveGridColumns(input.gridColumns, 1);
  const rows = resolveCollapsedRows(input.collapsedRows);
  const maxVisibleCount = rows * columns;
  const allVisibleCount = input.fields.length;
  const hasOverflow = !!input.queryMode && allVisibleCount > maxVisibleCount;
  const isCollapsed = !!input.queryMode && !!input.collapsed;

  if (!hasOverflow || !isCollapsed) {
    return {
      allVisibleCount,
      columns,
      fields: input.fields,
      hasOverflow,
      isCollapsed,
      maxVisibleCount,
      rows,
    };
  }

  return {
    allVisibleCount,
    columns,
    fields: input.fields.slice(0, maxVisibleCount),
    hasOverflow,
    isCollapsed,
    maxVisibleCount,
    rows,
  };
}

export function resolveQueryActionsGridPlacement(input: {
  columns?: number;
  visibleCount: number;
}) {
  const columns = resolveGridColumns(input.columns, 1);
  const safeVisibleCount = Math.max(0, Math.trunc(Number(input.visibleCount) || 0));
  const remainder = safeVisibleCount % columns;
  if (remainder > 0) {
    return {
      gridColumn: `${remainder + 1} / -1`,
      newRow: false,
    };
  }
  return {
    gridColumn: '1 / -1',
    newRow: true,
  };
}

export function resolveQueryActionItems(input: {
  actionButtonsReverse?: boolean;
  collapsed?: boolean;
  hasOverflow: boolean;
  messages: FormActionMessages;
  resetButtonOptions?: Record<string, any>;
  showCollapseButton?: boolean;
  showDefaultActions?: boolean;
  submitButtonOptions?: Record<string, any>;
}): FormActionRenderItem[] {
  const actionPlan = resolveFormActionPlan({
    actionButtonsReverse: input.actionButtonsReverse,
    collapsed: input.collapsed,
    messages: input.messages,
    resetButtonOptions: input.resetButtonOptions,
    showCollapseButton: !!input.showCollapseButton && input.hasOverflow,
    showDefaultActions: input.showDefaultActions,
    submitButtonOptions: input.submitButtonOptions,
  });
  const items = resolveFormActionRenderItems(actionPlan);
  const collapseItems = items.filter((item) => item.kind === 'collapse');
  const buttonItems = items.filter((item) => item.kind === 'button');
  return [...collapseItems, ...buttonItems];
}

export function resolveSearchFormDefaults<
  TProps extends Record<string, any>,
>(
  props: TProps,
  submitContent = '查询'
): TProps {
  const submitButtonOptions = props.submitButtonOptions ?? {};
  return {
    ...props,
    queryMode: props.queryMode ?? true,
    gridColumns: props.gridColumns ?? 3,
    collapsedRows: props.collapsedRows ?? 1,
    showCollapseButton: props.showCollapseButton ?? true,
    showDefaultActions: props.showDefaultActions ?? true,
    submitButtonOptions: {
      content: submitContent,
      ...submitButtonOptions,
    },
  } as TProps;
}
