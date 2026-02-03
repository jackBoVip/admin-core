/**
 * 侧边栏组件
 * @description 参考 vben admin 实现的混合侧边栏逻辑
 * 
 * 状态说明：
 * - extraVisible: 子菜单面板是否可见（由是否有子菜单决定）
 * - expandOnHover: 是否固定模式（true=固定，false=悬停显示）
 * - extraCollapsed: 子菜单面板是否折叠（折叠后只显示图标列）
 */

import { useState, useCallback, useMemo, memo, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useSidebarState, useMenuState } from '../../hooks/use-layout-state';
import { SidebarMenu } from './SidebarMenu';
import { MixedSidebarMenu, MixedSidebarSubMenu } from './MixedSidebarMenu';
import { 
  DEFAULT_SIDEBAR_CONFIG, 
  LAYOUT_ICONS, 
  ANIMATION_CLASSES, 
  getIconPath, 
  getIconViewBox,
  type MenuItem,
} from '@admin-core/layout';

export interface LayoutSidebarProps {
  logo?: ReactNode;
  menu?: ReactNode;
  mixedMenu?: ReactNode;
  extra?: ReactNode;
  footer?: ReactNode;
}

export const LayoutSidebar = memo(function LayoutSidebar({
  logo,
  menu,
  mixedMenu,
  extra,
  footer,
}: LayoutSidebarProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const {
    collapsed,
    expandOnHovering,
    extraVisible,
    extraCollapsed,
    expandOnHover,
    setExtraCollapsed,
    setExpandOnHover,
    width,
    handleMouseEnter,
    handleMouseLeave,
    toggle,
  } = useSidebarState();
  const { activeKey, handleSelect } = useMenuState();

  const sidebarConfig = context.props.sidebar || {};
  const logoConfig = context.props.logo || {};
  // 使用 computed 中计算的主题（考虑 semiDarkSidebar）
  const theme = computed.sidebarTheme || 'light';

  // 是否是混合模式（sidebar-mixed-nav 或 header-mixed-nav）
  const isMixedMode = computed.isSidebarMixedNav || computed.isHeaderMixedNav;

  // 是否允许显示折叠按钮的布局（仅 sidebar-nav 和 header-mixed-nav）
  const isCollapseButtonAllowedLayout = 
    computed.currentLayout === 'sidebar-nav' || computed.currentLayout === 'header-mixed-nav';

  // 当前选中的一级菜单（用于混合模式）
  const [selectedRootMenu, setSelectedRootMenu] = useState<MenuItem | null>(null);

  // 处理根菜单变化
  const handleRootMenuChange = useCallback((menu: MenuItem | null) => {
    setSelectedRootMenu(menu);
  }, []);

  // 子菜单数据
  const subMenus = selectedRootMenu?.children || [];
  const subMenuTitle = selectedRootMenu?.name || '';
  
  // 是否显示子菜单面板（固定模式下始终显示，折叠时显示图标）
  const showExtraContent = useMemo(() => {
    if (!subMenus.length) return false;
    // 固定模式下始终显示（折叠时显示图标列，展开时显示完整菜单）
    if (expandOnHover) return extraVisible;
    // 非固定模式下，只有悬停时才显示
    return extraVisible && !extraCollapsed;
  }, [subMenus.length, expandOnHover, extraVisible, extraCollapsed]);
  
  // 处理子菜单面板折叠/展开切换（vben 风格：点击同一个按钮切换）
  const handleExtraCollapseToggle = useCallback(() => {
    setExtraCollapsed(!extraCollapsed);
  }, [extraCollapsed, setExtraCollapsed]);
  
  // 处理固定/取消固定
  const handleTogglePin = useCallback(() => {
    setExpandOnHover(!expandOnHover);
  }, [expandOnHover, setExpandOnHover]);

  // 类名
  const sidebarClassName = useMemo(() => {
    const classes = ['layout-sidebar', `layout-sidebar--${theme}`];
    if (collapsed && !expandOnHovering) classes.push('layout-sidebar--collapsed');
    if (expandOnHovering) classes.push('layout-sidebar--expand-on-hover');
    if (isMixedMode) classes.push('layout-sidebar--mixed');
    if (sidebarConfig.hidden) classes.push('layout-sidebar--hidden');
    if (context.props.isMobile && !collapsed) classes.push('layout-sidebar--mobile-visible');
    return classes.join(' ');
  }, [
    theme,
    collapsed,
    expandOnHovering,
    isMixedMode,
    sidebarConfig.hidden,
    context.props.isMobile,
  ]);

  // 混合模式下的图标列宽度
  const mixedWidth = sidebarConfig.mixedWidth || DEFAULT_SIDEBAR_CONFIG.mixedWidth;
  
  // 子菜单面板折叠宽度
  const extraCollapsedWidth = sidebarConfig.extraCollapsedWidth || DEFAULT_SIDEBAR_CONFIG.extraCollapsedWidth;

  // 子菜单面板宽度（vben: sidebarExtraWidth）
  const extraWidthNum = useMemo(() => {
    if (!showExtraContent) return 0;
    return extraCollapsed ? extraCollapsedWidth : (sidebarConfig.width || DEFAULT_SIDEBAR_CONFIG.width);
  }, [showExtraContent, extraCollapsed, extraCollapsedWidth, sidebarConfig.width]);
  
  // 扩展区域类名
  const extraClassName = useMemo(() => {
    const classes = ['layout-sidebar__extra'];
    if (showExtraContent) classes.push('layout-sidebar__extra--visible');
    return classes.join(' ');
  }, [showExtraContent]);
  
  // 扩展区域宽度
  const extraWidth = showExtraContent ? `${extraWidthNum}px` : '0px';
  
  // 侧边栏宽度（混合模式下只是图标列宽度）
  const sidebarTotalWidth = isMixedMode ? mixedWidth : width;

  // 是否显示折叠按钮 - 仅在 sidebar-nav 和 header-mixed-nav 布局下显示
  const showCollapseButton =
    isCollapseButtonAllowedLayout &&
    sidebarConfig.collapsedButton !== false &&
    context.props.disabled?.sidebarCollapseButton !== true;

  // 折叠图标配置（根据状态显示不同图标）
  const collapseIconName = useMemo(() => 
    collapsed 
      ? (LAYOUT_ICONS.sidebarCollapse.iconCollapsed || LAYOUT_ICONS.sidebarCollapse.icon) 
      : LAYOUT_ICONS.sidebarCollapse.icon
  , [collapsed]);

  const collapseIconProps = useMemo(() => ({
    className: `${LAYOUT_ICONS.sidebarCollapse.className} ${ANIMATION_CLASSES.iconRotate}`,
    viewBox: getIconViewBox(collapseIconName),
    path: getIconPath(collapseIconName),
  }), [collapseIconName]);

  // 子菜单面板样式（vben 风格：fixed 定位在主菜单右侧）
  const extraStyle = useMemo(() => ({
    left: `${mixedWidth}px`,
    width: extraWidth,
  }), [mixedWidth, extraWidth]);

  return (
    <aside
      className={sidebarClassName}
      style={{ width: `${sidebarTotalWidth}px` }}
      data-theme={theme}
      data-collapsed={collapsed && !expandOnHovering ? 'true' : undefined}
      data-hidden={sidebarConfig.hidden ? 'true' : undefined}
      data-mixed={isMixedMode ? 'true' : undefined}
      data-expand-on-hover={expandOnHovering ? 'true' : undefined}
      data-mobile-visible={context.props.isMobile && !collapsed ? 'true' : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="layout-sidebar__inner flex h-full flex-col">
        {/* Logo 区域（混合模式下由 MixedSidebarMenu 显示） */}
        {logoConfig.enable !== false && !isMixedMode && (
          <div className="layout-sidebar__logo shrink-0">
            {logo || (
              <div className="flex h-header items-center justify-center px-3">
                {logoConfig.source && (
                  <img
                    src={
                      theme === 'dark' && logoConfig.sourceDark
                        ? logoConfig.sourceDark
                        : logoConfig.source
                    }
                    alt={context.props.appName || 'Logo'}
                    className="h-8 w-auto object-contain"
                    style={{ objectFit: logoConfig.fit || 'contain' }}
                  />
                )}
                {(!collapsed || sidebarConfig.collapsedShowTitle) && (
                  <span className="ml-2 truncate text-lg font-semibold transition-opacity sidebar-collapsed:opacity-80">
                    {context.props.appName || ''}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* 菜单区域 */}
        <div className="layout-sidebar__menu flex-1 overflow-hidden">
          <div className="layout-scroll-container h-full overflow-y-auto overflow-x-hidden scrollbar-elegant">
            {isMixedMode ? (
              menu || <MixedSidebarMenu onRootMenuChange={handleRootMenuChange} />
            ) : (
              menu || <SidebarMenu />
            )}
          </div>
        </div>

        {/* 额外内容插槽 */}
        {extra && <div className="layout-sidebar__extra-slot shrink-0">{extra}</div>}

        {/* 底部区域 */}
        <div className="layout-sidebar__footer shrink-0 border-t border-border/10">
          {footer || (
            showCollapseButton && (
              <button
                type="button"
                className="flex w-full items-center justify-center py-3 transition-colors sidebar-dark:hover:bg-white/5 sidebar-light:hover:bg-black/5"
                title={
                  collapsed
                    ? context.t('layout.sidebar.expand')
                    : context.t('layout.sidebar.collapse')
                }
                onClick={toggle}
              >
                <svg
                  className={collapseIconProps.className}
                  viewBox={collapseIconProps.viewBox}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d={collapseIconProps.path} />
                </svg>
              </button>
            )
          )}
        </div>
      </div>

      {/* 混合菜单扩展区域（子菜单面板）- vben 风格：fixed 定位 */}
      {isMixedMode && (
        <div
          className={extraClassName}
          style={extraStyle}
          data-visible={showExtraContent ? 'true' : undefined}
        >
          {showExtraContent && (mixedMenu || (
            <MixedSidebarSubMenu
              menus={subMenus}
              activeKey={activeKey}
              title={subMenuTitle}
              collapsed={extraCollapsed}
              pinned={expandOnHover}
              showCollapseBtn={expandOnHover}
              showPinBtn={!extraCollapsed}
              onSelect={handleSelect}
              onCollapse={handleExtraCollapseToggle}
              onTogglePin={handleTogglePin}
            />
          ))}
        </div>
      )}
    </aside>
  );
});
