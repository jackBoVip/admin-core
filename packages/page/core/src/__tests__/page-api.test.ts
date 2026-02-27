import {
  createPageApi,
  pickPageRuntimeStateOptions,
  setupAdminPageCore,
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
});
