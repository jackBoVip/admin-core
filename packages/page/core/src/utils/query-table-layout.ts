/**
 * Page 查询表格布局计算工具。
 * @description 提供固定高度计算、滚动锁管理、帧调度与 CSS 变量生成等布局运行时能力。
 */

import {
  PAGE_QUERY_FIXED_HEIGHT_SAFE_GAP,
  PAGE_SCROLL_LOCK_ATTR,
} from '../constants';
import {
  isPageScrollableContainerOverflow,
  resolvePreferredPageScrollLockTarget,
} from './fixed-scroll';

/**
 * 向 class 字符串追加 token（自动去重）。
 * @param source 原始 class。
 * @param token 待追加 token。
 * @returns 追加后的 class 字符串。
 */
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

/**
 * 从 class 字符串移除指定 token。
 * @param source 原始 class。
 * @param token 待移除 token。
 * @returns 移除后的 class 字符串。
 */
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

/**
 * 解析 CSS 像素值字符串。
 * @param value CSS 值。
 * @returns 解析后的像素数值，非法值返回 `0`。
 */
function parseCssPixel(value: string) {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * 判断元素是否可能成为滚动容器。
 * @param element 目标元素。
 * @returns 是否包含可滚动的 `overflow` 配置。
 */
function isPotentialScrollContainer(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  return (
    isPageScrollableContainerOverflow(styles.overflowY)
    || isPageScrollableContainerOverflow(styles.overflow)
  );
}

/**
 * 将高度规范化到设备像素网格，减少亚像素抖动。
 * @param height 原始高度。
 * @returns 规范化后的高度；无效高度返回 `null`。
 */
export function normalizeFixedHeightToDevicePixel(height: number) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio > 0
    ? window.devicePixelRatio
    : 1;
  return Math.max(1, Math.round(height * dpr) / dpr);
}

/**
 * 解析页面查询表格优先使用的滚动容器。
 * @param element 查询表格根元素。
 * @returns 命中的主滚动容器，未命中返回 `null`。
 */
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

/**
 * 解析需要滚动锁定的容器集合。
 * @param element 查询表格根元素。
 * @returns 需锁定的滚动容器列表。
 */
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

/**
 * 页面滚动锁状态快照。
 * @description 记录单个滚动容器锁定前样式，用于后续精确恢复。
 */
export type PageScrollLockState = {
  /** 被锁定元素。 */
  element: HTMLElement;
  /** 锁定前的 `overflow-x`。 */
  overflowX: string;
  /** 锁定前的 `overflow-y`。 */
  overflowY: string;
};

/**
 * 查询表格重算调度器。
 * @description 通过 `requestAnimationFrame` 以帧为单位协调重算任务。
 */
export type PageQueryFrameScheduler = {
  /** 取消已排队的重算任务。 */
  cancel: () => void;
  /** 按帧调度重算。 */
  schedule: (frames?: number) => void;
};

/**
 * 查询表格稳定重算调度参数。
 */
export interface SchedulePageQueryStabilizedRecalcOptions {
  /** 延迟执行帧数。 */
  deferredFrames?: number;
  /** 立即执行帧数。 */
  immediateFrames?: number;
}

/**
 * 规范化调度帧数，至少执行 1 帧。
 * @param value 输入帧数。
 * @returns 规范化后的帧数。
 */
function normalizeScheduleRuns(value: number) {
  if (!Number.isFinite(value)) {
    return 1;
  }
  return Math.max(1, Math.floor(value));
}

/**
 * 创建基于 `requestAnimationFrame` 的重算调度器。
 * @param run 每帧执行逻辑。
 * @returns 调度器实例。
 */
export function createPageQueryFrameScheduler(
  run: () => void
): PageQueryFrameScheduler {
  let rafId: null | number = null;
  let queuedRuns = 0;

  /**
   * 执行一帧调度任务
   * @description 消耗一次待执行计数并按需继续下一帧调度。
   * @returns 无返回值。
   */
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
    /**
     * 取消当前及后续排队帧调度。
     * @returns 无返回值。
     */
    cancel() {
      if (typeof window !== 'undefined' && rafId !== null) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = null;
      queuedRuns = 0;
    },
    /**
     * 按指定帧数安排重算任务。
     * @param frames 计划执行帧数。
     * @returns 无返回值。
     */
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

/**
 * 规范化帧数，非法值回退到默认值。
 * @param value 输入帧数。
 * @param fallback 回退值。
 * @returns 规范化后的帧数（最小为 `0`）。
 */
function normalizeFrameCount(value: number, fallback: number) {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(0, Math.floor(value));
}

/**
 * 调度查询表格稳定重算（立即帧 + 延迟帧）。
 * @param schedule 调度函数。
 * @param options 帧数配置。
 * @returns 无返回值。
 */
export function schedulePageQueryStabilizedRecalc(
  schedule: (frames?: number) => void,
  options?: SchedulePageQueryStabilizedRecalcOptions
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

/**
 * 锁定目标滚动容器。
 * @param targets 待锁定容器列表。
 * @returns 对应的锁状态快照列表。
 */
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

/**
 * 判断当前锁状态与目标容器集合是否一致。
 * @param locks 当前锁状态。
 * @param targets 目标容器列表。
 * @returns 两者是否按顺序完全一致。
 */
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

/**
 * 解锁滚动容器并恢复原样式。
 * @param locks 锁状态快照。
 * @returns 清空后的锁状态列表。
 */
export function unlockPageScrollTargets(locks: PageScrollLockState[]) {
  for (const lock of locks) {
    lock.element.style.overflowY = lock.overflowY;
    lock.element.style.overflowX = lock.overflowX;
    lock.element.removeAttribute(PAGE_SCROLL_LOCK_ATTR);
  }
  return [] as PageScrollLockState[];
}

/**
 * 对齐滚动锁状态到目标容器集合。
 * @param locks 当前锁状态。
 * @param targets 目标容器列表。
 * @returns 对齐后的锁状态列表。
 */
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

/**
 * 获取当前视口高度。
 * @returns 当前视口可用高度。
 */
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

/**
 * 解析查询表格可用视口底边界（考虑固定 footer）。
 * @returns 可用于计算表格高度的视口底边界。
 */
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

/**
 * 基于容器边界计算固定高度。
 * @param element 查询表格元素。
 * @param container 约束容器。
 * @param safeGap 安全间距。
 * @returns 计算得到的固定高度；无效时返回 `null`。
 */
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

/**
 * 计算最优固定高度（优先主容器，其次锁定容器，最后视口）。
 * @param element 查询表格元素。
 * @param safeGap 安全间距。
 * @returns 最优固定高度；无有效结果时返回 `null`。
 */
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

/**
 * 将固定高度限制在可视区域内。
 * @param element 查询表格元素。
 * @param height 原始高度。
 * @param safeGap 安全间距。
 * @returns 裁剪后的固定高度；无效时返回 `null`。
 */
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

/**
 * 解析查询区与表格区之间的 gap 值。
 * @param rootElement 查询表格根元素。
 * @returns 查询区与表格区的实际间距值。
 */
export function resolvePageQueryTableGap(rootElement: HTMLElement) {
  const styles = window.getComputedStyle(rootElement);
  const rowGap = parseCssPixel(styles.rowGap);
  if (rowGap > 0) {
    return rowGap;
  }
  return parseCssPixel(styles.gap);
}

/**
 * 基于根容器高度计算表格高度（扣除查询区与间距）。
 * @param rootElement 查询表格根元素。
 * @param rootHeight 根容器高度。
 * @returns 计算后的表格高度；根高度无效时返回 `null`。
 */
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

/**
 * 判断两个高度是否近似相等（容忍 1px 以内误差）。
 * @param previous 上次高度。
 * @param next 本次高度。
 * @returns 是否近似相等。
 */
export function isHeightAlmostEqual(previous: null | number, next: null | number) {
  if (previous === next) {
    return true;
  }
  if (previous === null || next === null) {
    return false;
  }
  return Math.abs(previous - next) < 1;
}

/**
 * 查询表格根节点样式变量计算参数。
 * @description 控制固定模式下根容器和表格区高度变量的输出逻辑。
 */
export interface ResolvePageQueryTableRootStyleVariablesOptions {
  /** 是否固定模式。 */
  fixedMode: boolean;
  /** 固定模式下根容器高度。 */
  fixedRootHeight: null | number;
  /** 固定模式下表格高度。 */
  fixedTableHeight: null | number;
}

/**
 * 查询表格根节点样式变量映射。
 * @description 对应写入查询表格根节点的内联 CSS 变量键值。
 */
export interface PageQueryTableRootStyleVariables {
  /** 固定模式下根容器高度变量。 */
'--admin-page-query-table-fixed-root-height'?: string;
  /** 固定模式下表格高度变量。 */
'--admin-page-query-table-fixed-table-height'?: string;
}

/**
 * 生成查询表格根节点 CSS 变量。
 * @param options 固定模式相关参数。
 * @returns 根节点样式变量映射。
 */
export function resolvePageQueryTableRootStyleVariables(
  options: ResolvePageQueryTableRootStyleVariablesOptions
): PageQueryTableRootStyleVariables {
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
