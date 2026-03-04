/**
 * React 版 Query + Table 组合页组件实现。
 * @description 负责查询表单与表格 API 桥接、固定高度布局计算和滚动锁状态管理。
 */

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

/**
 * 表格数据记录基础类型。
 */
type DataRecord = Record<string, unknown>;
/**
 * 表单值记录基础类型。
 */
type FormValuesRecord = Record<string, unknown>;
/**
 * React `AdminTable` 组件属性类型。
 */
type AdminTableComponentProps = Parameters<typeof AdminTable>[0];

/**
 * React 版 Query + Table 组合页组件。
 * @description 负责桥接查询表单与表格实例，并管理固定高度布局与滚动锁状态。
 */
export const AdminPageQueryTable = memo(function AdminPageQueryTable<
  TData extends DataRecord = DataRecord,
  TFormValues extends FormValuesRecord = FormValuesRecord,
>(props: AdminPageQueryTableReactProps<TData, TFormValues>) {
  /**
   * 最新表单配置引用（供惰性 API 持有器读取）。
   */
  const latestFormOptionsRef = useRef(props.formOptions);
  latestFormOptionsRef.current = props.formOptions;
  /**
   * 最新表格配置引用（供惰性 API 持有器读取）。
   */
  const latestTableOptionsRef = useRef(props.tableOptions);
  latestTableOptionsRef.current = props.tableOptions;
  /**
   * 惰性 API 持有器引用，统一管理 form/table/api 实例与所有权。
   */
  const lazyApiOwnerRef = useRef<ReturnType<
    typeof createPageQueryTableLazyApiOwnerWithStripeDefaults<
      AdminFormApi,
      AdminTableApi<TData, TFormValues>,
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>
    >
  > | null>(null);
  /**
   * Query-Table 选项解析器。
   * @description 提供表单标准化与斑马纹配置解析能力，供运行时构建复用。
   */
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
    /**
     * Query 表单配置的标准化记录类型。
     */
    type FormOptionsRecord = Record<string, unknown>;
    /**
     * `createTableApi` 的首参类型别名。
     */
    type CreateTableApiOptions = Parameters<
      typeof createTableApi<TData, TFormValues>
    >[0];
    /**
     * Table 配置的标准化记录类型。
     */
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
  /**
   * 惰性 API 持有器实例。
   * @description 统一管理内部创建的 form/table/api 资源与所有权。
   */
  const lazyApiOwner = lazyApiOwnerRef.current;

  /**
   * 当前生效的表单 API（外部传入优先）。
   */
  const formApi =
    props.api?.formApi ?? props.formApi ?? lazyApiOwner.ensureFormApi();
  /**
   * 当前生效的表格 API（外部传入优先）。
   */
  const tableApi =
    props.api?.tableApi ?? props.tableApi ?? lazyApiOwner.ensureTableApi();

  /**
   * 表单与表格桥接配置。
   */
  const bridgeOptions = useMemo(
    () => normalizePageFormTableBridgeOptions(props.bridge),
    [props.bridge]
  );
  /**
   * Page 语言版本号订阅值。
   */
  const localeVersion = useLocaleVersion();
  void localeVersion;
  /**
   * Table 语言版本号订阅值。
   */
  const tableLocaleVersion = useTableLocaleVersion();
  void tableLocaleVersion;
  /**
   * 偏好语言标识（取自 table setup 状态）。
   */
  const preferredLocale = getAdminTableReactSetupState().locale;
  /**
   * 偏好语言下文案。
   */
  const preferredLocaleText = getLocaleMessages(
    preferredLocale
  ).page as Record<string, string>;
  /**
   * 当前语言下文案。
   */
  const localeText = getLocaleMessages().page as Record<string, string>;
  /**
   * 布局模式标题文案集合。
   */
  const { layoutModeTitleToFixed, layoutModeTitleToFlow } =
    resolvePageQueryTableLayoutModeTitles({
      localeText,
      preferredLocaleText,
    });
  /**
   * 期望固定布局模式。
   * @description 将外部 `fixed` 配置标准化为布尔值。
   */
  const preferredFixedMode = useMemo(
    () =>
      resolvePageQueryTableFixed(
        props.fixed ?? DEFAULT_PAGE_QUERY_TABLE_FIXED
      ),
    [props.fixed]
  );
  /**
   * 显式指定的表格高度。
   * @description 传入该值时会禁用布局模式切换。
   */
  const explicitTableHeight = useMemo(
    () => resolvePageQueryTableHeight(props.tableHeight),
    [props.tableHeight]
  );
  /**
   * 内部固定模式开关（用于支持布局模式切换）。
   */
  const [innerFixedMode, setInnerFixedMode] = useState(preferredFixedMode);
  /**
   * 当前固定模式状态（显式高度时强制关闭）。
   */
  const fixedMode =
    explicitTableHeight === null &&
    innerFixedMode;
  /**
   * 根容器节点引用。
   */
  const rootRef = useRef<HTMLDivElement | null>(null);
  /**
   * 固定模式下根容器高度。
   */
  const [fixedRootHeight, setFixedRootHeight] = useState<null | number>(null);
  /**
   * 固定模式下表格可用高度。
   */
  const [fixedTableHeight, setFixedTableHeight] = useState<null | number>(null);
  /**
   * 稳定帧重算调度函数引用。
   */
  const scheduleFixedHeightRecalcRef = useRef<null | ((frames?: number) => void)>(null);
  /**
   * 页面滚动锁状态缓存。
   */
  const pageScrollLocksRef = useRef<PageScrollLockState[]>([]);

  /**
   * 外部固定模式偏好变化时同步内部状态。
   */
  useEffect(() => {
    setInnerFixedMode(preferredFixedMode);
  }, [preferredFixedMode]);

  /**
   * 切换查询表格布局模式
   * @description 仅在未显式指定 `tableHeight` 时，允许在固定高度与流式高度间切换。
   * @returns 无返回值。
   */
  const handleLayoutModeToggle = useCallback(() => {
    if (explicitTableHeight !== null) {
      return;
    }
    setInnerFixedMode((previous) => !previous);
  }, [explicitTableHeight]);

  /**
   * 组合后的查询表单配置。
   * @description 在固定布局模式下额外注入折叠回调，触发稳定帧高度重算。
   */
  const mergedFormOptions = useMemo(() => {
    /**
     * 桥接处理后的查询表单配置。
     */
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
    /**
     * 原始折叠回调（如果存在）。
     */
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

  /**
   * 组合后的表格展示配置。
   * @description 注入固定/流式模式展示参数与斑马纹默认项。
   */
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

  /**
   * 组件卸载时清理内部持有的 form/table API。
   */
  useEffect(() => {
    return () => {
      /**
       * 内部持有资源快照。
       */
      const ownedState = lazyApiOwner.getOwnedState();
      cleanupPageQueryTableApis({
        formApi: ownedState.formApi,
        ownsFormApi: ownedState.ownsFormApi,
        ownsTableApi: ownedState.ownsTableApi,
        tableApi: ownedState.tableApi,
      });
    };
  }, [lazyApiOwner]);

  /**
   * 固定模式下监听尺寸并维护固定高度。
   */
  useEffect(() => {
    if (!fixedMode || typeof window === 'undefined') {
      setFixedRootHeight(null);
      setFixedTableHeight(null);
      scheduleFixedHeightRecalcRef.current = null;
      return;
    }

    /**
     * 计算并更新固定布局高度
     * @description 读取容器可用高度并同步固定根高度与表格高度状态。
     * @returns 无返回值。
     */
    const updateFixedHeight = () => {
      /**
       * 当前根容器元素。
       */
      const rootElement = rootRef.current;
      if (!rootElement) {
        return;
      }
      /**
       * 解析后的固定根高。
       */
      const resolvedFixedHeight = resolveBestFixedHeight(rootElement);
      if (resolvedFixedHeight === null) {
        setFixedRootHeight(null);
        setFixedTableHeight(null);
        return;
      }
      /**
       * 与视口约束合并后的固定根高。
       */
      const nextFixedHeight =
        clampFixedHeightToViewport(rootElement, resolvedFixedHeight)
        ?? resolvedFixedHeight;
      /**
       * 固定模式下可分配给表格的高度。
       */
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

    /**
     * 固定高度帧调度器。
     */
    const frameScheduler = createPageQueryFrameScheduler(updateFixedHeight);
    /**
     * 触发稳定帧高度重算
     * @description 在指定帧次数内重复调度高度计算，降低布局抖动。
     * @param passes 调度帧次数。
     * @returns 无返回值。
     */
    const scheduleStabilizedUpdate = (passes = 1) => {
      frameScheduler.schedule(passes);
    };
    scheduleFixedHeightRecalcRef.current = scheduleStabilizedUpdate;

    /**
     * 初始化固定高度
     * @description 首次立即测量一次，并追加一帧稳定重算。
     * @returns 无返回值。
     */
    const bootstrapHeight = () => {
      updateFixedHeight();
      scheduleStabilizedUpdate(1);
    };
    /**
     * 处理窗口尺寸变化
     * @description 窗口变化时触发一次稳定重算。
     * @returns 无返回值。
     */
    const handleWindowResize = () => {
      scheduleStabilizedUpdate(1);
    };
    bootstrapHeight();
    window.addEventListener('resize', handleWindowResize, { passive: true });
    /**
     * 根容器尺寸观察器。
     */
    const resizeObserver =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(() => {
            scheduleStabilizedUpdate(1);
          })
        : null;
    if (rootRef.current) {
      /**
       * 需要观察的尺寸变化目标集合。
       */
      const targets = new Set<HTMLElement>();
      targets.add(rootRef.current);
      if (rootRef.current.parentElement) {
        targets.add(rootRef.current.parentElement);
      }
      /**
       * 主滚动容器。
       */
      const primaryContainer = resolvePrimaryPageScrollContainer(rootRef.current);
      if (primaryContainer) {
        targets.add(primaryContainer);
      }
      /**
       * 查询表单容器。
       */
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

  /**
   * 固定模式下维护页面滚动锁状态。
   */
  useEffect(() => {
    /**
     * 解除页面滚动锁
     * @description 清空当前记录的滚动锁目标并恢复页面滚动能力。
     * @returns 无返回值。
     */
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
    /**
     * 固定模式下需要加锁的滚动目标。
     */
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

  /**
   * 页面根节点样式。
   * @description 注入固定布局下的 CSS 变量，驱动容器与表格高度联动。
   */
  const mergedRootStyle = useMemo(() => {
    /**
     * 可写样式对象（包含外部样式）。
     */
    const style = { ...(props.style ?? {}) } as CSSProperties & Record<string, unknown>;
    /**
     * 固定模式 CSS 变量映射。
     */
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

/**
 * Query + Table 组合页 API 创建函数（React 导出别名）。
 */
export {
  createPageQueryTableApi as createAdminPageQueryTableApi,
};
