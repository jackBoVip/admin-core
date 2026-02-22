import { describe, expect, it } from 'vitest';

import {
  getLocale,
  getLocaleVersion,
  setLocale,
  subscribeLocaleChange,
  supportedLocales,
} from '../locales';

describe('table locales', () => {
  it('should expose supported locales', () => {
    expect(supportedLocales).toEqual(['en-US', 'zh-CN']);
  });

  it('should notify locale listeners when locale changed', () => {
    const initialLocale = getLocale();
    const nextLocale = initialLocale === 'zh-CN' ? 'en-US' : 'zh-CN';

    const calls: number[] = [];
    const unsubscribe = subscribeLocaleChange(() => {
      calls.push(getLocaleVersion());
    });

    const startVersion = getLocaleVersion();
    setLocale(nextLocale);

    expect(getLocale()).toBe(nextLocale);
    expect(getLocaleVersion()).toBe(startVersion + 1);
    expect(calls).toHaveLength(1);

    setLocale(nextLocale);
    expect(getLocaleVersion()).toBe(startVersion + 1);
    expect(calls).toHaveLength(1);

    unsubscribe();
    setLocale(initialLocale);
  });
});
