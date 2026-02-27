import { setAdminTabsLocale } from '@admin-core/tabs-core';
import {
  act,
  create,
  type ReactTestRenderer,
} from 'react-test-renderer';

import { AdminTabs } from '../components/AdminTabs';

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
    }: {
      activeKey?: string;
      className?: string;
      items?: Array<{ key: string; label: React.ReactNode }>;
      onChange?: (key: string) => void;
      style?: React.CSSProperties;
    }) => {
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
  const items = [
    { closable: true, key: 'overview', title: 'Overview' },
    { closable: true, key: 'detail', title: 'Detail' },
  ];

  afterEach(() => {
    setAdminTabsLocale({ close: 'Close' });
  });

  it('renders close control as native button and injects css vars', () => {
    let tree: ReactTestRenderer;
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

    const root = tree!.root.find((node) => {
      return (
        node.type === 'div' &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('admin-tabs')
      );
    });
    expect(root.props.style['--admin-tabs-content-inset-top']).toBe('-20px');
    expect(root.props.style['--admin-tabs-sticky-top']).toBe('8px');

    const [closeButton] = tree!.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });
    expect(closeButton.props.type).toBe('button');

    act(() => {
      tree!.unmount();
    });
  });

  it('uses react adapter default contentInsetTop when user does not configure', () => {
    let tree: ReactTestRenderer;
    act(() => {
      tree = create(<AdminTabs items={items} />);
    });

    const root = tree!.root.find((node) => {
      return (
        node.type === 'div' &&
        typeof node.props.className === 'string' &&
        node.props.className.includes('admin-tabs')
      );
    });
    expect(root.props.style['--admin-tabs-content-inset-top']).toBe('-10px');

    act(() => {
      tree!.unmount();
    });
  });

  it('updates close label when locale changes at runtime', () => {
    let tree: ReactTestRenderer;
    act(() => {
      tree = create(<AdminTabs items={items} />);
    });

    const [firstCloseBefore] = tree!.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });
    expect(firstCloseBefore.props['aria-label']).toBe('Close');

    act(() => {
      setAdminTabsLocale({ close: '关闭' });
    });

    const [firstCloseAfter] = tree!.root.findAll((node) => {
      return (
        node.type === 'button' &&
        node.props.className === 'admin-tabs__tab-close'
      );
    });
    expect(firstCloseAfter.props['aria-label']).toBe('关闭');

    act(() => {
      tree!.unmount();
    });
  });

  it('emits onClose when close button is clicked', () => {
    const onClose = vi.fn();
    let tree: ReactTestRenderer;
    act(() => {
      tree = create(<AdminTabs items={items} onClose={onClose} />);
    });

    const [closeButton] = tree!.root.findAll((node) => {
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
      tree!.unmount();
    });
  });
});
