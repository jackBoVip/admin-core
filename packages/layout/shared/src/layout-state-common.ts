/**
 * Layout Shared 运行时公共状态常量。
 * @description 提供跨框架共享的空菜单引用，避免无菜单场景下重复分配数组。
 */
import type { MenuItem } from '@admin-core/layout';

/**
 * 空菜单常量。
 * @description 复用同一数组引用，避免在无菜单场景下重复创建对象。
 */
export const EMPTY_MENUS: MenuItem[] = [];
