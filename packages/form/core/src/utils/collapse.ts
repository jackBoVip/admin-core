import { resolveGridColumns } from './stepped-form';
import type { AdminFormProps } from '../types';


function parseGridColumns(wrapperClass: string | undefined): number | undefined {
  if (!wrapperClass) return undefined;
  const matches =
    wrapperClass.match(/admin-form__grid--(\d+)/g) ??
    wrapperClass.match(/grid-cols-(\d+)/g);
  if (!matches || matches.length === 0) return undefined;
  const last = matches[matches.length - 1];
  const rawValue = last.includes('admin-form__grid--')
    ? last.split('admin-form__grid--')[1]
    : last.split('grid-cols-')[1];
  const value = Number(rawValue);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

export function computeCollapseKeepIndex(props: AdminFormProps): number {
  if (!props.showCollapseButton) return Number.MAX_SAFE_INTEGER;
  if (!props.collapsed) return Number.MAX_SAFE_INTEGER;
  const rows = props.collapsedRows ?? 1;
  const columns = resolveGridColumns(
    props.gridColumns ?? parseGridColumns(props.wrapperClass),
    1
  );
  return Math.max(rows * columns - 1, 0);
}
