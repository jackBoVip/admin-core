import { useEffect, useState, type ComponentType } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useRoutes } from 'react-router-dom';
import {
  BasicLayout,
  createReactRouteAccess,
  useReactRouterAdapter,
  type RouteObject,
  type RouteModule,
  type RouteRecordStringComponent,
} from '@admin-core/layout-react';

import { staticRoutes } from './router/static-routes';
import { fetchMenuList } from './router/menu-api';

/**
 * 页面组件懒加载映射表。
 * @description Key 为以 `/src/pages` 开头的文件绝对虚拟路径，Value 为对应页面模块加载函数。
 */
const pageMap = import.meta.glob('/src/pages/**/*.tsx') as Record<
  string,
  () => Promise<{ /** ESM 默认导出的页面组件。 */
default: ComponentType }>
>;

/**
 * 路由访问解析结果类型。
 */
type RouteAccessResult = Awaited<ReturnType<typeof createReactRouteAccess>>;

/**
 * 当前登录用户信息（示例数据）。
 */
const userInfo = {
  id: '1',
  username: 'admin',
  displayName: 'Admin User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  roles: ['admin'],
};

/**
 * 示例应用主布局组件。
 * @description 负责拉取菜单、构建动态路由并渲染 `BasicLayout`。
 */
function AppLayout() {
  /**
   * React Router 导航函数。
   */
  const navigate = useNavigate();

  /**
   * 当前路由位置信息。
   */
  const location = useLocation();

  /**
   * 传给 `BasicLayout` 的路由适配配置。
   */
  const routerConfig = useReactRouterAdapter(navigate, location);

  /**
   * 左侧菜单数据。
   */
  const [menus, setMenus] = useState<RouteAccessResult['menus']>([]);

  /**
   * 最终用于 `useRoutes` 的路由对象数组。
   */
  const [routeObjects, setRouteObjects] = useState<RouteObject[]>([]);

  /**
   * 路由与菜单是否已完成初始化。
   */
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    /**
     * 自动扫描路由模块（类似常见 admin 模板的 `import.meta.glob`）。
     */
    const routeModules = import.meta.glob('./router/modules/**/*.ts', { eager: true }) as Record<string, RouteModule<RouteRecordStringComponent[]>>;

    createReactRouteAccess({
      /**
       * 静态路由常量（基础路由）。
       */
      staticRoutes,
      /**
       * 路由模块自动扫描（类似常见 admin 模板的模块化路由）。
       */
      routeModules,
      /**
       * 动态菜单 API（后端返回的路由）。
       */
      fetchMenuList,
      pageMap,
      viewsRoot: '/src/pages',
      layoutMap: {
        LAYOUT: Outlet,
      },
      routerComponents: {
        Navigate,
        Outlet,
      },
    }).then(({ menus, routeObjects }) => {
      if (!active) return;
      setMenus(menus);
      setRouteObjects(routeObjects);
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, []);

  const outlet = useRoutes(
    routeObjects.length > 0
      ? routeObjects
      : [{ path: '*', element: null }]
  );

  /**
   * 处理退出登录事件。
   *
   * @returns 无返回值。
   */
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      navigate('/login');
    }
  };

  /**
   * 处理全局搜索触发事件。
   * @description 示例项目预留扩展点，当前不执行具体逻辑。
   *
   * @returns 无返回值。
   */
  const handleSearch = () => {};

  /**
   * 处理页面刷新事件。
   * @description 示例项目预留扩展点，当前不执行具体逻辑。
   *
   * @returns 无返回值。
   */
  const handleRefresh = () => {};

  /**
   * 处理锁屏触发回调。
   * @description 锁屏状态由 `BasicLayout` 内部偏好系统统一管理，此处仅保留扩展入口。
   *
   * @returns 无返回值。
   */
  const handleLockScreen = () => {
  };

  /**
   * 路由尚未完成加载时，直接返回空视图。
   * @description 锁屏状态由 `BasicLayout` 内部组件接管，这里无需额外判断。
   */
  if (!ready) return null;

  return (
    <BasicLayout
      menus={menus}
      router={routerConfig}
      userInfo={userInfo}
      logo={{ source: '/vite.svg' }}
      appName="Admin"
      onLogout={handleLogout}
      onGlobalSearch={handleSearch}
      onRefresh={handleRefresh}
      onLockScreen={handleLockScreen}
    >
      {outlet}
    </BasicLayout>
  );
}

export default AppLayout;
