import {
  createLayoutBreadcrumbStateController,
  resolveBreadcrumbStateSnapshot,
  type BreadcrumbItem,
} from '@admin-core/layout';
import { computed } from 'vue';
import { useLayoutContext } from '../use-layout-context';
import { useRouter } from './router';

export function useBreadcrumbState() {
  const context = useLayoutContext();
  const { currentPath, handleBreadcrumbClick: navigateBreadcrumb } = useRouter();

  const snapshot = computed(() =>
    resolveBreadcrumbStateSnapshot({
      breadcrumbs: context.props.breadcrumbs,
      currentPath: currentPath.value,
      menus: context.props.menus,
      autoBreadcrumb: context.props.autoBreadcrumb,
      breadcrumb: context.props.breadcrumb,
      defaultHomePath: context.props.defaultHomePath,
      translatedHomeName: context.t('layout.breadcrumb.home'),
    })
  );

  const controller = createLayoutBreadcrumbStateController({
    navigateBreadcrumb,
    onBreadcrumbClick: context.events.onBreadcrumbClick,
  });

  // 点击面包屑（内置路由跳转）
  const handleClick = (item: BreadcrumbItem) => {
    controller.handleClick(item);
  };

  return {
    breadcrumbs: computed(() => snapshot.value.breadcrumbs),
    isAutoMode: computed(() => snapshot.value.isAutoMode),
    showIcon: computed(() => snapshot.value.showIcon),
    styleType: computed(() => snapshot.value.styleType),
    handleClick,
  };
}


/**
 * 使用快捷键
 */
