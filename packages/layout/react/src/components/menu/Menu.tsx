/**
 * 菜单组件
 * @description 参考 vben-admin 实现，支持水平/垂直模式、折叠、手风琴等
 */
import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from 'react';
import { MenuItem as MenuItemComp } from './MenuItem';
import { SubMenu } from './SubMenu';
import { MenuProvider, type MenuContextValue, type MenuItemClicked } from './use-menu-context';
import type { MenuItem } from '@admin-core/layout';

export interface MenuProps {
  /** 菜单数据 */
  menus?: MenuItem[];
  /** 模式 */
  mode?: 'horizontal' | 'vertical';
  /** 是否折叠（仅垂直模式） */
  collapse?: boolean;
  /** 手风琴模式 */
  accordion?: boolean;
  /** 圆角样式 */
  rounded?: boolean;
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 默认激活路径 */
  defaultActive?: string;
  /** 默认展开的菜单 */
  defaultOpeneds?: string[];
  /** 选择回调 */
  onSelect?: (path: string, parentPaths: string[]) => void;
  /** 展开回调 */
  onOpen?: (path: string, parentPaths: string[]) => void;
  /** 关闭回调 */
  onClose?: (path: string, parentPaths: string[]) => void;
}

export const Menu = memo(function Menu({
  menus = [],
  mode = 'horizontal',
  collapse = false,
  accordion = true,
  rounded = true,
  theme = 'light',
  defaultActive = '',
  defaultOpeneds = [],
  onSelect,
  onOpen,
  onClose,
}: MenuProps) {
  const normalizeKey = useCallback((value: unknown) => {
    if (value == null || value === '') return '';
    return String(value);
  }, []);

  // 状态
  const [activePath, setActivePath] = useState(() => normalizeKey(defaultActive));
  const [openedMenus, setOpenedMenus] = useState<string[]>(
    defaultOpeneds && !collapse
      ? defaultOpeneds.map((key) => normalizeKey(key)).filter(Boolean)
      : []
  );
  const openedMenuSet = useMemo(() => new Set(openedMenus), [openedMenus]);

  // 同步 defaultActive
  useEffect(() => {
    const nextActive = normalizeKey(defaultActive);
    setActivePath(prev => (prev === nextActive ? prev : nextActive));
  }, [defaultActive, normalizeKey]);

  // 折叠时关闭所有菜单
  useEffect(() => {
    if (collapse) {
      setOpenedMenus((prev) => (prev.length > 0 ? [] : prev));
    }
  }, [collapse]);

  // 是否为弹出模式
  const isMenuPopup = mode === 'horizontal' || (mode === 'vertical' && collapse);

  const parentPathMap = useMemo(() => {
    const map = new Map<string, string | null>();
    const visit = (items: MenuItem[], parent: string | null) => {
      for (const menu of items) {
        const rawKey = menu.key ?? '';
        const keyPath = normalizeKey(rawKey);
        const rawPath = menu.path ?? '';
        const path = normalizeKey(rawPath);
        const id = normalizeKey(menu.key ?? menu.path ?? menu.name ?? '');
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
  }, [menus, normalizeKey]);

  const activeParentSet = useMemo(() => {
    const parentSet = new Set<string>();
    if (!activePath) return parentSet;
    let current = activePath;
    const visited = new Set<string>();
    while (current && parentPathMap.has(current) && !visited.has(current)) {
      visited.add(current);
      const parent = parentPathMap.get(current);
      if (!parent) break;
      parentSet.add(parent);
      current = parent;
    }
    return parentSet;
  }, [activePath, parentPathMap]);

  // 打开菜单
  const openMenu = useCallback((path: string, parentPaths: string[] = []) => {
    const target = normalizeKey(path);
    if (!target) return;
    const normalizedParents = parentPaths.map((p) => normalizeKey(p)).filter(Boolean);
    setOpenedMenus(prev => {
      if (prev.includes(target)) return prev;
      
      let newOpenedMenus = [...prev];
      
      // 手风琴模式：关闭同级其他菜单
      if (accordion) {
        if (normalizedParents.length === 0) {
          newOpenedMenus = [];
        } else {
          const filtered: string[] = [];
          for (const menu of newOpenedMenus) {
            let keep = false;
            for (const parent of normalizedParents) {
              if (menu.startsWith(parent)) {
                keep = true;
                break;
              }
            }
            if (keep) filtered.push(menu);
          }
          newOpenedMenus = filtered;
        }
      }
      
      newOpenedMenus.push(target);
      return newOpenedMenus;
    });
    onOpen?.(target, normalizedParents);
  }, [accordion, onOpen, normalizeKey]);

  // 关闭菜单
  const closeMenu = useCallback((path: string, parentPaths: string[] = []) => {
    const target = normalizeKey(path);
    if (!target) return;
    const normalizedParents = parentPaths.map((p) => normalizeKey(p)).filter(Boolean);
    setOpenedMenus(prev => {
      const index = prev.indexOf(target);
      if (index === -1) return prev;
      const newOpenedMenus = [...prev];
      newOpenedMenus.splice(index, 1);
      return newOpenedMenus;
    });
    onClose?.(target, normalizedParents);
  }, [onClose, normalizeKey]);

  // 关闭所有菜单
  const closeAllMenus = useCallback(() => {
    setOpenedMenus([]);
  }, []);

  // 处理菜单项点击
  const handleMenuItemClick = useCallback((data: MenuItemClicked) => {
    const normalizedPath = normalizeKey(data.path);
    const normalizedParents = data.parentPaths.map((p) => normalizeKey(p)).filter(Boolean);
    if (!normalizedPath) return;
    
    // 弹出模式下点击菜单项关闭所有菜单
    if (isMenuPopup) {
      setOpenedMenus((prev) => (prev.length > 0 ? [] : prev));
    }
    
    setActivePath(prev => (prev === normalizedPath ? prev : normalizedPath));
    onSelect?.(normalizedPath, normalizedParents);
  }, [isMenuPopup, onSelect, normalizeKey]);

  // 溢出处理（仅水平模式）
  const menuRef = useRef<HTMLUListElement>(null);
  const [sliceIndex, setSliceIndex] = useState(-1);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isFirstRenderRef = useRef(true);
  const resizeFrameRef = useRef<number | null>(null);
  const RENDER_CHUNK = 80;
  const [renderCount, setRenderCount] = useState(RENDER_CHUNK);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [itemHeight, setItemHeight] = useState(40);
  const VIRTUAL_OVERSCAN = 4;
  const scrollResizeObserverRef = useRef<ResizeObserver | null>(null);
  const itemResizeObserverRef = useRef<ResizeObserver | null>(null);

  const canVirtualize =
    mode === 'vertical' && collapse && viewportHeight > 0 && itemHeight > 0;

  // 计算菜单项宽度（参考 vben 实现）
  const calcMenuItemWidth = useCallback((menuItem: HTMLElement): number => {
    const computedStyle = getComputedStyle(menuItem);
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
    return menuItem.offsetWidth + marginLeft + marginRight;
  }, []);

  // 计算切片索引（参考 vben 实现）
  const calcSliceIndex = useCallback((): number => {
    if (!menuRef.current) return -1;
    
    // 获取所有直接子节点（排除注释和空文本）
    const items: HTMLElement[] = [];
    const nodes = menuRef.current.childNodes;
    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      if (node.nodeName === '#comment') continue;
      if (node.nodeName === '#text' && !node.nodeValue) continue;
      items.push(node as HTMLElement);
    }
    
    if (items.length === 0) return -1;
    
    const moreItemWidth = 46;
    const computedMenuStyle = getComputedStyle(menuRef.current);
    const paddingLeft = parseInt(computedMenuStyle.paddingLeft, 10) || 0;
    const paddingRight = parseInt(computedMenuStyle.paddingRight, 10) || 0;
    const menuWidth = menuRef.current.clientWidth - paddingLeft - paddingRight;
    
    let calcWidth = 0;
    let sliceIdx = 0;
    
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      calcWidth += calcMenuItemWidth(item);
      if (calcWidth <= menuWidth - moreItemWidth) {
        sliceIdx = index + 1;
      }
    }
    
    return sliceIdx === items.length ? -1 : sliceIdx;
  }, [calcMenuItemWidth]);

  // 处理 resize（参考 vben 实现）
  const handleResize = useCallback(() => {
    if (resizeFrameRef.current !== null) return;

    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null;

      if (mode !== 'horizontal') {
        if (sliceIndex !== -1) {
          setSliceIndex(-1);
        }
        return;
      }

      const newSliceIndex = calcSliceIndex();
      if (sliceIndex === newSliceIndex && !isFirstRenderRef.current) {
        return;
      }

      setSliceIndex(newSliceIndex);
      isFirstRenderRef.current = false;
    });
  }, [mode, calcSliceIndex, sliceIndex]);

  // 设置 ResizeObserver（使用 useLayoutEffect 确保同步）
  useLayoutEffect(() => {
    if (mode === 'horizontal' && menuRef.current) {
      // 初始化 ResizeObserver
      resizeObserverRef.current = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserverRef.current.observe(menuRef.current);
      
      // 首次计算
      handleResize();
    }
    
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
      if (resizeFrameRef.current !== null) {
        cancelAnimationFrame(resizeFrameRef.current);
        resizeFrameRef.current = null;
      }
    };
  }, [mode]);

  // 监听菜单变化
  useEffect(() => {
    if (mode === 'horizontal') {
      isFirstRenderRef.current = true;
      handleResize();
    }
  }, [menus]);

  useEffect(() => {
    const nextCount =
      mode !== 'vertical' || canVirtualize
        ? menus.length
        : Math.min(RENDER_CHUNK, menus.length);
    setRenderCount((prev) => (prev === nextCount ? prev : nextCount));
  }, [mode, menus.length, canVirtualize]);

  useEffect(() => {
    if (mode !== 'vertical' || canVirtualize || renderCount >= menus.length) return;
    const frame = requestAnimationFrame(() => {
      setRenderCount((prev) => Math.min(prev + RENDER_CHUNK, menus.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, canVirtualize, renderCount, menus.length]);

  useEffect(() => {
    if (mode !== 'vertical' || !collapse) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const container = menuEl.closest('.layout-scroll-container') as HTMLElement | null;
    if (!container) return;
    scrollContainerRef.current = container;

    const updateMetrics = () => {
      const nextHeight = container.clientHeight;
      setViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
      const computedStyle = getComputedStyle(menuEl);
      const heightValue = parseFloat(computedStyle.getPropertyValue('--menu-item-height'));
      if (Number.isFinite(heightValue) && heightValue > 0) {
        setItemHeight((prev) => (prev === heightValue ? prev : heightValue));
      }
      const firstItem = menuEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
      if (firstItem) {
        const measuredHeight = firstItem.getBoundingClientRect().height;
        if (measuredHeight > 0) {
          setItemHeight((prev) => (prev === measuredHeight ? prev : measuredHeight));
        }
      }
    };
    const handleScroll = () => {
      const nextTop = container.scrollTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    };

    updateMetrics();
    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    const useWindowResize = typeof ResizeObserver === 'undefined';
    if (useWindowResize) {
      window.addEventListener('resize', updateMetrics);
    } else {
      const observer = new ResizeObserver(updateMetrics);
      observer.observe(container);
      scrollResizeObserverRef.current = observer;
    }
    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (useWindowResize) {
        window.removeEventListener('resize', updateMetrics);
      }
      if (scrollResizeObserverRef.current) {
        scrollResizeObserverRef.current.disconnect();
        scrollResizeObserverRef.current = null;
      }
    };
  }, [mode, collapse]);

  useEffect(() => {
    if (mode !== 'vertical' || !collapse || typeof ResizeObserver === 'undefined') return;
    const menuEl = menuRef.current;
    if (!menuEl) return;
    let observedItem = menuEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
    if (!observedItem) return;
    const observer = new ResizeObserver(() => {
      const currentItem = menuEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
      if (!currentItem) return;
      if (observedItem !== currentItem) {
        if (observedItem) {
          observer.unobserve(observedItem);
        }
        observer.observe(currentItem);
        observedItem = currentItem;
      }
      const measuredHeight = currentItem.getBoundingClientRect().height;
      if (measuredHeight > 0) {
        setItemHeight((prev) => (prev === measuredHeight ? prev : measuredHeight));
      }
    });
    observer.observe(observedItem);
    itemResizeObserverRef.current = observer;
    return () => {
      if (itemResizeObserverRef.current) {
        itemResizeObserverRef.current.disconnect();
        itemResizeObserverRef.current = null;
      }
    };
  }, [mode, collapse, menus.length]);

  // 可见菜单和溢出菜单
  const baseVisibleMenus = useMemo(() => {
    if (mode === 'horizontal') {
      if (sliceIndex === -1) {
        return menus;
      }
      return menus.slice(0, sliceIndex);
    }
    if (mode === 'vertical') {
      return menus.slice(0, renderCount);
    }
    return menus;
  }, [menus, mode, sliceIndex, renderCount]);

  const virtualTotalHeight = menus.length * itemHeight;
  const virtualStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - VIRTUAL_OVERSCAN);
  const virtualEndIndex = Math.min(
    menus.length,
    Math.ceil((scrollTop + viewportHeight) / itemHeight) + VIRTUAL_OVERSCAN
  );
  const virtualMenus = useMemo(
    () => menus.slice(virtualStartIndex, virtualEndIndex),
    [menus, virtualStartIndex, virtualEndIndex]
  );
  const renderMenus = canVirtualize ? virtualMenus : baseVisibleMenus;
  const listStyle = canVirtualize
    ? {
        paddingTop: `${virtualStartIndex * itemHeight}px`,
        paddingBottom: `${(menus.length - virtualEndIndex) * itemHeight}px`,
      }
    : undefined;

  useEffect(() => {
    if (!canVirtualize) return;
    const maxScrollTop = Math.max(0, virtualTotalHeight - viewportHeight);
    if (scrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = nextTop;
    }
    setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [canVirtualize, virtualTotalHeight, viewportHeight, scrollTop]);

  const overflowMenus = useMemo(() => {
    if (mode !== 'horizontal' || sliceIndex === -1) {
      return [];
    }
    return menus.slice(sliceIndex);
  }, [menus, mode, sliceIndex]);

  const hasOverflow = overflowMenus.length > 0;

  // 上下文值
  const contextValue: MenuContextValue = useMemo(() => ({
    config: { mode, collapse, accordion, rounded, theme },
    activePath,
    activeParentSet,
    openedMenus,
    openedMenuSet,
    openMenu,
    closeMenu,
    closeAllMenus,
    handleMenuItemClick,
    isMenuPopup,
  }), [mode, collapse, accordion, rounded, theme, activePath, activeParentSet, openedMenus, openedMenuSet, openMenu, closeMenu, closeAllMenus, handleMenuItemClick, isMenuPopup]);

  // 菜单类名
  const menuClassName = useMemo(() => {
    const classes = ['menu', `menu--${mode}`, `menu--${theme}`];
    if (collapse) classes.push('menu--collapse');
    if (rounded) classes.push('menu--rounded');
    return classes.join(' ');
  }, [mode, theme, collapse, rounded]);

  return (
    <MenuProvider value={contextValue}>
      <ul
        ref={menuRef}
        className={menuClassName}
        data-mode={mode}
        data-theme={theme}
        data-rounded={rounded ? 'true' : undefined}
        data-collapse={collapse ? 'true' : undefined}
        style={listStyle}
      >
        {renderMenus.map(item => (
          item.children && item.children.length > 0 ? (
            <SubMenu key={item.key} item={item} level={0} />
          ) : (
            <MenuItemComp key={item.key} item={item} level={0} />
          )
        ))}
        
        {/* 更多按钮（溢出菜单） */}
        {hasOverflow && (
          <SubMenu
            item={{ key: '__more__', name: '更多', children: overflowMenus }}
            level={0}
            isMore
          />
        )}
      </ul>
    </MenuProvider>
  );
});
