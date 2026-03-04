/**
 * 菜单组件。
 * @description 参考常见 Admin 布局实现，支持水平/垂直模式、折叠、手风琴与溢出处理。
 * 行为逻辑（激活/展开/溢出/类名等）统一由 `@admin-core/layout` 的 headless menu-controller 处理。
 */
import {
  LAYOUT_UI_TOKENS,
  rafThrottle,
  calculateVirtualRange,
  shouldVirtualize,
  type MenuItem,
  normalizeMenuKey,
  buildMenuParentPathMap,
  buildActiveParentSet,
  computeOpenedMenusOnOpen,
  computeOpenedMenusOnClose,
  computeOpenedMenusOnCollapseChange,
  isMenuPopup as computeIsMenuPopup,
  computeBaseVisibleMenus,
  computeOverflowMenus,
  getMenuRootClassName,
} from '@admin-core/layout';
import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
  startTransition,
} from 'react';
import { MenuItem as MenuItemComp } from './MenuItem';
import { SubMenu } from './SubMenu';
import { MenuProvider, type MenuContextValue, type MenuItemClicked } from './use-menu-context';

/**
 * 菜单组件参数。
 * @description 定义菜单数据、显示模式、默认状态与交互回调。
 */
export interface MenuProps {
  /** 菜单数据。 */
  menus?: MenuItem[];
  /** 布局模式。 */
  mode?: 'horizontal' | 'vertical';
  /** 是否折叠（仅垂直模式）。 */
  collapse?: boolean;
  /** 是否启用手风琴模式。 */
  accordion?: boolean;
  /** 是否使用圆角样式。 */
  rounded?: boolean;
  /** 主题。 */
  theme?: 'light' | 'dark';
  /** 默认激活路径。 */
  defaultActive?: string;
  /** 默认展开的菜单路径集合。 */
  defaultOpeneds?: string[];
  /** 选中菜单项时触发。 */
  onSelect?: (path: string, parentPaths: string[]) => void;
  /** 展开子菜单时触发。 */
  onOpen?: (path: string, parentPaths: string[]) => void;
  /** 收起子菜单时触发。 */
  onClose?: (path: string, parentPaths: string[]) => void;
  /** 更多菜单文本。 */
  moreLabel?: string;
}

/**
 * 菜单容器组件。
 * @description 统一管理菜单展开/选中状态、水平溢出与纵向虚拟滚动渲染。
 * @param props 组件参数。
 * @returns 菜单容器节点。
 */
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
  moreLabel = 'More',
}: MenuProps) {
  /**
   * 当前激活菜单路径。
   */
  const [activePath, setActivePath] = useState(() => normalizeMenuKey(defaultActive));
  /**
   * 当前展开的子菜单路径集合（有序数组）。
   */
  const [openedMenus, setOpenedMenus] = useState<string[]>(
    defaultOpeneds && !collapse
      ? defaultOpeneds.map((key) => normalizeMenuKey(key)).filter(Boolean)
      : []
  );
  /**
   * 展开菜单集合（Set 视图），用于快速判定展开态。
   */
  const openedMenuSet = useMemo(() => new Set(openedMenus), [openedMenus]);

  /**
   * 同步外部 `defaultActive` 到内部激活路径状态。
   */
  useEffect(() => {
    const nextActive = normalizeMenuKey(defaultActive);
    setActivePath(prev => (prev === nextActive ? prev : nextActive));
  }, [defaultActive]);

  /**
   * 响应折叠状态变化，折叠时自动收起已展开菜单。
   */
  useEffect(() => {
    setOpenedMenus((prev) => computeOpenedMenusOnCollapseChange(prev, collapse));
  }, [collapse]);

  /**
   * 当前菜单是否处于弹出模式（水平模式或折叠垂直模式）。
   */
  const isMenuPopup = computeIsMenuPopup(mode, collapse);

  /**
   * 菜单父级路径索引映射。
   */
  const parentPathMap = useMemo(
    () => buildMenuParentPathMap(menus),
    [menus],
  );

  /**
   * 当前激活路径对应的父级路径集合。
   */
  const activeParentSet = useMemo(
    () => buildActiveParentSet(activePath, parentPathMap),
    [activePath, parentPathMap],
  );

  /**
   * 打开指定菜单，并按手风琴策略维护展开路径。
   *
   * @param path 目标菜单路径。
   * @param parentPaths 父级路径链。
   */
  const openMenu = useCallback((path: string, parentPaths: string[] = []) => {
    setOpenedMenus(prev => {
      const next = computeOpenedMenusOnOpen(prev, path, {
        accordion,
        parentPaths,
      });
      return next;
    });
    const normalizedTarget = normalizeMenuKey(path);
    const normalizedParents = parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);
    if (normalizedTarget) {
      onOpen?.(normalizedTarget, normalizedParents);
    }
  }, [accordion, onOpen]);

  /**
   * 关闭指定菜单。
   *
   * @param path 目标菜单路径。
   * @param parentPaths 父级路径链。
   */
  const closeMenu = useCallback((path: string, parentPaths: string[] = []) => {
    const target = normalizeMenuKey(path);
    if (!target) return;
    const normalizedParents = parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);
    setOpenedMenus(prev => computeOpenedMenusOnClose(prev, target));
    onClose?.(target, normalizedParents);
  }, [onClose]);

  /**
   * 关闭所有已展开菜单。
   */
  const closeAllMenus = useCallback(() => {
    setOpenedMenus([]);
  }, []);

  /**
   * 处理菜单项点击，更新激活路径并在弹出模式下收起全部展开项。
   *
   * @param data 菜单点击上下文。
   */
  const handleMenuItemClick = useCallback((data: MenuItemClicked) => {
    const normalizedPath = normalizeMenuKey(data.path);
    const normalizedParents = data.parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);
    if (!normalizedPath) return;
    
    /**
     * 使用 `startTransition` 降低点击更新对渲染主路径的阻塞。
     */
    startTransition(() => {
      /**
       * 弹出模式下点击菜单项后关闭全部展开菜单。
       */
      if (isMenuPopup) {
        setOpenedMenus((prev) => (prev.length > 0 ? [] : prev));
      }

      setActivePath(prev => (prev === normalizedPath ? prev : normalizedPath));
      onSelect?.(normalizedPath, normalizedParents);
    });
  }, [isMenuPopup, onSelect]);

  /**
   * 菜单列表元素引用。
   */
  const menuRef = useRef<HTMLUListElement>(null);
  /**
   * 水平溢出切片索引，`-1` 表示不溢出。
   */
  const [sliceIndex, setSliceIndex] = useState(-1);
  /**
   * 切片索引引用缓存，避免异步回调闭包陈旧。
   */
  const sliceIndexRef = useRef(sliceIndex);
  /**
   * 菜单尺寸观察器引用。
   */
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  /**
   * 首次渲染标记，用于抑制无效状态更新。
   */
  const isFirstRenderRef = useRef(true);
  /**
   * `requestAnimationFrame` 回调句柄引用。
   */
  const resizeFrameRef = useRef<number | null>(null);

  /**
   * 同步切片索引到引用缓存。
   */
  useEffect(() => {
    sliceIndexRef.current = sliceIndex;
  }, [sliceIndex]);
  /**
   * 逐帧增量渲染批次大小。
   */
  const RENDER_CHUNK = LAYOUT_UI_TOKENS.MENU_RENDER_CHUNK;
  /**
   * 当前已渲染菜单项数量（虚拟/增量渲染控制）。
   */
  const [renderCount, setRenderCount] = useState<number>(RENDER_CHUNK);
  /**
   * 垂直模式滚动容器引用。
   */
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  /**
   * 当前滚动偏移。
   */
  const [scrollTop, setScrollTop] = useState(0);
  /**
   * 当前可视区域高度。
   */
  const [viewportHeight, setViewportHeight] = useState(0);
  /**
   * 菜单项行高估计值。
   */
  const [itemHeight, setItemHeight] = useState(40);
  /**
   * 虚拟列表上下预渲染项数量。
   */
  const VIRTUAL_OVERSCAN = LAYOUT_UI_TOKENS.VIRTUAL_OVERSCAN;
  /**
   * 滚动容器尺寸观察器引用。
   */
  const scrollResizeObserverRef = useRef<ResizeObserver | null>(null);
  /**
   * 菜单项尺寸观察器引用。
   */
  const itemResizeObserverRef = useRef<ResizeObserver | null>(null);

  const canVirtualize = useMemo(
    () =>
      shouldVirtualize({
        enabled: mode === 'vertical' && collapse,
        viewportHeight,
        itemHeight,
        totalItems: menus.length,
      }),
    [mode, collapse, viewportHeight, itemHeight, menus.length]
  );

  /**
   * 计算菜单项占位宽度（含左右外边距）。
   *
   * @param menuItem 菜单项元素。
   * @returns 占位宽度。
   */
  const calcMenuItemWidth = useCallback((menuItem: HTMLElement): number => {
    const computedStyle = getComputedStyle(menuItem);
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
    return menuItem.offsetWidth + marginLeft + marginRight;
  }, []);

  /**
   * 计算横向菜单溢出分割索引。
   *
   * @returns 不溢出时返回 `-1`，否则返回“更多”按钮前的分割索引。
   */
  const calcSliceIndex = useCallback((): number => {
    if (!menuRef.current) return -1;
    
    /**
     * 获取菜单直接子节点，过滤注释与空文本节点。
     */
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
    const widthTarget = menuRef.current.parentElement ?? menuRef.current;
    const computedMenuStyle = getComputedStyle(widthTarget);
    const paddingLeft = parseInt(computedMenuStyle.paddingLeft, 10) || 0;
    const paddingRight = parseInt(computedMenuStyle.paddingRight, 10) || 0;
    const menuWidth = widthTarget.clientWidth - paddingLeft - paddingRight;
    
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

  /**
   * 处理横向菜单容器尺寸变化并更新溢出分割索引。
   */
  const handleResize = useCallback(() => {
    if (resizeFrameRef.current !== null) return;

    resizeFrameRef.current = requestAnimationFrame(() => {
      resizeFrameRef.current = null;

      if (mode !== 'horizontal') {
        if (sliceIndexRef.current !== -1) {
          setSliceIndex(-1);
        }
        return;
      }

      const newSliceIndex = calcSliceIndex();
      if (sliceIndexRef.current === newSliceIndex && !isFirstRenderRef.current) {
        return;
      }

      setSliceIndex(newSliceIndex);
      isFirstRenderRef.current = false;
    });
  }, [mode, calcSliceIndex]);

  /**
   * 建立横向模式下的尺寸监听，并在卸载时清理观察器与动画帧任务。
   */
  useLayoutEffect(() => {
    if (mode === 'horizontal' && menuRef.current) {
      const resizeTarget = menuRef.current.parentElement ?? menuRef.current;
      /**
       * 初始化容器尺寸观察器。
       */
      resizeObserverRef.current = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserverRef.current.observe(resizeTarget);

      /**
       * 首次挂载后立即执行一次溢出计算。
       */
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
  }, [mode, handleResize]);

  /**
   * 监听菜单数据变化并在横向模式下重算溢出切片索引。
   */
  useEffect(() => {
    if (mode === 'horizontal') {
      isFirstRenderRef.current = true;
      handleResize();
    }
  }, [menus, mode, handleResize]);

  useEffect(() => {
    const nextCount =
      mode !== 'vertical' || canVirtualize
        ? menus.length
        : Math.min(RENDER_CHUNK, menus.length);
    setRenderCount((prev) => (prev === nextCount ? prev : nextCount));
  }, [mode, menus.length, canVirtualize, RENDER_CHUNK]);

  useEffect(() => {
    if (mode !== 'vertical' || canVirtualize || renderCount >= menus.length) return;
    const frame = requestAnimationFrame(() => {
      setRenderCount((prev) => Math.min(prev + RENDER_CHUNK, menus.length));
    });
    return () => cancelAnimationFrame(frame);
  }, [mode, canVirtualize, renderCount, menus.length, RENDER_CHUNK]);

  useEffect(() => {
    if (mode !== 'vertical' || !collapse) return;
    const menuEl = menuRef.current;
    if (!menuEl) return;
    const container = menuEl.closest('.layout-scroll-container') as HTMLElement | null;
    if (!container) return;
    scrollContainerRef.current = container;

    /**
     * 同步虚拟滚动所需的容器高度与菜单项高度。
     */
    const updateMetrics = rafThrottle(() => {
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
    });
    /**
     * 同步滚动容器 `scrollTop` 到组件状态。
     */
    const handleScroll = rafThrottle(() => {
      const nextTop = container.scrollTop;
      setScrollTop((prev) => (prev === nextTop ? prev : nextTop));
    });

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

  /**
   * 基础可见菜单集合（不含虚拟化切片）。
   */
  const baseVisibleMenus = useMemo(
    () =>
      computeBaseVisibleMenus({
        menus,
        mode,
        sliceIndex,
        renderCount,
      }),
    [menus, mode, sliceIndex, renderCount],
  );

  const virtualTotalHeight = menus.length * itemHeight;
  const virtualRange = useMemo(
    () =>
      calculateVirtualRange({
        scrollTop,
        viewportHeight,
        itemHeight,
        totalItems: menus.length,
        overscan: VIRTUAL_OVERSCAN,
      }),
    [scrollTop, viewportHeight, itemHeight, menus.length, VIRTUAL_OVERSCAN]
  );
  const virtualMenus = useMemo(
    () => menus.slice(virtualRange.startIndex, virtualRange.endIndex),
    [menus, virtualRange.startIndex, virtualRange.endIndex]
  );
  const renderMenus = canVirtualize ? virtualMenus : baseVisibleMenus;
  const listStyle = canVirtualize
    ? {
        paddingTop: `${virtualRange.startIndex * itemHeight}px`,
        paddingBottom: `${(menus.length - virtualRange.endIndex) * itemHeight}px`,
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

  const overflowMenus = useMemo(
    () =>
      computeOverflowMenus({
        menus,
        mode,
        sliceIndex,
      }),
    [menus, mode, sliceIndex],
  );

  const hasOverflow = overflowMenus.length > 0;

  /**
   * 菜单上下文值对象。
   */
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

  /**
   * 菜单根节点类名。
   */
  const menuClassName = useMemo(
    () =>
      getMenuRootClassName({
        mode,
        theme,
        collapse,
        rounded,
      }),
    [mode, theme, collapse, rounded],
  );

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
            item={{ key: '__more__', name: moreLabel, children: overflowMenus }}
            level={0}
            isMore
          />
        )}
      </ul>
    </MenuProvider>
  );
});
