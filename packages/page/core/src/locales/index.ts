/**
 * Page Core 国际化运行时。
 * @description 负责语言包注册、解析、回退与变更订阅，供各框架适配层共享。
 */
import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type {
  BuiltInSupportedLocale,
  PageLocaleMessageInput,
  PageLocaleMessages,
  SupportedLocale,
} from '../types';

/** 内置语言包映射。 */
const BUILTIN_LOCALES = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const satisfies Record<BuiltInSupportedLocale, PageLocaleMessages>;

/** 当前已注册语言包映射。 */
const localeMap = new Map<string, PageLocaleMessages>(
  Object.entries(BUILTIN_LOCALES)
);

/** 当前生效语言。 */
let currentLocale: SupportedLocale = 'zh-CN';
/** 语言版本号（每次变更自增）。 */
let localeVersion = 0;
/** 语言变更订阅器集合。 */
const localeListeners = new Set<() => void>();
/** 当前支持语言列表（对外暴露且保持引用稳定）。 */
export const supportedLocales: string[] = Array.from(localeMap.keys());

/** 注册语言包时的附加选项。 */
type RegisterPageLocaleMessagesOptions = {
  /** 是否以内置语言包作为基底后再应用补丁。 */
  replace?: boolean;
};

/**
 * 同步导出的 `supportedLocales` 列表。
 * @returns 无返回值。
 */
function syncSupportedLocales() {
  supportedLocales.splice(0, supportedLocales.length, ...localeMap.keys());
}

/**
 * 标准化 locale 字符串。
 * @param locale 原始 locale。
 * @returns 去除首尾空白后的 locale 字符串。
 */
function normalizeLocale(locale?: null | string) {
  return String(locale ?? '').trim();
}

/**
 * 按语言前缀回退匹配 locale 消息。
 * @param locale 标准化 locale。
 * @returns 命中的语言包；未命中返回 `null`。
 */
function resolveByLanguage(locale: string) {
  const [language] = locale.split(/[-_]/);
  if (!language) {
    return null;
  }
  for (const [key, messages] of localeMap) {
    if (key.toLowerCase().startsWith(`${language.toLowerCase()}-`)) {
      return messages;
    }
  }
  return null;
}

/**
 * 解析 locale 消息，按“精确匹配 -> 忽略大小写 -> 语言前缀 -> 默认中文”回退。
 * @param locale 目标 locale。
 * @returns 对应语言包。
 */
function resolveLocaleMessages(locale: string): PageLocaleMessages {
  const normalized = normalizeLocale(locale);
  const exact = localeMap.get(normalized);
  if (exact) {
    return exact;
  }
  for (const [key, messages] of localeMap) {
    if (key.toLowerCase() === normalized.toLowerCase()) {
      return messages;
    }
  }
  const byLanguage = resolveByLanguage(normalized);
  if (byLanguage) {
    return byLanguage;
  }
  return localeMap.get('zh-CN') ?? zhCN;
}

/**
 * 合并语言包补丁。
 * @param base 基础语言包。
 * @param patch 覆盖补丁。
 * @returns 合并后的语言包。
 */
function mergeLocaleMessages(
  base: PageLocaleMessages,
  patch: PageLocaleMessageInput
): PageLocaleMessages {
  return {
    page: {
      ...base.page,
      ...(patch.page ?? {}),
    },
  };
}

/**
 * 广播语言变更并更新版本号。
 * @returns 无返回值。
 */
function notifyLocaleChange() {
  localeVersion += 1;
  localeListeners.forEach((listener) => {
    listener();
  });
}

/**
 * 获取语言包。
 * @param locale 可选目标 locale，不传则用当前 locale。
 * @returns 解析后的语言包对象。
 */
export function getLocaleMessages(locale?: SupportedLocale) {
  return resolveLocaleMessages(locale ?? currentLocale);
}

/**
 * 获取当前 locale。
 * @returns 当前生效的 locale。
 */
export function getLocale() {
  return currentLocale;
}

/**
 * 设置当前 locale。
 * @param locale 目标 locale。
 * @returns 无返回值。
 */
export function setLocale(locale: SupportedLocale) {
  const normalized = normalizeLocale(locale);
  if (!normalized || currentLocale === normalized) {
    return;
  }
  currentLocale = normalized;
  notifyLocaleChange();
}

/**
 * 将任意 locale 归一为内置 locale。
 * @param locale 原始 locale。
 * @param fallback 回退 locale。
 * @returns 归一化后的内置 locale。
 */
export function normalizePageLocale(
  locale?: null | string,
  fallback: BuiltInSupportedLocale = 'zh-CN'
): BuiltInSupportedLocale {
  const normalized = normalizeLocale(locale);
  if (!normalized) {
    return fallback;
  }
  if (normalized.toLowerCase().startsWith('en')) {
    return 'en-US';
  }
  if (normalized.toLowerCase().startsWith('zh')) {
    return 'zh-CN';
  }
  return fallback;
}

/**
 * 注册或覆盖页面语言包。
 * @param locale 目标 locale。
 * @param messages 语言补丁。
 * @param options 注册选项。
 * @returns 无返回值。
 */
export function registerPageLocaleMessages(
  locale: SupportedLocale,
  messages: PageLocaleMessageInput,
  options: RegisterPageLocaleMessagesOptions = {}
) {
  const key = normalizeLocale(locale);
  if (!key) {
    return;
  }

  const base = options.replace
    ? resolveLocaleMessages(normalizePageLocale(key))
    : resolveLocaleMessages(key);

  localeMap.set(key, mergeLocaleMessages(base, messages));
  syncSupportedLocales();
  notifyLocaleChange();
}

/**
 * 获取语言版本号（用于触发订阅更新）。
 * @returns 当前语言版本号。
 */
export function getLocaleVersion() {
  return localeVersion;
}

/**
 * 订阅语言变更。
 * @param listener 变更回调。
 * @returns 取消订阅函数。
 */
export function subscribeLocaleChange(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

/** 内置英文与中文页面语言包。 */
export { enUS, zhCN };
