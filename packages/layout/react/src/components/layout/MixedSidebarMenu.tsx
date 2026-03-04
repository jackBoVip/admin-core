/**
 * 混合侧边栏菜单组件（双列菜单）
 * @description 左侧显示一级菜单图标，右侧显示选中菜单的子菜单
 * @features
 * - 记住每个一级菜单最后激活的子菜单
 * - 支持悬停展开子菜单
 * - 点击无子菜单项直接导航
 */

import { LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';
import { useState, useCallback, useMemo, useEffect, useRef, memo, startTransition } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext, useLayoutComputed, useLayoutState } from '../../hooks';
import { useMenuState, useSidebarState } from '../../hooks/use-layout-state';
import { renderLayoutIcon } from '../../utils';
import { renderIcon as renderIconByType } from '../../utils/icon-renderer';

/**
 * 混合侧边栏一级菜单组件属性。
 */
interface MixedSidebarMenuProps {
  /** 一级菜单选中项变化回调。 */
  onRootMenuChange?: (menu: MenuItem | null) => void;
}

/**
 * 折叠态根菜单弹层状态。
 */
interface MixedSidebarPopupState {
  /** 是否可见。 */
  visible: boolean;
  /** 当前弹层对应的根菜单项。 */
  item: MenuItem | null;
  /** 弹层顶部定位（viewport 坐标）。 */
  top: number;
  /** 弹层左侧定位（viewport 坐标）。 */
  left: number;
}

/**
 * 根菜单自动同步去重状态。
 */
interface MixedSidebarLastSyncState {
  /** 上次同步时的激活 key。 */
  key: string | null;
  /** 上次同步时使用的一级菜单数组引用。 */
  menus: MenuItem[] | null;
}

/**
 * 混合侧边栏主菜单组件。
 * @description 渲染一级菜单图标列，并负责根菜单选中、悬停弹层与子菜单联动。
 * @param props 组件参数。
 * @returns 混合侧边栏主菜单节点。
 */
export function MixedSidebarMenu({ onRootMenuChange }: MixedSidebarMenuProps) {
  const context = useLayoutContext();
  const computed = useLayoutComputed();
  const [layoutState, setLayoutState] = useLayoutState();
  const { extraVisible, setExtraVisible, layoutComputed } = useSidebarState();
  const { activeKey, handleSelect } = useMenuState();
  
  /**
   * Logo 区域配置。
   */
  const logoConfig = useMemo(() => context.props.logo || {}, [context.props.logo]);
  /**
   * 当前侧边栏主题（已包含 semi-dark 计算结果）。
   */
  const theme = useMemo(() => layoutComputed?.sidebarTheme || 'light', [layoutComputed?.sidebarTheme]);
  const isHeaderMixedNav = computed.isHeaderMixedNav;

  /**
   * 当前可用菜单数据。
   */
  const menus = useMemo<MenuItem[]>(
    () => context.props.menus || [],
    [context.props.menus]
  );
  /**
   * 生成菜单稳定标识，按 `key -> path -> name` 顺序回退。
   *
   * @param menu 菜单项。
   * @returns 稳定菜单标识。
   */
  const getMenuId = useCallback((menu: MenuItem) => {
    const id = menu.key ?? menu.path ?? menu.name ?? '';
    return id === '' ? '' : String(id);
  }, []);
  /**
   * 规范化键值，空值统一为空字符串。
   *
   * @param value 原始键值。
   * @returns 规范化后的键。
   */
  const normalizeKey = useCallback((value: unknown) => {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
  }, []);
  /**
   * 判断菜单项是否匹配目标键（key/path/id 任一命中）。
   *
   * @param menu 菜单项。
   * @param key 目标键。
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
  }, [normalizeKey, getMenuId]);
  /**
   * 判断菜单树是否包含目标键。
   *
   * @param menu 根菜单项。
   * @param key 目标键。
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
   * 根据目标键查找所属一级根菜单。
   *
   * @param key 目标键。
   * @returns 命中的根菜单或 `null`。
   */
  const findRootMenuByKey = useCallback((key: string) => {
    if (!key) return null;
    for (const item of menus) {
      if (item.hidden) continue;
      if (menuContainsKey(item, key)) return item;
    }
    return null;
  }, [menus, menuContainsKey]);
  const headerMixedRootMenu = useMemo(() => {
    if (!isHeaderMixedNav) return null;
    const candidateKey = layoutState.mixedNavRootKey || activeKey;
    let root = candidateKey ? findRootMenuByKey(candidateKey) : null;
    if (!root) {
      for (const item of menus) {
        if (!item.hidden) {
          root = item;
          break;
        }
      }
    }
    return root;
  }, [isHeaderMixedNav, layoutState.mixedNavRootKey, activeKey, findRootMenuByKey, menus]);
  useEffect(() => {
    if (!isHeaderMixedNav) return;
    if (!headerMixedRootMenu) return;
    const rootKey = normalizeKey(headerMixedRootMenu.key ?? headerMixedRootMenu.path ?? '');
    if (!rootKey) return;
    /*
     * 使用函数式更新避免依赖旧的 `layoutState.mixedNavRootKey`，
     * 并通过 `startTransition` 降低渲染期更新冲突风险。
     */
    startTransition(() => {
      setLayoutState((prev) => {
        if (prev.mixedNavRootKey === rootKey) return prev;
        return { ...prev, mixedNavRootKey: rootKey };
      });
    });
  }, [isHeaderMixedNav, headerMixedRootMenu, normalizeKey, setLayoutState]);
  const rootMenus = useMemo(() => {
    const source = isHeaderMixedNav ? (headerMixedRootMenu?.children ?? []) : menus;
    const result: MenuItem[] = [];
    for (const item of source) {
      if (!item.hidden) result.push(item);
    }
    return result;
  }, [isHeaderMixedNav, headerMixedRootMenu, menus]);
  const rootNavRef = useRef<HTMLElement>(null);
  const [rootScrollTop, setRootScrollTop] = useState(0);
  const [rootViewportHeight, setRootViewportHeight] = useState(0);
  const [rootItemHeight, setRootItemHeight] = useState(72);
  const ROOT_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
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

  /**
   * 当前选中的一级根菜单。
   */
  const [selectedRootMenu, setSelectedRootMenu] = useState<MenuItem | null>(null);

  /**
   * 记录每个一级菜单最后一次激活的子菜单路径。
   * @description 类似常见 admin 布局中的 `defaultSubMap` 行为。
   */
  const lastActiveSubMenuMapRef = useRef<Map<string, string>>(new Map());

  const parentPathMap = useMemo(() => {
    const map = new Map<string, string | null>();

    /**
     * 遍历菜单树并建立“节点 -> 父节点”映射关系。
     *
     * @param items 当前层菜单列表。
     * @param parent 父节点标识。
     */
    const visit = (items: MenuItem[], parent: string | null) => {
      for (const menu of items) {
        const rawKey = menu.key ?? '';
        const keyPath = rawKey === '' ? '' : String(rawKey);
        const rawPath = menu.path ?? '';
        const path = rawPath === '' ? '' : String(rawPath);
        const id = getMenuId(menu);
        if (keyPath) map.set(keyPath, parent);
        if (path && path !== keyPath) map.set(path, parent);
        if (id && id !== keyPath && id !== path) map.set(id, parent);
        if (menu.children?.length) {
          visit(menu.children, id || parent);
        }
      }
    };
    visit(rootMenus, null);
    return map;
  }, [rootMenus, getMenuId]);

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
   * 将选中的根菜单变化同步给父组件。
   */
  useEffect(() => {
    onRootMenuChange?.(selectedRootMenu);
  }, [selectedRootMenu, onRootMenuChange]);

  const lastSyncRef = useRef<MixedSidebarLastSyncState>({
    key: null,
    menus: null,
  });

  /**
   * 根据当前激活路径自动选中一级菜单，并记录对应激活子菜单。
   */
  useEffect(() => {
    if (!rootMenus.length) {
      if (selectedRootMenu) {
        setSelectedRootMenu(null);
      }
      if (extraVisible) {
        setExtraVisible(false);
      }
      return;
    }
    const syncKey = activeKey || '';
    if (lastSyncRef.current.key === syncKey && lastSyncRef.current.menus === rootMenus) {
      return;
    }
    lastSyncRef.current = { key: syncKey, menus: rootMenus };

    let rootMenu: MenuItem | undefined;
    for (const item of rootMenus) {
      const menuId = getMenuId(item);
      const rawKey = item.key ?? '';
      const key = rawKey === '' ? '' : String(rawKey);
      const rawPath = item.path ?? '';
      const path = rawPath === '' ? '' : String(rawPath);
      const isActive = menuId === activeKey || key === activeKey || path === activeKey;
      const hasActiveChild = menuId ? activeParentSet.has(menuId) : false;
      if (isActive || hasActiveChild) {
        rootMenu = item;
        break;
      }
    }
    if (!rootMenu) {
      rootMenu = rootMenus[0];
    }
    if (rootMenu) {
      const currentId = selectedRootMenu ? getMenuId(selectedRootMenu) : '';
      const nextId = getMenuId(rootMenu);
      if (currentId !== nextId) {
        setSelectedRootMenu(rootMenu);
      }
      const nextExtraVisible = !!(rootMenu.children && rootMenu.children.length > 0);
      if (extraVisible !== nextExtraVisible) {
        setExtraVisible(nextExtraVisible);
      }
      /** 记录该一级菜单最后激活的子菜单路径。 */
      if (rootMenu.children?.length && activeKey) {
        lastActiveSubMenuMapRef.current.set(getMenuId(rootMenu), activeKey);
      }
    }
  }, [activeKey, rootMenus, activeParentSet, extraVisible, setExtraVisible, getMenuId, selectedRootMenu]);

  /**
   * 处理一级菜单悬停，更新当前根菜单并按需展示子菜单面板。
   *
   * @param item 当前悬停菜单项。
   */
  const handleRootMenuEnter = useCallback((item: MenuItem) => {
    setSelectedRootMenu((prev) => {
      const prevId = prev ? getMenuId(prev) : '';
      const nextId = getMenuId(item);
      return prevId === nextId ? prev : item;
    });
    if (item.children?.length && !extraVisible) {
      setExtraVisible(true);
    }
  }, [extraVisible, setExtraVisible, getMenuId]);

  /**
   * 处理一级菜单点击，支持自动激活最近子菜单或首个子菜单。
   *
   * @param item 被点击菜单项。
   */
  const handleRootMenuClick = useCallback((item: MenuItem) => {
    setSelectedRootMenu((prev) => {
      const prevId = prev ? getMenuId(prev) : '';
      const nextId = getMenuId(item);
      return prevId === nextId ? prev : item;
    });

    if (item.children?.length) {
      if (!extraVisible) {
        setExtraVisible(true);
      }
      /** 自动激活子菜单：优先使用历史记录，否则回退到第一个子菜单。 */
      const autoActivateChild = context.props.sidebar?.autoActivateChild ?? true;
      if (autoActivateChild) {
        const lastActivePath = lastActiveSubMenuMapRef.current.get(getMenuId(item));
        const firstChildPath = item.children[0]?.path ?? item.children[0]?.key;
        const targetPath = lastActivePath ?? firstChildPath;
        const normalizedTarget =
          targetPath === '' || targetPath === null || targetPath === undefined
            ? ''
            : String(targetPath);
        if (normalizedTarget && normalizedTarget !== activeKey) {
          handleSelect(normalizedTarget);
        }
      }
    } else if (item.path || item.key) {
      const target = item.key ?? item.path;
      const normalizedTarget =
        target === '' || target === null || target === undefined
          ? ''
          : String(target);
      if (normalizedTarget) handleSelect(normalizedTarget);
    }
  }, [setExtraVisible, handleSelect, context.props.sidebar?.autoActivateChild, activeKey, getMenuId, extraVisible]);

  /**
   * 一级菜单鼠标移入事件代理。
   *
   * @param item 当前悬停菜单项。
   */
  const handleRootMenuMouseEnter = useCallback((item: MenuItem) => {
    handleRootMenuEnter(item);
  }, [handleRootMenuEnter]);

  /**
   * 一级菜单点击事件代理。
   *
   * @param item 被点击菜单项。
   */
  const handleRootMenuItemClick = useCallback((item: MenuItem) => {
    handleRootMenuClick(item);
  }, [handleRootMenuClick]);

  useEffect(() => {
    const container = rootNavRef.current;
    if (!container) return;

    const handleScroll = rafThrottle(() => {
      const nextTop = container.scrollTop;
      setRootScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    });
    const updateHeight = rafThrottle(() => {
      const nextHeight = container.clientHeight;
      setRootViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      const firstItem = container.querySelector('.mixed-sidebar-menu__root-item') as HTMLElement | null;
      if (firstItem) {
        const height = firstItem.getBoundingClientRect().height;
        if (height > 0 && height !== rootItemHeight) {
          setRootItemHeight(height);
        }
      }
    });

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
  }, [rootItemHeight]);

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

  /**
   * 渲染一级菜单图标，缺省时回退首字母占位。
   *
   * @param icon 图标标识。
   * @param itemName 菜单名称。
   * @returns 图标节点。
   */
  const renderRootIcon = (icon: string | undefined, itemName: string) => {
    if (!icon) {
      return (
        <span className="mixed-sidebar-menu__icon">{itemName.charAt(0)}</span>
      );
    }

    return <span className="mixed-sidebar-menu__icon">{renderIconByType(icon, 'md')}</span>;
  };

  /**
   * 渲染左侧 Logo 区域。
   *
   * @returns Logo 节点或 `null`。
   */
  const renderLogo = () => {
    if (logoConfig.enable === false || isHeaderMixedNav) return null;
    
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
          const menuId = getMenuId(item);
          const rawKey = item.key ?? '';
          const key = rawKey === '' ? '' : String(rawKey);
          const rawPath = item.path ?? '';
          const path = rawPath === '' ? '' : String(rawPath);
          const isActive =
            (selectedRootMenu ? getMenuId(selectedRootMenu) : '') === menuId ||
            menuId === activeKey ||
            key === activeKey ||
            path === activeKey ||
            (menuId ? activeParentSet.has(menuId) : false);
          return (
            <div
              key={menuId || item.key || item.name}
              className={`mixed-sidebar-menu__root-item data-active:text-foreground data-disabled:opacity-50 ${
                isActive ? 'mixed-sidebar-menu__root-item--active' : ''
              }`}
              data-state={isActive ? 'active' : 'inactive'}
              data-disabled={item.disabled ? 'true' : undefined}
              title={item.name}
              onMouseEnter={() => handleRootMenuMouseEnter(item)}
              onClick={() => handleRootMenuItemClick(item)}
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
 * 混合侧边栏子菜单组件参数。
 * @description 约束子菜单数据、折叠态与交互回调。
 */
interface MixedSidebarSubMenuProps {
  /** 当前二级菜单数据。 */
  menus: MenuItem[];
  /** 当前激活菜单键。 */
  activeKey: string;
  /** 标题文案。 */
  title?: string;
  /** 是否折叠显示。 */
  collapsed?: boolean;
  /** 是否固定子菜单面板。 */
  pinned?: boolean;
  /** 是否显示折叠按钮。 */
  showCollapseBtn?: boolean;
  /** 是否显示固定/取消固定按钮。 */
  showPinBtn?: boolean;
  /** 子菜单主题。 */
  theme?: string;
  /** 选中指定子菜单项时触发。 */
  onSelect?: (key: string) => void;
  /** 点击折叠按钮时触发。 */
  onCollapse?: () => void;
  /** 切换固定/悬停模式时触发。 */
  onTogglePin?: () => void;
}

/**
 * 混合侧边栏子菜单组件。
 * @description 负责二级菜单展开收起、折叠态弹层与虚拟滚动渲染。
 * @param props 组件参数。
 * @returns 混合侧边栏子菜单节点。
 */
export const MixedSidebarSubMenu = memo(function MixedSidebarSubMenu({
  menus,
  activeKey,
  title,
  collapsed = false,
  pinned = true,
  showCollapseBtn = true,
  showPinBtn = true,
  theme,
  onSelect,
  onCollapse,
  onTogglePin,
}: MixedSidebarSubMenuProps) {
  const context = useLayoutContext();
  const portalTarget = typeof document === 'undefined' ? null : document.body;
  const SUB_RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
  const [subRenderCount, setSubRenderCount] = useState<number>(SUB_RENDER_CHUNK);
  const navRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const popupAnchorRef = useRef<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [subItemHeight, setSubItemHeight] = useState(40);
  const SUB_OVERSCAN = LAYOUT_UI_TOKENS.MENU_OVERSCAN;
  const subResizeObserverRef = useRef<ResizeObserver | null>(null);
  const subItemResizeObserverRef = useRef<ResizeObserver | null>(null);
  /**
   * 生成子菜单稳定标识，按 `key -> path -> name` 顺序回退。
   *
   * @param menu 菜单项。
   * @returns 稳定菜单标识。
   */
  const getMenuId = useCallback((menu: MenuItem) => {
    const id = menu.key ?? menu.path ?? menu.name ?? '';
    return id === '' ? '' : String(id);
  }, []);
  const popupTheme = theme || 'light';

  useEffect(() => {
    const nextCount = collapsed
      ? menus.length
      : Math.min(SUB_RENDER_CHUNK, menus.length);
    setSubRenderCount((prev) => (prev === nextCount ? prev : nextCount));
  }, [collapsed, menus.length, SUB_RENDER_CHUNK]);

  useEffect(() => {
    if (collapsed || subRenderCount >= menus.length) return;
    const frame = requestAnimationFrame(() => {
      setSubRenderCount((prev) => Math.min(prev + SUB_RENDER_CHUNK, menus.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [collapsed, subRenderCount, menus.length, SUB_RENDER_CHUNK]);

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
      const id = getMenuId(current);
      if (id) map.set(id, current);
      if (current.children?.length) {
        for (let i = current.children.length - 1; i >= 0; i -= 1) {
          stack.push(current.children[i]);
        }
      }
    }
    return map;
  }, [menus, getMenuId]);

  /**
   * 切换子菜单节点展开状态。
   *
   * @param key 节点键。
   */
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

    /**
     * 遍历子菜单树并建立父子映射关系。
     *
     * @param items 当前层菜单列表。
     * @param parent 父节点标识。
     */
    const visit = (items: MenuItem[], parent: string | null) => {
      for (const menu of items) {
        const rawKey = menu.key ?? '';
        const keyPath = rawKey === '' ? '' : String(rawKey);
        const rawPath = menu.path ?? '';
        const path = rawPath === '' ? '' : String(rawPath);
        const id = getMenuId(menu);
        if (keyPath) map.set(keyPath, parent);
        if (path && path !== keyPath) map.set(path, parent);
        if (id && id !== keyPath && id !== path) map.set(id, parent);
        if (menu.children?.length) {
          visit(menu.children, id || parent);
        }
      }
    };
    visit(menus, null);
    return map;
  }, [menus, getMenuId]);

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

  const [popupState, setPopupState] = useState<MixedSidebarPopupState>({
    visible: false,
    item: null,
    top: 0,
    left: 0,
  });

  /**
   * 关闭折叠态弹层菜单并清理锚点引用。
   */
  const hidePopupMenu = useCallback(() => {
    setPopupState((prev) => (prev.visible ? { ...prev, visible: false, item: null } : prev));
    popupAnchorRef.current = null;
  }, []);

  /**
   * 根据激活路径构建弹层菜单默认展开集合。
   *
   * @param root 弹层根菜单项。
   * @returns 默认展开键集合。
   */
  const buildPopupExpandedKeys = useCallback((root: MenuItem) => {
    const keys = new Set<string>();
    if (!root.children?.length) return keys;
    const stack = [...root.children].reverse();
    while (stack.length > 0) {
      const child = stack.pop();
      if (!child) continue;
      const childId = getMenuId(child);
      const isActive = childId === activeKey;
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
  }, [activeKey, activeParentSet, getMenuId]);

  /**
   * 显示折叠态弹层菜单并计算定位。
   *
   * @param item 触发弹层的菜单项。
   * @param event React 鼠标事件对象。
   */
  const showPopupMenu = useCallback((item: MenuItem, event: React.MouseEvent) => {
    const target = event.currentTarget as HTMLElement;
    popupAnchorRef.current = target;
    const rect = target.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const left = containerRect ? containerRect.right : rect.right;
    setExpandedKeys(buildPopupExpandedKeys(item));
    setPopupState({
      visible: true,
      item,
      top: rect.top,
      left,
    });
  }, [buildPopupExpandedKeys]);

  /**
   * 根据当前锚点重新计算弹层位置。
   */
  const updatePopupPosition = useCallback(() => {
    if (!popupState.visible || !popupAnchorRef.current) return;
    const rect = popupAnchorRef.current.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    const left = containerRect ? containerRect.right : rect.right;
    setPopupState((prev) => (prev.visible ? { ...prev, top: rect.top, left } : prev));
  }, [popupState.visible]);

  /**
   * 处理子菜单项点击：有子节点时展开/弹层，无子节点时触发选中。
   *
   * @param item 被点击菜单项。
   * @param event React 鼠标事件（折叠态弹层定位时使用）。
   */
  const handleClick = useCallback(
    (item: MenuItem, event?: React.MouseEvent) => {
      const id = getMenuId(item);
      if (item.children?.length) {
        if (collapsed && event) {
          if (popupState.visible && popupState.item && getMenuId(popupState.item) === id) {
            hidePopupMenu();
            return;
          }
          showPopupMenu(item, event);
          return;
        }
        toggleExpand(id);
        return;
      }
      const target = item.path ?? item.key ?? id;
      const normalizedTarget =
        target === null || target === undefined || target === ''
          ? ''
          : String(target);
      if (normalizedTarget) {
        onSelect?.(normalizedTarget);
      }
      hidePopupMenu();
    },
    [collapsed, popupState.visible, popupState.item, getMenuId, toggleExpand, onSelect, hidePopupMenu, showPopupMenu]
  );

  /**
   * 处理菜单项 DOM 点击事件并映射到目标菜单项。
   *
   * @param e React 鼠标事件对象。
   */
  const handleItemClick = useCallback((e: React.MouseEvent) => {
    const key = (e.currentTarget as HTMLElement).dataset.key;
    if (!key) return;
    const item = menuItemMap.get(key);
    if (item) {
      handleClick(item, e);
    }
  }, [menuItemMap, handleClick]);

  /**
   * 渲染子菜单图标。
   *
   * @param icon 图标标识。
   * @returns 图标节点。
   */
  const renderSubIcon = (icon: string | undefined) => {
    if (!icon) return null;
    return <span className="mixed-sidebar-submenu__icon">{renderIconByType(icon, 'sm')}</span>;
  };

  /**
   * 渲染弹层菜单图标。
   *
   * @param icon 图标标识。
   * @returns 图标节点。
   */
  const renderPopupIcon = (icon: string | undefined) => {
    if (!icon) return null;
    return <span className="sidebar-menu__popup-icon">{renderIconByType(icon, 'sm')}</span>;
  };

  /**
   * 递归渲染子菜单节点。
   */
  const renderMenuItem = (
    item: MenuItem,
    level: number,
    style?: React.CSSProperties
  ): React.ReactNode => {
    if (item.hidden) return null;

    const menuId = getMenuId(item);
    const rawKey = item.key ?? '';
    const key = rawKey === '' ? '' : String(rawKey);
    const rawPath = item.path ?? '';
    const path = rawPath === '' ? '' : String(rawPath);
    const active = menuId === activeKey || key === activeKey || path === activeKey;
    const hasChildren = Boolean(item.children?.length);
    const expanded = expandedKeys.has(menuId);
    const hasActive = menuId ? activeParentSet.has(menuId) : false;

    /**
     * 组装普通子菜单项类名。
     *
     * @returns 类名字符串。
     */
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
      <div key={menuId || item.key || item.name} className="mixed-sidebar-submenu__group" style={style}>
        <div
          className={`${itemClassName} data-active:text-primary data-disabled:opacity-50`}
          data-state={active ? 'active' : 'inactive'}
          data-disabled={item.disabled ? 'true' : undefined}
          data-has-active-child={hasActive ? 'true' : undefined}
          data-has-children={hasChildren ? 'true' : undefined}
          data-expanded={hasChildren && expanded ? 'true' : undefined}
          data-level={level}
          data-key={menuId}
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
              {renderLayoutIcon('menu-arrow-right', 'sm')}
            </span>
          )}
        </div>
        {/* 子菜单（折叠时不显示） */}
        {!collapsed && hasChildren && expanded && (
          <div className="mixed-sidebar-submenu__children">
            {item.children?.map((child) => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const renderPopupItem = (
    item: MenuItem,
    level: number
  ): React.ReactNode => {
    if (item.hidden) return null;
    const menuId = getMenuId(item);
    const rawKey = item.key ?? '';
    const key = rawKey === '' ? '' : String(rawKey);
    const rawPath = item.path ?? '';
    const path = rawPath === '' ? '' : String(rawPath);
    const active = menuId === activeKey || key === activeKey || path === activeKey;
    const hasChildren = Boolean(item.children?.length);
    const expanded = expandedKeys.has(menuId);
    const hasActive = menuId ? activeParentSet.has(menuId) : false;

    /**
     * 组装弹层菜单项类名。
     *
     * @returns 类名字符串。
     */
    const itemClassName = (() => {
      const classes = [
        'sidebar-menu__popup-item',
        `sidebar-menu__popup-item--level-${level}`,
      ];
      if (active) classes.push('sidebar-menu__popup-item--active');
      if (hasActive) classes.push('sidebar-menu__popup-item--has-active-child');
      return classes.join(' ');
    })();

    /**
     * 处理弹层菜单点击，子节点切换展开，叶子节点触发选中。
     */
    const handlePopupClick = () => {
      if (hasChildren) {
        toggleExpand(menuId);
        return;
      }
      const target = item.path ?? item.key ?? menuId;
      const normalizedTarget =
        target === null || target === undefined || target === ''
          ? ''
          : String(target);
      if (normalizedTarget) {
        onSelect?.(normalizedTarget);
      }
      hidePopupMenu();
    };

    return (
      <div key={menuId || item.key || item.name} className="sidebar-menu__popup-group">
        <div
          className={itemClassName}
          data-state={active ? 'active' : 'inactive'}
          data-disabled={item.disabled ? 'true' : undefined}
          data-has-active-child={hasActive ? 'true' : undefined}
          data-has-children={hasChildren ? 'true' : undefined}
          data-expanded={hasChildren && expanded ? 'true' : undefined}
          data-level={level}
          data-key={menuId}
          onClick={handlePopupClick}
        >
          {renderPopupIcon(item.icon)}
          <span className="sidebar-menu__popup-name">{item.name}</span>
          {hasChildren && (
            <span
              className={`sidebar-menu__popup-arrow ${
                expanded ? 'sidebar-menu__popup-arrow--expanded' : ''
              }`}
              data-expanded={expanded ? 'true' : undefined}
            >
              {renderLayoutIcon('menu-arrow-right', 'sm')}
            </span>
          )}
        </div>
        {hasChildren && expanded && (
          <div className="sidebar-menu__popup-submenu">
            {item.children?.map((child) => renderPopupItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const container = navRef.current;
    if (!container) return;

    const handleScroll = rafThrottle(() => {
      const nextTop = container.scrollTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    });
    const updateHeight = rafThrottle(() => {
      const nextHeight = container.clientHeight;
      setViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      const firstItem = container.querySelector('.mixed-sidebar-submenu__item') as HTMLElement | null;
      if (firstItem) {
        const height = firstItem.getBoundingClientRect().height;
        if (height > 0 && height !== subItemHeight) {
          setSubItemHeight(height);
        }
      }
    });

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
  }, [subItemHeight]);

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

  useEffect(() => {
    if (!popupState.visible) return;
    const handleResize = rafThrottle(() => updatePopupPosition());
    const handleScroll = rafThrottle(() => updatePopupPosition());
    window.addEventListener('resize', handleResize);
    const container = navRef.current;
    container?.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('resize', handleResize);
      container?.removeEventListener('scroll', handleScroll);
    };
  }, [popupState.visible, updatePopupPosition]);

  useEffect(() => {
    if (!popupState.visible) return;

    /**
     * 点击弹层外区域时关闭弹层。
     *
     * @param e 鼠标事件。
     */
    const handleDocClick = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (popupRef.current?.contains(target)) return;
      if (popupAnchorRef.current?.contains(target)) return;
      hidePopupMenu();
    };

    /**
     * 按下 `Escape` 时关闭弹层。
     *
     * @param e 键盘事件。
     */
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hidePopupMenu();
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [popupState.visible, hidePopupMenu]);

  useEffect(() => {
    if (!collapsed && popupState.visible) {
      hidePopupMenu();
    }
  }, [collapsed, popupState.visible, hidePopupMenu]);

  /**
   * 计算子菜单容器类名。
   *
   * @returns 类名字符串。
   */
  const containerClassName = (() => {
    const classes = ['mixed-sidebar-submenu'];
    if (collapsed) classes.push('mixed-sidebar-submenu--collapsed');
    return classes.join(' ');
  })();

  const popupNode = popupState.visible && popupState.item ? (
    <div
      ref={popupRef}
      className={`sidebar-menu__popup sidebar-menu__popup--${popupTheme}`}
      data-theme={popupTheme}
      style={{ top: `${popupState.top}px`, left: `${popupState.left}px` }}
    >
      <div className="sidebar-menu__popup-title">{popupState.item.name}</div>
      <div className="sidebar-menu__popup-content">
        {(popupState.item.children ?? []).map((child) => renderPopupItem(child, 0))}
      </div>
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className={containerClassName}
      data-collapsed={collapsed ? 'true' : undefined}
    >
      {/* 折叠按钮 - 左下角 */}
      {showCollapseBtn && (
        <button
          type="button"
          className="mixed-sidebar-submenu__collapse-btn"
          onClick={onCollapse}
          title={collapsed ? context.t('layout.common.expand') : context.t('layout.common.collapse')}
        >
          {renderLayoutIcon(collapsed ? 'submenu-expand' : 'submenu-collapse', 'sm')}
        </button>
      )}
      {/* 固定按钮 - 右下角 */}
      {showPinBtn && (
        <button
          type="button"
          className="mixed-sidebar-submenu__pin-btn"
          onClick={onTogglePin}
          title={pinned ? context.t('layout.common.unpin') : context.t('layout.common.pin')}
        >
          {renderLayoutIcon(pinned ? 'tabbar-unpin' : 'tabbar-pin', 'sm', 'h-3.5 w-3.5')}
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
      {popupState.visible && popupNode && portalTarget
        ? createPortal(popupNode, portalTarget)
        : null}
    </div>
  );
});
