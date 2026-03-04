/**
 * 顶栏组件。
 * @description 支持品牌区、水平菜单与多操作区组合展示，并可联动侧边栏折叠状态。
 */

import { LAYOUT_ICONS, ANIMATION_CLASSES } from '@admin-core/layout';
import { useMemo, memo, type ReactNode, type CSSProperties } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useHeaderState, useSidebarState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';
import { RefreshButton } from '../widgets';

/**
 * 顶栏组件插槽属性。
 */
export interface LayoutHeaderProps {
  /** 应用标识区域内容。 */
  logo?: ReactNode;
  /** 顶栏左侧扩展区域。 */
  left?: ReactNode;
  /** 顶栏中间扩展区域。 */
  center?: ReactNode;
  /** 顶部导航菜单区域。 */
  menu?: ReactNode;
  /** 顶栏右侧扩展区域。 */
  right?: ReactNode;
  /** 右侧操作按钮区域。 */
  actions?: ReactNode;
  /** 额外区域（通常用于状态提示）。 */
  extra?: ReactNode;
}

/**
 * 布局头部组件。
 * @description 渲染品牌区、菜单区与操作区，并根据布局模式控制可见性。
 */
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
  const theme = computed.headerTheme || 'light';
  const menuAlign = headerConfig.menuAlign || 'start';

  /**
   * 是否在顶栏显示 Logo。
   */
  const showLogoInHeader =
    computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav;

  const isHeaderSidebarNav = computed.currentLayout === 'header-sidebar-nav';
  const isHeaderFullWidth =
    computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav || isHeaderSidebarNav;

  /**
   * 是否显示顶部菜单（顶部导航模式）。
   */
  const showHeaderMenu =
    (computed.isHeaderNav || computed.isMixedNav || computed.isHeaderMixedNav) && !isHeaderSidebarNav;

  /**
   * 当前布局是否允许展示侧边栏折叠按钮。
   */
  const isCollapseButtonAllowedLayout =
    computed.currentLayout === 'sidebar-nav';

  /**
   * 是否展示侧边栏切换按钮（受布局与偏好配置共同控制）。
   */
  const showSidebarToggle =
    isCollapseButtonAllowedLayout &&
    computed.showSidebar && 
    context.props.widgets?.sidebarToggle !== false &&
    !computed.isSidebarMixedNav &&
    !computed.isHeaderMixedNav;

  /**
   * 是否显示左侧刷新按钮。
   */
  const showRefresh = context.props.widgets?.refresh !== false;

  /**
   * 顶栏侧边栏切换图标名称。
   */
  const headerToggleIconName = useMemo(
    () => (sidebarCollapsed ? 'sidebar-toggle-collapsed' : 'sidebar-toggle'),
    [sidebarCollapsed]
  );
  /**
   * 顶栏侧边栏切换图标样式类名。
   */
  const headerToggleIconClass = useMemo(
    () => `${LAYOUT_ICONS.headerSidebarToggle.className} ${ANIMATION_CLASSES.iconRotate}`,
    []
  );

  /**
   * 顶栏容器样式类名。
   */
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

  const isHeaderFixed = mode !== 'static';
  const sidebarOffset =
    computed.showSidebar && !context.props.isMobile && !isHeaderFullWidth ? computed.sidebarWidth : 0;

  /**
   * 顶栏容器内联样式。
   */
  const headerStyle = useMemo(() => {
    const style: CSSProperties = {
      height: `${height}px`,
    };

    if (isHeaderFixed) {
      style.position = 'fixed';
      style.left = sidebarOffset ? `${sidebarOffset}px` : '0';
    } else {
      style.position = 'static';
      if (sidebarOffset) {
        style.marginLeft = `${sidebarOffset}px`;
        style.width = `calc(100% - ${sidebarOffset}px)`;
      }
    }

    return style;
  }, [height, isHeaderFixed, sidebarOffset]);

  /**
   * 顶栏菜单容器类名。
   */
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

        {/* 左侧按钮组（统一间距） */}
        <div className="layout-header__left-actions flex items-center gap-1 shrink-0">
          {/* 侧边栏切换按钮 */}
          {showSidebarToggle && (
            <button
              type="button"
              className="header-widget-btn"
              onClick={toggleSidebar}
            >
              {renderLayoutIcon(headerToggleIconName, 'md', headerToggleIconClass)}
            </button>
          )}

          {/* 左侧刷新按钮（与常见 admin 布局保持一致位置） */}
          {showRefresh && <RefreshButton />}
        </div>

        {/* 左侧插槽 */}
        {left && <div className="layout-header__left shrink-0 ml-3">{left}</div>}

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
