/**
 * 菜单上下文系统
 * @description 提供菜单状态管理和组件通信
 */
import { createContext, useContext, type ReactNode } from 'react';
import type { MenuItem } from '@admin-core/layout';

/**
 * 菜单项点击数据
 */
export interface MenuItemClicked {
  path: string;
  parentPaths: string[];
}

/**
 * 菜单配置
 */
export interface MenuConfig {
  mode: 'horizontal' | 'vertical';
  collapse: boolean;
  accordion: boolean;
  rounded: boolean;
  theme: 'light' | 'dark';
}

/**
 * 菜单上下文接口
 */
export interface MenuContextValue {
  // 配置
  config: MenuConfig;
  
  // 状态
  activePath: string;
  activeParentSet: Set<string>;
  openedMenus: string[];
  openedMenuSet: Set<string>;
  
  // 方法
  openMenu: (path: string, parentPaths?: string[]) => void;
  closeMenu: (path: string, parentPaths?: string[]) => void;
  closeAllMenus: () => void;
  handleMenuItemClick: (data: MenuItemClicked) => void;
  
  // 是否为弹出模式（水平或垂直折叠）
  isMenuPopup: boolean;
}

/**
 * 子菜单上下文接口
 */
export interface SubMenuContextValue {
  path: string;
  level: number;
  mouseInChild: boolean;
  setMouseInChild: (value: boolean) => void;
  handleMouseleave?: (deepDispatch?: boolean) => void;
}

// 上下文
const MenuContext = createContext<MenuContextValue | null>(null);
const SubMenuContext = createContext<SubMenuContextValue | null>(null);

/**
 * 菜单上下文提供者
 */
export interface MenuProviderProps {
  value: MenuContextValue;
  children: ReactNode;
}

export function MenuProvider({ value, children }: MenuProviderProps) {
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/**
 * 使用菜单上下文
 */
export function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
}

/**
 * 子菜单上下文提供者
 */
export interface SubMenuProviderProps {
  value: SubMenuContextValue;
  children: ReactNode;
}

export function SubMenuProvider({ value, children }: SubMenuProviderProps) {
  return <SubMenuContext.Provider value={value}>{children}</SubMenuContext.Provider>;
}

/**
 * 使用子菜单上下文（可选）
 */
export function useSubMenuContext() {
  return useContext(SubMenuContext);
}

/**
 * 获取父级路径数组
 */
export function getParentPaths(path: string, menus: MenuItem[], paths: string[] = []): string[] {
  const target = path === '' ? '' : String(path);
  for (const menu of menus) {
    const rawKey = menu.key ?? '';
    const key = rawKey === '' ? '' : String(rawKey);
    const rawPath = menu.path ?? '';
    const menuPath = rawPath === '' ? '' : String(rawPath);
    if ((key && key === target) || (menuPath && menuPath === target)) {
      return paths;
    }
    if (menu.children?.length) {
      const nextPath = key || menuPath;
      const nextPaths = nextPath ? [...paths, nextPath] : paths;
      const found = getParentPaths(target, menu.children, nextPaths);
      if (found.length > paths.length) {
        return found;
      }
    }
  }
  return paths;
}
