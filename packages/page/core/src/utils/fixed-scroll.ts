const PAGE_SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'overlay', 'scroll']);

export function isPageScrollableContainerOverflow(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }
  return PAGE_SCROLLABLE_OVERFLOW_VALUES.has(value.trim().toLowerCase());
}

export function resolvePreferredPageScrollLockTarget(options: {
  ancestorScrollContainers?: HTMLElement[];
  documentScrollElement?: HTMLElement | null;
  primaryScrollContainer?: HTMLElement | null;
}) {
  const primaryScrollContainer = options.primaryScrollContainer ?? null;
  if (primaryScrollContainer) {
    return primaryScrollContainer;
  }
  const ancestorScrollContainers = options.ancestorScrollContainers ?? [];
  if (ancestorScrollContainers.length > 0) {
    return ancestorScrollContainers[0] ?? null;
  }
  return options.documentScrollElement ?? null;
}
