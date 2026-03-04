/**
 * 菜单状态 Hook。
 * @description 负责菜单选中、展开同步，以及菜单点击后的路由联动与事件分发。
 */
import {
  createLayoutMenuStateController,
  resolveMenuStateSnapshot,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, startTransition } from 'react';
import { useLayoutContext, useLayoutState } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 菜单状态快照类型。
 * @description 由 `resolveMenuStateSnapshot` 返回值推导，保持与 core 层实现一致。
 */
type MenuStateSnapshot = ReturnType<typeof resolveMenuStateSnapshot>;

/**
 * `useMenuState` 返回值。
 */
export interface UseMenuStateReturn {
  /** 当前展开的菜单键集合。 */
  openKeys: string[];
  /** 当前激活菜单键。 */
  activeKey: MenuStateSnapshot['activeKey'];
  /** 当前菜单树。 */
  menus: MenuStateSnapshot['menus'];
  /** 显式写入展开菜单键集合。 */
  setOpenKeys: (keys: string[]) => void;
  /** 处理菜单项选择。 */
  handleSelect: (key: string) => void;
  /** 处理菜单展开键变化。 */
  handleOpenChange: (keys: string[]) => void;
}

/**
 * 管理菜单选中与展开状态。
 * @returns 菜单数据、选中态、展开态及交互处理方法。
 */
export function useMenuState(): UseMenuStateReturn {
  /**
   * 布局上下文。
   */
  const context = useLayoutContext();
  /**
   * 布局运行时状态。
   */
  const [state, setState] = useLayoutState();
  /**
   * 路由能力（当前路径 + 菜单导航处理）。
   */
  const { currentPath, handleMenuItemClick } = useRouter();
  /**
   * 当前已展开菜单键集合。
   */
  const openKeys = state.openMenuKeys;
  /**
   * 菜单运行时快照，含菜单索引、路径与激活键。
   */
  const snapshot = useMemo(
    () =>
      resolveMenuStateSnapshot({
        menus: context.props.menus,
        currentPath,
        activeMenuKey: context.props.activeMenuKey,
      }),
    [context.props.menus, context.props.activeMenuKey, currentPath]
  );
  const { menus, menuIndex, menuPath, activeKey } = snapshot;
  /**
   * 菜单索引引用缓存。
   * @description 供控制器读取，避免闭包捕获旧值。
   */
  const menuIndexRef = useRef(menuIndex);
  menuIndexRef.current = menuIndex;
  /**
   * 当前路径对应菜单路径引用缓存。
   */
  const menuPathRef = useRef(menuPath);
  menuPathRef.current = menuPath;
  /**
   * 展开键数组引用缓存。
   */
  const openKeysRef = useRef(openKeys);
  openKeysRef.current = openKeys;
  /**
   * 手风琴模式开关引用缓存。
   */
  const accordionRef = useRef(context.props.navigation?.accordion);
  accordionRef.current = context.props.navigation?.accordion;

  /**
   * 写入展开菜单键集合。
   *
   * @param keys 展开菜单键数组。
   */
  const setOpenKeys = useCallback(
    (keys: string[]) => {
      setState((prev) =>
        prev.openMenuKeys === keys ? prev : { ...prev, openMenuKeys: keys }
      );
    },
    [setState]
  );

  /**
   * 菜单状态控制器，统一处理展开/折叠与选择逻辑。
   */
  const menuController = useMemo(
    () =>
      createLayoutMenuStateController({
        getSnapshot: () => ({
          menuIndex: menuIndexRef.current,
          menuPath: menuPathRef.current,
          openKeys: openKeysRef.current,
          accordion: accordionRef.current,
        }),
        setOpenKeys,
      }),
    [setOpenKeys]
  );

  useEffect(() => {
    /**
     * 路径或菜单映射变化后，重新同步菜单展开状态。
     */
    startTransition(() => {
      menuController.syncOpenKeysByPath();
    });
  }, [menuController, menuPath, menuIndex]);

  /**
   * 处理菜单项选择。
   *
   * @param key 菜单项键。
   */
  const handleSelect = useCallback(
    (key: string) => {
      /**
       * 根据 key 解析目标菜单项与导航目标路径。
       */
      const selected = menuController.resolveSelection(key);
      const item = selected?.item;
      if (!selected || !item) return;
      startTransition(() => {
        handleMenuItemClick(item);
        context.events.onMenuSelect?.(item, selected.target);
      });
    },
    [menuController, handleMenuItemClick, context.events]
  );

  /**
   * 处理展开菜单键变更。
   *
   * @param keys 展开菜单键数组。
   */
  const handleOpenChange = useCallback(
    (keys: string[]) => {
      /**
       * 根据手风琴模式与当前节点关系更新展开键集合。
       */
      startTransition(() => {
        menuController.handleOpenChange(keys);
      });
    },
    [menuController]
  );

  return {
    openKeys,
    activeKey,
    menus,
    setOpenKeys,
    handleSelect,
    handleOpenChange,
  };
}
