/** 可判定为“可滚动”的 `overflow` 取值集合。 */
const PAGE_SCROLLABLE_OVERFLOW_VALUES = new Set(['auto', 'overlay', 'scroll']);

/**
 * 判断 overflow 值是否代表可滚动容器。
 * @param value overflow 配置值。
 * @returns 是否可滚动。
 */
export function isPageScrollableContainerOverflow(value: unknown) {
  if (typeof value !== 'string') {
    return false;
  }
  return PAGE_SCROLLABLE_OVERFLOW_VALUES.has(value.trim().toLowerCase());
}

/** 解析滚动锁定目标容器所需参数。 */
export interface ResolvePreferredPageScrollLockTargetOptions {
  /** 祖先滚动容器列表。 */
  ancestorScrollContainers?: HTMLElement[];
  /** 文档滚动元素。 */
  documentScrollElement?: HTMLElement | null;
  /** 优先滚动容器。 */
  primaryScrollContainer?: HTMLElement | null;
}

/**
 * 解析首选滚动锁定目标容器。
 * @param options 候选容器集合。
 * @returns 首选滚动容器；未命中时返回 `null`。
 */
export function resolvePreferredPageScrollLockTarget(
  options: ResolvePreferredPageScrollLockTargetOptions
) {
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
