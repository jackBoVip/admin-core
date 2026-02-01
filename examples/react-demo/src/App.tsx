import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  BasicLayout,
  useReactRouterAdapter,
  type MenuItem,
} from '@admin-core/layout-react';

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

// 菜单数据 - 更丰富的测试菜单
const menus: MenuItem[] = [
  {
    key: 'home',
    name: '首页',
    path: '/',
    icon: '🏠',
    affix: true,
  },
  {
    key: 'dashboard',
    name: '仪表盘',
    path: '/dashboard',
    icon: '📊',
    children: [
      {
        key: 'dashboard-analysis',
        name: '分析页',
        path: '/dashboard/analysis',
        icon: '📈',
      },
      {
        key: 'dashboard-monitor',
        name: '监控页',
        path: '/dashboard/monitor',
        icon: '🖥️',
      },
      {
        key: 'dashboard-workplace',
        name: '工作台',
        path: '/dashboard/workplace',
        icon: '💼',
      },
    ],
  },
  {
    key: 'system',
    name: '系统管理',
    path: '/system',
    icon: '⚙️',
    children: [
      {
        key: 'system-user',
        name: '用户管理',
        path: '/system/user',
        icon: '👤',
      },
      {
        key: 'system-role',
        name: '角色管理',
        path: '/system/role',
        icon: '👥',
      },
      {
        key: 'system-menu',
        name: '菜单管理',
        path: '/system/menu',
        icon: '📋',
      },
      {
        key: 'system-dept',
        name: '部门管理',
        path: '/system/dept',
        icon: '🏢',
      },
      {
        key: 'system-dict',
        name: '字典管理',
        path: '/system/dict',
        icon: '📖',
      },
      {
        key: 'system-config',
        name: '参数配置',
        path: '/system/config',
        icon: '🔧',
      },
    ],
  },
  {
    key: 'permission',
    name: '权限管理',
    icon: '🔐',
    children: [
      {
        key: 'permission-page',
        name: '页面权限',
        path: '/permission/page',
        icon: '📄',
      },
      {
        key: 'permission-btn',
        name: '按钮权限',
        path: '/permission/button',
        icon: '🔘',
      },
      {
        key: 'permission-api',
        name: '接口权限',
        path: '/permission/api',
        icon: '🔗',
      },
    ],
  },
  {
    key: 'components',
    name: '组件示例',
    path: '/components',
    icon: '🧩',
    children: [
      {
        key: 'components-basic',
        name: '基础组件',
        icon: '📦',
        children: [
          {
            key: 'components-button',
            name: '按钮',
            path: '/components/button',
          },
          {
            key: 'components-icon',
            name: '图标',
            path: '/components/icon',
          },
          {
            key: 'components-typography',
            name: '排版',
            path: '/components/typography',
          },
        ],
      },
      {
        key: 'components-form',
        name: '表单组件',
        icon: '📝',
        children: [
          {
            key: 'components-input',
            name: '输入框',
            path: '/components/form/input',
          },
          {
            key: 'components-select',
            name: '选择器',
            path: '/components/form/select',
          },
          {
            key: 'components-date',
            name: '日期选择',
            path: '/components/form/date',
          },
          {
            key: 'components-upload',
            name: '上传',
            path: '/components/form/upload',
          },
        ],
      },
      {
        key: 'components-table',
        name: '表格',
        path: '/components/table',
        icon: '📊',
      },
      {
        key: 'components-modal',
        name: '弹窗',
        path: '/components/modal',
        icon: '🪟',
      },
    ],
  },
  {
    key: 'feature',
    name: '功能示例',
    icon: '✨',
    children: [
      {
        key: 'feature-clipboard',
        name: '剪贴板',
        path: '/feature/clipboard',
        icon: '📋',
      },
      {
        key: 'feature-print',
        name: '打印',
        path: '/feature/print',
        icon: '🖨️',
      },
      {
        key: 'feature-watermark',
        name: '水印',
        path: '/feature/watermark',
        icon: '💧',
      },
      {
        key: 'feature-fullscreen',
        name: '全屏',
        path: '/feature/fullscreen',
        icon: '⛶',
      },
    ],
  },
  {
    key: 'chart',
    name: '图表',
    icon: '📉',
    children: [
      {
        key: 'chart-echarts',
        name: 'ECharts',
        icon: '📈',
        children: [
          {
            key: 'chart-echarts-line',
            name: '折线图',
            path: '/chart/echarts/line',
          },
          {
            key: 'chart-echarts-bar',
            name: '柱状图',
            path: '/chart/echarts/bar',
          },
          {
            key: 'chart-echarts-pie',
            name: '饼图',
            path: '/chart/echarts/pie',
          },
        ],
      },
      {
        key: 'chart-map',
        name: '地图',
        path: '/chart/map',
        icon: '🗺️',
      },
    ],
  },
  {
    key: 'nested',
    name: '多级嵌套',
    icon: '📂',
    children: [
      {
        key: 'nested-menu1',
        name: '菜单1',
        icon: '📁',
        children: [
          {
            key: 'nested-menu1-1',
            name: '菜单1-1',
            path: '/nested/menu1/menu1-1',
          },
          {
            key: 'nested-menu1-2',
            name: '菜单1-2',
            icon: '📁',
            children: [
              {
                key: 'nested-menu1-2-1',
                name: '菜单1-2-1',
                path: '/nested/menu1/menu1-2/menu1-2-1',
              },
              {
                key: 'nested-menu1-2-2',
                name: '菜单1-2-2',
                path: '/nested/menu1/menu1-2/menu1-2-2',
              },
            ],
          },
        ],
      },
      {
        key: 'nested-menu2',
        name: '菜单2',
        path: '/nested/menu2',
      },
    ],
  },
  {
    key: 'external',
    name: '外部链接',
    icon: '🔗',
    children: [
      {
        key: 'external-github',
        name: 'GitHub',
        externalLink: 'https://github.com',
        openInNewWindow: true,
        icon: '📦',
      },
      {
        key: 'external-docs',
        name: 'React文档',
        externalLink: 'https://react.dev',
        openInNewWindow: true,
        icon: '📚',
      },
    ],
  },
  {
    key: 'about',
    name: '关于',
    path: '/about',
    icon: 'ℹ️',
  },
];

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

  // 路由适配器
  const routerConfig = useReactRouterAdapter(navigate, location);

  // 事件处理
  const handleLogout = () => {
    if (confirm('确定要退出登录吗？')) {
      console.log('Logout');
      navigate('/login');
    }
  };

  const handleSearch = (keyword: string) => {
    console.log('Search:', keyword);
  };

  const handleRefresh = () => {
    console.log('Refresh page');
    window.location.reload();
  };

  const handleLockScreen = () => {
    console.log('Lock screen');
  };

  // 不传递 layout 属性，让布局响应偏好设置的变化
  // 用户可以通过偏好设置面板切换布局类型
  return (
    <BasicLayout
      menus={menus}
      router={routerConfig}
      userInfo={userInfo}
      logo={{ source: 'https://vitejs.dev/logo.svg' }}
      appName="Admin"
      locale="zh-CN"
      onLogout={handleLogout}
      onGlobalSearch={handleSearch}
      onRefresh={handleRefresh}
      onLockScreen={handleLockScreen}
      footerCenter={
        <div className="text-center text-sm text-gray-500 py-4">
          Copyright © 2024 Admin Core. All rights reserved.
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard/analysis" element={<DashboardAnalysis />} />
        <Route path="/dashboard/monitor" element={<DashboardMonitor />} />
        <Route path="/dashboard/workplace" element={<DashboardWorkplace />} />
        <Route path="/system/user" element={<SystemUser />} />
        <Route path="/system/role" element={<SystemRole />} />
        <Route path="/system/menu" element={<SystemMenu />} />
        <Route path="/system/dept" element={<SystemDept />} />
        <Route path="/components/button" element={<ComponentsButton />} />
        <Route path="/components/form" element={<ComponentsForm />} />
        <Route path="/components/table" element={<ComponentsTable />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </BasicLayout>
  );
}

export default AppLayout;
