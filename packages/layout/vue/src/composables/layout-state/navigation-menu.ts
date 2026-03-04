/**
 * 布局菜单状态 Composable（Vue）。
 * @description 负责菜单选中、展开同步，以及菜单点击后的路由联动与事件分发。
 */
import {
  createLayoutMenuStateController,
  resolveMenuStateSnapshot,
} from '@admin-core/layout';
import { computed, watch, type ComputedRef, type WritableComputedRef } from 'vue';
import { useLayoutContext } from '../use-layout-context';
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
  /** 当前展开的菜单键集合（可写计算属性）。 */
  openKeys: WritableComputedRef<string[]>;
  /** 当前激活菜单键。 */
  activeKey: ComputedRef<MenuStateSnapshot['activeKey']>;
  /** 当前菜单树。 */
  menus: ComputedRef<MenuStateSnapshot['menus']>;
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
   * 布局上下文
   * @description 提供菜单配置、状态容器与事件回调。
   */
  const context = useLayoutContext();
  /**
   * 路由菜单联动能力
   * @description 提供当前路径与菜单点击导航处理。
   */
  const { currentPath, handleMenuItemClick } = useRouter();

  /**
   * 菜单展开键双向状态。
   */
  const openKeys = computed({
    get: () => context.state.openMenuKeys,
    set: (value) => {
      context.setOpenMenuKeys(value);
    },
  });

  /**
   * 菜单运行时快照，包含菜单索引、路径与激活键。
   */
  const snapshot = computed(() =>
    resolveMenuStateSnapshot({
      menus: context.props.menus,
      currentPath: currentPath.value,
      activeMenuKey: context.props.activeMenuKey,
    })
  );
  /**
   * 当前路由对应的菜单路径链。
   */
  const menuPath = computed(() => snapshot.value.menuPath);
  /**
   * 当前激活菜单键。
   */
  const activeKey = computed<string>(() => snapshot.value.activeKey);
  /**
   * 菜单树数据。
   */
  const menus = computed(() => snapshot.value.menus);
  /**
   * 菜单键到节点的索引映射。
   */
  const menuIndex = computed(() => snapshot.value.menuIndex);

  /**
   * 菜单状态控制器，统一处理展开/收起与选择逻辑。
   */
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

  /**
   * 监听菜单路径链变化并同步展开键状态。
   */
  watch([menuPath, menuIndex], () => {
    menuController.syncOpenKeysByPath();
  }, { immediate: true });

  /**
   * 处理菜单选择，执行导航并派发菜单选择事件。
   *
   * @param key 菜单键。
   */
  const handleSelect = (key: string) => {
    const selected = menuController.resolveSelection(key);
    if (!selected?.item) return;
    handleMenuItemClick(selected.item);
    context.events.onMenuSelect?.(selected.item, selected.target);
  };

  /**
   * 处理菜单展开键变化。
   *
   * @param keys 展开菜单键集合。
   */
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
