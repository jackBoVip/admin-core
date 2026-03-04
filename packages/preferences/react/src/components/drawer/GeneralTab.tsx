/**
 * 通用设置标签页组件模块。
 * @description 提供语言、动态标题、锁屏、水印、版权与页面过渡动画等通用能力配置。
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
import { usePreferences, getPreferencesManager } from '../../hooks';
import { Block } from './Block';
import { InputItem } from './InputItem';
import { SelectItem } from './SelectItem';
import { SliderItem } from './SliderItem';
import { SwitchItem } from './SwitchItem';
import { TransitionPreview } from './TransitionPreview';

/**
 * 通用设置标签页参数。
 */
export interface GeneralTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
  /** 界面配置（控制功能项显示/禁用） */
  uiConfig?: GeneralTabConfig;
}

/**
 * 通用设置标签页组件。
 */
export const GeneralTab: React.FC<GeneralTabProps> = memo(({ locale, uiConfig }) => {
  /**
   * UI 配置解析区。
   * @description 按分组读取可见性与禁用状态，并缓存解析结果。
   */
  /**
   * 获取通用标签页功能配置
   * @description 按分组和子项解析 UI 配置，返回可见/禁用状态。
   * @param blockKey 配置分组键。
   * @param itemKey 分组内功能项键。
   * @returns 解析后的功能配置对象。
   */
  const getConfig = useCallback(
    (blockKey: keyof GeneralTabConfig, itemKey?: string): ResolvedFeatureConfig =>
      getFeatureItemConfig(uiConfig, blockKey, itemKey),
    [uiConfig]
  );

  /**
   * 缓存通用标签页常用功能配置项。
   * @description 统一读取分组功能项的可见性与禁用状态。
   */
  const configs = useMemo(() => ({
    language: getConfig('language'),
    dynamicTitle: getConfig('dynamicTitle'),
    copyright: getConfig('copyright'),
    copyrightEnable: getConfig('copyright', 'enable'),
    copyrightCompanyName: getConfig('copyright', 'companyName'),
    copyrightCompanySiteLink: getConfig('copyright', 'companySiteLink'),
    copyrightDate: getConfig('copyright', 'date'),
    copyrightIcp: getConfig('copyright', 'icp'),
    copyrightIcpLink: getConfig('copyright', 'icpLink'),
    lockScreen: getConfig('lockScreen'),
    lockScreenEnable: getConfig('lockScreen', 'enable'),
    lockScreenAutoLockTime: getConfig('lockScreen', 'autoLockTime'),
    lockScreenClearPassword: getConfig('lockScreen', 'clearPassword'),
    watermark: getConfig('watermark'),
    watermarkEnable: getConfig('watermark', 'enable'),
    watermarkAppendDate: getConfig('watermark', 'appendDate'),
    watermarkContent: getConfig('watermark', 'content'),
    watermarkAngle: getConfig('watermark', 'angle'),
    watermarkFontSize: getConfig('watermark', 'fontSize'),
    transition: getConfig('transition'),
    transitionEnable: getConfig('transition', 'enable'),
    transitionProgress: getConfig('transition', 'progress'),
    transitionName: getConfig('transition', 'name'),
  }), [getConfig]);

  /**
   * 偏好设置快照与写入方法。
   * @description 读取当前通用配置项并将交互变更写回偏好存储。
   */
  const { preferences, setPreferences } = usePreferences();
  /**
   * 清空密码进行中状态。
   * @description 控制“清空密码”按钮的短暂反馈态，避免重复触发。
   */
  const [isClearing, setIsClearing] = useState(false);
  /**
   * 清空提示回滚定时器引用。
   * @description 缓存反馈恢复计时器句柄，便于重入与卸载时安全清理。
   */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * 清理延时状态定时器。
   * @description 组件卸载时停止清理状态回滚计时，防止内存泄漏。
   */
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  /**
   * 本地化动画选项集合。
   * @description 将动画枚举配置翻译为当前语言展示文本。
   */
  const animationOptions = useMemo(
    () => translateOptions(PAGE_TRANSITION_OPTIONS, locale),
    [locale]
  );

  /**
   * 语言下拉选项。
   * @description 从受支持语言列表映射为通用 label/value 结构。
   */
  const languageOptions = useMemo(
    () => supportedLocales.map((l) => ({ label: l.label, value: l.value })),
    []
  );

  /**
   * 自动锁屏时间选项。
   * @description 基于当前语言文案生成分钟级候选项。
   */
  const autoLockTimeOptions = useMemo(() => [
    { label: locale.common.disable, value: 0 },
    { label: `1 ${locale.lockScreen.minute}`, value: 1 },
    { label: `5 ${locale.lockScreen.minute}`, value: 5 },
    { label: `15 ${locale.lockScreen.minute}`, value: 15 },
    { label: `30 ${locale.lockScreen.minute}`, value: 30 },
    { label: `60 ${locale.lockScreen.minute}`, value: 60 },
  ], [locale.common.disable, locale.lockScreen.minute]);

  /**
   * 基础偏好更新回调区。
   * @description 使用稳定回调避免子组件因函数引用变化而重复渲染。
   */
  /**
   * 设置应用语言
   * @param v 语言值。
   */
  const handleSetLocale = useCallback((v: string | number) => {
    setPreferences({ app: { locale: String(v) as SupportedLanguagesType } });
  }, [setPreferences]);

  /**
   * 设置动态标题开关
   * @param v 是否启用动态标题。
   */
  const handleSetDynamicTitle = useCallback((v: boolean) => {
    setPreferences({ app: { dynamicTitle: v } });
  }, [setPreferences]);

  /**
   * 设置水印总开关
   * @param v 是否启用水印。
   */
  const handleSetWatermark = useCallback((v: boolean) => {
    setPreferences({ app: { watermark: v } });
  }, [setPreferences]);

  /**
   * 设置水印内容
   * @param v 水印文本内容。
   */
  const handleSetWatermarkContent = useCallback((v: string) => {
    setPreferences({ app: { watermarkContent: v } });
  }, [setPreferences]);

  /**
   * 设置水印角度
   * @param v 水印旋转角度。
   */
  const handleSetWatermarkAngle = useCallback((v: number) => {
    setPreferences({ app: { watermarkAngle: v } });
  }, [setPreferences]);

  /**
   * 设置水印是否追加日期
   * @param v 是否追加日期。
   */
  const handleSetWatermarkAppendDate = useCallback((v: boolean) => {
    setPreferences({ app: { watermarkAppendDate: v } });
  }, [setPreferences]);

  /**
   * 设置水印字体大小
   * @param v 字体大小值。
   */
  const handleSetWatermarkFontSize = useCallback((v: number) => {
    setPreferences({ app: { watermarkFontSize: v } });
  }, [setPreferences]);

  /**
   * 设置版权开关
   * @param v 是否启用版权信息。
   */
  const handleSetCopyrightEnable = useCallback((v: boolean) => {
    setPreferences({ copyright: { enable: v } });
  }, [setPreferences]);

  /**
   * 设置版权公司名称
   * @param v 公司名称文本。
   */
  const handleSetCopyrightCompanyName = useCallback((v: string) => {
    setPreferences({ copyright: { companyName: v } });
  }, [setPreferences]);

  /**
   * 设置版权公司站点链接
   * @param v 公司网站链接地址。
   */
  const handleSetCopyrightCompanySiteLink = useCallback((v: string) => {
    setPreferences({ copyright: { companySiteLink: v } });
  }, [setPreferences]);

  /**
   * 设置版权日期
   * @param v 日期文本。
   */
  const handleSetCopyrightDate = useCallback((v: string) => {
    setPreferences({ copyright: { date: v } });
  }, [setPreferences]);

  /**
   * 设置备案号
   * @param v 备案号文本。
   */
  const handleSetCopyrightIcp = useCallback((v: string) => {
    setPreferences({ copyright: { icp: v } });
  }, [setPreferences]);

  /**
   * 设置备案链接
   * @param v 备案链接地址。
   */
  const handleSetCopyrightIcpLink = useCallback((v: string) => {
    setPreferences({ copyright: { icpLink: v } });
  }, [setPreferences]);

  /**
   * 设置页面切换动画开关
   * @param v 是否启用动画。
   */
  const handleSetTransitionEnable = useCallback((v: boolean) => {
    setPreferences({ transition: { enable: v } });
  }, [setPreferences]);

  /**
   * 设置进度条动画开关
   * @param v 是否启用进度条动画。
   */
  const handleSetTransitionProgress = useCallback((v: boolean) => {
    setPreferences({ transition: { progress: v } });
  }, [setPreferences]);

  /**
   * 设置页面切换动画类型
   * @param v 动画类型值。
   */
  const handleSetTransitionName = useCallback((v: string | number) => {
    setPreferences({ transition: { name: String(v) } });
  }, [setPreferences]);

  /**
   * 处理动画选项点击
   * @description 从节点读取动画值并更新过渡类型。
   * @param e React 鼠标事件对象。
   */
  const handleTransitionOptionClick = useCallback((e: React.MouseEvent) => {
    if (!preferences.transition.enable || configs.transitionName.disabled) return;
    const value = (e.currentTarget as HTMLElement).dataset.value;
    if (value) {
      handleSetTransitionName(value);
    }
  }, [preferences.transition.enable, configs.transitionName.disabled, handleSetTransitionName]);

  /**
   * 设置锁屏组件开关
   * @param v 是否启用锁屏组件。
   */
  const handleSetWidgetLockScreen = useCallback((v: boolean) => {
    setPreferences({ widget: { lockScreen: v } });
  }, [setPreferences]);

  /**
   * 设置自动锁屏时间
   * @param v 自动锁屏时长（分钟）。
   */
  const handleSetAutoLockTime = useCallback((v: string | number) => {
    setPreferences({ lockScreen: { autoLockTime: Number(v) } });
  }, [setPreferences]);

  /**
   * 清空锁屏密码
   * @description 使用函数式更新避免竞态；清空后立即持久化，并短暂展示“已清空”状态。
   */
  const handleClearPassword = useCallback(() => {
    setIsClearing((prev) => {
      /**
       * 已处于清理流程时直接复用当前状态。
       * @description 防止重复触发清空逻辑。
       */
      if (prev) return prev;
      
      /**
       * 清理旧定时器。
       * @description 避免多次触发时存在并发回滚计时器。
       */
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      setPreferences({ lockScreen: { password: '' } });
      /**
       * 立即写入持久层。
       * @description 确保密码清空不依赖后续自动批量刷新。
       */
      try {
        getPreferencesManager()?.flush?.();
      } catch {}
      
      timerRef.current = setTimeout(() => {
        setIsClearing(false);
        timerRef.current = null;
      }, 2000);
      
      return true;
    });
  }, [setPreferences]);

  /**
   * 动画项分批渲染单次增量。
   * @description 控制每帧追加渲染的动画预览数量，降低一次性渲染压力。
   */
  const TRANSITION_RENDER_CHUNK = 12;
  /**
   * 当前已渲染的动画项数量。
   * @description 与 `requestAnimationFrame` 配合实现动画项分批加载。
   */
  const [transitionRenderCount, setTransitionRenderCount] = useState(TRANSITION_RENDER_CHUNK);

  /**
   * 监听动画选项数量变化。
   * @description 重置首批渲染数量，防止沿用旧列表长度。
   */
  useEffect(() => {
    setTransitionRenderCount(Math.min(TRANSITION_RENDER_CHUNK, animationOptions.length));
  }, [animationOptions.length]);

  /**
   * 逐帧追加动画预览项。
   * @description 使用 `requestAnimationFrame` 分批渲染，降低一次性渲染开销。
   */
  useEffect(() => {
    if (transitionRenderCount >= animationOptions.length) return;
    const frame = requestAnimationFrame(() => {
      setTransitionRenderCount((prev) => Math.min(prev + TRANSITION_RENDER_CHUNK, animationOptions.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [transitionRenderCount, animationOptions.length]);

  /**
   * 当前可见的动画选项列表。
   * @description 基于分批渲染数量截断动画选项集合，控制首屏渲染开销。
   */
  const visibleAnimationOptions = useMemo(
    () => animationOptions.slice(0, transitionRenderCount),
    [animationOptions, transitionRenderCount]
  );
  /**
   * 页脚开关状态。
   * @description 用于决定版权设置分组是否可用。
   */
  const footerEnable = preferences.footer.enable;
  /**
   * 版权设置是否允许展示。
   * @description 由偏好配置控制版权分组是否出现在抽屉中。
   */
  const copyrightSettingShow = preferences.copyright.settingShow;
  /**
   * 版权分项统一禁用状态。
   * @description 当页脚关闭或版权总开关关闭时，禁用全部版权字段编辑能力。
   */
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
                  className="preferences-btn preferences-btn-primary pref-disabled pref-disabled-trigger"
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
              inline
              disabled={copyrightItemDisabled || configs.copyrightCompanyName.disabled}
            />
          )}
          {configs.copyrightCompanySiteLink.visible && (
            <InputItem
              label={locale.copyright.companySiteLink}
              value={preferences.copyright.companySiteLink}
              onChange={handleSetCopyrightCompanySiteLink}
              inline
              disabled={copyrightItemDisabled || configs.copyrightCompanySiteLink.disabled}
            />
          )}
          {configs.copyrightDate.visible && (
            <InputItem
              label={locale.copyright.date}
              value={preferences.copyright.date}
              onChange={handleSetCopyrightDate}
              inline
              disabled={copyrightItemDisabled || configs.copyrightDate.disabled}
            />
          )}
          {configs.copyrightIcp.visible && (
            <InputItem
              label={locale.copyright.icp}
              value={preferences.copyright.icp}
              onChange={handleSetCopyrightIcp}
              inline
              disabled={copyrightItemDisabled || configs.copyrightIcp.disabled}
            />
          )}
          {configs.copyrightIcpLink.visible && (
            <InputItem
              label={locale.copyright.icpLink}
              value={preferences.copyright.icpLink}
              onChange={handleSetCopyrightIcpLink}
              inline
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
                    className={`transition-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground${isDisabled ? ' disabled' : ''}`}
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
                      className={`outline-box flex-center transition-preset-box pref-disabled ${
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

/**
 * 默认导出通用设置 Tab 组件。
 */
export default GeneralTab;
