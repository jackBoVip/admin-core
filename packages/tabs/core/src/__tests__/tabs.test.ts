import {
  createAdminTabsChangePayload,
  createAdminTabsClosePayload,
  resolveAdminTabsActiveItem,
  resolveAdminTabsActiveKey,
  resolveAdminTabsCssLength,
  resolveAdminTabsItemsSignature,
  resolveAdminTabsOptionsWithDefaults,
  resolveAdminTabsRootClassNames,
  resolveAdminTabsSelectedActiveKey,
  resolveAdminTabsShowClose,
  resolveAdminTabsStyleVars,
  resolveAdminTabsUncontrolledActiveKey,
  getAdminTabsLocaleVersion,
  normalizeAdminTabsOptions,
  resolveAdminTabsVisible,
  setAdminTabsLocale,
  subscribeAdminTabsLocale,
} from '../index';

describe('tabs core utils', () => {
  it('normalizes boolean config', () => {
    expect(normalizeAdminTabsOptions(false)).toEqual({
      align: 'left',
      contentInsetTop: 0,
      enabled: false,
      hideWhenSingle: true,
      sticky: true,
      stickyTop: 0,
    });
  });

  it('hides tabs when only one item and hideWhenSingle=true', () => {
    expect(
      resolveAdminTabsVisible({ enabled: true, hideWhenSingle: true }, [{ key: 'a' }])
    ).toBe(false);
  });

  it('shows tabs when at least two items', () => {
    expect(resolveAdminTabsVisible(true, [{ key: 'a' }, { key: 'b' }])).toBe(true);
  });

  it('resolves active key/item with fallback', () => {
    const items = [{ key: 'a' }, { key: 'b' }];
    expect(resolveAdminTabsActiveKey(items, 'b')).toBe('b');
    expect(resolveAdminTabsActiveKey(items, 'x')).toBe('a');
    expect(resolveAdminTabsActiveItem(items, 'b')).toEqual({ key: 'b' });
    expect(resolveAdminTabsActiveItem(items, null)).toEqual({ key: 'a' });
    expect(resolveAdminTabsActiveItem([], null)).toBeNull();
  });

  it('resolves css helper outputs', () => {
    expect(resolveAdminTabsCssLength(12)).toBe('12px');
    expect(resolveAdminTabsCssLength('2rem')).toBe('2rem');
    expect(resolveAdminTabsStyleVars({ contentInsetTop: -8, stickyTop: '0px' })).toEqual({
      '--admin-tabs-content-inset-top': '-8px',
      '--admin-tabs-sticky-top': '0px',
    });
  });

  it('resolves root classes and uncontrolled key', () => {
    expect(
      resolveAdminTabsRootClassNames(
        { align: 'left', sticky: true },
        ['extra-a', null, false, 'extra-b']
      )
    ).toEqual([
      'admin-tabs',
      'admin-tabs--align-left',
      'admin-tabs--sticky',
      'extra-a',
      'extra-b',
    ]);

    const items = [{ key: 'a' }, { key: 'b' }];
    expect(resolveAdminTabsUncontrolledActiveKey(items, 'b', 'a')).toBe('b');
    expect(resolveAdminTabsUncontrolledActiveKey(items, 'x', 'a')).toBe('a');
    expect(resolveAdminTabsUncontrolledActiveKey(items, null, null)).toBe('a');
  });

  it('resolves item signature', () => {
    expect(resolveAdminTabsItemsSignature([{ key: 'a' }, { key: 'b' }])).toBe('a||b');
    expect(resolveAdminTabsItemsSignature(undefined)).toBe('');
  });

  it('resolves tabs options with adapter defaults', () => {
    const defaults = { contentInsetTop: -30, stickyTop: 0 };
    expect(resolveAdminTabsOptionsWithDefaults(undefined, defaults)).toEqual(defaults);
    expect(resolveAdminTabsOptionsWithDefaults(true, defaults)).toEqual(defaults);
    expect(resolveAdminTabsOptionsWithDefaults(false, defaults)).toBe(false);
    expect(
      resolveAdminTabsOptionsWithDefaults(
        { align: 'right', contentInsetTop: -12 },
        defaults
      )
    ).toEqual({
      align: 'right',
      contentInsetTop: -12,
      stickyTop: 0,
    });
  });

  it('resolves selected key and close visibility', () => {
    const items = [{ key: 'a' }, { key: 'b' }];
    expect(
      resolveAdminTabsSelectedActiveKey(items, {
        controlledActiveKey: 'b',
        isControlled: true,
        uncontrolledActiveKey: 'a',
      })
    ).toBe('b');
    expect(
      resolveAdminTabsSelectedActiveKey(items, {
        controlledActiveKey: null,
        isControlled: false,
        uncontrolledActiveKey: 'a',
      })
    ).toBe('a');
    expect(resolveAdminTabsShowClose(items)).toBe(true);
    expect(resolveAdminTabsShowClose([{ key: 'a' }])).toBe(false);
  });

  it('creates payload helpers', () => {
    const items = [{ key: 'a', title: 'A' }, { key: 'b', title: 'B' }];
    expect(createAdminTabsChangePayload(items, 'b')).toEqual({
      activeKey: 'b',
      item: { key: 'b', title: 'B' },
    });
    expect(createAdminTabsClosePayload({ key: 'a', title: 'A' })).toEqual({
      item: { key: 'a', title: 'A' },
      key: 'a',
    });
  });

  it('notifies locale subscribers when locale changes', () => {
    const initialVersion = getAdminTabsLocaleVersion();
    let called = 0;
    const unsubscribe = subscribeAdminTabsLocale(() => {
      called += 1;
    });

    setAdminTabsLocale({ close: '关闭' });
    unsubscribe();
    setAdminTabsLocale({ close: 'Close' });

    expect(called).toBe(1);
    expect(getAdminTabsLocaleVersion()).toBe(initialVersion + 2);
  });
});
