/**
 * 菜单状态计算工具
 * @description 提取 React/Vue 共有的菜单 openKeys 计算逻辑
 */

import { areArraysEqual } from './array';
import { resolveMenuByPathIndex, type buildMenuPathIndex } from './menu';

export interface ResolveMenuOpenKeysOnPathOptions {
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  menuPath: string;
  openKeys: string[];
  accordion?: boolean;
}

/**
 * 根据当前路径解析需要展开的菜单 keys
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
    const lastParentKey = parentKeys[parentKeys.length - 1];
    if (lastParentKey === undefined) return openKeys;
    const nextKeys = [lastParentKey];
    return areArraysEqual(nextKeys, openKeys) ? openKeys : nextKeys;
  }

  const merged = [...new Set([...openKeys, ...parentKeys])];
  return areArraysEqual(merged, openKeys) ? openKeys : merged;
}

export interface ResolveMenuOpenKeysOnChangeOptions {
  menuIndex: ReturnType<typeof buildMenuPathIndex>;
  openKeys: string[];
  nextKeys: string[];
  accordion?: boolean;
}

/**
 * 根据菜单展开/收起事件解析最终 openKeys
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
