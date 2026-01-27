/**
 * 通用设置标签页
 * @description 语言、动态标题、水印、动画、小部件等设置
 */
import React, { memo, useMemo, useCallback } from 'react';
import { usePreferences } from '../../hooks';
import {
  PAGE_TRANSITION_OPTIONS,
  supportedLocales,
  translateOptions,
  type LocaleMessages,
  type SupportedLanguagesType,
} from '@admin-core/preferences';
import { Block } from './Block';
import { SwitchItem } from './SwitchItem';
import { SelectItem } from './SelectItem';

export interface GeneralTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

export const GeneralTab: React.FC<GeneralTabProps> = memo(({ locale }) => {
  const { preferences, setPreferences } = usePreferences();

  // 动画选项（翻译后）
  const animationOptions = useMemo(
    () => translateOptions(PAGE_TRANSITION_OPTIONS, locale),
    [locale]
  );

  // 语言选项
  const languageOptions = useMemo(
    () => supportedLocales.map((l) => ({ label: l.label, value: l.value })),
    []
  );

  // ========== 稳定的回调函数 ==========

  // 基础设置处理器
  const handleSetLocale = useCallback((v: string | number) => {
    setPreferences({ app: { locale: String(v) as SupportedLanguagesType } });
  }, [setPreferences]);

  const handleSetDynamicTitle = useCallback((v: boolean) => {
    setPreferences({ app: { dynamicTitle: v } });
  }, [setPreferences]);

  const handleSetWatermark = useCallback((v: boolean) => {
    setPreferences({ app: { watermark: v } });
  }, [setPreferences]);

  const handleSetColorWeakMode = useCallback((v: boolean) => {
    setPreferences({ app: { colorWeakMode: v } });
  }, [setPreferences]);

  const handleSetColorGrayMode = useCallback((v: boolean) => {
    setPreferences({ app: { colorGrayMode: v } });
  }, [setPreferences]);

  // 动画设置处理器
  const handleSetTransitionEnable = useCallback((v: boolean) => {
    setPreferences({ transition: { enable: v } });
  }, [setPreferences]);

  const handleSetTransitionProgress = useCallback((v: boolean) => {
    setPreferences({ transition: { progress: v } });
  }, [setPreferences]);

  const handleSetTransitionName = useCallback((v: string | number) => {
    setPreferences({ transition: { name: String(v) } });
  }, [setPreferences]);

  // 小部件处理器
  const handleSetWidgetFullscreen = useCallback((v: boolean) => {
    setPreferences({ widget: { fullscreen: v } });
  }, [setPreferences]);

  const handleSetWidgetThemeToggle = useCallback((v: boolean) => {
    setPreferences({ widget: { themeToggle: v } });
  }, [setPreferences]);

  const handleSetWidgetLanguageToggle = useCallback((v: boolean) => {
    setPreferences({ widget: { languageToggle: v } });
  }, [setPreferences]);

  return (
    <>
      {/* 基础设置 */}
      <Block title={locale.general.title}>
        <SelectItem
          label={locale.general.language}
          value={preferences.app.locale}
          onChange={handleSetLocale}
          options={languageOptions}
        />
        <SwitchItem
          label={locale.general.dynamicTitle}
          checked={preferences.app.dynamicTitle}
          onChange={handleSetDynamicTitle}
        />
        <SwitchItem
          label={locale.general.watermark}
          checked={preferences.app.watermark}
          onChange={handleSetWatermark}
        />
        <SwitchItem
          label={locale.general.colorWeakMode}
          checked={preferences.app.colorWeakMode}
          onChange={handleSetColorWeakMode}
        />
        <SwitchItem
          label={locale.general.colorGrayMode}
          checked={preferences.app.colorGrayMode}
          onChange={handleSetColorGrayMode}
        />
      </Block>

      {/* 动画设置 */}
      <Block title={locale.transition.title}>
        <SwitchItem
          label={locale.transition.enable}
          checked={preferences.transition.enable}
          onChange={handleSetTransitionEnable}
        />
        <SwitchItem
          label={locale.transition.progress}
          checked={preferences.transition.progress}
          onChange={handleSetTransitionProgress}
        />
        <SelectItem
          label={locale.transition.name}
          value={preferences.transition.name}
          onChange={handleSetTransitionName}
          options={animationOptions}
        />
      </Block>

      {/* 小部件 */}
      <Block title={locale.widget.title}>
        <SwitchItem
          label={locale.widget.fullscreen}
          checked={preferences.widget.fullscreen}
          onChange={handleSetWidgetFullscreen}
        />
        <SwitchItem
          label={locale.widget.themeToggle}
          checked={preferences.widget.themeToggle}
          onChange={handleSetWidgetThemeToggle}
        />
        <SwitchItem
          label={locale.widget.languageToggle}
          checked={preferences.widget.languageToggle}
          onChange={handleSetWidgetLanguageToggle}
        />
      </Block>
    </>
  );
});

GeneralTab.displayName = 'GeneralTab';

export default GeneralTab;
