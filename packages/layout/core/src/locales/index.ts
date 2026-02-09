/**
 * 国际化导出
 */

import enUS from './en-US';
import zhCN from './zh-CN';

export { zhCN, enUS };

export type { LayoutLocale } from './zh-CN';

/**
 * 内置语言包
 */
export const builtinLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const;

/**
 * 支持的语言类型
 */
export type SupportedLocale = keyof typeof builtinLocales;

/**
 * 创建国际化工具
 * @param locale 当前语言
 * @param customMessages 自定义消息（用于扩展）
 */
export function createI18n(
  locale: SupportedLocale = 'zh-CN',
  customMessages?: Record<string, Record<string, unknown>>
) {
  const messages = {
    ...builtinLocales,
    ...customMessages,
  };

  /**
   * 获取翻译文本
   * @param key 键名，支持点号分隔（如 'layout.header.title'）
   * @param params 插值参数
   */
  function t(key: string, params?: Record<string, unknown>): string {
    const keys = key.split('.');
    let result: unknown = messages[locale];

    for (const k of keys) {
      if (result && typeof result === 'object') {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    if (typeof result !== 'string') {
      return key;
    }

    // 处理插值
    if (params) {
      return result.replace(/\{(\w+)\}/g, (_, name) => {
        return params[name] !== undefined ? String(params[name]) : `{${name}}`;
      });
    }

    return result;
  }

  /**
   * 切换语言
   */
  function setLocale(newLocale: SupportedLocale) {
    locale = newLocale;
  }

  /**
   * 获取当前语言
   */
  function getLocale(): SupportedLocale {
    return locale;
  }

  /**
   * 添加自定义消息
   */
  function addMessages(newLocale: string, newMessages: Record<string, unknown>) {
    if (!messages[newLocale as SupportedLocale]) {
      (messages as Record<string, unknown>)[newLocale] = {};
    }
    Object.assign(messages[newLocale as SupportedLocale], newMessages);
  }

  return {
    t,
    setLocale,
    getLocale,
    addMessages,
    messages,
  };
}

export type I18nInstance = ReturnType<typeof createI18n>;

/**
 * 获取所有支持的语言列表
 */
export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(builtinLocales) as SupportedLocale[];
}

/**
 * 获取语言的显示标签
 * @param locale 语言代码
 * @param i18n 国际化实例（可选，用于获取翻译）
 */
export function getLocaleLabel(locale: SupportedLocale, i18n?: I18nInstance): string {
  if (i18n) {
    return i18n.t(`layout.widgetLegacy.locale.${locale}`);
  }
  // 默认标签
  const defaultLabels: Record<SupportedLocale, string> = {
    'zh-CN': '简体中文',
    'en-US': 'English',
  };
  return defaultLabels[locale] || locale;
}

/**
 * 获取语言显示列表（用于下拉菜单等）
 * @param i18n 国际化实例（可选，用于获取翻译）
 */
export function getLocaleDisplayList(i18n?: I18nInstance): Array<{ label: string; value: SupportedLocale }> {
  return getSupportedLocales().map(locale => ({
    label: getLocaleLabel(locale, i18n),
    value: locale,
  }));
}
