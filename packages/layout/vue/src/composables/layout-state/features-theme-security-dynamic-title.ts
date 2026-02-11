import {
  createLayoutDynamicTitleController,
  getCachedMenuPathIndex,
  resolveDynamicTitleSnapshot,
} from '@admin-core/layout';
import { computed, watch } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { EMPTY_MENUS } from './common';
import { useRouter } from './router';

export function useDynamicTitle() {
  const context = useLayoutContext();
  const { currentPath } = useRouter();

  const enabled = computed(() => context.props.dynamicTitle !== false);
  const appName = computed(() => context.props.appName || '');
  const menus = computed(() =>
    context.props.menus && context.props.menus.length > 0 ? context.props.menus : EMPTY_MENUS
  );
  const menuIndex = computed(() => getCachedMenuPathIndex(menus.value));
  const titleSnapshot = computed(() =>
    resolveDynamicTitleSnapshot({
      enabled: enabled.value,
      appName: appName.value,
      menuIndex: menuIndex.value,
      currentPath: currentPath.value,
    })
  );
  const controller = createLayoutDynamicTitleController({
    getEnabled: () => enabled.value,
    getAppName: () => appName.value,
    setDocumentTitle: (title) => {
      if (typeof document !== 'undefined') {
        document.title = title;
      }
    },
  });

  const updateTitle = (pageTitle?: string) => {
    controller.updateTitle(pageTitle);
  };

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
