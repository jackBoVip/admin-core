/**
 * Vue 版 AdminPage 组件实现。
 * @description 负责页面容器渲染、API 状态同步、路由联动与 keep-inactive 面板复用。
 */

import type {
  AdminPageApi,
  AdminPageItem,
  KeepInactivePagePaneState,
  RoutePageItem,
} from '@admin-core/page-core';
import type {
  AdminPageVueProps,
  VuePageComponent,
} from '../types';
import type { Component, VNode, VNodeChild } from 'vue';

import {
  createPageApiWithRuntimeOptions,
  getLocaleMessages,
  reconcileKeepInactivePagePaneState,
  resolvePageActiveContent,
  resolvePageContentClassName,
  resolvePageItemContent,
  resolvePagePaneClassName,
  type PagePaneDescriptor,
  syncPageRuntimeState,
} from '@admin-core/page-core';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  type PropType,
  ref,
  shallowRef,
  watch,
} from 'vue';

import { useLocaleVersion } from '../composables/useLocaleVersion';
import '../styles/index.css';

/**
 * `AdminPage` Vue 组件属性。
 */
interface Props extends AdminPageVueProps {
  /** 外部传入的 Page API。 */
  api?: AdminPageApi<VuePageComponent>;
}
/**
 * 页面项类型别名。
 */
type PageItem = AdminPageItem<VuePageComponent>;
/**
 * Page 运行时计算快照结构。
 */
type PageComputedSnapshot = {
  /** 当前激活页面 key。 */
  activeKey: null | string;
  /** 当前激活页面。 */
  activePage: null | Record<string, unknown>;
  /** 页面列表。 */
  pages: Array<Record<string, unknown>>;
  /** 内容区域是否开启滚动。 */
  scrollEnabled: boolean;
};
/**
 * Page 运行时快照。
 */
type PageRuntimeSnapshot = {
  /** 计算态快照。 */
  computed: PageComputedSnapshot;
  /** 运行时 props。 */
  props: AdminPageVueProps;
};
/**
 * 页面内容渲染函数类型。
 */
type PageRenderFn = (page: PageItem) => undefined | VNodeChild;
/**
 * 渲染版本标识元组，用于缓存失效控制。
 */
type PageRenderVersion = readonly [
  number,
  Props['renderEmpty'],
  Props['renderRoutePage'],
  Props['routeFallback'],
];
/**
 * KeepInactive 模式下的面板状态类型别名。
 */
type KeepInactivePaneState = KeepInactivePagePaneState<VuePageComponent>;
/**
 * KeepAlive 节点缓存结构。
 */
type KeepAliveVNodeCache = {
  /** 当前面板描述列表。 */
  descriptors: KeepInactivePaneState['descriptors'];
  /** 缓存的 vnode 列表。 */
  nodes: VNodeChild[];
  /** 缓存对应的渲染版本。 */
  renderVersion: PageRenderVersion;
};

/**
 * 渲染 Vue 页面组件，统一兼容 vnode、组件对象与函数组件。
 * @param component 页面组件定义。
 * @param props 传递给组件的属性。
 * @returns 渲染结果。
 */
function renderVuePageComponent(
  component: VuePageComponent | undefined,
  props?: Record<string, unknown>
): undefined | VNodeChild {
  if (component === undefined || component === null) {
    return undefined;
  }
  if (isVNode(component)) {
    return component as VNode;
  }
  if (typeof component === 'object' || typeof component === 'function') {
    return h(component as unknown as Component, props ?? {});
  }
  return component as VNodeChild;
}

/**
 * Keep-Alive 页面面板组件。
 * @description 缓存非激活页面内容并按激活状态切换样式。
 */
const KeepAlivePane = defineComponent({
  name: 'AdminPageKeepAlivePane',
  props: {
    active: {
      required: true,
      type: Boolean,
    },
    activeTick: {
      required: true,
      type: Number,
    },
    page: {
      required: true,
      type: Object as PropType<PageItem>,
    },
    renderPage: {
      required: true,
      type: Function as PropType<PageRenderFn>,
    },
    renderVersion: {
      required: true,
      type: null as unknown as PropType<PageRenderVersion>,
    },
  },
  /**
   * Keep-alive 面板渲染逻辑。
   * @param props 组件属性。
   * @returns 渲染函数。
   */
  setup(props) {
    /**
     * Keep-alive 面板内容缓存引用。
     */
    const contentRef = shallowRef<undefined | VNodeChild>(undefined);

    watch(
      () =>
        [
          props.activeTick,
          props.page,
          props.renderPage,
          props.renderVersion,
        ] as const,
      ([, page, renderPage]) => {
        contentRef.value = renderPage(page);
      },
      { immediate: true }
    );

    /**
     * 当前面板 class。
     */
    const paneClass = computed(() => resolvePagePaneClassName(props.active));

    return () => h(
      'div',
      { class: paneClass.value },
      contentRef.value ?? undefined
    );
  },
});

/**
 * Vue 版 `AdminPage` 主组件。
 * @description 负责页面路由渲染、keep-alive 面板缓存与运行时状态同步。
 */
export const AdminPage = defineComponent(
  (props: Props, { attrs, slots }) => {
    /**
     * 内部创建的 Page API。
     * @description 当外部未传入 `api` 时作为组件运行时 API 使用。
     */
    const internalApi = createPageApiWithRuntimeOptions<VuePageComponent>(
      props as Record<string, unknown>
    );
    /**
     * 当前生效的 Page API 引用。
     * @description 优先使用外部注入 API，可在运行时动态切换。
     */
    const apiRef = shallowRef<AdminPageApi<VuePageComponent>>(
      props.api ?? internalApi
    );
    /**
     * 语言版本号订阅值，用于驱动文案渲染刷新。
     */
    const localeVersion = useLocaleVersion();
    /**
     * 运行时快照。
     * @description 保存 `api` 当前 `props/computed` 状态并驱动渲染。
     */
    const snapshot = ref<PageRuntimeSnapshot>(
      apiRef.value.getSnapshot() as unknown as PageRuntimeSnapshot
    );
    /**
     * API 是否已完成挂载。
     */
    let mounted = false;
    /**
     * 快照订阅解绑函数。
     */
    let unsubscribe: null | (() => void) = null;

    /**
     * 订阅并同步页面快照
     * @description 切换 API 时重新建立订阅，确保快照始终与当前 API 对齐。
     * @param nextApi 目标页面 API 实例。
     * @returns 无返回值。
     */
    const subscribeSnapshot = (nextApi: AdminPageApi<VuePageComponent>) => {
      unsubscribe?.();
      snapshot.value = nextApi.getSnapshot() as unknown as PageRuntimeSnapshot;
      unsubscribe = nextApi.store.subscribe(() => {
        snapshot.value = nextApi.getSnapshot() as unknown as PageRuntimeSnapshot;
      });
    };
    subscribeSnapshot(apiRef.value);

    /**
     * 监听外部 API 变更并完成实例切换。
     * @description 外部 `props.api` 变化时重建订阅，并在已挂载场景下完成旧实例卸载与新实例挂载。
     */
    watch(
      () => props.api,
      (nextExternalApi) => {
        /**
         * 下一次生效的 API（外部优先，回退内部实例）。
         */
        const nextApi = nextExternalApi ?? internalApi;
        if (apiRef.value === nextApi) {
          return;
        }
        /**
         * 变更前的 API 实例。
         */
        const previousApi = apiRef.value;
        apiRef.value = nextApi;
        subscribeSnapshot(nextApi);
        syncPageRuntimeState(nextApi, props as Record<string, unknown>);
        if (mounted) {
          previousApi.unmount();
          nextApi.mount();
        }
      }
    );

    /**
     * 监听运行时关键输入并同步到页面状态。
     * @description 当激活页、页面列表、路由或滚动配置变化时，驱动 `syncPageRuntimeState`。
     */
    watch(
      () => [
        props.activeKey,
        props.keepInactivePages,
        props.onActiveChange,
        props.onPagesChange,
        props.pages,
        props.router,
        props.router?.currentPath,
        props.scroll,
      ],
      () => {
        syncPageRuntimeState(apiRef.value, props as Record<string, unknown>);
      },
      { immediate: true }
    );

    /**
     * 组件挂载后启动页面 API。
     * @returns 无返回值。
     */
    onMounted(() => {
      mounted = true;
      apiRef.value.mount();
    });

    /**
     * 组件卸载前释放页面 API 与订阅资源。
     * @returns 无返回值。
     */
    onBeforeUnmount(() => {
      unsubscribe?.();
      unsubscribe = null;
      apiRef.value.unmount();
    });

    /**
     * 当前语言下的 Page 文案集合。
     */
    const localeText = computed(() => {
      /**
       * 语言订阅节拍。
       */
      const tick = localeVersion.value;
      void tick;
      return getLocaleMessages().page;
    });

    /**
     * 页面根节点 class。
     */
    const rootClass = computed(() => {
      return ['admin-page', props.className, attrs.class];
    });

    /**
     * 页面根节点 style。
     */
    const rootStyle = computed(() => {
      return [attrs.style, props.style];
    });

    /**
     * 渲染空状态内容
     * @description 优先使用 props/slot 自定义空内容，未提供时使用默认提示。
     * @returns 空状态节点。
     */
    const renderEmpty = () => {
      if (props.renderEmpty) {
        return props.renderEmpty();
      }
      if (slots.empty) {
        return slots.empty();
      }
      return h('div', { class: 'admin-page__empty' }, localeText.value.empty);
    };

    /**
     * 渲染路由未匹配内容
     * @description 当路由页无法解析时返回默认兜底提示。
     * @returns 路由未匹配节点。
     */
    const renderNoMatchRoute = () => {
      return h('div', { class: 'admin-page__empty' }, localeText.value.noMatchRoute);
    };

    /**
     * 渲染路由类型页面
     * @description 按优先级使用 props/slot/fallback 渲染路由页内容。
     * @param page 路由页面描述。
     * @returns 路由页面节点。
     */
    const renderRoutePage = (page: RoutePageItem<VuePageComponent>) => {
      if (props.renderRoutePage) {
        return props.renderRoutePage(page);
      }
      if (slots.route) {
        return slots.route({ page });
      }
      if (props.routeFallback !== undefined) {
        return props.routeFallback;
      }
      if (slots['route-fallback']) {
        return slots['route-fallback']({ page });
      }
      return renderNoMatchRoute();
    };

    /**
     * 渲染页面项内容
     * @description 统一解析组件页与路由页并返回对应节点。
     * @param page 页面项描述。
     * @returns 页面内容节点。
     */
    const renderPage = (page: PageItem): undefined | VNodeChild =>
      resolvePageItemContent({
        page,
        renderComponent: renderVuePageComponent,
        renderRoute: renderRoutePage,
      });
    /**
     * Keep-Alive 渲染版本标识。
     * @description 当语言或渲染函数变化时用于触发缓存失效与节点重建。
     */
    const keepAliveRenderVersion = computed(
      () =>
        [
          localeVersion.value,
          props.renderEmpty,
          props.renderRoutePage,
          props.routeFallback,
        ] as const
    );
    /**
     * Keep-Alive 面板状态缓存引用。
     */
    const keepInactivePaneStateRef = shallowRef<KeepInactivePaneState | null>(
      null
    );
    /**
     * Keep-Alive vnode 缓存引用。
     */
    const keepAliveVNodeCacheRef = shallowRef<KeepAliveVNodeCache | null>(null);
    /**
     * 当前激活面板渲染节拍计数。
     */
    let activePaneRenderTick = 0;
    /**
     * 渲染单个 Keep-Alive 面板节点。
     *
     * @param pane 面板描述对象。
     * @param renderVersion 当前渲染版本标识。
     * @returns Keep-Alive 面板 vnode。
     */
    const renderKeepAlivePaneNode = (
      pane: PagePaneDescriptor<VuePageComponent>,
      renderVersion: PageRenderVersion
    ) =>
      h(KeepAlivePane, {
        active: pane.active,
        activeTick: pane.active ? activePaneRenderTick : 0,
        key: pane.page.key,
        page: pane.page,
        renderPage,
        renderVersion,
      });

    return () => {
      activePaneRenderTick += 1;
      /**
       * 当前计算态快照。
       */
      const computedState = snapshot.value.computed as PageComputedSnapshot;
      /**
       * 当前页面列表。
       */
      const pages = computedState.pages as unknown as PageItem[];
      /**
       * 当前激活页面。
       */
      const activePage = computedState.activePage;
      /**
       * 对齐后的 keep-alive 面板状态。
       */
      const paneState = reconcileKeepInactivePagePaneState(
        keepInactivePaneStateRef.value,
        pages,
        computedState.activeKey
      );
      keepInactivePaneStateRef.value = paneState;
      /**
       * 内容区 class 名。
       */
      const contentClass = resolvePageContentClassName(
        computedState.scrollEnabled
      );
      /**
       * 是否启用 keepInactive 模式。
       */
      const keepInactive = snapshot.value.props.keepInactivePages;
      /**
       * 非 keep-alive 模式下的激活页内容。
       */
      const contentNode = keepInactive
        ? null
        : resolvePageActiveContent({
            activePage: activePage as AdminPageItem<VuePageComponent> | null,
            renderEmpty,
            renderPage,
          });

      let keepInactiveNodes: VNodeChild = h(
        'div',
        { class: 'admin-page__pane is-active' },
        contentNode ?? undefined
      );
      if (keepInactive) {
        /**
         * 当前面板描述列表。
         */
        const paneDescriptors = paneState.descriptors;
        /**
         * 当前 keep-alive 渲染版本。
         */
        const renderVersion = keepAliveRenderVersion.value;
        /**
         * 上一次 vnode 缓存。
         */
        const previousCache = keepAliveVNodeCacheRef.value;
        if (
          !previousCache
          || previousCache.descriptors.length !== paneDescriptors.length
          || previousCache.renderVersion !== renderVersion
        ) {
          /**
           * 新构建的 keep-alive 面板节点。
           */
          const nodes = paneDescriptors.map((pane) =>
            renderKeepAlivePaneNode(pane, renderVersion)
          );
          keepAliveVNodeCacheRef.value = {
            descriptors: paneDescriptors,
            nodes,
            renderVersion,
          };
          keepInactiveNodes = nodes;
        } else {
          let changed = false;
          /**
           * 复制一份旧节点数组，仅替换变化项。
           */
          const nodes = previousCache.nodes.slice();
          for (let index = 0; index < paneDescriptors.length; index += 1) {
            /**
             * 当前索引对应的面板描述。
             */
            const pane = paneDescriptors[index];
            if (!pane.active && previousCache.descriptors[index] === pane) {
              continue;
            }
            nodes[index] = renderKeepAlivePaneNode(pane, renderVersion);
            changed = true;
          }
          if (!changed) {
            keepInactiveNodes = previousCache.nodes;
          } else {
            keepAliveVNodeCacheRef.value = {
              descriptors: paneDescriptors,
              nodes,
              renderVersion,
            };
            keepInactiveNodes = nodes;
          }
        }
      } else {
        keepAliveVNodeCacheRef.value = null;
      }

      return h(
        'div',
        {
          class: rootClass.value,
          style: rootStyle.value,
        },
        [h('div', { class: contentClass }, keepInactiveNodes)]
      );
    };
  },
  {
    name: 'AdminPage',
    inheritAttrs: false,
  }
);
