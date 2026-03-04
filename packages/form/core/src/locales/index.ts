/**
 * Form Core 国际化运行时。
 * @description 负责语言包注册、切换、回退与版本订阅管理。
 */
import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type { AdminFormLocaleMessages, LocaleMessageInput } from './types';

/**
 * 内置支持的语言代码。
 */
export type BuiltInSupportedLocale = 'en-US' | 'zh-CN';
/**
 * 支持的语言代码（含扩展自定义语言）。
 */
export type SupportedLocale = BuiltInSupportedLocale | (string & {});

/**
 * 注册语言包时的行为选项。
 */
export interface RegisterLocaleMessagesOptions {
  /** 是否先回退到同语言前缀的基础包再合并。 */
  replace?: boolean;
}

/** 内置语言包映射。 */
const BUILTIN_LOCALES = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as Record<BuiltInSupportedLocale, AdminFormLocaleMessages>;

/** 语言包注册表。 */
const localeMessagesMap = new Map<string, AdminFormLocaleMessages>(
  Object.entries(BUILTIN_LOCALES)
);

/** 当前生效语言。 */
let currentLocale: SupportedLocale = 'zh-CN';
/** 语言版本号，语言切换或语言包变更时递增。 */
let localeVersion = 0;
/** 语言变更订阅器集合。 */
const localeChangeListeners = new Set<() => void>();

/**
 * 当前支持的语言代码列表。
 * 该数组会在注册新语言时原地更新，便于外部保持引用稳定。
 */
export const supportedLocales: string[] = Array.from(localeMessagesMap.keys());

/**
 * 同步导出的 `supportedLocales` 列表。
 */
function syncSupportedLocales() {
  supportedLocales.splice(0, supportedLocales.length, ...localeMessagesMap.keys());
}

/**
 * 通知语言变更订阅者。
 */
function notifyLocaleChange() {
  localeVersion += 1;
  for (const listener of localeChangeListeners) {
    listener();
  }
}

/**
 * 规范化语言代码。
 * @param locale 原始语言代码。
 * @returns 规范化后的语言代码。
 */
function normalizeLocale(locale: string) {
  return String(locale || '').trim();
}

/**
 * 按语言前缀匹配语言包（如 `zh-TW` -> `zh-CN`）。
 * @param locale 目标语言代码。
 * @returns 匹配到的语言包，未命中返回 `null`。
 */
function resolveByLanguage(locale: string) {
  const [language] = locale.split(/[-_]/);
  if (!language) return null;
  for (const [key, messages] of localeMessagesMap) {
    if (key.toLowerCase().startsWith(`${language.toLowerCase()}-`)) {
      return messages;
    }
  }
  return null;
}

/**
 * 解析语言包，按“精确匹配 -> 忽略大小写 -> 语言前缀 -> 默认中文”回退。
 * @param locale 目标语言代码。
 * @returns 语言包对象。
 */
function resolveLocaleMessages(locale: string): AdminFormLocaleMessages {
  const normalized = normalizeLocale(locale);
  const exact = localeMessagesMap.get(normalized);
  if (exact) {
    return exact;
  }
  for (const [key, messages] of localeMessagesMap) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return messages;
    }
  }
  const byLanguage = resolveByLanguage(normalized);
  if (byLanguage) {
    return byLanguage;
  }
  return localeMessagesMap.get('zh-CN') || zhCN;
}

/**
 * 合并语言包增量配置。
 * @param base 基础语言包。
 * @param patch 增量覆盖配置。
 * @returns 合并后的语言包。
 */
function mergeLocaleMessages(
  base: AdminFormLocaleMessages,
  patch: LocaleMessageInput
): AdminFormLocaleMessages {
  return {
    form: {
      ...base.form,
      ...(patch.form ?? {}),
    },
    submitPage: {
      ...base.submitPage,
      ...(patch.submitPage ?? {}),
    },
  };
}

/**
 * 获取指定语言包；未传则返回当前语言包。
 * @param locale 目标语言代码。
 * @returns 语言包对象。
 */
export function getLocaleMessages(locale?: SupportedLocale) {
  const target = locale ?? currentLocale;
  return resolveLocaleMessages(target);
}

/**
 * 设置当前语言。
 * @param locale 目标语言代码。
 * @returns 无返回值。
 */
export function setLocale(locale: SupportedLocale) {
  const normalized = normalizeLocale(locale);
  if (!normalized || normalized === currentLocale) {
    return;
  }
  currentLocale = normalized;
  notifyLocaleChange();
}

/**
 * 注册或覆盖语言包。
 * @param locale 语言代码。
 * @param messages 语言包增量。
 * @param options 注册选项。
 * @returns 无返回值。
 */
export function registerLocaleMessages(
  locale: SupportedLocale,
  messages: LocaleMessageInput,
  options: RegisterLocaleMessagesOptions = {}
) {
  const key = normalizeLocale(locale);
  if (!key) return;
  const current = options.replace
    ? resolveByLanguage(key) || resolveLocaleMessages('zh-CN')
    : resolveLocaleMessages(key);
  const merged = mergeLocaleMessages(current, messages);
  localeMessagesMap.set(key, merged);
  syncSupportedLocales();
  notifyLocaleChange();
}

/**
 * 获取当前语言代码。
 * @returns 当前语言代码。
 */
export function getCurrentLocale(): SupportedLocale {
  return currentLocale;
}

/**
 * 获取语言版本号（语言或语言包变更后递增）。
 * @returns 当前语言版本号。
 */
export function getLocaleVersion() {
  return localeVersion;
}

/**
 * 订阅语言变更事件。
 * @param listener 变更回调。
 * @returns 取消订阅函数。
 */
export function subscribeLocaleChange(listener: () => void) {
  localeChangeListeners.add(listener);
  return () => {
    localeChangeListeners.delete(listener);
  };
}

/**
 * 格式化消息模板，替换 `{key}` 占位符。
 * @param template 模板字符串。
 * @param vars 占位符变量映射。
 * @returns 格式化后的字符串。
 */
export function formatLocaleMessage(template: string, vars: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => vars[key] ?? '');
}

/** 内置英文与中文语言包。 */
export { enUS, zhCN };
/** 语言包完整类型与增量补丁类型。 */
export type { AdminFormLocaleMessages, LocaleMessageInput };
