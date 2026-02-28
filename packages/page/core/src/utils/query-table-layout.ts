import {
  PAGE_QUERY_FIXED_HEIGHT_SAFE_GAP,
  PAGE_SCROLL_LOCK_ATTR,
} from '../constants';
import {
  isPageScrollableContainerOverflow,
  resolvePreferredPageScrollLockTarget,
} from './fixed-scroll';

export function appendClassToken(source: unknown, token: string) {
  const normalized = typeof source === 'string' ? source.trim() : '';
  if (!normalized) {
    return token;
  }
  const tokens = normalized.split(/\s+/);
  if (tokens.includes(token)) {
    return normalized;
  }
  return `${normalized} ${token}`;
}

export function removeClassToken(source: unknown, token: string) {
  const normalized = typeof source === 'string' ? source.trim() : '';
  if (!normalized) {
    return '';
  }
  return normalized
    .split(/\s+/)
    .filter((item) => item && item !== token)
    .join(' ');
}

function parseCssPixel(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isPotentialScrollContainer(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  return (
    isPageScrollableContainerOverflow(styles.overflowY)
    || isPageScrollableContainerOverflow(styles.overflow)
  );
}

export function normalizeFixedHeightToDevicePixel(height: number) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio > 0
    ? window.devicePixelRatio
    : 1;
  return Math.max(1, Math.round(height * dpr) / dpr);
}

export function resolvePrimaryPageScrollContainer(element: null | HTMLElement) {
  if (!element) {
    return null;
  }
  return (
    (element.closest('.admin-page__content') as HTMLElement | null)
    ?? (element.closest('.layout-content') as HTMLElement | null)
    ?? (element.closest('.layout-content__transition') as HTMLElement | null)
    ?? (element.closest('.layout-content__inner') as HTMLElement | null)
    ?? (element.closest('.admin-page__pane') as HTMLElement | null)
  );
}

export function resolvePageScrollLockTargets(element: null | HTMLElement) {
  if (typeof window === 'undefined' || !element) {
    return [] as HTMLElement[];
  }
  const targets = new Set<HTMLElement>();
  const primaryContainer = resolvePrimaryPageScrollContainer(element);
  const resolvedPrimaryContainer =
    primaryContainer && isPotentialScrollContainer(primaryContainer)
      ? primaryContainer
      : null;
  if (resolvedPrimaryContainer) {
    targets.add(resolvedPrimaryContainer);
  }
  let current: null | HTMLElement = element.parentElement;
  while (current) {
    if (isPotentialScrollContainer(current)) {
      targets.add(current);
    }
    current = current.parentElement;
  }
  const documentScrollElement = document.scrollingElement instanceof HTMLElement
    ? document.scrollingElement
    : document.documentElement;
  const preferredTarget = resolvePreferredPageScrollLockTarget({
    ancestorScrollContainers: Array.from(targets),
    documentScrollElement,
    primaryScrollContainer: resolvedPrimaryContainer,
  });
  if (preferredTarget) {
    targets.add(preferredTarget);
  }
  if (documentScrollElement) {
    targets.add(documentScrollElement);
  }
  if (document.documentElement) {
    targets.add(document.documentElement);
  }
  if (document.body) {
    targets.add(document.body);
  }
  return Array.from(targets);
}

export type PageScrollLockState = {
  element: HTMLElement;
  overflowX: string;
  overflowY: string;
};

export type PageQueryFrameScheduler = {
  cancel: () => void;
  schedule: (frames?: number) => void;
};

function normalizeScheduleRuns(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.floor(value));
}

export function createPageQueryFrameScheduler(
  run: () => void
): PageQueryFrameScheduler {
  let rafId: null | number = null;
  let queuedRuns = 0;

  const tick = () => {
    rafId = null;
    if (queuedRuns <= 0) {
      return;
    }
    queuedRuns -= 1;
    run();
    if (queuedRuns <= 0 || typeof window === 'undefined') {
      return;
    }
    rafId = window.requestAnimationFrame(tick);
  };

  return {
    cancel() {
      if (typeof window !== 'undefined' && rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = null;
      queuedRuns = 0;
    },
    schedule(frames = 1) {
      if (typeof window === 'undefined') {
        return;
      }
      queuedRuns = Math.max(queuedRuns, normalizeScheduleRuns(frames));
      if (rafId !== null) {
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    },
  };
}

function normalizeFrameCount(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

export function schedulePageQueryStabilizedRecalc(
  schedule: (frames?: number) => void,
  options?: {
    deferredFrames?: number;
    immediateFrames?: number;
  }
) {
  const immediateFrames = normalizeFrameCount(
    Number(options?.immediateFrames ?? 3),
    3
  );
  const deferredFrames = normalizeFrameCount(
    Number(options?.deferredFrames ?? 2),
    2
  );

  schedule(immediateFrames);
  if (deferredFrames <= 0 || typeof window === 'undefined') {
    return;
  }
  window.requestAnimationFrame(() => {
    schedule(deferredFrames);
  });
}

export function lockPageScrollTargets(targets: HTMLElement[]) {
  const locks = targets.map((target) => ({
    element: target,
    overflowX: target.style.overflowX ?? '',
    overflowY: target.style.overflowY ?? '',
  }));
  for (const lock of locks) {
    lock.element.style.overflowY = 'hidden';
    lock.element.style.overflowX = 'hidden';
    lock.element.setAttribute(PAGE_SCROLL_LOCK_ATTR, 'true');
    if (lock.element.scrollTop > 0) {
      lock.element.scrollTop = 0;
    }
  }
  return locks;
}

function isSameLockTargets(
  locks: PageScrollLockState[],
  targets: HTMLElement[]
) {
  if (locks.length !== targets.length) {
    return false;
  }
  for (let index = 0; index < locks.length; index += 1) {
    if (locks[index]?.element !== targets[index]) {
      return false;
    }
  }
  return true;
}

export function unlockPageScrollTargets(locks: PageScrollLockState[]) {
  for (const lock of locks) {
    lock.element.style.overflowY = lock.overflowY;
    lock.element.style.overflowX = lock.overflowX;
    lock.element.removeAttribute(PAGE_SCROLL_LOCK_ATTR);
  }
  return [] as PageScrollLockState[];
}

export function reconcilePageScrollLocks(
  locks: PageScrollLockState[],
  targets: HTMLElement[]
) {
  if (targets.length <= 0) {
    return unlockPageScrollTargets(locks);
  }
  if (isSameLockTargets(locks, targets)) {
    return locks;
  }
  const releasedLocks = unlockPageScrollTargets(locks);
  void releasedLocks;
  return lockPageScrollTargets(targets);
}

export function resolvePageQueryViewportHeight() {
  if (typeof window === 'undefined') {
    return 0;
  }
  const innerHeight = window.innerHeight;
  if (Number.isFinite(innerHeight) && innerHeight > 0) {
    return innerHeight;
  }
  const clientHeight = document.documentElement?.clientHeight ?? 0;
  return clientHeight > 0 ? clientHeight : 0;
}

export function resolvePageQueryViewportBottomBoundary() {
  const viewportHeight = resolvePageQueryViewportHeight();
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return viewportHeight;
  }
  const footers = Array.from(
    document.querySelectorAll('.layout-footer')
  ) as HTMLElement[];
  let boundary = viewportHeight;
  for (const footer of footers) {
    const styles = window.getComputedStyle(footer);
    if (styles.display === 'none' || styles.visibility === 'hidden') {
      continue;
    }
    if (styles.position !== 'fixed') {
      continue;
    }
    const footerTop = footer.getBoundingClientRect().top;
    if (!Number.isFinite(footerTop) || footerTop <= 0 || footerTop >= viewportHeight) {
      continue;
    }
    boundary = Math.min(boundary, Math.max(0, footerTop));
  }
  return boundary;
}

export function resolveFixedHeightByContainerBoundary(
  element: HTMLElement,
  container: HTMLElement,
  safeGap = PAGE_QUERY_FIXED_HEIGHT_SAFE_GAP
) {
  const containerRect = container.getBoundingClientRect();
  const viewportBottomBoundary = resolvePageQueryViewportBottomBoundary();
  const elementRect = element.getBoundingClientRect();
  const containerStyles = window.getComputedStyle(container);
  const containerPaddingBottom = Math.max(
    0,
    parseCssPixel(containerStyles.paddingBottom)
  );
  const containerBottomBoundary = Math.max(
    0,
    containerRect.bottom - containerPaddingBottom
  );
  const visibleBottom = Math.max(
    0,
    Math.min(
      viewportBottomBoundary,
      containerBottomBoundary
    )
  );
  const elementTop = Math.max(
    Math.max(0, elementRect.top),
    containerRect.top
  );
  const nextHeight = visibleBottom - elementTop - safeGap;
  return normalizeFixedHeightToDevicePixel(nextHeight);
}

export function resolveBestFixedHeight(
  element: HTMLElement,
  safeGap = PAGE_QUERY_FIXED_HEIGHT_SAFE_GAP
) {
  if (typeof window === 'undefined') {
    return null;
  }
  const primaryContainer = resolvePrimaryPageScrollContainer(element);
  if (primaryContainer) {
    const nextHeight = resolveFixedHeightByContainerBoundary(
      element,
      primaryContainer,
      safeGap
    );
    if (nextHeight !== null) {
      return nextHeight;
    }
  }
  const lockTargets = resolvePageScrollLockTargets(element);
  for (const target of lockTargets) {
    const nextHeight = resolveFixedHeightByContainerBoundary(
      element,
      target,
      safeGap
    );
    if (nextHeight !== null) {
      return nextHeight;
    }
  }
  const viewportBottomBoundary = resolvePageQueryViewportBottomBoundary();
  return normalizeFixedHeightToDevicePixel(
    viewportBottomBoundary
      - Math.max(0, element.getBoundingClientRect().top)
      - safeGap
  );
}

export function clampFixedHeightToViewport(
  element: HTMLElement,
  height: number,
  safeGap = PAGE_QUERY_FIXED_HEIGHT_SAFE_GAP
) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }
  const viewportBottomBoundary = resolvePageQueryViewportBottomBoundary();
  const elementTop = Math.max(0, element.getBoundingClientRect().top);
  const maxHeight = normalizeFixedHeightToDevicePixel(
    viewportBottomBoundary - elementTop - safeGap
  );
  if (maxHeight === null) {
    return null;
  }
  return Math.min(height, maxHeight);
}

export function resolvePageQueryTableGap(rootElement: HTMLElement) {
  const styles = window.getComputedStyle(rootElement);
  const rowGap = parseCssPixel(styles.rowGap);
  if (rowGap > 0) {
    return rowGap;
  }
  return parseCssPixel(styles.gap);
}

export function resolveFixedTableHeight(rootElement: HTMLElement, rootHeight: number) {
  if (!Number.isFinite(rootHeight) || rootHeight <= 0) {
    return null;
  }
  const formElement = rootElement.querySelector(
    '.admin-page-query-table__form'
  ) as HTMLElement | null;
  const formHeight = formElement
    ? Math.max(0, formElement.getBoundingClientRect().height)
    : 0;
  const gap = formElement ? resolvePageQueryTableGap(rootElement) : 0;
  const nextHeight = rootHeight - formHeight - gap;
  const normalized = normalizeFixedHeightToDevicePixel(nextHeight);
  if (normalized !== null) {
    return normalized;
  }
  return 1;
}

export function isHeightAlmostEqual(previous: null | number, next: null | number) {
  if (previous === next) {
    return true;
  }
  if (previous === null || next === null) {
    return false;
  }
  return Math.abs(previous - next) < 1;
}

export function resolvePageQueryTableRootStyleVariables(options: {
  fixedMode: boolean;
  fixedRootHeight: null | number;
  fixedTableHeight: null | number;
}) {
  return {
    '--admin-page-query-table-fixed-root-height':
      options.fixedMode && options.fixedRootHeight !== null
        ? `${options.fixedRootHeight}px`
        : undefined,
    '--admin-page-query-table-fixed-table-height':
      options.fixedMode && options.fixedTableHeight !== null
        ? `${options.fixedTableHeight}px`
        : undefined,
  };
}
