/**
 * 菜单项组件。
 * @description 负责渲染叶子节点菜单项并处理点击选中逻辑。
 */
import { calculateMenuItemPadding, type MenuItem as MenuItemType } from '@admin-core/layout';
import { useMemo, useCallback, memo } from 'react';
import { MenuIcon } from './MenuIcon';
import { useMenuContext, useSubMenuContext } from './use-menu-context';

/** 扩展菜单项类型：支持激活态图标。 */
type MenuItemWithActiveIcon = MenuItemType & {
  /** 激活态图标。 */
  activeIcon?: string;
};

/**
 * 菜单叶子节点参数。
 * @description 定义叶子菜单项数据与层级信息。
 */
export interface MenuItemProps {
  /** 菜单项数据。 */
  item: MenuItemType;
  /** 层级。 */
  level: number;
}

/**
 * 菜单项组件。
 * @description 渲染叶子菜单节点并处理点击选中与可访问性属性。
 * @param props 组件参数。
 * @returns 菜单项节点。
 */
export const MenuItem = memo(function MenuItem({ item, level }: MenuItemProps) {
  const menuContext = useMenuContext();
  const parentSubMenu = useSubMenuContext();

  /**
   * 菜单项原始路径值（优先 key，其次 path）。
   */
  const rawPath = item.key ?? item.path ?? '';
  /**
   * 规范化后的菜单项路径。
   */
  const path = rawPath === '' ? '' : String(rawPath);
  /**
   * 当前激活路径字符串。
   */
  const activePath = menuContext.activePath === '' ? '' : String(menuContext.activePath);

  /**
   * 当前菜单项是否处于激活态。
   */
  const active = path !== '' && path === activePath;

  const menuIcon = useMemo(() => {
    const itemWithActiveIcon = item as MenuItemWithActiveIcon;
    return active ? (itemWithActiveIcon.activeIcon || item.icon) : item.icon;
  }, [active, item]);

  /**
   * 处理叶子菜单点击，并收集父级路径链后派发到菜单上下文。
   */
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

  /**
   * 菜单项样式类名集合。
   */
  const itemClassName = useMemo(() => {
    const classes = ['menu__item', `menu__item--level-${level}`];
    if (active) classes.push('menu__item--active');
    if (item.disabled) classes.push('menu__item--disabled');
    return classes.join(' ');
  }, [active, item.disabled, level]);

  /**
   * 垂直模式下的层级缩进样式。
   */
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
