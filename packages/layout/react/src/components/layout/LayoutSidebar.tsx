/**
 * 侧边栏组件。
 * @description 参考常见 Admin 布局实现混合侧边栏逻辑，支持固定/悬停展开与子菜单扩展面板。
 *
 * 状态说明：
 * - extraVisible: 子菜单面板是否可见（由是否有子菜单决定）
 * - expandOnHover: 是否悬停展开（true=悬停显示，false=固定）
 * - extraCollapsed: 子菜单面板是否折叠（折叠后只显示图标列）
 */

import {
  DEFAULT_SIDEBAR_CONFIG,
  LAYOUT_ICONS,
  ANIMATION_CLASSES,
  LAYOUT_STYLE_CONSTANTS,
  type MenuItem,
} from '@admin-core/layout';
import { getPreferencesManager } from '@admin-core/preferences-react';
import { useState, useCallback, useMemo, memo, useEffect, useRef, type ReactNode } from 'react';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useSidebarState, useMenuState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';
import { MixedSidebarMenu, MixedSidebarSubMenu } from './MixedSidebarMenu';
import { SidebarMenu } from './SidebarMenu';

/**
 * 侧边栏组件插槽属性。
 */
export interface LayoutSidebarProps {
  /** 应用标识区域内容。 */
  logo?: ReactNode;
  /** 普通侧边菜单区域内容。 */
  menu?: ReactNode;
  /** 混合模式子菜单区域内容。 */
  mixedMenu?: ReactNode;
  /** 额外插槽区域。 */
  extra?: ReactNode;
  /** 底部区域内容。 */
  footer?: ReactNode;
}

/**
 * 侧边栏组件。
 * @description 渲染 Logo、菜单与折叠控制，并处理混合导航下的菜单切换。
 */
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
    setExtraVisible,
    setExtraCollapsed,
    setExpandOnHover,
    width,
    handleMouseEnter,
    handleMouseLeave,
    toggle,
  } = useSidebarState();
  const { activeKey, handleSelect } = useMenuState();

  const sidebarConfig = context.props.sidebar || {};
  const menus = useMemo(() => context.props.menus ?? [], [context.props.menus]);
  const logoConfig = context.props.logo || {};
  /**
   * 当前侧边栏主题（已包含 semi-dark 计算结果）。
   */
  const theme = computed.sidebarTheme || 'light';
  const preferencesManagerRef = useRef<ReturnType<typeof getPreferencesManager> | null>(null);

  useEffect(() => {
    try {
      preferencesManagerRef.current = getPreferencesManager();
    } catch {
      preferencesManagerRef.current = null;
    }
  }, []);

  /**
   * 是否处于混合导航模式（`sidebar-mixed-nav` 或 `header-mixed-nav`）。
   */
  const isMixedMode = computed.isSidebarMixedNav || computed.isHeaderMixedNav;

  /**
   * 当前布局是否允许展示侧边栏折叠按钮。
   */
  const isCollapseButtonAllowedLayout = 
    computed.currentLayout === 'sidebar-nav';

  /**
   * 当前选中的一级根菜单（混合模式使用）。
   */
  const [selectedRootMenu, setSelectedRootMenu] = useState<MenuItem | null>(null);
  const lastActiveKeyRef = useRef('');

  /**
   * 规范化菜单键值，统一转换为空字符串或字符串值。
   *
   * @param value 原始键值。
   * @returns 规范化后的键值。
   */
  const normalizeKey = useCallback((value: unknown) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  }, []);

  /**
   * 判断菜单项是否与目标键匹配（key/path）。
   *
   * @param menu 菜单项。
   * @param key 目标键值。
   * @returns 是否匹配。
   */
  const menuMatchesKey = useCallback((menu: MenuItem, key: string) => {
    const target = normalizeKey(key);
    if (!target) return false;
    const menuKey = normalizeKey(menu.key ?? '');
    const menuPath = normalizeKey(menu.path ?? '');
    return (menuKey && menuKey === target) || (menuPath && menuPath === target);
  }, [normalizeKey]);

  /**
   * 判断菜单树是否包含目标键。
   *
   * @param menu 根菜单项。
   * @param key 目标键值。
   * @returns 是否包含。
   */
  const menuContainsKey = useCallback((menu: MenuItem, key: string) => {
    if (menuMatchesKey(menu, key)) return true;
    if (!menu.children?.length) return false;
    const stack = [...menu.children];
    while (stack.length > 0) {
      const item = stack.pop();
      if (!item) continue;
      if (menuMatchesKey(item, key)) return true;
      if (item.children?.length) {
        for (let i = item.children.length - 1; i >= 0; i -= 1) {
          stack.push(item.children[i]);
        }
      }
    }
    return false;
  }, [menuMatchesKey]);

  /**
   * 根据目标键在一级菜单中查找所属根菜单。
   *
   * @param key 目标菜单键。
   * @returns 命中的根菜单，未命中返回 `null`。
   */
  const findRootMenuByKey = useCallback((key: string) => {
    if (!key) return null;
    for (const item of menus) {
      if (item.hidden) continue;
      if (menuContainsKey(item, key)) return item;
    }
    return null;
  }, [menus, menuContainsKey]);

  /**
   * 处理混合模式根菜单切换。
   *
   * @param menu 新的根菜单项。
   */
  const handleRootMenuChange = useCallback((menu: MenuItem | null) => {
    setSelectedRootMenu(menu);
  }, []);

  useEffect(() => {
    if (!isMixedMode || !activeKey || menus.length === 0) return;
    const shouldSync = !selectedRootMenu || lastActiveKeyRef.current !== activeKey;
    if (!shouldSync) return;
    lastActiveKeyRef.current = activeKey;
    const root = findRootMenuByKey(activeKey);
    if (!root) return;
    setSelectedRootMenu((prev) => {
      const prevId = prev ? normalizeKey(prev.key ?? prev.path ?? '') : '';
      const nextId = normalizeKey(root.key ?? root.path ?? '');
      if (prevId && nextId && prevId === nextId) return prev;
      return root;
    });
    const hasChildren = !!root.children?.length;
    if (extraVisible !== hasChildren) {
      setExtraVisible(hasChildren);
    }
  }, [
    activeKey,
    menus.length,
    isMixedMode,
    selectedRootMenu,
    extraVisible,
    findRootMenuByKey,
    setExtraVisible,
    normalizeKey,
  ]);

  /**
   * 当前根菜单下的子菜单数据与标题。
   */
  const subMenus = selectedRootMenu?.children || [];
  const subMenuTitle = selectedRootMenu?.name || '';
  
  /**
   * 是否显示子菜单扩展面板。
   * @description 固定模式下始终显示；折叠时仍可保留图标面板。
   */
  const showExtraContent = useMemo(() => {
    if (!subMenus.length) return false;
    return extraVisible;
  }, [subMenus.length, extraVisible]);

  const effectiveExtraCollapsed = useMemo(
    () => (expandOnHover ? false : extraCollapsed),
    [expandOnHover, extraCollapsed]
  );
  
  /**
   * 切换子菜单扩展面板折叠状态。
   */
  const handleExtraCollapseToggle = useCallback(() => {
    setExtraCollapsed(!extraCollapsed);
  }, [extraCollapsed, setExtraCollapsed]);
  
  /**
   * 切换子菜单面板“悬停展开/固定显示”模式，并同步到偏好设置。
   */
  const handleTogglePin = useCallback(() => {
    const nextHoverMode = !expandOnHover;
    setExpandOnHover(nextHoverMode);
    /** 切换到固定模式时，若存在子菜单则确保扩展面板可见。 */
    if (!nextHoverMode && subMenus.length) {
      setExtraVisible(true);
    }
    /** 悬停/固定模式切换时重置扩展面板折叠状态。 */
    setExtraCollapsed(false);
    /** 同步偏好设置，避免下一次渲染被旧值覆盖。 */
    preferencesManagerRef.current?.setPreferences({ sidebar: { expandOnHover: nextHoverMode } });
  }, [expandOnHover, setExpandOnHover, subMenus.length, setExtraVisible, setExtraCollapsed]);

  /**
   * 固定模式下保持子菜单面板可见，避免内容区与侧边栏重叠。
   */
  useEffect(() => {
    if (!isMixedMode || expandOnHover) return;
    const nextVisible = subMenus.length > 0;
    if (extraVisible !== nextVisible) {
      setExtraVisible(nextVisible);
    }
  }, [isMixedMode, expandOnHover, subMenus.length, extraVisible, setExtraVisible]);

  /**
   * 侧边栏容器样式类名集合。
   */
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

  /**
   * 混合模式下主侧栏（图标列）宽度。
   */
  const mixedWidth = sidebarConfig.mixedWidth || DEFAULT_SIDEBAR_CONFIG.mixedWidth;
  
  /**
   * 子菜单扩展面板折叠宽度。
   */
  const extraCollapsedWidth = sidebarConfig.extraCollapsedWidth || DEFAULT_SIDEBAR_CONFIG.extraCollapsedWidth;

  /**
   * 子菜单扩展面板宽度（类似常见 admin 布局的 `sidebarExtraWidth`）。
   */
  const extraWidthNum = useMemo(() => {
    if (!showExtraContent) return 0;
    return effectiveExtraCollapsed ? extraCollapsedWidth : (sidebarConfig.width || DEFAULT_SIDEBAR_CONFIG.width);
  }, [showExtraContent, effectiveExtraCollapsed, extraCollapsedWidth, sidebarConfig.width]);
  
  /**
   * 子菜单扩展区域样式类名集合。
   */
  const extraClassName = useMemo(() => {
    const classes = ['layout-sidebar__extra'];
    if (showExtraContent) classes.push('layout-sidebar__extra--visible');
    return classes.join(' ');
  }, [showExtraContent]);
  
  /**
   * 子菜单扩展区域宽度值。
   */
  const extraWidth = showExtraContent ? `${extraWidthNum}px` : LAYOUT_STYLE_CONSTANTS.ZERO_PX;
  
  /**
   * 侧边栏总宽度（混合模式下仅为图标列宽度）。
   */
  const sidebarTotalWidth = isMixedMode ? mixedWidth : width;

  const isHeaderSidebarNav = computed.currentLayout === 'header-sidebar-nav';
  const isMixedNavLayout = computed.currentLayout === 'mixed-nav';

  /**
   * 是否显示侧边栏折叠按钮。
   * @description 仅在 `sidebar-nav` / `header-mixed-nav` / `header-sidebar-nav` 布局下允许显示。
   */
  const showCollapseButton =
    (isCollapseButtonAllowedLayout || isHeaderSidebarNav || isMixedNavLayout) &&
    sidebarConfig.collapsedButton !== false &&
    context.props.disabled?.sidebarCollapseButton !== true;

  /**
   * 侧边栏折叠按钮图标名称。
   */
  const collapseIconName = useMemo(
    () => (collapsed ? 'sidebar-toggle-collapsed' : 'sidebar-toggle'),
    [collapsed]
  );
  /**
   * 侧边栏折叠按钮图标样式类名。
   */
  const collapseIconClass = useMemo(
    () => `${LAYOUT_ICONS.sidebarCollapse.className} ${ANIMATION_CLASSES.iconRotate}`,
    []
  );

  /**
   * 子菜单扩展面板样式。
   * @description 通过 fixed 方式定位于主菜单右侧。
   */
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
        {logoConfig.enable !== false && !isMixedMode && !isHeaderSidebarNav && !isMixedNavLayout && !computed.isHeaderMixedNav && (
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
                {renderLayoutIcon(collapseIconName, 'md', collapseIconClass)}
              </button>
            )
          )}
        </div>
      </div>

      {/* 混合菜单扩展区域（子菜单面板）- fixed 定位在主菜单右侧 */}
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
              collapsed={effectiveExtraCollapsed}
              pinned={!expandOnHover}
              showCollapseBtn={!expandOnHover}
              showPinBtn={!effectiveExtraCollapsed}
              theme={theme}
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
