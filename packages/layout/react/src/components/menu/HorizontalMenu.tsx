/**
 * 水平菜单组件
 * @description 封装 Menu 组件，用于顶栏水平导航
 */
import { useCallback, useMemo, memo } from 'react';
import { Menu } from './Menu';
import { useLayoutContext } from '../../hooks';
import type { MenuItem } from '@admin-core/layout';

export interface HorizontalMenuProps {
  /** 菜单数据 */
  menus?: MenuItem[];
  /** 当前激活的菜单 key */
  activeKey?: string;
  /** 菜单对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 选择回调 */
  onSelect?: (item: MenuItem, key: string) => void;
}

export const HorizontalMenu = memo(function HorizontalMenu({
  menus = [],
  activeKey = '',
  align = 'start',
  theme = 'light',
  onSelect,
}: HorizontalMenuProps) {
  const context = useLayoutContext();

  const menuIndex = useMemo(() => {
    const map = new Map<string, MenuItem>();
    const walk = (items: MenuItem[]) => {
      items.forEach((item) => {
        if (item.key) map.set(item.key, item);
        if (item.path) map.set(item.path, item);
        if (item.children?.length) walk(item.children);
      });
    };
    walk(menus);
    return map;
  }, [menus]);

  // 处理菜单选择
  const handleSelect = useCallback((path: string, _parentPaths: string[]) => {
    const item = menuIndex.get(path);
    if (item) {
      onSelect?.(item, path);
      context.events?.onMenuSelect?.(item, path);
      
      // 路由导航
      if (context.props.router && item.path) {
        context.props.router.navigate(item.path, {
          params: item.params,
          query: item.query,
        });
      }
    }
  }, [menuIndex, onSelect, context]);

  // 容器类名
  const containerClassName = useMemo(
    () => `header-menu-container w-full min-w-0 header-menu-container--align-${align}`,
    [align]
  );

  return (
    <div className={containerClassName} data-align={align}>
      <Menu
        menus={menus}
        defaultActive={activeKey}
        theme={theme}
        mode="horizontal"
        rounded
        onSelect={handleSelect}
      />
    </div>
  );
});
