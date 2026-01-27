import { useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  initPreferences,
  usePreferences,
  useTheme,
  useLayout,
  PreferencesDrawer,
  PreferencesTrigger,
  AdminIcon,
} from '@admin-core/preferences-react';

// 页面组件
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import About from './pages/About';

// 初始化偏好设置
initPreferences({
  namespace: 'react-demo',
  overrides: {
    app: {
      name: 'React Demo',
    },
  },
});

// 导航菜单配置
const menuItems = [
  { path: '/', name: '首页', icon: 'home' as const },
  { path: '/dashboard', name: '仪表盘', icon: 'dashboard' as const },
  { path: '/settings', name: '设置演示', icon: 'settings' as const },
  { path: '/about', name: '关于', icon: 'info' as const },
];

function App() {
  const { preferences, setPreferences } = usePreferences();
  const { isDark, toggleTheme } = useTheme();
  const { toggleSidebar } = useLayout();

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);

  // 侧边栏折叠状态
  const sidebarCollapsed = preferences.sidebar.collapsed;

  return (
    <div className="app-layout">
      {/* 顶栏 */}
      <header className="app-header admin-header">
        <div className="toolbar">
          {/* 侧边栏折叠按钮 */}
          <button
            className="sidebar-toggle"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <AdminIcon name={sidebarCollapsed ? 'menu' : 'close'} size="sm" />
          </button>
          <div className="logo">
            <AdminIcon name="dashboard" size="md" />
            {!sidebarCollapsed && <span>{preferences.app.name}</span>}
          </div>
        </div>

        <div className="toolbar-spacer" />

        <div className="toolbar">
          {/* 语言切换 */}
          <button
            className="lang-toggle"
            onClick={() => setPreferences({
              app: { locale: preferences.app.locale === 'zh-CN' ? 'en-US' : 'zh-CN' }
            })}
            title="切换语言"
          >
            {preferences.app.locale === 'zh-CN' ? '中' : 'En'}
          </button>
          {/* 主题切换 */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title={isDark ? '切换到亮色' : '切换到暗色'}
          >
            <AdminIcon name={isDark ? 'sun' : 'moon'} size="sm" />
          </button>
        </div>
      </header>

      {/* 侧边栏 */}
      <aside className={`app-sidebar admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <nav>
          <ul className="nav-menu">
            {menuItems.map((item) => (
              <li key={item.path} className="nav-item">
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >
                  <AdminIcon name={item.icon} size="sm" className="nav-icon" />
                  {!sidebarCollapsed && (
                    <span className="nav-text">{item.name}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* 主内容区 */}
      <main className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>

      {/* 偏好设置触发按钮 */}
      <PreferencesTrigger onClick={() => setDrawerOpen(true)} />

      {/* 偏好设置抽屉 */}
      <PreferencesDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
}

export default App;
