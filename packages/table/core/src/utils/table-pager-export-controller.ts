import type { TablePagerExportConfig } from '../types';
import type {
  ResolvedTablePagerExportAction,
  TableColumnRecord,
  TableExportColumn,
  ToolbarToolVisibilityOptions,
} from './table-contracts';

import { exportTableRowsToExcel, normalizeTableExportFileName, resolveTableExportColumns } from './table-export';
import { resolveToolbarToolVisibility } from './table-toolbar-actions';

function normalizePagerExportNumber(value: unknown, fallback: number) {
  const normalized = Number(value);
  return Number.isFinite(normalized) && normalized > 0
    ? normalized
    : fallback;
}

function normalizePagerExportTotal(value: unknown) {
  const normalized = Number(value);
  return Number.isFinite(normalized) ? normalized : undefined;
}

export interface ResolveTablePagerExportPaginationOptions {
  currentPage?: unknown;
  pageSize?: unknown;
  total?: unknown;
}

export interface ResolvedTablePagerExportPagination {
  currentPage: number;
  pageSize: number;
  total?: number;
}

export function resolveTablePagerExportPagination(
  options: ResolveTablePagerExportPaginationOptions
): ResolvedTablePagerExportPagination {
  return {
    currentPage: normalizePagerExportNumber(options.currentPage, 1),
    pageSize: normalizePagerExportNumber(options.pageSize, 20),
    total: normalizePagerExportTotal(options.total),
  };
}

export interface ResolveVisibleTablePagerExportActionsOptions<
  TData extends Record<string, any> = Record<string, any>,
> extends ToolbarToolVisibilityOptions {
  actions?: null | Array<ResolvedTablePagerExportAction<TData>>;
}

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

export function resolveTablePagerExportVisible(options: {
  actionsLength?: number;
  pagerEnabled?: boolean;
}) {
  const actionCount = Number(options.actionsLength ?? 0);
  const hasActions = Number.isFinite(actionCount) && actionCount > 0;
  return options.pagerEnabled !== false && hasActions;
}

export interface ResolveTablePagerExportTriggerStateOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  actions?: null | Array<ResolvedTablePagerExportAction<TData>>;
}

export interface ResolvedTablePagerExportTriggerState<
  TData extends Record<string, any> = Record<string, any>,
> {
  showMenu: boolean;
  singleAction?: ResolvedTablePagerExportAction<TData>;
}

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

export interface ExecuteTablePagerExportActionOptions<
  TData extends Record<string, any> = Record<string, any>,
> {
  action: null | ResolvedTablePagerExportAction<TData> | undefined;
  allRows?: TData[];
  columns: Array<Record<string, any>>;
  currentPage?: number;
  currentRows?: TData[];
  exportAll?: TablePagerExportConfig<TData>['exportAll'];
  exportRows?: (options: {
    columns: Array<TableExportColumn<TData>>;
    fileName: string;
    rows: TData[];
  }) => boolean;
  fileNameFallback?: string;
  missingAllHandlerMessage?: string;
  onMissingAllHandler?: (message: string) => void;
  pageSize?: number;
  pagerEnabled?: boolean;
  pagerFileName?: string;
  resolveExportColumns?: (
    columns: TableColumnRecord[],
    seqStart: number
  ) => Array<TableExportColumn<TData>>;
  selectedRowKeys?: unknown[];
  selectedRows?: TData[];
  seqStart?: number;
  total?: number;
}

export interface ExecuteTablePagerExportActionResult<
  TData extends Record<string, any> = Record<string, any>,
> {
  executed: boolean;
  fileName?: string;
  payload?: {
    columns: Array<Record<string, any>>;
    currentPage: number;
    fileName: string;
    pageSize: number;
    rows: TData[];
    selectedRowKeys: Array<number | string>;
    selectedRows: TData[];
    total?: number;
    type: ResolvedTablePagerExportAction<TData>['type'];
  };
  reason?: 'disabled' | 'missing-all-handler';
}

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
