import { generateLayoutPreview } from '../icons';
import { getFeatureItemConfig } from './drawer-config';
import { createTranslatedOptions } from './options-factory';
import type { LayoutPreviewOptions } from '../icons/layout-preview-generator';
import type { LocaleMessages } from '../locales';
import type { LayoutTabConfig, ResolvedFeatureConfig, Preferences, DeepPartial } from '../types';
import type { LayoutType, ContentCompactType } from '../types/layout';

export interface LayoutTabUpdater {
  setLayout: (layout: LayoutType) => void;
  setContentCompact: (value: ContentCompactType) => void;
  setContentWide: () => void;
  setContentCompactMode: () => void;
  setSidebarCollapsed: (value: boolean) => void;
  setSidebarCollapsedButton: (value: boolean) => void;
  setSidebarExpandOnHover: (value: boolean) => void;
  setHeaderEnable: (value: boolean) => void;
  setHeaderMode: (value: string | number) => void;
  setHeaderMenuAlign: (value: string | number) => void;
  setHeaderMenuLauncher: (value: boolean) => void;
  setTabbarEnable: (value: boolean) => void;
  setTabbarShowIcon: (value: boolean) => void;
  setTabbarShowMore: (value: boolean) => void;
  setTabbarShowMaximize: (value: boolean) => void;
  setTabbarDraggable: (value: boolean) => void;
  setTabbarWheelable: (value: boolean) => void;
  setTabbarMiddleClickToClose: (value: boolean) => void;
  setTabbarPersist: (value: boolean) => void;
  setTabbarKeepAlive: (value: boolean) => void;
  setTabbarMaxCount: (value: number) => void;
  setTabbarStyleType: (value: string | number) => void;
  setBreadcrumbEnable: (value: boolean) => void;
  setBreadcrumbShowIcon: (value: boolean) => void;
  setFooterEnable: (value: boolean) => void;
  setFooterFixed: (value: boolean) => void;
  setPanelEnable: (value: boolean) => void;
  setPanelPosition: (value: string | number) => void;
  setPanelCollapsed: (value: boolean) => void;
  setWidgetFullscreen: (value: boolean) => void;
  setWidgetGlobalSearch: (value: boolean) => void;
  setWidgetThemeToggle: (value: boolean) => void;
  setWidgetLanguageToggle: (value: boolean) => void;
}

export function createLayoutTabUpdater(
  setPreferences: (updates: DeepPartial<Preferences>) => void
): LayoutTabUpdater {
  const setBool = <K extends keyof Preferences>(category: K, key: keyof Preferences[K]) =>
    (value: boolean) => {
      setPreferences({ [category]: { [key]: value } } as DeepPartial<Preferences>);
    };

  const setString = <K extends keyof Preferences>(category: K, key: keyof Preferences[K]) =>
    (value: string | number) => {
      setPreferences({ [category]: { [key]: String(value) } } as DeepPartial<Preferences>);
    };
  const setNumber = <K extends keyof Preferences>(category: K, key: keyof Preferences[K]) =>
    (value: number) => {
      setPreferences({ [category]: { [key]: value } } as DeepPartial<Preferences>);
    };

  return {
    setLayout: (layout: LayoutType) => setPreferences({ app: { layout } }),
    setContentCompact: (value: ContentCompactType) => setPreferences({ app: { contentCompact: value } }),
    setContentWide: () => setPreferences({ app: { contentCompact: 'wide' } }),
    setContentCompactMode: () => setPreferences({ app: { contentCompact: 'compact' } }),
    setSidebarCollapsed: setBool('sidebar', 'collapsed'),
    setSidebarCollapsedButton: setBool('sidebar', 'collapsedButton'),
    setSidebarExpandOnHover: setBool('sidebar', 'expandOnHover'),
    setHeaderEnable: setBool('header', 'enable'),
    setHeaderMode: setString('header', 'mode'),
    setHeaderMenuAlign: setString('header', 'menuAlign'),
    setHeaderMenuLauncher: setBool('header', 'menuLauncher'),
    setTabbarEnable: setBool('tabbar', 'enable'),
    setTabbarShowIcon: setBool('tabbar', 'showIcon'),
    setTabbarShowMore: setBool('tabbar', 'showMore'),
    setTabbarShowMaximize: setBool('tabbar', 'showMaximize'),
    setTabbarDraggable: setBool('tabbar', 'draggable'),
    setTabbarWheelable: setBool('tabbar', 'wheelable'),
    setTabbarMiddleClickToClose: setBool('tabbar', 'middleClickToClose'),
    setTabbarPersist: setBool('tabbar', 'persist'),
    setTabbarKeepAlive: setBool('tabbar', 'keepAlive'),
    setTabbarMaxCount: setNumber('tabbar', 'maxCount'),
    setTabbarStyleType: setString('tabbar', 'styleType'),
    setBreadcrumbEnable: setBool('breadcrumb', 'enable'),
    setBreadcrumbShowIcon: setBool('breadcrumb', 'showIcon'),
    setFooterEnable: setBool('footer', 'enable'),
    setFooterFixed: setBool('footer', 'fixed'),
    setPanelEnable: setBool('panel', 'enable'),
    setPanelPosition: setString('panel', 'position'),
    setPanelCollapsed: setBool('panel', 'collapsed'),
    setWidgetFullscreen: setBool('widget', 'fullscreen'),
    setWidgetGlobalSearch: setBool('widget', 'globalSearch'),
    setWidgetThemeToggle: setBool('widget', 'themeToggle'),
    setWidgetLanguageToggle: setBool('widget', 'languageToggle'),
  };
}

export interface LayoutTabConfigs {
  layoutType: ResolvedFeatureConfig;
  contentWidth: ResolvedFeatureConfig;
  sidebar: ResolvedFeatureConfig;
  sidebarCollapsed: ResolvedFeatureConfig;
  sidebarCollapsedButton: ResolvedFeatureConfig;
  sidebarExpandOnHover: ResolvedFeatureConfig;
  panel: ResolvedFeatureConfig;
  panelEnable: ResolvedFeatureConfig;
  panelPosition: ResolvedFeatureConfig;
  panelCollapsed: ResolvedFeatureConfig;
  header: ResolvedFeatureConfig;
  headerEnable: ResolvedFeatureConfig;
  headerMode: ResolvedFeatureConfig;
  headerMenuAlign: ResolvedFeatureConfig;
  headerMenuLauncher: ResolvedFeatureConfig;
  tabbar: ResolvedFeatureConfig;
  tabbarEnable: ResolvedFeatureConfig;
  tabbarShowIcon: ResolvedFeatureConfig;
  tabbarShowMore: ResolvedFeatureConfig;
  tabbarShowMaximize: ResolvedFeatureConfig;
  tabbarDraggable: ResolvedFeatureConfig;
  tabbarWheelable: ResolvedFeatureConfig;
  tabbarMiddleClickToClose: ResolvedFeatureConfig;
  tabbarPersist: ResolvedFeatureConfig;
  tabbarKeepAlive: ResolvedFeatureConfig;
  tabbarMaxCount: ResolvedFeatureConfig;
  tabbarStyleType: ResolvedFeatureConfig;
  breadcrumb: ResolvedFeatureConfig;
  breadcrumbEnable: ResolvedFeatureConfig;
  breadcrumbShowIcon: ResolvedFeatureConfig;
  footer: ResolvedFeatureConfig;
  footerEnable: ResolvedFeatureConfig;
  footerFixed: ResolvedFeatureConfig;
  widget: ResolvedFeatureConfig;
  widgetFullscreen: ResolvedFeatureConfig;
  widgetGlobalSearch: ResolvedFeatureConfig;
  widgetThemeToggle: ResolvedFeatureConfig;
  widgetLanguageToggle: ResolvedFeatureConfig;
}

export function getLayoutTabConfigs(uiConfig?: LayoutTabConfig): LayoutTabConfigs {
  const getConfig = (blockKey: keyof LayoutTabConfig, itemKey?: string): ResolvedFeatureConfig =>
    getFeatureItemConfig(uiConfig, blockKey, itemKey);

  return {
    layoutType: getConfig('layoutType'),
    contentWidth: getConfig('contentWidth'),
    sidebar: getConfig('sidebar'),
    sidebarCollapsed: getConfig('sidebar', 'collapsed'),
    sidebarCollapsedButton: getConfig('sidebar', 'collapsedButton'),
    sidebarExpandOnHover: getConfig('sidebar', 'expandOnHover'),
    panel: getConfig('panel'),
    panelEnable: getConfig('panel', 'enable'),
    panelPosition: getConfig('panel', 'position'),
    panelCollapsed: getConfig('panel', 'collapsed'),
    header: getConfig('header'),
    headerEnable: getConfig('header', 'enable'),
    headerMode: getConfig('header', 'mode'),
    headerMenuAlign: getConfig('header', 'menuAlign'),
    headerMenuLauncher: getConfig('header', 'menuLauncher'),
    tabbar: getConfig('tabbar'),
    tabbarEnable: getConfig('tabbar', 'enable'),
    tabbarShowIcon: getConfig('tabbar', 'showIcon'),
    tabbarShowMore: getConfig('tabbar', 'showMore'),
    tabbarShowMaximize: getConfig('tabbar', 'showMaximize'),
    tabbarDraggable: getConfig('tabbar', 'draggable'),
    tabbarWheelable: getConfig('tabbar', 'wheelable'),
    tabbarMiddleClickToClose: getConfig('tabbar', 'middleClickToClose'),
    tabbarPersist: getConfig('tabbar', 'persist'),
    tabbarKeepAlive: getConfig('tabbar', 'keepAlive'),
    tabbarMaxCount: getConfig('tabbar', 'maxCount'),
    tabbarStyleType: getConfig('tabbar', 'styleType'),
    breadcrumb: getConfig('breadcrumb'),
    breadcrumbEnable: getConfig('breadcrumb', 'enable'),
    breadcrumbShowIcon: getConfig('breadcrumb', 'showIcon'),
    footer: getConfig('footer'),
    footerEnable: getConfig('footer', 'enable'),
    footerFixed: getConfig('footer', 'fixed'),
    widget: getConfig('widget'),
    widgetFullscreen: getConfig('widget', 'fullscreen'),
    widgetGlobalSearch: getConfig('widget', 'globalSearch'),
    widgetThemeToggle: getConfig('widget', 'themeToggle'),
    widgetLanguageToggle: getConfig('widget', 'languageToggle'),
  };
}

export function getLayoutTabOptions(locale: LocaleMessages) {
  const options = createTranslatedOptions(locale);
  return {
    layoutOptions: options.layoutOptions,
    tabsStyleOptions: options.tabsStyleOptions,
    headerModeOptions: options.headerModeOptions,
    headerMenuAlignOptions: options.headerMenuAlignOptions,
  };
}

export function createLayoutPreviewCache(
  layoutOptions: Array<{ value: LayoutType }>,
  previewOptions: LayoutPreviewOptions
): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const opt of layoutOptions) {
    cache[opt.value] = generateLayoutPreview(opt.value, previewOptions);
  }
  return cache;
}

export function getLayoutPreviewOptions(preferences: Preferences): LayoutPreviewOptions {
  const panelEnabled = preferences.panel.enable;
  const panelPosition = preferences.panel.position;
  const panelCollapsed = preferences.panel.collapsed;

  return {
    showSidebar: true,
    sidebarCollapsed: preferences.sidebar.collapsed,
    showHeader: preferences.header.enable,
    showTabbar: preferences.tabbar.enable,
    showFooter: preferences.footer.enable,
    showLeftPanel: panelEnabled && panelPosition === 'left',
    leftPanelCollapsed: panelCollapsed,
    showRightPanel: panelEnabled && panelPosition === 'right',
    rightPanelCollapsed: panelCollapsed,
  };
}
