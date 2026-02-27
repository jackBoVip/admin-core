import type {
  AdminTabsOptions,
} from '@admin-core/tabs-core';
import type {
  AdminTabVueItem,
  AdminTabsChangePayload,
  AdminTabsClosePayload,
} from '../types';
import type {
  CSSProperties,
  PropType,
  StyleValue,
} from 'vue';

import {
  createAdminTabsChangePayload,
  createAdminTabsClosePayload,
  getAdminTabsLocale,
  resolveAdminTabsItemsSignature,
  normalizeAdminTabsOptions,
  resolveAdminTabsOptionsWithDefaults,
  resolveAdminTabsActiveItem,
  resolveAdminTabsRootClassNames,
  resolveAdminTabsSelectedActiveKey,
  resolveAdminTabsShowClose,
  resolveAdminTabsStyleVars,
  resolveAdminTabsUncontrolledActiveKey,
  resolveAdminTabsVisible,
  subscribeAdminTabsLocale,
} from '@admin-core/tabs-core';
import {
  computed,
  defineComponent,
  h,
  onScopeDispose,
  ref,
  watch,
} from 'vue';

import { getAdminTabsVueSetupState } from '../setup';

const VUE_TABS_DEFAULTS: Partial<AdminTabsOptions> = {
  contentInsetTop: -30,
};

export const AdminTabs = defineComponent({
  name: 'AdminTabs',
  inheritAttrs: false,
  props: {
    activeKey: {
      default: undefined,
      type: String as PropType<null | string | undefined>,
    },
    className: {
      default: undefined,
      type: String,
    },
    closeAriaLabel: {
      default: undefined,
      type: String,
    },
    defaultActiveKey: {
      default: undefined,
      type: String as PropType<null | string | undefined>,
    },
    items: {
      default: () => [],
      type: Array as PropType<AdminTabVueItem[]>,
    },
    style: {
      default: undefined,
      type: Object as PropType<CSSProperties>,
    },
    tabs: {
      default: undefined,
      type: [Boolean, Object] as PropType<boolean | AdminTabsOptions>,
    },
  },
  emits: {
    change: (_payload: AdminTabsChangePayload) => true,
    close: (_payload: AdminTabsClosePayload) => true,
  },
  setup(props, { attrs, emit }) {
    const isControlled = computed(() => props.activeKey !== undefined);
    const internalActiveKey = ref<null | string>(null);
    const localeCloseLabel = ref(getAdminTabsLocale().close);

    const unsubscribeLocale = subscribeAdminTabsLocale(() => {
      localeCloseLabel.value = getAdminTabsLocale().close;
    });
    onScopeDispose(() => {
      unsubscribeLocale();
    });

    const mergedTabs = computed(() => {
      const setupState = getAdminTabsVueSetupState();
      const rawTabs = props.tabs ?? setupState.defaults.tabs;
      return resolveAdminTabsOptionsWithDefaults(rawTabs, VUE_TABS_DEFAULTS);
    });
    const normalizedTabs = computed(() => {
      return normalizeAdminTabsOptions(mergedTabs.value);
    });

    const mergedDefaultActiveKey = computed<null | string>(() => {
      const setupState = getAdminTabsVueSetupState();
      return props.defaultActiveKey ?? setupState.defaults.defaultActiveKey ?? null;
    });

    const closeAriaLabel = computed(() => {
      const setupState = getAdminTabsVueSetupState();
      return (
        props.closeAriaLabel ??
        setupState.defaults.closeAriaLabel ??
        localeCloseLabel.value
      );
    });

    const showTabs = computed(() => {
      return resolveAdminTabsVisible(normalizedTabs.value, props.items);
    });

    const rootClass = computed(() => {
      return [
        ...resolveAdminTabsRootClassNames(normalizedTabs.value),
        props.className,
        attrs.class,
      ];
    });

    const rootStyle = computed(() => {
      const attrsStyle = attrs.style as StyleValue;
      return [
        resolveAdminTabsStyleVars(normalizedTabs.value),
        props.style as StyleValue,
        attrsStyle,
      ] as StyleValue;
    });

    const itemKeysSignature = computed(() => {
      return resolveAdminTabsItemsSignature(props.items);
    });

    watch(
      [itemKeysSignature, mergedDefaultActiveKey, isControlled],
      () => {
        if (isControlled.value) {
          return;
        }

        const items = props.items ?? [];
        const nextValue = resolveAdminTabsUncontrolledActiveKey(
          items,
          internalActiveKey.value,
          mergedDefaultActiveKey.value
        );
        if (nextValue !== internalActiveKey.value) {
          internalActiveKey.value = nextValue;
        }
      },
      { immediate: true }
    );

    const selectedActiveKey = computed<null | string>(() => {
      return resolveAdminTabsSelectedActiveKey(props.items, {
        controlledActiveKey: props.activeKey ?? null,
        isControlled: isControlled.value,
        uncontrolledActiveKey: internalActiveKey.value,
      });
    });

    const emitChange = (item: AdminTabVueItem) => {
      if (!isControlled.value) {
        internalActiveKey.value = item.key;
      }
      const payload: AdminTabsChangePayload = createAdminTabsChangePayload(
        props.items,
        item.key
      );
      emit('change', payload);
    };

    const emitClose = (item: AdminTabVueItem) => {
      const payload: AdminTabsClosePayload = createAdminTabsClosePayload(item);
      emit('close', payload);
    };

    const activeItem = computed<AdminTabVueItem | null>(() => {
      return resolveAdminTabsActiveItem(props.items, selectedActiveKey.value);
    });

    const contentNode = computed(() => {
      const item = activeItem.value;
      if (!item?.component) {
        return null;
      }
      return h(item.component, item.componentProps ?? {});
    });

    return () => {
      const items = props.items ?? [];
      const showClose = resolveAdminTabsShowClose(items);

      const tabsNode = showTabs.value
        ? h(
            'div',
            {
              class: rootClass.value,
              style: rootStyle.value,
            },
            items.map((item) => {
              const isActive = item.key === selectedActiveKey.value;

              return h(
                'button',
                {
                  key: item.key,
                  class: ['admin-tabs__tab', { 'is-active': isActive }],
                  disabled: item.disabled,
                  type: 'button',
                  onClick: () => emitChange(item),
                },
                [
                  h('span', { class: 'admin-tabs__tab-label-wrap' }, [
                    h('span', { class: 'admin-tabs__tab-label' }, item.title ?? item.key),
                    showClose && item.closable !== false
                      ? h(
                          'button',
                          {
                            'aria-label': closeAriaLabel.value,
                            class: 'admin-tabs__tab-close',
                            type: 'button',
                            onClick: (event: MouseEvent) => {
                              event.preventDefault();
                              event.stopPropagation();
                              emitClose(item);
                            },
                          },
                          '×'
                        )
                      : null,
                  ]),
                ]
              );
            })
          )
        : null;

      const activeContentNode = contentNode.value
        ? h('div', { class: 'admin-tabs__content' }, [contentNode.value])
        : null;

      if (tabsNode && activeContentNode) {
        return [tabsNode, activeContentNode];
      }
      return tabsNode ?? activeContentNode ?? null;
    };
  },
});
