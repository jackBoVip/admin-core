/**
 * 菜单项组件
 * @description 叶子节点菜单项
 */
import { useMemo, useCallback, memo } from 'react';
import { useMenuContext, useSubMenuContext } from './useMenuContext';
import type { MenuItem as MenuItemType } from '@admin-core/layout';

export interface MenuItemProps {
  /** 菜单项数据 */
  item: MenuItemType;
  /** 层级 */
  level: number;
}

export const MenuItem = memo(function MenuItem({ item, level }: MenuItemProps) {
  const menuContext = useMenuContext();
  const parentSubMenu = useSubMenuContext();

  // 路径
  const path = item.key || item.path || '';

  // 父级路径
  const parentPaths = useMemo(() => {
    const paths: string[] = [];
    if (parentSubMenu) {
      paths.push(parentSubMenu.path);
    }
    return paths;
  }, [parentSubMenu]);

  // 是否激活
  const active = path === menuContext.activePath;

  // 图标（激活时使用 activeIcon）
  const menuIcon = useMemo(() => {
    const itemWithActiveIcon = item as MenuItemType & { activeIcon?: string };
    return active ? (itemWithActiveIcon.activeIcon || item.icon) : item.icon;
  }, [active, item]);

  // 点击处理
  const handleClick = useCallback(() => {
    if (item.disabled) return;
    
    menuContext.handleMenuItemClick({
      path,
      parentPaths,
    });
  }, [item.disabled, menuContext, path, parentPaths]);

  // 类名
  const itemClassName = useMemo(() => [
    'menu__item',
    active && 'menu__item--active',
    item.disabled && 'menu__item--disabled',
    `menu__item--level-${level}`,
  ]
    .filter(Boolean)
    .join(' '), [active, item.disabled, level]);

  // 缩进样式（垂直模式）
  const indentStyle = useMemo(() => {
    if (menuContext.config.mode === 'vertical' && !menuContext.config.collapse) {
      return {
        paddingLeft: `${16 + level * 16}px`,
      };
    }
    return {};
  }, [menuContext.config.mode, menuContext.config.collapse, level]);

  return (
    <li
      className={itemClassName}
      style={indentStyle}
      onClick={handleClick}
    >
      {/* 图标 */}
      {menuIcon && (
        <span className="menu__icon">{menuIcon}</span>
      )}
      
      {/* 名称 */}
      <span className="menu__name">{item.name}</span>
      
      {/* 徽章 */}
      {item.badge && (
        <span className={`menu__badge ${item.badgeType ? `menu__badge--${item.badgeType}` : ''}`}>
          {item.badge}
        </span>
      )}
    </li>
  );
});
