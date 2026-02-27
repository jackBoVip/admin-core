import type {
  AdminPageSnapshot,
  RoutePageItem,
} from '@admin-core/page-core';
import type {
  AdminPageReactProps,
  ReactPageComponent,
} from '../types';

import {
  createPageApi,
  getLocaleMessages,
  isPageComponentItem,
  pickPageRuntimeStateOptions,
} from '@admin-core/page-core';
import {
  createElement,
  isValidElement,
  memo,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useLocaleVersion } from '../hooks/useLocaleVersion';

function renderReactPageComponent(
  component: ReactPageComponent | undefined,
  props?: Record<string, any>
) {
  if (component === undefined || component === null) {
    return null;
  }
  if (isValidElement(component)) {
    return component;
  }
  if (typeof component === 'function') {
    return createElement(component as any, props ?? {});
  }
  return component;
}

interface Props extends AdminPageReactProps {
  api?: ReturnType<typeof createPageApi<ReactPageComponent>>;
}

export const AdminPage = memo(function AdminPage(props: Props) {
  const api = useMemo(
    () => props.api ?? createPageApi<ReactPageComponent>(props),
    [props.api]
  );
  const localeVersion = useLocaleVersion();
  const [snapshot, setSnapshot] = useState<AdminPageSnapshot<ReactPageComponent>>(
    () => api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>
  );

  useEffect(() => {
    const unsubscribe = api.store.subscribe(() => {
      setSnapshot(api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>);
    });
    return () => {
      unsubscribe();
    };
  }, [api]);

  useEffect(() => {
    api.setState(pickPageRuntimeStateOptions(props));
    if (props.router?.currentPath) {
      api.syncRoute(props.router.currentPath);
    }
  }, [
    api,
    props.activeKey,
    props.keepInactivePages,
    props.onActiveChange,
    props.onPagesChange,
    props.pages,
    props.router,
    props.scroll,
  ]);

  useEffect(() => {
    api.mount();
    return () => {
      api.unmount();
    };
  }, [api]);

  void localeVersion;
  const localeText = getLocaleMessages().page;
  const computed = snapshot.computed;
  const pages = computed.pages;
  const activePage = computed.activePage;

  const contentNode = useMemo(() => {
    if (!activePage) {
      return props.renderEmpty ? (
        props.renderEmpty()
      ) : (
        <div className="admin-page__empty">{localeText.empty}</div>
      );
    }

    if (isPageComponentItem(activePage)) {
      return renderReactPageComponent(activePage.component, activePage.props);
    }

    const routePage = activePage as RoutePageItem<ReactPageComponent>;
    if (routePage.component) {
      return renderReactPageComponent(routePage.component, routePage.props);
    }
    if (props.renderRoutePage) {
      return props.renderRoutePage(routePage);
    }
    if (props.routeFallback !== undefined) {
      return props.routeFallback;
    }
    return <div className="admin-page__empty">{localeText.noMatchRoute}</div>;
  }, [
    activePage,
    localeText.empty,
    localeText.noMatchRoute,
    props.renderEmpty,
    props.renderRoutePage,
    props.routeFallback,
  ]);

  return (
    <div className={["admin-page", props.className ?? ''].filter(Boolean).join(' ')} style={props.style}>
      <div
        className={[
          'admin-page__content',
          computed.scrollEnabled
            ? 'admin-page__content--scroll'
            : 'admin-page__content--static',
        ].join(' ')}
      >
        {snapshot.props.keepInactivePages ? (
          pages.map((page) => {
            const visible = page.key === computed.activeKey;
            const content = isPageComponentItem(page)
              ? renderReactPageComponent(page.component, page.props)
              : page.component
                ? renderReactPageComponent(page.component, page.props)
                : props.renderRoutePage
                  ? props.renderRoutePage(page)
                  : props.routeFallback ?? (
                      <div className="admin-page__empty">{localeText.noMatchRoute}</div>
                    );

            return (
              <div
                key={page.key}
                className={[
                  'admin-page__pane',
                  visible ? 'is-active' : 'is-inactive',
                ].join(' ')}
              >
                {content}
              </div>
            );
          })
        ) : (
          <div className="admin-page__pane is-active">{contentNode}</div>
        )}
      </div>
    </div>
  );
});
