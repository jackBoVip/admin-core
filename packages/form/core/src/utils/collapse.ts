/**
 * Form Core 折叠布局工具。
 * @description 提供查询表单折叠/展开策略与网格列数辅助计算。
 */
import { resolveGridColumns } from './stepped-form';
import type { AdminFormProps } from '../types';


/**
 * 从容器类名中解析网格列数。
 *
 * @param wrapperClass 包装器类名字符串。
 * @returns 解析出的列数；未命中时返回 `undefined`。
 */
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

/**
 * 计算折叠模式下应保留显示的最后一个字段索引。
 *
 * @param props 表单属性。
 * @returns 保留索引；不折叠时返回 `Number.MAX_SAFE_INTEGER`。
 */
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
