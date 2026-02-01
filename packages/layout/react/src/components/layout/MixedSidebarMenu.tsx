/**
 * 混合侧边栏菜单组件（双列菜单）
 * @description 左侧显示一级菜单图标，右侧显示选中菜单的子菜单
 * @features
 * - 记住每个一级菜单最后激活的子菜单
 * - 支持悬停展开子菜单
 * - 点击无子菜单项直接导航
 */

import { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { useMenuState, useSidebarState } from '../../hooks/use-layout-state';
import type { MenuItem } from '@admin-core/layout';
import {
  isMenuActive,
  hasActiveChild as checkHasActiveChild,
  getIconDefinition,
  getIconRenderType,
  findMenuByPath,
} from '@admin-core/layout';

interface MixedSidebarMenuProps {
  onRootMenuChange?: (menu: MenuItem | null) => void;
}

/**
 * 混合侧边栏主菜单组件
 */
export function MixedSidebarMenu({ onRootMenuChange }: MixedSidebarMenuProps) {
  const context = useLayoutContext();
  const { setExtraVisible, layoutComputed } = useSidebarState();
  const { activeKey, handleSelect } = useMenuState();
  
  // Logo 配置
  const logoConfig = useMemo(() => context.props.logo || {}, [context.props.logo]);
  // 主题（考虑 semiDarkSidebar）
  const theme = useMemo(() => layoutComputed?.sidebarTheme || 'light', [layoutComputed?.sidebarTheme]);

  // 菜单数据
  const menus = useMemo<MenuItem[]>(
    () => context.props.menus || [],
    [context.props.menus]
  );

  // 当前选中的一级菜单
  const [selectedRootMenu, setSelectedRootMenu] = useState<MenuItem | null>(null);

  // 记录每个一级菜单最后激活的子菜单路径（类似 vben 的 defaultSubMap）
  const lastActiveSubMenuMapRef = useRef<Map<string, string>>(new Map());

  // 同步 selectedRootMenu 变化到父组件
  useEffect(() => {
    onRootMenuChange?.(selectedRootMenu);
  }, [selectedRootMenu, onRootMenuChange]);

  // 根据当前路径自动选中一级菜单，并记录激活的子菜单
  useEffect(() => {
    if (!activeKey || !menus.length) return;

    // 查找当前激活菜单所属的一级菜单
    const currentMenu = findMenuByPath(menus, activeKey);
    if (currentMenu) {
      // 找到根菜单
      const rootMenu = menus.find((m) => {
        if (m.key === currentMenu.key || m.path === activeKey) return true;
        return checkHasActiveChild(m, activeKey);
      });
      if (rootMenu) {
        setSelectedRootMenu(rootMenu);
        setExtraVisible(!!(rootMenu.children && rootMenu.children.length > 0));
        // 记录该一级菜单最后激活的子菜单
        if (rootMenu.children?.length) {
          lastActiveSubMenuMapRef.current.set(rootMenu.key, activeKey);
        }
      }
    }
  }, [activeKey, menus, setExtraVisible]);

  // 处理一级菜单悬停
  const handleRootMenuEnter = useCallback(
    (item: MenuItem) => {
      setSelectedRootMenu(item);
      if (item.children?.length) {
        setExtraVisible(true);
      }
    },
    [setExtraVisible]
  );

  // 处理一级菜单点击
  const handleRootMenuClick = useCallback(
    (item: MenuItem) => {
      setSelectedRootMenu(item);

      if (item.children?.length) {
        setExtraVisible(true);
        // 自动激活子菜单：优先使用上次记录的，否则使用第一个
        const autoActivateChild = context.props.sidebar?.autoActivateChild ?? true;
        if (autoActivateChild) {
          const lastActivePath = lastActiveSubMenuMapRef.current.get(item.key);
          const firstChildPath = item.children[0]?.path || item.children[0]?.key;
          const targetPath = lastActivePath || firstChildPath;
          if (targetPath && targetPath !== activeKey) {
            handleSelect(targetPath);
          }
        }
      } else if (item.path) {
        handleSelect(item.key);
      }
    },
    [setExtraVisible, handleSelect, context.props.sidebar?.autoActivateChild, activeKey]
  );

  // 判断一级菜单是否选中
  const isRootActive = useCallback(
    (item: MenuItem) => {
      return (
        selectedRootMenu?.key === item.key ||
        isMenuActive(item, activeKey) ||
        checkHasActiveChild(item, activeKey)
      );
    },
    [selectedRootMenu, activeKey]
  );

  // 渲染图标
  const renderIcon = (icon: string | undefined, itemName: string) => {
    if (!icon) {
      return (
        <span className="mixed-sidebar-menu__icon">{itemName.charAt(0)}</span>
      );
    }

    const type = getIconRenderType(icon);

    if (type === 'svg') {
      const def = getIconDefinition(icon);
      if (def) {
        return (
          <span className="mixed-sidebar-menu__icon">
            <svg
              className="h-5 w-5"
              viewBox={def.viewBox}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={def.path} />
            </svg>
          </span>
        );
      }
    }

    return <span className="mixed-sidebar-menu__icon">{icon}</span>;
  };

  // 渲染 Logo
  const renderLogo = () => {
    if (logoConfig.enable === false) return null;
    
    const logoSrc = theme === 'dark' && logoConfig.sourceDark 
      ? logoConfig.sourceDark 
      : logoConfig.source;
    
    return (
      <div className="mixed-sidebar-menu__logo">
        <div className="flex h-header items-center justify-center">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={context.props.appName || 'Logo'}
              className="h-8 w-8 object-contain"
            />
          ) : context.props.appName ? (
            <span className="text-lg font-bold">
              {context.props.appName.charAt(0)}
            </span>
          ) : (
            <span className="text-lg">🏠</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="mixed-sidebar-menu">
      {/* Logo 区域 */}
      {renderLogo()}
      
      {/* 一级菜单 */}
      <nav className="mixed-sidebar-menu__root">
        {menus
          .filter((item) => !item.hidden)
          .map((item) => (
            <div
              key={item.key}
              className={`mixed-sidebar-menu__root-item ${
                isRootActive(item) ? 'mixed-sidebar-menu__root-item--active' : ''
              }`}
              title={item.name}
              onMouseEnter={() => handleRootMenuEnter(item)}
              onClick={() => handleRootMenuClick(item)}
            >
              {renderIcon(item.icon, item.name)}
              <span className="mixed-sidebar-menu__root-name">{item.name}</span>
            </div>
          ))}
      </nav>
    </div>
  );
}

/**
 * 混合侧边栏子菜单组件
 */
interface MixedSidebarSubMenuProps {
  menus: MenuItem[];
  activeKey: string;
  title?: string;
  collapsed?: boolean;
  pinned?: boolean;
  showCollapseBtn?: boolean;
  showPinBtn?: boolean;
  onSelect?: (key: string) => void;
  onCollapse?: () => void;
  onTogglePin?: () => void;
}

export const MixedSidebarSubMenu = memo(function MixedSidebarSubMenu({
  menus,
  activeKey,
  title,
  collapsed = false,
  pinned = true,
  showCollapseBtn = true,
  showPinBtn = true,
  onSelect,
  onCollapse,
  onTogglePin,
}: MixedSidebarSubMenuProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const isActive = useCallback(
    (item: MenuItem) => {
      return item.key === activeKey || item.path === activeKey;
    },
    [activeKey]
  );

  const hasActiveChild = useCallback(
    (item: MenuItem): boolean => {
      if (!item.children?.length) return false;
      return item.children.some(
        (child) => isActive(child) || hasActiveChild(child)
      );
    },
    [isActive]
  );

  const handleClick = useCallback(
    (item: MenuItem) => {
      if (item.children?.length) {
        toggleExpand(item.key);
      } else {
        onSelect?.(item.key);
      }
    },
    [toggleExpand, onSelect]
  );

  // 渲染图标
  const renderIcon = (icon: string | undefined) => {
    if (!icon) return null;

    const type = getIconRenderType(icon);

    if (type === 'svg') {
      const def = getIconDefinition(icon);
      if (def) {
        return (
          <span className="mixed-sidebar-submenu__icon">
            <svg
              className="h-4 w-4"
              viewBox={def.viewBox}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d={def.path} />
            </svg>
          </span>
        );
      }
    }

    return <span className="mixed-sidebar-submenu__icon">{icon}</span>;
  };

  // 递归渲染菜单项
  const renderMenuItem = (item: MenuItem, level: number): React.ReactNode => {
    if (item.hidden) return null;

    const active = isActive(item);
    const hasChildren = Boolean(item.children?.length);
    const expanded = expandedKeys.has(item.key);
    const hasActive = hasActiveChild(item);

    const itemClassName = [
      'mixed-sidebar-submenu__item',
      `mixed-sidebar-submenu__item--level-${level}`,
      active && 'mixed-sidebar-submenu__item--active',
      hasActive && 'mixed-sidebar-submenu__item--has-active-child',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div key={item.key} className="mixed-sidebar-submenu__group">
        <div className={itemClassName} onClick={() => handleClick(item)}>
          {renderIcon(item.icon)}
          {/* 名称（折叠时隐藏） */}
          {!collapsed && (
            <span className="mixed-sidebar-submenu__name">{item.name}</span>
          )}
          {/* 箭头（折叠时隐藏） */}
          {!collapsed && hasChildren && (
            <span
              className={`mixed-sidebar-submenu__arrow ${
                expanded ? 'mixed-sidebar-submenu__arrow--expanded' : ''
              }`}
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          )}
        </div>
        {/* 子菜单（折叠时不显示） */}
        {!collapsed && hasChildren && expanded && (
          <div className="mixed-sidebar-submenu__children">
            {item.children!.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const containerClassName = [
    'mixed-sidebar-submenu',
    collapsed && 'mixed-sidebar-submenu--collapsed',
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClassName}>
      {/* 折叠按钮 - 左下角 */}
      {showCollapseBtn && (
        <button
          type="button"
          className="mixed-sidebar-submenu__collapse-btn"
          onClick={onCollapse}
          title={collapsed ? '展开' : '收起'}
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d={collapsed ? 'M13 7l5 5-5 5M6 7l5 5-5 5' : 'M11 17l-5-5 5-5m7 10l-5-5 5-5'} />
          </svg>
        </button>
      )}
      {/* 固定按钮 - 右下角 */}
      {showPinBtn && (
        <button
          type="button"
          className="mixed-sidebar-submenu__pin-btn"
          onClick={onTogglePin}
          title={pinned ? '取消固定' : '固定'}
        >
          <svg
            className="h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {pinned ? (
              <>
                <line x1="2" x2="22" y1="2" y2="22" />
                <line x1="12" x2="12" y1="17" y2="22" />
                <path d="M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12" />
                <path d="M15 9.34V6h1a2 2 0 0 0 0-4H7.89" />
              </>
            ) : (
              <>
                <line x1="12" x2="12" y1="17" y2="22" />
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
              </>
            )}
          </svg>
        </button>
      )}
      {/* 标题（折叠时隐藏） */}
      {!collapsed && title && <div className="mixed-sidebar-submenu__title">{title}</div>}
      {/* 菜单列表 */}
      <nav className="mixed-sidebar-submenu__nav">
        {menus.map((item) => renderMenuItem(item, 0))}
      </nav>
    </div>
  );
});
