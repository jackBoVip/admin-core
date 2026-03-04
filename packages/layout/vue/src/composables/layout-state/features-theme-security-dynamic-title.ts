import {
  createLayoutDynamicTitleController,
  getCachedMenuPathIndex,
  resolveDynamicTitleSnapshot,
} from '@admin-core/layout';
import { EMPTY_MENUS } from '@admin-core/layout-shared';
import { computed, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

/**
 * 管理动态标题功能。
 * @returns 动态标题启用状态、应用名与手动更新标题函数。
 */
export function useDynamicTitle() {
  /**
   * 布局上下文
   * @description 提供应用名、菜单数据与动态标题开关配置。
   */
  const context = useLayoutContext();
  /**
   * 路由状态
   * @description 提供当前路径用于标题反查。
   */
  const { currentPath } = useRouter();

  /**
   * 是否启用动态标题。
   */
  const enabled = computed(() => context.props.dynamicTitle !== false);
  /**
   * 应用名称。
   */
  const appName = computed(() => context.props.appName || '');
  /**
   * 菜单集合（空值兜底）。
   */
  const menus = computed(() =>
    context.props.menus && context.props.menus.length > 0 ? context.props.menus : EMPTY_MENUS
  );
  /**
   * 菜单路径索引缓存。
   */
  const menuIndex = computed(() => getCachedMenuPathIndex(menus.value));
  /**
   * 动态标题派生快照。
   */
  const titleSnapshot = computed(() =>
    resolveDynamicTitleSnapshot({
      enabled: enabled.value,
      appName: appName.value,
      menuIndex: menuIndex.value,
      currentPath: currentPath.value,
    })
  );
  /**
   * 动态标题控制器。
   */
  const controller = createLayoutDynamicTitleController({
    getEnabled: () => enabled.value,
    getAppName: () => appName.value,
    setDocumentTitle: (title) => {
      if (typeof document !== 'undefined') {
        document.title = title;
      }
    },
  });

  /**
   * 手动更新当前页面标题。
   *
   * @param pageTitle 业务页面标题；为空时仅展示应用名。
   */
  const updateTitle = (pageTitle?: string) => {
    controller.updateTitle(pageTitle);
  };

  /**
   * 监听标题快照变化并应用到 `document.title`。
   */
  watch(
    () => titleSnapshot.value.title,
    (title) => {
      controller.applyTitle(title);
    },
    { immediate: true }
  );

  return {
    enabled,
    appName,
    updateTitle,
  };
}
