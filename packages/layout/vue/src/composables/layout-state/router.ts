import {
  createLayoutRouterStateController,
  extractPathAndQuery,
} from '@admin-core/layout';
import { computed, onMounted, ref } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/** Vue Router 实例类型（简化版） */
interface VueRouterInstance {
  push: (to: string | Record<string, unknown>) => void | Promise<unknown>;
}

export function useVueRouterAdapter(
  routerInstance?: VueRouterInstance,
  routeInstance?: { path: string; fullPath?: string }
) {
  // 尝试自动获取 vue-router
  const router = ref(routerInstance);
  const route = ref(routeInstance);

  if (!router.value || !route.value) {
    onMounted(async () => {
      try {
        const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
        const vueRouter = await dynamicImport('vue-router') as Record<string, unknown>;
        if (!router.value && typeof vueRouter.useRouter === 'function') {
          router.value = (vueRouter.useRouter as () => typeof routerInstance)();
        }
        if (!route.value && typeof vueRouter.useRoute === 'function') {
          route.value = (vueRouter.useRoute as () => typeof routeInstance)();
        }
      } catch {
        // vue-router 未安装，这是正常的可选依赖场景
      }
    });
  }

  return {
    navigate: (path: string, options?: { replace?: boolean; query?: Record<string, unknown> }) => {
      if (!router.value) return;
      const { path: targetPath, query: pathQuery } = extractPathAndQuery(path);
      const query = options?.query ?? pathQuery;
      router.value.push({
        path: targetPath,
        query,
        replace: options?.replace,
      });
    },
    currentPath: computed(() => route.value?.fullPath || route.value?.path || ''),
  };
}

export function useRouter() {
  const context = useLayoutContext();
  const controller = createLayoutRouterStateController({
    getRouterCurrentPath: () => context.props.router?.currentPath,
    getCurrentPath: () => context.props.currentPath,
    getLocation: () =>
      context.props.router?.location as
        | { pathname?: string; search?: string; hash?: string }
        | undefined,
    getMode: () => context.props.router?.mode,
    getRouterNavigate: () => context.props.router?.navigate,
    getAutoActivateChild: () => context.props.sidebar?.autoActivateChild,
  });
  const currentPath = computed<string>(() => controller.getResolvedCurrentPath());

  return {
    currentPath,
    navigate: controller.navigate,
    handleMenuItemClick: controller.handleMenuItemClick,
    handleTabClick: controller.handleTabClick,
    handleBreadcrumbClick: controller.handleBreadcrumbClick,
    handleTabCloseNavigate: controller.handleTabCloseNavigate,
  };
}
