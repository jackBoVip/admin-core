import {
  createLayoutRouterStateController,
  extractPathAndQuery,
} from '@admin-core/layout';
import { computed, onMounted, ref, type ComputedRef } from 'vue';
import { useLayoutContext } from '../use-layout-context';

/** 路由实例类型（Vue，简化版）。 */
interface VueRouterInstance {
  /** 跳转到目标路由。 */
  push: (to: string | Record<string, unknown>) => void | Promise<unknown>;
}

/**
 * Vue 路由当前路由信息（简化版）。
 * @description 仅保留布局路由控制所需的路径字段，避免耦合完整 route 类型。
 */
interface VueRouteInstance {
  /** 当前匹配路径。 */
  path: string;
  /** 含查询参数的完整路径。 */
  fullPath?: string;
}

/**
 * Vue 路由导航参数。
 * @description 统一描述布局触发导航时可附带的 replace 与 query 参数。
 */
interface VueNavigateOptions {
  /** 是否替换当前历史记录项。 */
  replace?: boolean;
  /** 需要拼接到路径上的查询参数。 */
  query?: Record<string, unknown>;
}

/**
 * Layout 路由控制器读取的最小 location 结构。
 * @description 提供 pathname/search/hash 三段信息用于路径解析与状态同步。
 */
interface LayoutRouterLocation {
  /** 当前路径。 */
  pathname?: string;
  /** 查询字符串。 */
  search?: string;
  /** 哈希片段。 */
  hash?: string;
}

/**
 * 布局路由状态控制器类型。
 * @description 由 `createLayoutRouterStateController` 返回值推导，保持与 core 层实现一致。
 */
type LayoutRouterController = ReturnType<typeof createLayoutRouterStateController>;

/**
 * `useVueRouterAdapter` 返回值。
 */
export interface UseVueRouterAdapterReturn {
  /** 执行路由跳转。 */
  navigate: (path: string, options?: VueNavigateOptions) => void;
  /** 当前完整路径。 */
  currentPath: ComputedRef<string>;
}

/**
 * `useRouter` 返回值。
 */
export interface UseLayoutRouterReturn {
  /** 当前解析后的路径。 */
  currentPath: ComputedRef<string>;
  /** 执行路由跳转。 */
  navigate: LayoutRouterController['navigate'];
  /** 处理菜单项点击导航。 */
  handleMenuItemClick: LayoutRouterController['handleMenuItemClick'];
  /** 处理标签点击导航。 */
  handleTabClick: LayoutRouterController['handleTabClick'];
  /** 处理面包屑点击导航。 */
  handleBreadcrumbClick: LayoutRouterController['handleBreadcrumbClick'];
  /** 处理标签关闭后的兜底导航。 */
  handleTabCloseNavigate: LayoutRouterController['handleTabCloseNavigate'];
}

/**
 * 将 `vue-router` 的路由能力适配为 Layout 通用路由协议。
 *
 * @param routerInstance 可选注入的 `useRouter()` 返回值。
 * @param routeInstance 可选注入的 `useRoute()` 返回值。
 * @returns Layout 侧可消费的 `navigate/currentPath` 访问器。
 */
export function useVueRouterAdapter(
  routerInstance?: VueRouterInstance,
  routeInstance?: VueRouteInstance
): UseVueRouterAdapterReturn {
  /**
   * 外部注入或运行时动态获取的路由实例。
   */
  const router = ref(routerInstance);
  /**
   * 外部注入或运行时动态获取的当前路由实例。
   */
  const route = ref(routeInstance);

  if (!router.value || !route.value) {
    /**
     * 组件挂载后尝试动态获取 `vue-router` 实例。
     * @description 支持将 `vue-router` 作为可选依赖的场景，避免静态导入导致构建失败。
     */
    onMounted(async () => {
      try {
        /**
         * 动态导入函数。
         * @description 通过 `Function` 包装规避部分构建工具对可选依赖的静态解析。
         */
        const dynamicImport = new Function('m', 'return import(m)') as (m: string) => Promise<unknown>;
        const vueRouter = await dynamicImport('vue-router') as Record<string, unknown>;
        if (!router.value && typeof vueRouter.useRouter === 'function') {
          router.value = (vueRouter.useRouter as () => typeof routerInstance)();
        }
        if (!route.value && typeof vueRouter.useRoute === 'function') {
          route.value = (vueRouter.useRoute as () => typeof routeInstance)();
        }
      } catch {
        /* vue-router 未安装是正常的可选依赖场景。 */
      }
    });
  }

  /**
   * 执行路由跳转并自动解析路径中的查询参数。
   *
   * @param path 目标路径，可包含查询串。
   * @param options 额外导航选项（替换模式、查询参数）。
   */
  const navigate = (path: string, options?: VueNavigateOptions) => {
    if (!router.value) return;
    const { path: targetPath, query: pathQuery } = extractPathAndQuery(path);
    const query = options?.query ?? pathQuery;
    router.value.push({
      path: targetPath,
      query,
      replace: options?.replace,
    });
  };

  return {
    navigate,
    /**
     * 当前完整路径（优先 `fullPath`，其次 `path`）。
     */
    currentPath: computed(() => route.value?.fullPath || route.value?.path || ''),
  };
}

/**
 * 暴露布局系统统一路由行为（菜单点击、标签切换、面包屑跳转等）。
 *
 * @returns 路由状态与布局交互方法集合。
 */
export function useRouter(): UseLayoutRouterReturn {
  /**
   * 布局上下文
   * @description 提供路由配置、当前路径与菜单联动配置。
   */
  const context = useLayoutContext();
  /**
   * 路由状态控制器
   * @description 统一封装路径解析、导航与菜单/标签跳转逻辑。
   */
  const controller = createLayoutRouterStateController({
    getRouterCurrentPath: () => context.props.router?.currentPath,
    getCurrentPath: () => context.props.currentPath,
    getLocation: () =>
      context.props.router?.location as
        | LayoutRouterLocation
        | undefined,
    getMode: () => context.props.router?.mode,
    getRouterNavigate: () => context.props.router?.navigate,
    getAutoActivateChild: () => context.props.sidebar?.autoActivateChild,
  });
  /**
   * 当前解析路径（优先路由器路径，其次受控路径）。
   */
  const currentPath = computed<string>(() => controller.getResolvedCurrentPath());

  return {
    currentPath,
    /**
     * 路由跳转。
     */
    navigate: controller.navigate,
    /**
     * 菜单点击导航处理。
     */
    handleMenuItemClick: controller.handleMenuItemClick,
    /**
     * 标签点击导航处理。
     */
    handleTabClick: controller.handleTabClick,
    /**
     * 面包屑点击导航处理。
     */
    handleBreadcrumbClick: controller.handleBreadcrumbClick,
    /**
     * 标签关闭后的兜底导航处理。
     */
    handleTabCloseNavigate: controller.handleTabCloseNavigate,
  };
}
