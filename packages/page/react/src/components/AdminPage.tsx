import type {
  AdminPageApi,
  AdminPageItem,
  AdminPageSnapshot,
  KeepInactivePagePaneState,
  RoutePageItem,
} from '@admin-core/page-core';
import type {
  AdminPageReactProps,
  ReactPageComponent,
} from '../types';
import type {
  ComponentType,
  ReactNode,
} from 'react';

import {
  createPageApiWithRuntimeOptions,
  getLocaleMessages,
  pickPageRuntimeStateOptions,
  reconcileKeepInactivePagePaneState,
  resolvePageActiveContent,
  resolvePageContentClassName,
  resolvePageItemContent,
  syncPageRuntimeState,
} from '@admin-core/page-core';
import {
  createElement,
  isValidElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useLocaleVersion } from '../hooks/useLocaleVersion';

function renderReactPageComponent(
  component: ReactPageComponent | undefined,
  props?: Record<string, unknown>
) {
  if (component === undefined || component === null) {
    return null;
  }
  if (isValidElement(component)) {
    return component;
  }
  if (typeof component === 'function') {
    return createElement(
      component as ComponentType<Record<string, unknown>>,
      props ?? {}
    );
  }
  return component;
}

interface Props extends AdminPageReactProps {
  api?: AdminPageApi<ReactPageComponent>;
}

type KeepAlivePaneState = KeepInactivePagePaneState<ReactPageComponent>;
type KeepAlivePaneDescriptor = KeepAlivePaneState['descriptors'][number];

const KeepAlivePane = memo(function KeepAlivePane(props: {
  pane: KeepAlivePaneDescriptor;
  renderPage: (page: AdminPageItem<ReactPageComponent>) => ReactNode;
}) {
  const { pane, renderPage } = props;
  const content = useMemo(
    () => renderPage(pane.page),
    [pane.page, renderPage]
  );

  return <div className={pane.className}>{content}</div>;
}, (previous, next) =>
  previous.renderPage === next.renderPage
  && previous.pane.page === next.pane.page
  && previous.pane.active === next.pane.active
);

export const AdminPage = memo(function AdminPage(props: Props) {
  const {
    activeKey,
    className,
    keepInactivePages,
    onActiveChange,
    onPagesChange,
    pages: pageItems,
    renderEmpty,
    renderRoutePage,
    routeFallback,
    router,
    scroll,
    style,
  } = props;
  const initialRuntimeOptionsRef = useRef<ReturnType<
    typeof pickPageRuntimeStateOptions<ReactPageComponent>
  > | null>(null);
  if (!initialRuntimeOptionsRef.current) {
    initialRuntimeOptionsRef.current =
      pickPageRuntimeStateOptions<ReactPageComponent>(props as Record<string, unknown>);
  }
  const api = useMemo(
    () =>
      props.api
      ?? createPageApiWithRuntimeOptions<ReactPageComponent>(
        initialRuntimeOptionsRef.current ?? {}
      ),
    [props.api]
  );
  const localeVersion = useLocaleVersion();
  const [snapshot, setSnapshot] = useState<AdminPageSnapshot<ReactPageComponent>>(
    () => api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>
  );

  useEffect(() => {
    setSnapshot(api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>);
    const unsubscribe = api.store.subscribe(() => {
      setSnapshot(api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>);
    });
    return () => {
      unsubscribe();
    };
  }, [api]);

  useEffect(() => {
    syncPageRuntimeState(api, {
      activeKey,
      keepInactivePages,
      onActiveChange,
      onPagesChange,
      pages: pageItems,
      router,
      scroll,
    });
  }, [
    api,
    activeKey,
    keepInactivePages,
    onActiveChange,
    onPagesChange,
    pageItems,
    router,
    router?.currentPath,
    scroll,
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
  const keepInactivePaneStateRef = useRef<KeepAlivePaneState | null>(null);
  const keepAliveNodeCacheRef = useRef<null | {
    descriptors: KeepAlivePaneDescriptor[];
    nodes: ReactNode[];
    renderPage: (page: AdminPageItem<ReactPageComponent>) => ReactNode;
  }>(null);

  const renderNoMatchRoute = useCallback(() => (
    <div className="admin-page__empty">{localeText.noMatchRoute}</div>
  ), [localeText.noMatchRoute]);
  const renderResolvedRouteContent = useCallback((page: RoutePageItem<ReactPageComponent>) => {
    if (renderRoutePage) {
      return renderRoutePage(page);
    }
    if (routeFallback !== undefined) {
      return routeFallback;
    }
    return renderNoMatchRoute();
  }, [renderNoMatchRoute, renderRoutePage, routeFallback]);
  const renderResolvedPageContent = useCallback((page: AdminPageItem<ReactPageComponent>) =>
    resolvePageItemContent({
      page,
      renderComponent: renderReactPageComponent,
      renderRoute: renderResolvedRouteContent,
    }), [renderResolvedRouteContent]);
  const renderEmptyContent = useCallback(() => (
    renderEmpty
      ? renderEmpty()
      : <div className="admin-page__empty">{localeText.empty}</div>
  ), [localeText.empty, renderEmpty]);
  const contentNode = useMemo(() => {
    if (snapshot.props.keepInactivePages) {
      return null;
    }
    return resolvePageActiveContent({
      activePage,
      renderEmpty: renderEmptyContent,
      renderPage: renderResolvedPageContent,
    });
  }, [
    snapshot.props.keepInactivePages,
    activePage,
    renderEmptyContent,
    renderResolvedPageContent,
  ]);
  const keepInactivePaneState = useMemo(() => {
    keepInactivePaneStateRef.current = reconcileKeepInactivePagePaneState(
      keepInactivePaneStateRef.current,
      pages,
      computed.activeKey
    );
    return keepInactivePaneStateRef.current;
  }, [pages, computed.activeKey]);
  const keepInactivePanes = keepInactivePaneState.descriptors;
  const keepInactiveNodes = useMemo(() => {
    if (!snapshot.props.keepInactivePages) {
      keepAliveNodeCacheRef.current = null;
      return null;
    }
    const previousCache = keepAliveNodeCacheRef.current;
    if (
      !previousCache
      || previousCache.descriptors.length !== keepInactivePanes.length
      || previousCache.renderPage !== renderResolvedPageContent
    ) {
      const nodes = keepInactivePanes.map((pane) => (
        <KeepAlivePane
          key={pane.page.key}
          pane={pane}
          renderPage={renderResolvedPageContent}
        />
      ));
      keepAliveNodeCacheRef.current = {
        descriptors: keepInactivePanes,
        nodes,
        renderPage: renderResolvedPageContent,
      };
      return nodes;
    }

    let changed = false;
    const nodes = previousCache.nodes.slice();
    for (let index = 0; index < keepInactivePanes.length; index += 1) {
      const pane = keepInactivePanes[index];
      if (previousCache.descriptors[index] === pane) {
        continue;
      }
      nodes[index] = (
        <KeepAlivePane
          key={pane.page.key}
          pane={pane}
          renderPage={renderResolvedPageContent}
        />
      );
      changed = true;
    }
    if (!changed) {
      return previousCache.nodes;
    }
    keepAliveNodeCacheRef.current = {
      descriptors: keepInactivePanes,
      nodes,
      renderPage: renderResolvedPageContent,
    };
    return nodes;
  }, [
    snapshot.props.keepInactivePages,
    keepInactivePanes,
    renderResolvedPageContent,
  ]);
  const contentClass = useMemo(
    () => resolvePageContentClassName(computed.scrollEnabled),
    [computed.scrollEnabled]
  );

  return (
    <div className={["admin-page", className ?? ''].filter(Boolean).join(' ')} style={style}>
      <div className={contentClass}>
        {snapshot.props.keepInactivePages ? (
          keepInactiveNodes
        ) : (
          <div className="admin-page__pane is-active">{contentNode}</div>
        )}
      </div>
    </div>
  );
});
