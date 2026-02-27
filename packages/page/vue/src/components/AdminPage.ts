import type {
  AdminPageApi,
  AdminPageItem,
  AdminPageSnapshot,
  RoutePageItem,
} from '@admin-core/page-core';
import type {
  AdminPageVueProps,
  VuePageComponent,
} from '../types';
import type { VNode, VNodeChild } from 'vue';

import {
  createPageApi,
  getLocaleMessages,
  isPageComponentItem,
  isPageRouteItem,
  pickPageRuntimeStateOptions,
} from '@admin-core/page-core';
import {
  computed,
  defineComponent,
  h,
  isVNode,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue';

import { useLocaleVersion } from '../composables/useLocaleVersion';
import '../styles/index.css';

interface Props extends AdminPageVueProps {
  api?: AdminPageApi<VuePageComponent>;
}
type PageItem = AdminPageItem<VuePageComponent>;

function renderVuePageComponent(
  component: VuePageComponent | undefined,
  props?: Record<string, any>
): undefined | VNodeChild {
  if (component === undefined || component === null) {
    return undefined;
  }
  if (isVNode(component)) {
    return component as VNode;
  }
  if (typeof component === 'object' || typeof component === 'function') {
    return h(component as any, props ?? {});
  }
  return component as VNodeChild;
}

export const AdminPage = defineComponent(
  (props: Props, { attrs, slots }) => {
    const api = props.api ?? createPageApi<VuePageComponent>(props);
    const localeVersion = useLocaleVersion();
    const snapshot = ref<AdminPageSnapshot<VuePageComponent>>(
      api.getSnapshot() as AdminPageSnapshot<VuePageComponent>
    );

    const unsubscribe = api.store.subscribe(() => {
      snapshot.value = api.getSnapshot() as AdminPageSnapshot<VuePageComponent>;
    });

    watch(
      () => [
        props.activeKey,
        props.keepInactivePages,
        props.onActiveChange,
        props.onPagesChange,
        props.pages,
        props.router,
        props.scroll,
      ],
      () => {
        api.setState(pickPageRuntimeStateOptions(props));
        if (props.router?.currentPath) {
          api.syncRoute(props.router.currentPath);
        }
      },
      { immediate: true }
    );

    onMounted(() => {
      api.mount();
    });

    onBeforeUnmount(() => {
      unsubscribe();
      api.unmount();
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
      return props.style ?? attrs.style;
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

    const renderRoutePage = (page: RoutePageItem<VuePageComponent>) => {
      if (page.component) {
        return renderVuePageComponent(page.component, page.props);
      }
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
      return h('div', { class: 'admin-page__empty' }, localeText.value.noMatchRoute);
    };

    const renderPage = (page: PageItem): any => {
      if (isPageComponentItem(page as any)) {
        return renderVuePageComponent(page.component, page.props);
      }
      if (isPageRouteItem(page as any)) {
        return renderRoutePage(page as RoutePageItem<VuePageComponent>);
      }
      return undefined;
    };

    return () => {
      const computedState: any = snapshot.value.computed as any;
      const pages = computedState.pages as PageItem[];
      const activePage = computedState.activePage;

      const contentNode: any = activePage
        ? renderPage(activePage as PageItem)
        : renderEmpty();

      const contentClass = [
        'admin-page__content',
        computedState.scrollEnabled
          ? 'admin-page__content--scroll'
          : 'admin-page__content--static',
      ];

      const keepInactiveNodes = snapshot.value.props.keepInactivePages
        ? pages.map((page) =>
            h(
              'div',
              {
                key: page.key,
                class: [
                  'admin-page__pane',
                  page.key === computedState.activeKey ? 'is-active' : 'is-inactive',
                ],
              },
              renderPage(page) as any
            )
          )
        : h('div', { class: 'admin-page__pane is-active' }, contentNode as any);

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
