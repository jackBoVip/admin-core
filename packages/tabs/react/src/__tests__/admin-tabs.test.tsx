import { setAdminTabsLocale } from '@admin-core/tabs-core';
import {
  act,
  create,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { AdminTabs } from '../components/AdminTabs';

/** 测试桩数据项（对应 `antd Tabs.items`）。 */
interface MockTabsItem {
  /** 标签唯一键。 */
  key: string;
  /** 标签展示内容。 */
  label: React.ReactNode;
}

/** 测试桩属性定义（对应 `antd Tabs`）。 */
interface MockTabsProps {
  /** 当前激活键。 */
  activeKey?: string;
  /** 额外类名。 */
  className?: string;
  /** 标签项列表。 */
  items?: MockTabsItem[];
  /** 切换回调。 */
  onChange?: (key: string) => void;
  /** 行内样式。 */
  style?: React.CSSProperties;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('antd', async () => {
  const React = await import('react');
  return {
    Tabs: ({
      activeKey,
      className,
      items = [],
      onChange,
      style,
    }: MockTabsProps) => {
      return React.createElement(
        'div',
        {
          className,
          'data-active-key': activeKey,
          style,
        },
        React.createElement(
          'button',
          {
            'data-testid': 'switch-first',
            onClick: () => onChange?.(items[0]?.key ?? ''),
            type: 'button',
          },
          'switch'
        ),
        ...items.map((item) =>
          React.createElement(
            'div',
            { 'data-testid': `tab-${item.key}`, key: item.key },
            item.label
          )
        )
      );
    },
  };
});

describe('AdminTabs (react)', () => {
  /**
   * 断言测试渲染器实例存在。
   * @param renderer 测试渲染器实例。
   * @returns 非空渲染器实例。
   */
  const ensureRenderer = (renderer: null | ReactTestRenderer) => {
    if (!renderer) {
      throw new Error('expected react test renderer instance');
    }
    return renderer;
  };
  const items = [
    { closable: true, key: 'overview', title: 'Overview' },
    { closable: true, key: 'detail', title: 'Detail' },
  ];

  afterEach(() => {
    setAdminTabsLocale({ close: 'Close' });
  });

  it('renders close control as native button and injects css vars', () => {
    let tree: null | ReactTestRenderer = null;
    act(() => {
      tree = create(
        <AdminTabs
          items={items}
          tabs={{
            contentInsetTop: -20,
            stickyTop: 8,
          }}
        />
      );
    });
    const renderer = ensureRenderer(tree);

    const root = renderer.root.find((node) => {
      return (
        node.type === 'div' &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('admin-tabs')
      );
    });
    expect(root.props.style['--admin-tabs-content-inset-top']).toBe('-20px');
    expect(root.props.style['--admin-tabs-sticky-top']).toBe('8px');

    const [closeButton] = renderer.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });
    expect(closeButton.props.type).toBe('button');

    act(() => {
      renderer.unmount();
    });
  });

  it('uses react adapter default contentInsetTop when user does not configure', () => {
    let tree: null | ReactTestRenderer = null;
    act(() => {
      tree = create(<AdminTabs items={items} />);
    });
    const renderer = ensureRenderer(tree);

    const root = renderer.root.find((node) => {
      return (
        node.type === 'div' &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('admin-tabs')
      );
    });
    expect(root.props.style['--admin-tabs-content-inset-top']).toBe('-10px');

    act(() => {
      renderer.unmount();
    });
  });

  it('updates close label when locale changes at runtime', () => {
    let tree: null | ReactTestRenderer = null;
    act(() => {
      tree = create(<AdminTabs items={items} />);
    });
    const renderer = ensureRenderer(tree);

    const [firstCloseBefore] = renderer.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });
    expect(firstCloseBefore.props['aria-label']).toBe('Close');

    act(() => {
      setAdminTabsLocale({ close: '关闭' });
    });

    const [firstCloseAfter] = renderer.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });
    expect(firstCloseAfter.props['aria-label']).toBe('关闭');

    act(() => {
      renderer.unmount();
    });
  });

  it('emits onClose when close button is clicked', () => {
    const onClose = vi.fn();
    let tree: null | ReactTestRenderer = null;
    act(() => {
      tree = create(<AdminTabs items={items} onClose={onClose} />);
    });
    const renderer = ensureRenderer(tree);

    const [closeButton] = renderer.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });

    act(() => {
      closeButton.props.onClick({
        preventDefault: () => {},
        stopPropagation: () => {},
      });
    });

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'overview',
      })
    );

    act(() => {
      renderer.unmount();
    });
  });
});
