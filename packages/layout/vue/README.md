# @admin-core/layout-vue

简体中文 | [English](./README.en.md)

Vue 3 基础布局组件，开箱即用，高度集成偏好设置。

## 特性

- 🚀 **开箱即用** - 引入组件，传入数据即可使用
- 🎨 **Tailwind CSS v4** - 充分利用 v4 新特性
- 🌍 **国际化** - 内置中英文，支持扩展
- 🔌 **丰富插槽** - 每个区域预留插槽，高度可定制
- 📱 **响应式** - 自动适配移动端

## 对外导出

- **布局组件**：`BasicLayout` 及内置布局组件与菜单组件
- **组合式 API**：`useLayoutContext`、`useLayoutState`、`useLayoutComputed`、`useRouter` 等
- **偏好设置内置**：`initPreferences`、`PreferencesProvider`、`PreferencesDrawer` 等（来自 `@admin-core/preferences-vue`）
- **类型与常量**：从 `@admin-core/layout` 重新导出布局类型、配置与工具
- **路由构建器**：`createVueRouteAccess`（静态路由 + 动态菜单 -> 注入 Vue Router）
- **Vue 插件导出**：`install`、`LayoutPlugin`
- **样式入口**：`@admin-core/layout-vue/style.css`

## 导出索引（入口对齐）

说明：
- 入口文件：`src/index.ts`
- 发布类型：`dist/index.d.ts`
- 完整符号清单以 `dist/index.d.ts` 为准

入口分组：
1. 内置偏好（来自 `@admin-core/preferences-vue`）：`initPreferences`、`destroyPreferences`、`usePreferences`、`usePreferencesContext`、`PreferencesProvider`、`PreferencesDrawer`、`PreferencesTrigger` 等
2. 布局组件：`./components` 全量导出（layout/menu/widgets）
3. 组合式 API：`./composables` 全量导出（`useLayoutContext`、`useLayoutState`、`useTimer`、`useEventListener`）
4. 路由构建：`createVueRouteAccess`、`VueRouteAccessOptions`、`VueRouteAccessResult`
5. Vue 插件：`install`、`LayoutPlugin`
6. Core 再导出：`@admin-core/layout` 的类型、常量、工具、i18n、样式 token

## 安装

```bash
pnpm add @admin-core/layout-vue
```

## 快速开始

```vue
<script setup lang="ts">
import { BasicLayout } from '@admin-core/layout-vue';
import '@admin-core/layout-vue/style.css';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();

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
</script>

<template>
  <BasicLayout
    :menus="menus"
    :current-path="route.path"
    :auto-tab="{ enabled: true, affixKeys: ['/dashboard'] }"
    :auto-breadcrumb="{ enabled: true, showHome: true }"
    @menu-select="(item) => router.push(item.path)"
    @tab-select="(item) => router.push(item.path)"
    @breadcrumb-click="(item) => router.push(item.path)"
  >
    <router-view />
  </BasicLayout>
</template>
```

**自动模式说明：**
- 标签栏自动从菜单数据生成，根据 `currentPath` 自动添加标签
- 面包屑自动从菜单数据生成，根据 `currentPath` 自动计算路径

## 样式与动画变量

- 布局样式依赖 `@admin-core/preferences/styles` 提供的全局变量（如 `--admin-duration-*`、`--admin-easing-*`、`--admin-z-index-*`）。
- 页面过渡统一使用 `fade-*` 系列动画类（由 `@admin-core/preferences` 提供）。

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

```vue
<BasicLayout
  :menus="menus"
  :current-path="route.path"
  :auto-tab="{
    enabled: true,
    affixKeys: ['/dashboard', '/workbench'],
    maxCount: 10,
  }"
  :auto-breadcrumb="{
    enabled: true,
    showHome: true,
    homeName: '首页',
  }"
/>
```

## 插槽

### 顶栏插槽

- `header-logo` - Logo 区域
- `header-left` - 左侧区域
- `header-center` - 中间区域
- `header-menu` - 菜单区域
- `header-right` - 右侧区域
- `header-actions` - 操作区域
- `header-extra` - 额外内容

### 侧边栏插槽

- `sidebar-logo` - Logo 区域
- `sidebar-menu` - 菜单区域
- `sidebar-mixed-menu` - 混合菜单区域
- `sidebar-extra` - 额外内容
- `sidebar-footer` - 底部区域

### 标签栏插槽

- `tabbar` - 标签内容
- `tabbar-left` - 左侧区域
- `tabbar-right` - 右侧区域
- `tabbar-extra` - 额外内容

### 内容区插槽

- `content` / `default` - 主内容
- `content-header` - 内容头部
- `breadcrumb` - 面包屑
- `content-footer` - 内容底部
- `content-overlay` - 遮罩层

### 功能区插槽

- `panel` - 功能区内容
- `panel-header` - 功能区头部
- `panel-footer` - 功能区底部

## 事件

| 事件 | 参数 | 说明 |
|------|------|------|
| `sidebar-collapse` | `(collapsed: boolean)` | 侧边栏折叠状态变化 |
| `menu-select` | `(item, key)` | 菜单选择 |
| `tab-select` | `(item, key)` | 标签选择 |
| `tab-close` | `(item, key)` | 标签关闭 |
| `tab-close-all` | - | 关闭全部标签 |
| `tab-close-other` | `(exceptKey)` | 关闭其他标签 |
| `tab-refresh` | `(item, key)` | 刷新标签 |
| `tab-favorite-change` | `(menu, favorited, keys, menus)` | 标签收藏变化（单次操作） |
| `favorites-change` | `(menus, keys)` | 收藏列表变化 |

## Composables

```typescript
import {
  useLayoutContext,    // 获取布局上下文
  useLayoutComputed,   // 获取布局计算属性
  useLayoutCSSVars,    // 获取 CSS 变量
  useSidebarState,     // 侧边栏状态
  useHeaderState,      // 顶栏状态
  usePanelState,       // 功能区状态
  useMenuState,        // 菜单状态
  useTabsState,        // 标签状态
  useResponsive,       // 响应式断点
  useFullscreenState,  // 全屏状态
} from '@admin-core/layout-vue';
```

## 收藏菜单

`useTabsState()` 额外暴露收藏相关 API（用于后端同步/初始化）：

- `favoriteMenus`：当前收藏菜单完整数据
- `favoriteKeys`：收藏 key 列表
- `setFavoriteKeys(keys)`：初始化/覆盖收藏列表
- `handleToggleFavorite(key)`：收藏/取消收藏

## 高级用法

### 自定义菜单组件

```vue
<template>
  <BasicLayout :menus="menus">
    <template #sidebar-menu>
      <MyCustomMenu :menus="menus" />
    </template>
  </BasicLayout>
</template>
```

### 集成偏好设置

```vue
<script setup>
import { usePreferences } from '@admin-core/preferences-vue';

const { preferences } = usePreferences();
</script>

<template>
  <BasicLayout
    :layout="preferences.app.layout"
    :header="preferences.header"
    :sidebar="preferences.sidebar"
    :tabbar="preferences.tabbar"
  >
    <router-view />
  </BasicLayout>
</template>
```

## 许可证

MIT
