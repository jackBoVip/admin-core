/**
 * 外观设置标签页
 * @description 主题模式、内置主题、圆角、字体大小等设置
 */
import React, { memo, useRef, useCallback, useMemo } from 'react';
import { usePreferences, useTheme } from '../../hooks';
import {
  BUILT_IN_THEME_PRESETS,
  RADIUS_OPTIONS,
  FONT_SCALE_CONFIG,
  formatScaleToPercent,
  colorsTokens,
  getIcon,
  oklchToHex,
  type BuiltinThemeType,
  type ThemeModeType,
  type LocaleMessages,
} from '@admin-core/preferences';
import { Block } from './Block';
import { SwitchItem } from './SwitchItem';
import { SliderItem } from './SliderItem';

// 图标缓存（移到组件外部避免重复获取）
const ICONS = {
  sun: getIcon('sun'),
  moon: getIcon('moon'),
  monitor: getIcon('monitor'),
  semiDarkSidebar: getIcon('semiDarkSidebar'),
  semiDarkHeader: getIcon('semiDarkHeader'),
} as const;

export interface AppearanceTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = memo(({ locale }) => {
  const { preferences, setPreferences } = usePreferences();
  const { isDark } = useTheme();

  // 颜色选择器引用
  const colorInputRef = useRef<HTMLInputElement>(null);

  // 打开颜色选择器
  const openColorPicker = useCallback(() => {
    colorInputRef.current?.click();
  }, []);

  // ========== 稳定的回调函数（避免子组件重渲染） ==========
  
  // 主题模式处理器
  const handleSetModeLight = useCallback(() => {
    setPreferences({ theme: { mode: 'light' as ThemeModeType } });
  }, [setPreferences]);
  
  const handleSetModeDark = useCallback(() => {
    setPreferences({ theme: { mode: 'dark' as ThemeModeType } });
  }, [setPreferences]);
  
  const handleSetModeAuto = useCallback(() => {
    setPreferences({ theme: { mode: 'auto' as ThemeModeType } });
  }, [setPreferences]);

  // 内置主题处理器工厂
  const handleSetBuiltinTheme = useCallback((type: BuiltinThemeType) => {
    setPreferences({ theme: { builtinType: type } });
  }, [setPreferences]);

  // 圆角处理器工厂
  const handleSetRadius = useCallback((radius: string) => {
    setPreferences({ theme: { radius } });
  }, [setPreferences]);

  // 字体缩放处理器
  const handleSetFontScale = useCallback((v: number) => {
    setPreferences({ theme: { fontScale: v } });
  }, [setPreferences]);

  // 颜色模式开关处理器
  const handleSetColorFollowPrimaryLight = useCallback((v: boolean) => {
    setPreferences({ app: { colorFollowPrimaryLight: v } });
  }, [setPreferences]);

  const handleSetColorFollowPrimaryDark = useCallback((v: boolean) => {
    setPreferences({ app: { colorFollowPrimaryDark: v } });
  }, [setPreferences]);

  const handleSetSemiDarkSidebar = useCallback((v: boolean) => {
    setPreferences({ theme: { semiDarkSidebar: v } });
  }, [setPreferences]);

  const handleSetSemiDarkHeader = useCallback((v: boolean) => {
    setPreferences({ theme: { semiDarkHeader: v } });
  }, [setPreferences]);

  const handleSetColorGrayMode = useCallback((v: boolean) => {
    setPreferences({ app: { colorGrayMode: v } });
  }, [setPreferences]);

  const handleSetColorWeakMode = useCallback((v: boolean) => {
    setPreferences({ app: { colorWeakMode: v } });
  }, [setPreferences]);

  // 自定义颜色处理器
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({ theme: { colorPrimary: e.target.value, builtinType: 'custom' } });
  }, [setPreferences]);

  const handleSetCustomTheme = useCallback(() => {
    setPreferences({ theme: { builtinType: 'custom' } });
  }, [setPreferences]);

  // 当前自定义颜色值（memoized）
  const currentColorValue = useMemo(
    () => oklchToHex(preferences.theme.colorPrimary || colorsTokens.primary),
    [preferences.theme.colorPrimary]
  );

  return (
    <>
      {/* 主题模式 */}
      <Block title={locale.theme.mode}>
        <div className="theme-mode-grid">
          <div className="theme-mode-item" onClick={handleSetModeLight}>
            <div
              className={`outline-box flex-center theme-mode-box ${preferences.theme.mode === 'light' ? 'outline-box-active' : ''}`}
            >
              <span className="theme-mode-icon" dangerouslySetInnerHTML={{ __html: ICONS.sun }} />
            </div>
            <span className="theme-mode-label">{locale.theme.modeLight}</span>
          </div>
          <div className="theme-mode-item" onClick={handleSetModeDark}>
            <div
              className={`outline-box flex-center theme-mode-box ${preferences.theme.mode === 'dark' ? 'outline-box-active' : ''}`}
            >
              <span className="theme-mode-icon" dangerouslySetInnerHTML={{ __html: ICONS.moon }} />
            </div>
            <span className="theme-mode-label">{locale.theme.modeDark}</span>
          </div>
          <div className="theme-mode-item" onClick={handleSetModeAuto}>
            <div
              className={`outline-box flex-center theme-mode-box ${preferences.theme.mode === 'auto' ? 'outline-box-active' : ''}`}
            >
              <span className="theme-mode-icon" dangerouslySetInnerHTML={{ __html: ICONS.monitor }} />
            </div>
            <span className="theme-mode-label">{locale.theme.modeAuto}</span>
          </div>
        </div>
      </Block>

      {/* 内置主题 */}
      <Block title={locale.theme.builtinTheme}>
        <div className="theme-presets-grid">
          {BUILT_IN_THEME_PRESETS.filter((p) => p.type !== 'custom').map((preset) => (
            <div
              key={preset.type}
              className="theme-preset-item"
              onClick={() => handleSetBuiltinTheme(preset.type as BuiltinThemeType)}
            >
              <div
                className={`outline-box flex-center theme-preset-box ${preferences.theme.builtinType === preset.type ? 'outline-box-active' : ''}`}
              >
                <div
                  className="theme-preset-color"
                  style={{ backgroundColor: preset.color || colorsTokens.presetFallback }}
                />
              </div>
              <span className="theme-preset-label">
                {(locale.theme as Record<string, string>)[preset.nameKey] || preset.type}
              </span>
            </div>
          ))}
          {/* 自定义颜色 */}
          <div className="theme-preset-item" onClick={handleSetCustomTheme}>
            <div
              className={`outline-box flex-center theme-preset-box ${preferences.theme.builtinType === 'custom' ? 'outline-box-active' : ''}`}
            >
              <div
                className="theme-preset-custom"
                onClick={(e) => {
                  e.stopPropagation();
                  openColorPicker();
                }}
              >
                <div className="theme-preset-custom-inner">
                  <svg
                    className="theme-preset-custom-icon"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
                  </svg>
                  <input
                    ref={colorInputRef}
                    type="color"
                    className="theme-preset-custom-input"
                    value={currentColorValue}
                    onChange={handleColorChange}
                  />
                </div>
              </div>
            </div>
            <span className="theme-preset-label">{locale.theme.colorCustom}</span>
          </div>
        </div>
      </Block>

      {/* 圆角 */}
      <Block title={locale.theme.radius}>
        <div className="radius-options">
          {RADIUS_OPTIONS.map((r) => (
            <button
              key={r}
              className={`radius-option ${preferences.theme.radius === r ? 'active' : ''}`}
              onClick={() => handleSetRadius(r)}
            >
              {r}
            </button>
          ))}
        </div>
      </Block>

      {/* 字体缩放 */}
      <Block title={locale.theme.fontSize}>
        <SliderItem
          value={preferences.theme.fontScale}
          onChange={handleSetFontScale}
          min={FONT_SCALE_CONFIG.min}
          max={FONT_SCALE_CONFIG.max}
          step={FONT_SCALE_CONFIG.step}
          formatValue={formatScaleToPercent}
        />
      </Block>

      {/* 颜色模式 */}
      <Block title={locale.theme.colorMode}>
        <SwitchItem
          label={locale.theme.colorFollowPrimaryLight}
          checked={preferences.app.colorFollowPrimaryLight}
          onChange={handleSetColorFollowPrimaryLight}
        />
        <SwitchItem
          label={locale.theme.colorFollowPrimaryDark}
          checked={preferences.app.colorFollowPrimaryDark}
          onChange={handleSetColorFollowPrimaryDark}
        />
        {!isDark && (
          <>
            <SwitchItem
              label={locale.theme.semiDarkSidebar}
              icon={ICONS.semiDarkSidebar}
              checked={preferences.theme.semiDarkSidebar}
              onChange={handleSetSemiDarkSidebar}
            />
            <SwitchItem
              label={locale.theme.semiDarkHeader}
              icon={ICONS.semiDarkHeader}
              checked={preferences.theme.semiDarkHeader}
              onChange={handleSetSemiDarkHeader}
            />
          </>
        )}
        <SwitchItem
          label={locale.theme.colorGrayMode}
          checked={preferences.app.colorGrayMode}
          onChange={handleSetColorGrayMode}
        />
        <SwitchItem
          label={locale.theme.colorWeakMode}
          checked={preferences.app.colorWeakMode}
          onChange={handleSetColorWeakMode}
        />
      </Block>
    </>
  );
});

AppearanceTab.displayName = 'AppearanceTab';

export default AppearanceTab;
