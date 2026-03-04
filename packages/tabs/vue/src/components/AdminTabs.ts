/**
 * Tabs Vue 组件实现。
 * @description 负责渲染页签头、处理受控/非受控激活态并派发切换/关闭事件。
 */
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

/**
 * Vue 适配层注入的 Tabs 默认配置。
 * @description 用于在用户未显式传入 `tabs` 参数时统一补齐体验参数。
 */
const VUE_TABS_DEFAULTS: Partial<AdminTabsOptions> = {
  contentInsetTop: -30,
};

/**
 * Vue 版页签组件。
 * @description 支持受控/非受控激活态、关闭按钮与内容区域联动渲染。
 */
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
  /**
   * Tabs 组件组合逻辑。
   * @param props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(props, { attrs, emit }) {
    /**
     * 是否处于受控模式。
     */
    const isControlled = computed(() => props.activeKey !== undefined);
    /**
     * 非受控模式下的内部激活键。
     */
    const internalActiveKey = ref<null | string>(null);
    /**
     * 当前语言下的关闭按钮文案。
     */
    const localeCloseLabel = ref(getAdminTabsLocale().close);

    /**
     * 语言订阅解绑函数。
     * @description 监听语言变更并更新关闭按钮文案，作用域销毁时自动解绑。
     */
    const unsubscribeLocale = subscribeAdminTabsLocale(() => {
      localeCloseLabel.value = getAdminTabsLocale().close;
    });
    onScopeDispose(() => {
      unsubscribeLocale();
    });

    /**
     * 合并 setup 默认值后的 tabs 配置。
     */
    const mergedTabs = computed(() => {
      const setupState = getAdminTabsVueSetupState();
      const rawTabs = props.tabs ?? setupState.defaults.tabs;
      return resolveAdminTabsOptionsWithDefaults(rawTabs, VUE_TABS_DEFAULTS);
    });
    /**
     * 标准化后的 tabs 配置。
     */
    const normalizedTabs = computed(() => {
      return normalizeAdminTabsOptions(mergedTabs.value);
    });

    /**
     * 默认激活键（含 setup 默认值回退）。
     */
    const mergedDefaultActiveKey = computed<null | string>(() => {
      const setupState = getAdminTabsVueSetupState();
      return props.defaultActiveKey ?? setupState.defaults.defaultActiveKey ?? null;
    });

    /**
     * 关闭按钮 aria-label。
     */
    const closeAriaLabel = computed(() => {
      const setupState = getAdminTabsVueSetupState();
      return (
        props.closeAriaLabel ??
        setupState.defaults.closeAriaLabel ??
        localeCloseLabel.value
      );
    });

    /**
     * 是否显示页签头区域。
     */
    const showTabs = computed(() => {
      return resolveAdminTabsVisible(normalizedTabs.value, props.items);
    });

    /**
     * 根节点 class 列表。
     */
    const rootClass = computed(() => {
      return [
        ...resolveAdminTabsRootClassNames(normalizedTabs.value),
        props.className,
        attrs.class,
      ];
    });

    /**
     * 根节点 style 列表。
     */
    const rootStyle = computed(() => {
      const attrsStyle = attrs.style as StyleValue;
      return [
        resolveAdminTabsStyleVars(normalizedTabs.value),
        props.style as StyleValue,
        attrsStyle,
      ] as StyleValue;
    });

    /**
     * 页签项签名，用于变更检测。
     */
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

    /**
     * 最终激活键（兼容受控与非受控模式）。
     */
    const selectedActiveKey = computed<null | string>(() => {
      return resolveAdminTabsSelectedActiveKey(props.items, {
        controlledActiveKey: props.activeKey ?? null,
        isControlled: isControlled.value,
        uncontrolledActiveKey: internalActiveKey.value,
      });
    });

    /**
     * 派发页签切换事件。
     * @description 非受控模式下会先更新内部激活态，再派发标准化切换事件。
     *
     * @param item 被切换到的页签项。
     * @returns 无返回值。
     */
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

    /**
     * 派发页签关闭事件。
     *
     * @param item 被关闭的页签项。
     * @returns 无返回值。
     */
    const emitClose = (item: AdminTabVueItem) => {
      const payload: AdminTabsClosePayload = createAdminTabsClosePayload(item);
      emit('close', payload);
    };

    /**
     * 当前激活页签项。
     */
    const activeItem = computed<AdminTabVueItem | null>(() => {
      return resolveAdminTabsActiveItem(props.items, selectedActiveKey.value);
    });

    /**
     * 当前激活页签内容节点。
     */
    const contentNode = computed(() => {
      const item = activeItem.value;
      if (!item?.component) {
        return null;
      }
      return h(item.component, item.componentProps ?? {});
    });

    /**
     * 组件渲染函数。
     * @description 按显示策略输出页签头、激活内容或二者组合。
     *
     * @returns 组件根节点。
     */
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
