import {
  createLayoutMenuStateController,
  resolveMenuStateSnapshot,
} from '@admin-core/layout';
import { useCallback, useEffect, useMemo, useRef, startTransition } from 'react';
import { useLayoutContext, useLayoutState } from '../use-layout-context';
import { useRouter } from './router';

export function useMenuState() {
  const context = useLayoutContext();
  const [state, setState] = useLayoutState();
  const { currentPath, handleMenuItemClick } = useRouter();
  const openKeys = state.openMenuKeys;
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
  const menuIndexRef = useRef(menuIndex);
  menuIndexRef.current = menuIndex;
  const menuPathRef = useRef(menuPath);
  menuPathRef.current = menuPath;
  const openKeysRef = useRef(openKeys);
  openKeysRef.current = openKeys;
  const accordionRef = useRef(context.props.navigation?.accordion);
  accordionRef.current = context.props.navigation?.accordion;

  const setOpenKeys = useCallback(
    (keys: string[]) => {
      setState((prev) =>
        prev.openMenuKeys === keys ? prev : { ...prev, openMenuKeys: keys }
      );
    },
    [setState]
  );

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
    startTransition(() => {
      menuController.syncOpenKeysByPath();
    });
  }, [menuController, menuPath, menuIndex]);

  const handleSelect = useCallback(
    (key: string) => {
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

  const handleOpenChange = useCallback(
    (keys: string[]) => {
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
