/**
 * 侧边栏菜单组件
 * @description 自动渲染菜单数据，支持多级嵌套
 * 折叠状态下支持悬停弹出子菜单（类似 vben）
 */

import { useState, useCallback, useMemo, useRef, useEffect, memo } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutContext, useLayoutComputed } from '../../hooks';
import { useMenuState, useSidebarState } from '../../hooks/use-layout-state';
import type { MenuItem } from '@admin-core/layout';
import {
  hasChildren,
  isMenuActive,
  hasActiveChild as checkHasActiveChild,
  getMenuItemClassName,
} from '@admin-core/layout';
import { renderIcon } from '../../utils/icon-renderer';

interface MenuItemProps {
  item: MenuItem;
  level: number;
  collapsed: boolean;
  expandOnHovering: boolean;
  expandedKeys: Set<string>;
  activeKey: string;
  onToggleExpand: (key: string) => void;
  onSelect: (key: string) => void;
  onShowPopup: (item: MenuItem, event: React.MouseEvent) => void;
  onHidePopup: () => void;
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
  onToggleExpand,
  onSelect,
  onShowPopup,
  onHidePopup,
}: MenuItemProps) {
  const isExpanded = expandedKeys.has(item.key);
  const isActive = isMenuActive(item, activeKey);
  const hasChildrenItems = hasChildren(item);
  const hasActiveChildItem = checkHasActiveChild(item, activeKey);
  
  const showName = !collapsed || expandOnHovering;

  const handleClick = useCallback(() => {
    if (hasChildrenItems) {
      if (collapsed && !expandOnHovering) {
        // 折叠状态下，点击有子菜单的项不做任何操作（由悬停处理）
        return;
      }
      onToggleExpand(item.key);
    } else {
      onSelect(item.key);
    }
  }, [hasChildrenItems, item.key, onToggleExpand, onSelect, collapsed, expandOnHovering]);

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (collapsed && !expandOnHovering && hasChildrenItems) {
      onShowPopup(item, e);
    }
  }, [collapsed, expandOnHovering, hasChildrenItems, item, onShowPopup]);

  const itemClassName = getMenuItemClassName(item, {
    level,
    isActive,
    isExpanded,
    hasActiveChild: hasActiveChildItem,
  });

  if (item.hidden) return null;

  return (
    <div className="sidebar-menu__group">
      <div 
        className={itemClassName} 
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

        {/* 折叠状态下有子菜单时显示右侧小箭头 */}
        {hasChildrenItems && collapsed && !expandOnHovering && (
          <span className="sidebar-menu__arrow-right">
            <svg
              className="h-3 w-3"
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

      {/* 子菜单 */}
      {hasChildrenItems && showName && isExpanded && (
        <div className="sidebar-menu__submenu">
          {item.children!
            .filter((child) => !child.hidden)
            .map((child) => (
              <MenuItemComponent
                key={child.key}
                item={child}
                level={level + 1}
                collapsed={collapsed}
                expandOnHovering={expandOnHovering}
                expandedKeys={expandedKeys}
                activeKey={activeKey}
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
  theme,
  onSelect,
  onMouseEnter,
  onMouseLeave,
}: PopupMenuProps) {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(() => {
    // 自动展开有激活子菜单的项
    const keys = new Set<string>();
    const expandActiveChildren = (children: MenuItem[]) => {
      for (const child of children) {
        if (checkHasActiveChild(child, activeKey) || isMenuActive(child, activeKey)) {
          keys.add(child.key);
          if (child.children) {
            expandActiveChildren(child.children);
          }
        }
      }
    };
    if (item.children) {
      expandActiveChildren(item.children);
    }
    return keys;
  });

  const toggleExpand = useCallback((key: string) => {
    setExpandedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const handleItemClick = useCallback((menuItem: MenuItem) => {
    if (hasChildren(menuItem)) {
      toggleExpand(menuItem.key);
    } else {
      onSelect(menuItem.key);
    }
  }, [toggleExpand, onSelect]);

  const renderPopupItem = (menuItem: MenuItem, level: number): React.ReactNode => {
    if (menuItem.hidden) return null;

    const isActive = isMenuActive(menuItem, activeKey);
    const hasActiveChild = checkHasActiveChild(menuItem, activeKey);
    const isExpanded = expandedKeys.has(menuItem.key);
    const hasChildrenItems = hasChildren(menuItem);

    const itemClass = [
      'sidebar-menu__popup-item',
      isActive && 'sidebar-menu__popup-item--active',
      hasActiveChild && 'sidebar-menu__popup-item--has-active-child',
      level > 0 && `sidebar-menu__popup-item--level-${level}`,
    ].filter(Boolean).join(' ');

    return (
      <div key={menuItem.key} className="sidebar-menu__popup-group">
        <div className={itemClass} onClick={() => handleItemClick(menuItem)}>
          {menuItem.icon && (
            <span className="sidebar-menu__popup-icon">
              {renderIcon(menuItem.icon, 'sm')}
            </span>
          )}
          <span className="sidebar-menu__popup-name">{menuItem.name}</span>
          {hasChildrenItems && (
            <span className={`sidebar-menu__popup-arrow ${isExpanded ? 'sidebar-menu__popup-arrow--expanded' : ''}`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </span>
          )}
        </div>
        {hasChildrenItems && isExpanded && (
          <div className="sidebar-menu__popup-submenu">
            {menuItem.children!.map(child => renderPopupItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return createPortal(
    <div
      className={`sidebar-menu__popup sidebar-menu__popup--${theme}`}
      style={{ top: `${top}px`, left: `${left}px` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="sidebar-menu__popup-title">{item.name}</div>
      <div className="sidebar-menu__popup-content">
        {item.children?.map(child => renderPopupItem(child, 0))}
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
  
  // 侧边栏主题（用于弹出菜单）
  const sidebarTheme = computed.sidebarTheme || 'light';

  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(openKeys)
  );

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

  const menus = useMemo<MenuItem[]>(
    () => context.props.menus || [],
    [context.props.menus]
  );

  const toggleExpand = useCallback(
    (key: string) => {
      setExpandedKeys((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        handleOpenChange(Array.from(next));
        return next;
      });
    },
    [handleOpenChange]
  );

  const showPopupMenu = useCallback((item: MenuItem, event: React.MouseEvent) => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }

    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const sidebar = target.closest('.layout-sidebar');
    const sidebarRect = sidebar?.getBoundingClientRect();

    setPopupState({
      item,
      visible: true,
      top: rect.top,
      left: sidebarRect ? sidebarRect.right : rect.right,
    });
  }, []);

  const hidePopupMenu = useCallback(() => {
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
    };
  }, []);

  return (
    <>
      <nav className="sidebar-menu">
        {menus
          .filter((item) => !item.hidden)
          .map((item) => (
            <MenuItemComponent
              key={item.key}
              item={item}
              level={0}
              collapsed={collapsed}
              expandOnHovering={expandOnHovering}
              expandedKeys={expandedKeys}
              activeKey={activeKey}
              onToggleExpand={toggleExpand}
              onSelect={handleSelect}
              onShowPopup={showPopupMenu}
              onHidePopup={hidePopupMenu}
            />
          ))}
      </nav>

      {/* 折叠状态下的弹出菜单 */}
      {popupState.visible && popupState.item && collapsed && !expandOnHovering && (
        <PopupMenu
          item={popupState.item}
          top={popupState.top}
          left={popupState.left}
          activeKey={activeKey}
          theme={sidebarTheme}
          onSelect={handlePopupSelect}
          onMouseEnter={cancelHidePopup}
          onMouseLeave={hidePopupMenu}
        />
      )}
    </>
  );
}
