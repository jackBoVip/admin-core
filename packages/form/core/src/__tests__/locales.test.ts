import { describe, expect, it } from 'vitest';
import {
  enUS,
  getLocaleMessages,
  getLocaleVersion,
  registerLocaleMessages,
  setLocale,
  subscribeLocaleChange,
  supportedLocales,
  zhCN,
} from '../locales';

describe('locales', () => {
  it('should expose submit page messages for all locales', () => {
    expect(enUS.submitPage.next).toBeTruthy();
    expect(zhCN.submitPage.previous).toBeTruthy();
  });

  it('should switch submit page locale messages by setLocale', () => {
    setLocale('en-US');
    expect(getLocaleMessages().submitPage.cancel).toBe('Cancel');
    setLocale('zh-CN');
    expect(getLocaleMessages().submitPage.cancel).toBe('取消');
  });

  it('should support runtime locale registration and fallback merge', () => {
    registerLocaleMessages('fr-FR', {
      form: {
        submit: 'Envoyer',
      },
      submitPage: {
        cancel: 'Annuler',
      },
    });
    expect(supportedLocales).toContain('fr-FR');
    setLocale('fr-FR');
    expect(getLocaleMessages().form.submit).toBe('Envoyer');
    expect(getLocaleMessages().form.reset).toBe('重置');
    expect(getLocaleMessages().submitPage.cancel).toBe('Annuler');
    setLocale('zh-CN');
  });

  it('should publish locale change version and subscription updates', () => {
    const before = getLocaleVersion();
    let called = 0;
    const unsubscribe = subscribeLocaleChange(() => {
      called += 1;
    });
    setLocale('en-US');
    unsubscribe();
    setLocale('zh-CN');
    expect(getLocaleVersion()).toBeGreaterThan(before);
    expect(called).toBeGreaterThan(0);
  });
});
