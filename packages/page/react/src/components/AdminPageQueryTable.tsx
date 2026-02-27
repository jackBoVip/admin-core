import type {
  AdminPageQueryTableReactProps,
} from '../types';
import type { AdminFormApi } from '@admin-core/form-react';
import type { AdminTableApi } from '@admin-core/table-react';

import {
  AdminSearchForm,
  createFormApi,
} from '@admin-core/form-react';
import {
  DEFAULT_PAGE_QUERY_TABLE_FIXED,
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  cleanupPageQueryTableApis,
  createPageQueryTableApi,
  createPageQueryTableLazyApiOwner,
  normalizePageFormTableBridgeOptions,
  resolvePageQueryTableFixed,
  resolvePageQueryFormOptionsWithBridge,
  resolvePageQueryTableOptionsWithStripeDefaults,
} from '@admin-core/page-core';
import {
  AdminTable,
  createTableApi,
  resolveTableStripeConfig,
} from '@admin-core/table-react';
import {
  CSSProperties,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { normalizePageQueryFormOptions } from '../utils/query-form-options';

type DataRecord = Record<string, any>;
type FormValuesRecord = Record<string, any>;
const PAGE_QUERY_FIXED_TABLE_CLASS = 'admin-table--lock-body-scroll';
const PAGE_SCROLL_LOCK_ATTR = 'data-admin-page-query-table-scroll-lock';
const FIXED_HEIGHT_SAFE_GAP = 2;
const SCROLLABLE_OVERFLOW_VALUES = new Set([
  'auto',
  'overlay',
  'scroll',
  'hidden',
  'clip',
]);

function appendClassToken(source: unknown, token: string) {
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

function removeClassToken(source: unknown, token: string) {
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
    SCROLLABLE_OVERFLOW_VALUES.has(styles.overflowY)
    || SCROLLABLE_OVERFLOW_VALUES.has(styles.overflow)
  );
}

function resolvePrimaryPageScrollContainer(element: null | HTMLElement) {
  if (!element) {
    return null as HTMLElement | null;
  }
  return (
    (element.closest('.layout-content') as HTMLElement | null)
    ?? (element.closest('.admin-page__content') as HTMLElement | null)
    ?? (element.closest('.layout-content__transition') as HTMLElement | null)
    ?? (element.closest('.layout-content__inner') as HTMLElement | null)
    ?? (element.closest('.admin-page__pane') as HTMLElement | null)
  );
}

function resolvePageScrollLockTargets(element: null | HTMLElement) {
  if (typeof window === 'undefined' || !element) {
    return [] as HTMLElement[];
  }
  const targets = new Set<HTMLElement>();
  const primaryContainer = resolvePrimaryPageScrollContainer(element);
  if (primaryContainer) {
    targets.add(primaryContainer);
  }

  let current: null | HTMLElement = element.parentElement;
  while (current) {
    if (isPotentialScrollContainer(current)) {
      targets.add(current);
    }
    current = current.parentElement;
  }

  if (document.documentElement) {
    targets.add(document.documentElement);
  }
  if (document.body) {
    targets.add(document.body);
  }

  return Array.from(targets);
}

function normalizeFixedHeightToDevicePixel(height: number) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio > 0
    ? window.devicePixelRatio
    : 1;
  return Math.max(1, Math.round(height * dpr) / dpr);
}

function resolveViewportHeight() {
  if (typeof window === 'undefined') {
    return 0;
  }
  const innerHeight = window.innerHeight;
  if (Number.isFinite(innerHeight) && innerHeight > 0) {
    return innerHeight;
  }
  const docClientHeight = document.documentElement?.clientHeight ?? 0;
  return docClientHeight > 0 ? docClientHeight : 0;
}

function resolveViewportBottomBoundary() {
  const viewportHeight = resolveViewportHeight();
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

function resolveFixedHeightByLayoutContent(
  element: HTMLElement,
  contentElement: HTMLElement
) {
  const contentRect = contentElement.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const viewportBottomBoundary = resolveViewportBottomBoundary();
  const elementTop = Math.max(0, elementRect.top);
  const contentBottom = Math.max(0, contentRect.bottom);
  const contentStyles = window.getComputedStyle(contentElement);
  const contentPaddingBottom = Math.max(
    0,
    parseCssPixel(contentStyles.paddingBottom)
  );
  const visibleBottom = Math.max(
    0,
    Math.min(
      viewportBottomBoundary,
      contentBottom - contentPaddingBottom
    )
  );
  const nextHeightByRect = visibleBottom - elementTop - FIXED_HEIGHT_SAFE_GAP;
  const normalizedByRect = normalizeFixedHeightToDevicePixel(nextHeightByRect);
  if (normalizedByRect !== null) {
    return normalizedByRect;
  }
  const offsetTop = Math.max(0, elementTop - contentRect.top);
  const nextHeightByClient =
    contentElement.clientHeight
    - offsetTop
    - contentPaddingBottom
    - FIXED_HEIGHT_SAFE_GAP;
  return normalizeFixedHeightToDevicePixel(nextHeightByClient);
}

function resolveFixedHeightByContainer(element: HTMLElement, container: HTMLElement) {
  const styles = window.getComputedStyle(container);
  const clipsByOverflow =
    SCROLLABLE_OVERFLOW_VALUES.has(styles.overflowY)
    || SCROLLABLE_OVERFLOW_VALUES.has(styles.overflow)
    || styles.position === 'fixed';
  const trustedContainer = clipsByOverflow;
  if (!trustedContainer) {
    return null;
  }
  const containerRect = container.getBoundingClientRect();
  const viewportBottomBoundary = resolveViewportBottomBoundary();
  const elementRect = element.getBoundingClientRect();
  const visibleBottom = Math.max(
    0,
    Math.min(
      viewportBottomBoundary,
      containerRect.bottom
    )
  );
  const elementTop = Math.max(0, elementRect.top);
  const nextHeight = visibleBottom - elementTop - FIXED_HEIGHT_SAFE_GAP;
  return normalizeFixedHeightToDevicePixel(nextHeight);
}

function resolveBestFixedHeight(element: HTMLElement) {
  if (typeof window === 'undefined') {
    return null;
  }
  const layoutContent = element.closest('.layout-content') as HTMLElement | null;
  if (layoutContent) {
    const nextHeight = resolveFixedHeightByLayoutContent(element, layoutContent);
    if (nextHeight !== null) {
      return nextHeight;
    }
  }
  const primaryContainer = resolvePrimaryPageScrollContainer(element);
  if (primaryContainer) {
    const nextHeight = resolveFixedHeightByContainer(element, primaryContainer);
    if (nextHeight !== null) {
      return nextHeight;
    }
  }
  const viewportBottomBoundary = resolveViewportBottomBoundary();
  return normalizeFixedHeightToDevicePixel(
    viewportBottomBoundary
      - Math.max(0, element.getBoundingClientRect().top)
      - FIXED_HEIGHT_SAFE_GAP
  );
}

function resolvePageQueryTableGap(rootElement: HTMLElement) {
  const styles = window.getComputedStyle(rootElement);
  const rowGap = parseCssPixel(styles.rowGap);
  if (rowGap > 0) {
    return rowGap;
  }
  return parseCssPixel(styles.gap);
}

function resolveFixedTableHeight(rootElement: HTMLElement, rootHeight: number) {
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
  return normalizeFixedHeightToDevicePixel(rootHeight - formHeight - gap);
}

export const AdminPageQueryTable = memo(function AdminPageQueryTable<
  TData extends DataRecord = DataRecord,
  TFormValues extends FormValuesRecord = FormValuesRecord,
>(props: AdminPageQueryTableReactProps<TData, TFormValues>) {
  const latestFormOptionsRef = useRef(props.formOptions);
  latestFormOptionsRef.current = props.formOptions;
  const latestTableOptionsRef = useRef(props.tableOptions);
  latestTableOptionsRef.current = props.tableOptions;
  const lazyApiOwnerRef = useRef<ReturnType<
    typeof createPageQueryTableLazyApiOwner<
      AdminFormApi,
      AdminTableApi<TData, TFormValues>
    >
  > | null>(null);
  if (!lazyApiOwnerRef.current) {
    lazyApiOwnerRef.current = createPageQueryTableLazyApiOwner<
      AdminFormApi,
      AdminTableApi<TData, TFormValues>
    >({
      createFormApi: () =>
        createFormApi(
          normalizePageQueryFormOptions(
            (latestFormOptionsRef.current ?? {}) as Record<string, any>
          )
        ),
      createTableApi: () =>
        createTableApi<TData, TFormValues>(
          resolvePageQueryTableOptionsWithStripeDefaults(
            (latestTableOptionsRef.current ?? {}) as Record<string, any>,
            (stripe: unknown, stripeDefaults: Record<string, any>) =>
              resolveTableStripeConfig(stripe as any, stripeDefaults as any),
            DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
          ) as any
        ),
    });
  }
  const lazyApiOwner = lazyApiOwnerRef.current;

  const formApi =
    props.api?.formApi ?? props.formApi ?? lazyApiOwner.ensureFormApi();
  const tableApi =
    props.api?.tableApi ?? props.tableApi ?? lazyApiOwner.ensureTableApi();

  const bridgeOptions = useMemo(
    () => normalizePageFormTableBridgeOptions(props.bridge),
    [props.bridge]
  );
  const fixedMode = resolvePageQueryTableFixed(
    props.fixed ?? DEFAULT_PAGE_QUERY_TABLE_FIXED
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [fixedRootHeight, setFixedRootHeight] = useState<null | number>(null);
  const [fixedTableHeight, setFixedTableHeight] = useState<null | number>(null);
  const pageScrollLocksRef = useRef<
    Array<{ element: HTMLElement; overflowX: string; overflowY: string }>
  >([]);

  const mergedFormOptions = useMemo(() => {
    return resolvePageQueryFormOptionsWithBridge({
      bridge: bridgeOptions as any,
      formApi,
      formOptions: (props.formOptions ?? {}) as Record<string, any>,
      normalizeFormOptions: (formOptions) =>
        normalizePageQueryFormOptions(formOptions as Record<string, any>),
      tableApi: tableApi as any,
    });
  }, [bridgeOptions, formApi, props.formOptions, tableApi]);

  const mergedTableOptions = useMemo(() => {
    const resolvedOptions = resolvePageQueryTableOptionsWithStripeDefaults(
      (props.tableOptions ?? {}) as Record<string, any>,
      (stripe: unknown, stripeDefaults: Record<string, any>) =>
        resolveTableStripeConfig(stripe as any, stripeDefaults as any),
      DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
    ) as Record<string, any>;
    const sourceGridOptions =
      resolvedOptions.gridOptions && typeof resolvedOptions.gridOptions === 'object'
        ? (resolvedOptions.gridOptions as Record<string, any>)
        : {};
    const hasGridHeight = Object.prototype.hasOwnProperty.call(
      sourceGridOptions,
      'height'
    );
    const hasGridMaxHeight = Object.prototype.hasOwnProperty.call(
      sourceGridOptions,
      'maxHeight'
    );
    if (!fixedMode) {
      return {
        ...resolvedOptions,
        class: removeClassToken(
          resolvedOptions.class,
          PAGE_QUERY_FIXED_TABLE_CLASS
        ),
      };
    }
    return {
      ...resolvedOptions,
      class: appendClassToken(
        resolvedOptions.class,
        PAGE_QUERY_FIXED_TABLE_CLASS
      ),
      gridOptions: hasGridHeight || hasGridMaxHeight
        ? sourceGridOptions
        : {
            ...sourceGridOptions,
            height: '100%',
          },
    };
  }, [fixedMode, props.tableOptions]);

  useEffect(() => {
    return () => {
      const ownedState = lazyApiOwner.getOwnedState();
      cleanupPageQueryTableApis({
        formApi: ownedState.formApi,
        ownsFormApi: ownedState.ownsFormApi,
        ownsTableApi: ownedState.ownsTableApi,
        tableApi: ownedState.tableApi,
      });
    };
  }, [lazyApiOwner]);

  useEffect(() => {
    if (!fixedMode || typeof window === 'undefined') {
      setFixedRootHeight(null);
      setFixedTableHeight(null);
      return;
    }

    let rafId = 0;
    let frameBudget = 0;

    const updateFixedHeight = () => {
      const rootElement = rootRef.current;
      if (!rootElement) {
        return;
      }
      const nextFixedHeight =
        resolveBestFixedHeight(rootElement);
      if (nextFixedHeight !== null) {
        const nextTableHeight = resolveFixedTableHeight(
          rootElement,
          nextFixedHeight
        );
        setFixedRootHeight((previousHeight) =>
          previousHeight === nextFixedHeight ? previousHeight : nextFixedHeight
        );
        setFixedTableHeight((previousHeight) =>
          previousHeight === nextTableHeight ? previousHeight : nextTableHeight
        );
        return;
      }
      setFixedRootHeight(null);
      setFixedTableHeight(null);
    };

    const runStabilizedUpdate = () => {
      updateFixedHeight();
      if (frameBudget <= 0) {
        rafId = 0;
        return;
      }
      frameBudget -= 1;
      rafId = window.requestAnimationFrame(runStabilizedUpdate);
    };

    const scheduleUpdate = () => {
      frameBudget = Math.max(frameBudget, 0);
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(runStabilizedUpdate);
    };

    const scheduleStabilizedUpdate = (frames = 4) => {
      frameBudget = Math.max(frameBudget, Math.max(0, Math.floor(frames)));
      scheduleUpdate();
    };

    const bootstrapHeight = () => {
      updateFixedHeight();
      scheduleStabilizedUpdate(10);
      window.requestAnimationFrame(() => {
        scheduleStabilizedUpdate(6);
      });
    };
    const handleWindowResize = () => {
      scheduleStabilizedUpdate(6);
    };
    bootstrapHeight();
    window.addEventListener('resize', handleWindowResize, { passive: true });
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleStabilizedUpdate(6);
          })
        : null;
    if (resizeObserver && rootRef.current) {
      const targets = new Set<HTMLElement>();
      targets.add(rootRef.current);
      if (rootRef.current.parentElement) {
        targets.add(rootRef.current.parentElement);
      }
      const primaryContainer = resolvePrimaryPageScrollContainer(rootRef.current);
      if (primaryContainer) {
        targets.add(primaryContainer);
      }
      const formElement = rootRef.current.querySelector(
        '.admin-page-query-table__form'
      ) as HTMLElement | null;
      if (formElement) {
        targets.add(formElement);
      }
      for (const target of targets) {
        resizeObserver.observe(target);
      }
    }
    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = 0;
      frameBudget = 0;
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
    };
  }, [fixedMode]);

  useEffect(() => {
    const unlockPageScroll = () => {
      if (pageScrollLocksRef.current.length <= 0) {
        return;
      }
      for (const lock of pageScrollLocksRef.current) {
        lock.element.style.overflowY = lock.overflowY;
        lock.element.style.overflowX = lock.overflowX;
        lock.element.removeAttribute(PAGE_SCROLL_LOCK_ATTR);
      }
      pageScrollLocksRef.current = [];
    };

    if (!fixedMode) {
      unlockPageScroll();
      setFixedTableHeight(null);
      return unlockPageScroll;
    }
    const lockTargets = resolvePageScrollLockTargets(rootRef.current);
    if (lockTargets.length <= 0) {
      return unlockPageScroll;
    }
    unlockPageScroll();
    pageScrollLocksRef.current = lockTargets.map((target) => ({
      element: target,
      overflowX: target.style.overflowX ?? '',
      overflowY: target.style.overflowY ?? '',
    }));
    for (const lock of pageScrollLocksRef.current) {
      lock.element.style.overflowY = 'hidden';
      lock.element.style.overflowX = 'hidden';
      lock.element.setAttribute(PAGE_SCROLL_LOCK_ATTR, 'true');
      if (lock.element.scrollTop > 0) {
        lock.element.scrollTop = 0;
      }
    }
    window.requestAnimationFrame(() => {
      const rootElement = rootRef.current;
      if (!rootElement) {
        return;
      }
      const nextFixedHeight =
        resolveBestFixedHeight(rootElement);
      if (nextFixedHeight !== null) {
        const nextTableHeight = resolveFixedTableHeight(
          rootElement,
          nextFixedHeight
        );
        setFixedRootHeight((previousHeight) =>
          previousHeight === nextFixedHeight
            ? previousHeight
            : nextFixedHeight
        );
        setFixedTableHeight((previousHeight) =>
          previousHeight === nextTableHeight
            ? previousHeight
            : nextTableHeight
        );
      } else {
        setFixedRootHeight(null);
        setFixedTableHeight(null);
      }
    });

    return unlockPageScroll;
  }, [fixedMode]);

  const mergedRootStyle = useMemo(() => {
    const style = { ...(props.style ?? {}) } as CSSProperties & Record<string, any>;
    if (fixedMode && fixedRootHeight) {
      style['--admin-page-query-table-fixed-root-height'] = `${fixedRootHeight}px`;
    } else {
      delete style['--admin-page-query-table-fixed-root-height'];
    }
    if (fixedMode && fixedTableHeight) {
      style['--admin-page-query-table-fixed-table-height'] = `${fixedTableHeight}px`;
    } else {
      delete style['--admin-page-query-table-fixed-table-height'];
    }
    return style;
  }, [fixedRootHeight, fixedMode, fixedTableHeight, props.style]);

  return (
    <div
      ref={rootRef}
      className={[
        'admin-page-query-table',
        fixedMode ? 'admin-page-query-table--fixed' : 'admin-page-query-table--flow',
        props.className ?? '',
      ].filter(Boolean).join(' ')}
      style={mergedRootStyle}
    >
      <div className="admin-page-query-table__form">
        <AdminSearchForm
          {...(mergedFormOptions as any)}
          formApi={formApi}
        />
      </div>
      <div className="admin-page-query-table__table">
        <AdminTable
          {...(mergedTableOptions as any)}
          api={tableApi}
        />
      </div>
    </div>
  );
});

export {
  createPageQueryTableApi as createAdminPageQueryTableApi,
};
