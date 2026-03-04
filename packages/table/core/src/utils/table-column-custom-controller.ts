/**
 * Table Core 列自定义控制器。
 * @description 管理列自定义弹层的打开、确认、取消与重置流程状态。
 */
import type { ColumnCustomAction, ColumnCustomSnapshot } from '../types';
import type { TableColumnRecord } from './table-contracts';
import type { ColumnCustomSnapshotSource } from './table-column-custom';

import { deepEqual } from './deep';
import {
  cloneColumnCustomSnapshot,
  resolveColumnCustomCancelState,
  resolveColumnCustomConfirmState,
  resolveColumnCustomOpenState,
  resolveColumnCustomResetState,
} from './table-column-custom';

/**
 * 列自定义状态切换结果基础结构。
 */
interface ColumnCustomTransitionBase {
  /** 当前触发的动作类型。 */
  action: ColumnCustomAction;
  /** 列自定义面板是否打开。 */
  panelOpen: boolean;
  /** 最终用于渲染的快照。 */
  snapshot: ColumnCustomSnapshot;
}

/**
 * 打开列自定义面板时的状态切换结果。
 */
export interface ColumnCustomOpenTransitionResult
  extends ColumnCustomTransitionBase {
  /** 动作类型：打开。 */
  action: 'open';
  /** 可编辑草稿快照。 */
  draft: ColumnCustomSnapshot;
  /** 初始基准快照。 */
  origin: ColumnCustomSnapshot;
  /** 打开面板时固定为 `true`。 */
  panelOpen: true;
}

/**
 * 取消列自定义时的状态切换结果。
 */
export interface ColumnCustomCancelTransitionResult
  extends ColumnCustomTransitionBase {
  /** 动作类型：取消。 */
  action: 'cancel';
  /** 取消后回退的草稿快照。 */
  draft: ColumnCustomSnapshot;
  /** 取消后固定关闭面板。 */
  panelOpen: false;
}

/**
 * 取消列自定义时的上下文参数。
 */
export interface ResolveColumnCustomCancelTransitionOptions {
  /** 当前快照来源。 */
  current?: ColumnCustomSnapshotSource;
  /** 初始快照来源。 */
  origin?: ColumnCustomSnapshotSource | null;
}

/**
 * 确认列自定义时的状态切换结果。
 */
export interface ColumnCustomConfirmTransitionResult
  extends ColumnCustomTransitionBase {
  /** 动作类型：确认。 */
  action: 'confirm';
  /** 确认后的当前快照。 */
  current: ColumnCustomSnapshot;
  /** 更新后的基准快照。 */
  origin: ColumnCustomSnapshot;
  /** 确认后固定关闭面板。 */
  panelOpen: false;
}

/**
 * 重置列自定义时的状态切换结果。
 */
export interface ColumnCustomResetTransitionResult
  extends ColumnCustomTransitionBase {
  /** 动作类型：重置。 */
  action: 'reset';
  /** 重置后的当前快照。 */
  current: ColumnCustomSnapshot;
  /** 重置后的草稿快照。 */
  draft: ColumnCustomSnapshot;
  /** 重置后的基准快照。 */
  origin: ColumnCustomSnapshot;
  /** 重置后固定关闭面板。 */
  panelOpen: false;
}

/**
 * 解析“打开列自定义面板”状态切换。
 * @param columns 当前列配置。
 * @param current 当前已保存快照。
 * @returns 打开动作的完整状态结果。
 */
export function resolveColumnCustomOpenTransition(
  columns: TableColumnRecord[],
  current?: ColumnCustomSnapshotSource
): ColumnCustomOpenTransitionResult {
  const next = resolveColumnCustomOpenState(columns, current);
  return {
    ...next,
    action: 'open',
    panelOpen: true,
  };
}

/**
 * 解析“取消列自定义”状态切换。
 * @param columns 当前列配置。
 * @param options 取消动作上下文参数。
 * @returns 取消动作的完整状态结果。
 */
export function resolveColumnCustomCancelTransition(
  columns: TableColumnRecord[],
  options: ResolveColumnCustomCancelTransitionOptions
): ColumnCustomCancelTransitionResult {
  const next = resolveColumnCustomCancelState(columns, options);
  return {
    ...next,
    action: 'cancel',
    panelOpen: false,
  };
}

/**
 * 解析“确认列自定义”状态切换。
 * @param columns 当前列配置。
 * @param draft 用户编辑后的草稿快照。
 * @returns 确认动作的完整状态结果。
 */
export function resolveColumnCustomConfirmTransition(
  columns: TableColumnRecord[],
  draft?: ColumnCustomSnapshotSource
): ColumnCustomConfirmTransitionResult {
  const next = resolveColumnCustomConfirmState(columns, draft);
  return {
    ...next,
    action: 'confirm',
    panelOpen: false,
  };
}

/**
 * 解析“重置列自定义”状态切换。
 * @param columns 当前列配置。
 * @returns 重置动作的完整状态结果。
 */
export function resolveColumnCustomResetTransition(
  columns: TableColumnRecord[]
): ColumnCustomResetTransitionResult {
  const next = resolveColumnCustomResetState(columns);
  return {
    ...next,
    action: 'reset',
    panelOpen: false,
  };
}

/**
 * 判断列自定义草稿是否相对基准快照发生变化。
 * @param draft 草稿快照来源。
 * @param origin 基准快照来源。
 * @returns 存在差异时返回 `true`。
 */
export function hasColumnCustomDraftChanges(
  draft?: ColumnCustomSnapshotSource | null,
  origin?: ColumnCustomSnapshotSource | null
) {
  return !deepEqual(
    cloneColumnCustomSnapshot(draft),
    cloneColumnCustomSnapshot(origin)
  );
}
