# @admin-core/preferences-react

简体中文 | [English](./README.md)

> React 18 偏好设置集成，提供 Hooks 和组件。

## 特性

- **React 18+ 支持**: 使用 React 18 特性，包括 `useSyncExternalStore`
- **Hooks API**: 简洁直观的状态管理 Hooks
- **开箱即用组件**: 预构建的抽屉、标签页和表单组件
- **TypeScript**: 完整的类型定义，类型安全
- **渲染优化**: 智能订阅，最小化重新渲染

## 对外导出

- **初始化**：`initPreferences`、`destroyPreferences`、`getPreferencesManager`
- **Provider / 组件**：`PreferencesProvider`、`PreferencesDrawer`、`PreferencesTrigger`、各类 Tab 与表单项
- **Hooks**：`usePreferences`、`usePreferencesContext`、`usePreferencesCategory`、`useLayout`、`useTheme`
- **再导出**：`@admin-core/preferences` 的类型、常量、语言包与图标

## 安装

```bash
# npm
npm install @admin-core/preferences-react

# pnpm
pnpm add @admin-core/preferences-react

# yarn
yarn add @admin-core/preferences-react
```

**对等依赖:**
- `react >= 18.0.0`
- `react-dom >= 18.0.0`

## 快速开始

### 1. 初始化偏好设置

```tsx
// main.tsx 或 App.tsx
import { initPreferences } from '@admin-core/preferences-react';
import '@admin-core/preferences/styles';

// 应用启动时初始化一次
initPreferences({
  namespace: 'my-app',
  overrides: {
    theme: { colorPrimary: 'oklch(0.6 0.2 250)' },
    app: { locale: 'zh-CN' },
  },
});
```

### 2. 使用 PreferencesProvider（推荐）

`PreferencesProvider` 组件自动集成锁屏、快捷键和偏好设置抽屉功能。

```tsx
// App.tsx
import { PreferencesProvider } from '@admin-core/preferences-react';

function App() {
  const handleLogout = () => {
    // 处理登出
  };

  const handleSearch = () => {
    // 处理全局搜索
  };

  return (
    <PreferencesProvider
      onLogout={handleLogout}
      onSearch={handleSearch}
    >
      <YourAppContent />
    </PreferencesProvider>
  );
}
```

### 3. 在组件中使用 Hooks

```tsx
import { usePreferences, usePreferencesContext } from '@admin-core/preferences-react';

function MyComponent() {
  // 访问偏好设置状态
  const { preferences, setPreferences, isDark, toggleTheme } = usePreferences();
  
  // 访问 Provider 上下文（锁屏、抽屉控制）
  const { lock, togglePreferences, isPreferencesOpen } = usePreferencesContext();

  return (
    <div>
      <p>当前主题: {isDark ? '深色' : '浅色'}</p>
      <button onClick={toggleTheme}>切换主题</button>
      <button onClick={togglePreferences}>打开设置</button>
      <button onClick={lock}>锁定屏幕</button>
    </div>
  );
}
```

## 进阶用法

### 使用独立 Hooks

```tsx
import { useTheme, useLayout } from '@admin-core/preferences-react';

function ThemeToggle() {
  const { isDark, toggleTheme, setPrimaryColor } = useTheme();
  
  return (
    <div>
      <button onClick={toggleTheme}>
        {isDark ? '🌙' : '☀️'}
      </button>
      <button onClick={() => setPrimaryColor('oklch(0.6 0.2 150)')}>
        绿色主题
      </button>
    </div>
  );
}

function SidebarToggle() {
  const { isSidebarCollapsed, toggleSidebar, setLayout } = useLayout();
  
  return (
    <div>
      <button onClick={toggleSidebar}>
        {isSidebarCollapsed ? '展开' : '折叠'}
      </button>
      <button onClick={() => setLayout('header-nav')}>
        使用顶部导航
      </button>
    </div>
  );
}
```

### 使用分类 Hook

```tsx
import { usePreferencesCategory } from '@admin-core/preferences-react';

function TabbarSettings() {
  const { value, setValue, reset } = usePreferencesCategory('tabbar');
  
  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={value.enable}
          onChange={(e) => setValue({ enable: e.target.checked })}
        />
        启用标签栏
      </label>
      <button onClick={reset}>重置为默认</button>
    </div>
  );
}
```

### 单独使用组件

```tsx
import {
  PreferencesDrawer,
  PreferencesTrigger,
  AppearanceTab,
  LayoutTab,
} from '@admin-core/preferences-react';

function Settings() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <PreferencesTrigger onClick={() => setOpen(true)} />
      
      <PreferencesDrawer
        open={open}
        onOpenChange={setOpen}
        defaultTab="appearance"
      />
    </>
  );
}
```

## 组件

### PreferencesProvider

主要包装组件，提供上下文并集成各项功能。

```tsx
<PreferencesProvider
  onLogout={() => {}}           // 登出回调
  onSearch={() => {}}           // 搜索回调
  lockScreenBackground="url"    // 自定义锁屏背景
  enableShortcuts={true}        // 启用键盘快捷键
  enableLockScreen={true}       // 启用锁屏功能
>
  {children}
</PreferencesProvider>
```

### PreferencesDrawer

带有标签页导航的设置抽屉。

```tsx
<PreferencesDrawer
  open={open}                    // 受控打开状态
  onOpenChange={setOpen}         // 打开状态变更处理器
  defaultTab="appearance"        // 默认活动标签页
  tabs={['appearance', 'layout', 'general', 'shortcuts']} // 可见标签页
/>
```

### 标签页组件

可独立使用的各个标签页组件：

- `AppearanceTab` - 主题、颜色、模式设置
- `LayoutTab` - 布局类型、侧边栏、顶栏设置
- `GeneralTab` - 语言、快捷键、水印设置
- `ShortcutKeysTab` - 键盘快捷键配置

### 表单组件

用于自定义设置 UI 的构建块：

- `PreferencesBlock` - 带标题的区块容器
- `PreferencesSwitchItem` - 开关切换
- `PreferencesSelectItem` - 下拉选择
- `PreferencesSliderItem` - 范围滑块

## API 参考

完整的 API 参考请参见 [API 文档](./API.md)。

## 相关链接

- [@admin-core/preferences](../core/README.zh-CN.md) - 核心包
- [@admin-core/preferences-vue](../vue/README.zh-CN.md) - Vue 集成

## 许可证

MIT
