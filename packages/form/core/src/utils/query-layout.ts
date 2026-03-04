/**
 * Form Core 查询布局工具。
 * @description 提供查询表单可见字段、折叠策略与动作区布局解析能力。
 */
import { resolveGridColumns } from './stepped-form';
import {
  resolveFormActionPlan,
  resolveFormActionRenderItems,
  type FormActionMessages,
  type FormActionRenderItem,
} from './ui-shared';
import { getLocaleMessages } from '../locales';

/**
 * 解析折叠行数，确保为正整数。
 * @param rows 原始行数。
 * @returns 合法折叠行数。
 */
function resolveCollapsedRows(rows: number | undefined) {
  const value = Math.trunc(Number(rows ?? 1));
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return value;
}

/**
 * 解析查询模式初始折叠状态。
 * @param input 查询模式与折叠配置。
 * @returns 初始折叠状态。
 */
export function resolveQueryInitialCollapsed(input: {
  /** 当前折叠状态。 */
  collapsed?: boolean;
  /** 是否显式传入了 collapsed 配置。 */
  hasExplicitCollapsed?: boolean;
  /** 是否查询模式。 */
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

/**
 * 计算查询表单当前可见字段集合。
 * @param input 查询布局配置。
 * @returns 可见字段与布局信息。
 */
export function resolveQueryVisibleFields<T>(input: {
  /** 当前是否折叠。 */
  collapsed?: boolean;
  /** 折叠展示行数。 */
  collapsedRows?: number;
  /** 字段列表。 */
  fields: T[];
  /** 栅格列数。 */
  gridColumns?: number;
  /** 是否查询模式。 */
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

/**
 * 计算查询操作区在网格中的占位信息。
 * @param input 当前可见字段数和列数。
 * @returns 操作区网格位置。
 */
export function resolveQueryActionsGridPlacement(input: {
  /** 列配置集合。 */
  columns?: number;
  /** 当前可见字段数量。 */
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

/**
 * 解析查询表单操作项（折叠按钮 + 操作按钮）。
 * @param input 查询操作配置。
 * @returns 操作项渲染列表。
 */
export function resolveQueryActionItems(input: {
  /** 是否反转按钮顺序。 */
  actionButtonsReverse?: boolean;
  /** 当前是否折叠。 */
  collapsed?: boolean;
  /** 当前字段是否超出折叠阈值。 */
  hasOverflow: boolean;
  /** 操作文案。 */
  messages: FormActionMessages;
  /** 重置按钮配置。 */
  resetButtonOptions?: Record<string, any>;
  /** 是否显示折叠按钮。 */
  showCollapseButton?: boolean;
  /** 是否显示默认提交/重置按钮。 */
  showDefaultActions?: boolean;
  /** 提交按钮配置。 */
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

/**
 * 为查询表单补齐默认配置。
 * @param props 原始 props。
 * @param submitContent 提交按钮默认文案。
 * @returns 合并默认值后的 props。
 */
export function resolveSearchFormDefaults<
  TProps extends Record<string, any>,
>(
  props: TProps,
  submitContent?: string
): TProps {
  const resolvedSubmitContent =
    submitContent ?? getLocaleMessages().form.querySubmit;
  const submitButtonOptions = props.submitButtonOptions ?? {};
  return {
    ...props,
    queryMode: props.queryMode ?? true,
    gridColumns: props.gridColumns ?? 3,
    collapsedRows: props.collapsedRows ?? 1,
    showCollapseButton: props.showCollapseButton ?? true,
    showDefaultActions: props.showDefaultActions ?? true,
    submitButtonOptions: {
      content: resolvedSubmitContent,
      ...submitButtonOptions,
    },
  } as TProps;
}
