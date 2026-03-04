import type { Preferences } from '../../types';

/**
 * 将偏好设置对象映射为布局组件可消费的 props 结构。
 * @description 对布局相关字段做兼容性归一化（如特定布局下禁用侧栏/面包屑），并输出统一 props。
 *
 * @param preferences 偏好设置片段。
 * @returns 布局 props 对象。
 */
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

  /**
   * 是否为顶栏导航布局。
   * @description 顶栏导航布局下不展示侧边栏。
   */
  const isHeaderNavLayout = app?.layout === 'header-nav';
  /**
   * 是否属于面包屑禁用布局。
   * @description 某些布局形态下不展示面包屑，需在映射阶段强制关闭。
   */
  const isBreadcrumbDisabledLayout =
    isHeaderNavLayout || app?.layout === 'mixed-nav' || app?.layout === 'header-mixed-nav';
  /**
   * 侧边栏配置浅拷贝。
   * @description 避免直接修改传入偏好对象，保证映射过程无副作用。
   */
  const resolvedSidebar = sidebar ? { ...sidebar } : undefined;
  /**
   * 面包屑配置浅拷贝。
   * @description 用于按布局规则覆盖启用状态。
   */
  const resolvedBreadcrumb = breadcrumb ? { ...breadcrumb } : undefined;
  /**
   * 顶栏配置浅拷贝。
   * @description 用于在特定布局下覆盖菜单启动器配置。
   */
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
    /* 应用配置 */
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

    /* 主题配置 */
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

    /* 水印配置 */
    watermark: app?.watermark
      ? {
          enable: app.watermark,
          content: app.watermarkContent,
          angle: app.watermarkAngle,
          appendDate: app.watermarkAppendDate,
          fontSize: app.watermarkFontSize,
        }
      : undefined,

    /* 锁屏配置 */
    lockScreen: lockScreen
      ? {
          isLocked: lockScreen.isLocked,
          password: lockScreen.password,
          backgroundImage: lockScreen.backgroundImage,
          autoLockTime: lockScreen.autoLockTime,
        }
      : undefined,

    /* 检查更新配置 */
    checkUpdates: app?.enableCheckUpdates
      ? {
          enable: app.enableCheckUpdates,
          interval: app.checkUpdatesInterval,
        }
      : undefined,

    /* 各区域配置（创建浅拷贝确保响应式更新） */
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
            /* 让“显示折叠按钮”同时控制顶部侧边栏切换按钮 */
            ...(resolvedSidebar ? { sidebarToggle: resolvedSidebar.collapsedButton } : {}),
          }
        : undefined,
  };
}
