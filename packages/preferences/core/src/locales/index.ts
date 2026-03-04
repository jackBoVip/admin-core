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
 * 语言选项项定义。
 */
export interface LocaleOption {
  /** 显示标签。 */
  label: string;
  /** 值。 */
  value: string;
  /** 英文显示名称。 */
  englishName: string;
}

/**
 * 注册语言包时的附加参数。
 */
export interface RegisterLocaleOptions {
  /** 显示标签。 */
  label: string;
  /** 英文显示名称。 */
  englishName?: string;
}

/**
 * 可翻译选项输入结构。
 */
export interface TranslatableOptionInput {
  /** 文案 i18n key。 */
  labelKey: string;
  /** 选项值。 */
  value: string;
}

/**
 * 翻译后的选项结构。
 */
export interface TranslatedOption<TValue extends string = string> {
  /** 显示标签。 */
  label: string;
  /** 选项值。 */
  value: TValue;
}

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
const registeredLocales: LocaleOption[] = [
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
 * @returns 无返回值
 */
export function registerLocale(
  locale: string,
  messages: LocaleMessages,
  options?: RegisterLocaleOptions
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
 * @returns 当前已注册语言包映射的浅拷贝
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
 * @returns 已注册语言选项列表（数组副本）
 */
export function getSupportedLocales() {
  return [...registeredLocales];
}

/**
 * 获取语言显示名称
 * @param locale - 语言标识
 * @returns 对应语言显示名；未注册时返回原标识
 */
export function getLocaleLabel(locale: string): string {
  return localeOptionMap.get(locale)?.label ?? locale;
}

/**
 * 根据路径从语言包获取翻译文本（使用 helpers.get 统一实现）
 * @param messages - 语言包对象
 * @param path - 文案路径
 * @returns 匹配到的翻译文本；缺失时返回路径本身
 */
export function getTranslation(messages: LocaleMessages, path: string): string {
  const result = get<string>(messages, path, path);
  return typeof result === 'string' ? result : path;
}

/**
 * 转换选项数组
 * @param options - 待翻译选项输入列表
 * @param messages - 语言包对象
 * @returns 翻译后的选项数组
 */
export function translateOptions<
  T extends TranslatableOptionInput
>(
  options: readonly T[],
  messages: LocaleMessages
): Array<TranslatedOption<T['value']>> {
  return options.map((opt) => ({
    label: getTranslation(messages, opt.labelKey),
    value: opt.value,
  }));
}

/**
 * 导出内置语言包。
 */
export { zhCN, enUS };
/**
 * 兼容旧版导出字段。
 * @description 保持历史 API 可用，减少升级破坏性。
 */
/** 当前已注册的国际化消息映射。 */
export const localeMessages = localeRegistry;
/** 当前支持的语言列表。 */
export const supportedLocales = registeredLocales;
