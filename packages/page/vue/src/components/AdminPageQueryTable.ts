/**
 * Vue 版 Query + Table 组合页组件实现。
 * @description 负责查询表单与表格 API 桥接、固定高度布局计算和滚动锁状态管理。
 */

import type {
  AdminPageQueryTableApi,
  AdminPageQueryTableVueProps,
} from '../types';
import type { AdminFormApi } from '@admin-core/form-vue';
import type { PageScrollLockState } from '@admin-core/page-core';
import type { Component, PropType, VNodeChild } from 'vue';

import {
  AdminSearchForm,
  createFormApi,
} from '@admin-core/form-vue';
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
  type AdminTableApi,
  createTableApi,
  getAdminTableVueSetupState,
  resolveTableStripeConfig,
  useLocaleVersion as useTableLocaleVersion,
  usePreferencesLocale,
} from '@admin-core/table-vue';
import {
  computed,
  defineComponent,
  h,
  onActivated,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';
import { useLocaleVersion as usePageLocaleVersion } from '../composables/useLocaleVersion';

/**
 * 表格行数据类型别名。
 */
type DataRecord = Record<string, unknown>;
/**
 * 查询表单值类型别名。
 */
type FormValuesRecord = Record<string, unknown>;

/**
 * Vue 版 Query + Table 组合页组件。
 * @description 负责桥接查询表单与表格实例，并管理固定高度布局与滚动锁。
 */
export const AdminPageQueryTable = defineComponent({
  name: 'AdminPageQueryTable',
  inheritAttrs: false,
  props: {
    /** 外部传入的 Query+Table 组合 API。 */
    api: {
      default: undefined,
      type: Object as PropType<AdminPageQueryTableApi<DataRecord, FormValuesRecord>>,
    },
    /** 表单与表格桥接开关/配置。 */
    bridge: {
      default: undefined,
      type: [Boolean, Object] as PropType<AdminPageQueryTableVueProps['bridge']>,
    },
    /** 根节点附加类名。 */
    className: {
      default: undefined,
      type: String,
    },
    /** 外部传入的表单 API。 */
    formApi: {
      default: undefined,
      type: Object as PropType<AdminFormApi>,
    },
    /** 查询表单初始化配置。 */
    formOptions: {
      default: undefined,
      type: Object as PropType<NonNullable<AdminPageQueryTableVueProps['formOptions']>>,
    },
    /** 是否启用固定高度布局。 */
    fixed: {
      default: DEFAULT_PAGE_QUERY_TABLE_FIXED,
      type: Boolean,
    },
    /** 表格区域显式高度。 */
    tableHeight: {
      default: undefined,
      type: [Number, String] as PropType<
        NonNullable<AdminPageQueryTableVueProps['tableHeight']>
      >,
    },
    /** 根节点样式对象。 */
    style: {
      default: undefined,
      type: Object as PropType<NonNullable<AdminPageQueryTableVueProps['style']>>,
    },
    /** 外部传入的表格 API。 */
    tableApi: {
      default: undefined,
      type: Object as PropType<AdminTableApi<DataRecord, FormValuesRecord>>,
    },
    /** 表格初始化配置。 */
    tableOptions: {
      default: undefined,
      type: Object as PropType<NonNullable<AdminPageQueryTableVueProps['tableOptions']>>,
    },
  },
  /**
   * Query-Table 组合逻辑。
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { attrs, expose, slots }) {
    /**
     * `createTableApi` 参数类型别名。
     */
    type CreateTableApiOptions = Parameters<
      typeof createTableApi<DataRecord, FormValuesRecord>
    >[0];
    /**
     * Query-Table 选项解析器。
     * @description 提供表单标准化与斑马纹配置解析能力。
     */
    const pageQueryOptionResolvers = createPageQueryTableOptionResolvers<
      Record<string, unknown>,
      Parameters<typeof resolveTableStripeConfig>[0],
      NonNullable<Parameters<typeof resolveTableStripeConfig>[1]>
    >({
      normalizeFormOptions: normalizePageQueryFormOptions,
      resolveStripeConfig: resolveTableStripeConfig,
    });
    /**
     * Page 语言版本号订阅值。
     */
    const pageLocaleVersion = usePageLocaleVersion();
    /**
     * Table 语言版本号订阅值。
     */
    const tableLocaleVersion = useTableLocaleVersion();
    /**
     * 偏好中心语言订阅值。
     */
    const preferencesLocale = usePreferencesLocale();
    /**
     * 当前语言下的页面文案。
     */
    const localeText = computed(() => {
      /**
       * Page 文案订阅节拍。
       */
      const pageTick = pageLocaleVersion.value;
      /**
       * Table 文案订阅节拍。
       */
      const tableTick = tableLocaleVersion.value;
      void pageTick;
      void tableTick;
      return getLocaleMessages().page as Record<string, string>;
    });
    /**
     * 偏好语言下的页面文案。
     * @description 优先使用用户偏好语言，未设置时回退到表格当前语言。
     */
    const preferredLocaleText = computed(() => {
      /**
       * Page 文案订阅节拍。
       */
      const pageTick = pageLocaleVersion.value;
      /**
       * Table 文案订阅节拍。
       */
      const tableTick = tableLocaleVersion.value;
      /**
       * 偏好中心语言订阅值快照。
       */
      const preferenceLocale = preferencesLocale.value;
      void pageTick;
      void tableTick;
      void preferenceLocale;
      /**
       * 用于读取偏好文案的最终语言。
       */
      const resolvedPreferredLocale =
        preferencesLocale.value || getAdminTableVueSetupState().locale;
      return getLocaleMessages(
        resolvedPreferredLocale
      ).page as Record<string, string>;
    });
    /**
     * 布局模式标题文案集合。
     */
    const layoutModeTitles = computed(() =>
      resolvePageQueryTableLayoutModeTitles({
        localeText: localeText.value,
        preferredLocaleText: preferredLocaleText.value,
      })
    );

    /**
     * 惰性 API 持有器。
     * @description 统一管理内部创建的 form/table/api 资源与所有权。
     */
    const lazyApiOwner = createPageQueryTableLazyApiOwnerWithStripeDefaults<
      AdminFormApi,
      AdminTableApi<DataRecord, FormValuesRecord>,
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>
    >({
      ...pageQueryOptionResolvers,
      createFormApi: (formOptions) => createFormApi(formOptions),
      createTableApi: (tableOptions) =>
        createTableApi(
          tableOptions as CreateTableApiOptions
        ) as AdminTableApi<DataRecord, FormValuesRecord>,
      formOptions: () =>
        (props.formOptions ?? {}) as Record<string, unknown>,
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: () =>
        (props.tableOptions ?? {}) as Record<string, unknown>,
    });

    /**
     * 当前生效的表单 API。
     */
    const formApi = computed(() => {
      return props.api?.formApi ?? props.formApi ?? lazyApiOwner.ensureFormApi();
    });

    /**
     * 当前生效的表格 API。
     */
    const tableApi = computed(() => {
      return props.api?.tableApi ?? props.tableApi ?? lazyApiOwner.ensureTableApi();
    });

    /**
     * 表单-表格桥接配置。
     */
    const bridgeOptions = computed(() => normalizePageFormTableBridgeOptions(props.bridge));
    /**
     * 外部声明的固定模式偏好。
     */
    const preferredFixedMode = computed(() => resolvePageQueryTableFixed(props.fixed));
    /**
     * 外部显式指定的表格高度。
     */
    const explicitTableHeight = computed(() => resolvePageQueryTableHeight(props.tableHeight));
    /**
     * 内部固定模式开关状态。
     */
    const innerFixedMode = ref(preferredFixedMode.value);
    /**
     * 当前是否处于固定高度布局模式。
     * @description 显式设置 `tableHeight` 时强制走流式模式。
     */
    const fixedMode = computed(() =>
      explicitTableHeight.value === null && innerFixedMode.value
    );
    /** 组件根节点引用。 */
    const rootRef = ref<HTMLElement | null>(null);
    /** 固定模式下的根容器高度。 */
    const fixedRootHeight = ref<null | number>(null);
    /** 固定模式下的表格可用高度。 */
    const fixedTableHeight = ref<null | number>(null);
    /** 页面滚动锁状态缓存。 */
    const pageScrollLocksRef = ref<PageScrollLockState[]>([]);

    watch(
      preferredFixedMode,
      (value) => {
        innerFixedMode.value = value;
      },
      { immediate: true }
    );

    /**
     * 切换查询表格布局模式
     * @description 仅在未显式指定 `tableHeight` 时允许切换固定/流式模式。
     * @returns 无返回值。
     */
    const handleLayoutModeToggle = () => {
      if (explicitTableHeight.value !== null) {
        return;
      }
      innerFixedMode.value = !innerFixedMode.value;
    };

    /**
     * 解除页面滚动锁
     * @description 清空当前滚动锁目标并恢复滚动能力。
     * @returns 无返回值。
     */
    const unlockPageScroll = () => {
      pageScrollLocksRef.value = reconcilePageScrollLocks(
        pageScrollLocksRef.value,
        []
      );
    };

    /**
     * 应用页面滚动锁
     * @description 固定模式下锁定主滚动容器，非固定模式时自动解除锁定。
     * @returns 无返回值。
     */
    const lockPageScroll = () => {
      if (!fixedMode.value) {
        unlockPageScroll();
        return;
      }
      /**
       * 固定模式下需要加锁的滚动目标。
       */
      const lockTargets = resolvePageScrollLockTargets(rootRef.value);
      pageScrollLocksRef.value = reconcilePageScrollLocks(
        pageScrollLocksRef.value,
        lockTargets
      );
    };

    /**
     * 计算并更新固定高度
     * @description 测量根容器可用高度并同步固定根高与表格高度状态。
     * @returns 无返回值。
     */
    const updateFixedHeight = () => {
      if (!fixedMode.value) {
        fixedRootHeight.value = null;
        fixedTableHeight.value = null;
        return;
      }
      if (typeof window === 'undefined') {
        return;
      }
      const measureElement = rootRef.value;
      if (!measureElement) {
        return;
      }
      /**
       * 解析后的固定根高。
       */
      const resolvedFixedHeight =
        resolveBestFixedHeight(measureElement);
      if (resolvedFixedHeight !== null) {
        /**
         * 与视口约束合并后的固定根高。
         */
        const nextFixedHeight =
          clampFixedHeightToViewport(measureElement, resolvedFixedHeight)
          ?? resolvedFixedHeight;
        /**
         * 固定模式下可分配给表格的高度。
         */
        const nextTableHeight = resolveFixedTableHeight(
          measureElement,
          nextFixedHeight
        );
        if (!isHeightAlmostEqual(fixedRootHeight.value, nextFixedHeight)) {
          fixedRootHeight.value = nextFixedHeight;
        }
        if (!isHeightAlmostEqual(fixedTableHeight.value, nextTableHeight)) {
          fixedTableHeight.value = nextTableHeight;
        }
        return;
      }
      if (fixedRootHeight.value !== null) {
        fixedRootHeight.value = null;
      }
      if (fixedTableHeight.value !== null) {
        fixedTableHeight.value = null;
      }
    };
    /**
     * 固定高度帧调度器。
     */
    const fixedHeightFrameScheduler = createPageQueryFrameScheduler(
      updateFixedHeight
    );
    /**
     * 调度稳定帧高度更新
     * @description 在指定帧次数内连续调度高度计算，降低首次渲染抖动。
     * @param frames 调度帧数。
     * @returns 无返回值。
     */
    const scheduleStabilizedFixedHeightUpdate = (frames = 2) => {
      fixedHeightFrameScheduler.schedule(frames);
    };

    /**
     * 组件根节点 class。
     */
    const rootClass = computed(() => {
      return [
        'admin-page-query-table',
        fixedMode.value
          ? 'admin-page-query-table--fixed'
          : 'admin-page-query-table--flow',
        props.className,
        attrs.class,
      ];
    });

    /**
     * 组件根节点 style。
     * @description 注入固定布局 CSS 变量，驱动容器与表格高度联动。
     */
    const rootStyle = computed(() => {
      return [
        attrs.style,
        props.style,
        resolvePageQueryTableRootStyleVariables({
          fixedMode: fixedMode.value,
          fixedRootHeight: fixedRootHeight.value,
          fixedTableHeight: fixedTableHeight.value,
        }),
      ];
    });

    /**
     * 组合后的查询表单配置。
     * @description 在固定布局下拦截折叠事件以触发稳定帧重算。
     */
    const resolvedFormOptions = computed(() => {
      /**
       * 桥接处理后的查询表单配置。
       */
      const resolvedOptions = resolvePageQueryFormOptionsWithBridge({
        bridge: bridgeOptions.value,
        formApi: formApi.value,
        formOptions: (props.formOptions ?? {}) as Record<string, unknown>,
        normalizeFormOptions: pageQueryOptionResolvers.normalizeFormOptions,
        tableApi: tableApi.value,
      }) as Record<string, unknown>;
      if (!fixedMode.value) {
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
          schedulePageQueryStabilizedRecalc(
            scheduleStabilizedFixedHeightUpdate
          );
        },
      };
    });

    /**
     * 组合后的表格展示配置。
     */
    const resolvedTableOptions = computed(() => {
      return resolvePageQueryTableDisplayOptionsWithStripeDefaults({
        explicitTableHeight: explicitTableHeight.value,
        fixedMode: fixedMode.value,
        fixedTableHeight: fixedTableHeight.value,
        layoutModeTitleToFixed: layoutModeTitles.value.layoutModeTitleToFixed,
        layoutModeTitleToFlow: layoutModeTitles.value.layoutModeTitleToFlow,
        onLayoutModeToggle: handleLayoutModeToggle,
        resolveStripeConfig: pageQueryOptionResolvers.resolveStripeConfig,
        stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
        tableOptions: (props.tableOptions ?? {}) as Record<string, unknown>,
      });
    });

    /**
     * 透传到 `AdminTable` 的扩展插槽。
     * @description 排除本组件内部占用的 `form/table` 插槽。
     */
    const forwardedTableSlots = computed(() => {
      return Object.fromEntries(
        Object.entries(slots).filter(([name]) => !['form', 'table'].includes(name))
      ) as Record<string, (...args: unknown[]) => VNodeChild>;
    });

    /**
     * 对外暴露的组合页 API。
     */
    const internalApi = computed(() =>
      createPageQueryTableApi(formApi.value, tableApi.value)
    );

    expose({
      getApi: () => internalApi.value,
      getFormApi: () => formApi.value,
      getTableApi: () => tableApi.value,
    });

    /**
     * 组件卸载前释放内部持有的 form/table API。
     */
    onBeforeUnmount(() => {
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
    });

    /**
     * 窗口尺寸监听清理函数。
     */
    let cleanupResizeListener: null | (() => void) = null;
    /**
     * 根容器尺寸观察器实例。
     */
    let resizeObserver: null | ResizeObserver = null;
    /**
     * 组件挂载后初始化固定高度与滚动锁逻辑。
     * @description 绑定窗口与容器尺寸监听，首次执行高度测量，并触发稳定帧重算。
     * @returns 无返回值。
     */
    onMounted(() => {
      if (typeof window === 'undefined') {
        return;
      }
      /**
       * 处理窗口尺寸变化
       * @description 尺寸变化时触发固定高度稳定重算。
       * @returns 无返回值。
       */
      const scheduleUpdate = () => {
        scheduleStabilizedFixedHeightUpdate(2);
      };
      window.addEventListener('resize', scheduleUpdate, { passive: true });
      if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
        resizeObserver = new ResizeObserver(() => {
          scheduleStabilizedFixedHeightUpdate(2);
        });
        /**
         * 需要观察的尺寸变化目标集合。
         */
        const targets = new Set<HTMLElement>();
        targets.add(rootRef.value);
        if (rootRef.value.parentElement) {
          targets.add(rootRef.value.parentElement);
        }
        /**
         * 主滚动容器。
         */
        const primaryContainer = resolvePrimaryPageScrollContainer(rootRef.value);
        if (primaryContainer) {
          targets.add(primaryContainer);
        }
        /**
         * 查询表单容器。
         */
        const formElement = rootRef.value.querySelector(
          '.admin-page-query-table__form'
        ) as HTMLElement | null;
        if (formElement) {
          targets.add(formElement);
        }
        for (const target of targets) {
          resizeObserver.observe(target);
        }
      }
      cleanupResizeListener = () => {
        window.removeEventListener('resize', scheduleUpdate);
      };
      lockPageScroll();
      updateFixedHeight();
      scheduleStabilizedFixedHeightUpdate(4);
    });

    /**
     * KeepAlive 激活时恢复滚动锁并重新测量固定高度。
     * @returns 无返回值。
     */
    onActivated(() => {
      if (!fixedMode.value) {
        unlockPageScroll();
        return;
      }
      void nextTick(() => {
        lockPageScroll();
        updateFixedHeight();
        scheduleStabilizedFixedHeightUpdate(4);
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            scheduleStabilizedFixedHeightUpdate(2);
          });
        }
      });
    });

    /**
     * KeepAlive 失活时解除页面滚动锁。
     * @returns 无返回值。
     */
    onDeactivated(() => {
      unlockPageScroll();
    });

    /**
     * 监听固定模式变化并执行对应副作用。
     * @description 进入固定模式时重建滚动锁与高度，退出时清理固定高度状态。
     */
    watch(
      fixedMode,
      () => {
        if (!fixedMode.value) {
          fixedRootHeight.value = null;
          fixedTableHeight.value = null;
          unlockPageScroll();
          return;
        }
        void nextTick(() => {
          lockPageScroll();
          updateFixedHeight();
          scheduleStabilizedFixedHeightUpdate(4);
          if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
              scheduleStabilizedFixedHeightUpdate(2);
            });
          }
        });
      },
      { immediate: true }
    );

    /**
     * 组件最终卸载前清理监听器与调度器。
     * @returns 无返回值。
     */
    onBeforeUnmount(() => {
      cleanupResizeListener?.();
      resizeObserver?.disconnect();
      resizeObserver = null;
      fixedHeightFrameScheduler.cancel();
      unlockPageScroll();
    });

    return () => {
      const formNode: VNodeChild = slots.form
        ? slots.form({
            formApi: formApi.value,
            tableApi: tableApi.value,
          })
        : h(AdminSearchForm as unknown as Component, {
            ...(resolvedFormOptions.value as Record<string, unknown>),
            formApi: formApi.value,
          });

      const tableNode: VNodeChild = slots.table
        ? slots.table({
            formApi: formApi.value,
            tableApi: tableApi.value,
          })
        : h(
            AdminTable as unknown as Component,
            {
              ...(resolvedTableOptions.value as Record<string, unknown>),
              api: tableApi.value,
            },
            forwardedTableSlots.value
          );

      return h(
        'div',
        {
          class: rootClass.value,
          ref: rootRef,
          style: rootStyle.value,
        },
        [
          h('div', { class: 'admin-page-query-table__form' }, formNode ?? undefined),
          h(
            'div',
            {
              class: 'admin-page-query-table__table',
            },
            tableNode ?? undefined
          ),
        ]
      );
    };
  },
});

/**
 * Query + Table 组合页 API 创建函数（Vue 导出别名）。
 */
export {
  createPageQueryTableApi as createAdminPageQueryTableApi,
};
