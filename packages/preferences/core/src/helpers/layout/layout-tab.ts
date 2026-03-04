import { generateLayoutPreview } from '../../icons';
import { getFeatureItemConfig } from '../drawer-config';
import { createTranslatedOptions } from '../options-factory';
import type { LayoutPreviewOptions } from '../../icons/layout-preview-generator';
import type { LocaleMessages } from '../../locales';
import type { LayoutTabConfig, ResolvedFeatureConfig, Preferences, DeepPartial } from '../../types';
import type { LayoutType, ContentCompactType } from '../../types/layout';

/**
 * 布局类型选项值。
 */
export interface LayoutTypeOption {
  /** 布局类型值。 */
  value: LayoutType;
}

/**
 * 布局页签更新器，封装每个布局配置项的写入方法。
 */
export interface LayoutTabUpdater {
  /** 设置整体布局类型。 */
  setLayout: (layout: LayoutType) => void;
  /** 设置内容宽度模式。 */
  setContentCompact: (value: ContentCompactType) => void;
  /** 切换到宽屏内容模式。 */
  setContentWide: () => void;
  /** 切换到紧凑内容模式。 */
  setContentCompactMode: () => void;
  /** 设置侧边栏折叠状态。 */
  setSidebarCollapsed: (value: boolean) => void;
  /** 设置是否显示侧边栏折叠按钮。 */
  setSidebarCollapsedButton: (value: boolean) => void;
  /** 设置侧边栏是否悬停展开。 */
  setSidebarExpandOnHover: (value: boolean) => void;
  /** 设置页头启用状态。 */
  setHeaderEnable: (value: boolean) => void;
  /** 设置页头模式。 */
  setHeaderMode: (value: string | number) => void;
  /** 设置页头菜单对齐方式。 */
  setHeaderMenuAlign: (value: string | number) => void;
  /** 设置是否启用页头菜单触发器。 */
  setHeaderMenuLauncher: (value: boolean) => void;
  /** 设置标签栏启用状态。 */
  setTabbarEnable: (value: boolean) => void;
  /** 设置标签栏是否显示图标。 */
  setTabbarShowIcon: (value: boolean) => void;
  /** 设置标签栏是否显示更多菜单。 */
  setTabbarShowMore: (value: boolean) => void;
  /** 设置标签栏是否显示最大化入口。 */
  setTabbarShowMaximize: (value: boolean) => void;
  /** 设置标签栏拖拽开关。 */
  setTabbarDraggable: (value: boolean) => void;
  /** 设置标签栏滚轮切换开关。 */
  setTabbarWheelable: (value: boolean) => void;
  /** 设置中键关闭标签开关。 */
  setTabbarMiddleClickToClose: (value: boolean) => void;
  /** 设置标签持久化开关。 */
  setTabbarPersist: (value: boolean) => void;
  /** 设置标签缓存开关。 */
  setTabbarKeepAlive: (value: boolean) => void;
  /** 设置标签最大数量。 */
  setTabbarMaxCount: (value: number) => void;
  /** 设置标签栏样式类型。 */
  setTabbarStyleType: (value: string | number) => void;
  /** 设置面包屑启用状态。 */
  setBreadcrumbEnable: (value: boolean) => void;
  /** 设置面包屑是否显示图标。 */
  setBreadcrumbShowIcon: (value: boolean) => void;
  /** 设置页脚启用状态。 */
  setFooterEnable: (value: boolean) => void;
  /** 设置页脚固定状态。 */
  setFooterFixed: (value: boolean) => void;
  /** 设置侧面板启用状态。 */
  setPanelEnable: (value: boolean) => void;
  /** 设置侧面板位置。 */
  setPanelPosition: (value: string | number) => void;
  /** 设置侧面板折叠状态。 */
  setPanelCollapsed: (value: boolean) => void;
  /** 设置是否显示全屏部件。 */
  setWidgetFullscreen: (value: boolean) => void;
  /** 设置是否显示全局搜索部件。 */
  setWidgetGlobalSearch: (value: boolean) => void;
  /** 设置是否显示主题切换部件。 */
  setWidgetThemeToggle: (value: boolean) => void;
  /** 设置是否显示语言切换部件。 */
  setWidgetLanguageToggle: (value: boolean) => void;
}

/**
 * 创建布局页签更新器。
 * @param setPreferences 偏好设置写入函数。
 * @returns 布局配置更新器。
 */
export function createLayoutTabUpdater(
  setPreferences: (updates: DeepPartial<Preferences>) => void
): LayoutTabUpdater {
  /**
   * 生成布尔型偏好项写入器。
   * @param category 偏好分类键。
   * @param key 分类内字段键。
   * @returns 接收布尔值并写入偏好的函数。
   */
  const setBool = <K extends keyof Preferences>(category: K, key: keyof Preferences[K]) =>
    (value: boolean) => {
      setPreferences({ [category]: { [key]: value } } as DeepPartial<Preferences>);
    };

  /**
   * 生成字符串型偏好项写入器（统一将输入转为字符串）。
   * @param category 偏好分类键。
   * @param key 分类内字段键。
   * @returns 接收字符串或数字并写入偏好的函数。
   */
  const setString = <K extends keyof Preferences>(category: K, key: keyof Preferences[K]) =>
    (value: string | number) => {
      setPreferences({ [category]: { [key]: String(value) } } as DeepPartial<Preferences>);
    };
  /**
   * 生成数字型偏好项写入器。
   * @param category 偏好分类键。
   * @param key 分类内字段键。
   * @returns 接收数字并写入偏好的函数。
   */
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

/**
 * 布局页签每个功能块的解析配置集合。
 */
export interface LayoutTabConfigs {
  /** 布局类型配置。 */
  layoutType: ResolvedFeatureConfig;
  /** 内容宽度配置。 */
  contentWidth: ResolvedFeatureConfig;
  /** 侧边栏分组配置。 */
  sidebar: ResolvedFeatureConfig;
  /** 侧边栏折叠配置。 */
  sidebarCollapsed: ResolvedFeatureConfig;
  /** 侧边栏折叠按钮配置。 */
  sidebarCollapsedButton: ResolvedFeatureConfig;
  /** 侧边栏悬停展开配置。 */
  sidebarExpandOnHover: ResolvedFeatureConfig;
  /** 侧面板分组配置。 */
  panel: ResolvedFeatureConfig;
  /** 侧面板启用配置。 */
  panelEnable: ResolvedFeatureConfig;
  /** 侧面板位置配置。 */
  panelPosition: ResolvedFeatureConfig;
  /** 侧面板折叠配置。 */
  panelCollapsed: ResolvedFeatureConfig;
  /** 页头分组配置。 */
  header: ResolvedFeatureConfig;
  /** 页头启用配置。 */
  headerEnable: ResolvedFeatureConfig;
  /** 页头模式配置。 */
  headerMode: ResolvedFeatureConfig;
  /** 页头菜单对齐配置。 */
  headerMenuAlign: ResolvedFeatureConfig;
  /** 页头菜单触发器配置。 */
  headerMenuLauncher: ResolvedFeatureConfig;
  /** 标签栏分组配置。 */
  tabbar: ResolvedFeatureConfig;
  /** 标签栏启用配置。 */
  tabbarEnable: ResolvedFeatureConfig;
  /** 标签栏图标显示配置。 */
  tabbarShowIcon: ResolvedFeatureConfig;
  /** 标签栏更多菜单配置。 */
  tabbarShowMore: ResolvedFeatureConfig;
  /** 标签栏最大化入口配置。 */
  tabbarShowMaximize: ResolvedFeatureConfig;
  /** 标签拖拽配置。 */
  tabbarDraggable: ResolvedFeatureConfig;
  /** 滚轮切换配置。 */
  tabbarWheelable: ResolvedFeatureConfig;
  /** 中键关闭配置。 */
  tabbarMiddleClickToClose: ResolvedFeatureConfig;
  /** 标签持久化配置。 */
  tabbarPersist: ResolvedFeatureConfig;
  /** 标签缓存配置。 */
  tabbarKeepAlive: ResolvedFeatureConfig;
  /** 标签最大数量配置。 */
  tabbarMaxCount: ResolvedFeatureConfig;
  /** 标签栏样式类型配置。 */
  tabbarStyleType: ResolvedFeatureConfig;
  /** 面包屑分组配置。 */
  breadcrumb: ResolvedFeatureConfig;
  /** 面包屑启用配置。 */
  breadcrumbEnable: ResolvedFeatureConfig;
  /** 面包屑图标显示配置。 */
  breadcrumbShowIcon: ResolvedFeatureConfig;
  /** 页脚分组配置。 */
  footer: ResolvedFeatureConfig;
  /** 页脚启用配置。 */
  footerEnable: ResolvedFeatureConfig;
  /** 页脚固定配置。 */
  footerFixed: ResolvedFeatureConfig;
  /** 工具部件分组配置。 */
  widget: ResolvedFeatureConfig;
  /** 全屏部件配置。 */
  widgetFullscreen: ResolvedFeatureConfig;
  /** 全局搜索部件配置。 */
  widgetGlobalSearch: ResolvedFeatureConfig;
  /** 主题切换部件配置。 */
  widgetThemeToggle: ResolvedFeatureConfig;
  /** 语言切换部件配置。 */
  widgetLanguageToggle: ResolvedFeatureConfig;
}

/**
 * 获取布局页签所有功能项的解析配置。
 * @param uiConfig 布局页签 UI 配置。
 * @returns 解析后的功能配置集合。
 */
export function getLayoutTabConfigs(uiConfig?: LayoutTabConfig): LayoutTabConfigs {
  /**
   * 解析指定功能块（及可选子项）的可见性与禁用状态配置。
   * @param blockKey 功能块键。
   * @param itemKey 功能项键。
   * @returns 解析后的功能配置。
   */
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

/**
 * 生成布局页签下拉选项集合。
 * @param locale 当前语言文案。
 * @returns 布局页签可选项集合。
 */
export function getLayoutTabOptions(locale: LocaleMessages) {
  const options = createTranslatedOptions(locale);
  return {
    layoutOptions: options.layoutOptions,
    tabsStyleOptions: options.tabsStyleOptions,
    headerModeOptions: options.headerModeOptions,
    headerMenuAlignOptions: options.headerMenuAlignOptions,
  };
}

/**
 * 生成布局预览 SVG 缓存。
 * @param layoutOptions 可选布局列表。
 * @param previewOptions 预览渲染配置。
 * @returns 以布局类型为键的预览图缓存。
 */
export function createLayoutPreviewCache(
  layoutOptions: LayoutTypeOption[],
  previewOptions: LayoutPreviewOptions
): Record<string, string> {
  const cache: Record<string, string> = {};
  for (const opt of layoutOptions) {
    cache[opt.value] = generateLayoutPreview(opt.value, previewOptions);
  }
  return cache;
}

/**
 * 从偏好设置推导布局预览参数。
 * @param preferences 当前偏好设置。
 * @returns 布局预览参数。
 */
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
