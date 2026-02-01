/**
 * 子菜单组件
 * @description 支持弹出层模式（水平/折叠）和折叠模式（垂直展开）
 */
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from 'react';
import { createPortal } from 'react-dom';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  type Placement,
} from '@floating-ui/react';
import { useMenuContext, useSubMenuContext, SubMenuProvider } from './useMenuContext';
import { MenuItem as MenuItemComp } from './MenuItem';
import type { MenuItem } from '@admin-core/layout';

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

  // 路径
  const path = item.key || item.path || '';

  // 父级路径
  const parentPaths = useMemo(() => {
    const paths: string[] = [];
    // 简化处理，从父级上下文获取
    if (parentSubMenu) {
      paths.push(parentSubMenu.path);
    }
    return paths;
  }, [parentSubMenu]);

  // 是否展开
  const opened = menuContext.openedMenus.includes(path);

  // 是否激活（有子菜单激活）
  const active = useMemo(() => {
    const checkActive = (items: MenuItem[]): boolean => {
      for (const menuItem of items) {
        if (menuItem.key === menuContext.activePath || menuItem.path === menuContext.activePath) {
          return true;
        }
        if (menuItem.children?.length && checkActive(menuItem.children)) {
          return true;
        }
      }
      return false;
    };
    return item.children ? checkActive(item.children) : false;
  }, [item.children, menuContext.activePath]);

  // 是否为一级菜单
  const isFirstLevel = level === 0;

  // 是否为弹出模式
  const isPopup = menuContext.isMenuPopup;

  // Floating UI
  const placement: Placement = useMemo(() => {
    if (menuContext.config.mode === 'horizontal' && isFirstLevel) {
      return 'bottom-start';
    }
    return 'right-start';
  }, [menuContext.config.mode, isFirstLevel]);

  const { refs, floatingStyles } = useFloating({
    placement,
    middleware: [
      offset(menuContext.config.mode === 'horizontal' && isFirstLevel ? 4 : 8),
      flip({ fallbackPlacements: ['left-start', 'top-start', 'bottom-start'] }),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

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
    
    hoverTimerRef.current = setTimeout(() => {
      menuContext.openMenu(path, parentPaths);
    }, 300);
  }, [menuContext, parentSubMenu, item.disabled, path, parentPaths]);

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
    
    hoverTimerRef.current = setTimeout(() => {
      if (!mouseInChild) {
        menuContext.closeMenu(path, parentPaths);
      }
    }, 300);
    
    if (deepDispatch) {
      parentSubMenu?.handleMouseleave?.(true);
    }
  }, [menuContext, parentSubMenu, mouseInChild, path, parentPaths]);

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
  const subMenuClassName = useMemo(() => [
    'menu__sub-menu',
    active && 'menu__sub-menu--active',
    opened && 'menu__sub-menu--opened',
    item.disabled && 'menu__sub-menu--disabled',
    isMore && 'menu__sub-menu--more',
    `menu__sub-menu--level-${level}`,
  ]
    .filter(Boolean)
    .join(' '), [active, opened, item.disabled, isMore, level]);

  const contentClassName = useMemo(() => [
    'menu__sub-menu-content',
    active && 'menu__sub-menu-content--active',
  ]
    .filter(Boolean)
    .join(' '), [active]);

  // 子菜单上下文值
  const subMenuContextValue = useMemo(() => ({
    path,
    level,
    mouseInChild,
    setMouseInChild,
    handleMouseleave,
  }), [path, level, mouseInChild, handleMouseleave]);

  // 渲染子菜单内容
  const renderChildren = () => (
    item.children?.map(child => (
      child.children && child.children.length > 0 ? (
        <SubMenu key={child.key} item={child} level={level + 1} />
      ) : (
        <MenuItemComp key={child.key} item={child} level={level + 1} />
      )
    ))
  );

  return (
    <SubMenuProvider value={subMenuContextValue}>
      <li className={subMenuClassName}>
        {/* 弹出模式 */}
        {isPopup ? (
          <>
            {/* 触发器 */}
            <div
              ref={refs.setReference}
              className={contentClassName}
              onMouseEnter={handleMouseenter}
              onMouseLeave={() => handleMouseleave()}
              onClick={handleClick}
            >
              {/* 更多按钮图标 */}
              {isMore ? (
                <span className="menu__icon menu__more-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor" width={18} height={18}>
                    <circle cx="5" cy="12" r="2" />
                    <circle cx="12" cy="12" r="2" />
                    <circle cx="19" cy="12" r="2" />
                  </svg>
                </span>
              ) : (
                <>
                  {item.icon && (
                    <span className="menu__icon">{item.icon}</span>
                  )}
                  <span className="menu__name">{item.name}</span>
                  <span className="menu__arrow" style={arrowStyle}>
                    {arrowIcon === 'down' ? (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    )}
                  </span>
                </>
              )}
            </div>
            
            {/* 弹出层 */}
            {opened && createPortal(
              <div
                ref={refs.setFloating}
                className={`menu__popup menu__popup--${menuContext.config.theme} menu__popup--level-${level}`}
                style={floatingStyles}
                onMouseEnter={handlePopupMouseenter}
                onMouseLeave={handlePopupMouseleave}
              >
                <ul className={`menu__popup-list ${menuContext.config.rounded ? 'menu--rounded' : ''}`}>
                  {renderChildren()}
                </ul>
              </div>,
              document.body
            )}
          </>
        ) : (
          /* 折叠模式（垂直展开） */
          <>
            {/* 触发器 */}
            <div className={contentClassName} onClick={handleClick}>
              {item.icon && (
                <span className="menu__icon">{item.icon}</span>
              )}
              <span className="menu__name">{item.name}</span>
              <span className="menu__arrow" style={arrowStyle}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M6 9l6 6 6-6" />
                </svg>
              </span>
            </div>
            
            {/* 子菜单列表 */}
            {opened && (
              <ul className="menu__sub-list">
                {renderChildren()}
              </ul>
            )}
          </>
        )}
      </li>
    </SubMenuProvider>
  );
});
