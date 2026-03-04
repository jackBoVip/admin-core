/**
 * Table Core 共享工具与类型聚合导出入口。
 * @description 汇总列、工具栏、分页导出、选择、列自定义等子模块能力，供上层适配层统一复用。
 */
/**
 * 导出表格契约类型与列字段读取写入工具。
 */
export type {
  ExportTableRowsToExcelOptions,
  ResolveTableExportColumnsOptions,
  ResolveVisibleOperationActionToolsOptions,
  ResolveVisibleToolbarActionToolsOptions,
  ResolvedTablePagerExportAction,
  ResolvedTablePagerExportConfig,
  ResolvedToolbarActionButtonClassState,
  ResolvedToolbarActionButtonRenderState,
  ResolvedToolbarActionPresentation,
  ResolvedToolbarActionTool,
  TableColumnRecord,
  TableExportColumn,
  TableToolbarLocaleText,
  ToolbarAccessValueSource,
  ToolbarActionEventPayload,
  ToolbarActionToolPayload,
  ToolbarOperationEventPayload,
  ToolbarOperationToolPayload,
  ToolbarPermissionResolveOptions,
  ToolbarToolRenderOptions,
  ToolbarToolVisibilityOptions,
} from './table-contracts';
export {
  getColumnValueByPath,
  resolveColumnKey,
  resolveColumnTitle,
  resolveColumnType,
  setColumnValueByPath,
} from './table-columns';

/**
 * 导出工具栏本地化、日期格式化与内置工具构建能力。
 */
export type {
  BuiltinToolbarTool,
  ResolvedToolbarCustomConfig,
  TableDateFormatter,
} from './table-locale';
export {
  buildBuiltinToolbarTools,
  createTableDateFormatter,
  createTableLocaleText,
  getSearchPanelToggleTitle,
  isToolbarCustomEnabled,
  normalizeTableLocale,
  resolveToolbarCustomConfig,
} from './table-locale';

/**
 * 导出列自定义持久化配置与本地存取能力。
 */
export type { ResolvedColumnCustomPersistenceConfig } from './table-column-persistence';
export {
  readColumnCustomStateFromStorage,
  resolveColumnCustomPersistenceConfig,
  resolveColumnCustomState,
  writeColumnCustomStateToStorage,
} from './table-column-persistence';

/**
 * 导出表格导出与分页导出控制能力。
 */
export {
  createPagerExportEventPayload,
  exportTableRowsToExcel,
  normalizeTableExportFileName,
  resolveTableExportColumns,
  resolveTablePagerExportConfig,
} from './table-export';
/** 分页导出动作执行与状态解析类型。 */
export type {
  ExecuteTablePagerExportActionOptions,
  ExecuteTablePagerExportActionResult,
  ResolveTablePagerExportPaginationOptions,
  ResolveTablePagerExportTriggerStateOptions,
  ResolveVisibleTablePagerExportActionsOptions,
  ResolvedTablePagerExportPagination,
  ResolvedTablePagerExportTriggerState,
} from './table-pager-export-controller';
export {
  executeTablePagerExportAction,
  normalizeTablePagerExportSelectedRowKeys,
  resolveTablePagerExportPagination,
  resolveTablePagerExportTriggerState,
  resolveTablePagerExportVisible,
  resolveVisibleTablePagerExportActions,
} from './table-pager-export-controller';

/**
 * 导出选择列、序号列与行选择相关工具能力。
 */
export type {
  ApplySelectionCheckFieldToRowsOptions,
  EnsureSelectionColumnOptions,
  ResolveSeqColumnConfigOptions,
  ResolvedOperationColumnConfig,
  ResolvedTableSeqColumnConfig,
  TableSelectionMode,
} from './table-selection';
export {
  alignSelectionKeysToRows,
  applySelectionCheckFieldToRows,
  collectSelectionKeysByField,
  collectSelectionKeysByRows,
  createTableComparableSelectionKeySet,
  ensureSelectionColumn,
  ensureSeqColumn,
  flattenTableRows,
  isSelectionColumnTypeColumn,
  isSeqColumnTypeColumn,
  normalizeTableSelectionKeys,
  resolveOperationCellAlignClass,
  resolveOperationColumnConfig,
  resolveOperationColumnTools,
  resolveRowClickSelectionKeys,
  resolveSelectionColumn,
  resolveSelectionMode,
  resolveSelectionRowsByKeys,
  resolveSeqColumn,
  resolveSeqColumnConfig,
  toTableComparableSelectionKey,
} from './table-selection';
/** 选择变更控制器入参与结果类型。 */
export type {
  ResolveTableSelectionChangeOptions,
  ResolvedTableSelectionChangeResult,
} from './table-selection-controller';
export { resolveTableSelectionChange } from './table-selection-controller';

/**
 * 导出表格基础运行时能力与条纹/主题解析工具。
 */
export {
  cleanupTableRuntimeApis,
  createTableSearchFormActionHandlers,
  getSeparatorStyle,
  isProxyEnabled,
  pickTableRuntimeStateOptions,
  resolveTableMobileMatched,
  resolveTableStripeConfig,
  resolveTableStripePresentation,
  resolveTableThemeCssVars,
  shallowEqualObjectRecord,
  shouldShowSeparator,
  TABLE_MOBILE_MEDIA_QUERY,
} from './table-base';
/** 条纹表现与主题变量相关类型。 */
export type {
  ResolvedTableStripePresentation,
  ResolvedTableStripeConfig,
  TableThemeCssVarSource,
  TableSearchFormRuntimeApi,
} from './table-base';

/**
 * 导出行/单元格策略解析与触发能力。
 */
/** 行/单元格策略解析结果与触发结果类型。 */
export type {
  ResolvedTableCellStrategyResult,
  ResolvedTableRowStrategyResult,
  TriggerTableStrategyClickResult,
} from './table-strategy';
export {
  hasTableRowStrategyStyle,
  resolveTableCellStrategy,
  resolveTableCellStrategyResult,
  resolveTableRowStrategies,
  resolveTableRowStrategyInlineStyle,
  resolveTableRowStrategyResult,
  triggerTableCellStrategyClick,
  triggerTableRowStrategyClick,
} from './table-strategy';

/**
 * 导出列自定义拖拽、显隐、排序与快照管理能力。
 */
export type {
  ApplyColumnCustomFlipOffsetsOptions,
  CollectColumnCustomFlipOffsetsOptions,
  CollectColumnCustomFlipRectsOptions,
  ColumnCustomControlItem,
  ColumnCustomDragHoverState,
  ColumnCustomDragPosition,
  ColumnCustomDragState,
  ColumnCustomFlipNodeLike,
  ColumnCustomFlipOffset,
  ColumnCustomFlipRect,
  ColumnCustomSnapshotSource,
  ColumnRuntimeItem,
  ResolveColumnCustomCancelStateResult,
  ResolveColumnCustomConfirmStateResult,
  ResolveColumnCustomDragOverStateOptions,
  ResolveColumnCustomDragPositionOptions,
  ResolveColumnCustomOpenStateResult,
  ResolveColumnCustomResetStateResult,
  ResolveColumnCustomWorkingSnapshotOptions,
  ResolveColumnCustomAutoScrollTopOptions,
  TableDefaultFilterOption,
} from './table-column-custom';
export {
  applyColumnCustomDragMove,
  applyColumnCustomFlipOffsets,
  buildColumnFilterableMap,
  buildColumnFixedMap,
  buildColumnOrder,
  buildColumnRuntimeItems,
  buildColumnSortableMap,
  buildColumnVisibilityMap,
  buildColumnCustomControls,
  buildDefaultColumnFilterOptions,
  cloneColumnCustomSnapshot,
  collectColumnCustomFlipOffsets,
  collectColumnCustomFlipRects,
  createColumnCustomChangePayload,
  createColumnCustomDragResetState,
  createColumnCustomControlsOrderDigest,
  createColumnCustomSnapshot,
  forceColumnCustomFlipReflow,
  getColumnFilterValueKey,
  hasColumnCustomSnapshot,
  moveArrayItem,
  resetColumnCustomFlipTransforms,
  resolveColumnCustomAutoScrollTop,
  resolveColumnCustomCancelSnapshot,
  resolveColumnCustomCancelState,
  resolveColumnCustomConfirmSnapshot,
  resolveColumnCustomConfirmState,
  resolveColumnCustomDragOverState,
  resolveColumnCustomDragPosition,
  resolveColumnCustomDragStartState,
  resolveColumnCustomDraggingKey,
  resolveColumnCustomOpenSnapshot,
  resolveColumnCustomOpenState,
  resolveColumnCustomResetSnapshot,
  resolveColumnCustomResetState,
  resolveColumnCustomWorkingSnapshot,
  toggleAllColumnCustomVisible,
  toggleColumnCustomFilterable,
  toggleColumnCustomFixed,
  toggleColumnCustomSortable,
  toggleColumnCustomVisible,
} from './table-column-custom';
/** 列自定义状态流转结果类型。 */
export type {
  ColumnCustomCancelTransitionResult,
  ColumnCustomConfirmTransitionResult,
  ColumnCustomOpenTransitionResult,
  ColumnCustomResetTransitionResult,
} from './table-column-custom-controller';
export {
  hasColumnCustomDraftChanges,
  resolveColumnCustomCancelTransition,
  resolveColumnCustomConfirmTransition,
  resolveColumnCustomOpenTransition,
  resolveColumnCustomResetTransition,
} from './table-column-custom-controller';

/**
 * 导出工具栏按钮渲染态解析能力。
 */
export {
  resolveToolbarActionButtonClassState,
  resolveToolbarActionButtonRenderState,
  resolveToolbarActionPresentation,
} from './table-toolbar-render';

/**
 * 导出工具栏/操作列权限过滤与触发能力。
 */
export {
  evaluateToolbarToolPermission,
  resolveToolbarActionTools,
  resolveToolbarToolVisibility,
  resolveVisibleOperationActionTools,
  resolveVisibleToolbarActionTools,
  shouldRenderToolbarTool,
  triggerOperationActionTool,
  triggerToolbarActionTool,
} from './table-toolbar-actions';
/** 工具栏提示与插槽位置解析类型。 */
export type {
  ResolvedToolbarHintConfig,
  ResolvedToolbarInlinePosition,
  ResolvedToolbarToolsSlotPosition,
} from './table-toolbar';
