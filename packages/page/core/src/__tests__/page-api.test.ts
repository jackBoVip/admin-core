import {
  createKeepInactivePagePaneState,
  createPageApi,
  createPageApiWithRuntimeOptions,
  isPagePaneActive,
  pickPageRuntimeStateOptions,
  reconcileKeepInactivePagePaneState,
  resolveKeepInactivePagePanes,
  resolvePageStoreSelector,
  resolvePageActiveContent,
  resolvePageContentClassName,
  resolvePageItemContent,
  resolvePagePaneClassName,
  setupAdminPageCore,
  syncPageRuntimeState,
  type AdminPageItem,
  type RoutePageItem,
} from '../index';

describe('page api', () => {
  beforeEach(() => {
    setupAdminPageCore({ locale: 'zh-CN', logLevel: 'silent' });
  });

  it('syncs active page by route path', () => {
    const pages: RoutePageItem[] = [
      { key: '/a', path: '/a', title: 'A', type: 'route' },
      { key: '/b', path: '/b', title: 'B', type: 'route' },
    ];

    const api = createPageApi({
      pages,
      router: {
        currentPath: '/b',
      },
    });

    expect(api.getSnapshot().computed.activeKey).toBe('/b');
  });

  it('navigates when activating route page', () => {
    const navigate = vi.fn();
    const api = createPageApi({
      pages: [
        { key: '/a', path: '/a', title: 'A', type: 'route' },
        { key: '/b', path: '/b', title: 'B', type: 'route' },
      ],
      router: {
        navigate,
      },
    });

    api.setActiveKey('/b');
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(
      '/b',
      expect.objectContaining({ key: '/b' })
    );
  });

  it('uses per-page scroll option over global scroll option', () => {
    const api = createPageApi({
      pages: [
        {
          key: 'a',
          component: {},
          scroll: false,
          title: 'A',
          type: 'component',
        },
      ],
      scroll: true,
    });

    expect(api.resolveScrollEnabled('a')).toBe(false);
  });

  it('keeps internal active key consistent when removing effective active page', () => {
    const onActiveChange = vi.fn();
    const api = createPageApi({
      onActiveChange,
      pages: [
        { component: {}, key: 'a', title: 'A', type: 'component' },
        { component: {}, key: 'b', title: 'B', type: 'component' },
      ],
    });

    api.setState({ activeKey: 'missing' });
    api.removePage('a');

    expect(api.getSnapshot().computed.activeKey).toBe('b');
    expect(onActiveChange).toHaveBeenCalledTimes(1);
    expect(onActiveChange).toHaveBeenCalledWith(
      expect.objectContaining({
        activeKey: 'b',
      })
    );
  });

  it('picks only runtime state fields for page setState payload', () => {
    const payload = pickPageRuntimeStateOptions({
      activeKey: 'a',
      className: 'ignored',
      keepInactivePages: true,
      onActiveChange: vi.fn(),
      onPagesChange: vi.fn(),
      pages: [{ component: {}, key: 'a', title: 'A', type: 'component' }],
      renderEmpty: () => null,
      router: { currentPath: '/a' },
      scroll: true,
      style: { color: 'red' },
    });

    expect(payload).toEqual({
      activeKey: 'a',
      keepInactivePages: true,
      onActiveChange: expect.any(Function),
      onPagesChange: expect.any(Function),
      pages: [{ component: {}, key: 'a', title: 'A', type: 'component' }],
      router: { currentPath: '/a' },
      scroll: true,
    });
  });

  it('creates page api from runtime options helper', () => {
    const api = createPageApiWithRuntimeOptions({
      activeKey: '/a',
      pages: [
        { key: '/a', path: '/a', type: 'route' },
        { key: '/b', path: '/b', type: 'route' },
      ],
      router: { currentPath: '/b' },
      style: { color: 'red' },
    });

    expect(api.getSnapshot().computed.activeKey).toBe('/a');
  });

  it('resolves store selector with explicit selector or identity fallback', () => {
    const source = { key: 'value' };
    const explicitSelector = resolvePageStoreSelector<
      typeof source,
      string
    >((state) => state.key);
    const identitySelector = resolvePageStoreSelector<typeof source>();

    expect(explicitSelector(source)).toBe('value');
    expect(identitySelector(source)).toBe(source);
  });

  it('syncs runtime state and route via shared helper', () => {
    const setState = vi.fn();
    const syncRoute = vi.fn();

    syncPageRuntimeState(
      { setState, syncRoute },
      {
        activeKey: 'a',
        className: 'ignored',
        keepInactivePages: true,
        pages: [{ component: {}, key: 'a', title: 'A', type: 'component' }],
        router: { currentPath: '/a' },
        scroll: true,
      }
    );

    expect(setState).toHaveBeenCalledWith({
      activeKey: 'a',
      keepInactivePages: true,
      onActiveChange: undefined,
      onPagesChange: undefined,
      pages: [{ component: {}, key: 'a', title: 'A', type: 'component' }],
      router: { currentPath: '/a' },
      scroll: true,
    });
    expect(syncRoute).toHaveBeenCalledWith('/a');
  });

  it('skips duplicate syncRoute scans when path is unchanged', () => {
    const api = createPageApi({
      pages: [
        { key: '/a', path: '/a', title: 'A', type: 'route' },
        { key: '/b', path: '/b', title: 'B', type: 'route' },
      ],
      router: {
        currentPath: '/a',
      },
    });
    const setActiveKeySpy = vi.spyOn(api, 'setActiveKey');

    api.syncRoute('/a');
    api.syncRoute('/a');

    expect(setActiveKeySpy).toHaveBeenCalledTimes(1);
  });

  it('re-syncs route after path cache is reset by empty path', () => {
    const api = createPageApi({
      pages: [
        { key: '/a', path: '/a', title: 'A', type: 'route' },
        { key: '/b', path: '/b', title: 'B', type: 'route' },
      ],
      router: {
        currentPath: '/a',
      },
    });
    const setActiveKeySpy = vi.spyOn(api, 'setActiveKey');

    api.syncRoute('/a');
    api.syncRoute('');
    api.syncRoute('/a');

    expect(setActiveKeySpy).toHaveBeenCalledTimes(2);
  });

  it('keeps route matching priority when prefix route appears first', () => {
    const api = createPageApi({
      pages: [
        { exact: false, key: '/a-prefix', path: '/a', type: 'route' },
        { key: '/a/b-exact', path: '/a/b', type: 'route' },
      ],
      router: {
        currentPath: '/a/b',
      },
    });

    expect(api.getSnapshot().computed.activeKey).toBe('/a-prefix');
  });

  it('clears route lookup cache when pages are replaced', () => {
    const api = createPageApi({
      pages: [
        { key: '/a', path: '/a', title: 'A', type: 'route' },
      ],
      router: {
        currentPath: '/a',
      },
    });

    api.syncRoute('/a');
    api.setPages([
      { key: '/b', path: '/b', title: 'B', type: 'route' },
    ]);
    api.syncRoute('/b');

    expect(api.getSnapshot().computed.activeKey).toBe('/b');
  });

  it('prefers first page for duplicate keys', () => {
    const api = createPageApi({
      activeKey: 'dup',
      pages: [
        { component: {}, key: 'dup', title: 'first', type: 'component' },
        { component: {}, key: 'dup', title: 'second', type: 'component' },
      ],
    });

    expect(api.getSnapshot().computed.activePage?.title).toBe('first');
    api.setActiveKey('dup');
    expect(api.getSnapshot().computed.activePage?.title).toBe('first');
  });

  it('prevents external mutation through exposed state snapshot objects', () => {
    const api = createPageApi({
      pages: [
        { component: {}, key: 'a', title: 'A', type: 'component' },
      ],
    });

    expect(() => {
      (api.getState().pages as AdminPageItem[]).push({
        component: {},
        key: 'b',
        title: 'B',
        type: 'component',
      });
    }).toThrow();
    expect(() => {
      (api.getSnapshot().props.pages as AdminPageItem[]).push({
        component: {},
        key: 'c',
        title: 'C',
        type: 'component',
      });
    }).toThrow();

    api.setActiveKey('b');
    expect(api.getSnapshot().computed.activeKey).toBe('a');
  });

  it('resolves page item content through shared component/route dispatcher', () => {
    const renderComponent = vi.fn(() => 'component-content');
    const renderRoute = vi.fn(() => 'route-content');

    const componentItem: AdminPageItem = {
      component: {},
      key: 'component-1',
      type: 'component',
    };
    const routeItem: AdminPageItem = {
      key: '/a',
      path: '/a',
      type: 'route',
    };

    expect(
      resolvePageItemContent({
        page: componentItem,
        renderComponent,
        renderRoute,
      })
    ).toBe('component-content');
    expect(
      resolvePageItemContent({
        page: routeItem,
        renderComponent,
        renderRoute,
      })
    ).toBe('route-content');
    expect(renderComponent).toHaveBeenCalledTimes(1);
    expect(renderRoute).toHaveBeenCalledTimes(1);
  });

  it('resolves active page content with empty/page fallback helper', () => {
    const renderEmpty = vi.fn(() => 'empty');
    const renderPage = vi.fn(() => 'page');

    expect(
      resolvePageActiveContent({
        activePage: null,
        renderEmpty,
        renderPage,
      })
    ).toBe('empty');
    expect(
      resolvePageActiveContent({
        activePage: {
          component: {},
          key: 'component-1',
          type: 'component',
        },
        renderEmpty,
        renderPage,
      })
    ).toBe('page');
    expect(renderEmpty).toHaveBeenCalledTimes(1);
    expect(renderPage).toHaveBeenCalledTimes(1);
  });

  it('resolves shared pane/content class helpers and pane descriptors', () => {
    const pages: AdminPageItem[] = [
      { component: {}, key: 'a', type: 'component' },
      { component: {}, key: 'b', type: 'component' },
    ];
    const panes = resolveKeepInactivePagePanes(pages, 'b');

    expect(resolvePageContentClassName(true)).toBe(
      'admin-page__content admin-page__content--scroll'
    );
    expect(resolvePageContentClassName(false)).toBe(
      'admin-page__content admin-page__content--static'
    );
    expect(resolvePagePaneClassName(true)).toBe(
      'admin-page__pane is-active'
    );
    expect(resolvePagePaneClassName(false)).toBe(
      'admin-page__pane is-inactive'
    );
    expect(isPagePaneActive('a', 'a')).toBe(true);
    expect(isPagePaneActive('a', 'b')).toBe(false);
    expect(panes).toEqual([
      {
        active: false,
        className: 'admin-page__pane is-inactive',
        page: pages[0],
      },
      {
        active: true,
        className: 'admin-page__pane is-active',
        page: pages[1],
      },
    ]);
  });

  it('reconciles keep-inactive pane descriptors incrementally', () => {
    const pages: AdminPageItem[] = [
      { component: {}, key: 'a', type: 'component' },
      { component: {}, key: 'b', type: 'component' },
      { component: {}, key: 'c', type: 'component' },
    ];
    const initialState = createKeepInactivePagePaneState(pages, 'a');
    const switchedState = reconcileKeepInactivePagePaneState(
      initialState,
      pages,
      'c'
    );
    const stableState = reconcileKeepInactivePagePaneState(
      switchedState,
      pages,
      'c'
    );

    expect(switchedState).not.toBe(initialState);
    expect(switchedState.descriptors[0]).not.toBe(initialState.descriptors[0]);
    expect(switchedState.descriptors[1]).toBe(initialState.descriptors[1]);
    expect(switchedState.descriptors[2]).not.toBe(initialState.descriptors[2]);
    expect(stableState).toBe(switchedState);
  });

  it('skips setState updates when nested options are deeply equal', async () => {
    const listener = vi.fn();
    const api = createPageApi({
      router: { currentPath: '/a' },
      scroll: { enabled: true, x: 'hidden', y: 'auto' },
    });
    api.store.subscribe(listener);
    await Promise.resolve();
    listener.mockClear();

    api.setState({
      router: { currentPath: '/a' },
      scroll: { enabled: true, x: 'hidden', y: 'auto' },
    });
    await Promise.resolve();

    expect(listener).not.toHaveBeenCalled();
  });
});
