/**
 * 子菜单组件
 * @description 支持弹出层模式（水平/折叠）和折叠模式（垂直展开）
 */
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
} from 'react';
import { createPortal } from 'react-dom';
import { MenuItem as MenuItemComp } from './MenuItem';
import { MenuIcon } from './MenuIcon';
import { useMenuContext, useSubMenuContext, SubMenuProvider } from './use-menu-context';
import { renderLayoutIcon } from '../../utils';
import { LAYOUT_UI_TOKENS, rafThrottle, type MenuItem } from '@admin-core/layout';

export interface SubMenuProps {
  /** 菜单项数据 */
  item: MenuItem;
  /** 层级 */
  level: number;
  /** 是否为更多按钮 */
  isMore?: boolean;
}

export const SubMenu = memo(function SubMenu({
  item,
  level,
  isMore = false,
}: SubMenuProps) {
  const menuContext = useMenuContext();
  const parentSubMenu = useSubMenuContext();

  // 状态
  const [mouseInChild, setMouseInChild] = useState(false);
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const CHILD_RENDER_CHUNK = LAYOUT_UI_TOKENS.SUB_MENU_RENDER_CHUNK;
  const [childRenderCount, setChildRenderCount] = useState<number>(CHILD_RENDER_CHUNK);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupScrollTop, setPopupScrollTop] = useState(0);
  const [popupViewportHeight, setPopupViewportHeight] = useState(0);
  const [popupItemHeight, setPopupItemHeight] = useState(40);
  const popupResizeObserverRef = useRef<ResizeObserver | null>(null);
  const popupItemResizeObserverRef = useRef<ResizeObserver | null>(null);
  const [popupMounted, setPopupMounted] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const POPUP_SLOW_DURATION = 500;

  const rawPath = item.key ?? item.path ?? '';
  const path = rawPath === '' ? '' : String(rawPath);

  // 父级路径
  const parentPaths = useMemo(() => {
    const paths: string[] = [];
    // 简化处理，从父级上下文获取
    if (parentSubMenu) {
      paths.push(String(parentSubMenu.path));
    }
    return paths;
  }, [parentSubMenu]);

  // 是否展开
  const opened = path ? menuContext.openedMenuSet.has(path) : false;

  // 是否为弹出模式
  const isPopup = menuContext.isMenuPopup;
  const shouldAnimatePopup = menuContext.config.mode === 'horizontal';

  // 是否激活（有子菜单激活）
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
  }, [isPopup, opened, item.children?.length]);

  useEffect(() => {
    const total = item.children?.length ?? 0;
    if (isPopup || !opened || childRenderCount >= total) return;
    const frame = requestAnimationFrame(() => {
      setChildRenderCount((prev) => Math.min(prev + CHILD_RENDER_CHUNK, total));
    });
    return () => cancelAnimationFrame(frame);
  }, [isPopup, opened, childRenderCount, item.children?.length]);

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

  // 是否为一级菜单
  const isFirstLevel = level === 0;

  // Floating UI
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
  }, [opened, isPopup, shouldAnimatePopup]);

  useEffect(() => {
    if (!shouldAnimatePopup) return;
    if (!popupMounted) return;
    if (!isPositioned) return;
    const frame = requestAnimationFrame(() => setPopupVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [popupMounted, isPositioned, shouldAnimatePopup]);

  // 悬停事件处理
  const handleMouseenter = useCallback(() => {
    // 垂直非折叠模式不自动展开
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

  const handleMouseleave = useCallback((deepDispatch = false) => {
    // 垂直非折叠模式
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

  // 弹出层内的事件处理
  const handlePopupMouseenter = useCallback(() => {
    setMouseInChild(true);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  }, []);

  const handlePopupMouseleave = useCallback(() => {
    setMouseInChild(false);
    handleMouseleave(true);
  }, [handleMouseleave]);

  const handlePopupScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const nextTop = e.currentTarget.scrollTop;
    setPopupScrollTop((prev) => (prev === nextTop ? prev : nextTop));
  }, []);

  // 点击处理（垂直模式切换展开）
  const handleClick = useCallback(() => {
    if (item.disabled) return;
    
    // 垂直非折叠模式：切换展开状态
    if (menuContext.config.mode === 'vertical' && !menuContext.config.collapse) {
      if (opened) {
        menuContext.closeMenu(path, parentPaths);
      } else {
        menuContext.openMenu(path, parentPaths);
      }
    }
  }, [item.disabled, menuContext, opened, path, parentPaths]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current);
        hoverTimerRef.current = null;
      }
    };
  }, []);

  // 箭头图标
  const arrowIcon = useMemo(() => {
    // 水平模式非一级、或垂直折叠模式：右箭头
    if ((menuContext.config.mode === 'horizontal' && !isFirstLevel) ||
        (menuContext.config.mode === 'vertical' && menuContext.config.collapse)) {
      return 'right';
    }
    // 其他：下箭头
    return 'down';
  }, [menuContext.config.mode, menuContext.config.collapse, isFirstLevel]);

  // 箭头样式
  const arrowStyle = useMemo(() => {
    if (arrowIcon === 'down' && opened) {
      return { transform: 'rotate(180deg)' };
    }
    return {};
  }, [arrowIcon, opened]);

  // 类名
  const subMenuClassName = useMemo(() => {
    const classes = ['menu__sub-menu', `menu__sub-menu--level-${level}`];
    if (active) classes.push('menu__sub-menu--active');
    if (opened) classes.push('menu__sub-menu--opened');
    if (item.disabled) classes.push('menu__sub-menu--disabled');
    if (isMore) classes.push('menu__sub-menu--more');
    return classes.join(' ');
  }, [active, opened, item.disabled, isMore, level]);

  const contentClassName = useMemo(() => 'menu__sub-menu-content', []);

  // 子菜单上下文值
  const subMenuContextValue = useMemo(() => ({
    path,
    level,
    mouseInChild,
    setMouseInChild,
    handleMouseleave,
  }), [path, level, mouseInChild, handleMouseleave]);

  // 渲染子菜单内容
  const popupChildren = item.children ?? [];
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
            {(isPopup && (shouldAnimatePopup ? popupMounted : opened)) && createPortal(
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
              document.body
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
