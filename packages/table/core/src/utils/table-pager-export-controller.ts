/**
 * Table Core 分页导出控制器工具。
 * @description 负责分页导出按钮可见性、动作解析与导出执行编排。
 */
import type { TablePagerExportConfig } from '../types';
import type {
  ResolvedTablePagerExportAction,
  TableColumnRecord,
  TableExportColumn,
  ToolbarToolVisibilityOptions,
} from './table-contracts';

import { exportTableRowsToExcel, normalizeTableExportFileName, resolveTableExportColumns } from './table-export';
import { resolveToolbarToolVisibility } from './table-toolbar-actions';

/**
 * 规范化分页导出相关数字参数。
 * @param value 原始值。
 * @param fallback 兜底值。
 * @returns 有效正数时返回数值本身，否则返回兜底值。
 */
function normalizePagerExportNumber(value: unknown, fallback: number) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0
    ? normalized
    : fallback;
}

/**
 * 规范化总条数字段。
 * @param value 原始总条数。
 * @returns 有效数值时返回数字，否则返回 `undefined`。
 */
function normalizePagerExportTotal(value: unknown) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

/**
 * 分页导出场景下的分页参数输入。
 */
export interface ResolveTablePagerExportPaginationOptions {
  /** 当前页码。 */
  currentPage?: unknown;
  /** 每页条数。 */
  pageSize?: unknown;
  /** 总条数。 */
  total?: unknown;
}

/**
 * 标准化后的分页参数。
 */
export interface ResolvedTablePagerExportPagination {
  /** 当前页码（从 1 开始）。 */
  currentPage: number;
  /** 每页条数。 */
  pageSize: number;
  /** 总条数。 */
  total?: number;
}

/**
 * 解析并标准化分页导出参数。
 * @param options 原始分页参数。
 * @returns 标准化后的分页信息。
 */
export function resolveTablePagerExportPagination(
  options: ResolveTablePagerExportPaginationOptions
): ResolvedTablePagerExportPagination {
  return {
    currentPage: normalizePagerExportNumber(options.currentPage, 1),
    pageSize: normalizePagerExportNumber(options.pageSize, 20),
    total: normalizePagerExportTotal(options.total),
  };
}

/**
 * 解析可见分页导出动作时的参数。
 */
export interface ResolveVisibleTablePagerExportActionsOptions<
  TData extends Record<string, any> = Record<string, any>,
> extends ToolbarToolVisibilityOptions {
  /** 待过滤的导出动作列表。 */
  actions?: null | Array<ResolvedTablePagerExportAction<TData>>;
}

/**
 * 根据权限和可见性规则筛选分页导出动作。
 * @template TData 行数据类型。
 * @param options 过滤参数。
 * @returns 可见动作数组（浅拷贝）。
 */
export function resolveVisibleTablePagerExportActions<
  TData extends Record<string, any> = Record<string, any>,
>(
  options: ResolveVisibleTablePagerExportActionsOptions<TData>
): Array<ResolvedTablePagerExportAction<TData>> {
  const { actions, ...visibilityOptions } = options;
  const source = Array.isArray(actions) ? actions : [];
  return source
    .filter((action) =>
      resolveToolbarToolVisibility(action as Record<string, any>, visibilityOptions)
    )
    .map((action) => ({ ...action }));
}

/**
 * 判断分页导出入口是否可见时的输入参数。
 */
export interface ResolveTablePagerExportVisibleOptions {
  /** 可见动作数量。 */
  actionsLength?: number;
  /** 分页导出功能是否启用。 */
  pagerEnabled?: boolean;
}

/**
 * 判断分页导出入口是否可见。
 * 需同时满足分页导出开关开启且存在至少一个动作。
 * @param options 判定参数。
 * @returns 是否展示分页导出入口。
 */
export function resolveTablePagerExportVisible(
  options: ResolveTablePagerExportVisibleOptions
) {
  const actionCount = Number(options.actionsLength ?? 0);
  const hasActions = Number.isFinite(actionCount) && actionCount > 0;
  return options.pagerEnabled !== false && hasActions;
}

/**
 * 解析分页导出触发器状态时的参数。
 */
export interface ResolveTablePagerExportTriggerStateOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 可见导出动作数组。 */
  actions?: null | Array<ResolvedTablePagerExportAction<TData>>;
}

/**
 * 分页导出触发器展示状态。
 */
export interface ResolvedTablePagerExportTriggerState<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 是否展示下拉菜单。 */
  showMenu: boolean;
  /** 仅有一个动作时直接展示的动作项。 */
  singleAction?: ResolvedTablePagerExportAction<TData>;
}

/**
 * 计算分页导出触发器展示形态。
 * 多于一个动作时走菜单模式，仅一个动作时可直接触发。
 * @template TData 行数据类型。
 * @param options 输入参数。
 * @returns 触发器状态。
 */
export function resolveTablePagerExportTriggerState<
  TData extends Record<string, any> = Record<string, any>,
>(
  options: ResolveTablePagerExportTriggerStateOptions<TData>
): ResolvedTablePagerExportTriggerState<TData> {
  const source = Array.isArray(options.actions) ? options.actions : [];
  const actionCount = source.length;
  return {
    showMenu: actionCount > 1,
    singleAction: actionCount === 1 ? source[0] : undefined,
  };
}

/**
 * 规范化导出场景选中键数组。
 * 仅保留字符串和数字键。
 * @param selectedRowKeys 原始选中键数组。
 * @returns 过滤后的选中键数组。
 */
export function normalizeTablePagerExportSelectedRowKeys(
  selectedRowKeys?: unknown[]
) {
  return (Array.isArray(selectedRowKeys) ? selectedRowKeys : [])
    .map((key) =>
      typeof key === 'number' || typeof key === 'string'
        ? key
        : null
    )
    .filter((key): key is number | string => key !== null);
}

/** 默认导出器参数。 */
export interface ExecuteTablePagerExportRowsOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 导出列定义。 */
  columns: Array<TableExportColumn<TData>>;
  /** 导出文件名。 */
  fileName: string;
  /** 导出数据行。 */
  rows: TData[];
}

/**
 * 执行分页导出动作所需参数。
 */
export interface ExecuteTablePagerExportActionOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 当前要执行的导出动作。 */
  action: null | ResolvedTablePagerExportAction<TData> | undefined;
  /** 全量数据。 */
  allRows?: TData[];
  /** 表格列配置。 */
  columns: Array<Record<string, any>>;
  /** 当前页码。 */
  currentPage?: number;
  /** 当前页数据。 */
  currentRows?: TData[];
  /** 全量导出处理器。 */
  exportAll?: TablePagerExportConfig<TData>['exportAll'];
  /** 自定义导出函数。 */
  exportRows?: (options: ExecuteTablePagerExportRowsOptions<TData>) => boolean;
  /** 导出文件名兜底值。 */
  fileNameFallback?: string;
  /** 缺少全量导出处理器时的提示文案。 */
  missingAllHandlerMessage?: string;
  /** 缺少全量导出处理器时的回调。 */
  onMissingAllHandler?: (message: string) => void;
  /** 每页条数。 */
  pageSize?: number;
  /** 分页导出功能开关。 */
  pagerEnabled?: boolean;
  /** 分页导出配置的文件名。 */
  pagerFileName?: string;
  /** 导出列解析器。 */
  resolveExportColumns?: (
    columns: TableColumnRecord[],
    seqStart: number
  ) => Array<TableExportColumn<TData>>;
  /** 选中行键集合。 */
  selectedRowKeys?: unknown[];
  /** 选中行数据集合。 */
  selectedRows?: TData[];
  /** 序号列起始偏移。 */
  seqStart?: number;
  /** 总条数。 */
  total?: number;
}

/** 分页导出动作执行时的标准载荷。 */
export interface TablePagerExportActionPayload<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 原始列配置。 */
  columns: Array<Record<string, any>>;
  /** 当前页码。 */
  currentPage: number;
  /** 导出文件名。 */
  fileName: string;
  /** 每页条数。 */
  pageSize: number;
  /** 导出数据行。 */
  rows: TData[];
  /** 选中键数组。 */
  selectedRowKeys: Array<number | string>;
  /** 选中行数组。 */
  selectedRows: TData[];
  /** 总条数。 */
  total?: number;
  /** 导出动作类型。 */
  type: ResolvedTablePagerExportAction<TData>['type'];
}

/**
 * 分页导出动作执行结果。
 */
export interface ExecuteTablePagerExportActionResult<
  TData extends Record<string, any> = Record<string, any>,
> {
  /** 是否已执行导出动作。 */
  executed: boolean;
  /** 最终导出文件名。 */
  fileName?: string;
  /** 透传给处理器的导出载荷。 */
  payload?: TablePagerExportActionPayload<TData>;
  /** 未执行原因。 */
  reason?: 'disabled' | 'missing-all-handler';
}

/**
 * 执行分页导出动作。
 * 执行顺序：校验动作可用性 -> 组装载荷 -> 优先执行动作自定义处理器 -> 回退到默认 Excel 导出。
 * @template TData 行数据类型。
 * @param options 导出执行参数。
 * @returns 执行结果。
 */
export async function executeTablePagerExportAction<
  TData extends Record<string, any> = Record<string, any>,
>(
  options: ExecuteTablePagerExportActionOptions<TData>
): Promise<ExecuteTablePagerExportActionResult<TData>> {
  const action = options.action;
  if (!action || action.disabled) {
    return {
      executed: false,
      reason: 'disabled',
    };
  }

  const { currentPage, pageSize, total } = resolveTablePagerExportPagination({
    currentPage: options.currentPage,
    pageSize: options.pageSize,
    total: options.total,
  });
  const selectedRowKeys = normalizeTablePagerExportSelectedRowKeys(
    options.selectedRowKeys
  );
  const currentRows = Array.isArray(options.currentRows) ? options.currentRows : [];
  const selectedRows = Array.isArray(options.selectedRows) ? options.selectedRows : [];
  const allRows = Array.isArray(options.allRows) ? options.allRows : [];
  const rows =
    action.type === 'selected'
      ? selectedRows
      : action.type === 'all'
        ? allRows
        : currentRows;
  const fileName = normalizeTableExportFileName(
    action.fileName ??
      options.pagerFileName ??
      options.fileNameFallback ??
      'table-export'
  );
  const payload = {
    columns: Array.isArray(options.columns) ? options.columns : [],
    currentPage,
    fileName,
    pageSize,
    rows,
    selectedRowKeys,
    selectedRows,
    total,
    type: action.type,
  };

  if (action.type === 'all') {
    const allHandler =
      typeof action.request === 'function'
        ? action.request
        : typeof action.onClick === 'function'
          ? action.onClick
          : options.exportAll;
    if (typeof allHandler !== 'function') {
      options.onMissingAllHandler?.(
        options.missingAllHandlerMessage ?? 'Missing export all handler.'
      );
      return {
        executed: false,
        fileName,
        payload,
        reason: 'missing-all-handler',
      };
    }
    await Promise.resolve(allHandler(payload as any));
    return {
      executed: true,
      fileName,
      payload,
    };
  }

  const customHandler =
    typeof action.request === 'function'
      ? action.request
      : typeof action.onClick === 'function'
        ? action.onClick
        : undefined;
  if (typeof customHandler === 'function') {
    await Promise.resolve(customHandler(payload as any));
    return {
      executed: true,
      fileName,
      payload,
    };
  }

  const seqStart = Number.isFinite(options.seqStart)
    ? Math.max(0, Number(options.seqStart))
    : (
      action.type === 'current' &&
      options.pagerEnabled !== false
        ? (currentPage - 1) * pageSize
        : 0
    );
  const resolveExportColumns = options.resolveExportColumns
    ?? ((columns: TableColumnRecord[], nextSeqStart: number) =>
      resolveTableExportColumns<TData>(columns, { seqStart: nextSeqStart })
    );
  const exportRows = options.exportRows ?? exportTableRowsToExcel;

  exportRows({
    columns: resolveExportColumns(
      payload.columns as Array<TableColumnRecord>,
      seqStart
    ),
    fileName,
    rows: rows as TData[],
  });

  return {
    executed: true,
    fileName,
    payload,
  };
}
