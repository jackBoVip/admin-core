import { setAdminTabsLocale } from '@admin-core/tabs-core';
import { mount } from '@vue/test-utils';
import { nextTick } from 'vue';

import { AdminTabs } from '../components/AdminTabs';

describe('AdminTabs (vue)', () => {
  const items = [
    { closable: true, key: 'overview', title: 'Overview' },
    { closable: true, key: 'detail', title: 'Detail' },
  ];

  afterEach(() => {
    setAdminTabsLocale({ close: 'Close' });
  });

  it('renders close control as native button and injects css vars', () => {
    const wrapper = mount(AdminTabs, {
      props: {
        items,
        tabs: {
          contentInsetTop: -15,
          stickyTop: 6,
        },
      },
    });

    const root = wrapper.find('.admin-tabs');
    expect(root.exists()).toBe(true);
    expect(root.element.style.getPropertyValue('--admin-tabs-content-inset-top')).toBe('-15px');
    expect(root.element.style.getPropertyValue('--admin-tabs-sticky-top')).toBe('6px');

    const close = wrapper.find('.admin-tabs__tab-close');
    expect(close.exists()).toBe(true);
    expect(close.element.tagName).toBe('BUTTON');

    wrapper.unmount();
  });

  it('uses vue adapter default contentInsetTop when user does not configure', () => {
    const wrapper = mount(AdminTabs, {
      props: { items },
    });

    const root = wrapper.find('.admin-tabs');
    expect(root.element.style.getPropertyValue('--admin-tabs-content-inset-top')).toBe('-30px');

    wrapper.unmount();
  });

  it('updates close label when locale changes at runtime', async () => {
    const wrapper = mount(AdminTabs, {
      props: { items },
    });

    expect(wrapper.find('.admin-tabs__tab-close').attributes('aria-label')).toBe('Close');

    setAdminTabsLocale({ close: '关闭' });
    await nextTick();

    expect(wrapper.find('.admin-tabs__tab-close').attributes('aria-label')).toBe('关闭');

    wrapper.unmount();
  });

  it('emits close callback when close control is clicked', async () => {
    const onClose = vi.fn();
    const wrapper = mount(AdminTabs, {
      props: {
        items,
        onClose,
      },
    });

    await wrapper.find('.admin-tabs__tab-close').trigger('click');
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledWith(
      expect.objectContaining({
        key: 'overview',
      })
    );

    wrapper.unmount();
  });
});
