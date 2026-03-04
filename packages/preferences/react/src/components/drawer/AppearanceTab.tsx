/**
 * 外观设置标签页组件模块。
 * @description 提供主题模式、主题预设、圆角、字体缩放与颜色策略等外观配置能力。
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

/**
 * 外观标签页图标缓存表。
 * @description 将常用图标提升到模块级，避免组件重渲染时重复读取图标资源。
 */
const ICONS = {
  sun: getIcon('sun'),
  moon: getIcon('moon'),
  monitor: getIcon('monitor'),
  semiDarkSidebar: getIcon('semiDarkSidebar'),
  semiDarkHeader: getIcon('semiDarkHeader'),
  pencil: getIcon('pencil'),
} as const;

/**
 * 外观设置标签页参数。
 */
export interface AppearanceTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
  /** 界面配置（控制功能项显示/禁用） */
  uiConfig?: AppearanceTabConfig;
}

/**
 * 外观设置标签页组件。
 */
export const AppearanceTab: React.FC<AppearanceTabProps> = memo(({ locale, uiConfig }) => {
  /**
   * UI 配置解析区。
   * @description 统一解析各功能项的可见性与禁用状态，并通过 memo 缓存结果。
   */
  /**
   * 获取外观标签页功能配置
   * @description 按分组与子项解析 UI 配置，返回可见/禁用状态。
   * @param blockKey 配置分组键。
   * @param itemKey 分组内功能项键。
   * @returns 解析后的功能配置对象。
   */
  const getConfig = useCallback(
    (blockKey: keyof AppearanceTabConfig, itemKey?: string): ResolvedFeatureConfig =>
      getFeatureItemConfig(uiConfig, blockKey, itemKey),
    [uiConfig]
  );

  /**
   * 缓存外观标签页常用功能配置项。
   * @description 统一读取分组功能项的可见性与禁用状态。
   */
  const configs = useMemo(() => ({
    themeMode: getConfig('themeMode'),
    builtinTheme: getConfig('builtinTheme'),
    radius: getConfig('radius'),
    fontSize: getConfig('fontSize'),
    colorMode: getConfig('colorMode'),
    colorFollowPrimaryLight: getConfig('colorMode', 'colorFollowPrimaryLight'),
    colorFollowPrimaryDark: getConfig('colorMode', 'colorFollowPrimaryDark'),
    semiDarkSidebar: getConfig('colorMode', 'semiDarkSidebar'),
    semiDarkHeader: getConfig('colorMode', 'semiDarkHeader'),
    colorGrayMode: getConfig('colorMode', 'colorGrayMode'),
    colorWeakMode: getConfig('colorMode', 'colorWeakMode'),
  }), [getConfig]);

  /**
   * 偏好状态与更新方法。
   * @description 读取当前主题配置并将用户修改写回偏好存储。
   */
  const { preferences, setPreferences } = usePreferences();
  /**
   * 当前是否处于深色主题。
   * @description 用于按主题场景控制部分外观开关项显示。
   */
  const { isDark } = useTheme();

  /**
   * 原生颜色选择输入框引用。
   * @description 用于通过按钮触发隐藏输入框，唤起浏览器拾色器。
   */
  const colorInputRef = useRef<HTMLInputElement>(null);

  /**
   * 打开系统颜色选择器
   * @description 触发隐藏颜色输入框点击，唤起浏览器原生拾色面板。
   */
  const openColorPicker = useCallback(() => {
    colorInputRef.current?.click();
  }, []);

  /**
   * 稳定回调区。
   * @description 将状态写入函数稳定化，降低子组件因引用变化产生的重渲染。
   */
  /**
   * 设置浅色主题模式
   * @description 将主题模式切换为 `light`。
   */
  const handleSetModeLight = useCallback(() => {
    setPreferences({ theme: { mode: 'light' as ThemeModeType } });
  }, [setPreferences]);
  
  /**
   * 设置深色主题模式
   * @description 将主题模式切换为 `dark`。
   */
  const handleSetModeDark = useCallback(() => {
    setPreferences({ theme: { mode: 'dark' as ThemeModeType } });
  }, [setPreferences]);
  
  /**
   * 设置跟随系统主题模式
   * @description 将主题模式切换为 `auto`。
   */
  const handleSetModeAuto = useCallback(() => {
    setPreferences({ theme: { mode: 'auto' as ThemeModeType } });
  }, [setPreferences]);

  /**
   * 设置内置主题类型
   * @param type 目标内置主题类型。
   */
  const handleSetBuiltinTheme = useCallback((type: BuiltinThemeType) => {
    setPreferences({ theme: { builtinType: type } });
  }, [setPreferences]);

  /**
   * 设置全局圆角值
   * @param radius 圆角值字符串。
   */
  const handleSetRadius = useCallback((radius: string) => {
    setPreferences({ theme: { radius } });
  }, [setPreferences]);

  /**
   * 设置字体缩放比例
   * @param v 字体缩放值。
   */
  const handleSetFontScale = useCallback((v: number) => {
    setPreferences({ theme: { fontScale: v } });
  }, [setPreferences]);

  /**
   * 设置浅色模式是否跟随主色
   * @param v 是否启用。
   */
  const handleSetColorFollowPrimaryLight = useCallback((v: boolean) => {
    setPreferences({ app: { colorFollowPrimaryLight: v } });
  }, [setPreferences]);

  /**
   * 设置深色模式是否跟随主色
   * @param v 是否启用。
   */
  const handleSetColorFollowPrimaryDark = useCallback((v: boolean) => {
    setPreferences({ app: { colorFollowPrimaryDark: v } });
  }, [setPreferences]);

  /**
   * 设置侧边栏半深色模式
   * @param v 是否启用。
   */
  const handleSetSemiDarkSidebar = useCallback((v: boolean) => {
    setPreferences({ theme: { semiDarkSidebar: v } });
  }, [setPreferences]);

  /**
   * 设置顶栏半深色模式
   * @param v 是否启用。
   */
  const handleSetSemiDarkHeader = useCallback((v: boolean) => {
    setPreferences({ theme: { semiDarkHeader: v } });
  }, [setPreferences]);

  /**
   * 设置灰色模式
   * @param v 是否启用。
   */
  const handleSetColorGrayMode = useCallback((v: boolean) => {
    setPreferences({ app: { colorGrayMode: v } });
  }, [setPreferences]);

  /**
   * 设置色弱模式
   * @param v 是否启用。
   */
  const handleSetColorWeakMode = useCallback((v: boolean) => {
    setPreferences({ app: { colorWeakMode: v } });
  }, [setPreferences]);

  /**
   * 处理自定义主色变更
   * @description 更新主色并自动切换到自定义主题类型。
   * @param e React 输入事件对象。
   */
  const handleColorChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences({ theme: { colorPrimary: e.target.value, builtinType: 'custom' } });
  }, [setPreferences]);

  /**
   * 切换到自定义主题
   * @description 不修改当前颜色值，仅将主题类型设置为 `custom`。
   */
  const handleSetCustomTheme = useCallback(() => {
    setPreferences({ theme: { builtinType: 'custom' } });
  }, [setPreferences]);

  /**
   * 处理主题模式项点击
   * @description 从节点数据属性解析目标模式并执行对应更新函数。
   * @param e React 鼠标事件对象。
   */
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

  /**
   * 处理主题预设项点击
   * @description 解析预设类型并切换到对应内置主题或自定义主题。
   * @param e React 鼠标事件对象。
   */
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

  /**
   * 处理圆角选项点击
   * @description 从节点读取圆角值并写入主题配置。
   * @param e React 鼠标事件对象。
   */
  const handleRadiusClick = useCallback((e: React.MouseEvent) => {
    if (configs.radius.disabled) return;
    const value = (e.currentTarget as HTMLElement).dataset.value;
    if (value) {
      handleSetRadius(value);
    }
  }, [configs.radius.disabled, handleSetRadius]);

  /**
   * 当前自定义主色值。
   * @description 将主题主色转换为十六进制，供原生颜色输入框使用。
   */
  const currentColorValue = useMemo(
    () => oklchToHex(preferences.theme.colorPrimary || colorsTokens.primary),
    [preferences.theme.colorPrimary]
  );
  /**
   * 可展示的内置主题预设列表。
   * @description 过滤掉 `custom` 占位项，仅保留可直接选择的内置主题。
   */
  const builtinPresets = useMemo(
    () => BUILT_IN_THEME_PRESETS.filter((preset) => preset.type !== 'custom'),
    []
  );
  /**
   * 内置主题卡片样式缓存表。
   * @description 以主题类型为键缓存背景色样式，减少重复对象创建。
   */
  const presetStyleMap = useMemo(() => {
    const map = new Map<string, React.CSSProperties>();
    builtinPresets.forEach((preset) => {
      map.set(preset.type, {
        backgroundColor: preset.color || colorsTokens.presetFallback,
      });
    });
    return map;
  }, [builtinPresets]);

  /**
   * 主题预设分批渲染步长。
   * @description 控制每轮追加渲染数量，避免一次性渲染大量卡片。
   */
  const PRESET_RENDER_CHUNK = 12;
  /**
   * 当前已渲染的预设数量。
   * @description 结合 `requestAnimationFrame` 分批扩展可见预设。
   */
  const [presetRenderCount, setPresetRenderCount] = useState(PRESET_RENDER_CHUNK);

  /**
   * 监听预设总数变化并重置首屏渲染数量。
   */
  useEffect(() => {
    setPresetRenderCount(Math.min(PRESET_RENDER_CHUNK, builtinPresets.length));
  }, [builtinPresets.length]);

  /**
   * 逐帧追加预设渲染数量。
   * @description 当未全部渲染时按批次递增，降低首帧渲染压力。
   */
  useEffect(() => {
    if (presetRenderCount >= builtinPresets.length) return;
    const frame = requestAnimationFrame(() => {
      setPresetRenderCount((prev) => Math.min(prev + PRESET_RENDER_CHUNK, builtinPresets.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [presetRenderCount, builtinPresets.length]);

  /**
   * 当前可见的主题预设列表。
   * @description 基于分批渲染数量截断内置预设数组。
   */
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
              className={`theme-mode-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground${configs.themeMode.disabled ? ' disabled' : ''}`}
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
              className={`theme-mode-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground${configs.themeMode.disabled ? ' disabled' : ''}`}
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
              className={`theme-mode-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground${configs.themeMode.disabled ? ' disabled' : ''}`}
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
                className={`theme-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground${configs.builtinTheme.disabled ? ' disabled' : ''}`}
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
              className={`theme-preset-item pref-disabled data-active:text-foreground data-active:font-semibold aria-checked:text-foreground${configs.builtinTheme.disabled ? ' disabled' : ''}`}
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
                    <span
                      className="theme-preset-custom-icon"
                      dangerouslySetInnerHTML={{ __html: ICONS.pencil }}
                    />
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
            className={`radius-options pref-disabled${configs.radius.disabled ? ' disabled' : ''}`}
            data-disabled={configs.radius.disabled ? 'true' : undefined}
          >
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r}
                className={`radius-option data-active:text-foreground data-active:font-semibold ${preferences.theme.radius === r ? 'active' : ''}`}
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

/**
 * 默认导出外观设置 Tab 组件。
 */
export default AppearanceTab;
