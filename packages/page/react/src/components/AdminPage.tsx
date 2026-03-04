/**
 * React 版 AdminPage 组件实现。
 * @description 负责页面容器渲染、API 状态订阅、路由联动与 keep-inactive 面板复用。
 */

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

/**
 * 将页面配置中的 React 组件描述统一转换为可渲染节点。
 * 兼容 `ReactElement`、函数组件以及普通节点值。
 *
 * @param component 页面项中声明的组件内容。
 * @param props 当 `component` 为组件类型时注入的属性。
 * @returns 可直接挂载到页面区域的 React 节点；当组件为空时返回 `null`。
 */
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

/**
 * `AdminPage` 组件属性。
 */
interface Props extends AdminPageReactProps {
  /**
   * 外部注入的页面 API 实例。
   * 未传入时组件会基于初始运行时配置自动创建内部实例。
   */
  api?: AdminPageApi<ReactPageComponent>;
}

/**
 * Keep-Alive 页面面板的内部状态快照。
 */
type KeepAlivePaneState = KeepInactivePagePaneState<ReactPageComponent>;
/**
 * 单个 Keep-Alive 面板的描述信息。
 */
type KeepAlivePaneDescriptor = KeepAlivePaneState['descriptors'][number];

/**
 * Keep-Alive 面板组件属性。
 */
interface KeepAlivePaneProps {
  /** 当前面板对应的页面描述与激活状态。 */
  pane: KeepAlivePaneDescriptor;
  /** 将页面项渲染为内容节点的函数。 */
  renderPage: (page: AdminPageItem<ReactPageComponent>) => ReactNode;
}

/**
 * Keep-Alive 面板节点缓存结构。
 */
interface KeepAliveNodeCacheState {
  /** 与缓存节点一一对应的面板描述数组。 */
  descriptors: KeepAlivePaneDescriptor[];
  /** 已生成的 Keep-Alive 面板节点缓存。 */
  nodes: ReactNode[];
  /** 生成缓存时使用的页面渲染函数引用。 */
  renderPage: (page: AdminPageItem<ReactPageComponent>) => ReactNode;
}

/**
 * 判断 Keep-Alive 面板属性是否可复用。
 * @description 仅在渲染函数与页面/激活态均未变化时跳过重渲染。
 * @param previous 上一次属性。
 * @param next 下一次属性。
 * @returns 是否可跳过重渲染。
 */
function isKeepAlivePanePropsEqual(
  previous: KeepAlivePaneProps,
  next: KeepAlivePaneProps
) {
  return previous.renderPage === next.renderPage
    && previous.pane.page === next.pane.page
    && previous.pane.active === next.pane.active;
}

/**
 * Keep-Alive 面板组件。
 * @description 缓存非激活页面节点，切换激活态时仅更新必要内容。
 */
const KeepAlivePane = memo(function KeepAlivePane(props: KeepAlivePaneProps) {
  const { pane, renderPage } = props;
  const content = useMemo(
    () => renderPage(pane.page),
    [pane.page, renderPage]
  );

  return <div className={pane.className}>{content}</div>;
}, isKeepAlivePanePropsEqual);

/**
 * React 版 `AdminPage` 组件。
 *
 * @param props 运行时配置与外部注入 API。
 * @returns 页面容器节点。
 */
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
  /**
   * 首次渲染时提取的运行时初始化配置。
   * @description 用于内部创建 API 时保持初始化参数稳定。
   */
  const initialRuntimeOptionsRef = useRef<ReturnType<
    typeof pickPageRuntimeStateOptions<ReactPageComponent>
  > | null>(null);
  if (!initialRuntimeOptionsRef.current) {
    initialRuntimeOptionsRef.current =
      pickPageRuntimeStateOptions<ReactPageComponent>(props as Record<string, unknown>);
  }
  /**
   * 解析页面 API 实例。
   * @description 优先复用外部注入 API，未注入时按初始运行时配置创建内部实例。
   */
  const api = useMemo(
    () =>
      props.api
      ?? createPageApiWithRuntimeOptions<ReactPageComponent>(
        initialRuntimeOptionsRef.current ?? {}
      ),
    [props.api]
  );
  /**
   * 语言版本号订阅值，用于驱动文案相关渲染更新。
   */
  const localeVersion = useLocaleVersion();
  /**
   * Page 运行时快照状态。
   */
  const [snapshot, setSnapshot] = useState<AdminPageSnapshot<ReactPageComponent>>(
    () => api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>
  );

  /**
   * 订阅 API 快照变更并同步到本地状态。
   */
  useEffect(() => {
    setSnapshot(api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>);
    const unsubscribe = api.store.subscribe(() => {
      setSnapshot(api.getSnapshot() as AdminPageSnapshot<ReactPageComponent>);
    });
    return () => {
      unsubscribe();
    };
  }, [api]);

  /**
   * 同步运行时输入（激活页、页面列表、路由、滚动配置）到 Page API。
   */
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

  /**
   * 挂载/卸载生命周期内启动并释放 Page API。
   */
  useEffect(() => {
    api.mount();
    return () => {
      api.unmount();
    };
  }, [api]);

  void localeVersion;
  /**
   * 当前语言下的页面文案。
   */
  const localeText = getLocaleMessages().page;
  /**
   * Page 计算态快照。
   */
  const computed = snapshot.computed;
  /**
   * 当前页面列表。
   */
  const pages = computed.pages;
  /**
   * 当前激活页面。
   */
  const activePage = computed.activePage;
  /**
   * Keep-Alive 面板状态缓存。
   */
  const keepInactivePaneStateRef = useRef<KeepAlivePaneState | null>(null);
  /**
   * Keep-Alive 节点缓存。
   */
  const keepAliveNodeCacheRef = useRef<KeepAliveNodeCacheState | null>(null);

  /**
   * 渲染路由未匹配内容
   * @description 当路由页无法匹配有效组件时，返回默认兜底提示节点。
   * @returns 路由未匹配提示节点。
   */
  const renderNoMatchRoute = useCallback(() => (
    <div className="admin-page__empty">{localeText.noMatchRoute}</div>
  ), [localeText.noMatchRoute]);
  /**
   * 渲染路由类型页面内容
   * @description 优先使用外部 `renderRoutePage`，否则按 `routeFallback` 和默认提示回退。
   * @param page 路由页面描述对象。
   * @returns 路由页面渲染节点。
   */
  const renderResolvedRouteContent = useCallback((page: RoutePageItem<ReactPageComponent>) => {
    if (renderRoutePage) {
      return renderRoutePage(page);
    }
    if (routeFallback !== undefined) {
      return routeFallback;
    }
    return renderNoMatchRoute();
  }, [renderNoMatchRoute, renderRoutePage, routeFallback]);
  /**
   * 解析并渲染页面内容
   * @description 统一处理组件页与路由页，并返回最终可渲染节点。
   * @param page 页面配置对象。
   * @returns 页面内容节点。
   */
  const renderResolvedPageContent = useCallback((page: AdminPageItem<ReactPageComponent>) =>
    resolvePageItemContent({
      page,
      renderComponent: renderReactPageComponent,
      renderRoute: renderResolvedRouteContent,
    }), [renderResolvedRouteContent]);
  /**
   * 渲染空状态内容
   * @description 优先使用外部 `renderEmpty`，未提供时使用默认空提示。
   * @returns 空状态节点。
   */
  const renderEmptyContent = useCallback(() => (
    renderEmpty
      ? renderEmpty()
      : <div className="admin-page__empty">{localeText.empty}</div>
  ), [localeText.empty, renderEmpty]);
  /**
   * 激活页内容节点。
   * @description 仅在非 keep-alive 模式下渲染当前激活页内容。
   */
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
  /**
   * 计算 keep-alive 面板状态。
   * @description 基于页面列表与当前激活 key 维护面板描述与激活态。
   */
  const keepInactivePaneState = useMemo(() => {
    keepInactivePaneStateRef.current = reconcileKeepInactivePagePaneState(
      keepInactivePaneStateRef.current,
      pages,
      computed.activeKey
    );
    return keepInactivePaneStateRef.current;
  }, [pages, computed.activeKey]);
  /**
   * Keep-Alive 面板描述列表。
   */
  const keepInactivePanes = keepInactivePaneState.descriptors;
  /**
   * 生成 keep-alive 面板节点缓存。
   * @description 尽量复用未变化的面板节点，仅重建发生变更的面板。
   */
  const keepInactiveNodes = useMemo(() => {
    if (!snapshot.props.keepInactivePages) {
      keepAliveNodeCacheRef.current = null;
      return null;
    }
    /**
     * 上一次 keep-alive 节点缓存。
     */
    const previousCache = keepAliveNodeCacheRef.current;
    if (
      !previousCache
      || previousCache.descriptors.length !== keepInactivePanes.length
      || previousCache.renderPage !== renderResolvedPageContent
    ) {
      /**
       * 新构建的 keep-alive 节点列表。
       */
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

    /**
     * 标记本轮是否产生节点替换。
     */
    let changed = false;
    /**
     * 基于旧缓存复制出的可变节点数组。
     */
    const nodes = previousCache.nodes.slice();
    for (let index = 0; index < keepInactivePanes.length; index += 1) {
      /**
       * 当前索引对应的面板描述。
       */
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
  /**
   * 页面内容容器样式类名。
   */
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
