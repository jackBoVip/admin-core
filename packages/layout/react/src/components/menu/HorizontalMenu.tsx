/**
 * 水平菜单组件
 * @description 封装 Menu 组件，用于顶栏水平导航
 */
import {
  getCachedMenuPathIndex,
  normalizeMenuKey,
  resolveMenuByPathIndex,
  type MenuItem,
} from '@admin-core/layout';
import { useCallback, useMemo, memo } from 'react';
import { useLayoutContext } from '../../hooks';
import { Menu } from './Menu';

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

const EMPTY_MENUS: MenuItem[] = [];

export const HorizontalMenu = memo(function HorizontalMenu({
  menus = EMPTY_MENUS,
  activeKey = '',
  align = 'start',
  theme = 'light',
  onSelect,
}: HorizontalMenuProps) {
  const context = useLayoutContext();

  const menuIndex = useMemo(() => getCachedMenuPathIndex(menus), [menus]);

  // 处理菜单选择
  const handleSelect = useCallback((path: string, _parentPaths: string[]) => {
    const key = normalizeMenuKey(path);
    const item = resolveMenuByPathIndex(menuIndex, key);
    if (item) {
      onSelect?.(item, key);
      context.events?.onMenuSelect?.(item, key);
      
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
        defaultActive={activeKey === '' ? '' : String(activeKey)}
        theme={theme}
        mode="horizontal"
        rounded
        moreLabel={context.t('layout.common.more')}
        onSelect={handleSelect}
      />
    </div>
  );
});
