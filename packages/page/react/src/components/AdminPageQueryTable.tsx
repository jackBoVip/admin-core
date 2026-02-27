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
  getLocaleMessages,
  isPageScrollableContainerOverflow,
  normalizePageFormTableBridgeOptions,
  resolvePageQueryTableFixed,
  resolvePreferredPageScrollLockTarget,
  resolvePageQueryFormOptionsWithBridge,
  resolvePageQueryTableOptionsWithStripeDefaults,
} from '@admin-core/page-core';
import {
  AdminTable,
  createTableApi,
  getAdminTableReactSetupState,
  resolveTableStripeConfig,
  useLocaleVersion as useTableLocaleVersion,
} from '@admin-core/table-react';
import {
  CSSProperties,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocaleVersion } from '../hooks/useLocaleVersion';
import { normalizePageQueryFormOptions } from '../utils/query-form-options';

type DataRecord = Record<string, any>;
type FormValuesRecord = Record<string, any>;
const PAGE_QUERY_FIXED_TABLE_CLASS = 'admin-table--lock-body-scroll';
const PAGE_SCROLL_LOCK_ATTR = 'data-admin-page-query-table-scroll-lock';
const FIXED_HEIGHT_SAFE_GAP = 2;
const PAGE_QUERY_LAYOUT_TOOL_CODE = 'layout-mode-toggle';
const PAGE_QUERY_LAYOUT_FIXED_ICON = 'vxe-table-icon-fixed-left-fill';
const PAGE_QUERY_LAYOUT_FLOW_ICON = 'vxe-table-icon-fixed-left';

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

function resolvePageQueryTableHeight(value: unknown) {
  if (typeof value === 'number') {
    return Number.isFinite(value) && value > 0
      ? Math.max(1, Math.floor(value))
      : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const text = value.trim();
  if (!text) {
    return null;
  }
  if (!/^[+]?\d+(\.\d+)?(px)?$/i.test(text)) {
    return null;
  }
  const parsed = Number.parseFloat(text);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.max(1, Math.floor(parsed))
    : null;
}

function isPotentialScrollContainer(element: HTMLElement) {
  const styles = window.getComputedStyle(element);
  return (
    isPageScrollableContainerOverflow(styles.overflowY)
    || isPageScrollableContainerOverflow(styles.overflow)
  );
}

function resolvePrimaryPageScrollContainer(element: null | HTMLElement) {
  if (!element) {
    return null as HTMLElement | null;
  }
  return (
    (element.closest('.admin-page__content') as HTMLElement | null)
    ?? (element.closest('.layout-content') as HTMLElement | null)
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

function resolveFixedHeightByContainerBoundary(
  element: HTMLElement,
  container: HTMLElement
) {
  const containerRect = container.getBoundingClientRect();
  const viewportBottomBoundary = resolveViewportBottomBoundary();
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
  const nextHeight = visibleBottom - elementTop - FIXED_HEIGHT_SAFE_GAP;
  return normalizeFixedHeightToDevicePixel(nextHeight);
}

function resolveBestFixedHeight(element: HTMLElement) {
  if (typeof window === 'undefined') {
    return null;
  }
  const primaryContainer = resolvePrimaryPageScrollContainer(element);
  if (primaryContainer) {
    const nextHeight = resolveFixedHeightByContainerBoundary(
      element,
      primaryContainer
    );
    if (nextHeight !== null) {
      return nextHeight;
    }
  }
  const lockTargets = resolvePageScrollLockTargets(element);
  for (const target of lockTargets) {
    const nextHeight = resolveFixedHeightByContainerBoundary(element, target);
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

function clampFixedHeightToViewport(
  element: HTMLElement,
  height: number
) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }
  const viewportBottomBoundary = resolveViewportBottomBoundary();
  const elementTop = Math.max(0, element.getBoundingClientRect().top);
  const maxHeight = normalizeFixedHeightToDevicePixel(
    viewportBottomBoundary - elementTop - FIXED_HEIGHT_SAFE_GAP
  );
  if (maxHeight === null) {
    return null;
  }
  return Math.min(height, maxHeight);
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
  const nextHeight = rootHeight - formHeight - gap;
  const normalized = normalizeFixedHeightToDevicePixel(nextHeight);
  if (normalized !== null) {
    return normalized;
  }
  return 1;
}

function isHeightAlmostEqual(previous: null | number, next: null | number) {
  if (previous === next) {
    return true;
  }
  if (previous === null || next === null) {
    return false;
  }
  return Math.abs(previous - next) < 1;
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
  const localeVersion = useLocaleVersion();
  void localeVersion;
  const tableLocaleVersion = useTableLocaleVersion();
  void tableLocaleVersion;
  const preferredLocale = getAdminTableReactSetupState().locale;
  const preferredLocaleText = getLocaleMessages(
    preferredLocale
  ).page as Record<string, string>;
  const localeText = getLocaleMessages().page as Record<string, string>;
  const layoutModeTitleToFixed =
    preferredLocaleText.queryTableSwitchToFixed
    ?? localeText.queryTableSwitchToFixed
    ?? 'Switch to fixed mode';
  const layoutModeTitleToFlow =
    preferredLocaleText.queryTableSwitchToFlow
    ?? localeText.queryTableSwitchToFlow
    ?? 'Switch to flow mode';
  const preferredFixedMode = useMemo(
    () =>
      resolvePageQueryTableFixed(
        props.fixed ?? DEFAULT_PAGE_QUERY_TABLE_FIXED
      ),
    [props.fixed]
  );
  const explicitTableHeight = useMemo(
    () => resolvePageQueryTableHeight(props.tableHeight),
    [props.tableHeight]
  );
  const [innerFixedMode, setInnerFixedMode] = useState(preferredFixedMode);
  const fixedMode =
    explicitTableHeight === null &&
    innerFixedMode;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [fixedRootHeight, setFixedRootHeight] = useState<null | number>(null);
  const [fixedTableHeight, setFixedTableHeight] = useState<null | number>(null);
  const scheduleFixedHeightRecalcRef = useRef<null | ((frames?: number) => void)>(null);
  const pageScrollLocksRef = useRef<
    Array<{ element: HTMLElement; overflowX: string; overflowY: string }>
  >([]);

  useEffect(() => {
    setInnerFixedMode(preferredFixedMode);
  }, [preferredFixedMode]);

  const handleLayoutModeToggle = () => {
    if (explicitTableHeight !== null) {
      return;
    }
    setInnerFixedMode((previous) => !previous);
  };

  const mergedFormOptions = useMemo(() => {
    const resolvedOptions = resolvePageQueryFormOptionsWithBridge({
      bridge: bridgeOptions as any,
      formApi,
      formOptions: (props.formOptions ?? {}) as Record<string, any>,
      normalizeFormOptions: (formOptions) =>
        normalizePageQueryFormOptions(formOptions as Record<string, any>),
      tableApi: tableApi as any,
    }) as Record<string, any>;
    if (!fixedMode) {
      return resolvedOptions;
    }
    const sourceHandleCollapsedChange =
      typeof resolvedOptions.handleCollapsedChange === 'function'
        ? (resolvedOptions.handleCollapsedChange as (collapsed: boolean) => void)
        : null;
    return {
      ...resolvedOptions,
      handleCollapsedChange: (collapsed: boolean) => {
        sourceHandleCollapsedChange?.(collapsed);
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
              scheduleFixedHeightRecalcRef.current?.(1);
            });
          });
        }
      },
    };
  }, [bridgeOptions, fixedMode, formApi, props.formOptions, tableApi]);

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
    const sourceToolbarConfig =
      sourceGridOptions.toolbarConfig && typeof sourceGridOptions.toolbarConfig === 'object'
        ? (sourceGridOptions.toolbarConfig as Record<string, any>)
        : {};
    const sourceToolbarTools = Array.isArray(sourceToolbarConfig.tools)
      ? sourceToolbarConfig.tools
      : [];
    const mergedToolbarTools = sourceToolbarTools.filter((tool) => {
      return (tool as Record<string, any>)?.code !== PAGE_QUERY_LAYOUT_TOOL_CODE;
    });
    if (explicitTableHeight === null) {
      mergedToolbarTools.push({
        code: PAGE_QUERY_LAYOUT_TOOL_CODE,
        icon: fixedMode
          ? PAGE_QUERY_LAYOUT_FIXED_ICON
          : PAGE_QUERY_LAYOUT_FLOW_ICON,
        iconOnly: true,
        onClick: handleLayoutModeToggle,
        title: fixedMode
          ? layoutModeTitleToFlow
          : layoutModeTitleToFixed,
      });
    }
    const nextGridOptions = {
      ...sourceGridOptions,
      toolbarConfig: {
        ...sourceToolbarConfig,
        tools: mergedToolbarTools,
      },
    };
    if (!fixedMode) {
      const nextFlowGridOptions = {
        ...nextGridOptions,
        height: explicitTableHeight ?? null,
        maxHeight: null,
      };
      return {
        ...resolvedOptions,
        class: removeClassToken(
          resolvedOptions.class,
          PAGE_QUERY_FIXED_TABLE_CLASS
        ),
        gridOptions: nextFlowGridOptions,
      };
    }
    return {
      ...resolvedOptions,
      class: appendClassToken(
        resolvedOptions.class,
        PAGE_QUERY_FIXED_TABLE_CLASS
      ),
      gridOptions: {
        ...nextGridOptions,
        height:
          typeof fixedTableHeight === 'number'
          && Number.isFinite(fixedTableHeight)
          && fixedTableHeight > 0
            ? Math.max(1, Math.floor(fixedTableHeight))
            : '100%',
        maxHeight: null,
      },
    };
  }, [
    explicitTableHeight,
    fixedMode,
    fixedTableHeight,
    handleLayoutModeToggle,
    layoutModeTitleToFixed,
    layoutModeTitleToFlow,
    props.tableOptions,
  ]);

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
      scheduleFixedHeightRecalcRef.current = null;
      return;
    }

    let rafId = 0;

    const updateFixedHeight = () => {
      const rootElement = rootRef.current;
      if (!rootElement) {
        return;
      }
      const resolvedFixedHeight = resolveBestFixedHeight(rootElement);
      if (resolvedFixedHeight === null) {
        setFixedRootHeight(null);
        setFixedTableHeight(null);
        return;
      }
      const nextFixedHeight =
        clampFixedHeightToViewport(rootElement, resolvedFixedHeight)
        ?? resolvedFixedHeight;
      const nextTableHeight = resolveFixedTableHeight(
        rootElement,
        nextFixedHeight
      );
      setFixedRootHeight((previousHeight) =>
        isHeightAlmostEqual(previousHeight, nextFixedHeight)
          ? previousHeight
          : nextFixedHeight
      );
      setFixedTableHeight((previousHeight) =>
        isHeightAlmostEqual(previousHeight, nextTableHeight)
          ? previousHeight
          : nextTableHeight
      );
    };

    const runUpdate = () => {
      rafId = 0;
      updateFixedHeight();
    };

    const scheduleUpdate = () => {
      if (rafId !== 0) {
        return;
      }
      rafId = window.requestAnimationFrame(runUpdate);
    };

    const scheduleStabilizedUpdate = (passes = 1) => {
      scheduleUpdate();
      if (passes > 1) {
        let remaining = Math.max(0, Math.floor(passes) - 1);
        const scheduleRemaining = () => {
          if (remaining <= 0) {
            return;
          }
          remaining -= 1;
          scheduleUpdate();
          if (remaining > 0) {
            window.requestAnimationFrame(scheduleRemaining);
          }
        };
        window.requestAnimationFrame(scheduleRemaining);
      }
    };
    scheduleFixedHeightRecalcRef.current = scheduleStabilizedUpdate;

    const bootstrapHeight = () => {
      updateFixedHeight();
      scheduleStabilizedUpdate(1);
    };
    const handleWindowResize = () => {
      scheduleStabilizedUpdate(1);
    };
    bootstrapHeight();
    window.addEventListener('resize', handleWindowResize, { passive: true });
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleStabilizedUpdate(1);
          })
        : null;
    if (rootRef.current) {
      const targets = new Set<HTMLElement>();
      targets.add(rootRef.current);
      if (rootRef.current.parentElement) {
        targets.add(rootRef.current.parentElement);
      }
      const primaryContainer = resolvePrimaryPageScrollContainer(rootRef.current);
      if (primaryContainer) {
        targets.add(primaryContainer);
      }
      if (resizeObserver) {
        for (const target of targets) {
          resizeObserver.observe(target);
        }
      }
    }
    return () => {
      scheduleFixedHeightRecalcRef.current = null;
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      rafId = 0;
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
      scheduleFixedHeightRecalcRef.current?.(1);
    });

    return unlockPageScroll;
  }, [fixedMode]);

  const mergedRootStyle = useMemo(() => {
    const style = { ...(props.style ?? {}) } as CSSProperties & Record<string, any>;
    if (fixedMode && fixedRootHeight !== null) {
      style['--admin-page-query-table-fixed-root-height'] = `${fixedRootHeight}px`;
    } else {
      delete style['--admin-page-query-table-fixed-root-height'];
    }
    if (fixedMode && fixedTableHeight !== null) {
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
