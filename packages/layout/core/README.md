# @admin-core/layout

简体中文 | [English](./README.en.md)

基础布局包核心，提供框架无关的类型定义、配置、国际化和工具函数。

## 特性

- 🎯 **开箱即用** - 用户只需传入数据，无需关注布局实现
- 🎨 **7 种布局模式** - sidebar-nav、header-nav、mixed-nav 等
- 🌍 **国际化支持** - 内置中英文，支持扩展
- 🎛️ **高度可配置** - 所有配置项均可自定义
- 📦 **框架无关** - 核心逻辑与框架解耦

## 对外导出

- **类型与常量**：布局类型、默认配置、尺寸与动画常量
- **工具函数**：菜单/标签/路由/布局计算、主题、水印、快捷键等
- **国际化**：`createI18n` 与内置中英文语言包
- **样式与图标**：布局样式入口与内置图标

## 导出索引（入口对齐）

说明：
- 入口文件：`src/index.ts`
- 发布类型：`dist/index.d.ts`
- 完整符号清单以 `dist/index.d.ts` 为准（README 展示高频 API）

入口模块导出：
1. `./types`：布局主类型、运行时类型、Route/Menu/Tab 类型
2. `./constants`：默认配置、断点、动画常量、CSS 变量常量
3. `./utils`：布局计算、菜单/标签/路由构建、主题/水印、运行时控制器
4. `./locales`：`createI18n`、`zhCN`、`enUS`、`builtinLocales`
5. `./styles`：`layoutThemeTokens`、`tailwindThemeCSS`、`layoutFullCSS` 等
6. `./icons`：布局图标定义与图标解析工具

子路径导出（`package.json`）：
- `@admin-core/layout/styles`
- `@admin-core/layout/styles/layout.css`
- `@admin-core/layout/locales/*`

## 安装

```bash
pnpm add @admin-core/layout
```

## 布局类型

| 类型 | 说明 |
|------|------|
| `sidebar-nav` | 侧边导航（默认） |
| `sidebar-mixed-nav` | 侧边混合导航 |
| `header-nav` | 顶部导航 |
| `header-sidebar-nav` | 顶部通栏+侧边导航 |
| `mixed-nav` | 混合导航 |
| `header-mixed-nav` | 顶部混合导航 |
| `full-content` | 全屏内容 |

## 配置项

### 顶栏配置 (HeaderPreferences)

```typescript
{
  enable: true,           // 启用顶栏
  height: 48,             // 顶栏高度 (px)
  widgetSize: 36,         // 顶栏图标按钮尺寸 (px)
  widgetIconSize: 20,     // 顶栏图标大小 (px)
  widgetFontSize: 12,     // 顶栏文字大小 (px)
  searchKbdFontSize: 11,  // 顶栏搜索快捷键字体大小 (px)
  hidden: false,          // 隐藏顶栏
  menuAlign: 'start',     // 菜单对齐: 'start' | 'center' | 'end'
  menuLauncher: false,    // 菜单启动器模式
  mode: 'fixed',          // 模式: 'fixed' | 'static' | 'auto' | 'auto-scroll'
}
```

### 侧边栏配置 (SidebarPreferences)

```typescript
{
  enable: true,            // 启用侧边栏
  width: 210,              // 展开宽度 (px)
  collapseWidth: 60,       // 折叠宽度 (px)
  collapsed: false,        // 折叠状态
  collapsedButton: true,   // 显示折叠按钮
  collapsedShowTitle: false, // 折叠时显示标题
  expandOnHover: true,     // 悬停时展开
  hidden: false,           // 隐藏侧边栏
  mixedWidth: 80,          // 混合模式宽度 (px)
}
```

### 标签栏配置 (TabbarPreferences)

```typescript
{
  enable: true,             // 启用标签栏
  height: 38,               // 标签栏高度 (px)
  styleType: 'chrome',      // 样式: 'chrome' | 'card' | 'plain' | 'brisk'
  draggable: true,          // 可拖拽排序
  showIcon: true,           // 显示图标
  showMaximize: true,       // 显示最大化按钮
  showMore: true,           // 显示更多按钮
  keepAlive: true,          // 页面缓存
  persist: true,            // 持久化标签
}
```

### 功能区配置 (PanelPreferences)

```typescript
{
  enable: false,            // 启用功能区
  position: 'right',        // 位置: 'left' | 'right'
  width: 280,               // 展开宽度 (px)
  collapsedWidth: 0,        // 折叠宽度 (px)
  collapsed: false,         // 折叠状态
  collapsedButton: true,    // 显示折叠按钮
}
```

## 工具函数

```typescript
import {
  calculateLayoutComputed,  // 计算布局属性
  generateCSSVariables,     // 生成 CSS 变量
  findMenuByKey,            // 查找菜单项
  getMenuPath,              // 获取菜单路径
  flattenMenus,             // 扁平化菜单
  filterHiddenMenus,        // 过滤隐藏菜单
  mergeConfig,              // 合并配置
} from '@admin-core/layout';
```

## 插槽与扩展点（React / Vue）

以下为 **BasicLayout** 对外暴露的插槽/扩展点中，与“顶栏左右侧 / 标签栏右侧 / 功能区”相关的关键接口。  
如果你需要更多扩展点（比如 `header-menu`、`tabbar-left`、`content-*` 等），可参考源码中 **LayoutSlots / BasicLayout** 的完整定义。

### React (BasicLayout props)

| 区域 | 入口 |
|------|------|
| 顶栏左侧 | `headerLeft` |
| 顶栏右侧 | `headerRight` |
| 顶栏用户区域 | `headerUser` |
| 标签栏右侧 | `tabbarRight` |
| 功能区内容 | `panelSlot` |
| 功能区头部 | `panelHeader` |
| 功能区底部 | `panelFooter` |
| 用户下拉菜单 | `userDropdownMenu` |

**示例：**
```tsx
<BasicLayout
  headerLeft={<MyHeaderLeft />}
  headerRight={<MyHeaderRight />}
  headerUser={<MyHeaderUser />}
  tabbarRight={<MyTabbarRight />}
  userDropdownMenu={<MyUserMenu />}
  panelHeader={<MyPanelHeader />}
  panelSlot={<MyPanelBody />}
  panelFooter={<MyPanelFooter />}>
  {children}
</BasicLayout>
```

### Vue (BasicLayout slots)

| 区域 | 插槽 |
|------|------|
| 顶栏左侧 | `header-left` |
| 顶栏右侧 | `header-right` |
| 顶栏用户区域 | `header-user` |
| 标签栏右侧 | `tabbar-right` |
| 功能区内容 | `panel` |
| 功能区头部 | `panel-header` |
| 功能区底部 | `panel-footer` |
| 用户下拉菜单 | `user-dropdown-menu` |

**示例：**
```vue
<BasicLayout>
  <template #header-left><MyHeaderLeft /></template>
  <template #header-right><MyHeaderRight /></template>
  <template #header-user><MyHeaderUser /></template>
  <template #tabbar-right><MyTabbarRight /></template>
  <template #user-dropdown-menu><MyUserMenu /></template>
  <template #panel-header><MyPanelHeader /></template>
  <template #panel><MyPanelBody /></template>
  <template #panel-footer><MyPanelFooter /></template>
</BasicLayout>
```

## 国际化

```typescript
import { createI18n, zhCN, enUS } from '@admin-core/layout';

// 创建国际化实例
const i18n = createI18n('zh-CN');

// 使用翻译
i18n.t('layout.sidebar.collapse'); // "收起侧边栏"

// 切换语言
i18n.setLocale('en-US');

// 添加自定义消息
i18n.addMessages('zh-CN', {
  custom: { key: '自定义文本' }
});
```

## 样式与动画变量

- 布局样式依赖 `@admin-core/preferences/styles` 提供的全局变量（如 `--admin-duration-*`、`--admin-easing-*`、`--admin-z-index-*`）。
- 页面过渡统一使用 `fade-*` 系列动画类（由 `@admin-core/preferences` 提供）。

## Tailwind CSS v4 集成

```typescript
import { layoutFullCSS, layoutThemeTokens } from '@admin-core/layout';

// 在 CSS 中使用
// 包含 @theme、基础样式、工具类
```

## 许可证

MIT
