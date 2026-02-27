import {
  getLocale,
  getLocaleMessages,
  normalizePageLocale,
  registerPageLocaleMessages,
  setLocale,
  supportedLocales,
} from '../index';

describe('page locales', () => {
  it('normalizes locale by language', () => {
    expect(normalizePageLocale('en-GB')).toBe('en-US');
    expect(normalizePageLocale('zh-HK')).toBe('zh-CN');
    expect(normalizePageLocale('fr-FR')).toBe('zh-CN');
  });

  it('includes built-in query-table layout toggle locale messages', () => {
    setLocale('zh-CN');
    expect(getLocaleMessages().page.queryTableSwitchToFixed).toBe('切换为固定模式');
    expect(getLocaleMessages().page.queryTableSwitchToFlow).toBe('切换为滚动模式');

    setLocale('en-US');
    expect(getLocaleMessages().page.queryTableSwitchToFixed).toBe(
      'Switch to fixed mode'
    );
    expect(getLocaleMessages().page.queryTableSwitchToFlow).toBe(
      'Switch to flow mode'
    );

    setLocale('zh-CN');
  });

  it('supports registering custom locale messages', () => {
    registerPageLocaleMessages('fr-FR', {
      page: {
        empty: 'Aucune page',
      },
    });
    expect(supportedLocales).toContain('fr-FR');
    setLocale('fr-FR');
    expect(getLocale()).toBe('fr-FR');
    expect(getLocaleMessages().page.empty).toBe('Aucune page');
    setLocale('zh-CN');
  });
});
