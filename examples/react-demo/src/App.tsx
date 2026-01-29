import { useState, useMemo, createContext, useContext } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import {
  initPreferences,
  usePreferences,
  useTheme,
  useLayout,
  PreferencesProvider,
  usePreferencesContext,
  AdminIcon,
} from '@admin-core/preferences-react';
import type { PreferencesDrawerUIConfig } from '@admin-core/preferences';

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

// UI 配置状态 Context
interface UIConfigState {
  // Tab 级别
  hideShortcutKeys: boolean;
  setHideShortcutKeys: (v: boolean) => void;
  hideAppearanceTab: boolean;
  setHideAppearanceTab: (v: boolean) => void;
  disableLayoutTab: boolean;
  setDisableLayoutTab: (v: boolean) => void;
  
  // 头部按钮
  hideImportButton: boolean;
  setHideImportButton: (v: boolean) => void;
  disableReset: boolean;
  setDisableReset: (v: boolean) => void;
  hidePinButton: boolean;
  setHidePinButton: (v: boolean) => void;
  
  // 底部按钮
  hideCopyButton: boolean;
  setHideCopyButton: (v: boolean) => void;
  
  // 外观设置
  disableThemeMode: boolean;
  setDisableThemeMode: (v: boolean) => void;
  hideBuiltinTheme: boolean;
  setHideBuiltinTheme: (v: boolean) => void;
  disableRadius: boolean;
  setDisableRadius: (v: boolean) => void;
  hideFontSize: boolean;
  setHideFontSize: (v: boolean) => void;
  disableColorMode: boolean;
  setDisableColorMode: (v: boolean) => void;
  
  // 布局设置
  hideLayoutType: boolean;
  setHideLayoutType: (v: boolean) => void;
  disableContentWidth: boolean;
  setDisableContentWidth: (v: boolean) => void;
  hideSidebar: boolean;
  setHideSidebar: (v: boolean) => void;
  disablePanel: boolean;
  setDisablePanel: (v: boolean) => void;
  hideHeader: boolean;
  setHideHeader: (v: boolean) => void;
  disableTabbar: boolean;
  setDisableTabbar: (v: boolean) => void;
  hideBreadcrumb: boolean;
  setHideBreadcrumb: (v: boolean) => void;
  disableFooterBlock: boolean;
  setDisableFooterBlock: (v: boolean) => void;
  
  // 通用设置
  hideLanguage: boolean;
  setHideLanguage: (v: boolean) => void;
  disableDynamicTitle: boolean;
  setDisableDynamicTitle: (v: boolean) => void;
  hideLockScreen: boolean;
  setHideLockScreen: (v: boolean) => void;
  disableWatermark: boolean;
  setDisableWatermark: (v: boolean) => void;
}

const UIConfigContext = createContext<UIConfigState | null>(null);

export function useUIConfigState() {
  const ctx = useContext(UIConfigContext);
  if (!ctx) throw new Error('useUIConfigState must be used within App');
  return ctx;
}

// 导航菜单配置
const menuItems = [
  { path: '/', name: '首页', icon: 'home' as const },
  { path: '/dashboard', name: '仪表盘', icon: 'dashboard' as const },
  { path: '/settings', name: '设置演示', icon: 'settings' as const },
  { path: '/about', name: '关于', icon: 'info' as const },
];

// 主布局组件
function AppLayout() {
  const { preferences, setPreferences } = usePreferences();
  const { isDark, toggleTheme } = useTheme();
  const { toggleSidebar } = useLayout();
  const { lock, isLockEnabled } = usePreferencesContext();

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
          {/* 锁屏按钮 - 功能启用时显示 */}
          {isLockEnabled && (
            <button
              className="lock-toggle"
              onClick={lock}
              title="锁屏 (Ctrl+Shift+L)"
            >
              <AdminIcon name="lock" size="sm" />
            </button>
          )}
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
    </div>
  );
}

function App() {
  // UI 配置状态
  const [hideShortcutKeys, setHideShortcutKeys] = useState(false);
  const [hideAppearanceTab, setHideAppearanceTab] = useState(false);
  const [disableLayoutTab, setDisableLayoutTab] = useState(false);
  const [hideImportButton, setHideImportButton] = useState(false);
  const [disableReset, setDisableReset] = useState(false);
  const [hidePinButton, setHidePinButton] = useState(false);
  const [hideCopyButton, setHideCopyButton] = useState(false);
  const [disableThemeMode, setDisableThemeMode] = useState(false);
  const [hideBuiltinTheme, setHideBuiltinTheme] = useState(false);
  const [disableRadius, setDisableRadius] = useState(false);
  const [hideFontSize, setHideFontSize] = useState(false);
  const [disableColorMode, setDisableColorMode] = useState(false);
  const [hideLayoutType, setHideLayoutType] = useState(false);
  const [disableContentWidth, setDisableContentWidth] = useState(false);
  const [hideSidebar, setHideSidebar] = useState(false);
  const [disablePanel, setDisablePanel] = useState(false);
  const [hideHeader, setHideHeader] = useState(false);
  const [disableTabbar, setDisableTabbar] = useState(false);
  const [hideBreadcrumb, setHideBreadcrumb] = useState(false);
  const [disableFooterBlock, setDisableFooterBlock] = useState(false);
  const [hideLanguage, setHideLanguage] = useState(false);
  const [disableDynamicTitle, setDisableDynamicTitle] = useState(false);
  const [hideLockScreen, setHideLockScreen] = useState(false);
  const [disableWatermark, setDisableWatermark] = useState(false);

  // 动态生成 UI 配置
  const drawerUIConfig = useMemo<PreferencesDrawerUIConfig>(() => ({
    shortcutKeys: { visible: !hideShortcutKeys },
    appearance: {
      visible: !hideAppearanceTab,
      themeMode: { disabled: disableThemeMode },
      builtinTheme: { visible: !hideBuiltinTheme },
      radius: { disabled: disableRadius },
      fontSize: { visible: !hideFontSize },
      colorMode: { disabled: disableColorMode },
    },
    layout: {
      disabled: disableLayoutTab,
      layoutType: { visible: !hideLayoutType },
      contentWidth: { disabled: disableContentWidth },
      sidebar: { visible: !hideSidebar },
      panel: { disabled: disablePanel },
      header: { visible: !hideHeader },
      tabbar: { disabled: disableTabbar },
      breadcrumb: { visible: !hideBreadcrumb },
      footer: { disabled: disableFooterBlock },
    },
    general: {
      language: { visible: !hideLanguage },
      dynamicTitle: { disabled: disableDynamicTitle },
      lockScreen: { visible: !hideLockScreen },
      watermark: { disabled: disableWatermark },
    },
    headerActions: {
      import: { visible: !hideImportButton },
      reset: { disabled: disableReset },
      pin: { visible: !hidePinButton },
    },
    footerActions: {
      copy: { visible: !hideCopyButton },
    },
  }), [
    hideShortcutKeys, hideAppearanceTab, disableLayoutTab,
    hideImportButton, disableReset, hidePinButton, hideCopyButton,
    disableThemeMode, hideBuiltinTheme, disableRadius, hideFontSize, disableColorMode,
    hideLayoutType, disableContentWidth, hideSidebar, disablePanel,
    hideHeader, disableTabbar, hideBreadcrumb, disableFooterBlock,
    hideLanguage, disableDynamicTitle, hideLockScreen, disableWatermark,
  ]);

  const uiConfigState: UIConfigState = {
    hideShortcutKeys, setHideShortcutKeys,
    hideAppearanceTab, setHideAppearanceTab,
    disableLayoutTab, setDisableLayoutTab,
    hideImportButton, setHideImportButton,
    disableReset, setDisableReset,
    hidePinButton, setHidePinButton,
    hideCopyButton, setHideCopyButton,
    disableThemeMode, setDisableThemeMode,
    hideBuiltinTheme, setHideBuiltinTheme,
    disableRadius, setDisableRadius,
    hideFontSize, setHideFontSize,
    disableColorMode, setDisableColorMode,
    hideLayoutType, setHideLayoutType,
    disableContentWidth, setDisableContentWidth,
    hideSidebar, setHideSidebar,
    disablePanel, setDisablePanel,
    hideHeader, setHideHeader,
    disableTabbar, setDisableTabbar,
    hideBreadcrumb, setHideBreadcrumb,
    disableFooterBlock, setDisableFooterBlock,
    hideLanguage, setHideLanguage,
    disableDynamicTitle, setDisableDynamicTitle,
    hideLockScreen, setHideLockScreen,
    disableWatermark, setDisableWatermark,
  };

  return (
    <UIConfigContext.Provider value={uiConfigState}>
      <PreferencesProvider
        username="Admin"
        uiConfig={drawerUIConfig}
        onLogout={() => {
          if (confirm('确定要退出登录吗？')) {
            console.log('Logout');
          }
        }}
        onSearch={() => console.log('Open search dialog')}
      >
        <AppLayout />
      </PreferencesProvider>
    </UIConfigContext.Provider>
  );
}

export default App;
