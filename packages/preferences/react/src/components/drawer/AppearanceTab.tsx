/**
 * 外观设置标签页
 * @description 主题模式、内置主题、圆角、字体大小等设置
 */
import {
  BUILT_IN_THEME_PRESETS,
  RADIUS_OPTIONS,
  FONT_SCALE_CONFIG,
  colorsTokens,
  getIcon,
  oklchToHex,
  getFeatureItemConfig,
  type BuiltinThemeType,
  type ThemeModeType,
  type LocaleMessages,
  type AppearanceTabConfig,
  type ResolvedFeatureConfig,
} from '@admin-core/preferences';
import React, { memo, useRef, useCallback, useMemo, useEffect, useState } from 'react';
import { usePreferences, useTheme } from '../../hooks';
import { Block } from './Block';
import { SliderItem } from './SliderItem';
import { SwitchItem } from './SwitchItem';

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
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: AppearanceTabConfig;
}

export const AppearanceTab: React.FC<AppearanceTabProps> = memo(({ locale, uiConfig }) => {
  // ========== UI 配置解析（使用 useMemo 缓存） ==========
  const getConfig = useCallback(
    (blockKey: keyof AppearanceTabConfig, itemKey?: string): ResolvedFeatureConfig =>
      getFeatureItemConfig(uiConfig, blockKey, itemKey),
    [uiConfig]
  );

  // 缓存常用配置项
  const configs = useMemo(() => ({
    // 主题模式
    themeMode: getConfig('themeMode'),
    // 内置主题
    builtinTheme: getConfig('builtinTheme'),
    // 圆角
    radius: getConfig('radius'),
    // 字体缩放
    fontSize: getConfig('fontSize'),
    // 颜色模式
    colorMode: getConfig('colorMode'),
    colorFollowPrimaryLight: getConfig('colorMode', 'colorFollowPrimaryLight'),
    colorFollowPrimaryDark: getConfig('colorMode', 'colorFollowPrimaryDark'),
    semiDarkSidebar: getConfig('colorMode', 'semiDarkSidebar'),
    semiDarkHeader: getConfig('colorMode', 'semiDarkHeader'),
    colorGrayMode: getConfig('colorMode', 'colorGrayMode'),
    colorWeakMode: getConfig('colorMode', 'colorWeakMode'),
  }), [getConfig]);

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

  const handleThemeModeClick = useCallback((e: React.MouseEvent) => {
    if (configs.themeMode.disabled) return;
    const value = (e.currentTarget as HTMLElement).dataset.value as ThemeModeType | undefined;
    if (!value) return;
    if (value === 'light') {
      handleSetModeLight();
    } else if (value === 'dark') {
      handleSetModeDark();
    } else {
      handleSetModeAuto();
    }
  }, [configs.themeMode.disabled, handleSetModeLight, handleSetModeDark, handleSetModeAuto]);

  const handlePresetClick = useCallback((e: React.MouseEvent) => {
    if (configs.builtinTheme.disabled) return;
    const value = (e.currentTarget as HTMLElement).dataset.value as BuiltinThemeType | undefined;
    if (!value) return;
    if (value === 'custom') {
      handleSetCustomTheme();
    } else {
      handleSetBuiltinTheme(value);
    }
  }, [configs.builtinTheme.disabled, handleSetBuiltinTheme, handleSetCustomTheme]);

  const handleRadiusClick = useCallback((e: React.MouseEvent) => {
    if (configs.radius.disabled) return;
    const value = (e.currentTarget as HTMLElement).dataset.value;
    if (value) {
      handleSetRadius(value);
    }
  }, [configs.radius.disabled, handleSetRadius]);

  // 当前自定义颜色值（memoized）
  const currentColorValue = useMemo(
    () => oklchToHex(preferences.theme.colorPrimary || colorsTokens.primary),
    [preferences.theme.colorPrimary]
  );
  const builtinPresets = useMemo(
    () => BUILT_IN_THEME_PRESETS.filter((preset) => preset.type !== 'custom'),
    []
  );
  const presetStyleMap = useMemo(() => {
    const map = new Map<string, React.CSSProperties>();
    builtinPresets.forEach((preset) => {
      map.set(preset.type, {
        backgroundColor: preset.color || colorsTokens.presetFallback,
      });
    });
    return map;
  }, [builtinPresets]);

  const PRESET_RENDER_CHUNK = 12;
  const [presetRenderCount, setPresetRenderCount] = useState(PRESET_RENDER_CHUNK);

  useEffect(() => {
    setPresetRenderCount(Math.min(PRESET_RENDER_CHUNK, builtinPresets.length));
  }, [builtinPresets.length]);

  useEffect(() => {
    if (presetRenderCount >= builtinPresets.length) return;
    const frame = requestAnimationFrame(() => {
      setPresetRenderCount((prev) => Math.min(prev + PRESET_RENDER_CHUNK, builtinPresets.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [presetRenderCount, builtinPresets.length]);

  const visiblePresets = useMemo(
    () => builtinPresets.slice(0, presetRenderCount),
    [builtinPresets, presetRenderCount]
  );

  return (
    <>
      {/* 主题模式 */}
      {configs.themeMode.visible && (
        <Block title={locale.theme.mode}>
          <div className="theme-mode-grid" role="radiogroup" aria-label={locale.theme.mode}>
            <div 
              className={`theme-mode-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground${configs.themeMode.disabled ? ' disabled' : ''}`}
              role="radio"
              tabIndex={configs.themeMode.disabled ? -1 : 0}
              aria-checked={preferences.theme.mode === 'light'}
              aria-disabled={configs.themeMode.disabled}
              data-state={preferences.theme.mode === 'light' ? 'active' : 'inactive'}
              data-disabled={configs.themeMode.disabled ? 'true' : undefined}
              data-value="light"
              onClick={handleThemeModeClick}
              onKeyDown={(e) => { if (!configs.themeMode.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetModeLight(); }}}
            >
              <div
                className={`outline-box flex-center theme-mode-box ${preferences.theme.mode === 'light' ? 'outline-box-active' : ''}${configs.themeMode.disabled ? ' disabled' : ''}`}
                  data-disabled={configs.themeMode.disabled ? 'true' : undefined}
                  data-state={preferences.theme.mode === 'light' ? 'active' : 'inactive'}
              >
                <span className="theme-mode-icon" dangerouslySetInnerHTML={{ __html: ICONS.sun }} />
              </div>
              <span className="theme-mode-label">{locale.theme.modeLight}</span>
            </div>
            <div 
              className={`theme-mode-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground${configs.themeMode.disabled ? ' disabled' : ''}`}
              role="radio"
              tabIndex={configs.themeMode.disabled ? -1 : 0}
              aria-checked={preferences.theme.mode === 'dark'}
              aria-disabled={configs.themeMode.disabled}
              data-state={preferences.theme.mode === 'dark' ? 'active' : 'inactive'}
              data-disabled={configs.themeMode.disabled ? 'true' : undefined}
              data-value="dark"
              onClick={handleThemeModeClick}
              onKeyDown={(e) => { if (!configs.themeMode.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetModeDark(); }}}
            >
              <div
                className={`outline-box flex-center theme-mode-box ${preferences.theme.mode === 'dark' ? 'outline-box-active' : ''}${configs.themeMode.disabled ? ' disabled' : ''}`}
                  data-disabled={configs.themeMode.disabled ? 'true' : undefined}
                  data-state={preferences.theme.mode === 'dark' ? 'active' : 'inactive'}
              >
                <span className="theme-mode-icon" dangerouslySetInnerHTML={{ __html: ICONS.moon }} />
              </div>
              <span className="theme-mode-label">{locale.theme.modeDark}</span>
            </div>
            <div 
              className={`theme-mode-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground${configs.themeMode.disabled ? ' disabled' : ''}`}
              role="radio"
              tabIndex={configs.themeMode.disabled ? -1 : 0}
              aria-checked={preferences.theme.mode === 'auto'}
              aria-disabled={configs.themeMode.disabled}
              data-state={preferences.theme.mode === 'auto' ? 'active' : 'inactive'}
              data-disabled={configs.themeMode.disabled ? 'true' : undefined}
              data-value="auto"
              onClick={handleThemeModeClick}
              onKeyDown={(e) => { if (!configs.themeMode.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetModeAuto(); }}}
            >
              <div
                className={`outline-box flex-center theme-mode-box ${preferences.theme.mode === 'auto' ? 'outline-box-active' : ''}${configs.themeMode.disabled ? ' disabled' : ''}`}
                  data-disabled={configs.themeMode.disabled ? 'true' : undefined}
                  data-state={preferences.theme.mode === 'auto' ? 'active' : 'inactive'}
              >
                <span className="theme-mode-icon" dangerouslySetInnerHTML={{ __html: ICONS.monitor }} />
              </div>
              <span className="theme-mode-label">{locale.theme.modeAuto}</span>
            </div>
          </div>
        </Block>
      )}

      {/* 内置主题 */}
      {configs.builtinTheme.visible && (
        <Block title={locale.theme.builtinTheme}>
          <div className="theme-presets-grid" role="radiogroup" aria-label={locale.theme.builtinTheme}>
            {visiblePresets.map((preset) => (
              <div
                key={preset.type}
                className={`theme-preset-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground${configs.builtinTheme.disabled ? ' disabled' : ''}`}
                role="radio"
                tabIndex={configs.builtinTheme.disabled ? -1 : 0}
                aria-checked={preferences.theme.builtinType === preset.type}
                aria-label={(locale.theme as Record<string, string>)[preset.nameKey] || preset.type}
                aria-disabled={configs.builtinTheme.disabled}
                data-state={preferences.theme.builtinType === preset.type ? 'active' : 'inactive'}
                data-disabled={configs.builtinTheme.disabled ? 'true' : undefined}
                data-value={preset.type}
                onClick={handlePresetClick}
                onKeyDown={(e) => { if (!configs.builtinTheme.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetBuiltinTheme(preset.type as BuiltinThemeType); }}}
              >
                <div
                  className={`outline-box flex-center theme-preset-box ${preferences.theme.builtinType === preset.type ? 'outline-box-active' : ''}${configs.builtinTheme.disabled ? ' disabled' : ''}`}
                  data-disabled={configs.builtinTheme.disabled ? 'true' : undefined}
                  data-state={preferences.theme.builtinType === preset.type ? 'active' : 'inactive'}
                >
                  <div
                    className="theme-preset-color"
                    style={presetStyleMap.get(preset.type)}
                  />
                </div>
                <span className="theme-preset-label">
                  {(locale.theme as Record<string, string>)[preset.nameKey] || preset.type}
                </span>
              </div>
            ))}
            {/* 自定义颜色 */}
            <div 
              className={`theme-preset-item data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 aria-checked:text-foreground${configs.builtinTheme.disabled ? ' disabled' : ''}`}
              role="radio"
              tabIndex={configs.builtinTheme.disabled ? -1 : 0}
              aria-checked={preferences.theme.builtinType === 'custom'}
              aria-label={locale.theme.colorCustom}
              aria-disabled={configs.builtinTheme.disabled}
              data-state={preferences.theme.builtinType === 'custom' ? 'active' : 'inactive'}
              data-disabled={configs.builtinTheme.disabled ? 'true' : undefined}
              data-value="custom"
              onClick={handlePresetClick}
              onKeyDown={(e) => { if (!configs.builtinTheme.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetCustomTheme(); }}}
            >
              <div
                className={`outline-box flex-center theme-preset-box ${preferences.theme.builtinType === 'custom' ? 'outline-box-active' : ''}${configs.builtinTheme.disabled ? ' disabled' : ''}`}
                data-disabled={configs.builtinTheme.disabled ? 'true' : undefined}
                data-state={preferences.theme.builtinType === 'custom' ? 'active' : 'inactive'}
              >
                <div
                  className="theme-preset-custom"
                  onClick={(e) => {
                    if (configs.builtinTheme.disabled) return;
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
                      disabled={configs.builtinTheme.disabled}
                    />
                  </div>
                </div>
              </div>
              <span className="theme-preset-label">{locale.theme.colorCustom}</span>
            </div>
          </div>
        </Block>
      )}

      {/* 圆角 */}
      {configs.radius.visible && (
        <Block title={locale.theme.radius}>
          <div
            className={`radius-options${configs.radius.disabled ? ' disabled' : ''}`}
            data-disabled={configs.radius.disabled ? 'true' : undefined}
          >
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                className={`radius-option data-active:text-foreground data-active:font-semibold data-disabled:opacity-50 ${preferences.theme.radius === r ? 'active' : ''}`}
                disabled={configs.radius.disabled}
                data-state={preferences.theme.radius === r ? 'active' : 'inactive'}
                data-disabled={configs.radius.disabled ? 'true' : undefined}
                data-value={r}
                onClick={handleRadiusClick}
              >
                {r}
              </button>
            ))}
          </div>
        </Block>
      )}

      {/* 字体缩放 */}
      {configs.fontSize.visible && (
        <Block title={locale.theme.fontSize}>
          <SliderItem
            label={locale.theme.fontSize}
            value={Math.round(preferences.theme.fontScale * 100)}
            onChange={(v) => handleSetFontScale(v / 100)}
            min={FONT_SCALE_CONFIG.min * 100}
            max={FONT_SCALE_CONFIG.max * 100}
            step={FONT_SCALE_CONFIG.step * 100}
            unit="%"
            disabled={configs.fontSize.disabled}
          />
        </Block>
      )}

      {/* 颜色模式 */}
      {configs.colorMode.visible && (
        <Block title={locale.theme.colorMode}>
          {configs.colorFollowPrimaryLight.visible && (
            <SwitchItem
              label={locale.theme.colorFollowPrimaryLight}
              checked={preferences.app.colorFollowPrimaryLight}
              onChange={handleSetColorFollowPrimaryLight}
              disabled={configs.colorFollowPrimaryLight.disabled}
            />
          )}
          {configs.colorFollowPrimaryDark.visible && (
            <SwitchItem
              label={locale.theme.colorFollowPrimaryDark}
              checked={preferences.app.colorFollowPrimaryDark}
              onChange={handleSetColorFollowPrimaryDark}
              disabled={configs.colorFollowPrimaryDark.disabled}
            />
          )}
          {!isDark && configs.semiDarkSidebar.visible && (
            <SwitchItem
              label={locale.theme.semiDarkSidebar}
              icon={ICONS.semiDarkSidebar}
              checked={preferences.theme.semiDarkSidebar}
              onChange={handleSetSemiDarkSidebar}
              disabled={configs.semiDarkSidebar.disabled}
            />
          )}
          {!isDark && configs.semiDarkHeader.visible && (
            <SwitchItem
              label={locale.theme.semiDarkHeader}
              icon={ICONS.semiDarkHeader}
              checked={preferences.theme.semiDarkHeader}
              onChange={handleSetSemiDarkHeader}
              disabled={configs.semiDarkHeader.disabled}
            />
          )}
          {configs.colorGrayMode.visible && (
            <SwitchItem
              label={locale.theme.colorGrayMode}
              checked={preferences.app.colorGrayMode}
              onChange={handleSetColorGrayMode}
              disabled={configs.colorGrayMode.disabled}
            />
          )}
          {configs.colorWeakMode.visible && (
            <SwitchItem
              label={locale.theme.colorWeakMode}
              checked={preferences.app.colorWeakMode}
              onChange={handleSetColorWeakMode}
              disabled={configs.colorWeakMode.disabled}
            />
          )}
        </Block>
      )}
    </>
  );
});

AppearanceTab.displayName = 'AppearanceTab';

export default AppearanceTab;
