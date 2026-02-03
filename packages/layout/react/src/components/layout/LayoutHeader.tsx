/**
 * 顶栏组件
 * @description 支持水平菜单显示
 */

import { useMemo, memo, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useHeaderState, useSidebarState } from '../../hooks/use-layout-state';
import { LAYOUT_ICONS, ANIMATION_CLASSES, getIconPath, getIconViewBox } from '@admin-core/layout';

export interface LayoutHeaderProps {
  logo?: ReactNode;
  left?: ReactNode;
  center?: ReactNode;
  menu?: ReactNode;
  right?: ReactNode;
  actions?: ReactNode;
  extra?: ReactNode;
}

export const LayoutHeader = memo(function LayoutHeader({
  logo,
  left,
  center,
  menu,
  right,
  actions,
  extra,
}: LayoutHeaderProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const { hidden, height, mode } = useHeaderState();
  const { collapsed: sidebarCollapsed, toggle: toggleSidebar } = useSidebarState();

  const headerConfig = context.props.header || {};
  const logoConfig = context.props.logo || {};
  const theme = context.props.headerTheme || 'light';
  const menuAlign = headerConfig.menuAlign || 'start';

  // 是否在顶栏显示 Logo
  const showLogoInHeader =
    computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav;

  // 是否显示顶部菜单（顶部导航模式）
  const showHeaderMenu =
    computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav;

  // 是否允许显示折叠按钮的布局（仅 sidebar-nav 和 header-mixed-nav）
  const isCollapseButtonAllowedLayout =
    computed.currentLayout === 'sidebar-nav' || computed.currentLayout === 'header-mixed-nav';

  // 是否显示侧边栏切换按钮（根据偏好设置开关控制）
  const showSidebarToggle =
    isCollapseButtonAllowedLayout &&
    computed.showSidebar && 
    context.props.widgets?.sidebarToggle !== false &&
    !computed.isSidebarMixedNav;

  // 折叠图标配置（根据状态显示不同图标）
  const headerToggleIconName = useMemo(() => 
    sidebarCollapsed 
      ? (LAYOUT_ICONS.headerSidebarToggle.iconCollapsed || LAYOUT_ICONS.headerSidebarToggle.icon) 
      : LAYOUT_ICONS.headerSidebarToggle.icon
  , [sidebarCollapsed]);

  const headerToggleIconProps = useMemo(() => ({
    className: `${LAYOUT_ICONS.headerSidebarToggle.className} ${ANIMATION_CLASSES.iconRotate}`,
    viewBox: getIconViewBox(headerToggleIconName),
    path: getIconPath(headerToggleIconName),
  }), [headerToggleIconName]);

  // 类名
  const headerClassName = useMemo(() => {
    const classes = ['layout-header', `layout-header--${theme}`, `layout-header--${mode}`];
    if (hidden) classes.push('layout-header--hidden');
    if (computed.showSidebar && !context.props.isMobile) {
      classes.push('layout-header--with-sidebar');
    }
    if (sidebarCollapsed && !context.props.isMobile) {
      classes.push('layout-header--collapsed');
    }
    return classes.join(' ');
  }, [theme, mode, hidden, computed.showSidebar, context.props.isMobile, sidebarCollapsed]);

  // 样式
  const headerStyle = useMemo(() => ({
    height: `${height}px`,
    left:
      computed.showSidebar && !context.props.isMobile
        ? `${computed.sidebarWidth}px`
        : '0',
  }), [height, computed.showSidebar, context.props.isMobile, computed.sidebarWidth]);

  // 菜单容器类名
  const menuContainerClassName = useMemo(
    () => 'layout-header__menu flex-1 min-w-0 flex items-center overflow-hidden',
    []
  );

  return (
    <header
      className={headerClassName}
      style={headerStyle}
      data-theme={theme}
      data-hidden={hidden ? 'true' : undefined}
      data-mode={mode}
      data-with-sidebar={computed.showSidebar && !context.props.isMobile ? 'true' : undefined}
      data-collapsed={sidebarCollapsed && !context.props.isMobile ? 'true' : undefined}
      data-header-nav={computed.isHeaderNav ? 'true' : undefined}
      data-mixed-nav={computed.isMixedNav ? 'true' : undefined}
      data-header-mixed-nav={computed.isHeaderMixedNav ? 'true' : undefined}
    >
      <div className="layout-header__inner flex h-full items-center px-4">
        {/* Logo（仅顶部导航模式） */}
        {showLogoInHeader && logoConfig.enable !== false && (
          <div className="layout-header__logo mr-4 shrink-0">
            {logo || (
              <div className="flex items-center">
                {logoConfig.source && (
                  <img
                    src={
                      theme === 'dark' && logoConfig.sourceDark
                        ? logoConfig.sourceDark
                        : logoConfig.source
                    }
                    alt={context.props.appName || 'Logo'}
                    className="h-8 w-auto"
                  />
                )}
                <span className="ml-2 text-lg font-semibold">
                  {context.props.appName || ''}
                </span>
              </div>
            )}
          </div>
        )}

        {/* 侧边栏切换按钮 */}
        {showSidebarToggle && (
          <button
            type="button"
            className="layout-header__toggle mr-2 flex h-9 w-9 items-center justify-center rounded-md transition-colors header-light:hover:bg-black/5 header-dark:hover:bg-white/10"
            title={context.t('layout.header.toggleSidebar')}
            onClick={toggleSidebar}
          >
            <svg
              className={headerToggleIconProps.className}
              viewBox={headerToggleIconProps.viewBox}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={headerToggleIconProps.path} />
            </svg>
          </button>
        )}

        {/* 左侧插槽 */}
        {left && <div className="layout-header__left shrink-0">{left}</div>}

        {/* 菜单区域（顶部导航模式） */}
        {showHeaderMenu ? (
          <div className={menuContainerClassName} data-align={menuAlign}>
            {menu}
          </div>
        ) : (
          /* 非顶部菜单模式下的占位符，将右侧内容推到右边 */
          <div className="flex-1" />
        )}

        {/* 中间插槽 */}
        {center && <div className="layout-header__center flex-1">{center}</div>}

        {/* 右侧插槽 */}
        {right && <div className="layout-header__right shrink-0">{right}</div>}

        {/* 操作区域 */}
        <div className="layout-header__actions flex shrink-0 items-center gap-1">
          {actions}
        </div>

        {/* 额外内容 */}
        {extra && <div className="layout-header__extra ml-2 shrink-0">{extra}</div>}
      </div>
    </header>
  );
});
