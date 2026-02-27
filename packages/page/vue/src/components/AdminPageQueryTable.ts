import type {
  AdminPageQueryTableApi,
  AdminPageQueryTableVueProps,
} from '../types';
import type { AdminFormApi } from '@admin-core/form-vue';
import type { PropType } from 'vue';

import {
  AdminSearchForm,
  createFormApi,
} from '@admin-core/form-vue';
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
  type AdminTableApi,
  createTableApi,
  resolveTableStripeConfig,
} from '@admin-core/table-vue';
import {
  computed,
  defineComponent,
  h,
  onActivated,
  onUpdated,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onMounted,
  ref,
  watch,
} from 'vue';
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

function normalizeFixedHeightToDevicePixel(height: number) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }
  const dpr = typeof window !== 'undefined' && window.devicePixelRatio > 0
    ? window.devicePixelRatio
    : 1;
  return Math.max(1, Math.round(height * dpr) / dpr);
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

function resolveViewportHeight() {
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
  const nextHeight = visibleBottom
    - elementTop
    - FIXED_HEIGHT_SAFE_GAP;
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
    const lazyApiOwner = createPageQueryTableLazyApiOwner<
      AdminFormApi,
      AdminTableApi<DataRecord, FormValuesRecord>
    >({
      createFormApi: () =>
        createFormApi(
          normalizePageQueryFormOptions(
            (props.formOptions ?? {}) as Record<string, any>
          )
        ),
      createTableApi: () =>
        createTableApi(
          resolvePageQueryTableOptionsWithStripeDefaults(
            (props.tableOptions ?? {}) as Record<string, any>,
            (stripe: unknown, stripeDefaults: Record<string, any>) =>
              resolveTableStripeConfig(stripe as any, stripeDefaults as any),
            DEFAULT_PAGE_QUERY_TABLE_STRIPE_OPTIONS
          ) as any
        ) as AdminTableApi<DataRecord, FormValuesRecord>,
    });

    const formApi = computed(() => {
      return props.api?.formApi ?? props.formApi ?? lazyApiOwner.ensureFormApi();
    });

    const tableApi = computed(() => {
      return props.api?.tableApi ?? props.tableApi ?? lazyApiOwner.ensureTableApi();
    });

    const bridgeOptions = computed(() => normalizePageFormTableBridgeOptions(props.bridge));
    const fixedMode = computed(() => resolvePageQueryTableFixed(props.fixed));
    const rootRef = ref<HTMLElement | null>(null);
    const fixedRootHeight = ref<null | number>(null);
    const fixedTableHeight = ref<null | number>(null);
    const pageScrollLocksRef = ref<
      Array<{ element: HTMLElement; overflowX: string; overflowY: string }>
    >([]);
    let fixedHeightRafId: null | number = null;
    let fixedHeightFrameBudget = 0;

    const unlockPageScroll = () => {
      if (pageScrollLocksRef.value.length <= 0) {
        return;
      }
      for (const lock of pageScrollLocksRef.value) {
        lock.element.style.overflowY = lock.overflowY;
        lock.element.style.overflowX = lock.overflowX;
        lock.element.removeAttribute(PAGE_SCROLL_LOCK_ATTR);
      }
      pageScrollLocksRef.value = [];
    };

    const lockPageScroll = () => {
      if (!fixedMode.value) {
        unlockPageScroll();
        return;
      }
      const lockTargets = resolvePageScrollLockTargets(rootRef.value);
      if (lockTargets.length <= 0) {
        return;
      }
      unlockPageScroll();
      pageScrollLocksRef.value = lockTargets.map((target) => ({
        element: target,
        overflowX: target.style.overflowX ?? '',
        overflowY: target.style.overflowY ?? '',
      }));
      for (const lock of pageScrollLocksRef.value) {
        lock.element.style.overflowY = 'hidden';
        lock.element.style.overflowX = 'hidden';
        lock.element.setAttribute(PAGE_SCROLL_LOCK_ATTR, 'true');
        if (lock.element.scrollTop > 0) {
          lock.element.scrollTop = 0;
        }
      }
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
        fixedRootHeight.value = resolvedFixedHeight;
        fixedTableHeight.value = resolveFixedTableHeight(
          measureElement,
          resolvedFixedHeight
        );
        return;
      }
      fixedRootHeight.value = null;
      fixedTableHeight.value = null;
    };

    const runStabilizedFixedHeightUpdate = () => {
      updateFixedHeight();
      if (fixedHeightFrameBudget <= 0) {
        fixedHeightRafId = null;
        return;
      }
      fixedHeightFrameBudget -= 1;
      fixedHeightRafId = window.requestAnimationFrame(runStabilizedFixedHeightUpdate);
    };

    const scheduleStabilizedFixedHeightUpdate = (frames = 8) => {
      if (typeof window === 'undefined') {
        return;
      }
      fixedHeightFrameBudget = Math.max(
        fixedHeightFrameBudget,
        Math.max(0, Math.floor(frames))
      );
      if (fixedHeightRafId !== null) {
        return;
      }
      fixedHeightRafId = window.requestAnimationFrame(runStabilizedFixedHeightUpdate);
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
      const fixedHeightStyle = {
        '--admin-page-query-table-fixed-root-height':
          fixedMode.value && fixedRootHeight.value !== null
            ? `${fixedRootHeight.value}px`
            : undefined,
      };
      const fixedTableHeightStyle = {
        '--admin-page-query-table-fixed-table-height':
          fixedMode.value && fixedTableHeight.value !== null
            ? `${fixedTableHeight.value}px`
            : undefined,
      };
      return [attrs.style, props.style, fixedHeightStyle, fixedTableHeightStyle];
    });

    const resolvedFormOptions = computed(() => {
      return resolvePageQueryFormOptionsWithBridge({
        bridge: bridgeOptions.value as any,
        formApi: formApi.value,
        formOptions: (props.formOptions ?? {}) as Record<string, any>,
        normalizeFormOptions: (formOptions) =>
          normalizePageQueryFormOptions(formOptions as Record<string, any>),
        tableApi: tableApi.value as any,
      });
    });

    const resolvedTableOptions = computed(() => {
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
      if (!fixedMode.value) {
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
    });

    const forwardedTableSlots = computed(() => {
      return Object.fromEntries(
        Object.entries(slots).filter(([name]) => !['form', 'table'].includes(name))
      ) as Record<string, (...args: any[]) => any>;
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
        scheduleStabilizedFixedHeightUpdate(6);
      };
      window.addEventListener('resize', scheduleUpdate, { passive: true });
      if (typeof ResizeObserver !== 'undefined' && rootRef.value) {
        resizeObserver = new ResizeObserver(() => {
          scheduleStabilizedFixedHeightUpdate(6);
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
      scheduleStabilizedFixedHeightUpdate(12);
    });

    onActivated(() => {
      if (!fixedMode.value) {
        unlockPageScroll();
        return;
      }
      void nextTick(() => {
        lockPageScroll();
        updateFixedHeight();
        scheduleStabilizedFixedHeightUpdate(12);
        if (typeof window !== 'undefined') {
          window.requestAnimationFrame(() => {
            scheduleStabilizedFixedHeightUpdate(8);
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
          scheduleStabilizedFixedHeightUpdate(12);
          if (typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
              scheduleStabilizedFixedHeightUpdate(8);
            });
          }
        });
      },
      { immediate: true }
    );

    onUpdated(() => {
      if (!fixedMode.value) {
        return;
      }
      updateFixedHeight();
      scheduleStabilizedFixedHeightUpdate(2);
    });

    onBeforeUnmount(() => {
      cleanupResizeListener?.();
      resizeObserver?.disconnect();
      resizeObserver = null;
      if (typeof window !== 'undefined' && fixedHeightRafId !== null) {
        window.cancelAnimationFrame(fixedHeightRafId);
      }
      fixedHeightRafId = null;
      fixedHeightFrameBudget = 0;
      unlockPageScroll();
    });

    return () => {
      const formNode = slots.form
        ? slots.form({
            formApi: formApi.value,
            tableApi: tableApi.value,
          })
        : h(AdminSearchForm as any, {
            ...(resolvedFormOptions.value as any),
            formApi: formApi.value,
          });

      const tableNode = slots.table
        ? slots.table({
            formApi: formApi.value,
            tableApi: tableApi.value,
          })
        : h(
            AdminTable as any,
            {
              ...(resolvedTableOptions.value as any),
              api: tableApi.value,
            },
            forwardedTableSlots.value
          );

      return h(
        'div',
        {
          class: rootClass.value,
          ref: rootRef,
          style: rootStyle.value as any,
        },
        [
          h('div', { class: 'admin-page-query-table__form' }, formNode as any),
          h(
            'div',
            {
              class: 'admin-page-query-table__table',
            },
            tableNode as any
          ),
        ]
      );
    };
  },
});
