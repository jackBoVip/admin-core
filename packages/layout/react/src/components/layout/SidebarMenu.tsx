/**
 * 侧边栏菜单组件。
 * @description 自动渲染菜单数据，支持多级嵌套；折叠状态下支持悬停弹出子菜单。
 */

import { hasChildren, getMenuItemClassName, getMenuId, isMenuActive, LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';
import { useState, useCallback, useMemo, useRef, useEffect, memo, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext, useLayoutComputed, useLayoutState } from '../../hooks';
import { useMenuState, useSidebarState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';
import { renderIcon } from '../../utils/icon-renderer';

/**
 * 侧边栏菜单项组件属性。
 */
interface MenuItemProps {
  /** 当前菜单项。 */
  item: MenuItem;
  /** 菜单层级。 */
  level: number;
  /** 侧边栏是否折叠。 */
  collapsed: boolean;
  /** 是否处于悬停展开态。 */
  expandOnHovering: boolean;
  /** 当前展开菜单 key 集合。 */
  expandedKeys: Set<string>;
  /** 当前激活菜单 key。 */
  activeKey: string;
  /** 激活路径父级集合。 */
  activeParentSet: Set<string>;
  /** 当前菜单是否激活。 */
  isActive: boolean;
  /** 是否包含激活子项。 */
  hasActiveChild: boolean;
  /** 切换指定菜单项展开状态。 */
  onToggleExpand: (key: string) => void;
  /** 选中指定菜单项。 */
  onSelect: (key: string) => void;
  /** 在折叠态悬停时显示子菜单弹层。 */
  onShowPopup: (item: MenuItem, event: React.MouseEvent) => void;
  /** 隐藏子菜单弹层。 */
  onHidePopup: () => void;
  /** 样式配置。 */
  style?: React.CSSProperties;
}

/**
 * 折叠侧栏悬停弹层状态。
 */
interface SidebarPopupState {
  /** 当前弹出菜单项。 */
  item: MenuItem | null;
  /** 是否可见。 */
  visible: boolean;
  /** 弹出菜单顶部坐标。 */
  top: number;
  /** 弹出菜单左侧坐标。 */
  left: number;
}

/**
 * 递归菜单项组件。
 * @description 负责单项菜单渲染、展开收起与子菜单递归展示。
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

  /**
   * 处理菜单项点击：有子菜单时切换展开，无子菜单时触发选中。
   */
  const handleClick = useCallback(() => {
    if (hasChildrenItems) {
      if (collapsed && !expandOnHovering) {
        /* 折叠状态下，有子菜单的点击交由悬停弹层处理。 */
        return;
      }
      onToggleExpand(menuId);
    } else {
      onSelect(menuId);
    }
  }, [hasChildrenItems, menuId, onToggleExpand, onSelect, collapsed, expandOnHovering]);

  /**
   * 处理菜单项悬停，在折叠模式下触发弹出子菜单。
   *
   * @param e React 鼠标事件对象。
   */
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
  /** 当前弹出根菜单项。 */
  item: MenuItem;
  /** 弹出菜单顶部坐标。 */
  top: number;
  /** 弹出菜单左侧坐标。 */
  left: number;
  /** 当前激活菜单 key。 */
  activeKey: string;
  /** 激活路径父级集合。 */
  activeParentSet: Set<string>;
  /** 当前主题。 */
  theme: string;
  /** 选中指定菜单项。 */
  onSelect: (key: string) => void;
  /** 鼠标进入弹层时触发。 */
  onMouseEnter: () => void;
  /** 鼠标离开弹层时触发。 */
  onMouseLeave: () => void;
}

/**
 * 侧边栏弹出菜单组件。
 */
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
  const portalTarget = typeof document === 'undefined' ? null : document.body;
  const popupResizeObserverRef = useRef<ResizeObserver | null>(null);
  const popupStyle = useMemo(() => ({ top: `${top}px`, left: `${left}px` }), [top, left]);
  const itemId = useMemo(() => getMenuId(item), [item]);
  /**
   * 基于当前激活路径构建弹出菜单初始展开键集合。
   *
   * @returns 默认展开键集合。
   */
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
    setExpandedKeys((prev) => {
      if (prev.size !== nextKeys.size) {
        return nextKeys;
      }
      for (const key of nextKeys) {
        if (!prev.has(key)) {
          return nextKeys;
        }
      }
      return prev;
    });
  }, [buildExpandedKeys, itemId]);

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

  /**
   * 处理弹出菜单项悬停，自动展开包含子节点的项。
   *
   * @param menuItem 当前悬停菜单项。
   */
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

  /**
   * 切换弹出菜单中某个节点的展开状态。
   *
   * @param key 菜单键。
   */
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

  /**
   * 处理弹出菜单节点点击，按是否有子节点执行展开或选择。
   *
   * @param menuItem 被点击菜单项。
   */
  const handleItemClick = useCallback((menuItem: MenuItem) => {
    if (hasChildren(menuItem)) {
      toggleExpand(getMenuId(menuItem));
    } else {
      onSelect(getMenuId(menuItem));
    }
  }, [toggleExpand, onSelect]);

  /**
   * 处理弹出菜单 DOM 点击事件，并映射到具体菜单项。
   *
   * @param e React 鼠标事件对象。
   */
  const handlePopupItemClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const menuItem = menuItemMap.get(key);
    if (menuItem) {
      handleItemClick(menuItem);
    }
  }, [menuItemMap, handleItemClick]);

  const popupChildren = useMemo(() => item.children ?? [], [item.children]);
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

  /**
   * 同步弹出菜单滚动位置到本地状态。
   *
   * @param e React 滚动事件对象。
   */
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
    /**
     * 处理滚轮事件，接管默认滚动以兼容虚拟列表滚动容器。
     *
     * @param e 原生滚轮事件。
     */
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

    /**
     * 计算弹出菜单项类名，合并激活态与层级态样式。
     */
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

  if (!portalTarget) return null;

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
    portalTarget
  );
});

/**
 * 侧边栏菜单组件。
 * @description 负责菜单展开态同步、折叠悬停弹层与虚拟滚动渲染。
 * @returns 侧边栏菜单节点。
 */
export function SidebarMenu() {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const { collapsed, expandOnHovering } = useSidebarState();
  const { openKeys, activeKey, handleSelect, handleOpenChange } = useMenuState();
  const [layoutState, setLayoutState] = useLayoutState();
  
  /**
   * 侧边栏主题标识，供弹出菜单同步视觉样式。
   */
  const sidebarTheme = computed.sidebarTheme || 'light';

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(openKeys)
  );

  /**
   * 记录待同步的展开键集合与内部更新状态。
   * @description
   * 用于区分“用户点击触发的内部展开变化”和“外部 openKeys 同步”。
   * 防止在双向同步过程中重复触发 `handleOpenChange`。
   */
  const pendingOpenChangeRef = useRef<string[] | null>(null);
  const isExpandedKeysInternalUpdateRef = useRef<boolean>(false);

  /**
   * 同步外部 `openKeys` 到本地 `expandedKeys`。
   * @description 内部点击触发的更新会被标记并在此处忽略，避免循环同步。
   */
  useEffect(() => {
    /* 内部触发的同步在此跳过，防止出现状态回环。 */
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

  /**
   * 异步处理待提交的 `openKeys` 变更。
   * @description 将展开状态变更放到 effect 中执行，避免渲染期直接更新。
   */
  useEffect(() => {
    if (pendingOpenChangeRef.current !== null) {
      const keys = pendingOpenChangeRef.current;
      pendingOpenChangeRef.current = null;
      /* 标记为内部更新，防止被“外部同步”逻辑再次消费。 */
      isExpandedKeysInternalUpdateRef.current = true;
      startTransition(() => {
        handleOpenChange(keys);
      });
    }
  }, [expandedKeys, handleOpenChange]);

  /**
   * 折叠侧栏悬停弹出菜单状态。
   */
  const [popupState, setPopupState] = useState<SidebarPopupState>({
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

  /**
   * 统一规范菜单键值，空值转换为空字符串。
   *
   * @param value 原始键值。
   * @returns 规范化键值。
   */
  const normalizeKey = useCallback((value: unknown) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  }, []);

  /**
   * 判断菜单项是否与目标键匹配（key/path/id 任一匹配即视为命中）。
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
    const menuId = normalizeKey(getMenuId(menu));
    return (
      (menuKey && menuKey === target) ||
      (menuPath && menuPath === target) ||
      (menuId && menuId === target)
    );
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
   * 根据目标键在顶层菜单中定位所属根菜单。
   *
   * @param key 目标菜单键。
   * @returns 命中的根菜单项，未命中返回 `null`。
   */
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

  /**
   * 本地缓存混合导航根键。
   * @description
   * 避免渲染流程中直接依赖 `layoutState.mixedNavRootKey`，
   * 从而规避 “Cannot update a component while rendering a different component” 警告。
   */
  const [localMixedNavRootKey, setLocalMixedNavRootKey] = useState<string | null>(() => {
    if (!isMixedNav) return null;
    /* 初始化阶段读取一次外部状态，后续通过同步 effect 维护。 */
    return layoutState.mixedNavRootKey || null;
  });

  /**
   * 标记混合导航根键是否由内部逻辑触发更新。
   * @description 用于在 `layoutState` 与本地状态同步时避免循环。
   */
  const isInternalUpdateRef = useRef<boolean>(false);

  /**
   * 同步 `layoutState.mixedNavRootKey` 到本地状态。
   * @description 内部更新触发的变更会被忽略，避免双向同步闭环。
   */
  useEffect(() => {
    if (!isMixedNav) {
      if (!isInternalUpdateRef.current) {
        setLocalMixedNavRootKey(null);
      }
      return;
    }
    
    /* 内部更新已经更新过本地值，这里直接跳过。 */
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    
    /* 函数式更新仅在值变化时提交，减少不必要渲染。 */
    setLocalMixedNavRootKey((prev) => {
      const next = layoutState.mixedNavRootKey || null;
      return prev === next ? prev : next;
    });
  }, [isMixedNav, layoutState.mixedNavRootKey]);

  /**
   * 基于激活键和本地根键推导当前根菜单。
   * @description 使用本地根键计算，避免渲染期与外部状态形成竞态。
   */
  const derivedRootMenu = useMemo(() => {
    if (!isMixedNav) return null;
    const candidateKey = localMixedNavRootKey || activeKey;
    if (!candidateKey) return null;
    return findRootMenuByKey(candidateKey);
  }, [isMixedNav, localMixedNavRootKey, activeKey, findRootMenuByKey]);

  const rootMenu = derivedRootMenu ?? fallbackRootMenu;

  /**
   * 记录上一次激活键与根键，避免重复提交同值更新。
   */
  const prevActiveKeyRef = useRef<string | null>(null);
  const prevRootKeyRef = useRef<string | null>(null);

  /**
   * 监听 `activeKey` 推导并更新混合导航根键。
   * @description
   * 仅依赖 `activeKey` 触发更新，避免与 `rootMenu/localMixedNavRootKey`
   * 形成循环依赖。
   */
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
    
    /* activeKey 未变化时不触发后续同步。 */
    if (prevActiveKeyRef.current === activeKey) return;
    
    /* 记录最新 activeKey，作为下次比较基准。 */
    prevActiveKeyRef.current = activeKey;
    
    /* 基于 activeKey 直接推导根菜单，避免依赖本地根键形成闭环。 */
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
    
    /* rootKey 未变化时直接跳过。 */
    if (prevRootKeyRef.current === rootKey) return;
    
    /* 写入最新 rootKey 快照。 */
    prevRootKeyRef.current = rootKey;
    
    /* 在下一帧提交状态，规避渲染期更新警告。 */
    requestAnimationFrame(() => {
      /* 标记为内部更新，供同步 effect 跳过处理。 */
      isInternalUpdateRef.current = true;
      
      /* 优先更新本地状态，降低外部状态读写冲突概率。 */
      setLocalMixedNavRootKey(rootKey);
      
      /* 函数式更新避免闭包依赖旧 layoutState，减少循环更新风险。 */
      setLayoutState((prev) => {
        /* 同值直接复用旧对象，避免无意义渲染。 */
        if (prev.mixedNavRootKey === rootKey) return prev;
        return { ...prev, mixedNavRootKey: rootKey };
      });
      
      /* 下一事件循环重置标志，确保同步 effect 在稳定状态下运行。 */
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
  }, [shouldVirtualize, visibleMenus.length, RENDER_CHUNK]);

  useEffect(() => {
    if (shouldVirtualize || renderCount >= visibleMenus.length) return;
    const frame = requestAnimationFrame(() => {
      setRenderCount((prev) => Math.min(prev + RENDER_CHUNK, visibleMenus.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [shouldVirtualize, renderCount, visibleMenus.length, RENDER_CHUNK]);

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
    /**
     * 测量菜单项实际高度并同步到虚拟列表计算参数。
     */
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
    /**
     * 深度优先遍历菜单树，构建“节点 -> 父节点”映射。
     *
     * @param items 当前层级菜单集合。
     * @param parent 当前层级父键。
     */
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

  /**
   * 切换侧边栏菜单节点展开状态，并异步同步 `openKeys`。
   *
   * @param key 菜单键。
   */
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
        /*
         * 将待同步展开键暂存至 ref，
         * 再由 effect 异步触发 `handleOpenChange`，避免渲染期更新。
         */
        const nextKeys = Array.from(next);
        pendingOpenChangeRef.current = nextKeys;
        return next;
      });
    },
    []
  );

  /**
   * 更新侧边栏容器矩形信息，用于弹出菜单定位。
   */
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
    /**
     * 节流处理窗口尺寸/滚动事件，按帧同步侧边栏矩形信息。
     */
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

    /**
     * 同步滚动容器的 `scrollTop`。
     */
    const syncScroll = () => {
      const nextTop = container.scrollTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    };
    /**
     * 同步滚动容器可视高度。
     */
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

  /**
   * 显示折叠侧边栏弹出菜单，并根据触发项计算弹层位置。
   *
   * @param item 触发弹层的菜单项。
   * @param event React 鼠标事件。
   */
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

  /**
   * 延迟隐藏弹出菜单，避免鼠标在菜单与弹层间移动时闪烁。
   */
  const hidePopupMenu = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    leaveTimerRef.current = setTimeout(() => {
      setPopupState(prev => ({ ...prev, visible: false, item: null }));
    }, 100);
  }, []);

  /**
   * 取消已安排的弹出菜单隐藏任务。
   */
  const cancelHidePopup = useCallback(() => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
  }, []);

  /**
   * 处理弹出菜单选中，触发选中逻辑并关闭弹层。
   *
   * @param key 选中的菜单键。
   */
  const handlePopupSelect = useCallback((key: string) => {
    handleSelect(key);
    setPopupState(prev => ({ ...prev, visible: false, item: null }));
  }, [handleSelect]);

  /**
   * 组件卸载时清理延时器与动画帧。
   */
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
