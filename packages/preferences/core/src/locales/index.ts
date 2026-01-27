/**
 * 国际化模块
 * @description 支持动态注册和自定义语言包
 */

import { zhCN } from './zh-CN';
import { enUS } from './en-US';

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
let registeredLocales: Array<{
  label: string;
  value: string;
  englishName: string;
}> = [
  { label: '简体中文', value: 'zh-CN', englishName: 'Chinese (Simplified)' },
  { label: 'English', value: 'en-US', englishName: 'English' },
];

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
  
  if (options && !registeredLocales.find(l => l.value === locale)) {
    registeredLocales.push({
      label: options.label,
      value: locale,
      englishName: options.englishName ?? options.label,
    });
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
  const item = registeredLocales.find((l) => l.value === locale);
  return item?.label ?? locale;
}

/**
 * 根据路径从语言包获取翻译文本
 */
export function getTranslation(messages: LocaleMessages, path: string): string {
  const keys = path.split('.');
  let result: unknown = messages;

  for (const key of keys) {
    if (result === null || result === undefined || typeof result !== 'object') {
      return path;
    }
    result = (result as Record<string, unknown>)[key];
  }

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
