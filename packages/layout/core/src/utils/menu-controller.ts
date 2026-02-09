/**
 * 菜单行为控制器（Headless）
 * @description
 * 统一 React/Vue 两端的菜单基础行为逻辑，只处理「数据与状态」，不直接依赖 DOM 或框架。
 *
 * 适用范围：
 * - 激活项管理：activePath / activeParentSet
 * - 打开/关闭菜单：openedMenus / openedMenuSet
 * - 菜单模式推导：isMenuPopup
 * - 可见/溢出菜单切片：renderMenus / overflowMenus
 * - 菜单根节点类名：menuClassName
 *
 * 注意：
 * - 虚拟滚动与尺寸相关逻辑由 `virtual-scroll.ts` 提供基础工具，本文件仅做组合。
 * - 与 DOM 相关的「宽度测量」逻辑仍由各框架在适配层中完成，再将结果传入本控制器。
 */

import type { MenuItem } from '../types';

/**
 * 统一的 key 规范化函数
 * @description 将 null/undefined/空字符串 统一视为「无效 key」，其他值转为字符串
 */
export function normalizeMenuKey(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  return String(value);
}

/**
 * 构建菜单项的父级关系映射
 * @description
 * - 支持使用 key / path / name 作为标识，保证不同场景下都能正确回溯父级
 * - 该映射在 React/Vue 两端均使用，避免实现漂移
 */
export function buildMenuParentPathMap(menus: MenuItem[]): Map<string, string | null> {
  const map = new Map<string, string | null>();

  const visit = (items: MenuItem[], parent: string | null) => {
    for (const menu of items) {
      const rawKey = menu.key ?? '';
      const keyPath = normalizeMenuKey(rawKey);
      const rawPath = menu.path ?? '';
      const path = normalizeMenuKey(rawPath);
      const id = normalizeMenuKey(menu.key ?? menu.path ?? menu.name ?? '');

      if (keyPath) map.set(keyPath, parent);
      if (path && path !== keyPath) map.set(path, parent);
      if (id && id !== keyPath && id !== path) map.set(id, parent);

      if (menu.children?.length) {
        visit(menu.children, id || parent);
      }
    }
  };

  visit(menus, null);
  return map;
}

/**
 * 根据当前激活路径构建父级激活集合
 * @description
 * - 通过 parentPathMap 逐级向上查找父级，直到根节点或出现循环
 */
export function buildActiveParentSet(
  activePath: string,
  parentPathMap: Map<string, string | null>
): Set<string> {
  const parentSet = new Set<string>();
  if (!activePath) return parentSet;

  let current = activePath;
  const visited = new Set<string>();

  while (current && parentPathMap.has(current) && !visited.has(current)) {
    visited.add(current);
    const parent = parentPathMap.get(current);
    if (!parent) break;
    parentSet.add(parent);
    current = parent;
  }

  return parentSet;
}

export interface OpenMenuOptions {
  /** 是否启用手风琴模式 */
  accordion?: boolean;
  /** 当前菜单项的父级 key 列表（从根到父级） */
  parentPaths?: string[];
}

/**
 * 计算「打开菜单」后的新 openedMenus 数组
 * @description
 * - 保证幂等：重复打开同一菜单不会产生重复项
 * - 当 accordion=true 时，仅保留同一父级下的展开项
 */
export function computeOpenedMenusOnOpen(
  prevOpenedMenus: string[],
  path: string,
  options: OpenMenuOptions = {}
): string[] {
  const target = normalizeMenuKey(path);
  if (!target) return prevOpenedMenus;

  const { accordion = true, parentPaths = [] } = options;
  const normalizedParents = parentPaths.map((p) => normalizeMenuKey(p)).filter(Boolean);

  if (prevOpenedMenus.includes(target)) {
    return prevOpenedMenus;
  }

  let next = [...prevOpenedMenus];

  if (accordion) {
    if (normalizedParents.length === 0) {
      // 根级手风琴：只保留当前点击的根菜单
      next = [];
    } else {
      const filtered: string[] = [];
      for (const menu of next) {
        let keep = false;
        for (const parent of normalizedParents) {
          if (menu.startsWith(parent)) {
            keep = true;
            break;
          }
        }
        if (keep) filtered.push(menu);
      }
      next = filtered;
    }
  }

  next.push(target);
  return next;
}

/**
 * 计算「关闭菜单」后的新 openedMenus 数组
 */
export function computeOpenedMenusOnClose(prevOpenedMenus: string[], path: string): string[] {
  const target = normalizeMenuKey(path);
  if (!target) return prevOpenedMenus;
  const index = prevOpenedMenus.indexOf(target);
  if (index === -1) return prevOpenedMenus;
  const next = [...prevOpenedMenus];
  next.splice(index, 1);
  return next;
}

/**
 * 折叠状态变化时重置展开菜单
 * @description 折叠时关闭所有菜单，展开时保持原状
 */
export function computeOpenedMenusOnCollapseChange(
  prevOpenedMenus: string[],
  collapse: boolean
): string[] {
  if (!collapse) return prevOpenedMenus;
  return prevOpenedMenus.length > 0 ? [] : prevOpenedMenus;
}

/**
 * 是否为弹出模式
 * @description
 * - 水平菜单必定为弹出模式
 * - 垂直折叠菜单也视为弹出模式
 */
export function isMenuPopup(mode: 'horizontal' | 'vertical', collapse: boolean): boolean {
  return mode === 'horizontal' || (mode === 'vertical' && collapse);
}

export interface VisibleMenusParams {
  menus: MenuItem[];
  mode: 'horizontal' | 'vertical';
  /** 水平模式下，可见菜单的分割索引；-1 表示全部可见 */
  sliceIndex: number;
  /** 垂直模式下，渐进渲染的数量上限 */
  renderCount: number;
}

/**
 * 计算基础可见菜单列表（不包含虚拟滚动与溢出逻辑）
 */
export function computeBaseVisibleMenus(params: VisibleMenusParams): MenuItem[] {
  const { menus, mode, sliceIndex, renderCount } = params;

  if (mode === 'horizontal') {
    if (sliceIndex === -1) return menus;
    return menus.slice(0, sliceIndex);
  }

  if (mode === 'vertical') {
    return menus.slice(0, renderCount);
  }

  return menus;
}

export interface OverflowMenusParams {
  menus: MenuItem[];
  mode: 'horizontal' | 'vertical';
  sliceIndex: number;
}

/**
 * 计算溢出菜单列表（用于「更多」按钮）
 */
export function computeOverflowMenus(params: OverflowMenusParams): MenuItem[] {
  const { menus, mode, sliceIndex } = params;
  if (mode !== 'horizontal' || sliceIndex === -1) return [];
  return menus.slice(sliceIndex);
}

export interface MenuClassNameOptions {
  mode: 'horizontal' | 'vertical';
  theme: 'light' | 'dark';
  collapse?: boolean;
  rounded?: boolean;
}

/**
 * 计算菜单根节点类名
 * @description 统一 React/Vue 两端的类名生成规则，避免样式分叉
 */
export function getMenuRootClassName(options: MenuClassNameOptions): string {
  const { mode, theme, collapse, rounded } = options;
  const classes = ['menu', `menu--${mode}`, `menu--${theme}`];
  if (collapse) classes.push('menu--collapse');
  if (rounded) classes.push('menu--rounded');
  return classes.join(' ');
}


