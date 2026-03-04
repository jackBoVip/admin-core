/**
 * 子菜单组件。
 * @description 支持弹出层模式（水平/折叠）与折叠模式（垂直展开）。
 */
import { LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  type Placement,
} from '@floating-ui/react';
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  memo,
  startTransition,
} from 'react';
import { createPortal } from 'react-dom';
import { renderLayoutIcon } from '../../utils';
import { MenuIcon } from './MenuIcon';
import { MenuItem as MenuItemComp } from './MenuItem';
import { useMenuContext, useSubMenuContext, SubMenuProvider } from './use-menu-context';

/**
 * 子菜单组件参数。
 * @description 定义子菜单项数据、层级与“更多”按钮标识。
 */
export interface SubMenuProps {
  /** 菜单项数据。 */
  item: MenuItem;
  /** 层级。 */
  level: number;
  /** 是否为更多按钮。 */
  isMore?: boolean;
}

/**
 * 子菜单组件。
 * @description 渲染包含子节点的菜单分支，并处理展开收起与弹层定位逻辑。
 * @param props 组件参数。
 * @returns 子菜单节点。
 */
export const SubMenu = memo(function SubMenu({
  item,
  level,
  isMore = false,
}: SubMenuProps) {
  const menuContext = useMenuContext();
  const parentSubMenu = useSubMenuContext();

  /**
   * 鼠标是否在当前子菜单内容区域内。
   */
  const [mouseInChild, setMouseInChild] = useState(false);
  /**
   * 悬停展开/收起延时器引用。
   */
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /**
   * 子菜单增量渲染批次大小。
   */
  const CHILD_RENDER_CHUNK = LAYOUT_UI_TOKENS.SUB_MENU_RENDER_CHUNK;
  /**
   * 当前已渲染的子菜单项数量。
   */
  const [childRenderCount, setChildRenderCount] = useState<number>(CHILD_RENDER_CHUNK);
  /**
   * 弹出层容器引用。
   */
  const popupRef = useRef<HTMLDivElement>(null);
  /**
   * 弹出层滚动偏移。
   */
  const [popupScrollTop, setPopupScrollTop] = useState(0);
  /**
   * 弹出层视口高度。
   */
  const [popupViewportHeight, setPopupViewportHeight] = useState(0);
  /**
   * 弹出层菜单项高度估计值。
   */
  const [popupItemHeight, setPopupItemHeight] = useState(40);
  /**
   * 弹出层尺寸观察器引用。
   */
  const popupResizeObserverRef = useRef<ResizeObserver | null>(null);
  /**
   * 弹出层首项尺寸观察器引用。
   */
  const popupItemResizeObserverRef = useRef<ResizeObserver | null>(null);
  /**
   * 弹出层节点是否已挂载。
   */
  const [popupMounted, setPopupMounted] = useState(false);
  /**
   * 弹出层是否可见（用于进入/退出动画）。
   */
  const [popupVisible, setPopupVisible] = useState(false);
  /**
   * 弹出层慢速过渡时长常量。
   */
  const POPUP_SLOW_DURATION = LAYOUT_UI_TOKENS.POPUP_SLOW_DURATION;

  /**
   * 子菜单原始路径值（优先 key，其次 path）。
   */
  const rawPath = item.key ?? item.path ?? '';
  /**
   * 规范化后的子菜单路径。
   */
  const path = rawPath === '' ? '' : String(rawPath);

  /**
   * 当前子菜单的父级路径链。
   */
  const parentPaths = useMemo(() => {
    const paths: string[] = [];
    let parent = parentSubMenu;
    while (parent) {
      paths.unshift(String(parent.path));
      parent = parent.parent ?? null;
    }
    return paths;
  }, [parentSubMenu]);

  /**
   * 当前子菜单是否处于展开状态。
   */
  const opened = path ? menuContext.openedMenuSet.has(path) : false;

  /**
   * 是否处于弹出子菜单模式。
   */
  const isPopup = menuContext.isMenuPopup;
  /**
   * 是否启用弹出层过渡动画。
   */
  const shouldAnimatePopup = menuContext.config.mode === 'horizontal';
  /**
   * 弹出层传送目标节点。
   */
  const portalTarget = typeof document === 'undefined' ? null : document.body;

  /**
   * 当前子菜单或其后代是否激活。
   */
  const active = useMemo(
    () => (path ? menuContext.activeParentSet.has(path) : false),
    [menuContext.activeParentSet, path]
  );

  useEffect(() => {
    const total = item.children?.length ?? 0;
    const nextCount = isPopup
      ? total
      : Math.min(CHILD_RENDER_CHUNK, total);
    setChildRenderCount((prev) => (prev === nextCount ? prev : nextCount));
  }, [isPopup, opened, item.children?.length, CHILD_RENDER_CHUNK]);

  useEffect(() => {
    const total = item.children?.length ?? 0;
    if (isPopup || !opened || childRenderCount >= total) return;
    const frame = requestAnimationFrame(() => {
      setChildRenderCount((prev) => Math.min(prev + CHILD_RENDER_CHUNK, total));
    });
    return () => cancelAnimationFrame(frame);
  }, [isPopup, opened, childRenderCount, item.children?.length, CHILD_RENDER_CHUNK]);

  useEffect(() => {
    if (!opened || !isPopup) return;
    const popupEl = popupRef.current;
    if (!popupEl) return;
    const computedStyle = getComputedStyle(popupEl);
    const heightValue = parseFloat(computedStyle.getPropertyValue('--menu-item-height'));
    if (Number.isFinite(heightValue) && heightValue > 0) {
      setPopupItemHeight((prev) => (prev === heightValue ? prev : heightValue));
    }
    const firstItem = popupEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
    if (firstItem) {
      const measuredHeight = firstItem.getBoundingClientRect().height;
      if (measuredHeight > 0) {
        setPopupItemHeight((prev) => (prev === measuredHeight ? prev : measuredHeight));
      }
    }
    setPopupScrollTop((prev) => (prev === 0 ? prev : 0));
    const nextHeight = popupEl.clientHeight;
    setPopupViewportHeight((prev) => (prev === nextHeight ? prev : nextHeight));
    const handleResize = rafThrottle(() => {
      const nextResizeHeight = popupEl.clientHeight;
      setPopupViewportHeight((prev) => (prev === nextResizeHeight ? prev : nextResizeHeight));
    });
    const useWindowResize = typeof ResizeObserver === 'undefined';
    if (useWindowResize) {
      window.addEventListener('resize', handleResize);
    } else {
      const observer = new ResizeObserver(handleResize);
      observer.observe(popupEl);
      popupResizeObserverRef.current = observer;
    }
    if (typeof ResizeObserver !== 'undefined') {
      let observedItem = popupEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
      if (observedItem) {
        const observer = new ResizeObserver(() => {
          const currentItem = popupEl.querySelector('.menu__item, .menu__sub-menu-content') as HTMLElement | null;
          if (!currentItem) return;
          if (currentItem !== observedItem) {
            if (observedItem) {
              observer.unobserve(observedItem);
            }
            observer.observe(currentItem);
            observedItem = currentItem;
          }
          const measuredHeight = currentItem.getBoundingClientRect().height;
          if (measuredHeight > 0) {
            setPopupItemHeight((prev) => (prev === measuredHeight ? prev : measuredHeight));
          }
        });
        observer.observe(observedItem);
        popupItemResizeObserverRef.current = observer;
      }
    }
    /**
     * 处理弹层滚轮事件，接管默认行为以维持弹层滚动体验。
     *
     * @param e 原生滚轮事件。
     */
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return;
      e.preventDefault();
      popupEl.scrollTop += e.deltaY;
    };
    popupEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      if (popupResizeObserverRef.current) {
        popupResizeObserverRef.current.disconnect();
        popupResizeObserverRef.current = null;
      }
      if (popupItemResizeObserverRef.current) {
        popupItemResizeObserverRef.current.disconnect();
        popupItemResizeObserverRef.current = null;
      }
      if (useWindowResize) {
        window.removeEventListener('resize', handleResize);
      }
      popupEl.removeEventListener('wheel', handleWheel);
    };
  }, [opened, isPopup, item.children?.length]);

  /**
   * 当前节点是否为一级子菜单。
   */
  const isFirstLevel = level === 0;

  /**
   * 弹出层定位方位。
   */
  const placement: Placement = useMemo(() => {
    if (menuContext.config.mode === 'horizontal' && isFirstLevel) {
      return 'bottom-start';
    }
    return 'right-start';
  }, [menuContext.config.mode, isFirstLevel]);

  const { refs, floatingStyles, isPositioned } = useFloating({
    placement,
    middleware: [
      offset(menuContext.config.mode === 'horizontal' && isFirstLevel ? 4 : 8),
      flip({ fallbackPlacements: ['left-start', 'top-start', 'bottom-start'] }),
      shift({ padding: 8 }),
    ],
    open: opened,
    transform: !shouldAnimatePopup,
    whileElementsMounted: autoUpdate,
  });

  useEffect(() => {
    if (!isPopup) {
      if (popupMounted) setPopupMounted(false);
      if (popupVisible) setPopupVisible(false);
      return;
    }
    if (!shouldAnimatePopup) {
      setPopupMounted(opened);
      setPopupVisible(opened);
      return;
    }
    if (opened) {
      setPopupMounted(true);
      return;
    }
    if (popupVisible) setPopupVisible(false);
    const timer = window.setTimeout(() => setPopupMounted(false), POPUP_SLOW_DURATION);
    return () => window.clearTimeout(timer);
  }, [opened, isPopup, shouldAnimatePopup, popupMounted, popupVisible, POPUP_SLOW_DURATION]);

  useEffect(() => {
    if (!shouldAnimatePopup) return;
    if (!popupMounted) return;
    if (!isPositioned) return;
    const frame = requestAnimationFrame(() => setPopupVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [popupMounted, isPositioned, shouldAnimatePopup]);

  /**
   * 处理子菜单触发器悬停，按模式决定是否自动展开。
   */
  const handleMouseenter = useCallback(() => {
    /**
     * 垂直非折叠模式下由点击控制展开，不执行悬停展开。
     */
    if (!menuContext.config.collapse && menuContext.config.mode === 'vertical') {
      if (parentSubMenu) {
        parentSubMenu.setMouseInChild(true);
      }
      return;
    }
    
    if (item.disabled) return;
    
    if (parentSubMenu) {
      parentSubMenu.setMouseInChild(true);
    }
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    if (opened) return;

    hoverTimerRef.current = setTimeout(() => {
      menuContext.openMenu(path, parentPaths);
    }, 300);
  }, [menuContext, parentSubMenu, item.disabled, opened, path, parentPaths]);

  /**
   * 处理子菜单触发器移出，按需延迟关闭并向父级级联。
   *
   * @param deepDispatch 是否向上级联关闭事件。
   */
  const handleMouseleave = useCallback((deepDispatch = false) => {
    /**
     * 垂直非折叠模式下仅同步父级鼠标状态，不执行自动关闭。
     */
    if (!menuContext.config.collapse && menuContext.config.mode === 'vertical' && parentSubMenu) {
      parentSubMenu.setMouseInChild(false);
      return;
    }
    
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
    
    if (parentSubMenu) {
      parentSubMenu.setMouseInChild(false);
    }

    if (!opened) {
      if (deepDispatch) {
        parentSubMenu?.handleMouseleave?.(true);
      }
      return;
    }
    
    hoverTimerRef.current = setTimeout(() => {
      if (!mouseInChild) {
        menuContext.closeMenu(path, parentPaths);
      }
    }, 300);
    
    if (deepDispatch) {
      parentSubMenu?.handleMouseleave?.(true);
    }
  }, [menuContext, parentSubMenu, mouseInChild, opened, path, parentPaths]);

  /**
   * 处理弹出层鼠标进入，保持子菜单展开态。
   */
  const handlePopupMouseenter = useCallback(() => {
    setMouseInChild(true);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  /**
   * 处理弹出层鼠标离开，触发级联关闭流程。
   */
  const handlePopupMouseleave = useCallback(() => {
    setMouseInChild(false);
    handleMouseleave(true);
  }, [handleMouseleave]);

  /**
   * 同步弹出层滚动位置到状态，驱动虚拟渲染区间更新。
   *
   * @param e React 滚动事件对象。
   */
  const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setPopupScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  /**
   * 处理子菜单点击，在垂直非折叠模式下切换展开状态。
   */
  const handleClick = useCallback(() => {
    if (item.disabled) return;

    /**
     * 垂直非折叠模式下通过点击切换展开状态。
     */
    if (menuContext.config.mode === 'vertical' && !menuContext.config.collapse) {
      /**
       * 使用 `startTransition` 避免展开状态更新阻塞渲染。
       */
      startTransition(() => {
        if (opened) {
          menuContext.closeMenu(path, parentPaths);
        } else {
          menuContext.openMenu(path, parentPaths);
        }
      });
    }
  }, [item.disabled, menuContext, opened, path, parentPaths]);

  /**
   * 组件卸载时清理悬停定时器。
   */
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, []);

  /**
   * 子菜单箭头图标方向。
   */
  const arrowIcon = useMemo(() => {
    /**
     * 水平非一级菜单或垂直折叠菜单使用右箭头。
     */
    if ((menuContext.config.mode === 'horizontal' && !isFirstLevel) ||
        (menuContext.config.mode === 'vertical' && menuContext.config.collapse)) {
      return 'right';
    }
    /**
     * 其他场景使用下箭头。
     */
    return 'down';
  }, [menuContext.config.mode, menuContext.config.collapse, isFirstLevel]);

  /**
   * 箭头样式状态。
   */
  const arrowStyle = useMemo(() => {
    if (arrowIcon === 'down' && opened) {
      return { transform: 'rotate(180deg)' };
    }
    return {};
  }, [arrowIcon, opened]);

  /**
   * 子菜单根节点类名。
   */
  const subMenuClassName = useMemo(() => {
    const classes = ['menu__sub-menu', `menu__sub-menu--level-${level}`];
    if (active) classes.push('menu__sub-menu--active');
    if (opened) classes.push('menu__sub-menu--opened');
    if (item.disabled) classes.push('menu__sub-menu--disabled');
    if (isMore) classes.push('menu__sub-menu--more');
    return classes.join(' ');
  }, [active, opened, item.disabled, isMore, level]);

  const contentClassName = useMemo(() => 'menu__sub-menu-content', []);

  /**
   * 子菜单上下文值对象。
   */
  const subMenuContextValue = useMemo(() => ({
    path,
    level,
    mouseInChild,
    setMouseInChild,
    handleMouseleave,
    parent: parentSubMenu,
  }), [path, level, mouseInChild, handleMouseleave, parentSubMenu]);

  /**
   * 弹层子菜单原始子项集合。
   */
  const popupChildren = useMemo(() => item.children ?? [], [item.children]);
  const popupStartIndex = Math.max(0, Math.floor(popupScrollTop / popupItemHeight) - 4);
  const popupEndIndex = Math.min(
    popupChildren.length,
    Math.ceil((popupScrollTop + popupViewportHeight) / popupItemHeight) + 4
  );
  const popupVisibleChildren = useMemo(
    () => popupChildren.slice(popupStartIndex, popupEndIndex),
    [popupChildren, popupStartIndex, popupEndIndex]
  );
  const popupListStyle = useMemo(() => {
    if (!isPopup) return undefined;
    const paddingTop = popupStartIndex * popupItemHeight;
    const paddingBottom = (popupChildren.length - popupEndIndex) * popupItemHeight;
    return {
      paddingTop: `${paddingTop}px`,
      paddingBottom: `${paddingBottom}px`,
    };
  }, [isPopup, popupChildren.length, popupEndIndex, popupItemHeight, popupStartIndex]);

  useEffect(() => {
    if (!isPopup || !opened) return;
    const totalHeight = popupChildren.length * popupItemHeight;
    const maxScrollTop = Math.max(0, totalHeight - popupViewportHeight);
    if (popupScrollTop <= maxScrollTop) return;
    const nextTop = Math.max(0, maxScrollTop);
    const popupEl = popupRef.current;
    if (popupEl) {
      popupEl.scrollTop = nextTop;
    }
    setPopupScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, [isPopup, opened, popupChildren.length, popupItemHeight, popupViewportHeight, popupScrollTop]);

  const visibleChildren = useMemo(
    () => (item.children ?? []).slice(0, childRenderCount),
    [item.children, childRenderCount]
  );

  /**
   * 渲染子菜单节点列表，按是否有子级递归渲染 `SubMenu` 或 `MenuItem`。
   *
   * @param children 待渲染子菜单集合。
   * @returns 渲染节点列表。
   */
  const renderChildren = (children: MenuItem[]) => (
    children.map(child => (
      child.children && child.children.length > 0 ? (
        <SubMenu key={child.key} item={child} level={level + 1} />
      ) : (
        <MenuItemComp key={child.key} item={child} level={level + 1} />
      )
    ))
  );

  return (
    <SubMenuProvider value={subMenuContextValue}>
      <li
        className={`${subMenuClassName} data-active:text-primary data-disabled:opacity-50`}
        data-state={active ? 'active' : 'inactive'}
        data-disabled={item.disabled ? 'true' : undefined}
        data-opened={opened ? 'true' : undefined}
        data-more={isMore ? 'true' : undefined}
        data-level={level}
      >
        {/* 弹出模式 */}
        {isPopup ? (
          <>
            {/* 触发器 */}
            <div
              ref={refs.setReference}
              className={`${contentClassName} data-active:text-primary data-disabled:opacity-50`}
              data-state={active ? 'active' : 'inactive'}
              data-disabled={item.disabled ? 'true' : undefined}
              onMouseEnter={handleMouseenter}
              onMouseLeave={() => handleMouseleave()}
              onClick={handleClick}
            >
              {/* 更多按钮图标 */}
              {isMore ? (
                <span className="menu__icon menu__more-icon">
                  {renderLayoutIcon('tabbar-more', 'sm', 'text-current')}
                </span>
              ) : (
                <>
                  {item.icon && (
                    <span className="menu__icon">
                      <MenuIcon icon={item.icon} size="h-full w-full" />
                    </span>
                  )}
                  <span className="menu__name">{item.name}</span>
                  <span className="menu__arrow" style={arrowStyle}>
                    {arrowIcon === 'down'
                      ? renderLayoutIcon('menu-arrow-down', 'sm')
                      : renderLayoutIcon('menu-arrow-right', 'sm')}
                  </span>
                </>
              )}
            </div>
            
            {/* 弹出层 */}
            {(isPopup && (shouldAnimatePopup ? popupMounted : opened) && portalTarget) && createPortal(
              <div
                ref={(node) => {
                  refs.setFloating(node);
                  popupRef.current = node;
                }}
                className={`menu__popup menu__popup--${menuContext.config.theme} menu__popup--level-${level} ${
                  shouldAnimatePopup ? 'menu__popup--slow' : ''
                }`}
                data-theme={menuContext.config.theme}
                data-level={level}
                data-state={shouldAnimatePopup ? (popupVisible ? 'open' : 'closed') : 'open'}
                style={floatingStyles}
                onMouseEnter={handlePopupMouseenter}
                onMouseLeave={handlePopupMouseleave}
                onScroll={handlePopupScroll}
              >
                <ul
                  className={`menu__popup-list ${menuContext.config.rounded ? 'menu--rounded' : ''}`}
                  data-rounded={menuContext.config.rounded ? 'true' : undefined}
                  style={popupListStyle}
                >
                  {renderChildren(isPopup ? popupVisibleChildren : visibleChildren)}
                </ul>
              </div>,
              portalTarget
            )}
          </>
        ) : (
          /* 折叠模式（垂直展开） */
          <>
            {/* 触发器 */}
            <div
              className={`${contentClassName} data-active:text-primary data-disabled:opacity-50`}
              data-state={active ? 'active' : 'inactive'}
              data-disabled={item.disabled ? 'true' : undefined}
              onClick={handleClick}
            >
              {item.icon && (
                <span className="menu__icon">
                  <MenuIcon icon={item.icon} size="h-full w-full" />
                </span>
              )}
              <span className="menu__name">{item.name}</span>
              <span className="menu__arrow" style={arrowStyle}>
                {renderLayoutIcon('menu-arrow-down', 'sm')}
              </span>
            </div>
            
            {/* 子菜单列表 */}
            {opened && (
              <ul className="menu__sub-list">
                {renderChildren(visibleChildren)}
              </ul>
            )}
          </>
        )}
      </li>
    </SubMenuProvider>
  );
});
