
/**
 * Table Core 国际化运行时。
 * @description 负责语言包读取、切换、版本追踪与订阅通知。
 */
import { enUS } from './en-US';
import { zhCN } from './zh-CN';
import type { SupportedLocale, TableLocaleMessages } from '../types';

/** 内置表格语言包映射。 */
const localeMap: Record<SupportedLocale, TableLocaleMessages> = {
  'en-US': enUS,
  'zh-CN': zhCN,
};

/** 当前生效语言。 */
let currentLocale: SupportedLocale = 'zh-CN';
/** 语言版本号（变更时自增）。 */
let localeVersion = 0;
/** 语言变更订阅器集合。 */
const localeListeners = new Set<() => void>();

/**
 * 通知语言变更并递增版本号。
 * @returns 无返回值。
 */
function notifyLocaleChange() {
  localeVersion += 1;
  localeListeners.forEach((listener) => {
    listener();
  });
}

/**
 * 获取当前语言文案。
 * @returns 当前语言对应的文案对象。
 */
export function getLocaleMessages() {
  return localeMap[currentLocale];
}

/**
 * 获取当前语言标识。
 * @returns 当前语言。
 */
export function getLocale() {
  return currentLocale;
}

/**
 * 设置当前语言。
 * @param locale 目标语言。
 * @returns 无返回值。
 */
export function setLocale(locale: SupportedLocale) {
  if (currentLocale === locale) {
    return;
  }
  currentLocale = locale;
  notifyLocaleChange();
}

/**
 * 获取语言版本号。
 * @returns 当前语言版本号。
 */
export function getLocaleVersion() {
  return localeVersion;
}

/**
 * 订阅语言变更事件。
 * @param listener 变更监听器。
 * @returns 取消订阅函数。
 */
export function subscribeLocaleChange(listener: () => void) {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

/** 当前支持的语言列表。 */
export const supportedLocales = Object.keys(localeMap) as SupportedLocale[];

/** 导出内置英文与中文语言包。 */
export { enUS, zhCN };
