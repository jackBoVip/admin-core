/**
 * 侧边栏菜单组件
 * @description 自动渲染菜单数据，支持多级嵌套
 * 折叠状态下支持悬停弹出子菜单（类似常见 admin 布局）
 */

import { hasChildren, getMenuItemClassName, getMenuId, isMenuActive, LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';
import { useState, useCallback, useMemo, useRef, useEffect, memo, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext, useLayoutComputed, useLayoutState } from '../../hooks';
import { useMenuState, useSidebarState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';
import { renderIcon } from '../../utils/icon-renderer';

interface MenuItemProps {
  item: MenuItem;
  level: number;
  collapsed: boolean;
  expandOnHovering: boolean;
  expandedKeys: Set<string>;
  activeKey: string;
  activeParentSet: Set<string>;
  isActive: boolean;
  hasActiveChild: boolean;
  onToggleExpand: (key: string) => void;
  onSelect: (key: string) => void;
  onShowPopup: (item: MenuItem, event: React.MouseEvent) => void;
  onHidePopup: () => void;
  style?: React.CSSProperties;
}

/**
 * 递归菜单项组件
 */
const MenuItemComponent = memo(function MenuItemComponent({
  item,
  level,
  collapsed,
  expandOnHovering,
  expandedKeys,
  activeKey,
  activeParentSet,
  isActive,
  hasActiveChild,
  onToggleExpand,
  onSelect,
  onShowPopup,
  onHidePopup,
  style,
}: MenuItemProps) {
  const menuId = getMenuId(item);
  const isExpanded = expandedKeys.has(menuId);
  const hasChildrenItems = hasChildren(item);
  
  const showName = !collapsed || expandOnHovering;
  const visibleChildren = useMemo(() => {
    const result: MenuItem[] = [];
    const children = item.children;
    if (!children?.length) return result;
    for (const child of children) {
      if (!child.hidden) result.push(child);
    }
    return result;
  }, [item.children]);

  const handleClick = useCallback(() => {
    if (hasChildrenItems) {
      if (collapsed && !expandOnHovering) {
        // 折叠状态下，点击有子菜单的项不做任何操作（由悬停处理）
        return;
      }
      onToggleExpand(menuId);
    } else {
      onSelect(menuId);
    }
  }, [hasChildrenItems, menuId, onToggleExpand, onSelect, collapsed, expandOnHovering]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (collapsed && !expandOnHovering && hasChildrenItems) {
      onShowPopup(item, e);
    }
  }, [collapsed, expandOnHovering, hasChildrenItems, item, onShowPopup]);

  const itemClassName = getMenuItemClassName(item, {
    level,
    isActive,
    isExpanded,
    hasActiveChild,
  });

  if (item.hidden) return null;

  return (
    <div className="sidebar-menu__group" style={style}>
      <div 
        className={`${itemClassName} data-active:text-primary data-disabled:opacity-50`}
        data-state={isActive ? 'active' : 'inactive'}
        data-disabled={item.disabled ? 'true' : undefined}
        data-has-active-child={hasActiveChild ? 'true' : undefined}
        data-has-children={hasChildrenItems ? 'true' : undefined}
        data-expanded={hasChildrenItems && isExpanded ? 'true' : undefined}
        data-level={level}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={onHidePopup}
      >
        {/* 图标 */}
        {item.icon && (
          <span className="sidebar-menu__icon">
            {renderIcon(item.icon, 'md')}
          </span>
        )}

        {/* 名称 */}
        {showName && <span className="sidebar-menu__name">{item.name}</span>}

        {/* 展开箭头（展开状态） */}
        {hasChildrenItems && showName && (
          <span
            className={`sidebar-menu__arrow ${
              isExpanded ? 'sidebar-menu__arrow--expanded' : ''
            }`}
            data-expanded={isExpanded ? 'true' : undefined}
          >
            {renderLayoutIcon('menu-arrow-right', 'sm')}
          </span>
        )}

        {/* 折叠状态下有子菜单时显示右侧小箭头 */}
        {hasChildrenItems && collapsed && !expandOnHovering && (
          <span className="sidebar-menu__arrow-right">
            {renderLayoutIcon('menu-arrow-right', 'xs')}
          </span>
        )}
      </div>

      {/* 子菜单 */}
        {hasChildrenItems && showName && isExpanded && (
        <div className="sidebar-menu__submenu">
            {visibleChildren.map((child) => (
              <MenuItemComponent
                key={getMenuId(child)}
                item={child}
                level={level + 1}
                collapsed={collapsed}
                expandOnHovering={expandOnHovering}
                expandedKeys={expandedKeys}
                activeKey={activeKey}
            activeParentSet={activeParentSet}
            isActive={isMenuActive(child, activeKey)}
            hasActiveChild={activeParentSet.has(getMenuId(child))}
                onToggleExpand={onToggleExpand}
                onSelect={onSelect}
                onShowPopup={onShowPopup}
                onHidePopup={onHidePopup}
              />
            ))}
        </div>
      )}
    </div>
  );
});

/**
 * 弹出菜单组件
 */
interface PopupMenuProps {
  item: MenuItem;
  top: number;
  left: number;
  activeKey: string;
  activeParentSet: Set<string>;
  theme: string;
  onSelect: (key: string) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const PopupMenu = memo(function PopupMenu({
  item,
  top,
  left,
  activeKey,
  activeParentSet,
  theme,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: PopupMenuProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const popupContentRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [contentTop, setContentTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const popupResizeObserverRef = useRef<ResizeObserver | null>(null);
  const popupStyle = useMemo(() => ({ top: `${top}px`, left: `${left}px` }), [top, left]);
  const itemId = useMemo(() => getMenuId(item), [item]);
  const buildExpandedKeys = useCallback(() => {
    const keys = new Set<string>();
    if (!item.children?.length) return keys;
    const stack = [...item.children].reverse();
    while (stack.length > 0) {
      const child = stack.pop();
      if (!child) continue;
      const childId = getMenuId(child);
    const isActive = isMenuActive(child, activeKey);
      if ((childId && activeParentSet.has(childId)) || isActive) {
        keys.add(childId);
        if (child.children?.length) {
          for (let i = child.children.length - 1; i >= 0; i -= 1) {
            stack.push(child.children[i]);
          }
        }
      }
    }
    return keys;
  }, [item.children, activeKey, activeParentSet]);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => buildExpandedKeys());

  useEffect(() => {
    const nextKeys = buildExpandedKeys();
    let isSame = nextKeys.size === expandedKeys.size;
    if (isSame) {
      for (const key of nextKeys) {
        if (!expandedKeys.has(key)) {
          isSame = false;
          break;
        }
      }
    }
    if (!isSame) {
      setExpandedKeys(nextKeys);
    }
  }, [buildExpandedKeys]);

  const menuItemMap = useMemo(() => {
    const map = new Map<string, MenuItem>();
    const stack = [...(item.children ?? [])].reverse();
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) continue;
      const id = getMenuId(current);
      if (id) {
        map.set(id, current);
      }
      if (current.children?.length) {
        for (let i = current.children.length - 1; i >= 0; i -= 1) {
          stack.push(current.children[i]);
        }
      }
    }
    return map;
  }, [item.children]);

  const handleItemHover = useCallback((menuItem: MenuItem) => {
    if (!hasChildren(menuItem)) return;
    const id = getMenuId(menuItem);
    if (!menuItemMap.has(id)) return;
    setExpandedKeys((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, [menuItemMap]);

  const toggleExpand = useCallback((key: string) => {
    if (!menuItemMap.has(key)) return;
    setExpandedKeys(prev => {
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

  const handleItemClick = useCallback((menuItem: MenuItem) => {
    if (hasChildren(menuItem)) {
      toggleExpand(getMenuId(menuItem));
    } else {
      onSelect(getMenuId(menuItem));
    }
  }, [toggleExpand, onSelect]);

  const handlePopupItemClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const menuItem = menuItemMap.get(key);
    if (menuItem) {
      handleItemClick(menuItem);
    }
  }, [menuItemMap, handleItemClick]);

  const popupChildren = item.children ?? [];
  const [popupItemHeight, setPopupItemHeight] = useState<number>(
    LAYOUT_UI_TOKENS.POPUP_MENU_ITEM_HEIGHT,
  );
  const POPUP_OVERSCAN = LAYOUT_UI_TOKENS.POPUP_OVERSCAN;
  const POPUP_VIRTUAL_MIN_ITEMS = LAYOUT_UI_TOKENS.POPUP_VIRTUAL_MIN_ITEMS;
  const shouldVirtualize = expandedKeys.size === 0 && popupChildren.length >= POPUP_VIRTUAL_MIN_ITEMS;
  const contentScrollTop = Math.max(0, scrollTop - contentTop);
  const totalHeight = popupChildren.length * popupItemHeight;
  const startIndex = Math.max(0, Math.floor(contentScrollTop / popupItemHeight) - POPUP_OVERSCAN);
  const endIndex = Math.min(
    popupChildren.length,
    Math.ceil((contentScrollTop + viewportHeight) / popupItemHeight) + POPUP_OVERSCAN
  );
  const visiblePopupChildren = useMemo(
    () => (shouldVirtualize ? popupChildren.slice(startIndex, endIndex) : popupChildren),
    [popupChildren, startIndex, endIndex, shouldVirtualize]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  useEffect(() => {
    const container = popupRef.current;
    const content = popupContentRef.current;
    if (!container || !content) return;

    const update = rafThrottle(() => {
      const offset = content.offsetTop;
      setContentTop(offset);
      setViewportHeight(Math.max(0, container.clientHeight - offset));
      const firstItem = container.querySelector('.sidebar-menu__popup-item') as HTMLElement | null;
      if (firstItem) {
        const height = firstItem.getBoundingClientRect().height;
        if (height > 0) {
          setPopupItemHeight((prev) => (prev === height ? prev : height));
        }
      }
    });
    update();
    const useWindowResize = typeof ResizeObserver === 'undefined';
    if (useWindowResize) {
      window.addEventListener('resize', update);
    } else {
      const observer = new ResizeObserver(update);
      observer.observe(container);
      popupResizeObserverRef.current = observer;
    }
    return () => {
      if (popupResizeObserverRef.current) {
        popupResizeObserverRef.current.disconnect();
        popupResizeObserverRef.current = null;
      }
      if (useWindowResize) {
        window.removeEventListener('resize', update);
      }
    };
  }, []);

  useEffect(() => {
    if (!shouldVirtualize) return;
    const container = popupRef.current;
    if (container) {
      container.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [shouldVirtualize, itemId]);

  useEffect(() => {
    if (!shouldVirtualize) return;
    if (!popupRef.current) return;
    const el = popupRef.current;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      el.scrollTop += e.deltaY;
    };
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [shouldVirtualize]);

  useEffect(() => {
    if (!shouldVirtualize) return;
    const maxScrollTop = Math.max(0, totalHeight - viewportHeight - contentTop);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (popupRef.current) {
      popupRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [shouldVirtualize, totalHeight, viewportHeight, contentTop, scrollTop]);

  const renderPopupItem = (
    menuItem: MenuItem,
    level: number,
    style?: React.CSSProperties
  ): React.ReactNode => {
    if (menuItem.hidden) return null;

    const isActive = isMenuActive(menuItem, activeKey);
    const menuId = getMenuId(menuItem);
    const hasActiveChild = menuId ? activeParentSet.has(menuId) : false;
    const isExpanded = expandedKeys.has(menuId);
    const hasChildrenItems = hasChildren(menuItem);

    const itemClass = (() => {
      const classes = ['sidebar-menu__popup-item'];
      if (isActive) classes.push('sidebar-menu__popup-item--active');
      if (hasActiveChild) classes.push('sidebar-menu__popup-item--has-active-child');
      if (level > 0) classes.push(`sidebar-menu__popup-item--level-${level}`);
      return classes.join(' ');
    })();

    return (
      <div key={menuId} className="sidebar-menu__popup-group" style={style}>
        <div
          className={`${itemClass} data-active:text-primary data-disabled:opacity-50`}
          data-state={isActive ? 'active' : 'inactive'}
          data-disabled={menuItem.disabled ? 'true' : undefined}
          data-has-active-child={hasActiveChild ? 'true' : undefined}
          data-has-children={hasChildrenItems ? 'true' : undefined}
          data-expanded={hasChildrenItems && isExpanded ? 'true' : undefined}
          data-level={level}
          data-key={menuId}
          onClick={handlePopupItemClick}
          onMouseEnter={() => handleItemHover(menuItem)}
        >
          {menuItem.icon && (
            <span className="sidebar-menu__popup-icon">
              {renderIcon(menuItem.icon, 'sm')}
            </span>
          )}
          <span className="sidebar-menu__popup-name">{menuItem.name}</span>
          {hasChildrenItems && (
            <span
              className={`sidebar-menu__popup-arrow ${isExpanded ? 'sidebar-menu__popup-arrow--expanded' : ''}`}
              data-expanded={isExpanded ? 'true' : undefined}
            >
              {renderLayoutIcon('menu-arrow-right', 'sm')}
            </span>
          )}
        </div>
        {hasChildrenItems && isExpanded && (
          <div className="sidebar-menu__popup-submenu">
            {menuItem.children?.map(child => renderPopupItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className={`sidebar-menu__popup sidebar-menu__popup--${theme}`}
      data-theme={theme}
      style={popupStyle}
      ref={popupRef}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onScroll={handleScroll}
    >
      <div className="sidebar-menu__popup-title">{item.name}</div>
      <div
        className="sidebar-menu__popup-content"
        ref={popupContentRef}
        style={
          shouldVirtualize
            ? { position: 'relative', height: `${Math.max(totalHeight, viewportHeight)}px` }
            : undefined
        }
      >
        {shouldVirtualize && <div style={{ height: `${totalHeight}px`, pointerEvents: 'none' }} />}
        {visiblePopupChildren.map((child, index) => {
          const actualIndex = startIndex + index;
          const itemStyle = shouldVirtualize
            ? {
                position: 'absolute' as const,
                top: `${actualIndex * popupItemHeight}px`,
                left: 0,
                right: 0,
              }
            : undefined;
          return renderPopupItem(child, 0, itemStyle);
        })}
      </div>
    </div>,
    document.body
  );
});

/**
 * 侧边栏菜单组件
 */
export function SidebarMenu() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const { collapsed, expandOnHovering } = useSidebarState();
  const { openKeys, activeKey, handleSelect, handleOpenChange } = useMenuState();
  const [layoutState, setLayoutState] = useLayoutState();
  
  // 侧边栏主题（用于弹出菜单）
  const sidebarTheme = computed.sidebarTheme || 'light';

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(openKeys)
  );

  // 使用 ref 来跟踪是否是由用户点击触发的 expandedKeys 变化
  // 避免在外部同步（如路由变化）时触发 handleOpenChange
  const pendingOpenChangeRef = useRef<string[] | null>(null);
  const isExpandedKeysInternalUpdateRef = useRef<boolean>(false);

  // 同步 openKeys 到 expandedKeys（外部同步，不触发 handleOpenChange）
  useEffect(() => {
    // 如果是内部更新触发的，不需要同步（避免循环）
    if (isExpandedKeysInternalUpdateRef.current) {
      isExpandedKeysInternalUpdateRef.current = false;
      return;
    }
    
    setExpandedKeys((prev) => {
      if (prev.size === openKeys.length) {
        let same = true;
        for (const key of openKeys) {
          if (!prev.has(key)) {
            same = false;
            break;
          }
        }
        if (same) return prev;
      }
      return new Set(openKeys);
    });
  }, [openKeys]);

  // 处理 pendingOpenChange，避免在渲染期间更新组件
  useEffect(() => {
    if (pendingOpenChangeRef.current !== null) {
      const keys = pendingOpenChangeRef.current;
      pendingOpenChangeRef.current = null;
      // 标记这是内部更新，避免触发同步循环
      isExpandedKeysInternalUpdateRef.current = true;
      startTransition(() => {
        handleOpenChange(keys);
      });
    }
  }, [expandedKeys, handleOpenChange]);

  // 弹出菜单状态
  const [popupState, setPopupState] = useState<{
    item: MenuItem | null;
    visible: boolean;
    top: number;
    left: number;
  }>({
    item: null,
    visible: false,
    top: 0,
    left: 0,
  });

  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const popupFrameRef = useRef<number | null>(null);
  const sidebarRectRef = useRef<DOMRect | null>(null);
  const sidebarRectFrameRef = useRef<number | null>(null);
  const menuRef = useRef<HTMLElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState<number>(0);
  const [viewportHeight, setViewportHeight] = useState<number>(0);
  const scrollResizeObserverRef = useRef<ResizeObserver | null>(null);
  const menuItemResizeObserverRef = useRef<ResizeObserver | null>(null);

  const allMenus = useMemo<MenuItem[]>(
    () => context.props.menus || [],
    [context.props.menus]
  );

  const isMixedNav = computed.isMixedNav;

  const normalizeKey = useCallback((value: unknown) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  }, []);

  const menuMatchesKey = useCallback((menu: MenuItem, key: string) => {
    const target = normalizeKey(key);
    if (!target) return false;
    const menuKey = normalizeKey(menu.key ?? '');
    const menuPath = normalizeKey(menu.path ?? '');
    const menuId = normalizeKey(getMenuId(menu));
    return (
      (menuKey && menuKey === target) ||
      (menuPath && menuPath === target) ||
      (menuId && menuId === target)
    );
  }, [normalizeKey]);

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

  const findRootMenuByKey = useCallback((key: string) => {
    if (!key) return null;
    for (const item of allMenus) {
      if (item.hidden) continue;
      if (menuContainsKey(item, key)) return item;
    }
    return null;
  }, [allMenus, menuContainsKey]);

  const fallbackRootMenu = useMemo(() => {
    if (!isMixedNav) return null;
    for (const item of allMenus) {
      if (!item.hidden) return item;
    }
    return null;
  }, [isMixedNav, allMenus]);

  // 使用独立的 state 存储 mixedNavRootKey，避免在渲染期间读取 layoutState
  // 这样可以避免 "Cannot update a component while rendering a different component" 错误
  const [localMixedNavRootKey, setLocalMixedNavRootKey] = useState<string | null>(() => {
    if (!isMixedNav) return null;
    // 初始化时从 layoutState 读取，但只在初始化时读取一次
    return layoutState.mixedNavRootKey || null;
  });

  // 标记是否是由内部更新触发的 layoutState 变化，避免循环同步
  const isInternalUpdateRef = useRef<boolean>(false);

  // 同步 layoutState.mixedNavRootKey 的变化到本地 state
  // 但忽略由内部更新触发的变化（避免循环）
  useEffect(() => {
    if (!isMixedNav) {
      if (!isInternalUpdateRef.current) {
        setLocalMixedNavRootKey(null);
      }
      return;
    }
    
    // 如果是内部更新触发的，不需要同步（因为我们已经更新了 localMixedNavRootKey）
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    
    // 使用函数式更新，只在值真正变化时更新
    setLocalMixedNavRootKey((prev) => {
      const next = layoutState.mixedNavRootKey || null;
      return prev === next ? prev : next;
    });
  }, [isMixedNav, layoutState.mixedNavRootKey]);

  // 基于 activeKey 和 localMixedNavRootKey 计算 rootMenu
  // 注意：这里不直接读取 layoutState.mixedNavRootKey，而是使用 localMixedNavRootKey
  const derivedRootMenu = useMemo(() => {
    if (!isMixedNav) return null;
    const candidateKey = localMixedNavRootKey || activeKey;
    if (!candidateKey) return null;
    return findRootMenuByKey(candidateKey);
  }, [isMixedNav, localMixedNavRootKey, activeKey, findRootMenuByKey]);

  const rootMenu = derivedRootMenu ?? fallbackRootMenu;

  // 使用 ref 存储上一次的 activeKey 和 rootKey，避免不必要的更新
  const prevActiveKeyRef = useRef<string | null>(null);
  const prevRootKeyRef = useRef<string | null>(null);

  // 基于 activeKey 的变化来更新 mixedNavRootKey，而不是依赖 rootMenu
  // 这样可以避免循环依赖，因为 rootMenu 依赖于 localMixedNavRootKey
  // 注意：这里只依赖 activeKey，不依赖 localMixedNavRootKey，避免循环
  useEffect(() => {
    if (!isMixedNav) {
      prevActiveKeyRef.current = null;
      prevRootKeyRef.current = null;
      return;
    }
    
    if (!activeKey) {
      prevActiveKeyRef.current = null;
      prevRootKeyRef.current = null;
      return;
    }
    
    // 如果 activeKey 没有改变，不需要更新
    if (prevActiveKeyRef.current === activeKey) return;
    
    // 更新 activeKey ref
    prevActiveKeyRef.current = activeKey;
    
    // 基于 activeKey 计算 rootMenu（不依赖 localMixedNavRootKey，避免循环）
    const computedRootMenu = findRootMenuByKey(activeKey) ?? fallbackRootMenu;
    if (!computedRootMenu) {
      prevRootKeyRef.current = null;
      return;
    }
    
    const rootKey = normalizeKey(computedRootMenu.key ?? computedRootMenu.path ?? '');
    if (!rootKey) {
      prevRootKeyRef.current = null;
      return;
    }
    
    // 如果 rootKey 没有改变，不需要更新
    if (prevRootKeyRef.current === rootKey) return;
    
    // 更新 ref
    prevRootKeyRef.current = rootKey;
    
    // 使用 requestAnimationFrame 确保在下一个渲染帧中更新，避免在渲染期间更新组件
    requestAnimationFrame(() => {
      // 标记这是内部更新，避免触发同步循环
      isInternalUpdateRef.current = true;
      
      // 先更新本地 state，避免在渲染期间读取 layoutState
      setLocalMixedNavRootKey(rootKey);
      
      // 使用函数式更新避免依赖 layoutState.mixedNavRootKey，防止循环更新
      setLayoutState((prev) => {
        // 如果值已经相同，不更新
        if (prev.mixedNavRootKey === rootKey) return prev;
        return { ...prev, mixedNavRootKey: rootKey };
      });
      
      // 在下一个 tick 重置标志，确保同步 useEffect 能正确处理
      // 使用 setTimeout 确保在 React 的状态更新和 useEffect 执行之后重置
      setTimeout(() => {
        isInternalUpdateRef.current = false;
      }, 0);
    });
  }, [isMixedNav, activeKey, findRootMenuByKey, fallbackRootMenu, normalizeKey, setLayoutState]);

  const menus = useMemo<MenuItem[]>(
    () => (isMixedNav ? rootMenu?.children ?? [] : allMenus),
    [isMixedNav, rootMenu, allMenus]
  );
  const visibleMenus = useMemo(() => {
    const result: MenuItem[] = [];
    for (const item of menus) {
      if (!item.hidden) result.push(item);
    }
    return result;
  }, [menus]);
  const RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
  const [renderCount, setRenderCount] = useState<number>(RENDER_CHUNK);
  const [menuItemHeight, setMenuItemHeight] = useState<number>(LAYOUT_UI_TOKENS.MENU_ITEM_HEIGHT);
  const MENU_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
  const shouldVirtualize = collapsed && !expandOnHovering;

  useEffect(() => {
    const nextCount = shouldVirtualize
      ? visibleMenus.length
      : Math.min(RENDER_CHUNK, visibleMenus.length);
    setRenderCount((prev) => (prev === nextCount ? prev : nextCount));
  }, [shouldVirtualize, visibleMenus.length]);

  useEffect(() => {
    if (shouldVirtualize || renderCount >= visibleMenus.length) return;
    const frame = requestAnimationFrame(() => {
      setRenderCount((prev) => Math.min(prev + RENDER_CHUNK, visibleMenus.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldVirtualize, renderCount, visibleMenus.length]);

  const slicedMenus = useMemo(
    () => visibleMenus.slice(0, renderCount),
    [visibleMenus, renderCount]
  );

  const virtualTotalHeight = visibleMenus.length * menuItemHeight;
  const virtualViewportHeight = viewportHeight || 0;
  const virtualStartIndex = Math.max(0, Math.floor(scrollTop / menuItemHeight) - MENU_OVERSCAN);
  const virtualEndIndex = Math.min(
    visibleMenus.length,
    Math.ceil((scrollTop + virtualViewportHeight) / menuItemHeight) + MENU_OVERSCAN
  );
  const virtualMenus = useMemo(
    () => visibleMenus.slice(virtualStartIndex, virtualEndIndex),
    [visibleMenus, virtualStartIndex, virtualEndIndex]
  );
  const renderMenus = shouldVirtualize ? virtualMenus : slicedMenus;
  const menuStyle = shouldVirtualize
    ? { position: 'relative' as const, height: `${Math.max(virtualTotalHeight, virtualViewportHeight)}px` }
    : undefined;

  useEffect(() => {
    if (!shouldVirtualize) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const updateItemHeight = () => {
      const firstItem = menuEl.querySelector('.sidebar-menu__item') as HTMLElement | null;
      if (!firstItem) return;
      const height = firstItem.getBoundingClientRect().height;
      if (height > 0 && height !== menuItemHeight) {
        setMenuItemHeight(height);
      }
    };
    const frame = requestAnimationFrame(updateItemHeight);
    if (typeof ResizeObserver !== 'undefined') {
      let observedItem = menuEl.querySelector('.sidebar-menu__item') as HTMLElement | null;
      if (observedItem) {
        const observer = new ResizeObserver(() => {
          const currentItem = menuEl.querySelector('.sidebar-menu__item') as HTMLElement | null;
          if (!currentItem) return;
          if (currentItem !== observedItem) {
            if (observedItem) {
              observer.unobserve(observedItem);
            }
            observer.observe(currentItem);
            observedItem = currentItem;
          }
          updateItemHeight();
        });
        observer.observe(observedItem);
        menuItemResizeObserverRef.current = observer;
      }
    }
    return () => {
      cancelAnimationFrame(frame);
      if (menuItemResizeObserverRef.current) {
        menuItemResizeObserverRef.current.disconnect();
        menuItemResizeObserverRef.current = null;
      }
    };
  }, [shouldVirtualize, visibleMenus.length, menuItemHeight]);

  useEffect(() => {
    if (!shouldVirtualize) return;
    const maxScrollTop = Math.max(0, virtualTotalHeight - virtualViewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [shouldVirtualize, virtualTotalHeight, virtualViewportHeight, scrollTop]);

  const parentPathMap = useMemo(() => {
    const map = new Map<string, string | null>();
    const visit = (items: MenuItem[], parent: string | null) => {
      for (const menu of items) {
        const rawKey = menu.key ?? '';
        const key = rawKey === '' ? '' : String(rawKey);
        const rawPath = menu.path ?? '';
        const path = rawPath === '' ? '' : String(rawPath);
        const id = getMenuId(menu);
        if (key) map.set(key, parent);
        if (path && path !== key) map.set(path, parent);
        if (id && id !== key && id !== path) map.set(id, parent);
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

  const toggleExpand = useCallback(
    (key: string) => {
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
        // 将需要更新的 keys 存储到 ref 中，由 useEffect 异步处理
        // 这样可以避免在渲染期间更新组件
        const nextKeys = Array.from(next);
        pendingOpenChangeRef.current = nextKeys;
        return next;
      });
    },
    []
  );

  const updateSidebarRect = useCallback(() => {
    if (typeof window === 'undefined') return;
    const sidebar = document.querySelector('.layout-sidebar') as HTMLElement | null;
    if (sidebar) {
      sidebarRectRef.current = sidebar.getBoundingClientRect();
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    updateSidebarRect();
    const scrollOptions: AddEventListenerOptions = { capture: true, passive: true };
    const handle = () => {
      if (sidebarRectFrameRef.current !== null) return;
      sidebarRectFrameRef.current = requestAnimationFrame(() => {
        sidebarRectFrameRef.current = null;
        updateSidebarRect();
      });
    };

    const sidebar = document.querySelector('.layout-sidebar') as HTMLElement | null;
    const useWindowResize = typeof ResizeObserver === 'undefined' || !sidebar;
    let resizeObserver: ResizeObserver | null = null;
    if (useWindowResize) {
      window.addEventListener('resize', handle);
    } else {
      resizeObserver = new ResizeObserver(handle);
      resizeObserver.observe(sidebar);
    }
    window.addEventListener('scroll', handle, scrollOptions);
    return () => {
      if (useWindowResize) {
        window.removeEventListener('resize', handle);
      }
      resizeObserver?.disconnect();
      window.removeEventListener('scroll', handle, scrollOptions);
      if (sidebarRectFrameRef.current !== null) {
        cancelAnimationFrame(sidebarRectFrameRef.current);
        sidebarRectFrameRef.current = null;
      }
    };
  }, [updateSidebarRect]);

  useEffect(() => {
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const container = menuEl.closest('.layout-scroll-container') as HTMLElement | null;
    scrollContainerRef.current = container;
    if (!container) return;

    const syncScroll = () => {
      const nextTop = container.scrollTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    };
    const syncHeight = () => {
      const nextHeight = container.clientHeight;
      setViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    };
    const handleScroll = rafThrottle(syncScroll);
    const updateHeight = rafThrottle(syncHeight);

    syncHeight();
    syncScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    const useWindowResize = typeof ResizeObserver === 'undefined';
    if (useWindowResize) {
      window.addEventListener('resize', updateHeight);
    } else {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(container);
      scrollResizeObserverRef.current = observer;
    }
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (useWindowResize) {
        window.removeEventListener('resize', updateHeight);
      }
      if (scrollResizeObserverRef.current) {
        scrollResizeObserverRef.current.disconnect();
        scrollResizeObserverRef.current = null;
      }
      handleScroll.cancel?.();
      updateHeight.cancel?.();
    };
  }, []);

  useEffect(() => {
    if (!shouldVirtualize) return;
    const container = scrollContainerRef.current;
    if (container) {
      container.scrollTop = 0;
    }
    setScrollTop((prev) => (prev === 0 ? prev : 0));
  }, [shouldVirtualize]);

  const showPopupMenu = useCallback((item: MenuItem, event: React.MouseEvent) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    if (popupFrameRef.current !== null) return;
    const target = event.currentTarget as HTMLElement;

    popupFrameRef.current = requestAnimationFrame(() => {
      popupFrameRef.current = null;
      const rect = target.getBoundingClientRect();
      const sidebarRect = sidebarRectRef.current;
      const left = sidebarRect ? sidebarRect.right : rect.right;

      setPopupState((prev) => ({
        ...prev,
        item,
        visible: true,
        top: rect.top,
        left,
      }));
    });
  }, []);

  const hidePopupMenu = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setPopupState(prev => ({ ...prev, visible: false, item: null }));
    }, 100);
  }, []);

  const cancelHidePopup = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  const handlePopupSelect = useCallback((key: string) => {
    handleSelect(key);
    setPopupState(prev => ({ ...prev, visible: false, item: null }));
  }, [handleSelect]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) {
        clearTimeout(leaveTimerRef.current);
      }
      if (popupFrameRef.current !== null) {
        cancelAnimationFrame(popupFrameRef.current);
        popupFrameRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <nav ref={menuRef} className="sidebar-menu" style={menuStyle}>
        {renderMenus.map((item, index) => {
          const actualIndex = shouldVirtualize ? virtualStartIndex + index : index;
          const itemStyle = shouldVirtualize
            ? {
                position: 'absolute' as const,
                top: `${actualIndex * menuItemHeight}px`,
                left: 0,
                right: 0,
              }
            : undefined;
          return (
          <MenuItemComponent
            key={getMenuId(item)}
            item={item}
            level={0}
            collapsed={collapsed}
            expandOnHovering={expandOnHovering}
            expandedKeys={expandedKeys}
            activeKey={activeKey}
            activeParentSet={activeParentSet}
            isActive={isMenuActive(item, activeKey)}
            hasActiveChild={activeParentSet.has(getMenuId(item))}
            onToggleExpand={toggleExpand}
            onSelect={handleSelect}
            onShowPopup={showPopupMenu}
            onHidePopup={hidePopupMenu}
            style={itemStyle}
          />
          );
        })}
      </nav>

      {/* 折叠状态下的弹出菜单 */}
      {popupState.visible && popupState.item && collapsed && !expandOnHovering && (
        <PopupMenu
          item={popupState.item}
          top={popupState.top}
          left={popupState.left}
          activeKey={activeKey}
          activeParentSet={activeParentSet}
          theme={sidebarTheme}
          onSelect={handlePopupSelect}
          onMouseEnter={cancelHidePopup}
          onMouseLeave={hidePopupMenu}
        />
      )}
    </>
  );
}
