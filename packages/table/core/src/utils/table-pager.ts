/**
 * 桌面端分页器默认布局项顺序。
 */
const defaultTableDesktopPagerLayouts = [
  'Total',
  'Sizes',
  'Home',
  'PrevJump',
  'PrevPage',
  'Number',
  'NextPage',
  'NextJump',
  'End',
] as const;

/**
 * 移动端分页器默认布局项顺序。
 */
const defaultTableMobilePagerLayouts = [
  'PrevJump',
  'PrevPage',
  'Number',
  'NextPage',
  'NextJump',
] as const;

/**
 * 分页器默认每页条数选项。
 */
const defaultTablePagerPageSizes = [10, 20, 30, 50, 100, 200] as const;

export {
  defaultTableDesktopPagerLayouts,
  defaultTableMobilePagerLayouts,
  defaultTablePagerPageSizes,
};

/**
 * 规范化分页布局项键名。
 * 处理规则：转小写、去除首尾空格，并移除空格/下划线/短横线差异。
 * @param value 原始布局项名称。
 * @returns 规范化后的布局项键名。
 */
export function normalizeTablePagerLayoutKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_-]+/g, '');
}

/**
 * 将分页布局输入递归拍平为字符串数组。
 * 支持字符串、数组及多层嵌套数组输入。
 * @param value 原始布局配置。
 * @returns 拍平后的非空布局项列表。
 */
function flattenTablePagerLayouts(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.flatMap((item) => flattenTablePagerLayouts(item));
  }
  if (typeof value === 'string') {
    const next = value.trim();
    return next ? [next] : [];
  }
  return [];
}

/**
 * 解析分页布局项列表。
 * 当传入值为空时根据端类型返回默认布局。
 * @param value 原始布局配置。
 * @param mobile 是否为移动端。
 * @returns 最终使用的布局项数组。
 */
export function resolveTablePagerLayouts(value: unknown, mobile: boolean) {
  const source = flattenTablePagerLayouts(value);
  const fallback = mobile
    ? defaultTableMobilePagerLayouts
    : defaultTableDesktopPagerLayouts;
  return source.length > 0 ? source : [...fallback];
}

/**
 * 解析分页布局项集合（用于快速包含判断）。
 * @param value 原始布局配置。
 * @param mobile 是否为移动端。
 * @returns 由规范化布局键名组成的集合。
 */
export function resolveTablePagerLayoutSet(value: unknown, mobile: boolean) {
  return new Set(
    resolveTablePagerLayouts(value, mobile).map((item) =>
      normalizeTablePagerLayoutKey(item)
    )
  );
}

/**
 * 解析分页器每页条数选项。
 * 会对输入进行数字化、过滤非法值、去重和向下取整；若结果为空则回退默认值。
 * @param value 原始每页条数配置。
 * @returns 可用的每页条数数组。
 */
export function resolveTablePagerPageSizes(value: unknown) {
  if (Array.isArray(value)) {
    const normalized = value
      .map((item) => Number(item))
      .filter((item) => Number.isFinite(item) && item > 0)
      .map((item) => Math.floor(item));
    if (normalized.length > 0) {
      return Array.from(new Set(normalized));
    }
  }
  return [...defaultTablePagerPageSizes];
}
