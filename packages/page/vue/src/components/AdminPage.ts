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

interface Props extends AdminPageVueProps {
  api?: AdminPageApi<VuePageComponent>;
}
type PageItem = AdminPageItem<VuePageComponent>;
type PageComputedSnapshot = {
  activeKey: null | string;
  activePage: null | Record<string, unknown>;
  pages: Array<Record<string, unknown>>;
  scrollEnabled: boolean;
};
type PageRuntimeSnapshot = {
  computed: PageComputedSnapshot;
  props: AdminPageVueProps;
};
type PageRenderFn = (page: PageItem) => undefined | VNodeChild;
type PageRenderVersion = readonly [
  number,
  Props['renderEmpty'],
  Props['renderRoutePage'],
  Props['routeFallback'],
];
type KeepInactivePaneState = KeepInactivePagePaneState<VuePageComponent>;
type KeepAliveVNodeCache = {
  descriptors: KeepInactivePaneState['descriptors'];
  nodes: VNodeChild[];
  renderVersion: PageRenderVersion;
};

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
  setup(props) {
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

    const paneClass = computed(() => resolvePagePaneClassName(props.active));

    return () => h(
      'div',
      { class: paneClass.value },
      contentRef.value ?? undefined
    );
  },
});

export const AdminPage = defineComponent(
  (props: Props, { attrs, slots }) => {
    const internalApi = createPageApiWithRuntimeOptions<VuePageComponent>(
      props as Record<string, unknown>
    );
    const apiRef = shallowRef<AdminPageApi<VuePageComponent>>(
      props.api ?? internalApi
    );
    const localeVersion = useLocaleVersion();
    const snapshot = ref<PageRuntimeSnapshot>(
      apiRef.value.getSnapshot() as unknown as PageRuntimeSnapshot
    );
    let mounted = false;
    let unsubscribe: null | (() => void) = null;

    const subscribeSnapshot = (nextApi: AdminPageApi<VuePageComponent>) => {
      unsubscribe?.();
      snapshot.value = nextApi.getSnapshot() as unknown as PageRuntimeSnapshot;
      unsubscribe = nextApi.store.subscribe(() => {
        snapshot.value = nextApi.getSnapshot() as unknown as PageRuntimeSnapshot;
      });
    };
    subscribeSnapshot(apiRef.value);

    watch(
      () => props.api,
      (nextExternalApi) => {
        const nextApi = nextExternalApi ?? internalApi;
        if (apiRef.value === nextApi) {
          return;
        }
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

    onMounted(() => {
      mounted = true;
      apiRef.value.mount();
    });

    onBeforeUnmount(() => {
      unsubscribe?.();
      unsubscribe = null;
      apiRef.value.unmount();
    });

    const localeText = computed(() => {
      const tick = localeVersion.value;
      void tick;
      return getLocaleMessages().page;
    });

    const rootClass = computed(() => {
      return ['admin-page', props.className, attrs.class];
    });

    const rootStyle = computed(() => {
      return [attrs.style, props.style];
    });

    const renderEmpty = () => {
      if (props.renderEmpty) {
        return props.renderEmpty();
      }
      if (slots.empty) {
        return slots.empty();
      }
      return h('div', { class: 'admin-page__empty' }, localeText.value.empty);
    };

    const renderNoMatchRoute = () => {
      return h('div', { class: 'admin-page__empty' }, localeText.value.noMatchRoute);
    };

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

    const renderPage = (page: PageItem): undefined | VNodeChild =>
      resolvePageItemContent({
        page,
        renderComponent: renderVuePageComponent,
        renderRoute: renderRoutePage,
      });
    const keepAliveRenderVersion = computed(
      () =>
        [
          localeVersion.value,
          props.renderEmpty,
          props.renderRoutePage,
          props.routeFallback,
        ] as const
    );
    const keepInactivePaneStateRef = shallowRef<KeepInactivePaneState | null>(
      null
    );
    const keepAliveVNodeCacheRef = shallowRef<KeepAliveVNodeCache | null>(null);
    let activePaneRenderTick = 0;
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
      const computedState = snapshot.value.computed as PageComputedSnapshot;
      const pages = computedState.pages as unknown as PageItem[];
      const activePage = computedState.activePage;
      const paneState = reconcileKeepInactivePagePaneState(
        keepInactivePaneStateRef.value,
        pages,
        computedState.activeKey
      );
      keepInactivePaneStateRef.value = paneState;
      const contentClass = resolvePageContentClassName(
        computedState.scrollEnabled
      );
      const keepInactive = snapshot.value.props.keepInactivePages;
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
        const paneDescriptors = paneState.descriptors;
        const renderVersion = keepAliveRenderVersion.value;
        const previousCache = keepAliveVNodeCacheRef.value;
        if (
          !previousCache
          || previousCache.descriptors.length !== paneDescriptors.length
          || previousCache.renderVersion !== renderVersion
        ) {
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
          const nodes = previousCache.nodes.slice();
          for (let index = 0; index < paneDescriptors.length; index += 1) {
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
