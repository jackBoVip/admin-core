/**
 * 菜单上下文系统
 * @description 参考 vben-admin 实现，提供菜单状态管理和组件通信
 */
import { inject, provide, type InjectionKey, type Ref } from 'vue';
import type { MenuItem } from '@admin-core/layout';

/**
 * 菜单项点击数据
 */
export interface MenuItemClicked {
  path: string;
  parentPaths: string[];
}

/**
 * 菜单上下文接口
 */
export interface MenuContext {
  // 配置
  props: {
    mode: 'horizontal' | 'vertical';
    collapse: boolean;
    accordion: boolean;
    rounded: boolean;
    theme: 'light' | 'dark';
  };
  
  // 状态
  activePath: Ref<string>;
  activeParentSet: Ref<Set<string>>;
  openedMenus: Ref<string[]>;
  openedMenuSet: Ref<Set<string>>;
  
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
export interface SubMenuContext {
  path: string;
  level: number;
  mouseInChild: Ref<boolean>;
  handleMouseleave?: (deepDispatch?: boolean) => void;
  /** 父级子菜单上下文（用于遍历获取完整父级路径） */
  parent: SubMenuContext | null;
}

// 注入键
export const MENU_CONTEXT_KEY: InjectionKey<MenuContext> = Symbol('menu-context');
export const SUB_MENU_CONTEXT_KEY: InjectionKey<SubMenuContext> = Symbol('sub-menu-context');

/**
 * 创建菜单上下文
 */
export function createMenuContext(context: MenuContext) {
  provide(MENU_CONTEXT_KEY, context);
}

/**
 * 使用菜单上下文
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
 */
export function createSubMenuContext(context: SubMenuContext) {
  provide(SUB_MENU_CONTEXT_KEY, context);
}

/**
 * 使用子菜单上下文（可选）
 */
export function useSubMenuContext() {
  return inject(SUB_MENU_CONTEXT_KEY, null);
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
