/**
 * 布局设置标签页
 * @description 布局类型、内容宽度、侧边栏、顶栏、标签栏等设置
 */
import React, { memo, useMemo, useCallback } from 'react';
import { usePreferences } from '../../hooks';
import {
  LAYOUT_OPTIONS,
  TABS_STYLE_OPTIONS,
  getLayoutIcon,
  getContentWidthIcon,
  translateOptions,
  type LayoutType,
  type LocaleMessages,
  type LayoutHeaderModeType,
  type TabsStyleType,
  type ContentWidthType,
} from '@admin-core/preferences';
import { Block } from './Block';
import { SwitchItem } from './SwitchItem';
import { SelectItem } from './SelectItem';

export interface LayoutTabProps {
  /** 当前语言包 */
  locale: LocaleMessages;
}

export const LayoutTab: React.FC<LayoutTabProps> = memo(({ locale }) => {
  const { preferences, setPreferences } = usePreferences();

  // 布局选项（翻译后）
  const layoutOptions = useMemo(
    () => translateOptions(LAYOUT_OPTIONS, locale),
    [locale]
  );

  // 标签栏样式选项（翻译后）
  const tabsStyleOptions = useMemo(
    () => translateOptions(TABS_STYLE_OPTIONS, locale),
    [locale]
  );

  // ========== 稳定的回调函数 ==========
  
  // 布局类型处理器
  const handleSetLayout = useCallback((layout: LayoutType) => {
    setPreferences({ app: { layout } });
  }, [setPreferences]);

  // 内容宽度处理器
  const handleSetContentWide = useCallback(() => {
    setPreferences({ app: { contentCompact: 'wide' } });
  }, [setPreferences]);

  const handleSetContentCompact = useCallback(() => {
    setPreferences({ app: { contentCompact: 'compact' } });
  }, [setPreferences]);

  // 侧边栏处理器
  const handleSetSidebarCollapsed = useCallback((v: boolean) => {
    setPreferences({ sidebar: { collapsed: v } });
  }, [setPreferences]);

  const handleSetSidebarCollapsedButton = useCallback((v: boolean) => {
    setPreferences({ sidebar: { collapsedButton: v } });
  }, [setPreferences]);

  const handleSetSidebarExpandOnHover = useCallback((v: boolean) => {
    setPreferences({ sidebar: { expandOnHover: v } });
  }, [setPreferences]);

  // 顶栏处理器
  const handleSetHeaderEnable = useCallback((v: boolean) => {
    setPreferences({ header: { enable: v } });
  }, [setPreferences]);

  const handleSetHeaderMode = useCallback((v: string | number) => {
    setPreferences({ header: { mode: String(v) as LayoutHeaderModeType } });
  }, [setPreferences]);

  // 标签栏处理器
  const handleSetTabbarEnable = useCallback((v: boolean) => {
    setPreferences({ tabbar: { enable: v } });
  }, [setPreferences]);

  const handleSetTabbarShowIcon = useCallback((v: boolean) => {
    setPreferences({ tabbar: { showIcon: v } });
  }, [setPreferences]);

  const handleSetTabbarDraggable = useCallback((v: boolean) => {
    setPreferences({ tabbar: { draggable: v } });
  }, [setPreferences]);

  const handleSetTabbarStyleType = useCallback((v: string | number) => {
    setPreferences({ tabbar: { styleType: String(v) as TabsStyleType } });
  }, [setPreferences]);

  // 面包屑处理器
  const handleSetBreadcrumbEnable = useCallback((v: boolean) => {
    setPreferences({ breadcrumb: { enable: v } });
  }, [setPreferences]);

  const handleSetBreadcrumbShowIcon = useCallback((v: boolean) => {
    setPreferences({ breadcrumb: { showIcon: v } });
  }, [setPreferences]);

  // 页脚处理器
  const handleSetFooterEnable = useCallback((v: boolean) => {
    setPreferences({ footer: { enable: v } });
  }, [setPreferences]);

  const handleSetFooterFixed = useCallback((v: boolean) => {
    setPreferences({ footer: { fixed: v } });
  }, [setPreferences]);

  // 顶栏模式选项（memoized）
  const headerModeOptions = useMemo(() => [
    { label: locale.header.modeFixed, value: 'fixed' },
    { label: locale.header.modeStatic, value: 'static' },
    { label: locale.header.modeAuto, value: 'auto' },
    { label: locale.header.modeAutoScroll, value: 'auto-scroll' },
  ], [locale.header]);

  return (
    <>
      {/* 布局类型 */}
      <Block title={locale.layout.type}>
        <div className="layout-presets-grid">
          {layoutOptions.map((opt) => (
            <div
              key={opt.value}
              className="layout-preset-item"
              onClick={() => handleSetLayout(opt.value as LayoutType)}
            >
              <div
                className={`layout-preset-box ${preferences.app.layout === opt.value ? 'outline-box-active' : ''}`}
              >
                <div
                  className="layout-preset-preview"
                  dangerouslySetInnerHTML={{ __html: getLayoutIcon(opt.value as LayoutType) }}
                />
              </div>
              <span className="layout-preset-label">{opt.label}</span>
            </div>
          ))}
        </div>
      </Block>

      {/* 内容宽度 */}
      <Block title={locale.layout.contentWidth}>
        <div className="content-width-grid">
          <div className="content-width-item" onClick={handleSetContentWide}>
            <div
              className={`content-width-box ${preferences.app.contentCompact === 'wide' ? 'outline-box-active' : ''}`}
            >
              <div
                className="content-width-preview"
                dangerouslySetInnerHTML={{ __html: getContentWidthIcon('wide' as ContentWidthType) }}
              />
            </div>
            <span className="content-width-label">{locale.layout.contentWide}</span>
          </div>
          <div className="content-width-item" onClick={handleSetContentCompact}>
            <div
              className={`content-width-box ${preferences.app.contentCompact === 'compact' ? 'outline-box-active' : ''}`}
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

      {/* 侧边栏 */}
      <Block title={locale.sidebar.title}>
        <SwitchItem
          label={locale.sidebar.collapsed}
          checked={preferences.sidebar.collapsed}
          onChange={handleSetSidebarCollapsed}
        />
        <SwitchItem
          label={locale.sidebar.collapsedButton}
          checked={preferences.sidebar.collapsedButton}
          onChange={handleSetSidebarCollapsedButton}
        />
        <SwitchItem
          label={locale.sidebar.expandOnHover}
          checked={preferences.sidebar.expandOnHover}
          onChange={handleSetSidebarExpandOnHover}
        />
      </Block>

      {/* 顶栏 */}
      <Block title={locale.header.title}>
        <SwitchItem
          label={locale.header.enable}
          checked={preferences.header.enable}
          onChange={handleSetHeaderEnable}
        />
        <SelectItem
          label={locale.header.mode}
          value={preferences.header.mode}
          onChange={handleSetHeaderMode}
          options={headerModeOptions}
        />
      </Block>

      {/* 标签栏 */}
      <Block title={locale.tabbar.title}>
        <SwitchItem
          label={locale.tabbar.enable}
          checked={preferences.tabbar.enable}
          onChange={handleSetTabbarEnable}
        />
        <SwitchItem
          label={locale.tabbar.showIcon}
          checked={preferences.tabbar.showIcon}
          onChange={handleSetTabbarShowIcon}
        />
        <SwitchItem
          label={locale.tabbar.draggable}
          checked={preferences.tabbar.draggable}
          onChange={handleSetTabbarDraggable}
        />
        <SelectItem
          label={locale.tabbar.styleType}
          value={preferences.tabbar.styleType}
          onChange={handleSetTabbarStyleType}
          options={tabsStyleOptions}
        />
      </Block>

      {/* 面包屑 */}
      <Block title={locale.breadcrumb.title}>
        <SwitchItem
          label={locale.breadcrumb.enable}
          checked={preferences.breadcrumb.enable}
          onChange={handleSetBreadcrumbEnable}
        />
        <SwitchItem
          label={locale.breadcrumb.showIcon}
          checked={preferences.breadcrumb.showIcon}
          onChange={handleSetBreadcrumbShowIcon}
        />
      </Block>

      {/* 页脚 */}
      <Block title={locale.footer.title}>
        <SwitchItem
          label={locale.footer.enable}
          checked={preferences.footer.enable}
          onChange={handleSetFooterEnable}
        />
        <SwitchItem
          label={locale.footer.fixed}
          checked={preferences.footer.fixed}
          onChange={handleSetFooterFixed}
        />
      </Block>
    </>
  );
});

LayoutTab.displayName = 'LayoutTab';

export default LayoutTab;
