/**
 * 选项工厂
 * @description 预处理翻译后的选项数据，避免组件内重复转换
 */

import {
  LAYOUT_OPTIONS,
  PAGE_TRANSITION_OPTIONS,
  TABS_STYLE_OPTIONS,
  BREADCRUMB_STYLE_OPTIONS,
  NAVIGATION_STYLE_OPTIONS,
  CONTENT_COMPACT_OPTIONS,
  HEADER_MODE_OPTIONS,
  HEADER_MENU_ALIGN_OPTIONS,
  RADIUS_OPTIONS,
} from '../constants';
import {
  translateOptions,
  supportedLocales,
  type LocaleMessages,
} from '../locales';
import type {
  LayoutType,
  PageTransitionType,
  TabsStyleType,
  BreadcrumbStyleType,
  NavigationStyleType,
  ContentCompactType,
  LayoutHeaderModeType,
  LayoutHeaderMenuAlignType,
  SupportedLanguagesType,
} from '../types';

/**
 * 翻译后的选项类型
 */
export interface TranslatedOption<T = string> {
  label: string;
  value: T;
}

/**
 * 语言选项类型
 */
export interface LanguageOption {
  label: string;
  value: SupportedLanguagesType;
}

/**
 * 所有预翻译选项
 */
export interface TranslatedOptions {
  /** 布局选项 */
  layoutOptions: TranslatedOption<LayoutType>[];
  /** 页面动画选项 */
  animationOptions: TranslatedOption<PageTransitionType>[];
  /** 标签栏样式选项 */
  tabsStyleOptions: TranslatedOption<TabsStyleType>[];
  /** 面包屑样式选项 */
  breadcrumbStyleOptions: TranslatedOption<BreadcrumbStyleType>[];
  /** 导航样式选项 */
  navigationStyleOptions: TranslatedOption<NavigationStyleType>[];
  /** 内容紧凑选项 */
  contentCompactOptions: TranslatedOption<ContentCompactType>[];
  /** 头部模式选项 */
  headerModeOptions: TranslatedOption<LayoutHeaderModeType>[];
  /** 头部菜单对齐选项 */
  headerMenuAlignOptions: TranslatedOption<LayoutHeaderMenuAlignType>[];
  /** 语言选项 */
  languageOptions: LanguageOption[];
  /** 圆角选项 */
  radiusOptions: typeof RADIUS_OPTIONS;
}

/**
 * 创建预翻译的选项
 * @param locale - 语言包
 * @returns 翻译后的选项对象
 */
export function createTranslatedOptions(locale: LocaleMessages): TranslatedOptions {
  return {
    layoutOptions: translateOptions(LAYOUT_OPTIONS, locale),
    animationOptions: translateOptions(PAGE_TRANSITION_OPTIONS, locale),
    tabsStyleOptions: translateOptions(TABS_STYLE_OPTIONS, locale),
    breadcrumbStyleOptions: translateOptions(BREADCRUMB_STYLE_OPTIONS, locale),
    navigationStyleOptions: translateOptions(NAVIGATION_STYLE_OPTIONS, locale),
    contentCompactOptions: translateOptions(CONTENT_COMPACT_OPTIONS, locale),
    headerModeOptions: translateOptions(HEADER_MODE_OPTIONS, locale),
    headerMenuAlignOptions: translateOptions(HEADER_MENU_ALIGN_OPTIONS, locale),
    languageOptions: supportedLocales.map((l) => ({
      label: l.label,
      value: l.value as SupportedLanguagesType,
    })),
    radiusOptions: RADIUS_OPTIONS,
  };
}

/**
 * 获取语言选项（静态，不需要翻译）
 */
export function getLanguageOptions(): LanguageOption[] {
  return supportedLocales.map((l) => ({
    label: l.label,
    value: l.value as SupportedLanguagesType,
  }));
}

/**
 * 获取圆角选项（静态）
 */
export function getRadiusOptions(): typeof RADIUS_OPTIONS {
  return RADIUS_OPTIONS;
}
