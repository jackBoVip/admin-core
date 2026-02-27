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
