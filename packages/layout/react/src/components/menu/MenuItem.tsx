/**
 * 菜单项组件
 * @description 叶子节点菜单项
 */
import { calculateMenuItemPadding, type MenuItem as MenuItemType } from '@admin-core/layout';
import { useMemo, useCallback, memo } from 'react';
import { MenuIcon } from './MenuIcon';
import { useMenuContext, useSubMenuContext } from './use-menu-context';

export interface MenuItemProps {
  /** 菜单项数据 */
  item: MenuItemType;
  /** 层级 */
  level: number;
}

export const MenuItem = memo(function MenuItem({ item, level }: MenuItemProps) {
  const menuContext = useMenuContext();
  const parentSubMenu = useSubMenuContext();

  const rawPath = item.key ?? item.path ?? '';
  const path = rawPath === '' ? '' : String(rawPath);
  const activePath = menuContext.activePath === '' ? '' : String(menuContext.activePath);

  // 是否激活
  const active = path !== '' && path === activePath;

  // 图标（激活时使用 activeIcon）
  const menuIcon = useMemo(() => {
    const itemWithActiveIcon = item as MenuItemType & { activeIcon?: string };
    return active ? (itemWithActiveIcon.activeIcon || item.icon) : item.icon;
  }, [active, item]);

  // 点击处理
  const handleClick = useCallback(() => {
    if (item.disabled) return;
    const parentPaths: string[] = [];
    let parent = parentSubMenu;
    while (parent) {
      parentPaths.unshift(String(parent.path));
      parent = parent.parent ?? null;
    }

    menuContext.handleMenuItemClick({
      path,
      parentPaths,
    });
  }, [item.disabled, menuContext, parentSubMenu, path]);

  // 类名
  const itemClassName = useMemo(() => {
    const classes = ['menu__item', `menu__item--level-${level}`];
    if (active) classes.push('menu__item--active');
    if (item.disabled) classes.push('menu__item--disabled');
    return classes.join(' ');
  }, [active, item.disabled, level]);

  // 缩进样式（垂直模式）
  const indentStyle = useMemo(() => {
    if (menuContext.config.mode === 'vertical' && !menuContext.config.collapse) {
      return {
        paddingLeft: `${calculateMenuItemPadding(level)}px`,
      };
    }
    return {};
  }, [menuContext.config.mode, menuContext.config.collapse, level]);

  return (
    <li
      className={`${itemClassName} data-active:text-primary data-disabled:opacity-50`}
      data-state={active ? 'active' : 'inactive'}
      data-disabled={item.disabled ? 'true' : undefined}
      data-level={level}
      style={indentStyle}
      onClick={handleClick}
    >
      {/* 图标 */}
      {menuIcon && (
        <span className="menu__icon">
          <MenuIcon icon={menuIcon} size="h-full w-full" />
        </span>
      )}
      
      {/* 名称 */}
      <span className="menu__name">{item.name}</span>
      
      {/* 徽章 */}
      {item.badge && (
        <span
          className={`menu__badge ${item.badgeType ? `menu__badge--${item.badgeType}` : ''}`}
          data-badge={item.badgeType}
        >
          {item.badge}
        </span>
      )}
    </li>
  );
});
