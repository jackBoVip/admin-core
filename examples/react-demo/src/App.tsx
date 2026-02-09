import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation, useNavigate, useRoutes } from 'react-router-dom';
import {
  BasicLayout,
  createReactRouteAccess,
  useReactRouterAdapter,
  type MenuItem,
  type RouteObject,
  type RouteModule,
  type RouteRecordStringComponent,
} from '@admin-core/layout-react';

import { staticRoutes } from './router/static-routes';
import { fetchMenuList } from './router/menu-api';

// 页面组件
import Home from './pages/Home';
import DashboardAnalysis from './pages/dashboard/Analysis';
import DashboardMonitor from './pages/dashboard/Monitor';
import DashboardWorkplace from './pages/dashboard/Workplace';
import SystemUser from './pages/system/User';
import SystemRole from './pages/system/Role';
import SystemMenu from './pages/system/Menu';
import SystemDept from './pages/system/Dept';
import ComponentsButton from './pages/components/Button';
import ComponentsForm from './pages/components/Form';
import ComponentsTable from './pages/components/Table';
import About from './pages/About';

const pageMap = {
  '/Home': Home,
  '/dashboard/Analysis': DashboardAnalysis,
  '/dashboard/Monitor': DashboardMonitor,
  '/dashboard/Workplace': DashboardWorkplace,
  '/system/User': SystemUser,
  '/system/Role': SystemRole,
  '/system/Menu': SystemMenu,
  '/system/Dept': SystemDept,
  '/components/Button': ComponentsButton,
  '/components/Form': ComponentsForm,
  '/components/Table': ComponentsTable,
  '/About': About,
};

// 用户信息
const userInfo = {
  id: '1',
  username: 'admin',
  displayName: 'Admin User',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  roles: ['admin'],
};

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const routerConfig = useReactRouterAdapter(navigate, location);

  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [routeObjects, setRouteObjects] = useState<RouteObject[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    // 自动扫描路由模块（类似常见 admin 模板的 import.meta.glob）
    const routeModules = import.meta.glob('./router/modules/**/*.ts', { eager: true }) as Record<string, RouteModule<RouteRecordStringComponent[]>>;

    createReactRouteAccess({
      // 静态路由常量（基础路由）
      staticRoutes,
      // 路由模块自动扫描（类似常见 admin 模板的模块化路由）
      routeModules,
      // 动态菜单 API（后端返回的路由）
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

  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      navigate('/login');
    }
  };

  const handleSearch = () => {};

  const handleRefresh = () => {};

  const handleLockScreen = () => {
    // 锁屏功能由 BasicLayout 内部的 PreferencesProvider 处理
    // 这里只是回调通知，实际的锁屏逻辑在 PreferencesProvider 中
  };

  // 锁屏状态由 BasicLayout 内部的 PreferencesProvider 和 LockScreen 组件处理
  // LockScreen 组件会根据 preferences.lockScreen.isLocked 自动显示/隐藏
  // 不需要在这里额外检查锁屏状态，避免状态不同步的问题
  // 如果路由未加载完成，显示加载状态
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
