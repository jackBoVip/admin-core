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
import { renderIcon as renderIconByType } from '../../utils/icon-renderer';

interface MixedSidebarMenuProps {
  onRootMenuChange?: (menu: MenuItem | null) => void;
}

/**
 * 混合侧边栏主菜单组件
 */
export function MixedSidebarMenu({ onRootMenuChange }: MixedSidebarMenuProps) {
  const context = useLayoutContext();
  const { extraVisible, setExtraVisible, layoutComputed } = useSidebarState();
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
  const rootMenus = useMemo(() => {
    const result: MenuItem[] = [];
    for (const item of menus) {
      if (!item.hidden) result.push(item);
    }
    return result;
  }, [menus]);
  const rootNavRef = useRef<HTMLElement>(null);
  const [rootScrollTop, setRootScrollTop] = useState(0);
  const [rootViewportHeight, setRootViewportHeight] = useState(0);
  const [rootItemHeight, setRootItemHeight] = useState(72);
  const ROOT_OVERSCAN = 4;
  const rootResizeObserverRef = useRef<ResizeObserver | null>(null);
  const rootItemResizeObserverRef = useRef<ResizeObserver | null>(null);
  const rootTotalHeight = rootMenus.length * rootItemHeight;
  const rootStartIndex = Math.max(0, Math.floor(rootScrollTop / rootItemHeight) - ROOT_OVERSCAN);
  const rootEndIndex = Math.min(
    rootMenus.length,
    Math.ceil((rootScrollTop + rootViewportHeight) / rootItemHeight) + ROOT_OVERSCAN
  );
  const visibleRootMenus = useMemo(
    () => rootMenus.slice(rootStartIndex, rootEndIndex),
    [rootMenus, rootStartIndex, rootEndIndex]
  );

  useEffect(() => {
    const maxScrollTop = Math.max(0, rootTotalHeight - rootViewportHeight);
    if (rootScrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (rootNavRef.current) {
      rootNavRef.current.scrollTop = nextTop;
    }
    setRootScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [rootTotalHeight, rootViewportHeight, rootScrollTop]);

  // 当前选中的一级菜单
  const [selectedRootMenu, setSelectedRootMenu] = useState<MenuItem | null>(null);

  // 记录每个一级菜单最后激活的子菜单路径（类似 vben 的 defaultSubMap）
  const lastActiveSubMenuMapRef = useRef<Map<string, string>>(new Map());

  const parentPathMap = useMemo(() => {
    const map = new Map<string, string | null>();
    const visit = (items: MenuItem[], parent: string | null) => {
      for (const menu of items) {
        const keyPath = menu.key || '';
        const path = menu.path || '';
        const id = keyPath || path || '';
        if (keyPath) map.set(keyPath, parent);
        if (path && path !== keyPath) map.set(path, parent);
        if (menu.children?.length) {
          visit(menu.children, id || parent);
        }
      }
    };
    visit(menus, null);
    return map;
  }, [menus]);

  const activeParentSet = useMemo(() => {
    const parentSet = new Set<string>();
    if (!activeKey) return parentSet;
    let current = activeKey;
    const visited = new Set<string>();
    while (current && parentPathMap.has(current) && !visited.has(current)) {
      visited.add(current);
      const parent = parentPathMap.get(current);
      if (!parent) break;
      parentSet.add(parent);
      current = parent;
    }
    return parentSet;
  }, [activeKey, parentPathMap]);

  // 同步 selectedRootMenu 变化到父组件
  useEffect(() => {
    onRootMenuChange?.(selectedRootMenu);
  }, [selectedRootMenu, onRootMenuChange]);

  // 根据当前路径自动选中一级菜单，并记录激活的子菜单
  useEffect(() => {
    if (!activeKey || !menus.length) return;

    let rootMenu: MenuItem | undefined;
    for (const item of menus) {
      const menuId = item.key || item.path || '';
      const isActive = item.key === activeKey || item.path === activeKey;
      const hasActiveChild = menuId ? activeParentSet.has(menuId) : false;
      if (isActive || hasActiveChild) {
        rootMenu = item;
        break;
      }
    }
    if (rootMenu) {
      if (selectedRootMenu?.key !== rootMenu.key) {
        setSelectedRootMenu(rootMenu);
      }
      const nextExtraVisible = !!(rootMenu.children && rootMenu.children.length > 0);
      if (extraVisible !== nextExtraVisible) {
        setExtraVisible(nextExtraVisible);
      }
      // 记录该一级菜单最后激活的子菜单
      if (rootMenu.children?.length) {
        lastActiveSubMenuMapRef.current.set(rootMenu.key, activeKey);
      }
    }
  }, [activeKey, menus, activeParentSet, selectedRootMenu?.key, extraVisible, setExtraVisible]);

  const rootMenuMap = useMemo(() => {
    const map = new Map<string, MenuItem>();
    rootMenus.forEach((item) => map.set(item.key, item));
    return map;
  }, [rootMenus]);

  const handleRootMenuEnter = useCallback((item: MenuItem) => {
    setSelectedRootMenu((prev) => (prev?.key === item.key ? prev : item));
    if (item.children?.length && !extraVisible) {
      setExtraVisible(true);
    }
  }, [extraVisible, setExtraVisible]);

  const handleRootMenuClick = useCallback((item: MenuItem) => {
    setSelectedRootMenu((prev) => (prev?.key === item.key ? prev : item));

    if (item.children?.length) {
      if (!extraVisible) {
        setExtraVisible(true);
      }
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
  }, [setExtraVisible, handleSelect, context.props.sidebar?.autoActivateChild, activeKey]);

  const handleRootMenuMouseEnter = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const item = rootMenuMap.get(key);
    if (item) {
      handleRootMenuEnter(item);
    }
  }, [rootMenuMap, handleRootMenuEnter]);

  const handleRootMenuItemClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const item = rootMenuMap.get(key);
    if (item) {
      handleRootMenuClick(item);
    }
  }, [rootMenuMap, handleRootMenuClick]);

  useEffect(() => {
    const container = rootNavRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nextTop = container.scrollTop;
      setRootScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    };
    const updateHeight = () => {
      const nextHeight = container.clientHeight;
      setRootViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      const firstItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
      if (firstItem) {
        const height = firstItem.getBoundingClientRect().height;
        if (height > 0 && height !== rootItemHeight) {
          setRootItemHeight(height);
        }
      }
    };

    updateHeight();
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    const useWindowResize = typeof ResizeObserver === 'undefined';
    if (useWindowResize) {
      window.addEventListener('resize', updateHeight);
    } else {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(container);
      rootResizeObserverRef.current = observer;
    }
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (useWindowResize) {
        window.removeEventListener('resize', updateHeight);
      }
      if (rootResizeObserverRef.current) {
        rootResizeObserverRef.current.disconnect();
        rootResizeObserverRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;
    const container = rootNavRef.current;
    if (!container) return;
    let observedItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
    if (!observedItem) return;
    const observer = new ResizeObserver(() => {
      const currentItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
      if (!currentItem) return;
      if (currentItem !== observedItem) {
        if (observedItem) {
          observer.unobserve(observedItem);
        }
        observer.observe(currentItem);
        observedItem = currentItem;
      }
      const height = currentItem.getBoundingClientRect().height;
      if (height > 0 && height !== rootItemHeight) {
        setRootItemHeight(height);
      }
    });
    observer.observe(observedItem);
    rootItemResizeObserverRef.current = observer;
    return () => {
      if (rootItemResizeObserverRef.current) {
        rootItemResizeObserverRef.current.disconnect();
        rootItemResizeObserverRef.current = null;
      }
    };
  }, [rootMenus.length, rootItemHeight]);

  // 渲染图标
  const renderRootIcon = (icon: string | undefined, itemName: string) => {
    if (!icon) {
      return (
        <span className="mixed-sidebar-menu__icon">{itemName.charAt(0)}</span>
      );
    }

    return <span className="mixed-sidebar-menu__icon">{renderIconByType(icon, 'md')}</span>;
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
      <nav ref={rootNavRef} className="mixed-sidebar-menu__root" style={{ position: 'relative' }}>
        <div style={{ height: `${rootTotalHeight}px`, pointerEvents: 'none' }} />
        {visibleRootMenus.map((item, index) => {
          const actualIndex = rootStartIndex + index;
          const menuId = item.key || item.path || '';
          const isActive =
            selectedRootMenu?.key === item.key ||
            item.key === activeKey ||
            item.path === activeKey ||
            (menuId ? activeParentSet.has(menuId) : false);
          return (
            <div
              key={item.key}
              className={`mixed-sidebar-menu__root-item data-active:text-foreground data-disabled:opacity-50 ${
                isActive ? 'mixed-sidebar-menu__root-item--active' : ''
              }`}
              data-state={isActive ? 'active' : 'inactive'}
              data-disabled={item.disabled ? 'true' : undefined}
              data-key={item.key}
              title={item.name}
              onMouseEnter={handleRootMenuMouseEnter}
              onClick={handleRootMenuItemClick}
              style={{
                position: 'absolute',
                top: `${actualIndex * rootItemHeight}px`,
                left: 0,
                right: 0,
              }}
            >
              {renderRootIcon(item.icon, item.name)}
              <span className="mixed-sidebar-menu__root-name">{item.name}</span>
            </div>
          );
        })}
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
  const SUB_RENDER_CHUNK = 80;
  const [subRenderCount, setSubRenderCount] = useState(SUB_RENDER_CHUNK);
  const navRef = useRef<HTMLElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [subItemHeight, setSubItemHeight] = useState(40);
  const SUB_OVERSCAN = 4;
  const subResizeObserverRef = useRef<ResizeObserver | null>(null);
  const subItemResizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const nextCount = collapsed
      ? menus.length
      : Math.min(SUB_RENDER_CHUNK, menus.length);
    setSubRenderCount((prev) => (prev === nextCount ? prev : nextCount));
  }, [collapsed, menus.length]);

  useEffect(() => {
    if (collapsed || subRenderCount >= menus.length) return;
    const frame = requestAnimationFrame(() => {
      setSubRenderCount((prev) => Math.min(prev + SUB_RENDER_CHUNK, menus.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [collapsed, subRenderCount, menus.length]);

  const visibleMenus = useMemo(() => menus.slice(0, subRenderCount), [menus, subRenderCount]);
  const virtualTotalHeight = menus.length * subItemHeight;
  const virtualStartIndex = Math.max(0, Math.floor(scrollTop / subItemHeight) - SUB_OVERSCAN);
  const virtualEndIndex = Math.min(
    menus.length,
    Math.ceil((scrollTop + viewportHeight) / subItemHeight) + SUB_OVERSCAN
  );
  const virtualMenus = useMemo(
    () => menus.slice(virtualStartIndex, virtualEndIndex),
    [menus, virtualStartIndex, virtualEndIndex]
  );
  const renderMenus = collapsed ? virtualMenus : visibleMenus;
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const menuItemMap = useMemo(() => {
    const map = new Map<string, MenuItem>();
    const stack = [...menus].reverse();
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      map.set(current.key, current);
      if (current.children?.length) {
        for (let i = current.children.length - 1; i >= 0; i -= 1) {
          stack.push(current.children[i]);
        }
      }
    }
    return map;
  }, [menus]);

  const toggleExpand = useCallback((key: string) => {
    if (!menuItemMap.has(key)) return;
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      if (next.size === prev.size) {
        let same = true;
        for (const value of next) {
          if (!prev.has(value)) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return next;
    });
  }, [menuItemMap]);

  const parentPathMap = useMemo(() => {
    const map = new Map<string, string | null>();
    const visit = (items: MenuItem[], parent: string | null) => {
      for (const menu of items) {
        const keyPath = menu.key || '';
        const path = menu.path || '';
        const id = keyPath || path || '';
        if (keyPath) map.set(keyPath, parent);
        if (path && path !== keyPath) map.set(path, parent);
        if (menu.children?.length) {
          visit(menu.children, id || parent);
        }
      }
    };
    visit(menus, null);
    return map;
  }, [menus]);

  const activeParentSet = useMemo(() => {
    const parentSet = new Set<string>();
    if (!activeKey) return parentSet;
    let current = activeKey;
    const visited = new Set<string>();
    while (current && parentPathMap.has(current) && !visited.has(current)) {
      visited.add(current);
      const parent = parentPathMap.get(current);
      if (!parent) break;
      parentSet.add(parent);
      current = parent;
    }
    return parentSet;
  }, [activeKey, parentPathMap]);

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

  const handleItemClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const item = menuItemMap.get(key);
    if (item) {
      handleClick(item);
    }
  }, [menuItemMap, handleClick]);

  // 渲染图标
  const renderSubIcon = (icon: string | undefined) => {
    if (!icon) return null;
    return <span className="mixed-sidebar-submenu__icon">{renderIconByType(icon, 'sm')}</span>;
  };

  // 递归渲染菜单项
  const renderMenuItem = (
    item: MenuItem,
    level: number,
    style?: React.CSSProperties
  ): React.ReactNode => {
    if (item.hidden) return null;

    const menuId = item.key || item.path || '';
    const active = item.key === activeKey || item.path === activeKey;
    const hasChildren = Boolean(item.children?.length);
    const expanded = expandedKeys.has(item.key);
    const hasActive = menuId ? activeParentSet.has(menuId) : false;

    const itemClassName = (() => {
      const classes = [
        'mixed-sidebar-submenu__item',
        `mixed-sidebar-submenu__item--level-${level}`,
      ];
      if (active) classes.push('mixed-sidebar-submenu__item--active');
      if (hasActive) classes.push('mixed-sidebar-submenu__item--has-active-child');
      return classes.join(' ');
    })();

    return (
      <div key={item.key} className="mixed-sidebar-submenu__group" style={style}>
        <div
          className={`${itemClassName} data-active:text-primary data-disabled:opacity-50`}
          data-state={active ? 'active' : 'inactive'}
          data-disabled={item.disabled ? 'true' : undefined}
          data-has-active-child={hasActive ? 'true' : undefined}
          data-has-children={hasChildren ? 'true' : undefined}
          data-expanded={hasChildren && expanded ? 'true' : undefined}
          data-level={level}
          data-key={item.key}
          onClick={handleItemClick}
        >
          {renderSubIcon(item.icon)}
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
              data-expanded={expanded ? 'true' : undefined}
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

  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    const handleScroll = () => {
      const nextTop = container.scrollTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    };
    const updateHeight = () => {
      const nextHeight = container.clientHeight;
      setViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      const firstItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
      if (firstItem) {
        const height = firstItem.getBoundingClientRect().height;
        if (height > 0 && height !== subItemHeight) {
          setSubItemHeight(height);
        }
      }
    };

    updateHeight();
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    const useWindowResize = typeof ResizeObserver === 'undefined';
    if (useWindowResize) {
      window.addEventListener('resize', updateHeight);
    } else {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(container);
      subResizeObserverRef.current = observer;
    }
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (useWindowResize) {
        window.removeEventListener('resize', updateHeight);
      }
      if (subResizeObserverRef.current) {
        subResizeObserverRef.current.disconnect();
        subResizeObserverRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!collapsed || typeof ResizeObserver === 'undefined') return;
    const container = navRef.current;
    if (!container) return;
    let observedItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
    if (!observedItem) return;
    const observer = new ResizeObserver(() => {
      const currentItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
      if (!currentItem) return;
      if (currentItem !== observedItem) {
        if (observedItem) {
          observer.unobserve(observedItem);
        }
        observer.observe(currentItem);
        observedItem = currentItem;
      }
      const height = currentItem.getBoundingClientRect().height;
      if (height > 0 && height !== subItemHeight) {
        setSubItemHeight(height);
      }
    });
    observer.observe(observedItem);
    subItemResizeObserverRef.current = observer;
    return () => {
      if (subItemResizeObserverRef.current) {
        subItemResizeObserverRef.current.disconnect();
        subItemResizeObserverRef.current = null;
      }
    };
  }, [collapsed, menus.length, subItemHeight]);

  useEffect(() => {
    if (!collapsed) return;
    const container = navRef.current;
    if (container) {
      container.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [collapsed]);

  useEffect(() => {
    if (!collapsed) return;
    const maxScrollTop = Math.max(0, virtualTotalHeight - viewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (navRef.current) {
      navRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [collapsed, virtualTotalHeight, viewportHeight, scrollTop]);

  const containerClassName = (() => {
    const classes = ['mixed-sidebar-submenu'];
    if (collapsed) classes.push('mixed-sidebar-submenu--collapsed');
    return classes.join(' ');
  })();

  return (
    <div
      className={containerClassName}
      data-collapsed={collapsed ? 'true' : undefined}
    >
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
      <nav
        ref={navRef}
        className="mixed-sidebar-submenu__nav"
        style={collapsed ? { position: 'relative' } : undefined}
      >
        {collapsed && <div style={{ height: `${virtualTotalHeight}px`, pointerEvents: 'none' }} />}
        {renderMenus.map((item, index) => {
          const actualIndex = virtualStartIndex + index;
          const itemStyle = collapsed
            ? {
                position: 'absolute' as const,
                top: `${actualIndex * subItemHeight}px`,
                left: 0,
                right: 0,
              }
            : undefined;
          return renderMenuItem(item, 0, itemStyle);
        })}
      </nav>
    </div>
  );
});
