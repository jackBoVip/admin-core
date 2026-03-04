/**
 * 菜单上下文系统。
 * @description 提供菜单状态管理与组件间通信能力。
 */
import { createContext, useContext, type ReactNode } from 'react';
import type { MenuItem } from '@admin-core/layout';

/**
 * 菜单项点击数据。
 * @description 描述菜单点击事件中最小必要的路径信息。
 */
export interface MenuItemClicked {
  /** 当前点击菜单路径。 */
  path: string;
  /** 父级路径链。 */
  parentPaths: string[];
}

/**
 * 菜单配置。
 * @description 定义菜单渲染模式与交互策略。
 */
export interface MenuConfig {
  /** 菜单模式。 */
  mode: 'horizontal' | 'vertical';
  /** 是否折叠。 */
  collapse: boolean;
  /** 是否手风琴模式。 */
  accordion: boolean;
  /** 是否圆角风格。 */
  rounded: boolean;
  /** 菜单主题。 */
  theme: 'light' | 'dark';
}

/**
 * 菜单上下文值结构。
 * @description 聚合菜单状态、派生集合与行为操作函数。
 */
export interface MenuContextValue {
  /** 菜单配置。 */
  config: MenuConfig;
  
  /** 当前激活路径。 */
  activePath: string;
  /** 激活路径的父级集合。 */
  activeParentSet: Set<string>;
  /** 当前展开菜单路径数组。 */
  openedMenus: string[];
  /** 当前展开菜单路径集合。 */
  openedMenuSet: Set<string>;
  
  /** 打开菜单。 */
  openMenu: (path: string, parentPaths?: string[]) => void;
  /** 关闭菜单。 */
  closeMenu: (path: string, parentPaths?: string[]) => void;
  /** 关闭全部菜单。 */
  closeAllMenus: () => void;
  /** 处理菜单点击。 */
  handleMenuItemClick: (data: MenuItemClicked) => void;
  
  /** 当前是否处于弹出菜单模式（水平模式或垂直折叠）。 */
  isMenuPopup: boolean;
}

/**
 * 子菜单上下文值结构。
 * @description 用于子菜单层级通信和悬停状态联动。
 */
export interface SubMenuContextValue {
  /** 当前子菜单路径。 */
  path: string;
  /** 当前层级。 */
  level: number;
  /** 鼠标是否位于子级菜单中。 */
  mouseInChild: boolean;
  /** 设置鼠标是否在子级中。 */
  setMouseInChild: (value: boolean) => void;
  /** 处理鼠标离开事件。 */
  handleMouseleave?: (deepDispatch?: boolean) => void;
  /** 父级子菜单上下文。 */
  parent?: SubMenuContextValue | null;
}

/** 菜单上下文实例。 */
const MenuContext = createContext<MenuContextValue | null>(null);
/** 子菜单上下文实例。 */
const SubMenuContext = createContext<SubMenuContextValue | null>(null);

/**
 * 菜单上下文提供者参数。
 * @description `MenuProvider` 需要注入的上下文值与子树节点。
 */
export interface MenuProviderProps {
  /** 值。 */
  value: MenuContextValue;
  /** 子节点列表。 */
  children: ReactNode;
}

/**
 * 菜单上下文 Provider 组件。
 * @param props Provider 参数。
 * @returns 菜单上下文提供器节点。
 */
export function MenuProvider({ value, children }: MenuProviderProps) {
  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
}

/**
 * 使用菜单上下文。
 * @returns 菜单上下文对象。
 * @throws 当未在 `MenuProvider` 内调用时抛出错误。
 */
export function useMenuContext() {
  const context = useContext(MenuContext);
  if (!context) {
    throw new Error('useMenuContext must be used within a MenuProvider');
  }
  return context;
}

/**
 * 子菜单上下文提供者参数。
 * @description `SubMenuProvider` 需要注入的上下文值与子树节点。
 */
export interface SubMenuProviderProps {
  /** 值。 */
  value: SubMenuContextValue;
  /** 子节点列表。 */
  children: ReactNode;
}

/**
 * 子菜单上下文 Provider 组件。
 * @param props Provider 参数。
 * @returns 子菜单上下文提供器节点。
 */
export function SubMenuProvider({ value, children }: SubMenuProviderProps) {
  return <SubMenuContext.Provider value={value}>{children}</SubMenuContext.Provider>;
}

/**
 * 使用子菜单上下文（可选）。
 * @returns 子菜单上下文；未提供时返回 `null`。
 */
export function useSubMenuContext() {
  return useContext(SubMenuContext);
}

/**
 * 获取父级路径数组。
 * @param path 目标菜单路径或键值。
 * @param menus 菜单树。
 * @param paths 当前递归路径链。
 * @returns 目标菜单的父级路径数组。
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
