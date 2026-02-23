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

const defaultTableMobilePagerLayouts = [
  'PrevJump',
  'PrevPage',
  'Number',
  'NextPage',
  'NextJump',
] as const;

const defaultTablePagerPageSizes = [10, 20, 30, 50, 100, 200] as const;

export {
  defaultTableDesktopPagerLayouts,
  defaultTableMobilePagerLayouts,
  defaultTablePagerPageSizes,
};

export function normalizeTablePagerLayoutKey(value: unknown) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replaceAll(/[\s_-]+/g, '');
}

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

export function resolveTablePagerLayouts(value: unknown, mobile: boolean) {
  const source = flattenTablePagerLayouts(value);
  const fallback = mobile
    ? defaultTableMobilePagerLayouts
    : defaultTableDesktopPagerLayouts;
  return source.length > 0 ? source : [...fallback];
}

export function resolveTablePagerLayoutSet(value: unknown, mobile: boolean) {
  return new Set(
    resolveTablePagerLayouts(value, mobile).map((item) =>
      normalizeTablePagerLayoutKey(item)
    )
  );
}

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
