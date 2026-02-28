import type {
  AdminPageQueryTableReactProps,
} from '../types';
import type { AdminFormApi } from '@admin-core/form-react';
import type { AdminTableApi } from '@admin-core/table-react';
import type { PageScrollLockState } from '@admin-core/page-core';

import {
  AdminSearchForm,
  createFormApi,
} from '@admin-core/form-react';
import {
  DEFAULT_PAGE_QUERY_TABLE_FIXED,
  DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
  clampFixedHeightToViewport,
  cleanupPageQueryTableApis,
  createPageQueryTableOptionResolvers,
  createPageQueryFrameScheduler,
  createPageQueryTableApi,
  createPageQueryTableLazyApiOwnerWithStripeDefaults,
  getLocaleMessages,
  isHeightAlmostEqual,
  normalizePageFormTableBridgeOptions,
  resolveBestFixedHeight,
  resolveFixedTableHeight,
  resolvePageQueryTableDisplayOptionsWithStripeDefaults,
  resolvePageQueryTableHeight,
  resolvePageQueryTableLayoutModeTitles,
  resolvePageQueryTableRootStyleVariables,
  reconcilePageScrollLocks,
  schedulePageQueryStabilizedRecalc,
  resolvePageScrollLockTargets,
  resolvePrimaryPageScrollContainer,
  resolvePageQueryTableFixed,
  normalizePageQueryFormOptions,
  resolvePageQueryFormOptionsWithBridge,
} from '@admin-core/page-core';
import {
  AdminTable,
  createTableApi,
  getAdminTableReactSetupState,
  resolveTableStripeConfig,
  useLocaleVersion as useTableLocaleVersion,
} from '@admin-core/table-react';
import type { CSSProperties } from 'react';
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useLocaleVersion } from '../hooks/useLocaleVersion';

type DataRecord = Record<string, unknown>;
type FormValuesRecord = Record<string, unknown>;
type AdminTableComponentProps = Parameters<typeof AdminTable>[0];

export const AdminPageQueryTable = memo(function AdminPageQueryTable<
  TData extends DataRecord = DataRecord,
  TFormValues extends FormValuesRecord = FormValuesRecord,
>(props: AdminPageQueryTableReactProps<TData, TFormValues>) {
  const latestFormOptionsRef = useRef(props.formOptions);
  latestFormOptionsRef.current = props.formOptions;
  const latestTableOptionsRef = useRef(props.tableOptions);
  latestTableOptionsRef.current = props.tableOptions;
  const lazyApiOwnerRef = useRef<ReturnType<
    typeof createPageQueryTableLazyApiOwnerWithStripeDefaults<
      AdminFormApi,
      AdminTableApi<TData, TFormValues>,
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>
    >
  > | null>(null);
  const pageQueryOptionResolvers = useMemo(
    () =>
      createPageQueryTableOptionResolvers<
        Record<string, unknown>,
        Parameters<typeof resolveTableStripeConfig>[0],
        NonNullable<Parameters<typeof resolveTableStripeConfig>[1]>
      >({
        normalizeFormOptions: normalizePageQueryFormOptions,
        resolveStripeConfig: resolveTableStripeConfig,
      }),
    []
  );
  if (!lazyApiOwnerRef.current) {
    type FormOptionsRecord = Record<string, unknown>;
    type CreateTableApiOptions = Parameters<
      typeof createTableApi<TData, TFormValues>
    >[0];
    type TableOptionsRecord = Record<string, unknown>;
    lazyApiOwnerRef.current = createPageQueryTableLazyApiOwnerWithStripeDefaults<
      AdminFormApi,
      AdminTableApi<TData, TFormValues>,
      FormOptionsRecord,
      TableOptionsRecord,
      Record<string, unknown>
    >({
      createFormApi: (formOptions) => createFormApi(formOptions),
      createTableApi: (tableOptions) =>
        createTableApi<TData, TFormValues>(
          tableOptions as CreateTableApiOptions
        ),
      formOptions: () =>
        (latestFormOptionsRef.current ?? {}) as FormOptionsRecord,
      normalizeFormOptions: pageQueryOptionResolvers.normalizeFormOptions,
      resolveStripeConfig: pageQueryOptionResolvers.resolveStripeConfig,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: () =>
        (latestTableOptionsRef.current ?? {}) as TableOptionsRecord,
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
  const { layoutModeTitleToFixed, layoutModeTitleToFlow } =
    resolvePageQueryTableLayoutModeTitles({
      localeText,
      preferredLocaleText,
    });
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
  const pageScrollLocksRef = useRef<PageScrollLockState[]>([]);

  useEffect(() => {
    setInnerFixedMode(preferredFixedMode);
  }, [preferredFixedMode]);

  const handleLayoutModeToggle = useCallback(() => {
    if (explicitTableHeight !== null) {
      return;
    }
    setInnerFixedMode((previous) => !previous);
  }, [explicitTableHeight]);

  const mergedFormOptions = useMemo(() => {
    const resolvedOptions = resolvePageQueryFormOptionsWithBridge({
      bridge: bridgeOptions,
      formApi,
      formOptions: (props.formOptions ?? {}) as Record<string, unknown>,
      normalizeFormOptions: pageQueryOptionResolvers.normalizeFormOptions,
      tableApi,
    }) as Record<string, unknown>;
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
        schedulePageQueryStabilizedRecalc((frames = 1) => {
          scheduleFixedHeightRecalcRef.current?.(frames);
        });
      },
    };
  }, [
    bridgeOptions,
    fixedMode,
    formApi,
    pageQueryOptionResolvers,
    props.formOptions,
    tableApi,
  ]);

  const mergedTableOptions = useMemo(() => {
    return resolvePageQueryTableDisplayOptionsWithStripeDefaults({
      explicitTableHeight,
      fixedMode,
      fixedTableHeight,
      layoutModeTitleToFixed,
      layoutModeTitleToFlow,
      onLayoutModeToggle: handleLayoutModeToggle,
      resolveStripeConfig: pageQueryOptionResolvers.resolveStripeConfig,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: (props.tableOptions ?? {}) as Record<string, unknown>,
    });
  }, [
    explicitTableHeight,
    fixedMode,
    fixedTableHeight,
    handleLayoutModeToggle,
    layoutModeTitleToFixed,
    layoutModeTitleToFlow,
    pageQueryOptionResolvers,
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

    const frameScheduler = createPageQueryFrameScheduler(updateFixedHeight);
    const scheduleStabilizedUpdate = (passes = 1) => {
      frameScheduler.schedule(passes);
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
      const formElement = rootRef.current.querySelector(
        '.admin-page-query-table__form'
      ) as HTMLElement | null;
      if (formElement) {
        targets.add(formElement);
      }
      if (resizeObserver) {
        for (const target of targets) {
          resizeObserver.observe(target);
        }
      }
    }
    return () => {
      scheduleFixedHeightRecalcRef.current = null;
      frameScheduler.cancel();
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
    };
  }, [fixedMode]);

  useEffect(() => {
    const unlockPageScroll = () => {
      pageScrollLocksRef.current = reconcilePageScrollLocks(
        pageScrollLocksRef.current,
        []
      );
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
    pageScrollLocksRef.current = reconcilePageScrollLocks(
      pageScrollLocksRef.current,
      lockTargets
    );
    window.requestAnimationFrame(() => {
      scheduleFixedHeightRecalcRef.current?.(1);
    });

    return unlockPageScroll;
  }, [fixedMode]);

  const mergedRootStyle = useMemo(() => {
    const style = { ...(props.style ?? {}) } as CSSProperties & Record<string, unknown>;
    const fixedStyleVariables = resolvePageQueryTableRootStyleVariables({
      fixedMode,
      fixedRootHeight,
      fixedTableHeight,
    }) as Record<string, undefined | string>;
    style['--admin-page-query-table-fixed-root-height'] =
      fixedStyleVariables['--admin-page-query-table-fixed-root-height'];
    style['--admin-page-query-table-fixed-table-height'] =
      fixedStyleVariables['--admin-page-query-table-fixed-table-height'];
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
          {...(mergedFormOptions as unknown as Record<string, unknown>)}
          formApi={formApi}
        />
      </div>
      <div className="admin-page-query-table__table">
        <AdminTable
          {...(mergedTableOptions as AdminTableComponentProps)}
          api={tableApi as AdminTableComponentProps['api']}
        />
      </div>
    </div>
  );
});

export {
  createPageQueryTableApi as createAdminPageQueryTableApi,
};
