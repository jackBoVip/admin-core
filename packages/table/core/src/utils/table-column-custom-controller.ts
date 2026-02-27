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

interface ColumnCustomTransitionBase {
  action: ColumnCustomAction;
  panelOpen: boolean;
  snapshot: ColumnCustomSnapshot;
}

export interface ColumnCustomOpenTransitionResult
  extends ColumnCustomTransitionBase {
  action: 'open';
  draft: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  panelOpen: true;
}

export interface ColumnCustomCancelTransitionResult
  extends ColumnCustomTransitionBase {
  action: 'cancel';
  draft: ColumnCustomSnapshot;
  panelOpen: false;
}

export interface ColumnCustomConfirmTransitionResult
  extends ColumnCustomTransitionBase {
  action: 'confirm';
  current: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  panelOpen: false;
}

export interface ColumnCustomResetTransitionResult
  extends ColumnCustomTransitionBase {
  action: 'reset';
  current: ColumnCustomSnapshot;
  draft: ColumnCustomSnapshot;
  origin: ColumnCustomSnapshot;
  panelOpen: false;
}

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

export function resolveColumnCustomCancelTransition(
  columns: TableColumnRecord[],
  options: {
    current?: ColumnCustomSnapshotSource;
    origin?: ColumnCustomSnapshotSource | null;
  }
): ColumnCustomCancelTransitionResult {
  const next = resolveColumnCustomCancelState(columns, options);
  return {
    ...next,
    action: 'cancel',
    panelOpen: false,
  };
}

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

export function hasColumnCustomDraftChanges(
  draft?: ColumnCustomSnapshotSource | null,
  origin?: ColumnCustomSnapshotSource | null
) {
  return !deepEqual(
    cloneColumnCustomSnapshot(draft),
    cloneColumnCustomSnapshot(origin)
  );
}
