/**
 * 布局设置标签页
 * @description 布局类型、内容宽度、侧边栏、顶栏、标签栏等设置
 */
import React, { memo, useMemo, useCallback } from 'react';
import { usePreferences } from '../../hooks';
import {
  getContentWidthIcon,
  isHeaderMenuLayout,
  createLayoutPreviewCache,
  getLayoutTabConfigs,
  getLayoutTabOptions,
  getLayoutPreviewOptions,
  createLayoutTabUpdater,
  type LayoutType,
  type LocaleMessages,
  type ContentWidthType,
  type LayoutPreviewOptions,
  type LayoutTabConfig,
} from '@admin-core/preferences';
import { Block } from './Block';
import { SwitchItem } from './SwitchItem';
import { SelectItem } from './SelectItem';

export interface LayoutTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
  /** UI 配置（控制功能项显示/禁用） */
  uiConfig?: LayoutTabConfig;
}

export const LayoutTab: React.FC<LayoutTabProps> = memo(({ locale, uiConfig }) => {
  const { preferences, setPreferences } = usePreferences();
  const updater = useMemo(() => createLayoutTabUpdater(setPreferences), [setPreferences]);

  // ========== UI 配置解析（使用 useMemo 缓存） ==========
  const configs = useMemo(() => getLayoutTabConfigs(uiConfig), [uiConfig]);

  // 布局选项（翻译后）
  const { layoutOptions, tabsStyleOptions, headerModeOptions } = useMemo(
    () => getLayoutTabOptions(locale),
    [locale]
  );

  // ========== 使用工厂模式创建更新器 ==========
  
  // 布局类型处理器
  const handleSetLayout = useCallback((layout: LayoutType) => {
    updater.setLayout(layout);
  }, [updater]);

  // 内容宽度处理器
  const handleSetContentWide = useCallback(() => {
    updater.setContentWide();
  }, [updater]);

  const handleSetContentCompact = useCallback(() => {
    updater.setContentCompactMode();
  }, [updater]);

  // 使用工厂创建的处理器
  const handlers = useMemo(() => ({
    // 侧边栏
    sidebar: {
      collapsed: updater.setSidebarCollapsed,
      collapsedButton: updater.setSidebarCollapsedButton,
      expandOnHover: updater.setSidebarExpandOnHover,
    },
    // 顶栏
    header: {
      enable: updater.setHeaderEnable,
      mode: updater.setHeaderMode,
      menuLauncher: updater.setHeaderMenuLauncher,
    },
    // 标签栏
    tabbar: {
      enable: updater.setTabbarEnable,
      showIcon: updater.setTabbarShowIcon,
      draggable: updater.setTabbarDraggable,
      styleType: updater.setTabbarStyleType,
    },
    // 面包屑
    breadcrumb: {
      enable: updater.setBreadcrumbEnable,
      showIcon: updater.setBreadcrumbShowIcon,
    },
    // 页脚
    footer: {
      enable: updater.setFooterEnable,
      fixed: updater.setFooterFixed,
    },
    // 功能区
    panel: {
      enable: updater.setPanelEnable,
      position: updater.setPanelPosition,
      collapsed: updater.setPanelCollapsed,
    },
    // 小部件
    widget: {
      fullscreen: updater.setWidgetFullscreen,
      themeToggle: updater.setWidgetThemeToggle,
      languageToggle: updater.setWidgetLanguageToggle,
    },
  }), [updater]);

  // 顶栏模式选项（memoized）

  // 菜单启动器是否可用（顶栏启用 + 顶部菜单布局）
  const menuLauncherEnabled = useMemo(() => {
    return preferences.header.enable && isHeaderMenuLayout(preferences.app.layout);
  }, [preferences.header.enable, preferences.app.layout]);

  // 是否允许显示折叠按钮的布局（仅 sidebar-nav 和 header-mixed-nav）
  const isCollapseButtonAllowedLayout = useMemo(() => {
    return preferences.app.layout === 'sidebar-nav' || preferences.app.layout === 'header-mixed-nav';
  }, [preferences.app.layout]);

  // 功能区位置选项
  const panelPositionOptions = useMemo(() => [
    { label: locale.panel.positionLeft, value: 'left' },
    { label: locale.panel.positionRight, value: 'right' },
  ], [locale.panel]);

  // 动态预览图选项（根据当前偏好设置）
  const previewOptions: LayoutPreviewOptions = useMemo(
    () => getLayoutPreviewOptions(preferences),
    [preferences]
  );

  // 生成布局预览图
  const previewCache = useMemo(
    () => createLayoutPreviewCache(layoutOptions, previewOptions),
    [layoutOptions, previewOptions]
  );
  const getPreviewSvg = useCallback(
    (layout: LayoutType) => previewCache[layout],
    [previewCache]
  );

  return (
    <>
      {/* 布局类型 */}
      {configs.layoutType.visible && (
        <Block title={locale.layout.type}>
          <div className="layout-presets-grid" role="radiogroup" aria-label={locale.layout.type}>
            {layoutOptions.map((opt) => (
              <div
                key={opt.value}
                className={`layout-preset-item${configs.layoutType.disabled ? ' disabled' : ''}`}
                role="radio"
                tabIndex={configs.layoutType.disabled ? -1 : 0}
                aria-checked={preferences.app.layout === opt.value}
                aria-label={opt.label}
                aria-disabled={configs.layoutType.disabled}
                onClick={() => !configs.layoutType.disabled && handleSetLayout(opt.value as LayoutType)}
                onKeyDown={(e) => { if (!configs.layoutType.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetLayout(opt.value as LayoutType); }}}
              >
                <div
                  className={`outline-box flex-center layout-preset-box ${preferences.app.layout === opt.value ? 'outline-box-active' : ''}${configs.layoutType.disabled ? ' disabled' : ''}`}
                >
                  <div
                    className="layout-preset-preview"
                    dangerouslySetInnerHTML={{ __html: getPreviewSvg(opt.value as LayoutType) }}
                  />
                </div>
                <span className="layout-preset-label">{opt.label}</span>
              </div>
            ))}
          </div>
        </Block>
      )}

      {/* 内容宽度 */}
      {configs.contentWidth.visible && (
        <Block title={locale.layout.contentWidth}>
          <div className="content-width-grid" role="radiogroup" aria-label={locale.layout.contentWidth}>
            <div 
              className={`content-width-item${configs.contentWidth.disabled ? ' disabled' : ''}`}
              role="radio"
              tabIndex={configs.contentWidth.disabled ? -1 : 0}
              aria-checked={preferences.app.contentCompact === 'wide'}
              aria-label={locale.layout.contentWide}
              aria-disabled={configs.contentWidth.disabled}
              onClick={() => !configs.contentWidth.disabled && handleSetContentWide()}
              onKeyDown={(e) => { if (!configs.contentWidth.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetContentWide(); }}}
            >
              <div
                className={`outline-box flex-center content-width-box ${preferences.app.contentCompact === 'wide' ? 'outline-box-active' : ''}${configs.contentWidth.disabled ? ' disabled' : ''}`}
              >
                <div
                  className="content-width-preview"
                  dangerouslySetInnerHTML={{ __html: getContentWidthIcon('wide' as ContentWidthType) }}
                />
              </div>
              <span className="content-width-label">{locale.layout.contentWide}</span>
            </div>
            <div 
              className={`content-width-item${configs.contentWidth.disabled ? ' disabled' : ''}`}
              role="radio"
              tabIndex={configs.contentWidth.disabled ? -1 : 0}
              aria-checked={preferences.app.contentCompact === 'compact'}
              aria-label={locale.layout.contentCompact}
              aria-disabled={configs.contentWidth.disabled}
              onClick={() => !configs.contentWidth.disabled && handleSetContentCompact()}
              onKeyDown={(e) => { if (!configs.contentWidth.disabled && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); handleSetContentCompact(); }}}
            >
              <div
                className={`outline-box flex-center content-width-box ${preferences.app.contentCompact === 'compact' ? 'outline-box-active' : ''}${configs.contentWidth.disabled ? ' disabled' : ''}`}
              >
                <div
                  className="content-width-preview"
                  dangerouslySetInnerHTML={{ __html: getContentWidthIcon('compact' as ContentWidthType) }}
                />
              </div>
              <span className="content-width-label">{locale.layout.contentCompact}</span>
            </div>
          </div>
        </Block>
      )}

      {/* 侧边栏 */}
      {configs.sidebar.visible && (
        <Block title={locale.sidebar.title}>
          {configs.sidebarCollapsed.visible && (
            <SwitchItem
              label={locale.sidebar.collapsed}
              checked={preferences.sidebar.collapsed}
              onChange={handlers.sidebar.collapsed}
              disabled={configs.sidebarCollapsed.disabled}
            />
          )}
          {configs.sidebarCollapsedButton.visible && (
            <SwitchItem
              label={locale.sidebar.collapsedButton}
              checked={isCollapseButtonAllowedLayout ? preferences.sidebar.collapsedButton : false}
              onChange={handlers.sidebar.collapsedButton}
              disabled={configs.sidebarCollapsedButton.disabled || !isCollapseButtonAllowedLayout}
            />
          )}
          {configs.sidebarExpandOnHover.visible && (
            <SwitchItem
              label={locale.sidebar.expandOnHover}
              checked={preferences.sidebar.expandOnHover}
              onChange={handlers.sidebar.expandOnHover}
              disabled={configs.sidebarExpandOnHover.disabled}
            />
          )}
        </Block>
      )}

      {/* 功能区 */}
      {configs.panel.visible && (
        <Block title={locale.panel.title}>
          {configs.panelEnable.visible && (
            <SwitchItem
              label={locale.panel.enable}
              checked={preferences.panel.enable}
              onChange={handlers.panel.enable}
              disabled={configs.panelEnable.disabled}
            />
          )}
          {configs.panelPosition.visible && (
            <SelectItem
              label={locale.panel.position}
              value={preferences.panel.position}
              onChange={handlers.panel.position}
              options={panelPositionOptions}
              disabled={!preferences.panel.enable || configs.panelPosition.disabled}
            />
          )}
          {configs.panelCollapsed.visible && (
            <SwitchItem
              label={locale.panel.collapsed}
              checked={preferences.panel.collapsed}
              onChange={handlers.panel.collapsed}
              disabled={!preferences.panel.enable || configs.panelCollapsed.disabled}
            />
          )}
        </Block>
      )}

      {/* 顶栏 */}
      {configs.header.visible && (
        <Block title={locale.header.title}>
          {configs.headerEnable.visible && (
            <SwitchItem
              label={locale.header.enable}
              checked={preferences.header.enable}
              onChange={handlers.header.enable}
              disabled={configs.headerEnable.disabled}
            />
          )}
          {configs.headerMode.visible && (
            <SelectItem
              label={locale.header.mode}
              value={preferences.header.mode}
              onChange={handlers.header.mode}
              options={headerModeOptions}
              disabled={!preferences.header.enable || configs.headerMode.disabled}
            />
          )}
          {configs.headerMenuLauncher.visible && (
            <SwitchItem
              label={locale.header.menuLauncher}
              checked={preferences.header.menuLauncher}
              onChange={handlers.header.menuLauncher}
              tip={locale.header.menuLauncherTip}
              disabled={!menuLauncherEnabled || configs.headerMenuLauncher.disabled}
            />
          )}
        </Block>
      )}

      {/* 标签栏 */}
      {configs.tabbar.visible && (
        <Block title={locale.tabbar.title}>
          {configs.tabbarEnable.visible && (
            <SwitchItem
              label={locale.tabbar.enable}
              checked={preferences.tabbar.enable}
              onChange={handlers.tabbar.enable}
              disabled={configs.tabbarEnable.disabled}
            />
          )}
          {configs.tabbarShowIcon.visible && (
            <SwitchItem
              label={locale.tabbar.showIcon}
              checked={preferences.tabbar.showIcon}
              onChange={handlers.tabbar.showIcon}
              disabled={!preferences.tabbar.enable || configs.tabbarShowIcon.disabled}
            />
          )}
          {configs.tabbarDraggable.visible && (
            <SwitchItem
              label={locale.tabbar.draggable}
              checked={preferences.tabbar.draggable}
              onChange={handlers.tabbar.draggable}
              disabled={!preferences.tabbar.enable || configs.tabbarDraggable.disabled}
            />
          )}
          {configs.tabbarStyleType.visible && (
            <SelectItem
              label={locale.tabbar.styleType}
              value={preferences.tabbar.styleType}
              onChange={handlers.tabbar.styleType}
              options={tabsStyleOptions}
              disabled={!preferences.tabbar.enable || configs.tabbarStyleType.disabled}
            />
          )}
        </Block>
      )}

      {/* 面包屑 */}
      {configs.breadcrumb.visible && (
        <Block title={locale.breadcrumb.title}>
          {configs.breadcrumbEnable.visible && (
            <SwitchItem
              label={locale.breadcrumb.enable}
              checked={preferences.breadcrumb.enable}
              onChange={handlers.breadcrumb.enable}
              disabled={configs.breadcrumbEnable.disabled}
            />
          )}
          {configs.breadcrumbShowIcon.visible && (
            <SwitchItem
              label={locale.breadcrumb.showIcon}
              checked={preferences.breadcrumb.showIcon}
              onChange={handlers.breadcrumb.showIcon}
              disabled={!preferences.breadcrumb.enable || configs.breadcrumbShowIcon.disabled}
            />
          )}
        </Block>
      )}

      {/* 页脚 */}
      {configs.footer.visible && (
        <Block title={locale.footer.title}>
          {configs.footerEnable.visible && (
            <SwitchItem
              label={locale.footer.enable}
              checked={preferences.footer.enable}
              onChange={handlers.footer.enable}
              disabled={configs.footerEnable.disabled}
            />
          )}
          {configs.footerFixed.visible && (
            <SwitchItem
              label={locale.footer.fixed}
              checked={preferences.footer.fixed}
              onChange={handlers.footer.fixed}
              disabled={!preferences.footer.enable || configs.footerFixed.disabled}
            />
          )}
        </Block>
      )}

      {/* 小部件 */}
      {configs.widget.visible && (
        <Block title={locale.widget.title}>
          {configs.widgetFullscreen.visible && (
            <SwitchItem
              label={locale.widget.fullscreen}
              checked={preferences.widget.fullscreen}
              onChange={handlers.widget.fullscreen}
              disabled={configs.widgetFullscreen.disabled}
            />
          )}
          {configs.widgetThemeToggle.visible && (
            <SwitchItem
              label={locale.widget.themeToggle}
              checked={preferences.widget.themeToggle}
              onChange={handlers.widget.themeToggle}
              disabled={configs.widgetThemeToggle.disabled}
            />
          )}
          {configs.widgetLanguageToggle.visible && (
            <SwitchItem
              label={locale.widget.languageToggle}
              checked={preferences.widget.languageToggle}
              onChange={handlers.widget.languageToggle}
              disabled={configs.widgetLanguageToggle.disabled}
            />
          )}
        </Block>
      )}
    </>
  );
});

LayoutTab.displayName = 'LayoutTab';

export default LayoutTab;
