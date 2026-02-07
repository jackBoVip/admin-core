/**
 * 通用设置标签页
 * @description 语言、动态标题、水印、动画、小部件等设置
 */
import {
  PAGE_TRANSITION_OPTIONS,
  supportedLocales,
  translateOptions,
  getFeatureItemConfig,
  type LocaleMessages,
  type PageTransitionType,
  type SupportedLanguagesType,
  type GeneralTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import React, { memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { usePreferences } from '../../hooks';
import { Block } from './Block';
import { InputItem } from './InputItem';
import { SelectItem } from './SelectItem';
import { SliderItem } from './SliderItem';
import { SwitchItem } from './SwitchItem';
import { TransitionPreview } from './TransitionPreview';

export interface GeneralTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: GeneralTabConfig;
}

export const GeneralTab: React.FC<GeneralTabProps> = memo(({ locale, uiConfig }) => {
  // ========== UI 配置解析（使用 useMemo 缓存） ==========
  const getConfig = useCallback(
    (blockKey: keyof GeneralTabConfig, itemKey?: string): ResolvedFeatureConfig =>
      getFeatureItemConfig(uiConfig, blockKey, itemKey),
    [uiConfig]
  );

  // 缓存常用配置项
  const configs = useMemo(() => ({
    // 基础设置
    language: getConfig('language'),
    dynamicTitle: getConfig('dynamicTitle'),
    // 版权设置
    copyright: getConfig('copyright'),
    copyrightEnable: getConfig('copyright', 'enable'),
    copyrightCompanyName: getConfig('copyright', 'companyName'),
    copyrightCompanySiteLink: getConfig('copyright', 'companySiteLink'),
    copyrightDate: getConfig('copyright', 'date'),
    copyrightIcp: getConfig('copyright', 'icp'),
    copyrightIcpLink: getConfig('copyright', 'icpLink'),
    // 锁屏设置
    lockScreen: getConfig('lockScreen'),
    lockScreenEnable: getConfig('lockScreen', 'enable'),
    lockScreenAutoLockTime: getConfig('lockScreen', 'autoLockTime'),
    lockScreenClearPassword: getConfig('lockScreen', 'clearPassword'),
    // 水印设置
    watermark: getConfig('watermark'),
    watermarkEnable: getConfig('watermark', 'enable'),
    watermarkAppendDate: getConfig('watermark', 'appendDate'),
    watermarkContent: getConfig('watermark', 'content'),
    watermarkAngle: getConfig('watermark', 'angle'),
    watermarkFontSize: getConfig('watermark', 'fontSize'),
    // 动画设置
    transition: getConfig('transition'),
    transitionEnable: getConfig('transition', 'enable'),
    transitionProgress: getConfig('transition', 'progress'),
    transitionName: getConfig('transition', 'name'),
  }), [getConfig]);

  const { preferences, setPreferences } = usePreferences();
  const [isClearing, setIsClearing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

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

  // 自动锁屏时间选项（memoized 避免重复创建）
  const autoLockTimeOptions = useMemo(() => [
    { label: locale.common.disable, value: 0 },
    { label: `1 ${locale.lockScreen.minute}`, value: 1 },
    { label: `5 ${locale.lockScreen.minute}`, value: 5 },
    { label: `15 ${locale.lockScreen.minute}`, value: 15 },
    { label: `30 ${locale.lockScreen.minute}`, value: 30 },
    { label: `60 ${locale.lockScreen.minute}`, value: 60 },
  ], [locale.common.disable, locale.lockScreen.minute]);

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

  const handleSetWatermarkContent = useCallback((v: string) => {
    setPreferences({ app: { watermarkContent: v } });
  }, [setPreferences]);

  const handleSetWatermarkAngle = useCallback((v: number) => {
    setPreferences({ app: { watermarkAngle: v } });
  }, [setPreferences]);

  const handleSetWatermarkAppendDate = useCallback((v: boolean) => {
    setPreferences({ app: { watermarkAppendDate: v } });
  }, [setPreferences]);

  const handleSetWatermarkFontSize = useCallback((v: number) => {
    setPreferences({ app: { watermarkFontSize: v } });
  }, [setPreferences]);

  const handleSetCopyrightEnable = useCallback((v: boolean) => {
    setPreferences({ copyright: { enable: v } });
  }, [setPreferences]);

  const handleSetCopyrightCompanyName = useCallback((v: string) => {
    setPreferences({ copyright: { companyName: v } });
  }, [setPreferences]);

  const handleSetCopyrightCompanySiteLink = useCallback((v: string) => {
    setPreferences({ copyright: { companySiteLink: v } });
  }, [setPreferences]);

  const handleSetCopyrightDate = useCallback((v: string) => {
    setPreferences({ copyright: { date: v } });
  }, [setPreferences]);

  const handleSetCopyrightIcp = useCallback((v: string) => {
    setPreferences({ copyright: { icp: v } });
  }, [setPreferences]);

  const handleSetCopyrightIcpLink = useCallback((v: string) => {
    setPreferences({ copyright: { icpLink: v } });
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

  const handleTransitionOptionClick = useCallback((e: React.MouseEvent) => {
    if (!preferences.transition.enable || configs.transitionName.disabled) return;
    const value = (e.currentTarget as HTMLElement).dataset.value;
    if (value) {
      handleSetTransitionName(value);
    }
  }, [preferences.transition.enable, configs.transitionName.disabled, handleSetTransitionName]);

  // 锁屏处理器
  const handleSetWidgetLockScreen = useCallback((v: boolean) => {
    setPreferences({ widget: { lockScreen: v } });
  }, [setPreferences]);

  const handleSetAutoLockTime = useCallback((v: string | number) => {
    setPreferences({ lockScreen: { autoLockTime: Number(v) } });
  }, [setPreferences]);

  // 清空密码回调 - 使用函数式更新避免竞态条件
  const handleClearPassword = useCallback(() => {
    setIsClearing((prev) => {
      if (prev) return prev; // 已在清理中，不重复执行
      
      // 清除之前的定时器
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      setPreferences({ lockScreen: { password: '' } });
      timerRef.current = setTimeout(() => {
        setIsClearing(false);
        timerRef.current = null;
      }, 2000);
      
      return true;
    });
  }, [setPreferences]);

  const TRANSITION_RENDER_CHUNK = 12;
  const [transitionRenderCount, setTransitionRenderCount] = useState(TRANSITION_RENDER_CHUNK);

  useEffect(() => {
    setTransitionRenderCount(Math.min(TRANSITION_RENDER_CHUNK, animationOptions.length));
  }, [animationOptions.length]);

  useEffect(() => {
    if (transitionRenderCount >= animationOptions.length) return;
    const frame = requestAnimationFrame(() => {
      setTransitionRenderCount((prev) => Math.min(prev + TRANSITION_RENDER_CHUNK, animationOptions.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [transitionRenderCount, animationOptions.length]);

  const visibleAnimationOptions = useMemo(
    () => animationOptions.slice(0, transitionRenderCount),
    [animationOptions, transitionRenderCount]
  );
  const footerEnable = preferences.footer.enable;
  const copyrightSettingShow = preferences.copyright.settingShow;
  const copyrightItemDisabled = !footerEnable || !preferences.copyright.enable;

  return (
    <>
      {/* 基础设置 */}
      {configs.language.visible && (
        <Block title={locale.general.title}>
          <SelectItem
            label={locale.general.language}
            value={preferences.app.locale}
            onChange={handleSetLocale}
            options={languageOptions}
            disabled={configs.language.disabled}
          />
          {configs.dynamicTitle.visible && (
            <SwitchItem
              label={locale.general.dynamicTitle}
              checked={preferences.app.dynamicTitle}
              onChange={handleSetDynamicTitle}
              disabled={configs.dynamicTitle.disabled}
            />
          )}
        </Block>
      )}

      {/* 锁屏设置 */}
      {configs.lockScreen.visible && (
        <Block title={locale.lockScreen.title}>
          {configs.lockScreenEnable.visible && (
            <SwitchItem
              label={locale.widget.lockScreen}
              checked={preferences.widget.lockScreen}
              onChange={handleSetWidgetLockScreen}
              disabled={configs.lockScreenEnable.disabled}
            />
          )}
          {configs.lockScreenAutoLockTime.visible && (
            <SelectItem
              label={locale.lockScreen.autoLockTime}
              value={preferences.lockScreen.autoLockTime}
              onChange={handleSetAutoLockTime}
              options={autoLockTimeOptions}
              disabled={!preferences.widget.lockScreen || configs.lockScreenAutoLockTime.disabled}
            />
          )}
          {configs.lockScreenClearPassword.visible && (preferences.lockScreen.password || isClearing) && (
            <div className="select-item">
              <span className="select-item-label">{locale.lockScreen.clearPassword}</span>
              <div className="select-item-control">
                <button
                  className="preferences-btn preferences-btn-primary data-disabled:opacity-50 aria-disabled:opacity-50"
                  disabled={isClearing || configs.lockScreenClearPassword.disabled}
                  aria-disabled={(isClearing || configs.lockScreenClearPassword.disabled) || undefined}
                  data-disabled={(isClearing || configs.lockScreenClearPassword.disabled) ? 'true' : undefined}
                  onClick={handleClearPassword}
                >
                  {isClearing ? locale.lockScreen.cleared : locale.common.clear}
                </button>
              </div>
            </div>
          )}
        </Block>
      )}

      {/* 水印设置 */}
      {configs.watermark.visible && (
        <Block title={locale.general.watermark}>
          {configs.watermarkEnable.visible && (
            <SwitchItem
              label={locale.general.watermarkEnable}
              checked={preferences.app.watermark}
              onChange={handleSetWatermark}
              disabled={configs.watermarkEnable.disabled}
            />
          )}
          {preferences.app.watermark && (
            <>
              {configs.watermarkAppendDate.visible && (
                <SwitchItem
                  label={locale.general.watermarkAppendDate}
                  checked={preferences.app.watermarkAppendDate}
                  onChange={handleSetWatermarkAppendDate}
                  disabled={configs.watermarkAppendDate.disabled}
                />
              )}
              {configs.watermarkContent.visible && (
                <InputItem
                  label={locale.general.watermarkContent}
                  value={preferences.app.watermarkContent}
                  onChange={handleSetWatermarkContent}
                  placeholder={locale.general.watermarkContentPlaceholder}
                  disabled={configs.watermarkContent.disabled}
                />
              )}
              {configs.watermarkAngle.visible && (
                <SliderItem
                  label={locale.general.watermarkAngle}
                  value={preferences.app.watermarkAngle}
                  onChange={handleSetWatermarkAngle}
                  min={-90}
                  max={90}
                  step={1}
                  unit="°"
                  disabled={configs.watermarkAngle.disabled}
                />
              )}
              {configs.watermarkFontSize.visible && (
                <SliderItem
                  label={locale.general.watermarkFontSize}
                  value={preferences.app.watermarkFontSize}
                  onChange={handleSetWatermarkFontSize}
                  min={10}
                  max={32}
                  step={1}
                  unit="px"
                  disabled={configs.watermarkFontSize.disabled}
                />
              )}
            </>
          )}
        </Block>
      )}

      {/* 版权设置 */}
      {configs.copyright.visible && copyrightSettingShow && (
        <Block title={locale.copyright.title}>
          {configs.copyrightEnable.visible && (
            <SwitchItem
              label={locale.copyright.enable}
              checked={preferences.copyright.enable}
              onChange={handleSetCopyrightEnable}
              disabled={!footerEnable || configs.copyrightEnable.disabled}
            />
          )}
          {configs.copyrightCompanyName.visible && (
            <InputItem
              label={locale.copyright.companyName}
              value={preferences.copyright.companyName}
              onChange={handleSetCopyrightCompanyName}
              disabled={copyrightItemDisabled || configs.copyrightCompanyName.disabled}
            />
          )}
          {configs.copyrightCompanySiteLink.visible && (
            <InputItem
              label={locale.copyright.companySiteLink}
              value={preferences.copyright.companySiteLink}
              onChange={handleSetCopyrightCompanySiteLink}
              disabled={copyrightItemDisabled || configs.copyrightCompanySiteLink.disabled}
            />
          )}
          {configs.copyrightDate.visible && (
            <InputItem
              label={locale.copyright.date}
              value={preferences.copyright.date}
              onChange={handleSetCopyrightDate}
              disabled={copyrightItemDisabled || configs.copyrightDate.disabled}
            />
          )}
          {configs.copyrightIcp.visible && (
            <InputItem
              label={locale.copyright.icp}
              value={preferences.copyright.icp}
              onChange={handleSetCopyrightIcp}
              disabled={copyrightItemDisabled || configs.copyrightIcp.disabled}
            />
          )}
          {configs.copyrightIcpLink.visible && (
            <InputItem
              label={locale.copyright.icpLink}
              value={preferences.copyright.icpLink}
              onChange={handleSetCopyrightIcpLink}
              disabled={copyrightItemDisabled || configs.copyrightIcpLink.disabled}
            />
          )}
        </Block>
      )}

      {/* 动画设置 */}
      {configs.transition.visible && (
        <Block title={locale.transition.title}>
          {configs.transitionEnable.visible && (
            <SwitchItem
              label={locale.transition.enable}
              checked={preferences.transition.enable}
              onChange={handleSetTransitionEnable}
              disabled={configs.transitionEnable.disabled}
            />
          )}
          {configs.transitionProgress.visible && (
            <SwitchItem
              label={locale.transition.progress}
              checked={preferences.transition.progress}
              onChange={handleSetTransitionProgress}
              disabled={configs.transitionProgress.disabled}
            />
          )}
          {configs.transitionName.visible && (
            <div className="transition-presets-grid" role="radiogroup" aria-label={locale.transition.name}>
              {visibleAnimationOptions.map((opt) => {
                const isDisabled = !preferences.transition.enable || configs.transitionName.disabled;
                return (
                  <div
                    key={opt.value}
                    className={`transition-preset-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground${isDisabled ? ' disabled' : ''}`}
                    role="radio"
                    tabIndex={isDisabled ? -1 : 0}
                    aria-checked={preferences.transition.name === opt.value}
                    aria-label={opt.label}
                    aria-disabled={isDisabled}
                    data-state={preferences.transition.name === opt.value ? 'active' : 'inactive'}
                    data-disabled={isDisabled ? 'true' : undefined}
                    data-value={opt.value}
                    onClick={handleTransitionOptionClick}
                    onKeyDown={(e) => {
                      if (!isDisabled && (e.key === 'Enter' || e.key === ' ')) {
                        e.preventDefault();
                        handleSetTransitionName(opt.value);
                      }
                    }}
                  >
                    <div
                      className={`outline-box flex-center transition-preset-box ${
                        preferences.transition.name === opt.value ? 'outline-box-active' : ''
                      } ${isDisabled ? 'disabled' : ''}`}
                      data-disabled={isDisabled ? 'true' : undefined}
                      data-state={preferences.transition.name === opt.value ? 'active' : 'inactive'}
                    >
                      <TransitionPreview
                        transition={opt.value as PageTransitionType}
                        enabled={preferences.transition.enable}
                        active={preferences.transition.name === opt.value}
                        compact
                      />
                    </div>
                    <span className="transition-preset-label">{opt.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Block>
      )}
    </>
  );
});

GeneralTab.displayName = 'GeneralTab';

export default GeneralTab;
