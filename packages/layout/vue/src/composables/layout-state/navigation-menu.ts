import {
  createLayoutMenuStateController,
  resolveMenuStateSnapshot,
} from '@admin-core/layout';
import { computed, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

export function useMenuState() {
  const context = useLayoutContext();
  const { currentPath, handleMenuItemClick } = useRouter();

  const openKeys = computed({
    get: () => context.state.openMenuKeys,
    set: (value) => {
      context.setOpenMenuKeys(value);
    },
  });

  const snapshot = computed(() =>
    resolveMenuStateSnapshot({
      menus: context.props.menus,
      currentPath: currentPath.value,
      activeMenuKey: context.props.activeMenuKey,
    })
  );
  const menuPath = computed(() => snapshot.value.menuPath);
  const activeKey = computed<string>(() => snapshot.value.activeKey);
  const menus = computed(() => snapshot.value.menus);
  const menuIndex = computed(() => snapshot.value.menuIndex);

  const menuController = createLayoutMenuStateController({
    getSnapshot: () => ({
      menuIndex: menuIndex.value,
      menuPath: menuPath.value,
      openKeys: openKeys.value,
      accordion: context.props.navigation?.accordion,
    }),
    setOpenKeys: (keys) => {
      openKeys.value = keys;
    },
  });

  watch([menuPath, menuIndex], () => {
    menuController.syncOpenKeysByPath();
  }, { immediate: true });

  const handleSelect = (key: string) => {
    const selected = menuController.resolveSelection(key);
    if (!selected?.item) return;
    handleMenuItemClick(selected.item);
    context.events.onMenuSelect?.(selected.item, selected.target);
  };

  const handleOpenChange = (keys: string[]) => {
    menuController.handleOpenChange(keys);
  };

  return {
    openKeys,
    activeKey,
    menus,
    handleSelect,
    handleOpenChange,
  };
}
