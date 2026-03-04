/**
 * 菜单上下文系统
 * @description 提供菜单状态管理与组件间通信能力。
 */
import { inject, provide, type InjectionKey, type Ref } from 'vue';
import type { MenuItem } from '@admin-core/layout';

/** 菜单项点击数据。 */
export interface MenuItemClicked {
  /** 当前点击菜单路径。 */
  path: string;
  /** 父级路径链。 */
  parentPaths: string[];
}

/** 菜单上下文值结构。 */
export interface MenuContext {
  /** 菜单配置。 */
  props: {
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
  };
  
  /** 当前激活路径。 */
  activePath: Ref<string>;
  /** 激活路径的父级集合。 */
  activeParentSet: Ref<Set<string>>;
  /** 当前展开菜单路径数组。 */
  openedMenus: Ref<string[]>;
  /** 当前展开菜单路径集合。 */
  openedMenuSet: Ref<Set<string>>;
  
  /** 打开菜单。 */
  openMenu: (path: string, parentPaths?: string[]) => void;
  /** 关闭菜单。 */
  closeMenu: (path: string, parentPaths?: string[]) => void;
  /** 关闭全部菜单。 */
  closeAllMenus: () => void;
  /** 处理菜单点击。 */
  handleMenuItemClick: (data: MenuItemClicked) => void;
  
  /** 是否弹出模式。 */
  isMenuPopup: boolean;
}

/** 子菜单上下文值结构。 */
export interface SubMenuContext {
  /** 当前子菜单路径。 */
  path: string;
  /** 当前层级。 */
  level: number;
  /** 鼠标是否位于子级菜单中。 */
  mouseInChild: Ref<boolean>;
  /** 处理鼠标离开事件。 */
  handleMouseleave?: (deepDispatch?: boolean) => void;
  /** 父级子菜单上下文（用于遍历获取完整父级路径） */
  parent: SubMenuContext | null;
}

/**
 * 菜单上下文注入键。
 */
export const MENU_CONTEXT_KEY: InjectionKey<MenuContext> = Symbol('menu-context');
/**
 * 子菜单上下文注入键。
 */
export const SUB_MENU_CONTEXT_KEY: InjectionKey<SubMenuContext> = Symbol('sub-menu-context');

/**
 * 创建菜单上下文
 * @param context 菜单上下文对象。
 * @returns 无返回值。
 */
export function createMenuContext(context: MenuContext) {
  provide(MENU_CONTEXT_KEY, context);
}

/**
 * 使用菜单上下文
 * @returns 菜单上下文对象。
 * @throws 当未在 `Menu` 组件上下文中调用时抛出错误。
 */
export function useMenuContext() {
  const context = inject(MENU_CONTEXT_KEY);
  if (!context) {
    throw new Error('useMenuContext must be used within a Menu component');
  }
  return context;
}

/**
 * 创建子菜单上下文
 * @param context 子菜单上下文对象。
 * @returns 无返回值。
 */
export function createSubMenuContext(context: SubMenuContext) {
  provide(SUB_MENU_CONTEXT_KEY, context);
}

/**
 * 使用子菜单上下文（可选）。
 * @returns 子菜单上下文；未提供时返回 `null`。
 */
export function useSubMenuContext() {
  return inject(SUB_MENU_CONTEXT_KEY, null);
}

/**
 * 获取父级路径数组
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
