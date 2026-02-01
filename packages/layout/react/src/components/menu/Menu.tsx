/**
 * 菜单组件
 * @description 参考 vben-admin 实现，支持水平/垂直模式、折叠、手风琴等
 */
import {
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
  useRef,
  memo,
} from 'react';
import { MenuProvider, type MenuContextValue, type MenuItemClicked } from './useMenuContext';
import { SubMenu } from './SubMenu';
import { MenuItem as MenuItemComp } from './MenuItem';
import type { MenuItem } from '@admin-core/layout';

export interface MenuProps {
  /** 菜单数据 */
  menus?: MenuItem[];
  /** 模式 */
  mode?: 'horizontal' | 'vertical';
  /** 是否折叠（仅垂直模式） */
  collapse?: boolean;
  /** 手风琴模式 */
  accordion?: boolean;
  /** 圆角样式 */
  rounded?: boolean;
  /** 主题 */
  theme?: 'light' | 'dark';
  /** 默认激活路径 */
  defaultActive?: string;
  /** 默认展开的菜单 */
  defaultOpeneds?: string[];
  /** 选择回调 */
  onSelect?: (path: string, parentPaths: string[]) => void;
  /** 展开回调 */
  onOpen?: (path: string, parentPaths: string[]) => void;
  /** 关闭回调 */
  onClose?: (path: string, parentPaths: string[]) => void;
}

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
}: MenuProps) {
  // 状态
  const [activePath, setActivePath] = useState(defaultActive);
  const [openedMenus, setOpenedMenus] = useState<string[]>(
    defaultOpeneds && !collapse ? [...defaultOpeneds] : []
  );

  // 同步 defaultActive
  useEffect(() => {
    setActivePath(defaultActive);
  }, [defaultActive]);

  // 折叠时关闭所有菜单
  useEffect(() => {
    if (collapse) {
      setOpenedMenus([]);
    }
  }, [collapse]);

  // 是否为弹出模式
  const isMenuPopup = mode === 'horizontal' || (mode === 'vertical' && collapse);

  // 打开菜单
  const openMenu = useCallback((path: string, parentPaths: string[] = []) => {
    setOpenedMenus(prev => {
      if (prev.includes(path)) return prev;
      
      let newOpenedMenus = [...prev];
      
      // 手风琴模式：关闭同级其他菜单
      if (accordion) {
        newOpenedMenus = newOpenedMenus.filter(menu => parentPaths.includes(menu));
      }
      
      newOpenedMenus.push(path);
      return newOpenedMenus;
    });
    onOpen?.(path, parentPaths);
  }, [accordion, onOpen]);

  // 关闭菜单
  const closeMenu = useCallback((path: string, parentPaths: string[] = []) => {
    setOpenedMenus(prev => {
      const index = prev.indexOf(path);
      if (index === -1) return prev;
      const newOpenedMenus = [...prev];
      newOpenedMenus.splice(index, 1);
      return newOpenedMenus;
    });
    onClose?.(path, parentPaths);
  }, [onClose]);

  // 关闭所有菜单
  const closeAllMenus = useCallback(() => {
    setOpenedMenus([]);
  }, []);

  // 处理菜单项点击
  const handleMenuItemClick = useCallback((data: MenuItemClicked) => {
    const { path, parentPaths } = data;
    
    // 弹出模式下点击菜单项关闭所有菜单
    if (isMenuPopup) {
      setOpenedMenus([]);
    }
    
    setActivePath(path);
    onSelect?.(path, parentPaths);
  }, [isMenuPopup, onSelect]);

  // 溢出处理（仅水平模式）
  const menuRef = useRef<HTMLUListElement>(null);
  const [sliceIndex, setSliceIndex] = useState(-1);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const isFirstRenderRef = useRef(true);

  // 计算菜单项宽度（参考 vben 实现）
  const calcMenuItemWidth = useCallback((menuItem: HTMLElement): number => {
    const computedStyle = getComputedStyle(menuItem);
    const marginLeft = parseInt(computedStyle.marginLeft, 10) || 0;
    const marginRight = parseInt(computedStyle.marginRight, 10) || 0;
    return menuItem.offsetWidth + marginLeft + marginRight;
  }, []);

  // 计算切片索引（参考 vben 实现）
  const calcSliceIndex = useCallback((): number => {
    if (!menuRef.current) return -1;
    
    // 获取所有直接子节点（排除注释和空文本）
    const items = [...(menuRef.current.childNodes ?? [])].filter(
      (item) =>
        item.nodeName !== '#comment' &&
        (item.nodeName !== '#text' || item.nodeValue)
    ) as HTMLElement[];
    
    if (items.length === 0) return -1;
    
    const moreItemWidth = 46;
    const computedMenuStyle = getComputedStyle(menuRef.current);
    const paddingLeft = parseInt(computedMenuStyle.paddingLeft, 10) || 0;
    const paddingRight = parseInt(computedMenuStyle.paddingRight, 10) || 0;
    const menuWidth = menuRef.current.clientWidth - paddingLeft - paddingRight;
    
    let calcWidth = 0;
    let sliceIdx = 0;
    
    items.forEach((item, index) => {
      calcWidth += calcMenuItemWidth(item);
      if (calcWidth <= menuWidth - moreItemWidth) {
        sliceIdx = index + 1;
      }
    });
    
    return sliceIdx === items.length ? -1 : sliceIdx;
  }, [calcMenuItemWidth]);

  // 处理 resize（参考 vben 实现）
  const handleResize = useCallback(() => {
    if (mode !== 'horizontal') {
      setSliceIndex(-1);
      return;
    }
    
    // 如果切片索引没变，不更新
    const newSliceIndex = calcSliceIndex();
    if (sliceIndex === newSliceIndex && !isFirstRenderRef.current) {
      return;
    }
    
    const callback = () => {
      setSliceIndex(-1);
      // 使用 setTimeout 模拟 nextTick
      setTimeout(() => {
        setSliceIndex(calcSliceIndex());
      }, 0);
    };
    
    // 首次渲染直接执行
    if (isFirstRenderRef.current) {
      callback();
      isFirstRenderRef.current = false;
    } else {
      callback();
    }
  }, [mode, calcSliceIndex, sliceIndex]);

  // 设置 ResizeObserver（使用 useLayoutEffect 确保同步）
  useLayoutEffect(() => {
    if (mode === 'horizontal' && menuRef.current) {
      // 初始化 ResizeObserver
      resizeObserverRef.current = new ResizeObserver(() => {
        handleResize();
      });
      resizeObserverRef.current.observe(menuRef.current);
      
      // 首次计算
      handleResize();
    }
    
    return () => {
      resizeObserverRef.current?.disconnect();
      resizeObserverRef.current = null;
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // 监听菜单变化
  useEffect(() => {
    if (mode === 'horizontal') {
      isFirstRenderRef.current = true;
      handleResize();
    }
  }, [menus]); // eslint-disable-line react-hooks/exhaustive-deps

  // 可见菜单和溢出菜单
  const visibleMenus = useMemo(() => {
    if (mode !== 'horizontal' || sliceIndex === -1) {
      return menus;
    }
    return menus.slice(0, sliceIndex);
  }, [menus, mode, sliceIndex]);

  const overflowMenus = useMemo(() => {
    if (mode !== 'horizontal' || sliceIndex === -1) {
      return [];
    }
    return menus.slice(sliceIndex);
  }, [menus, mode, sliceIndex]);

  const hasOverflow = overflowMenus.length > 0;

  // 上下文值
  const contextValue: MenuContextValue = useMemo(() => ({
    config: { mode, collapse, accordion, rounded, theme },
    activePath,
    openedMenus,
    openMenu,
    closeMenu,
    closeAllMenus,
    handleMenuItemClick,
    isMenuPopup,
  }), [mode, collapse, accordion, rounded, theme, activePath, openedMenus, openMenu, closeMenu, closeAllMenus, handleMenuItemClick, isMenuPopup]);

  // 菜单类名
  const menuClassName = useMemo(() => [
    'menu',
    `menu--${mode}`,
    `menu--${theme}`,
    collapse && 'menu--collapse',
    rounded && 'menu--rounded',
  ]
    .filter(Boolean)
    .join(' '), [mode, theme, collapse, rounded]);

  return (
    <MenuProvider value={contextValue}>
      <ul ref={menuRef} className={menuClassName}>
        {visibleMenus.map(item => (
          item.children && item.children.length > 0 ? (
            <SubMenu key={item.key} item={item} level={0} />
          ) : (
            <MenuItemComp key={item.key} item={item} level={0} />
          )
        ))}
        
        {/* 更多按钮（溢出菜单） */}
        {hasOverflow && (
          <SubMenu
            item={{ key: '__more__', name: '更多', children: overflowMenus }}
            level={0}
            isMore
          />
        )}
      </ul>
    </MenuProvider>
  );
});
