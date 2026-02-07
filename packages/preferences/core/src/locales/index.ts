/**
 * 国际化模块
 * @description 支持动态注册和自定义语言包
 */

import { get } from '../utils/helpers';
import { enUS } from './en-US';
import { zhCN } from './zh-CN';

/**
 * 语言消息类型
 */
export type LocaleMessages = typeof zhCN;

/**
 * 内部语言包存储
 */
const localeRegistry: Record<string, LocaleMessages> = {
  'zh-CN': zhCN,
  'en-US': enUS,
};

/**
 * 支持的语言列表
 */
const registeredLocales: Array<{
  label: string;
  value: string;
  englishName: string;
}> = [
  { label: '简体中文', value: 'zh-CN', englishName: 'Chinese (Simplified)' },
  { label: 'English', value: 'en-US', englishName: 'English' },
];

const localeOptionMap = new Map(
  registeredLocales.map((locale) => [locale.value, locale])
);

/**
 * 注册新的语言包
 * @param locale - 语言标识
 * @param messages - 语言包数据
 * @param options - 语言信息（名称等）
 */
export function registerLocale(
  locale: string,
  messages: LocaleMessages,
  options?: { label: string; englishName?: string }
): void {
  localeRegistry[locale] = messages;
  
  if (options && !localeOptionMap.has(locale)) {
    const entry = {
      label: options.label,
      value: locale,
      englishName: options.englishName ?? options.label,
    };
    registeredLocales.push(entry);
    localeOptionMap.set(locale, entry);
  }
}

/**
 * 获取所有语言包映射
 */
export function getLocaleRegistry(): Record<string, LocaleMessages> {
  return { ...localeRegistry };
}

/**
 * 获取语言包
 * @param locale - 语言标识
 * @returns 语言包
 */
export function getLocaleMessages(locale: string): LocaleMessages {
  return localeRegistry[locale] ?? localeRegistry['zh-CN'];
}

/**
 * 获取当前注册的所有语言选项
 */
export function getSupportedLocales() {
  return [...registeredLocales];
}

/**
 * 获取语言显示名称
 */
export function getLocaleLabel(locale: string): string {
  return localeOptionMap.get(locale)?.label ?? locale;
}

/**
 * 根据路径从语言包获取翻译文本（使用 helpers.get 统一实现）
 */
export function getTranslation(messages: LocaleMessages, path: string): string {
  const result = get<string>(messages, path, path);
  return typeof result === 'string' ? result : path;
}

/**
 * 转换选项数组
 */
export function translateOptions<T extends { labelKey: string; value: string }>(
  options: readonly T[],
  messages: LocaleMessages
): Array<{ label: string; value: T['value'] }> {
  return options.map((opt) => ({
    label: getTranslation(messages, opt.labelKey),
    value: opt.value,
  }));
}

// 导出内置语言包
export { zhCN, enUS };
// 兼容旧导出
export const localeMessages = localeRegistry;
export const supportedLocales = registeredLocales;
