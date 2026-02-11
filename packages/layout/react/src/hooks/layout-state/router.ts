import {
  applyQueryToPath,
  createLayoutRouterStateController,
  type RouterConfig,
} from '@admin-core/layout';
import { useMemo, useRef } from 'react';
import { useLayoutContext } from '../use-layout-context';

export function useReactRouterAdapter(
  navigate?: (path: string, options?: { replace?: boolean }) => void,
  location?: { pathname: string; search?: string }
): RouterConfig | undefined {
  if (!navigate || !location) {
    return undefined;
  }

  return {
    navigate: (path: string, options?: { replace?: boolean; query?: Record<string, unknown> }) => {
      const nextPath = applyQueryToPath(path, options?.query);
      navigate(nextPath, { replace: options?.replace });
    },
    currentPath: `${location.pathname}${location.search || ''}`,
    location,
  };
}

export function useRouter() {
  const context = useLayoutContext();
  const routerRef = useRef(context.props.router);
  routerRef.current = context.props.router;
  const currentPathRef = useRef(context.props.currentPath);
  currentPathRef.current = context.props.currentPath;
  const autoActivateChildRef = useRef(context.props.sidebar?.autoActivateChild);
  autoActivateChildRef.current = context.props.sidebar?.autoActivateChild;

  const controller = useMemo(
    () =>
      createLayoutRouterStateController({
        getRouterCurrentPath: () => routerRef.current?.currentPath,
        getCurrentPath: () => currentPathRef.current,
        getLocation: () =>
          routerRef.current?.location as
            | { pathname?: string; search?: string; hash?: string }
            | undefined,
        getMode: () => routerRef.current?.mode,
        getRouterNavigate: () => routerRef.current?.navigate,
        getAutoActivateChild: () => autoActivateChildRef.current,
      }),
    []
  );
  const currentPath = controller.getResolvedCurrentPath();

  return {
    currentPath,
    navigate: controller.navigate,
    handleMenuItemClick: controller.handleMenuItemClick,
    handleTabClick: controller.handleTabClick,
    handleBreadcrumbClick: controller.handleBreadcrumbClick,
    handleTabCloseNavigate: controller.handleTabCloseNavigate,
  };
}
