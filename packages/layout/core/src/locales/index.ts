/**
 * layout-core 国际化导出入口。
 */
import enUS from './en-US';
import zhCN from './zh-CN';

/** 内置中文与英文语言包。 */
export { zhCN, enUS };

/** 布局语言包结构类型。 */
export type { LayoutLocale } from './zh-CN';

/**
 * 内置语言包映射。
 */
export const builtinLocales = {
  'zh-CN': zhCN,
  'en-US': enUS,
} as const;

/**
 * 支持的语言代码类型。
 */
export type SupportedLocale = keyof typeof builtinLocales;

/**
 * 语言下拉展示项。
 */
export interface LocaleDisplayItem {
  /** 显示标签。 */
  label: string;
  /** 语言值。 */
  value: SupportedLocale;
}

/**
 * 国际化实例契约。
 * @description 统一定义翻译、语言切换、消息扩展与消息字典访问能力。
 */
export interface LayoutI18nInstance {
  /**
   * 获取翻译文本。
   * @param key 键名，支持点号分隔（如 `layout.header.title`）。
   * @param params 插值参数。
   * @returns 翻译后的字符串；未命中时返回原键名。
   */
  t: (key: string, params?: Record<string, unknown>) => string;
  /**
   * 切换当前语言。
   * @param newLocale 目标语言代码。
   * @returns 无返回值。
   */
  setLocale: (newLocale: SupportedLocale) => void;
  /**
   * 获取当前语言。
   * @returns 当前语言代码。
   */
  getLocale: () => SupportedLocale;
  /**
   * 合并自定义语言包。
   * @param newLocale 目标语言代码。
   * @param newMessages 新增或覆盖的消息对象。
   * @returns 无返回值。
   */
  addMessages: (newLocale: string, newMessages: Record<string, unknown>) => void;
  /**
   * 当前可用语言消息映射。
   * @description 由内置语言包与调用方自定义语言包合并而成。
   */
  messages: Record<string, Record<string, unknown>>;
}

/**
 * 创建国际化工具实例。
 * @param locale 当前语言。
 * @param customMessages 自定义语言包映射（用于扩展）。
 * @returns 国际化工具实例。
 */
export function createI18n(
  locale: SupportedLocale = 'zh-CN',
  customMessages?: Record<string, Record<string, unknown>>
): LayoutI18nInstance {
  const messages = {
    ...builtinLocales,
    ...customMessages,
  };

  /**
   * 获取翻译文本。
   * @param key 键名，支持点号分隔（如 `layout.header.title`）。
   * @param params 插值参数。
   * @returns 翻译后的字符串；未命中时返回原键名。
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

    /* 处理插值。 */
    if (params) {
      return result.replace(/\{(\w+)\}/g, (_, name) => {
        return params[name] !== undefined ? String(params[name]) : `{${name}}`;
      });
    }

    return result;
  }

  /**
   * 切换当前语言。
   * @param newLocale 目标语言代码。
   * @returns 无返回值。
   */
  function setLocale(newLocale: SupportedLocale) {
    locale = newLocale;
  }

  /**
   * 获取当前语言。
   * @returns 当前语言代码。
   */
  function getLocale(): SupportedLocale {
    return locale;
  }

  /**
   * 合并自定义语言包。
   * @param newLocale 目标语言代码。
   * @param newMessages 新增或覆盖的消息对象。
   * @returns 无返回值。
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

/**
 * `createI18n` 返回实例的类型别名。
 */
export type I18nInstance = LayoutI18nInstance;

/**
 * 获取所有支持的语言列表。
 * @returns 支持的语言代码数组。
 */
export function getSupportedLocales(): SupportedLocale[] {
  return Object.keys(builtinLocales) as SupportedLocale[];
}

/**
 * 获取语言显示标签。
 * @param locale 语言代码。
 * @param i18n 国际化实例（可选，用于获取翻译）。
 * @returns 语言显示文案。
 */
export function getLocaleLabel(locale: SupportedLocale, i18n?: I18nInstance): string {
  if (i18n) {
    return i18n.t(`layout.widgetLegacy.locale.${locale}`);
  }
  /* 默认标签。 */
  const defaultLabels: Record<SupportedLocale, string> = {
    'zh-CN': '简体中文',
    'en-US': 'English',
  };
  return defaultLabels[locale] || locale;
}

/**
 * 获取语言显示列表（用于下拉菜单等）。
 * @param i18n 国际化实例（可选，用于获取翻译）。
 * @returns 语言显示项数组。
 */
export function getLocaleDisplayList(i18n?: I18nInstance): LocaleDisplayItem[] {
  return getSupportedLocales().map(locale => ({
    label: getLocaleLabel(locale, i18n),
    value: locale,
  }));
}
