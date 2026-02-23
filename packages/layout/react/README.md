# @admin-core/layout-react

简体中文 | [English](./README.en.md)

React 基础布局组件，开箱即用，高度集成偏好设置。

## 特性

- 🚀 **开箱即用** - 引入组件，传入数据即可使用
- 🎨 **Tailwind CSS v4** - 充分利用 v4 新特性
- 🌍 **国际化** - 内置中英文，支持扩展
- 🔌 **丰富插槽** - 每个区域支持 ReactNode，高度可定制
- 📱 **响应式** - 自动适配移动端

## 对外导出

- **布局组件**：`BasicLayout` 及内置布局组件与菜单组件
- **Hooks**：`useLayoutContext`、`useLayoutState`、`useLayoutComputed`、`useRouter` 等
- **偏好设置内置**：`initPreferences`、`PreferencesProvider`、`PreferencesDrawer` 等（来自 `@admin-core/preferences-react`）
- **类型与常量**：从 `@admin-core/layout` 重新导出布局类型、配置与工具
- **路由构建器**：`createReactRouteAccess`（静态路由 + 动态菜单 -> React Router `routeObjects`）
- **样式入口**：`@admin-core/layout-react/style.css`

## 导出索引（入口对齐）

说明：
- 入口文件：`src/index.ts`
- 发布类型：`dist/index.d.ts`
- 完整符号清单以 `dist/index.d.ts` 为准

入口分组：
1. 内置偏好（来自 `@admin-core/preferences-react`）：`initPreferences`、`destroyPreferences`、`usePreferences`、`usePreferencesContext`、`PreferencesProvider`、`PreferencesDrawer`、`PreferencesTrigger`、`useAdminAntdTheme` 等
2. 布局组件：`./components` 全量导出（layout/menu/widgets/ErrorBoundary）
3. 布局 Hooks：`./hooks` 全量导出（`useLayoutContext`、`useLayoutState` 等）
4. 工具函数：`./utils` 全量导出
5. 路由构建：`createReactRouteAccess`、`ReactRouteAccessOptions`、`ReactRouteAccessResult`
6. Core 再导出：`@admin-core/layout` 的类型、常量、工具、i18n、样式 token

## 安装

```bash
pnpm add @admin-core/layout-react
```


### CDN（生产/开发）

```html
<!-- jsDelivr（推荐） -->
<script src="https://cdn.jsdelivr.net/npm/@admin-core/layout-react/dist/index.global.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@admin-core/layout-react/dist/index.global.dev.js"></script>

<!-- unpkg -->
<script src="https://unpkg.com/@admin-core/layout-react/dist/index.global.js"></script>
<script src="https://unpkg.com/@admin-core/layout-react/dist/index.global.dev.js"></script>
```

## 快速开始

```tsx
import { BasicLayout } from '@admin-core/layout-react';
import '@admin-core/layout-react/style.css';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';

// 菜单数据
const menus = [
  { key: '/dashboard', name: '仪表盘', icon: 'dashboard', path: '/dashboard' },
  {
    key: '/system',
    name: '系统管理',
    icon: 'setting',
    children: [
      { key: '/system/user', name: '用户管理', path: '/system/user' },
      { key: '/system/role', name: '角色管理', path: '/system/role' },
    ],
  },
];

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <BasicLayout
      menus={menus}
      currentPath={location.pathname}
      autoTab={{ enabled: true, affixKeys: ['/dashboard'] }}
      autoBreadcrumb={{ enabled: true, showHome: true }}
      onMenuSelect={(item) => navigate(item.path)}
      onTabSelect={(item) => navigate(item.path)}
      onBreadcrumbClick={(item) => navigate(item.path)}
    >
      <Outlet />
    </BasicLayout>
  );
}
```

**自动模式说明：**
- 标签栏自动从菜单数据生成，根据 `currentPath` 自动添加标签
- 面包屑自动从菜单数据生成，根据 `currentPath` 自动计算路径

## 样式与动画变量

- 布局样式依赖 `@admin-core/preferences/styles` 提供的全局变量（如 `--admin-duration-*`、`--admin-easing-*`、`--admin-z-index-*`）。
- 页面过渡统一使用 `fade-*` 系列动画类（由 `@admin-core/preferences` 提供）。

## 与 Form/Table 组合（避免重复样式）

当项目同时使用 `@admin-core/form-react`、`@admin-core/layout-react`、`@admin-core/table-react` 时，推荐只在应用入口按以下顺序引入样式：

```css
@import "@admin-core/preferences/styles/antd";
@import "@admin-core/layout-react/style.css";
@import "@admin-core/form-react/style.css";
@import "@admin-core/table-react/style.css";
```

- `@admin-core/layout-react/style.css` 已包含 `tailwindcss`，不要在应用层再额外 `@import "tailwindcss"`。
- `@admin-core/table-react/style.css` 已包含 `antd/dist/reset.css`，不要重复引入 Ant Design reset。

## Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `layout` | `LayoutType` | `'sidebar-nav'` | 布局类型 |
| `menus` | `MenuItem[]` | `[]` | 菜单数据 |
| `currentPath` | `string` | - | 当前路径（用于自动标签/面包屑） |
| `autoTab` | `AutoTabConfig` | `{ enabled: true }` | 自动标签配置 |
| `autoBreadcrumb` | `AutoBreadcrumbConfig` | `{ enabled: true }` | 自动面包屑配置 |
| `tabs` | `TabItem[]` | `[]` | 标签数据（手动模式） |
| `breadcrumbs` | `BreadcrumbItem[]` | `[]` | 面包屑数据（手动模式） |
| `activeMenuKey` | `string` | - | 当前激活菜单 |
| `activeTabKey` | `string` | - | 当前激活标签 |
| `header` | `HeaderPreferences` | - | 顶栏配置 |
| `sidebar` | `SidebarPreferences` | - | 侧边栏配置 |
| `tabbar` | `TabbarPreferences` | - | 标签栏配置 |
| `locale` | `'zh-CN' \| 'en-US'` | `'zh-CN'` | 语言 |

## 自动标签/面包屑

### AutoTabConfig

```typescript
interface AutoTabConfig {
  enabled?: boolean;      // 启用自动标签（默认 true）
  affixKeys?: string[];   // 固定标签的菜单 key 列表
  maxCount?: number;      // 最大标签数量（0 表示不限制）
  persistKey?: string;    // 持久化存储 key
}
```

### AutoBreadcrumbConfig

```typescript
interface AutoBreadcrumbConfig {
  enabled?: boolean;     // 启用自动面包屑（默认 true）
  showHome?: boolean;    // 显示首页
  homePath?: string;     // 首页路径
  homeName?: string;     // 首页名称
  homeIcon?: string;     // 首页图标
}
```

### 使用示例

```tsx
<BasicLayout
  menus={menus}
  currentPath={location.pathname}
  autoTab={{
    enabled: true,
    affixKeys: ['/dashboard', '/workbench'],
    maxCount: 10,
  }}
  autoBreadcrumb={{
    enabled: true,
    showHome: true,
    homeName: '首页',
  }}
/>
```

## 插槽 Props

### 顶栏

- `headerLogo` - Logo 区域
- `headerLeft` - 左侧区域
- `headerCenter` - 中间区域
- `headerMenu` - 菜单区域
- `headerRight` - 右侧区域
- `headerActions` - 操作区域
- `headerExtra` - 额外内容

### 侧边栏

- `sidebarLogo` - Logo 区域
- `sidebarMenu` - 菜单区域
- `sidebarMixedMenu` - 混合菜单区域
- `sidebarExtra` - 额外内容
- `sidebarFooter` - 底部区域

### 标签栏

- `tabbar` - 标签内容
- `tabbarLeft` - 左侧区域
- `tabbarRight` - 右侧区域
- `tabbarExtra` - 额外内容

### 内容区

- `content` / `children` - 主内容
- `contentHeader` - 内容头部
- `breadcrumb` - 面包屑
- `contentFooter` - 内容底部
- `contentOverlay` - 遮罩层

### 功能区

- `panel` - 功能区内容
- `panelHeader` - 功能区头部
- `panelFooter` - 功能区底部

## 事件回调

| 回调 | 参数 | 说明 |
|------|------|------|
| `onSidebarCollapse` | `(collapsed: boolean)` | 侧边栏折叠状态变化 |
| `onMenuSelect` | `(item, key)` | 菜单选择 |
| `onTabSelect` | `(item, key)` | 标签选择 |
| `onTabClose` | `(item, key)` | 标签关闭 |
| `onTabCloseAll` | - | 关闭全部标签 |
| `onTabCloseOther` | `(exceptKey)` | 关闭其他标签 |
| `onTabRefresh` | `(item, key)` | 刷新标签 |
| `onTabFavoriteChange` | `(menu, favorited, keys, menus)` | 标签收藏变化（单次操作） |
| `onFavoritesChange` | `(menus, keys)` | 收藏列表变化 |

## Hooks

```typescript
import {
  useLayoutContext,    // 获取布局上下文
  useLayoutComputed,   // 获取布局计算属性
  useLayoutCSSVars,    // 获取 CSS 变量
  useLayoutState,      // 布局状态（带 setter）
  useSidebarState,     // 侧边栏状态
  useHeaderState,      // 顶栏状态
  usePanelState,       // 功能区状态
  useMenuState,        // 菜单状态
  useTabsState,        // 标签状态
  useResponsive,       // 响应式断点
  useFullscreenState,  // 全屏状态
} from '@admin-core/layout-react';
```

## 收藏菜单

`useTabsState()` 额外暴露收藏相关 API（用于后端同步/初始化）：

- `favoriteMenus`：当前收藏菜单完整数据
- `favoriteKeys`：收藏 key 列表
- `setFavoriteKeys(keys)`：初始化/覆盖收藏列表
- `handleToggleFavorite(key)`：收藏/取消收藏

## 高级用法

### 自定义菜单组件

```tsx
function App() {
  return (
    <BasicLayout
      menus={menus}
      sidebarMenu={<MyCustomMenu menus={menus} />}
    >
      <Outlet />
    </BasicLayout>
  );
}
```

### 集成偏好设置

```tsx
import { usePreferences } from '@admin-core/preferences-react';

function App() {
  const { preferences } = usePreferences();

  return (
    <BasicLayout
      layout={preferences.app.layout}
      header={preferences.header}
      sidebar={preferences.sidebar}
      tabbar={preferences.tabbar}
    >
      <Outlet />
    </BasicLayout>
  );
}
```

## 许可证

MIT
