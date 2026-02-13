import { describe, expect, it } from 'vitest';
import { enUS, getLocaleMessages, setLocale, zhCN } from '../locales';

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
});
