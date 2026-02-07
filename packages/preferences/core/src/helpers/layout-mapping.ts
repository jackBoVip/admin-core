import type { Preferences } from '../types';

export function mapPreferencesToLayoutProps(preferences: Partial<Preferences>): Record<string, unknown> {
  const {
    app,
    theme,
    header,
    sidebar,
    tabbar,
    footer,
    breadcrumb,
    navigation,
    panel,
    logo,
    copyright,
    transition,
    shortcutKeys,
    widget,
    lockScreen,
  } = preferences;

  const isHeaderNavLayout = app?.layout === 'header-nav';
  const isBreadcrumbDisabledLayout =
    isHeaderNavLayout || app?.layout === 'mixed-nav' || app?.layout === 'header-mixed-nav';
  const resolvedSidebar = sidebar ? { ...sidebar } : undefined;
  const resolvedBreadcrumb = breadcrumb ? { ...breadcrumb } : undefined;
  const resolvedHeader = header ? { ...header } : undefined;

  if (isHeaderNavLayout) {
    if (resolvedSidebar) {
      resolvedSidebar.enable = false;
    }
  }
  if (isBreadcrumbDisabledLayout && resolvedBreadcrumb) {
    resolvedBreadcrumb.enable = false;
  }
  if (app?.layout === 'header-mixed-nav' && resolvedHeader) {
    resolvedHeader.menuLauncher = false;
  }

  return {
    // 应用配置
    appName: app?.name,
    layout: app?.layout,
    isMobile: app?.isMobile,
    zIndex: app?.zIndex,
    compact: app?.compact,
    dynamicTitle: app?.dynamicTitle,
    defaultAvatar: app?.defaultAvatar,
    defaultHomePath: app?.defaultHomePath,
    accessMode: app?.accessMode,
    authPageLayout: app?.authPageLayout,
    loginExpiredMode: app?.loginExpiredMode,
    locale: app?.locale,
    enablePreferences: app?.enablePreferences,
    enableStickyPreferencesNav: app?.enableStickyPreferencesNavigationBar,
    enableRefreshToken: app?.enableRefreshToken,
    preferencesButtonPosition: app?.preferencesButtonPosition,
    contentCompact: app?.contentCompact,
    contentCompactWidth: app?.contentCompactWidth,
    contentPadding: app?.contentPadding,
    contentPaddingTop: app?.contentPaddingTop,
    contentPaddingBottom: app?.contentPaddingBottom,
    contentPaddingLeft: app?.contentPaddingLeft,
    contentPaddingRight: app?.contentPaddingRight,

    // 主题配置
    theme: theme
      ? {
          mode: theme.mode,
          builtinType: theme.builtinType,
          colorPrimary: theme.colorPrimary,
          fontScale: theme.fontScale,
          radius: theme.radius,
          semiDarkHeader: theme.semiDarkHeader,
          semiDarkSidebar: theme.semiDarkSidebar,
          colorFollowPrimaryLight: app?.colorFollowPrimaryLight,
          colorFollowPrimaryDark: app?.colorFollowPrimaryDark,
          colorGrayMode: app?.colorGrayMode,
          colorWeakMode: app?.colorWeakMode,
        }
      : undefined,

    // 水印配置
    watermark: app?.watermark
      ? {
          enable: app.watermark,
          content: app.watermarkContent,
          angle: app.watermarkAngle,
          appendDate: app.watermarkAppendDate,
          fontSize: app.watermarkFontSize,
        }
      : undefined,

    // 锁屏配置
    lockScreen: lockScreen
      ? {
          isLocked: lockScreen.isLocked,
          password: lockScreen.password,
          backgroundImage: lockScreen.backgroundImage,
          autoLockTime: lockScreen.autoLockTime,
        }
      : undefined,

    // 检查更新配置
    checkUpdates: app?.enableCheckUpdates
      ? {
          enable: app.enableCheckUpdates,
          interval: app.checkUpdatesInterval,
        }
      : undefined,

    // 各区域配置（创建浅拷贝确保响应式更新）
    header: resolvedHeader,
    semiDarkHeader: theme?.semiDarkHeader,
    sidebar: resolvedSidebar,
    semiDarkSidebar: theme?.semiDarkSidebar,
    tabbar: tabbar ? { ...tabbar } : undefined,
    footer: footer ? { ...footer } : undefined,
    breadcrumb: resolvedBreadcrumb,
    navigation: navigation ? { ...navigation } : undefined,
    panel: panel ? { ...panel } : undefined,
    logo: logo ? { ...logo } : undefined,
    copyright: copyright ? { ...copyright } : undefined,
    transition: transition ? { ...transition } : undefined,
    shortcutKeys: shortcutKeys ? { ...shortcutKeys } : undefined,
    widgets:
      widget || resolvedSidebar
        ? {
            ...widget,
            // 让“显示折叠按钮”同时控制顶部侧边栏切换按钮
            ...(resolvedSidebar ? { sidebarToggle: resolvedSidebar.collapsedButton } : {}),
          }
        : undefined,
  };
}
