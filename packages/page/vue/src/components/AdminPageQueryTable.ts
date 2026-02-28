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
import { normalizePageQueryFormOptions } from '../utils/query-form-options';

type DataRecord = Record<string, unknown>;
type FormValuesRecord = Record<string, unknown>;

export const AdminPageQueryTable = defineComponent({
  name: 'AdminPageQueryTable',
  inheritAttrs: false,
  props: {
    api: {
      default: undefined,
      type: Object as PropType<AdminPageQueryTableApi<DataRecord, FormValuesRecord>>,
    },
    bridge: {
      default: undefined,
      type: [Boolean, Object] as PropType<AdminPageQueryTableVueProps['bridge']>,
    },
    className: {
      default: undefined,
      type: String,
    },
    formApi: {
      default: undefined,
      type: Object as PropType<AdminFormApi>,
    },
    formOptions: {
      default: undefined,
      type: Object as PropType<NonNullable<AdminPageQueryTableVueProps['formOptions']>>,
    },
    fixed: {
      default: DEFAULT_PAGE_QUERY_TABLE_FIXED,
      type: Boolean,
    },
    tableHeight: {
      default: undefined,
      type: [Number, String] as PropType<
        NonNullable<AdminPageQueryTableVueProps['tableHeight']>
      >,
    },
    style: {
      default: undefined,
      type: Object as PropType<NonNullable<AdminPageQueryTableVueProps['style']>>,
    },
    tableApi: {
      default: undefined,
      type: Object as PropType<AdminTableApi<DataRecord, FormValuesRecord>>,
    },
    tableOptions: {
      default: undefined,
      type: Object as PropType<NonNullable<AdminPageQueryTableVueProps['tableOptions']>>,
    },
  },
  setup(props, { attrs, expose, slots }) {
    type CreateTableApiOptions = Parameters<
      typeof createTableApi<DataRecord, FormValuesRecord>
    >[0];
    type StripeResolveDefaults = Parameters<typeof resolveTableStripeConfig>[1];
    const pageLocaleVersion = usePageLocaleVersion();
    const tableLocaleVersion = useTableLocaleVersion();
    const preferencesLocale = usePreferencesLocale();
    const localeText = computed(() => {
      const pageTick = pageLocaleVersion.value;
      const tableTick = tableLocaleVersion.value;
      void pageTick;
      void tableTick;
      return getLocaleMessages().page as Record<string, string>;
    });
    const preferredLocaleText = computed(() => {
      const pageTick = pageLocaleVersion.value;
      const tableTick = tableLocaleVersion.value;
      const preferenceLocale = preferencesLocale.value;
      void pageTick;
      void tableTick;
      void preferenceLocale;
      const resolvedPreferredLocale =
        preferencesLocale.value || getAdminTableVueSetupState().locale;
      return getLocaleMessages(
        resolvedPreferredLocale
      ).page as Record<string, string>;
    });
    const layoutModeTitles = computed(() =>
      resolvePageQueryTableLayoutModeTitles({
        localeText: localeText.value,
        preferredLocaleText: preferredLocaleText.value,
      })
    );

    const lazyApiOwner = createPageQueryTableLazyApiOwnerWithStripeDefaults<
      AdminFormApi,
      AdminTableApi<DataRecord, FormValuesRecord>,
      Record<string, unknown>,
      Record<string, unknown>,
      Record<string, unknown>
    >({
      createFormApi: (formOptions) => createFormApi(formOptions),
      createTableApi: (tableOptions) =>
        createTableApi(
          tableOptions as CreateTableApiOptions
        ) as AdminTableApi<DataRecord, FormValuesRecord>,
      formOptions: () =>
        (props.formOptions ?? {}) as Record<string, unknown>,
      normalizeFormOptions: (formOptions) =>
        normalizePageQueryFormOptions(
          (formOptions ?? {}) as Record<string, unknown>
        ),
      resolveStripeConfig: (stripe: unknown, stripeDefaults: Record<string, unknown>) =>
        resolveTableStripeConfig(
          stripe as Parameters<typeof resolveTableStripeConfig>[0],
          stripeDefaults as StripeResolveDefaults
        ),
      stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
      tableOptions: () =>
        (props.tableOptions ?? {}) as Record<string, unknown>,
    });

    const formApi = computed(() => {
      return props.api?.formApi ?? props.formApi ?? lazyApiOwner.ensureFormApi();
    });

    const tableApi = computed(() => {
      return props.api?.tableApi ?? props.tableApi ?? lazyApiOwner.ensureTableApi();
    });

    const bridgeOptions = computed(() => normalizePageFormTableBridgeOptions(props.bridge));
    const preferredFixedMode = computed(() => resolvePageQueryTableFixed(props.fixed));
    const explicitTableHeight = computed(() => resolvePageQueryTableHeight(props.tableHeight));
    const innerFixedMode = ref(preferredFixedMode.value);
    const fixedMode = computed(() =>
      explicitTableHeight.value === null && innerFixedMode.value
    );
    const rootRef = ref<HTMLElement | null>(null);
    const fixedRootHeight = ref<null | number>(null);
    const fixedTableHeight = ref<null | number>(null);
    const pageScrollLocksRef = ref<PageScrollLockState[]>([]);

    watch(
      preferredFixedMode,
      (value) => {
        innerFixedMode.value = value;
      },
      { immediate: true }
    );

    const handleLayoutModeToggle = () => {
      if (explicitTableHeight.value !== null) {
        return;
      }
      innerFixedMode.value = !innerFixedMode.value;
    };

    const unlockPageScroll = () => {
      pageScrollLocksRef.value = reconcilePageScrollLocks(
        pageScrollLocksRef.value,
        []
      );
    };

    const lockPageScroll = () => {
      if (!fixedMode.value) {
        unlockPageScroll();
        return;
      }
      const lockTargets = resolvePageScrollLockTargets(rootRef.value);
      pageScrollLocksRef.value = reconcilePageScrollLocks(
        pageScrollLocksRef.value,
        lockTargets
      );
    };

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
      const resolvedFixedHeight =
        resolveBestFixedHeight(measureElement);
      if (resolvedFixedHeight !== null) {
        const nextFixedHeight =
          clampFixedHeightToViewport(measureElement, resolvedFixedHeight)
          ?? resolvedFixedHeight;
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
    const fixedHeightFrameScheduler = createPageQueryFrameScheduler(
      updateFixedHeight
    );
    const scheduleStabilizedFixedHeightUpdate = (frames = 2) => {
      fixedHeightFrameScheduler.schedule(frames);
    };

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

    const resolvedFormOptions = computed(() => {
      const resolvedOptions = resolvePageQueryFormOptionsWithBridge({
        bridge: bridgeOptions.value,
        formApi: formApi.value,
        formOptions: (props.formOptions ?? {}) as Record<string, unknown>,
        normalizeFormOptions: (formOptions) =>
          normalizePageQueryFormOptions(formOptions as Record<string, unknown>),
        tableApi: tableApi.value,
      }) as Record<string, unknown>;
      if (!fixedMode.value) {
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
          schedulePageQueryStabilizedRecalc(
            scheduleStabilizedFixedHeightUpdate
          );
        },
      };
    });

    const resolvedTableOptions = computed(() => {
      return resolvePageQueryTableDisplayOptionsWithStripeDefaults({
        explicitTableHeight: explicitTableHeight.value,
        fixedMode: fixedMode.value,
        fixedTableHeight: fixedTableHeight.value,
        layoutModeTitleToFixed: layoutModeTitles.value.layoutModeTitleToFixed,
        layoutModeTitleToFlow: layoutModeTitles.value.layoutModeTitleToFlow,
        onLayoutModeToggle: handleLayoutModeToggle,
        resolveStripeConfig: (
          stripe: unknown,
          stripeDefaults: Record<string, unknown>
        ) =>
          resolveTableStripeConfig(
            stripe as Parameters<typeof resolveTableStripeConfig>[0],
            stripeDefaults as StripeResolveDefaults
          ),
        stripeDefaults: DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS,
        tableOptions: (props.tableOptions ?? {}) as Record<string, unknown>,
      });
    });

    const forwardedTableSlots = computed(() => {
      return Object.fromEntries(
        Object.entries(slots).filter(([name]) => !['form', 'table'].includes(name))
      ) as Record<string, (...args: unknown[]) => VNodeChild>;
    });

    const internalApi = computed(() =>
      createPageQueryTableApi(formApi.value, tableApi.value)
    );

    expose({
      getApi: () => internalApi.value,
      getFormApi: () => formApi.value,
      getTableApi: () => tableApi.value,
    });

    onBeforeUnmount(() => {
      const ownedState = lazyApiOwner.getOwnedState();
      cleanupPageQueryTableApis({
        formApi: ownedState.formApi,
        ownsFormApi: ownedState.ownsFormApi,
        ownsTableApi: ownedState.ownsTableApi,
        tableApi: ownedState.tableApi,
      });
    });

    let cleanupResizeListener: null | (() => void) = null;
    let resizeObserver: null | ResizeObserver = null;
    onMounted(() => {
      if (typeof window === 'undefined') {
        return;
      }
      const scheduleUpdate = () => {
        scheduleStabilizedFixedHeightUpdate(2);
      };
      window.addEventListener('resize', scheduleUpdate, { passive: true });
      if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
        resizeObserver = new ResizeObserver(() => {
          scheduleStabilizedFixedHeightUpdate(2);
        });
        const targets = new Set<HTMLElement>();
        targets.add(rootRef.value);
        if (rootRef.value.parentElement) {
          targets.add(rootRef.value.parentElement);
        }
        const primaryContainer = resolvePrimaryPageScrollContainer(rootRef.value);
        if (primaryContainer) {
          targets.add(primaryContainer);
        }
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

    onDeactivated(() => {
      unlockPageScroll();
    });

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

export {
  createPageQueryTableApi as createAdminPageQueryTableApi,
};
