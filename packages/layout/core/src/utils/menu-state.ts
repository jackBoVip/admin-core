/**
 * 菜单状态计算工具
 * @description 提取 React/Vue 共有的菜单 openKeys 计算逻辑
 */

import { areArraysEqual } from './array';
import { resolveMenuByPathIndex, type buildMenuPathIndex } from './menu';

/**
 * 按当前激活路径推导菜单展开键的参数。
 */
export interface ResolveMenuOpenKeysOnPathOptions {
  /** 菜单索引结构。 */
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  /** 当前激活菜单路径。 */
  menuPath: string;
  /** 当前已展开的菜单键集合。 */
  openKeys: string[];
  /** 是否开启手风琴模式。 */
  accordion?: boolean;
}

/**
 * 根据当前激活路径解析需要展开的菜单 `openKeys`。
 * @param options 路径驱动的菜单展开计算参数。
 * @returns 计算后的菜单展开键数组。
 */
export function resolveMenuOpenKeysOnPath(options: ResolveMenuOpenKeysOnPathOptions): string[] {
  const { menuIndex, menuPath, openKeys, accordion = false } = options;
  if (!menuPath) return openKeys;

  const menu = resolveMenuByPathIndex(menuIndex, menuPath);
  if (!menu) return openKeys;

  const chain =
    menuIndex.chainByPath.get(menuPath) ??
    (menu.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
    [];

  if (chain.length <= 1) return openKeys;

  const parentKeys = chain.slice(0, -1);

  if (accordion) {
    if (parentKeys.length === 0) return openKeys;
    return areArraysEqual(parentKeys, openKeys) ? openKeys : parentKeys;
  }

  const merged = [...new Set([...openKeys, ...parentKeys])];
  return areArraysEqual(merged, openKeys) ? openKeys : merged;
}

/**
 * 按菜单展开/收起事件推导最终展开键的参数。
 */
export interface ResolveMenuOpenKeysOnChangeOptions {
  /** 菜单索引结构。 */
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  /** 当前已展开键。 */
  openKeys: string[];
  /** 界面事件回传的下一组展开键。 */
  nextKeys: string[];
  /** 是否开启手风琴模式。 */
  accordion?: boolean;
}

/**
 * 根据菜单展开/收起事件解析最终 `openKeys`。
 * @param options 展开状态变更计算参数。
 * @returns 计算后的菜单展开键数组。
 */
export function resolveMenuOpenKeysOnChange(
  options: ResolveMenuOpenKeysOnChangeOptions
): string[] {
  const { menuIndex, openKeys, nextKeys, accordion = false } = options;

  if (!accordion) {
    return areArraysEqual(nextKeys, openKeys) ? openKeys : nextKeys;
  }

  const lastKey = nextKeys[nextKeys.length - 1];
  let resolved: string[] = [];

  if (lastKey !== undefined) {
    const menu = menuIndex.byKey.get(lastKey) ?? menuIndex.byPath.get(lastKey);
    const chain =
      (menu?.key ? menuIndex.chainByKey.get(menu.key) : undefined) ??
      (menu?.path ? menuIndex.chainByPath.get(menu.path) : undefined) ??
      [];
    resolved = chain.length > 0 ? chain : [lastKey];
  }

  return areArraysEqual(resolved, openKeys) ? openKeys : resolved;
}
