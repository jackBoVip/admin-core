# Admin Core Preferences 偏好设置系统设计文档

## 1. 概述

### 1.1 项目目标

- **框架无关**: 核心逻辑与 Vue/React 解耦
- **高度可配置**: 所有配置项可通过配置文件定制
- **主题适配**: 支持 Ant Design、Element Plus、Naive UI、shadcn/ui 等主流 UI 组件库
- **Tailwind CSS v4**: 充分利用 Tailwind CSS v4 的新特性
- **国际化**: 内置完整的国际化支持
- **类型安全**: 完整的 TypeScript 类型定义

### 1.2 核心功能

| 功能分类 | 功能项 |
|---------|-------|
| **主题系统** | 深色/浅色/自动模式、内置主题预设、自定义主题色、圆角配置、字体大小 |
| **布局系统** | 7种布局模式、侧边栏配置、顶栏配置、标签栏配置、面包屑配置、页脚配置 |
| **动画系统** | 页面切换动画、加载进度条、骨架屏 |
| **功能配置** | 快捷键、水印、检查更新、动态标题、语言切换 |
| **辅助功能** | 色弱模式、灰色模式、紧凑模式 |

---

## 2. 包架构设计

### 2.1 包结构总览

```
packages/
└── preferences/                    # 偏好设置模块
    ├── core/                       # 核心包（框架无关）
    │   ├── src/
    │   │   │
    │   │   ├── # ====== 类型定义模块 ======
    │   │   ├── types/
    │   │   │   ├── index.ts               # 类型导出
    │   │   │   ├── preferences.ts         # 偏好设置接口
    │   │   │   ├── theme.ts               # 主题相关类型
    │   │   │   ├── layout.ts              # 布局相关类型
    │   │   │   ├── adapters.ts            # 适配器接口
    │   │   │   └── utils.ts               # 工具类型
    │   │   │
    │   │   ├── # ====== 颜色系统模块 ======
    │   │   ├── color/
    │   │   │   ├── index.ts               # 颜色模块导出
    │   │   │   ├── oklch.ts               # OKLCH 颜色解析/转换
    │   │   │   ├── scales.ts              # 生成 50-950 颜色阶梯
    │   │   │   ├── semantic.ts            # 从主色派生语义色
    │   │   │   ├── contrast.ts            # 计算前景色（WCAG 对比度）
    │   │   │   └── adapters/              # UI 组件库颜色适配器
    │   │   │       ├── index.ts           # 适配器注册表
    │   │   │       ├── base.ts            # 基础适配器接口
    │   │   │       ├── antd.ts            # Ant Design 变量映射
    │   │   │       ├── element.ts         # Element Plus 变量映射
    │   │   │       ├── naive.ts           # Naive UI 变量映射
    │   │   │       └── shadcn.ts          # shadcn/ui 变量映射
    │   │   │
    │   │   ├── # ====== 常量配置模块 ======
    │   │   ├── constants/
    │   │   │   ├── index.ts               # 常量导出
    │   │   │   ├── defaults.ts            # 默认偏好设置配置
    │   │   │   ├── themes.ts              # 内置主题预设
    │   │   │   ├── layouts.ts             # 布局常量
    │   │   │   ├── animations.ts          # 动画常量
    │   │   │   └── css-variables.ts       # CSS 变量名常量
    │   │   │
    │   │   ├── # ====== 工具函数模块 ======
    │   │   ├── utils/
    │   │   │   ├── index.ts               # 工具导出
    │   │   │   ├── cache.ts               # 缓存管理器
    │   │   │   ├── merge.ts               # 深度合并
    │   │   │   ├── diff.ts                # 差异计算
    │   │   │   ├── platform.ts            # 平台检测
    │   │   │   └── css.ts                 # CSS 变量操作
    │   │   │
    │   │   ├── # ====== 样式系统模块 ======
    │   │   ├── styles/
    │   │   │   ├── css/
    │   │   │   │   ├── variables.css      # CSS 变量定义
    │   │   │   │   ├── base.css           # 基础样式
    │   │   │   │   ├── themes/
    │   │   │   │   │   ├── light.css      # 亮色主题
    │   │   │   │   │   └── dark.css       # 暗色主题
    │   │   │   │   ├── animations/
    │   │   │   │   │   ├── index.css      # 动画入口
    │   │   │   │   │   ├── fade.css       # 淡入淡出
    │   │   │   │   │   └── slide.css      # 滑动
    │   │   │   │   └── utilities/
    │   │   │   │       ├── color-modes.css # 色弱/灰色模式
    │   │   │   │       └── scrollbar.css   # 滚动条
    │   │   │   └── tailwind/
    │   │   │       ├── preset.ts          # Tailwind v4 预设
    │   │   │       └── plugins/
    │   │   │           └── animations.ts  # 动画插件
    │   │   │
    │   │   ├── # ====== 共享图标模块 ======
    │   │   ├── icons/
    │   │   │   ├── index.ts               # 图标导出 + 映射表
    │   │   │   ├── layouts/               # 布局预览图标
    │   │   │   │   ├── sidebar-nav.ts
    │   │   │   │   ├── sidebar-mixed-nav.ts
    │   │   │   │   ├── header-nav.ts
    │   │   │   │   ├── header-mixed-nav.ts
    │   │   │   │   ├── header-sidebar-nav.ts
    │   │   │   │   ├── mixed-nav.ts
    │   │   │   │   ├── full-content.ts
    │   │   │   │   └── content-compact.ts
    │   │   │   └── common/                # 通用图标
    │   │   │       ├── sun.ts
    │   │   │       ├── moon.ts
    │   │   │       ├── monitor.ts
    │   │   │       └── settings.ts
    │   │   │
    │   │   ├── # ====== 国际化模块 ======
    │   │   ├── locales/
    │   │   │   ├── index.ts               # 国际化导出
    │   │   │   ├── zh-CN/
    │   │   │   │   └── preferences.json
    │   │   │   └── en-US/
    │   │   │       └── preferences.json
    │   │   │
    │   │   ├── # ====== 核心逻辑模块 ======
    │   │   ├── preferences-manager.ts     # 核心管理器
    │   │   ├── update-css-variables.ts    # CSS 变量更新
    │   │   │
    │   │   └── index.ts                   # 入口文件
    │   │
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── vue/                        # Vue 实现
    │   ├── src/
    │   │   ├── composables/        # Vue Composables
    │   │   │   ├── use-preferences.ts
    │   │   │   └── use-open-preferences.ts
    │   │   ├── components/         # Vue 组件
    │   │   │   ├── PreferencesDrawer.vue
    │   │   │   ├── PreferencesButton.vue
    │   │   │   ├── blocks/         # 设置区块
    │   │   │   └── icons/          # 图标组件（包装 core 的 SVG）
    │   │   └── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    │
    └── react/                      # React 实现
        ├── src/
        │   ├── hooks/              # React Hooks
        │   │   ├── use-preferences.ts
        │   │   └── use-open-preferences.ts
        │   ├── components/         # React 组件
        │   │   ├── PreferencesDrawer.tsx
        │   │   ├── PreferencesButton.tsx
        │   │   ├── blocks/         # 设置区块
        │   │   └── icons/          # 图标组件（包装 core 的 SVG）
        │   ├── context/            # React Context
        │   │   └── PreferencesContext.tsx
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

### 2.2 包命名与发布

| 包路径 | npm 包名 | 说明 |
|--------|----------|------|
| `packages/preferences/core` | `@admin-core/preferences` | 核心包，框架无关 |
| `packages/preferences/vue` | `@admin-core/preferences-vue` | Vue 实现 |
| `packages/preferences/react` | `@admin-core/preferences-react` | React 实现 |

### 2.3 包依赖关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        应用层 (Application)                      │
└─────────────────────────────────────────────────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              ▼                                   ▼
┌──────────────────────────┐       ┌──────────────────────────┐
│ @admin-core/             │       │ @admin-core/             │
│ preferences-vue          │       │ preferences-react        │
│ ─────────────────────────│       │ ─────────────────────────│
│ • usePreferences()       │       │ • usePreferences()       │
│ • PreferencesDrawer      │       │ • PreferencesDrawer      │
│ • PreferencesButton      │       │ • PreferencesButton      │
│ • 设置区块组件            │       │ • 设置区块组件            │
└────────────┬─────────────┘       └────────────┬─────────────┘
             │                                   │
             └─────────────────┬─────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                  @admin-core/preferences (核心)                  │
├─────────────────────────────────────────────────────────────────┤
│  types/          │ 完整的 TypeScript 类型定义                    │
│  constants/      │ 主题预设、布局常量、默认配置                   │
│  utils/          │ 颜色生成、缓存管理、深度合并、CSS变量操作      │
│  styles/         │ CSS 变量、动画、Tailwind v4 预设              │
│  locales/        │ 中文/英文国际化                               │
│  adapters/       │ Ant Design、Element Plus、Naive UI、shadcn   │
│  PreferencesManager │ 核心偏好设置管理器                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心类型定义

### 3.1 偏好设置类型

```typescript
// packages/preferences/core/src/types/preferences.ts

/**
 * 布局类型
 * @description 定义系统支持的所有布局模式
 */
export type LayoutType =
  | 'full-content'        // 全屏内容
  | 'header-mixed-nav'    // 顶部混合导航
  | 'header-nav'          // 顶部导航
  | 'header-sidebar-nav'  // 顶部通栏+侧边导航
  | 'mixed-nav'           // 混合导航
  | 'sidebar-mixed-nav'   // 侧边混合导航
  | 'sidebar-nav';        // 侧边导航

/**
 * 主题模式
 */
export type ThemeModeType = 'auto' | 'dark' | 'light';

/**
 * 内置主题类型
 */
export type BuiltinThemeType =
  | 'custom'
  | 'deep-blue'
  | 'deep-green'
  | 'default'
  | 'gray'
  | 'green'
  | 'neutral'
  | 'orange'
  | 'pink'
  | 'rose'
  | 'sky-blue'
  | 'slate'
  | 'violet'
  | 'yellow'
  | 'zinc';

/**
 * 页面切换动画类型
 */
export type PageTransitionType = 
  | 'fade' 
  | 'fade-down' 
  | 'fade-slide' 
  | 'fade-up'
  | 'slide-left'
  | 'slide-right';

/**
 * 偏好设置按钮位置
 */
export type PreferencesButtonPositionType = 'auto' | 'fixed' | 'header';

/**
 * 内容紧凑模式
 */
export type ContentCompactType = 'compact' | 'wide';

/**
 * 顶栏模式
 */
export type LayoutHeaderModeType = 'auto' | 'auto-scroll' | 'fixed' | 'static';

/**
 * 顶栏菜单对齐方式
 */
export type LayoutHeaderMenuAlignType = 'center' | 'end' | 'start';

/**
 * 登录过期处理模式
 */
export type LoginExpiredModeType = 'modal' | 'page';

/**
 * 面包屑样式
 */
export type BreadcrumbStyleType = 'background' | 'normal';

/**
 * 权限模式
 */
export type AccessModeType = 'backend' | 'frontend' | 'mixed';

/**
 * 导航风格
 */
export type NavigationStyleType = 'plain' | 'rounded';

/**
 * 标签栏风格
 */
export type TabsStyleType = 'brisk' | 'card' | 'chrome' | 'plain';

/**
 * 登录页布局
 */
export type AuthPageLayoutType = 'panel-center' | 'panel-left' | 'panel-right';

/**
 * 支持的语言类型
 */
export type SupportedLanguagesType = 'en-US' | 'zh-CN';

/**
 * 时区选项
 */
export interface TimezoneOption {
  label: string;
  offset: number;
  timezone: string;
}
```

### 3.2 偏好设置接口

```typescript
// packages/preferences/core/src/types/preferences.ts

/**
 * 应用偏好设置
 */
export interface AppPreferences {
  /** 权限模式 */
  accessMode: AccessModeType;
  /** 登录注册页面布局 */
  authPageLayout: AuthPageLayoutType;
  /** 检查更新轮询时间（分钟） */
  checkUpdatesInterval: number;
  /** 灰色模式 */
  colorGrayMode: boolean;
  /** 色弱模式 */
  colorWeakMode: boolean;
  /** 紧凑模式 */
  compact: boolean;
  /** 内容紧凑模式 */
  contentCompact: ContentCompactType;
  /** 内容紧凑宽度 */
  contentCompactWidth: number;
  /** 内容内边距 */
  contentPadding: number;
  /** 内容底部内边距 */
  contentPaddingBottom: number;
  /** 内容左侧内边距 */
  contentPaddingLeft: number;
  /** 内容右侧内边距 */
  contentPaddingRight: number;
  /** 内容顶部内边距 */
  contentPaddingTop: number;
  /** 默认头像 */
  defaultAvatar: string;
  /** 默认首页路径 */
  defaultHomePath: string;
  /** 动态标题 */
  dynamicTitle: boolean;
  /** 启用检查更新 */
  enableCheckUpdates: boolean;
  /** 启用偏好设置 */
  enablePreferences: boolean;
  /** 启用 RefreshToken */
  enableRefreshToken: boolean;
  /** 启用偏好设置导航栏吸顶 */
  enableStickyPreferencesNavigationBar: boolean;
  /** 是否移动端 */
  isMobile: boolean;
  /** 布局方式 */
  layout: LayoutType;
  /** 语言 */
  locale: SupportedLanguagesType;
  /** 登录过期模式 */
  loginExpiredMode: LoginExpiredModeType;
  /** 应用名称 */
  name: string;
  /** 偏好设置按钮位置 */
  preferencesButtonPosition: PreferencesButtonPositionType;
  /** 水印 */
  watermark: boolean;
  /** 水印内容 */
  watermarkContent: string;
  /** z-index 基础值 */
  zIndex: number;
}

/**
 * 面包屑偏好设置
 */
export interface BreadcrumbPreferences {
  /** 启用 */
  enable: boolean;
  /** 只有一个时隐藏 */
  hideOnlyOne: boolean;
  /** 显示首页 */
  showHome: boolean;
  /** 显示图标 */
  showIcon: boolean;
  /** 样式类型 */
  styleType: BreadcrumbStyleType;
}

/**
 * 版权偏好设置
 */
export interface CopyrightPreferences {
  /** 公司名称 */
  companyName: string;
  /** 公司网站链接 */
  companySiteLink: string;
  /** 日期 */
  date: string;
  /** 启用 */
  enable: boolean;
  /** ICP 备案号 */
  icp: string;
  /** ICP 链接 */
  icpLink: string;
  /** 在设置面板中显示 */
  settingShow?: boolean;
}

/**
 * 页脚偏好设置
 */
export interface FooterPreferences {
  /** 启用 */
  enable: boolean;
  /** 固定 */
  fixed: boolean;
  /** 高度 */
  height: number;
}

/**
 * 顶栏偏好设置
 */
export interface HeaderPreferences {
  /** 启用 */
  enable: boolean;
  /** 高度 */
  height: number;
  /** 隐藏（CSS） */
  hidden: boolean;
  /** 菜单对齐方式 */
  menuAlign: LayoutHeaderMenuAlignType;
  /** 模式 */
  mode: LayoutHeaderModeType;
}

/**
 * Logo 偏好设置
 */
export interface LogoPreferences {
  /** 启用 */
  enable: boolean;
  /** 图片适应方式 */
  fit: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  /** Logo 地址 */
  source: string;
  /** 暗色主题 Logo 地址 */
  sourceDark?: string;
}

/**
 * 导航偏好设置
 */
export interface NavigationPreferences {
  /** 手风琴模式 */
  accordion: boolean;
  /** 分割菜单（仅 mixed-nav 模式生效） */
  split: boolean;
  /** 导航风格 */
  styleType: NavigationStyleType;
}

/**
 * 侧边栏偏好设置
 */
export interface SidebarPreferences {
  /** 点击目录时自动激活子菜单 */
  autoActivateChild: boolean;
  /** 折叠 */
  collapsed: boolean;
  /** 显示折叠按钮 */
  collapsedButton: boolean;
  /** 折叠时显示标题 */
  collapsedShowTitle: boolean;
  /** 折叠宽度 */
  collapseWidth: number;
  /** 启用 */
  enable: boolean;
  /** 悬停时展开 */
  expandOnHover: boolean;
  /** 扩展区域折叠 */
  extraCollapse: boolean;
  /** 扩展区域折叠宽度 */
  extraCollapsedWidth: number;
  /** 显示固定按钮 */
  fixedButton: boolean;
  /** 隐藏（CSS） */
  hidden: boolean;
  /** 混合模式宽度 */
  mixedWidth: number;
  /** 宽度 */
  width: number;
}

/**
 * 快捷键偏好设置
 */
export interface ShortcutKeyPreferences {
  /** 启用全局快捷键 */
  enable: boolean;
  /** 锁屏快捷键 */
  globalLockScreen: boolean;
  /** 登出快捷键 */
  globalLogout: boolean;
  /** 偏好设置快捷键 */
  globalPreferences: boolean;
  /** 搜索快捷键 */
  globalSearch: boolean;
}

/**
 * 标签栏偏好设置
 */
export interface TabbarPreferences {
  /** 可拖拽 */
  draggable: boolean;
  /** 启用 */
  enable: boolean;
  /** 高度 */
  height: number;
  /** Keep-Alive */
  keepAlive: boolean;
  /** 最大数量 */
  maxCount: number;
  /** 中键点击关闭 */
  middleClickToClose: boolean;
  /** 持久化 */
  persist: boolean;
  /** 显示图标 */
  showIcon: boolean;
  /** 显示最大化按钮 */
  showMaximize: boolean;
  /** 显示更多按钮 */
  showMore: boolean;
  /** 样式类型 */
  styleType: TabsStyleType;
  /** 响应滚轮 */
  wheelable: boolean;
}

/**
 * 主题偏好设置
 * @description 只配置主色，其他语义色通过 OKLCH 色彩空间自动派生
 */
export interface ThemePreferences {
  /** 内置主题类型 */
  builtinType: BuiltinThemeType;
  /** 
   * 主色
   * @description 唯一需要配置的颜色，其他颜色（成功/警告/危险）通过 OKLCH 自动派生
   * @example 'hsl(212 100% 45%)' 或 '#0066ff' 或 'oklch(0.6 0.2 250)'
   */
  colorPrimary: string;
  /** 字体大小 (px) */
  fontSize: number;
  /** 主题模式 */
  mode: ThemeModeType;
  /** 圆角 (rem) */
  radius: string;
  /** 半深色顶栏（仅亮色模式） */
  semiDarkHeader: boolean;
  /** 半深色侧边栏（仅亮色模式） */
  semiDarkSidebar: boolean;
}

/**
 * 过渡动画偏好设置
 */
export interface TransitionPreferences {
  /** 启用 */
  enable: boolean;
  /** 页面加载动画 */
  loading: boolean;
  /** 动画名称 */
  name: PageTransitionType | string;
  /** 进度条 */
  progress: boolean;
}

/**
 * 小部件偏好设置
 */
export interface WidgetPreferences {
  /** 全屏按钮 */
  fullscreen: boolean;
  /** 全局搜索 */
  globalSearch: boolean;
  /** 语言切换 */
  languageToggle: boolean;
  /** 锁屏 */
  lockScreen: boolean;
  /** 通知 */
  notification: boolean;
  /** 刷新按钮 */
  refresh: boolean;
  /** 侧边栏切换 */
  sidebarToggle: boolean;
  /** 主题切换 */
  themeToggle: boolean;
  /** 时区 */
  timezone: boolean;
}

/**
 * 完整偏好设置
 */
export interface Preferences {
  /** 应用配置 */
  app: AppPreferences;
  /** 面包屑配置 */
  breadcrumb: BreadcrumbPreferences;
  /** 版权配置 */
  copyright: CopyrightPreferences;
  /** 页脚配置 */
  footer: FooterPreferences;
  /** 顶栏配置 */
  header: HeaderPreferences;
  /** Logo 配置 */
  logo: LogoPreferences;
  /** 导航配置 */
  navigation: NavigationPreferences;
  /** 快捷键配置 */
  shortcutKeys: ShortcutKeyPreferences;
  /** 侧边栏配置 */
  sidebar: SidebarPreferences;
  /** 标签栏配置 */
  tabbar: TabbarPreferences;
  /** 主题配置 */
  theme: ThemePreferences;
  /** 过渡动画配置 */
  transition: TransitionPreferences;
  /** 小部件配置 */
  widget: WidgetPreferences;
}

/**
 * 偏好设置键名
 */
export type PreferencesKeys = keyof Preferences;

/**
 * 初始化选项
 */
export interface PreferencesInitOptions {
  /** 命名空间，用于隔离不同应用的配置 */
  namespace: string;
  /** 覆盖默认配置 */
  overrides?: DeepPartial<Preferences>;
  /** 自定义存储适配器 */
  storage?: StorageAdapter;
  /** 自定义国际化适配器 */
  i18n?: I18nAdapter;
}
```

### 3.3 适配器接口

```typescript
// packages/preferences/core/src/types/adapters.ts

/**
 * 存储适配器接口
 */
export interface StorageAdapter {
  getItem<T>(key: string): T | null;
  setItem<T>(key: string, value: T): void;
  removeItem(key: string): void;
  clear(): void;
}

/**
 * 国际化适配器接口
 */
export interface I18nAdapter {
  t(key: string, params?: Record<string, unknown>): string;
  locale: string;
  setLocale(locale: string): void;
}

/**
 * UI 组件适配器接口
 */
export interface UIComponentAdapter {
  /** 适配器名称 */
  name: string;
  /** 主题色 CSS 变量映射 */
  cssVarMapping: CSSVarMapping;
  /** 设置主题 */
  setTheme(mode: ThemeModeType): void;
  /** 设置主题色 */
  setPrimaryColor(color: string): void;
  /** 设置圆角 */
  setRadius(radius: string): void;
  /** 设置字体大小 */
  setFontSize(size: number): void;
}

/**
 * CSS 变量映射
 */
export interface CSSVarMapping {
  /** 主色变量名 */
  primary: string;
  /** 主色变体（如 primary-hover, primary-active） */
  primaryVariants?: Record<string, string>;
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 危险色 */
  destructive: string;
  /** 圆角 */
  radius?: string;
  /** 字体大小 */
  fontSize?: string;
}
```

### 3.4 工具类型

```typescript
// packages/preferences/core/src/types/utils.ts

/**
 * 深度部分类型
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * 深度只读类型
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

/**
 * 选择项
 */
export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

/**
 * 平台类型
 */
export type PlatformType = 'macOs' | 'windows' | 'linux';
```

---

## 4. 常量配置

### 4.1 主题预设

```typescript
// packages/preferences/core/src/constants/themes.ts

import type { BuiltinThemeType } from '../types';

/**
 * 内置主题预设
 */
export interface BuiltinThemePreset {
  /** 预览色 */
  color: string;
  /** 暗色模式主色 */
  darkPrimaryColor?: string;
  /** 亮色模式主色 */
  primaryColor?: string;
  /** 主题类型 */
  type: BuiltinThemeType;
}

/**
 * 内置主题预设列表
 * @description 使用 OKLCH 色彩空间定义，所有语义色从主色自动派生
 */
export const BUILT_IN_THEME_PRESETS: BuiltinThemePreset[] = [
  { color: 'oklch(0.55 0.2 250)',  type: 'default' },     // 蓝色
  { color: 'oklch(0.55 0.22 290)', type: 'violet' },      // 紫色
  { color: 'oklch(0.6 0.2 350)',   type: 'pink' },        // 粉色
  { color: 'oklch(0.75 0.15 85)',  type: 'yellow' },      // 黄色
  { color: 'oklch(0.6 0.18 230)',  type: 'sky-blue' },    // 天蓝
  { color: 'oklch(0.6 0.18 145)',  type: 'green' },       // 绿色
  { 
    color: 'oklch(0.35 0.02 260)', 
    darkPrimaryColor: 'oklch(0.98 0 0)', 
    type: 'zinc' 
  },
  { color: 'oklch(0.5 0.15 180)',  type: 'deep-green' },  // 深绿
  { color: 'oklch(0.45 0.2 250)',  type: 'deep-blue' },   // 深蓝
  { color: 'oklch(0.55 0.2 45)',   type: 'orange' },      // 橙色
  { color: 'oklch(0.5 0.22 25)',   type: 'rose' },        // 玫红
  { 
    color: 'oklch(0.3 0 0)', 
    darkPrimaryColor: 'oklch(0.98 0 0)', 
    type: 'neutral' 
  },
  { 
    color: 'oklch(0.35 0.03 250)', 
    darkPrimaryColor: 'oklch(0.98 0 0)', 
    type: 'slate' 
  },
  { 
    color: 'oklch(0.35 0.01 250)', 
    darkPrimaryColor: 'oklch(0.98 0 0)', 
    type: 'gray' 
  },
  { color: '', type: 'custom' },
];

/**
 * 颜色预设（选择器显示）
 */
export const COLOR_PRESETS = BUILT_IN_THEME_PRESETS.slice(0, 7);
```

### 4.2 动画常量

```typescript
// packages/preferences/core/src/constants/animations.ts

import type { PageTransitionType } from '../types';

/**
 * 页面切换动画选项
 */
export const PAGE_TRANSITION_OPTIONS: Array<{
  label: string;
  value: PageTransitionType;
}> = [
  { label: 'Fade', value: 'fade' },
  { label: 'Fade Slide', value: 'fade-slide' },
  { label: 'Fade Up', value: 'fade-up' },
  { label: 'Fade Down', value: 'fade-down' },
];

/**
 * 动画时长常量
 */
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;
```

### 4.3 布局常量

```typescript
// packages/preferences/core/src/constants/layout.ts

import type { LayoutType } from '../types';

/**
 * 布局类型选项
 */
export const LAYOUT_OPTIONS: Array<{
  label: string;
  value: LayoutType;
  icon: string;
}> = [
  { label: '侧边导航', value: 'sidebar-nav', icon: 'sidebar-nav' },
  { label: '侧边混合导航', value: 'sidebar-mixed-nav', icon: 'sidebar-mixed-nav' },
  { label: '顶部导航', value: 'header-nav', icon: 'header-nav' },
  { label: '顶部通栏+侧边导航', value: 'header-sidebar-nav', icon: 'header-sidebar-nav' },
  { label: '混合导航', value: 'mixed-nav', icon: 'mixed-nav' },
  { label: '顶部混合导航', value: 'header-mixed-nav', icon: 'header-mixed-nav' },
  { label: '全屏内容', value: 'full-content', icon: 'full-content' },
];

/**
 * 标签栏样式选项
 */
export const TABS_STYLE_OPTIONS = [
  { label: 'Chrome', value: 'chrome' },
  { label: '卡片', value: 'card' },
  { label: '朴素', value: 'plain' },
  { label: '轻快', value: 'brisk' },
];
```

### 4.4 CSS 变量常量

```typescript
// packages/preferences/core/src/constants/css-variables.ts

/**
 * 布局相关 CSS 变量
 */
export const CSS_VARIABLE_LAYOUT = {
  CONTENT_HEIGHT: '--admin-content-height',
  CONTENT_WIDTH: '--admin-content-width',
  HEADER_HEIGHT: '--admin-header-height',
  FOOTER_HEIGHT: '--admin-footer-height',
  SIDEBAR_WIDTH: '--admin-sidebar-width',
  SIDEBAR_COLLAPSED_WIDTH: '--admin-sidebar-collapsed-width',
} as const;

/**
 * 主题相关 CSS 变量
 */
export const CSS_VARIABLE_THEME = {
  PRIMARY: '--primary',
  PRIMARY_FOREGROUND: '--primary-foreground',
  SECONDARY: '--secondary',
  SECONDARY_FOREGROUND: '--secondary-foreground',
  DESTRUCTIVE: '--destructive',
  DESTRUCTIVE_FOREGROUND: '--destructive-foreground',
  SUCCESS: '--success',
  SUCCESS_FOREGROUND: '--success-foreground',
  WARNING: '--warning',
  WARNING_FOREGROUND: '--warning-foreground',
  BACKGROUND: '--background',
  FOREGROUND: '--foreground',
  MUTED: '--muted',
  MUTED_FOREGROUND: '--muted-foreground',
  ACCENT: '--accent',
  ACCENT_FOREGROUND: '--accent-foreground',
  BORDER: '--border',
  INPUT: '--input',
  RING: '--ring',
  RADIUS: '--radius',
  FONT_SIZE_BASE: '--font-size-base',
} as const;
```

### 4.5 默认配置

```typescript
// packages/preferences/core/src/constants/defaults.ts

import type { Preferences } from '../types';

/**
 * ========================================
 * 默认偏好设置 - 完整配置规划
 * ========================================
 * 
 * 设计原则：
 * 1. 所有配置项都有合理的默认值
 * 2. 禁止硬编码，所有值可通过 overrides 覆盖
 * 3. 主色使用 OKLCH 格式，语义色自动派生
 * 4. 数值单位统一（px/rem）
 */

/**
 * 默认主色配置
 * @description 只需配置主色，其他语义色通过 OKLCH 色相旋转自动派生
 */
export const DEFAULT_PRIMARY_COLOR = 'oklch(0.55 0.2 250)'; // 蓝色

/**
 * 默认偏好设置
 */
export const DEFAULT_PREFERENCES: Preferences = {
  // ========== 应用配置 ==========
  app: {
    /** 权限模式: frontend-前端控制 | backend-后端控制 | mixed-混合 */
    accessMode: 'frontend',
    /** 登录页布局: panel-left | panel-center | panel-right */
    authPageLayout: 'panel-right',
    /** 检查更新间隔（分钟），0 表示禁用 */
    checkUpdatesInterval: 1,
    /** 灰色模式（哀悼模式） */
    colorGrayMode: false,
    /** 色弱模式（无障碍） */
    colorWeakMode: false,
    /** 紧凑模式 */
    compact: false,
    /** 内容区域宽度模式: wide-宽屏 | compact-紧凑 */
    contentCompact: 'wide',
    /** 内容紧凑宽度 (px) */
    contentCompactWidth: 1200,
    /** 内容内边距 (px) - 统一设置 */
    contentPadding: 16,
    /** 内容底部内边距 (px) */
    contentPaddingBottom: 16,
    /** 内容左侧内边距 (px) */
    contentPaddingLeft: 16,
    /** 内容右侧内边距 (px) */
    contentPaddingRight: 16,
    /** 内容顶部内边距 (px) */
    contentPaddingTop: 16,
    /** 默认头像 URL */
    defaultAvatar: '',
    /** 默认首页路径 */
    defaultHomePath: '/',
    /** 动态标题（根据路由变化） */
    dynamicTitle: true,
    /** 启用检查更新 */
    enableCheckUpdates: true,
    /** 启用偏好设置面板 */
    enablePreferences: true,
    /** 启用 RefreshToken 机制 */
    enableRefreshToken: false,
    /** 偏好设置面板导航栏吸顶 */
    enableStickyPreferencesNavigationBar: true,
    /** 是否移动端（自动检测） */
    isMobile: false,
    /** 布局模式 */
    layout: 'sidebar-nav',
    /** 语言 */
    locale: 'zh-CN',
    /** 登录过期处理: modal-弹窗 | page-跳转 */
    loginExpiredMode: 'page',
    /** 应用名称 */
    name: 'Admin Core',
    /** 偏好设置按钮位置: auto | fixed | header */
    preferencesButtonPosition: 'auto',
    /** 水印 */
    watermark: false,
    /** 水印内容 */
    watermarkContent: '',
    /** 全局 z-index 基准值 */
    zIndex: 200,
  },

  // ========== 面包屑配置 ==========
  breadcrumb: {
    /** 启用面包屑 */
    enable: true,
    /** 只有一个时隐藏 */
    hideOnlyOne: false,
    /** 显示首页 */
    showHome: false,
    /** 显示图标 */
    showIcon: true,
    /** 样式: normal | background */
    styleType: 'normal',
  },

  // ========== 版权配置 ==========
  copyright: {
    /** 公司名称 */
    companyName: '',
    /** 公司网站链接 */
    companySiteLink: '',
    /** 版权年份 */
    date: new Date().getFullYear().toString(),
    /** 启用版权信息 */
    enable: true,
    /** ICP 备案号 */
    icp: '',
    /** ICP 链接 */
    icpLink: '',
    /** 在设置面板中显示 */
    settingShow: true,
  },

  // ========== 页脚配置 ==========
  footer: {
    /** 启用页脚 */
    enable: false,
    /** 固定页脚 */
    fixed: false,
    /** 页脚高度 (px) */
    height: 32,
  },

  // ========== 顶栏配置 ==========
  header: {
    /** 启用顶栏 */
    enable: true,
    /** 顶栏高度 (px) */
    height: 50,
    /** 隐藏顶栏（CSS 隐藏，用于最大化内容区） */
    hidden: false,
    /** 菜单对齐方式: start | center | end */
    menuAlign: 'start',
    /** 顶栏模式: fixed | static | auto | auto-scroll */
    mode: 'fixed',
  },

  // ========== Logo 配置 ==========
  logo: {
    /** 启用 Logo */
    enable: true,
    /** 图片适应方式 */
    fit: 'contain',
    /** Logo 图片 URL */
    source: '',
    /** 暗色模式 Logo URL（可选） */
    sourceDark: undefined,
  },

  // ========== 导航配置 ==========
  navigation: {
    /** 手风琴模式（同级只展开一个） */
    accordion: true,
    /** 分割菜单（仅 mixed-nav 模式） */
    split: true,
    /** 导航风格: rounded | plain */
    styleType: 'rounded',
  },

  // ========== 快捷键配置 ==========
  shortcutKeys: {
    /** 启用全局快捷键 */
    enable: true,
    /** 锁屏快捷键 */
    globalLockScreen: true,
    /** 登出快捷键 */
    globalLogout: true,
    /** 打开偏好设置快捷键 */
    globalPreferences: true,
    /** 全局搜索快捷键 */
    globalSearch: true,
  },

  // ========== 侧边栏配置 ==========
  sidebar: {
    /** 点击目录自动激活子菜单 */
    autoActivateChild: false,
    /** 折叠状态 */
    collapsed: false,
    /** 显示折叠按钮 */
    collapsedButton: true,
    /** 折叠时显示标题 */
    collapsedShowTitle: false,
    /** 折叠宽度 (px) */
    collapseWidth: 60,
    /** 启用侧边栏 */
    enable: true,
    /** 悬停时展开 */
    expandOnHover: true,
    /** 扩展区域折叠 */
    extraCollapse: false,
    /** 扩展区域折叠宽度 (px) */
    extraCollapsedWidth: 60,
    /** 显示固定按钮 */
    fixedButton: true,
    /** 隐藏侧边栏（CSS 隐藏，用于最大化内容区） */
    hidden: false,
    /** 混合模式宽度 (px) */
    mixedWidth: 80,
    /** 展开宽度 (px) */
    width: 224,
  },

  // ========== 标签栏配置 ==========
  tabbar: {
    /** 可拖拽排序 */
    draggable: true,
    /** 启用标签栏 */
    enable: true,
    /** 标签栏高度 (px) */
    height: 38,
    /** 页面缓存 (keep-alive) */
    keepAlive: true,
    /** 最大标签数量，0 表示不限制 */
    maxCount: 0,
    /** 中键点击关闭 */
    middleClickToClose: false,
    /** 持久化标签（刷新保留） */
    persist: true,
    /** 显示图标 */
    showIcon: true,
    /** 显示最大化按钮 */
    showMaximize: true,
    /** 显示更多按钮 */
    showMore: true,
    /** 标签样式: chrome | card | plain | brisk */
    styleType: 'chrome',
    /** 响应鼠标滚轮 */
    wheelable: true,
  },

  // ========== 主题配置 ==========
  theme: {
    /** 内置主题类型 */
    builtinType: 'default',
    /** 
     * 主色（唯一需要配置的颜色）
     * @description 使用 OKLCH 格式，语义色自动派生
     * - success: 色相 +145° (绿色)
     * - warning: 色相 +85° (黄色)
     * - destructive: 色相 +30° (红色)
     * - info: 色相 -30° (青色)
     */
    colorPrimary: DEFAULT_PRIMARY_COLOR,
    /** 字体大小 (px) */
    fontSize: 16,
    /** 主题模式: light | dark | auto */
    mode: 'auto',
    /** 圆角 (rem) */
    radius: '0.5',
    /** 半深色顶栏（仅亮色模式生效） */
    semiDarkHeader: false,
    /** 半深色侧边栏（仅亮色模式生效） */
    semiDarkSidebar: false,
  },

  // ========== 过渡动画配置 ==========
  transition: {
    /** 启用页面切换动画 */
    enable: true,
    /** 页面加载动画 */
    loading: true,
    /** 动画名称: fade | fade-slide | fade-up | fade-down */
    name: 'fade-slide',
    /** 显示加载进度条 */
    progress: true,
  },

  // ========== 小部件配置 ==========
  widget: {
    /** 全屏按钮 */
    fullscreen: true,
    /** 全局搜索 */
    globalSearch: true,
    /** 语言切换 */
    languageToggle: true,
    /** 锁屏按钮 */
    lockScreen: true,
    /** 通知按钮 */
    notification: true,
    /** 刷新按钮 */
    refresh: true,
    /** 侧边栏切换按钮 */
    sidebarToggle: true,
    /** 主题切换按钮 */
    themeToggle: true,
    /** 时区选择 */
    timezone: true,
  },
};

/**
 * 布局默认尺寸配置
 */
export const DEFAULT_LAYOUT_SIZES = {
  /** 顶栏高度 */
  headerHeight: 50,
  /** 页脚高度 */
  footerHeight: 32,
  /** 侧边栏宽度 */
  sidebarWidth: 224,
  /** 侧边栏折叠宽度 */
  sidebarCollapsedWidth: 60,
  /** 混合模式侧边栏宽度 */
  sidebarMixedWidth: 80,
  /** 标签栏高度 */
  tabbarHeight: 38,
  /** 内容最大宽度（紧凑模式） */
  contentMaxWidth: 1200,
} as const;

/**
 * 动画默认时长配置 (ms)
 */
export const DEFAULT_ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

/**
 * z-index 层级配置
 */
export const DEFAULT_Z_INDEX = {
  base: 200,
  dropdown: 1000,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  toast: 1080,
} as const;
```

---

## 5. 颜色系统模块 (`core/src/color/`)

### 5.1 模块结构

```
color/
├── index.ts               # 模块导出
├── oklch.ts               # OKLCH 颜色解析/转换
├── scales.ts              # 生成 50-950 颜色阶梯
├── semantic.ts            # 从主色派生语义色
├── contrast.ts            # 计算前景色（WCAG 对比度）
└── adapters/              # UI 组件库颜色适配器
    ├── index.ts           # 适配器注册表
    ├── base.ts            # 基础适配器接口
    ├── antd.ts            # Ant Design 变量映射
    ├── element.ts         # Element Plus 变量映射
    ├── naive.ts           # Naive UI 变量映射
    └── shadcn.ts          # shadcn/ui 变量映射
```

### 5.2 OKLCH 颜色工具

```typescript
// packages/preferences/core/src/utils/color.ts

import { oklch, formatHex, formatCss, parse, converter } from 'culori';

/**
 * OKLCH 颜色接口
 * @description OKLCH 是感知均匀的色彩空间，更适合生成协调的颜色
 */
export interface OklchColor {
  /** 亮度 (0-1) */
  l: number;
  /** 色度/饱和度 (0-0.4) */
  c: number;
  /** 色相 (0-360) */
  h: number;
}

/**
 * 语义色配置
 * @description 通过主色的色相旋转自动派生
 */
export interface SemanticColors {
  primary: string;
  success: string;
  warning: string;
  destructive: string;
  info: string;
}

/**
 * 色阶配置
 */
export const COLOR_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/**
 * 语义色的色相偏移量（相对于主色）
 */
const SEMANTIC_HUE_OFFSETS = {
  primary: 0,        // 主色，无偏移
  success: 145,      // 绿色方向
  warning: 85,       // 黄色/橙色方向
  destructive: 30,   // 红色方向
  info: -30,         // 青色方向
} as const;

/**
 * 解析任意格式颜色为 OKLCH
 * @description 支持 hex, rgb, hsl, oklch 等格式
 */
export function parseToOklch(color: string): OklchColor | null {
  try {
    const parsed = parse(color);
    if (!parsed) return null;
    
    const toOklch = converter('oklch');
    const result = toOklch(parsed);
    
    return {
      l: result.l ?? 0.5,
      c: result.c ?? 0.15,
      h: result.h ?? 250,
    };
  } catch {
    return null;
  }
}

/**
 * 从主色派生语义色
 * @description 使用 OKLCH 色相旋转，保持亮度和饱和度一致
 */
export function deriveSemanticColors(primaryColor: string): SemanticColors {
  const primary = parseToOklch(primaryColor);
  
  if (!primary) {
    // 默认蓝色
    return {
      primary: 'oklch(0.6 0.2 250)',
      success: 'oklch(0.6 0.2 145)',
      warning: 'oklch(0.7 0.18 85)',
      destructive: 'oklch(0.6 0.22 25)',
      info: 'oklch(0.6 0.18 220)',
    };
  }

  const createColor = (hueOffset: number, lightnessAdjust = 0, chromaAdjust = 0) => {
    const h = (primary.h + hueOffset + 360) % 360;
    const l = Math.max(0, Math.min(1, primary.l + lightnessAdjust));
    const c = Math.max(0, Math.min(0.4, primary.c + chromaAdjust));
    return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`;
  };

  return {
    primary: createColor(SEMANTIC_HUE_OFFSETS.primary),
    success: createColor(SEMANTIC_HUE_OFFSETS.success),
    warning: createColor(SEMANTIC_HUE_OFFSETS.warning, 0.1, -0.02),  // 警告色稍亮
    destructive: createColor(SEMANTIC_HUE_OFFSETS.destructive, 0, 0.02),  // 危险色稍饱和
    info: createColor(SEMANTIC_HUE_OFFSETS.info),
  };
}

/**
 * 生成颜色色阶
 * @description 在 OKLCH 空间中生成 50-950 的色阶
 */
export function generateColorScale(baseColor: string): Record<string, string> {
  const base = parseToOklch(baseColor);
  if (!base) return {};

  const scale: Record<string, string> = {};

  // 色阶亮度映射（50最亮，950最暗）
  const lightnessMap: Record<number, number> = {
    50: 0.97,
    100: 0.93,
    200: 0.87,
    300: 0.77,
    400: 0.67,
    500: 0.55,
    600: 0.47,
    700: 0.39,
    800: 0.31,
    900: 0.23,
    950: 0.15,
  };

  // 色阶饱和度映射（中间最饱和）
  const chromaMap: Record<number, number> = {
    50: 0.02,
    100: 0.05,
    200: 0.1,
    300: 0.15,
    400: 0.18,
    500: 0.2,
    600: 0.18,
    700: 0.16,
    800: 0.13,
    900: 0.1,
    950: 0.08,
  };

  COLOR_SHADES.forEach(shade => {
    const l = lightnessMap[shade];
    // 保持原色相，调整亮度和饱和度
    const c = Math.min(chromaMap[shade], base.c * 1.2);
    scale[shade] = `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${base.h.toFixed(1)})`;
  });

  return scale;
}

/**
 * 生成完整的颜色 CSS 变量
 * @description 从主色生成所有语义色及其色阶
 */
export function generateColorVariables(primaryColor: string): Record<string, string> {
  const semanticColors = deriveSemanticColors(primaryColor);
  const variables: Record<string, string> = {};

  // 生成每个语义色的色阶
  Object.entries(semanticColors).forEach(([name, color]) => {
    const scale = generateColorScale(color);
    
    // 设置基础色
    variables[`--${name}`] = color;
    
    // 设置色阶
    Object.entries(scale).forEach(([shade, value]) => {
      variables[`--${name}-${shade}`] = value;
    });
  });

  return variables;
}

/**
 * OKLCH 转 Hex
 */
export function oklchToHex(color: string): string {
  const parsed = parse(color);
  return parsed ? formatHex(parsed) : '#000000';
}

/**
 * 验证颜色值
 */
export function isValidColor(color: string): boolean {
  return parse(color) !== undefined;
}

/**
 * 计算对比色（用于文字颜色）
 * @description 基于 WCAG 2.1 对比度标准
 */
export function getContrastColor(bgColor: string): string {
  const color = parseToOklch(bgColor);
  if (!color) return 'oklch(0.1 0 0)';
  
  // 基于亮度决定使用深色还是浅色文字
  // WCAG AA 标准要求对比度至少 4.5:1
  return color.l > 0.6 
    ? 'oklch(0.1 0 0)'   // 深色文字
    : 'oklch(0.98 0 0)'; // 浅色文字
}
```

### 5.3 颜色适配器系统

```typescript
// packages/preferences/core/src/color/adapters/base.ts

/**
 * UI 组件库颜色适配器接口
 * @description 将 admin-core 的颜色变量映射到各 UI 库的变量
 */
export interface ColorAdapter {
  /** 适配器名称 */
  name: string;
  /** CSS 变量前缀 */
  prefix: string;
  /** 
   * 获取 CSS 变量映射
   * @param colors - admin-core 生成的颜色变量
   * @returns UI 库需要的 CSS 变量
   */
  getVariables(colors: Record<string, string>): Record<string, string>;
  /**
   * 初始化适配器（可选）
   */
  init?(): void;
}

// packages/preferences/core/src/color/adapters/index.ts

import type { ColorAdapter } from './base';

/** 适配器注册表 */
const adapters = new Map<string, ColorAdapter>();

/**
 * 注册颜色适配器
 */
export function registerColorAdapter(adapter: ColorAdapter): void {
  adapters.set(adapter.name, adapter);
}

/**
 * 获取颜色适配器
 */
export function getColorAdapter(name: string): ColorAdapter | undefined {
  return adapters.get(name);
}

/**
 * 获取所有已注册的适配器
 */
export function getAllColorAdapters(): ColorAdapter[] {
  return Array.from(adapters.values());
}

/**
 * 应用所有适配器
 */
export function applyColorAdapters(
  colors: Record<string, string>
): Record<string, string> {
  const result = { ...colors };
  
  for (const adapter of adapters.values()) {
    const adapterVars = adapter.getVariables(colors);
    Object.assign(result, adapterVars);
  }
  
  return result;
}

// packages/preferences/core/src/color/adapters/antd.ts

import type { ColorAdapter } from './base';
import { oklchToHex } from '../oklch';

/**
 * Ant Design 颜色适配器
 * @description 支持 antd (React) 和 ant-design-vue
 */
export const antdAdapter: ColorAdapter = {
  name: 'antd',
  prefix: '--ant',
  
  getVariables(colors) {
    const vars: Record<string, string> = {};
    
    // Ant Design 使用 hex 格式
    // 主色系列
    vars['--ant-color-primary'] = oklchToHex(colors['--primary'] || '');
    vars['--ant-color-primary-hover'] = oklchToHex(colors['--primary-400'] || '');
    vars['--ant-color-primary-active'] = oklchToHex(colors['--primary-600'] || '');
    vars['--ant-color-primary-bg'] = oklchToHex(colors['--primary-50'] || '');
    vars['--ant-color-primary-bg-hover'] = oklchToHex(colors['--primary-100'] || '');
    vars['--ant-color-primary-border'] = oklchToHex(colors['--primary-300'] || '');
    vars['--ant-color-primary-border-hover'] = oklchToHex(colors['--primary-400'] || '');
    vars['--ant-color-primary-text'] = oklchToHex(colors['--primary'] || '');
    vars['--ant-color-primary-text-hover'] = oklchToHex(colors['--primary-400'] || '');
    vars['--ant-color-primary-text-active'] = oklchToHex(colors['--primary-600'] || '');
    
    // 语义色
    vars['--ant-color-success'] = oklchToHex(colors['--success'] || '');
    vars['--ant-color-warning'] = oklchToHex(colors['--warning'] || '');
    vars['--ant-color-error'] = oklchToHex(colors['--destructive'] || '');
    vars['--ant-color-info'] = oklchToHex(colors['--info'] || '');
    
    // 圆角
    if (colors['--radius']) {
      vars['--ant-border-radius'] = colors['--radius'];
      vars['--ant-border-radius-lg'] = `calc(${colors['--radius']} + 2px)`;
      vars['--ant-border-radius-sm'] = `calc(${colors['--radius']} - 2px)`;
    }
    
    // 字体
    if (colors['--font-size-base']) {
      vars['--ant-font-size'] = colors['--font-size-base'];
    }
    
    return vars;
  },
};

// packages/preferences/core/src/color/adapters/element.ts

import type { ColorAdapter } from './base';
import { oklchToHex, parseToOklch } from '../oklch';

/**
 * Element Plus 颜色适配器
 */
export const elementAdapter: ColorAdapter = {
  name: 'element-plus',
  prefix: '--el',
  
  getVariables(colors) {
    const vars: Record<string, string> = {};
    
    // Element Plus 主色
    const primary = colors['--primary'] || '';
    vars['--el-color-primary'] = oklchToHex(primary);
    
    // Element Plus 使用 light-3, light-5, light-7, light-9 色阶
    const primaryOklch = parseToOklch(primary);
    if (primaryOklch) {
      // 亮色变体
      vars['--el-color-primary-light-3'] = oklchToHex(colors['--primary-300'] || '');
      vars['--el-color-primary-light-5'] = oklchToHex(colors['--primary-200'] || '');
      vars['--el-color-primary-light-7'] = oklchToHex(colors['--primary-100'] || '');
      vars['--el-color-primary-light-9'] = oklchToHex(colors['--primary-50'] || '');
      // 暗色变体
      vars['--el-color-primary-dark-2'] = oklchToHex(colors['--primary-600'] || '');
    }
    
    // 语义色
    vars['--el-color-success'] = oklchToHex(colors['--success'] || '');
    vars['--el-color-warning'] = oklchToHex(colors['--warning'] || '');
    vars['--el-color-danger'] = oklchToHex(colors['--destructive'] || '');
    vars['--el-color-info'] = oklchToHex(colors['--info'] || '');
    
    // 圆角
    if (colors['--radius']) {
      vars['--el-border-radius-base'] = colors['--radius'];
      vars['--el-border-radius-small'] = `calc(${colors['--radius']} - 2px)`;
      vars['--el-border-radius-round'] = '20px';
    }
    
    // 字体
    if (colors['--font-size-base']) {
      vars['--el-font-size-base'] = colors['--font-size-base'];
    }
    
    return vars;
  },
};

// packages/preferences/core/src/color/adapters/naive.ts

import type { ColorAdapter } from './base';
import { oklchToHex } from '../oklch';

/**
 * Naive UI 颜色适配器
 */
export const naiveAdapter: ColorAdapter = {
  name: 'naive-ui',
  prefix: '--n',
  
  getVariables(colors) {
    const vars: Record<string, string> = {};
    
    // Naive UI 主色
    vars['--n-color-primary'] = oklchToHex(colors['--primary'] || '');
    vars['--n-color-primary-hover'] = oklchToHex(colors['--primary-400'] || '');
    vars['--n-color-primary-pressed'] = oklchToHex(colors['--primary-600'] || '');
    vars['--n-color-primary-suppl'] = oklchToHex(colors['--primary-300'] || '');
    
    // 语义色
    vars['--n-color-success'] = oklchToHex(colors['--success'] || '');
    vars['--n-color-warning'] = oklchToHex(colors['--warning'] || '');
    vars['--n-color-error'] = oklchToHex(colors['--destructive'] || '');
    vars['--n-color-info'] = oklchToHex(colors['--info'] || '');
    
    // 圆角
    if (colors['--radius']) {
      vars['--n-border-radius'] = colors['--radius'];
      vars['--n-border-radius-small'] = `calc(${colors['--radius']} - 2px)`;
    }
    
    // 字体
    if (colors['--font-size-base']) {
      vars['--n-font-size'] = colors['--font-size-base'];
    }
    
    return vars;
  },
};

// packages/preferences/core/src/color/adapters/shadcn.ts

import type { ColorAdapter } from './base';

/**
 * shadcn/ui 颜色适配器
 * @description shadcn/ui 默认使用与 admin-core 相同的变量命名，
 *              所以大部分情况下不需要转换
 */
export const shadcnAdapter: ColorAdapter = {
  name: 'shadcn',
  prefix: '',
  
  getVariables(colors) {
    // shadcn/ui 直接使用 admin-core 的变量
    // 只需要确保一些额外的变量存在
    const vars: Record<string, string> = {};
    
    // 确保 ring 颜色与 primary 一致
    if (colors['--primary']) {
      vars['--ring'] = colors['--primary'];
    }
    
    // 确保 card 和 popover 使用 background
    if (colors['--background']) {
      vars['--card'] = colors['--background'];
      vars['--card-foreground'] = colors['--foreground'] || '';
      vars['--popover'] = colors['--background'];
      vars['--popover-foreground'] = colors['--foreground'] || '';
    }
    
    return vars;
  },
};
```

### 5.4 颜色模块导出

```typescript
// packages/preferences/core/src/color/index.ts

/**
 * ========================================
 * 颜色系统模块
 * ========================================
 * 
 * 设计原则：
 * 1. 只配置主色，其他语义色通过 OKLCH 色相旋转派生
 * 2. 支持 50-950 色阶生成
 * 3. 支持多 UI 组件库适配
 * 4. 基于 WCAG 标准的对比度计算
 */

// OKLCH 工具
export {
  parseToOklch,
  oklchToHex,
  oklchToCss,
  isValidColor,
  type OklchColor,
} from './oklch';

// 色阶生成
export {
  generateColorScale,
  COLOR_SHADES,
} from './scales';

// 语义色派生
export {
  deriveSemanticColors,
  SEMANTIC_HUE_OFFSETS,
  type SemanticColors,
} from './semantic';

// 对比度计算
export {
  getContrastColor,
  getContrastRatio,
  meetsWCAG,
} from './contrast';

// 完整的颜色变量生成
export {
  generateColorVariables,
} from './variables';

// 适配器系统
export {
  registerColorAdapter,
  getColorAdapter,
  getAllColorAdapters,
  applyColorAdapters,
  type ColorAdapter,
} from './adapters';

// 内置适配器
export { antdAdapter } from './adapters/antd';
export { elementAdapter } from './adapters/element';
export { naiveAdapter } from './adapters/naive';
export { shadcnAdapter } from './adapters/shadcn';
```

---

## 6. 工具函数模块 (`core/src/utils/`)

### 6.1 缓存管理

```typescript
// packages/preferences/core/src/utils/cache.ts

import type { StorageAdapter } from '../types';

interface StorageItem<T> {
  value: T;
  expiry?: number;
}

export interface StorageManagerOptions {
  /** 存储前缀 */
  prefix?: string;
  /** 存储类型 */
  storage?: Storage;
  /** 默认 TTL（毫秒） */
  defaultTTL?: number;
}

/**
 * 存储管理器
 * @description 支持 TTL、命名空间隔离的存储管理
 */
export class StorageManager implements StorageAdapter {
  private prefix: string;
  private storage: Storage;
  private defaultTTL?: number;

  constructor(options: StorageManagerOptions = {}) {
    this.prefix = options.prefix || 'admin-core';
    this.storage = options.storage || localStorage;
    this.defaultTTL = options.defaultTTL;
  }

  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      const fullKey = this.getFullKey(key);
      const item = this.storage.getItem(fullKey);
      
      if (!item) return defaultValue;
      
      const parsed: StorageItem<T> = JSON.parse(item);
      
      // 检查是否过期
      if (parsed.expiry && Date.now() > parsed.expiry) {
        this.removeItem(key);
        return defaultValue;
      }
      
      return parsed.value;
    } catch {
      return defaultValue;
    }
  }

  setItem<T>(key: string, value: T, ttl?: number): void {
    const fullKey = this.getFullKey(key);
    const effectiveTTL = ttl ?? this.defaultTTL;
    const expiry = effectiveTTL ? Date.now() + effectiveTTL : undefined;
    
    const item: StorageItem<T> = { value, expiry };
    this.storage.setItem(fullKey, JSON.stringify(item));
  }

  removeItem(key: string): void {
    const fullKey = this.getFullKey(key);
    this.storage.removeItem(fullKey);
  }

  clear(): void {
    const keysToRemove: string[] = [];
    
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => this.storage.removeItem(key));
  }

  /**
   * 清理过期项
   */
  clearExpiredItems(): void {
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (!key?.startsWith(this.prefix)) continue;
      
      try {
        const item = this.storage.getItem(key);
        if (!item) continue;
        
        const parsed: StorageItem<unknown> = JSON.parse(item);
        if (parsed.expiry && Date.now() > parsed.expiry) {
          this.storage.removeItem(key);
        }
      } catch {
        // 忽略解析错误
      }
    }
  }
}
```

### 6.2 通用工具

```typescript
// packages/preferences/core/src/utils/merge.ts

import type { DeepPartial } from '../types';

/**
 * 深度合并对象
 */
export function deepMerge<T extends object>(
  target: T,
  ...sources: DeepPartial<T>[]
): T {
  if (!sources.length) return target;
  
  const source = sources.shift();
  if (!source) return target;

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        const sourceValue = source[key as keyof typeof source];
        const targetValue = target[key as keyof T];
        
        if (isObject(sourceValue) && isObject(targetValue)) {
          (target as Record<string, unknown>)[key] = deepMerge(
            { ...targetValue } as object,
            sourceValue as object
          );
        } else if (sourceValue !== undefined) {
          (target as Record<string, unknown>)[key] = sourceValue;
        }
      }
    }
  }

  return deepMerge(target, ...sources);
}

function isObject(item: unknown): item is object {
  return item !== null && typeof item === 'object' && !Array.isArray(item);
}

// packages/preferences/core/src/utils/diff.ts

/**
 * 计算两个对象的差异
 */
export function diff<T extends object>(
  original: T,
  current: T
): DeepPartial<T> {
  const result: DeepPartial<T> = {};
  
  for (const key in current) {
    if (!Object.prototype.hasOwnProperty.call(current, key)) continue;
    
    const originalValue = original[key];
    const currentValue = current[key];
    
    if (isObject(originalValue) && isObject(currentValue)) {
      const nestedDiff = diff(originalValue, currentValue);
      if (Object.keys(nestedDiff).length > 0) {
        (result as Record<string, unknown>)[key] = nestedDiff;
      }
    } else if (originalValue !== currentValue) {
      (result as Record<string, unknown>)[key] = currentValue;
    }
  }
  
  return result;
}

// packages/preferences/core/src/utils/platform.ts

import type { PlatformType } from '../types';

/**
 * 检测当前平台
 */
export function getPlatform(): PlatformType {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (userAgent.includes('mac')) return 'macOs';
  if (userAgent.includes('linux')) return 'linux';
  return 'windows';
}

/**
 * 是否为 Mac 系统
 */
export function isMacOs(): boolean {
  return getPlatform() === 'macOs';
}

// packages/preferences/core/src/utils/css-variables.ts

/**
 * 更新 CSS 变量
 * @description 通过动态创建 style 标签来更新 CSS 变量
 */
export function updateCSSVariables(
  variables: Record<string, string>,
  id = '__admin-core-styles__'
): void {
  let styleElement = document.querySelector(`#${id}`) as HTMLStyleElement | null;
  
  if (!styleElement) {
    styleElement = document.createElement('style');
    styleElement.id = id;
    document.head.appendChild(styleElement);
  }

  let cssText = ':root {';
  for (const [key, value] of Object.entries(variables)) {
    cssText += `${key}: ${value};`;
  }
  cssText += '}';

  styleElement.textContent = cssText;
}

/**
 * 获取 CSS 变量值
 */
export function getCSSVariable(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/**
 * 设置单个 CSS 变量
 */
export function setCSSVariable(name: string, value: string): void {
  document.documentElement.style.setProperty(name, value);
}
```

---

## 7. 样式系统模块 (`core/src/styles/`)

### 7.1 目录结构

```
packages/preferences/core/src/styles/
├── css/
│   ├── base.css               # 基础样式
│   ├── variables.css          # CSS 变量定义
│   ├── themes/
│   │   ├── light.css          # 亮色主题
│   │   └── dark.css           # 暗色主题
│   ├── animations/
│   │   ├── fade.css           # 淡入淡出
│   │   ├── slide.css          # 滑动
│   │   └── index.css          # 动画入口
│   └── utilities/
│       ├── color-modes.css    # 色弱/灰色模式
│       └── scrollbar.css      # 滚动条样式
├── tailwind/
│   ├── preset.ts              # Tailwind v4 预设
│   └── plugins/
│       ├── animations.ts      # 动画插件
│       └── themes.ts          # 主题插件
└── index.ts
```

### 7.2 CSS 变量定义

```css
/* packages/preferences/core/src/styles/css/variables.css */

@layer admin-core {
  :root {
    /* ========== OKLCH 颜色系统 ========== */
    /* 
     * 使用 OKLCH 色彩空间：
     * - 感知均匀，更适合生成协调的颜色
     * - 只需配置主色，其他语义色自动派生
     * - 格式: oklch(亮度 色度 色相)
     *   - 亮度 L: 0-1 (0=黑, 1=白)
     *   - 色度 C: 0-0.4 (0=灰, 越大越饱和)
     *   - 色相 H: 0-360 (红=25, 橙=70, 黄=100, 绿=145, 青=200, 蓝=250, 紫=300, 粉=350)
     */
    
    /* 主色调 - 默认蓝色（其他语义色由 JS 从主色派生） */
    --primary: oklch(0.55 0.2 250);
    --primary-foreground: oklch(0.98 0 0);
    
    /* 色阶变量（由 JS 动态生成） */
    --primary-50: oklch(0.97 0.02 250);
    --primary-100: oklch(0.93 0.05 250);
    --primary-200: oklch(0.87 0.1 250);
    --primary-300: oklch(0.77 0.15 250);
    --primary-400: oklch(0.67 0.18 250);
    --primary-500: oklch(0.55 0.2 250);
    --primary-600: oklch(0.47 0.18 250);
    --primary-700: oklch(0.39 0.16 250);
    --primary-800: oklch(0.31 0.13 250);
    --primary-900: oklch(0.23 0.1 250);
    --primary-950: oklch(0.15 0.08 250);
    
    /* 语义色（从主色自动派生，色相旋转） */
    --success: oklch(0.6 0.18 145);           /* 绿色方向 */
    --success-foreground: oklch(0.98 0 0);
    --warning: oklch(0.7 0.16 85);            /* 黄色方向 */
    --warning-foreground: oklch(0.15 0 0);
    --destructive: oklch(0.55 0.22 25);       /* 红色方向 */
    --destructive-foreground: oklch(0.98 0 0);
    --info: oklch(0.6 0.15 220);              /* 青色方向 */
    --info-foreground: oklch(0.98 0 0);
    
    /* 中性色 */
    --background: oklch(1 0 0);
    --foreground: oklch(0.1 0.02 250);
    --muted: oklch(0.96 0.01 250);
    --muted-foreground: oklch(0.45 0.02 250);
    --accent: oklch(0.96 0.01 250);
    --accent-foreground: oklch(0.15 0.02 250);
    --border: oklch(0.9 0.01 250);
    --input: oklch(0.9 0.01 250);
    --ring: var(--primary);
    
    /* ========== 布局系统 ========== */
    
    --admin-header-height: 50px;
    --admin-footer-height: 32px;
    --admin-sidebar-width: 224px;
    --admin-sidebar-collapsed-width: 60px;
    --admin-content-height: calc(100vh - var(--admin-header-height));
    --admin-content-width: 100%;
    
    /* ========== 间距系统 ========== */
    
    --admin-content-padding: 16px;
    --admin-content-padding-top: 16px;
    --admin-content-padding-right: 16px;
    --admin-content-padding-bottom: 16px;
    --admin-content-padding-left: 16px;
    
    /* ========== 排版系统 ========== */
    
    --font-size-base: 16px;
    --menu-font-size: 14px;
    --radius: 0.5rem;
    
    /* ========== 层级系统 ========== */
    
    --admin-z-index-base: 200;
    --admin-z-index-dropdown: 1000;
    --admin-z-index-modal: 1050;
    --admin-z-index-popover: 1060;
    --admin-z-index-tooltip: 1070;
    --admin-z-index-toast: 1080;
    
    /* ========== 动画系统 ========== */
    
    --admin-duration-fast: 150ms;
    --admin-duration-normal: 300ms;
    --admin-duration-slow: 500ms;
    --admin-easing-default: cubic-bezier(0.4, 0, 0.2, 1);
    --admin-easing-in: cubic-bezier(0.4, 0, 1, 1);
    --admin-easing-out: cubic-bezier(0, 0, 0.2, 1);
  }
  
  /* 暗色主题 */
  .dark {
    --background: oklch(0.13 0.02 250);
    --foreground: oklch(0.98 0 0);
    --muted: oklch(0.2 0.02 250);
    --muted-foreground: oklch(0.65 0.02 250);
    --accent: oklch(0.2 0.02 250);
    --accent-foreground: oklch(0.98 0 0);
    --border: oklch(0.25 0.02 250);
    --input: oklch(0.25 0.02 250);
  }
}
```

### 7.3 动画样式

```css
/* packages/preferences/core/src/styles/css/animations/fade.css */

@layer admin-core {
  /* ========== 淡入淡出动画 ========== */
  
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity var(--admin-duration-normal) var(--admin-easing-default);
  }
  
  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
  
  /* 淡入上滑 */
  .fade-up-enter-active,
  .fade-up-leave-active {
    transition: 
      opacity var(--admin-duration-normal) var(--admin-easing-default),
      transform var(--admin-duration-normal) var(--admin-easing-default);
  }
  
  .fade-up-enter-from {
    opacity: 0;
    transform: translateY(20px);
  }
  
  .fade-up-leave-to {
    opacity: 0;
    transform: translateY(-20px);
  }
  
  /* 淡入下滑 */
  .fade-down-enter-active,
  .fade-down-leave-active {
    transition: 
      opacity var(--admin-duration-normal) var(--admin-easing-default),
      transform var(--admin-duration-normal) var(--admin-easing-default);
  }
  
  .fade-down-enter-from {
    opacity: 0;
    transform: translateY(-20px);
  }
  
  .fade-down-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }
  
  /* 淡入滑动 */
  .fade-slide-enter-active,
  .fade-slide-leave-active {
    transition: 
      opacity var(--admin-duration-normal) var(--admin-easing-default),
      transform var(--admin-duration-normal) var(--admin-easing-default);
  }
  
  .fade-slide-enter-from {
    opacity: 0;
    transform: translateX(-20px);
  }
  
  .fade-slide-leave-to {
    opacity: 0;
    transform: translateX(20px);
  }
}

/* packages/preferences/core/src/styles/css/animations/slide.css */

@layer admin-core {
  /* ========== 滑动动画 ========== */
  
  .slide-left-enter-active,
  .slide-left-leave-active,
  .slide-right-enter-active,
  .slide-right-leave-active,
  .slide-up-enter-active,
  .slide-up-leave-active,
  .slide-down-enter-active,
  .slide-down-leave-active {
    transition: transform var(--admin-duration-normal) var(--admin-easing-default);
  }
  
  .slide-left-enter-from { transform: translateX(-100%); }
  .slide-left-leave-to { transform: translateX(-100%); }
  
  .slide-right-enter-from { transform: translateX(100%); }
  .slide-right-leave-to { transform: translateX(100%); }
  
  .slide-up-enter-from { transform: translateY(-100%); }
  .slide-up-leave-to { transform: translateY(-100%); }
  
  .slide-down-enter-from { transform: translateY(100%); }
  .slide-down-leave-to { transform: translateY(100%); }
}
```

### 7.4 辅助功能样式

```css
/* packages/preferences/core/src/styles/css/utilities/color-modes.css */

@layer admin-core {
  /* 灰色模式 */
  .grayscale-mode {
    filter: grayscale(100%);
  }
  
  /* 色弱模式 */
  .invert-mode {
    filter: invert(80%);
  }
  
  /* 组合模式 */
  .grayscale-mode.invert-mode {
    filter: grayscale(100%) invert(80%);
  }
}
```

### 7.5 Tailwind v4 预设

```typescript
// packages/preferences/core/src/styles/tailwind/preset.ts

import type { Config } from 'tailwindcss';

/**
 * Admin Core Tailwind v4 预设
 * @description 使用 OKLCH 色彩空间，支持动态主题切换
 */
export const adminCorePreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        // 使用 CSS 变量（OKLCH 格式），支持动态主题切换
        // 注意：OKLCH 原生支持透明度，使用 color-mix 实现 alpha
        primary: {
          DEFAULT: 'var(--primary)',
          foreground: 'var(--primary-foreground)',
          50: 'var(--primary-50)',
          100: 'var(--primary-100)',
          200: 'var(--primary-200)',
          300: 'var(--primary-300)',
          400: 'var(--primary-400)',
          500: 'var(--primary-500)',
          600: 'var(--primary-600)',
          700: 'var(--primary-700)',
          800: 'var(--primary-800)',
          900: 'var(--primary-900)',
          950: 'var(--primary-950)',
        },
        success: {
          DEFAULT: 'var(--success)',
          foreground: 'var(--success-foreground)',
        },
        warning: {
          DEFAULT: 'var(--warning)',
          foreground: 'var(--warning-foreground)',
        },
        destructive: {
          DEFAULT: 'var(--destructive)',
          foreground: 'var(--destructive-foreground)',
        },
        info: {
          DEFAULT: 'var(--info)',
          foreground: 'var(--info-foreground)',
        },
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        muted: {
          DEFAULT: 'var(--muted)',
          foreground: 'var(--muted-foreground)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--accent-foreground)',
        },
        border: 'var(--border)',
        input: 'var(--input)',
        ring: 'var(--ring)',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontSize: {
        base: 'var(--font-size-base)',
      },
      spacing: {
        'header': 'var(--admin-header-height)',
        'footer': 'var(--admin-footer-height)',
        'sidebar': 'var(--admin-sidebar-width)',
        'sidebar-collapsed': 'var(--admin-sidebar-collapsed-width)',
      },
      zIndex: {
        'dropdown': 'var(--admin-z-index-dropdown)',
        'modal': 'var(--admin-z-index-modal)',
        'popover': 'var(--admin-z-index-popover)',
        'tooltip': 'var(--admin-z-index-tooltip)',
        'toast': 'var(--admin-z-index-toast)',
      },
      transitionDuration: {
        'fast': 'var(--admin-duration-fast)',
        'normal': 'var(--admin-duration-normal)',
        'slow': 'var(--admin-duration-slow)',
      },
      transitionTimingFunction: {
        'admin': 'var(--admin-easing-default)',
        'admin-in': 'var(--admin-easing-in)',
        'admin-out': 'var(--admin-easing-out)',
      },
      animation: {
        'fade-in': 'fade-in var(--admin-duration-normal) var(--admin-easing-default)',
        'fade-out': 'fade-out var(--admin-duration-normal) var(--admin-easing-default)',
        'slide-in-left': 'slide-in-left var(--admin-duration-normal) var(--admin-easing-default)',
        'slide-in-right': 'slide-in-right var(--admin-duration-normal) var(--admin-easing-default)',
        'slide-in-up': 'slide-in-up var(--admin-duration-normal) var(--admin-easing-default)',
        'slide-in-down': 'slide-in-down var(--admin-duration-normal) var(--admin-easing-default)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-out': {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        'slide-in-left': {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-right': {
          from: { transform: 'translateX(100%)' },
          to: { transform: 'translateX(0)' },
        },
        'slide-in-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-in-down': {
          from: { transform: 'translateY(-100%)' },
          to: { transform: 'translateY(0)' },
        },
      },
    },
  },
};

export default adminCorePreset;
```

---

## 8. 偏好设置核心模块

### 8.1 PreferencesManager 类

```typescript
// packages/preferences/core/src/preferences-manager.ts

import type {
  DeepPartial,
  Preferences,
  PreferencesInitOptions,
  StorageAdapter,
} from './types';

import { DEFAULT_PREFERENCES } from './constants';
import { StorageManager, deepMerge, diff } from './utils';

import { updateThemeCSSVariables } from './update-css-variables';

const STORAGE_KEYS = {
  MAIN: 'preferences',
  LOCALE: 'preferences-locale',
  THEME: 'preferences-theme',
} as const;

/**
 * 偏好设置管理器
 * @description 框架无关的偏好设置核心逻辑
 */
export class PreferencesManager {
  private storage: StorageAdapter;
  private state: Preferences;
  private initialPreferences: Preferences;
  private isInitialized = false;
  private listeners: Set<(preferences: Preferences) => void> = new Set();
  private debouncedSave: ReturnType<typeof setTimeout> | null = null;
  
  constructor() {
    this.storage = new StorageManager();
    this.state = { ...DEFAULT_PREFERENCES };
    this.initialPreferences = { ...DEFAULT_PREFERENCES };
  }

  /**
   * 初始化偏好设置
   */
  async init(options: PreferencesInitOptions): Promise<void> {
    if (this.isInitialized) {
      console.warn('[PreferencesManager] Already initialized');
      return;
    }

    // 设置存储
    if (options.storage) {
      this.storage = options.storage;
    } else {
      this.storage = new StorageManager({ prefix: options.namespace });
    }

    // 合并初始配置
    this.initialPreferences = deepMerge(
      { ...DEFAULT_PREFERENCES },
      options.overrides || {}
    );

    // 加载缓存配置
    const cachedPreferences = this.loadFromCache();
    
    // 合并配置：缓存 > 覆盖配置 > 默认配置
    this.state = deepMerge(
      { ...this.initialPreferences },
      cachedPreferences || {}
    );

    // 应用 CSS 变量
    this.applyTheme();

    // 设置系统监听
    this.setupSystemListeners();

    this.isInitialized = true;
  }

  /**
   * 获取当前偏好设置（只读副本）
   */
  getPreferences(): Readonly<Preferences> {
    return Object.freeze({ ...this.state });
  }

  /**
   * 获取初始偏好设置
   */
  getInitialPreferences(): Readonly<Preferences> {
    return Object.freeze({ ...this.initialPreferences });
  }

  /**
   * 更新偏好设置
   */
  update(updates: DeepPartial<Preferences>): void {
    this.state = deepMerge({ ...this.state }, updates);
    
    // 处理特定更新
    this.handleUpdates(updates);
    
    // 防抖保存
    this.scheduleSave();
    
    // 通知监听器
    this.notifyListeners();
  }

  /**
   * 重置偏好设置
   */
  reset(): void {
    this.state = { ...this.initialPreferences };
    this.saveToCache();
    this.applyTheme();
    this.notifyListeners();
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.storage.removeItem(key);
    });
  }

  /**
   * 计算偏好设置变更
   */
  getDiff(): DeepPartial<Preferences> {
    return diff(this.initialPreferences, this.state);
  }

  /**
   * 订阅偏好设置变更
   */
  subscribe(listener: (preferences: Preferences) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 获取指定配置项
   */
  get<K extends keyof Preferences>(key: K): Preferences[K] {
    return this.state[key];
  }

  /**
   * 处理特定更新
   */
  private handleUpdates(updates: DeepPartial<Preferences>): void {
    const { theme, app } = updates;

    // 主题相关更新
    if (theme && Object.keys(theme).length > 0) {
      this.applyTheme();
    }

    // 颜色模式更新
    if (app?.colorGrayMode !== undefined || app?.colorWeakMode !== undefined) {
      this.updateColorMode();
    }
  }

  /**
   * 应用主题
   */
  private applyTheme(): void {
    updateThemeCSSVariables(this.state);
  }

  /**
   * 更新颜色模式（灰色/色弱）
   */
  private updateColorMode(): void {
    const { colorGrayMode, colorWeakMode } = this.state.app;
    const root = document.documentElement;

    root.classList.toggle('grayscale-mode', colorGrayMode);
    root.classList.toggle('invert-mode', colorWeakMode);
  }

  /**
   * 设置系统监听器
   */
  private setupSystemListeners(): void {
    // 监听系统主题变化
    window
      .matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', ({ matches: isDark }) => {
        if (this.state.theme.mode === 'auto') {
          this.applyTheme();
        }
      });

    // 监听窗口大小变化（响应式）
    this.setupResponsiveListener();
  }

  /**
   * 设置响应式监听
   */
  private setupResponsiveListener(): void {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
      this.update({ app: { isMobile: e.matches } });
    };

    mediaQuery.addEventListener('change', handleChange);
    handleChange(mediaQuery);
  }

  /**
   * 从缓存加载
   */
  private loadFromCache(): Preferences | null {
    return this.storage.getItem<Preferences>(STORAGE_KEYS.MAIN);
  }

  /**
   * 保存到缓存
   */
  private saveToCache(): void {
    this.storage.setItem(STORAGE_KEYS.MAIN, this.state);
    this.storage.setItem(STORAGE_KEYS.LOCALE, this.state.app.locale);
    this.storage.setItem(STORAGE_KEYS.THEME, this.state.theme.mode);
  }

  /**
   * 防抖保存
   */
  private scheduleSave(): void {
    if (this.debouncedSave) {
      clearTimeout(this.debouncedSave);
    }
    this.debouncedSave = setTimeout(() => {
      this.saveToCache();
    }, 150);
  }

  /**
   * 通知所有监听器
   */
  private notifyListeners(): void {
    const snapshot = this.getPreferences();
    this.listeners.forEach(listener => listener(snapshot));
  }
}

// 导出单例
export const preferencesManager = new PreferencesManager();
```

### 8.2 CSS 变量更新 (OKLCH 派生)

```typescript
// packages/preferences/core/src/update-css-variables.ts

import type { Preferences, ThemeModeType } from './types';

import { BUILT_IN_THEME_PRESETS } from './constants';
import {
  generateColorVariables,
  getContrastColor,
  updateCSSVariables,
  setCSSVariable,
} from './utils';

/**
 * 判断是否为暗色主题
 */
export function isDarkTheme(mode: ThemeModeType): boolean {
  if (mode === 'dark') return true;
  if (mode === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

/**
 * 更新主题 CSS 变量
 * @description 只需要主色，其他语义色通过 OKLCH 自动派生
 */
export function updateThemeCSSVariables(preferences: Preferences): void {
  const root = document.documentElement;
  const theme = preferences.theme;
  const { builtinType, mode, radius, fontSize, colorPrimary } = theme;

  // 设置暗色模式类
  const dark = isDarkTheme(mode);
  root.classList.toggle('dark', dark);

  // 设置主题 data 属性
  if (root.dataset.theme !== builtinType) {
    root.dataset.theme = builtinType;
  }

  // 获取内置主题的主色（如果使用内置主题）
  let primaryColor = colorPrimary;
  const currentBuiltType = BUILT_IN_THEME_PRESETS.find(
    item => item.type === builtinType
  );
  
  if (currentBuiltType && builtinType !== 'custom') {
    primaryColor = dark
      ? (currentBuiltType.darkPrimaryColor || currentBuiltType.color)
      : currentBuiltType.color;
  }

  // 使用 OKLCH 从主色派生所有语义色及色阶
  const colorVariables = generateColorVariables(primaryColor);

  // 为每个语义色生成对比色（文字颜色）
  ['primary', 'success', 'warning', 'destructive', 'info'].forEach(name => {
    const baseColor = colorVariables[`--${name}`];
    if (baseColor) {
      colorVariables[`--${name}-foreground`] = getContrastColor(baseColor);
    }
  });

  // 暗色模式调整
  if (dark) {
    colorVariables['--background'] = 'oklch(0.13 0.02 250)';
    colorVariables['--foreground'] = 'oklch(0.98 0 0)';
    colorVariables['--muted'] = 'oklch(0.2 0.02 250)';
    colorVariables['--muted-foreground'] = 'oklch(0.65 0.02 250)';
    colorVariables['--border'] = 'oklch(0.25 0.02 250)';
    colorVariables['--input'] = 'oklch(0.25 0.02 250)';
  } else {
    colorVariables['--background'] = 'oklch(1 0 0)';
    colorVariables['--foreground'] = 'oklch(0.1 0.02 250)';
    colorVariables['--muted'] = 'oklch(0.96 0.01 250)';
    colorVariables['--muted-foreground'] = 'oklch(0.45 0.02 250)';
    colorVariables['--border'] = 'oklch(0.9 0.01 250)';
    colorVariables['--input'] = 'oklch(0.9 0.01 250)';
  }

  // 更新所有颜色变量
  updateCSSVariables(colorVariables);

  // 更新圆角
  setCSSVariable('--radius', `${radius}rem`);

  // 更新字体大小
  setCSSVariable('--font-size-base', `${fontSize}px`);
  setCSSVariable('--menu-font-size', `${fontSize * 0.875}px`);
}
```

### 8.3 共享图标

```typescript
// packages/preferences/core/src/icons/layouts/sidebar-nav.ts

/**
 * 侧边导航布局图标
 * @description SVG 字符串，由 Vue/React 包包装为组件
 */
export const sidebarNavIcon = `
<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="104" height="66" rx="4" class="fill-muted"/>
  <rect x="4" y="4" width="24" height="58" rx="2" class="fill-primary"/>
  <rect x="32" y="4" width="68" height="8" rx="2" class="fill-muted-foreground/30"/>
  <rect x="32" y="16" width="68" height="46" rx="2" class="fill-background"/>
</svg>
`;

// packages/preferences/core/src/icons/layouts/header-nav.ts

export const headerNavIcon = `
<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="104" height="66" rx="4" class="fill-muted"/>
  <rect x="4" y="4" width="96" height="12" rx="2" class="fill-primary"/>
  <rect x="4" y="20" width="96" height="42" rx="2" class="fill-background"/>
</svg>
`;

// packages/preferences/core/src/icons/layouts/mixed-nav.ts

export const mixedNavIcon = `
<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="104" height="66" rx="4" class="fill-muted"/>
  <rect x="4" y="4" width="96" height="12" rx="2" class="fill-primary"/>
  <rect x="4" y="20" width="20" height="42" rx="2" class="fill-primary/60"/>
  <rect x="28" y="20" width="72" height="42" rx="2" class="fill-background"/>
</svg>
`;

// packages/preferences/core/src/icons/layouts/full-content.ts

export const fullContentIcon = `
<svg viewBox="0 0 104 66" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="104" height="66" rx="4" class="fill-muted"/>
  <rect x="4" y="4" width="96" height="58" rx="2" class="fill-background"/>
</svg>
`;

// packages/preferences/core/src/icons/common/sun.ts

export const sunIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="12" cy="12" r="4"/>
  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
</svg>
`;

// packages/preferences/core/src/icons/common/moon.ts

export const moonIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
</svg>
`;

// packages/preferences/core/src/icons/common/monitor.ts

export const monitorIcon = `
<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
  <line x1="8" y1="21" x2="16" y2="21"/>
  <line x1="12" y1="17" x2="12" y2="21"/>
</svg>
`;

// packages/preferences/core/src/icons/index.ts

/**
 * 布局图标
 */
export * from './layouts/sidebar-nav';
export * from './layouts/sidebar-mixed-nav';
export * from './layouts/header-nav';
export * from './layouts/header-mixed-nav';
export * from './layouts/header-sidebar-nav';
export * from './layouts/mixed-nav';
export * from './layouts/full-content';
export * from './layouts/content-compact';

/**
 * 通用图标
 */
export * from './common/sun';
export * from './common/moon';
export * from './common/monitor';
export * from './common/settings';

/**
 * 图标映射表（便于动态使用）
 */
export const layoutIcons = {
  'sidebar-nav': sidebarNavIcon,
  'sidebar-mixed-nav': sidebarMixedNavIcon,
  'header-nav': headerNavIcon,
  'header-mixed-nav': headerMixedNavIcon,
  'header-sidebar-nav': headerSidebarNavIcon,
  'mixed-nav': mixedNavIcon,
  'full-content': fullContentIcon,
} as const;

export const themeIcons = {
  light: sunIcon,
  dark: moonIcon,
  auto: monitorIcon,
} as const;
```

**Vue 中使用共享图标:**

```vue
<!-- packages/preferences/vue/src/components/icons/LayoutIcon.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { layoutIcons } from '@admin-core/preferences';
import type { LayoutType } from '@admin-core/preferences';

const props = defineProps<{
  layout: LayoutType;
  class?: string;
}>();

const svgContent = computed(() => layoutIcons[props.layout] || '');
</script>

<template>
  <div 
    class="layout-icon" 
    :class="props.class"
    v-html="svgContent"
  />
</template>
```

**React 中使用共享图标:**

```tsx
// packages/preferences/react/src/components/icons/LayoutIcon.tsx
import { layoutIcons } from '@admin-core/preferences';
import type { LayoutType } from '@admin-core/preferences';

interface LayoutIconProps {
  layout: LayoutType;
  className?: string;
}

export function LayoutIcon({ layout, className }: LayoutIconProps) {
  const svgContent = layoutIcons[layout] || '';
  
  return (
    <div 
      className={`layout-icon ${className || ''}`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}
```

### 8.4 导出

```typescript
// packages/preferences/core/src/index.ts

export { PreferencesManager, preferencesManager } from './preferences-manager';
export { isDarkTheme, updateThemeCSSVariables } from './update-css-variables';

// 便捷方法导出
export const {
  init: initPreferences,
  getPreferences,
  getInitialPreferences,
  update: updatePreferences,
  reset: resetPreferences,
  clearCache: clearPreferencesCache,
  getDiff: getPreferencesDiff,
  subscribe: subscribePreferences,
  get: getPreference,
} = preferencesManager;
```

---

## 9. 国际化模块 (`core/src/locales/`)

### 9.1 目录结构

```
packages/preferences/core/src/locales/
├── zh-CN/
│   ├── preferences.json
│   └── common.json
├── en-US/
│   ├── preferences.json
│   └── common.json
├── types.ts
└── index.ts
```

### 9.2 语言文件

```json
// packages/preferences/core/src/locales/zh-CN/preferences.json
{
  "title": "偏好设置",
  "tabs": {
    "appearance": "外观",
    "layout": "布局",
    "shortcutKeys": "快捷键",
    "general": "通用"
  },
  "theme": {
    "title": "主题",
    "mode": {
      "light": "浅色",
      "dark": "深色",
      "auto": "跟随系统"
    },
    "builtinType": "内置主题",
    "colorPrimary": "主题色",
    "colorCustom": "自定义颜色",
    "radius": "圆角",
    "fontSize": "字体大小",
    "semiDarkSidebar": "半深色侧边栏",
    "semiDarkHeader": "半深色顶栏"
  },
  "layout": {
    "title": "布局",
    "types": {
      "sidebar-nav": "侧边导航",
      "sidebar-mixed-nav": "侧边混合导航",
      "header-nav": "顶部导航",
      "header-sidebar-nav": "顶部通栏+侧边导航",
      "mixed-nav": "混合导航",
      "header-mixed-nav": "顶部混合导航",
      "full-content": "全屏内容"
    },
    "content": {
      "title": "内容区域",
      "wide": "宽屏",
      "compact": "紧凑"
    }
  },
  "sidebar": {
    "title": "侧边栏",
    "enable": "启用侧边栏",
    "width": "宽度",
    "collapsed": "折叠侧边栏",
    "collapsedShowTitle": "折叠时显示标题",
    "collapsedButton": "显示折叠按钮",
    "expandOnHover": "悬停时展开",
    "autoActivateChild": "自动激活子菜单",
    "fixedButton": "显示固定按钮"
  },
  "header": {
    "title": "顶栏",
    "enable": "启用顶栏",
    "mode": {
      "title": "模式",
      "fixed": "固定",
      "static": "静态",
      "auto": "自动",
      "auto-scroll": "滚动自动隐藏"
    },
    "menuAlign": {
      "title": "菜单对齐",
      "start": "左对齐",
      "center": "居中",
      "end": "右对齐"
    }
  },
  "breadcrumb": {
    "title": "面包屑",
    "enable": "启用面包屑",
    "showIcon": "显示图标",
    "showHome": "显示首页",
    "hideOnlyOne": "只有一个时隐藏",
    "styleType": {
      "title": "样式",
      "normal": "默认",
      "background": "带背景"
    }
  },
  "tabbar": {
    "title": "标签栏",
    "enable": "启用标签栏",
    "showIcon": "显示图标",
    "draggable": "可拖拽",
    "keepAlive": "页面缓存",
    "persist": "持久化标签",
    "showMaximize": "显示最大化按钮",
    "showMore": "显示更多按钮",
    "maxCount": "最大数量",
    "maxCountTip": "设置为 0 表示不限制",
    "wheelable": "响应滚轮",
    "middleClickToClose": "中键点击关闭",
    "styleType": {
      "title": "样式",
      "chrome": "Chrome",
      "card": "卡片",
      "plain": "朴素",
      "brisk": "轻快"
    }
  },
  "navigation": {
    "title": "导航菜单",
    "accordion": "手风琴模式",
    "split": "分割菜单",
    "styleType": {
      "title": "风格",
      "rounded": "圆润",
      "plain": "朴素"
    }
  },
  "footer": {
    "title": "页脚",
    "enable": "启用页脚",
    "fixed": "固定页脚"
  },
  "copyright": {
    "title": "版权信息",
    "enable": "启用版权",
    "companyName": "公司名称",
    "companySiteLink": "公司链接",
    "date": "日期",
    "icp": "备案号",
    "icpLink": "备案链接"
  },
  "widget": {
    "title": "小部件",
    "fullscreen": "全屏按钮",
    "globalSearch": "全局搜索",
    "languageToggle": "语言切换",
    "themeToggle": "主题切换",
    "notification": "通知",
    "lockScreen": "锁屏",
    "sidebarToggle": "侧边栏切换",
    "refresh": "刷新按钮",
    "timezone": "时区"
  },
  "transition": {
    "title": "动画效果",
    "enable": "启用页面切换动画",
    "progress": "页面加载进度条",
    "loading": "页面加载动画",
    "types": {
      "fade": "淡入淡出",
      "fade-slide": "淡入滑动",
      "fade-up": "淡入上滑",
      "fade-down": "淡入下滑"
    }
  },
  "shortcutKeys": {
    "title": "快捷键",
    "enable": "启用全局快捷键",
    "globalSearch": "全局搜索",
    "globalLogout": "退出登录",
    "globalLockScreen": "锁定屏幕",
    "globalPreferences": "偏好设置"
  },
  "general": {
    "title": "通用设置",
    "dynamicTitle": "动态标题",
    "watermark": "水印",
    "watermarkContent": "水印内容",
    "enableCheckUpdates": "检查更新",
    "locale": "语言"
  },
  "colorMode": {
    "title": "颜色模式",
    "colorGrayMode": "灰色模式",
    "colorWeakMode": "色弱模式"
  },
  "actions": {
    "reset": "重置",
    "resetTip": "重置为默认设置",
    "copy": "复制配置",
    "copySuccess": "复制成功",
    "clearCache": "清除缓存并登出"
  }
}
```

```json
// packages/preferences/core/src/locales/en-US/preferences.json
{
  "title": "Preferences",
  "tabs": {
    "appearance": "Appearance",
    "layout": "Layout",
    "shortcutKeys": "Shortcuts",
    "general": "General"
  },
  "theme": {
    "title": "Theme",
    "mode": {
      "light": "Light",
      "dark": "Dark",
      "auto": "System"
    },
    "builtinType": "Built-in Theme",
    "colorPrimary": "Primary Color",
    "colorCustom": "Custom Color",
    "radius": "Radius",
    "fontSize": "Font Size",
    "semiDarkSidebar": "Semi-dark Sidebar",
    "semiDarkHeader": "Semi-dark Header"
  },
  "layout": {
    "title": "Layout",
    "types": {
      "sidebar-nav": "Sidebar Navigation",
      "sidebar-mixed-nav": "Sidebar Mixed Navigation",
      "header-nav": "Header Navigation",
      "header-sidebar-nav": "Header + Sidebar Navigation",
      "mixed-nav": "Mixed Navigation",
      "header-mixed-nav": "Header Mixed Navigation",
      "full-content": "Full Content"
    },
    "content": {
      "title": "Content Area",
      "wide": "Wide",
      "compact": "Compact"
    }
  },
  "sidebar": {
    "title": "Sidebar",
    "enable": "Enable Sidebar",
    "width": "Width",
    "collapsed": "Collapse Sidebar",
    "collapsedShowTitle": "Show Title When Collapsed",
    "collapsedButton": "Show Collapse Button",
    "expandOnHover": "Expand on Hover",
    "autoActivateChild": "Auto Activate Child Menu",
    "fixedButton": "Show Fixed Button"
  },
  "header": {
    "title": "Header",
    "enable": "Enable Header",
    "mode": {
      "title": "Mode",
      "fixed": "Fixed",
      "static": "Static",
      "auto": "Auto",
      "auto-scroll": "Auto Hide on Scroll"
    },
    "menuAlign": {
      "title": "Menu Alignment",
      "start": "Start",
      "center": "Center",
      "end": "End"
    }
  },
  "actions": {
    "reset": "Reset",
    "resetTip": "Reset to default settings",
    "copy": "Copy Configuration",
    "copySuccess": "Copied successfully",
    "clearCache": "Clear Cache & Logout"
  }
}
```

---

## 10. UI 适配器（已整合到颜色模块）

> **注意**: UI 适配器已整合到 `core/src/color/adapters/` 目录中，见第 5.3 节。

### 10.1 适配器接口

```typescript
// packages/preferences/core/src/adapters/types.ts

import type { ThemeModeType } from '../types';

/**
 * UI 适配器配置
 */
export interface AdapterConfig {
  /** 适配器名称 */
  name: string;
  /** CSS 变量前缀 */
  cssVarPrefix: string;
  /** 主色变量名 */
  primaryColorVar: string;
  /** 是否支持暗色模式 */
  supportsDarkMode: boolean;
}

/**
 * UI 适配器接口
 */
export interface UIAdapter {
  /** 适配器配置 */
  config: AdapterConfig;
  
  /** 初始化适配器 */
  init(): void;
  
  /** 设置主题模式 */
  setThemeMode(mode: ThemeModeType): void;
  
  /** 设置主色 */
  setPrimaryColor(color: string): void;
  
  /** 设置圆角 */
  setRadius(radius: string): void;
  
  /** 设置字体大小 */
  setFontSize(size: number): void;
  
  /** 获取 CSS 变量映射 */
  getCSSVarMapping(): Record<string, string>;
}
```

### 10.2 Ant Design 适配器

```typescript
// packages/preferences/core/src/adapters/antd.ts

import type { UIAdapter, AdapterConfig } from './types';
import type { ThemeModeType } from '../types';

import { convertToHslCssVar } from '../utils';

export const antdAdapterConfig: AdapterConfig = {
  name: 'antd',
  cssVarPrefix: '--ant',
  primaryColorVar: '--ant-color-primary',
  supportsDarkMode: true,
};

/**
 * Ant Design 适配器
 * @description 支持 ant-design-vue 和 antd (React)
 */
export class AntdAdapter implements UIAdapter {
  config = antdAdapterConfig;

  init(): void {
    // 初始化 Ant Design 主题配置
    this.injectCSSVariables();
  }

  setThemeMode(mode: ThemeModeType): void {
    // Ant Design 通过 ConfigProvider 的 algorithm 属性控制暗色模式
    // 这里只负责 CSS 变量的同步
    const isDark = mode === 'dark' || 
      (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.dataset.antdTheme = isDark ? 'dark' : 'light';
  }

  setPrimaryColor(color: string): void {
    const hslValue = convertToHslCssVar(color);
    document.documentElement.style.setProperty(
      this.config.primaryColorVar,
      `hsl(${hslValue})`
    );
  }

  setRadius(radius: string): void {
    document.documentElement.style.setProperty(
      '--ant-border-radius',
      `${radius}rem`
    );
  }

  setFontSize(size: number): void {
    document.documentElement.style.setProperty(
      '--ant-font-size',
      `${size}px`
    );
  }

  getCSSVarMapping(): Record<string, string> {
    return {
      '--primary': '--ant-color-primary',
      '--primary-hover': '--ant-color-primary-hover',
      '--primary-active': '--ant-color-primary-active',
      '--success': '--ant-color-success',
      '--warning': '--ant-color-warning',
      '--destructive': '--ant-color-error',
      '--border': '--ant-color-border',
      '--radius': '--ant-border-radius',
    };
  }

  private injectCSSVariables(): void {
    // 注入适配 CSS
    const style = document.createElement('style');
    style.id = '__admin-core-antd-adapter__';
    style.textContent = `
      :root {
        --ant-color-primary: hsl(var(--primary));
        --ant-color-primary-hover: hsl(var(--primary-400));
        --ant-color-primary-active: hsl(var(--primary-600));
        --ant-color-success: hsl(var(--success));
        --ant-color-warning: hsl(var(--warning));
        --ant-color-error: hsl(var(--destructive));
        --ant-color-border: hsl(var(--border));
        --ant-border-radius: var(--radius);
        --ant-font-size: var(--font-size-base);
      }
    `;
    document.head.appendChild(style);
  }
}

export const antdAdapter = new AntdAdapter();
export default antdAdapter;
```

### 10.3 Element Plus 适配器

```typescript
// packages/preferences/core/src/adapters/element-plus.ts

import type { UIAdapter, AdapterConfig } from './types';
import type { ThemeModeType } from '../types';

import { convertToHslCssVar } from '../utils';

export const elementPlusAdapterConfig: AdapterConfig = {
  name: 'element-plus',
  cssVarPrefix: '--el',
  primaryColorVar: '--el-color-primary',
  supportsDarkMode: true,
};

/**
 * Element Plus 适配器
 */
export class ElementPlusAdapter implements UIAdapter {
  config = elementPlusAdapterConfig;

  init(): void {
    this.injectCSSVariables();
  }

  setThemeMode(mode: ThemeModeType): void {
    const isDark = mode === 'dark' || 
      (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.classList.toggle('dark', isDark);
  }

  setPrimaryColor(color: string): void {
    // Element Plus 使用 hex 格式
    document.documentElement.style.setProperty(
      this.config.primaryColorVar,
      color
    );
    
    // 生成色阶
    this.generateColorScale(color);
  }

  setRadius(radius: string): void {
    document.documentElement.style.setProperty(
      '--el-border-radius-base',
      `${radius}rem`
    );
  }

  setFontSize(size: number): void {
    document.documentElement.style.setProperty(
      '--el-font-size-base',
      `${size}px`
    );
  }

  getCSSVarMapping(): Record<string, string> {
    return {
      '--primary': '--el-color-primary',
      '--success': '--el-color-success',
      '--warning': '--el-color-warning',
      '--destructive': '--el-color-danger',
      '--border': '--el-border-color',
      '--radius': '--el-border-radius-base',
    };
  }

  private generateColorScale(color: string): void {
    // Element Plus 使用 light-3, light-5, light-7, light-9 等色阶
    const shades = ['light-3', 'light-5', 'light-7', 'light-9', 'dark-2'];
    
    // 简化实现，实际应使用 color 库生成色阶
    shades.forEach(shade => {
      document.documentElement.style.setProperty(
        `--el-color-primary-${shade}`,
        `var(--primary-${shade === 'dark-2' ? '600' : '300'})`
      );
    });
  }

  private injectCSSVariables(): void {
    const style = document.createElement('style');
    style.id = '__admin-core-element-plus-adapter__';
    style.textContent = `
      :root {
        --el-color-primary: hsl(var(--primary));
        --el-color-success: hsl(var(--success));
        --el-color-warning: hsl(var(--warning));
        --el-color-danger: hsl(var(--destructive));
        --el-border-color: hsl(var(--border));
        --el-border-radius-base: var(--radius);
        --el-font-size-base: var(--font-size-base);
      }
    `;
    document.head.appendChild(style);
  }
}

export const elementPlusAdapter = new ElementPlusAdapter();
export default elementPlusAdapter;
```

### 10.4 shadcn/ui 适配器

```typescript
// packages/preferences/core/src/adapters/shadcn.ts

import type { UIAdapter, AdapterConfig } from './types';
import type { ThemeModeType } from '../types';

export const shadcnAdapterConfig: AdapterConfig = {
  name: 'shadcn',
  cssVarPrefix: '--',
  primaryColorVar: '--primary',
  supportsDarkMode: true,
};

/**
 * shadcn/ui 适配器
 * @description shadcn/ui 默认使用与 admin-core 相同的 CSS 变量命名
 */
export class ShadcnAdapter implements UIAdapter {
  config = shadcnAdapterConfig;

  init(): void {
    // shadcn/ui 默认与 admin-core 变量兼容，无需额外注入
  }

  setThemeMode(mode: ThemeModeType): void {
    const isDark = mode === 'dark' || 
      (mode === 'auto' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    document.documentElement.classList.toggle('dark', isDark);
  }

  setPrimaryColor(color: string): void {
    // 使用 admin-core 的标准方法即可
  }

  setRadius(radius: string): void {
    // 使用 admin-core 的标准方法即可
  }

  setFontSize(size: number): void {
    // 使用 admin-core 的标准方法即可
  }

  getCSSVarMapping(): Record<string, string> {
    // shadcn/ui 直接使用相同的变量名
    return {
      '--primary': '--primary',
      '--success': '--success',
      '--warning': '--warning',
      '--destructive': '--destructive',
      '--border': '--border',
      '--radius': '--radius',
    };
  }
}

export const shadcnAdapter = new ShadcnAdapter();
export default shadcnAdapter;
```

---

## 11. Vue 偏好设置组件 (`@admin-core/preferences-vue`)

### 11.1 目录结构

```
packages/preferences/vue/
├── src/
│   ├── composables/
│   │   ├── use-preferences.ts      # 偏好设置 composable
│   │   └── use-open-preferences.ts # 打开偏好设置面板
│   ├── components/
│   │   ├── PreferencesDrawer.vue   # 偏好设置抽屉
│   │   ├── PreferencesButton.vue   # 偏好设置按钮
│   │   ├── blocks/                 # 设置区块组件
│   │   │   ├── Block.vue
│   │   │   ├── SwitchItem.vue
│   │   │   ├── SelectItem.vue
│   │   │   ├── ToggleItem.vue
│   │   │   ├── InputItem.vue
│   │   │   ├── NumberFieldItem.vue
│   │   │   ├── CheckboxItem.vue
│   │   │   ├── theme/
│   │   │   │   ├── ThemeBlock.vue
│   │   │   │   ├── BuiltinBlock.vue
│   │   │   │   ├── RadiusBlock.vue
│   │   │   │   ├── FontSizeBlock.vue
│   │   │   │   └── ColorModeBlock.vue
│   │   │   ├── layout/
│   │   │   │   ├── LayoutBlock.vue
│   │   │   │   ├── ContentBlock.vue
│   │   │   │   ├── SidebarBlock.vue
│   │   │   │   ├── HeaderBlock.vue
│   │   │   │   ├── BreadcrumbBlock.vue
│   │   │   │   ├── TabbarBlock.vue
│   │   │   │   ├── NavigationBlock.vue
│   │   │   │   ├── FooterBlock.vue
│   │   │   │   ├── CopyrightBlock.vue
│   │   │   │   └── WidgetBlock.vue
│   │   │   ├── general/
│   │   │   │   ├── GeneralBlock.vue
│   │   │   │   └── AnimationBlock.vue
│   │   │   └── shortcut-keys/
│   │   │       └── GlobalBlock.vue
│   │   └── icons/                  # 布局图标
│   │       ├── SidebarNav.vue
│   │       ├── SidebarMixedNav.vue
│   │       ├── HeaderNav.vue
│   │       ├── HeaderMixedNav.vue
│   │       ├── HeaderSidebarNav.vue
│   │       ├── MixedNav.vue
│   │       ├── FullContent.vue
│   │       └── ContentCompact.vue
│   ├── types.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 11.2 usePreferences Composable

```typescript
// packages/preferences/vue/src/composables/use-preferences.ts

import { computed, ref, watch, onMounted, onUnmounted } from 'vue';
import type { Preferences, DeepPartial, LayoutType, ThemeModeType } from '@admin-core/preferences';
import {
  preferencesManager,
  isDarkTheme,
} from '@admin-core/preferences';

/**
 * Vue 偏好设置 Composable
 */
export function usePreferences() {
  // 响应式偏好设置
  const preferences = ref<Preferences>(preferencesManager.getPreferences());
  
  // 订阅变更
  let unsubscribe: (() => void) | null = null;
  
  onMounted(() => {
    unsubscribe = preferencesManager.subscribe((newPreferences) => {
      preferences.value = newPreferences;
    });
  });
  
  onUnmounted(() => {
    unsubscribe?.();
  });

  // 计算属性
  const appPreferences = computed(() => preferences.value.app);
  const themePreferences = computed(() => preferences.value.theme);
  const shortcutKeysPreferences = computed(() => preferences.value.shortcutKeys);
  
  /**
   * 是否为暗色模式
   */
  const isDark = computed(() => isDarkTheme(themePreferences.value.mode));
  
  /**
   * 当前主题
   */
  const theme = computed<'dark' | 'light'>(() => isDark.value ? 'dark' : 'light');
  
  /**
   * 当前语言
   */
  const locale = computed(() => appPreferences.value.locale);
  
  /**
   * 是否移动端
   */
  const isMobile = computed(() => appPreferences.value.isMobile);
  
  /**
   * 当前布局（移动端强制使用侧边导航）
   */
  const layout = computed<LayoutType>(() => 
    isMobile.value ? 'sidebar-nav' : appPreferences.value.layout
  );
  
  /**
   * 侧边栏是否折叠
   */
  const sidebarCollapsed = computed(() => preferences.value.sidebar.collapsed);
  
  /**
   * 是否全屏内容模式
   */
  const isFullContent = computed(() => layout.value === 'full-content');
  
  /**
   * 是否侧边导航模式
   */
  const isSideNav = computed(() => layout.value === 'sidebar-nav');
  
  /**
   * 是否侧边混合导航模式
   */
  const isSideMixedNav = computed(() => layout.value === 'sidebar-mixed-nav');
  
  /**
   * 是否顶部导航模式
   */
  const isHeaderNav = computed(() => layout.value === 'header-nav');
  
  /**
   * 是否顶部混合导航模式
   */
  const isHeaderMixedNav = computed(() => layout.value === 'header-mixed-nav');
  
  /**
   * 是否顶部通栏+侧边导航模式
   */
  const isHeaderSidebarNav = computed(() => layout.value === 'header-sidebar-nav');
  
  /**
   * 是否混合导航模式
   */
  const isMixedNav = computed(() => layout.value === 'mixed-nav');
  
  /**
   * 是否包含侧边栏的布局
   */
  const isSideMode = computed(() => 
    isSideNav.value ||
    isSideMixedNav.value ||
    isMixedNav.value ||
    isHeaderMixedNav.value ||
    isHeaderSidebarNav.value
  );
  
  /**
   * 是否显示顶栏
   */
  const isShowHeaderNav = computed(() => preferences.value.header.enable);
  
  /**
   * 是否启用 keep-alive
   */
  const keepAlive = computed(() => 
    preferences.value.tabbar.enable && preferences.value.tabbar.keepAlive
  );
  
  /**
   * 内容是否最大化
   */
  const contentIsMaximize = computed(() => {
    const { header, sidebar } = preferences.value;
    return header.hidden && sidebar.hidden && !isFullContent.value;
  });
  
  /**
   * 偏好设置按钮位置
   */
  const preferencesButtonPosition = computed(() => {
    const { enablePreferences, preferencesButtonPosition } = appPreferences.value;
    
    if (!enablePreferences) {
      return { fixed: false, header: false };
    }
    
    const { header, sidebar } = preferences.value;
    const contentIsMaximize = header.hidden && sidebar.hidden;
    
    if (preferencesButtonPosition !== 'auto') {
      return {
        fixed: preferencesButtonPosition === 'fixed',
        header: preferencesButtonPosition === 'header',
      };
    }
    
    const fixed = contentIsMaximize || 
      isFullContent.value || 
      isMobile.value || 
      !isShowHeaderNav.value;
    
    return {
      fixed,
      header: !fixed,
    };
  });
  
  /**
   * 是否启用全局搜索快捷键
   */
  const globalSearchShortcutKey = computed(() => {
    const { enable, globalSearch } = shortcutKeysPreferences.value;
    return enable && globalSearch;
  });
  
  /**
   * 是否启用全局登出快捷键
   */
  const globalLogoutShortcutKey = computed(() => {
    const { enable, globalLogout } = shortcutKeysPreferences.value;
    return enable && globalLogout;
  });
  
  /**
   * 是否启用全局锁屏快捷键
   */
  const globalLockScreenShortcutKey = computed(() => {
    const { enable, globalLockScreen } = shortcutKeysPreferences.value;
    return enable && globalLockScreen;
  });
  
  /**
   * 偏好设置差异
   */
  const diffPreference = computed(() => preferencesManager.getDiff());
  
  /**
   * 登录页面板位置
   */
  const authPanelLeft = computed(() => appPreferences.value.authPageLayout === 'panel-left');
  const authPanelRight = computed(() => appPreferences.value.authPageLayout === 'panel-right');
  const authPanelCenter = computed(() => appPreferences.value.authPageLayout === 'panel-center');

  return {
    // 原始偏好设置
    preferences,
    
    // 分类偏好设置
    appPreferences,
    themePreferences,
    shortcutKeysPreferences,
    
    // 主题相关
    isDark,
    theme,
    
    // 布局相关
    layout,
    isFullContent,
    isSideNav,
    isSideMixedNav,
    isHeaderNav,
    isHeaderMixedNav,
    isHeaderSidebarNav,
    isMixedNav,
    isSideMode,
    isShowHeaderNav,
    
    // 侧边栏
    sidebarCollapsed,
    
    // 响应式
    isMobile,
    
    // 功能
    keepAlive,
    contentIsMaximize,
    preferencesButtonPosition,
    
    // 快捷键
    globalSearchShortcutKey,
    globalLogoutShortcutKey,
    globalLockScreenShortcutKey,
    
    // 其他
    locale,
    diffPreference,
    authPanelLeft,
    authPanelRight,
    authPanelCenter,
  };
}
```

### 11.3 SwitchItem 组件示例

```vue
<!-- packages/preferences/vue/src/components/blocks/SwitchItem.vue -->
<script setup lang="ts">
import { computed } from 'vue';

interface Props {
  /** 是否禁用 */
  disabled?: boolean;
  /** 提示文本 */
  tip?: string;
}

const props = withDefaults(defineProps<Props>(), {
  disabled: false,
});

const checked = defineModel<boolean>('checked', { default: false });

const handleClick = () => {
  if (!props.disabled) {
    checked.value = !checked.value;
  }
};
</script>

<template>
  <div
    class="admin-preferences-switch-item flex items-center justify-between py-2"
    :class="{ 'opacity-50 cursor-not-allowed': disabled }"
    @click="handleClick"
  >
    <div class="flex items-center gap-2">
      <span class="text-sm">
        <slot />
      </span>
      <Tooltip v-if="tip || $slots.tip" :content="tip">
        <template #content>
          <slot name="tip">{{ tip }}</slot>
        </template>
        <CircleHelpIcon class="h-4 w-4 text-muted-foreground" />
      </Tooltip>
    </div>
    
    <div class="flex items-center gap-2">
      <slot name="shortcut" />
      <Switch
        :checked="checked"
        :disabled="disabled"
        @update:checked="checked = $event"
        @click.stop
      />
    </div>
  </div>
</template>
```

---

## 12. React 偏好设置组件 (`@admin-core/preferences-react`)

### 12.1 目录结构

```
packages/preferences/react/
├── src/
│   ├── hooks/
│   │   ├── use-preferences.ts      # 偏好设置 hook
│   │   └── use-open-preferences.ts # 打开偏好设置面板
│   ├── components/
│   │   ├── PreferencesDrawer.tsx   # 偏好设置抽屉
│   │   ├── PreferencesButton.tsx   # 偏好设置按钮
│   │   ├── blocks/                 # 设置区块组件
│   │   │   ├── Block.tsx
│   │   │   ├── SwitchItem.tsx
│   │   │   ├── SelectItem.tsx
│   │   │   ├── ToggleItem.tsx
│   │   │   ├── InputItem.tsx
│   │   │   ├── NumberFieldItem.tsx
│   │   │   ├── CheckboxItem.tsx
│   │   │   └── ... (与 Vue 结构相同)
│   │   └── icons/
│   │       └── ... (SVG 组件)
│   ├── context/
│   │   └── PreferencesContext.tsx  # React Context
│   ├── types.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

### 12.2 usePreferences Hook

```typescript
// packages/preferences/react/src/hooks/use-preferences.ts

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Preferences, DeepPartial, LayoutType } from '@admin-core/preferences';
import {
  preferencesManager,
  isDarkTheme,
  updatePreferences,
  resetPreferences,
  clearPreferencesCache,
} from '@admin-core/preferences';

/**
 * React 偏好设置 Hook
 */
export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(
    preferencesManager.getPreferences()
  );

  useEffect(() => {
    const unsubscribe = preferencesManager.subscribe((newPreferences) => {
      setPreferences(newPreferences);
    });
    return unsubscribe;
  }, []);

  // Memoized 计算值
  const isDark = useMemo(
    () => isDarkTheme(preferences.theme.mode),
    [preferences.theme.mode]
  );

  const theme = useMemo<'dark' | 'light'>(
    () => (isDark ? 'dark' : 'light'),
    [isDark]
  );

  const isMobile = useMemo(
    () => preferences.app.isMobile,
    [preferences.app.isMobile]
  );

  const layout = useMemo<LayoutType>(
    () => (isMobile ? 'sidebar-nav' : preferences.app.layout),
    [isMobile, preferences.app.layout]
  );

  const sidebarCollapsed = useMemo(
    () => preferences.sidebar.collapsed,
    [preferences.sidebar.collapsed]
  );

  const isFullContent = useMemo(
    () => layout === 'full-content',
    [layout]
  );

  const isSideNav = useMemo(
    () => layout === 'sidebar-nav',
    [layout]
  );

  const isSideMixedNav = useMemo(
    () => layout === 'sidebar-mixed-nav',
    [layout]
  );

  const isHeaderNav = useMemo(
    () => layout === 'header-nav',
    [layout]
  );

  const isHeaderMixedNav = useMemo(
    () => layout === 'header-mixed-nav',
    [layout]
  );

  const isHeaderSidebarNav = useMemo(
    () => layout === 'header-sidebar-nav',
    [layout]
  );

  const isMixedNav = useMemo(
    () => layout === 'mixed-nav',
    [layout]
  );

  const isSideMode = useMemo(
    () =>
      isSideNav ||
      isSideMixedNav ||
      isMixedNav ||
      isHeaderMixedNav ||
      isHeaderSidebarNav,
    [isSideNav, isSideMixedNav, isMixedNav, isHeaderMixedNav, isHeaderSidebarNav]
  );

  const keepAlive = useMemo(
    () => preferences.tabbar.enable && preferences.tabbar.keepAlive,
    [preferences.tabbar.enable, preferences.tabbar.keepAlive]
  );

  const locale = useMemo(
    () => preferences.app.locale,
    [preferences.app.locale]
  );

  // 操作方法
  const update = useCallback((updates: DeepPartial<Preferences>) => {
    updatePreferences(updates);
  }, []);

  const reset = useCallback(() => {
    resetPreferences();
  }, []);

  const clearCache = useCallback(() => {
    clearPreferencesCache();
  }, []);

  return {
    // 原始偏好设置
    preferences,

    // 主题相关
    isDark,
    theme,

    // 布局相关
    layout,
    isFullContent,
    isSideNav,
    isSideMixedNav,
    isHeaderNav,
    isHeaderMixedNav,
    isHeaderSidebarNav,
    isMixedNav,
    isSideMode,

    // 侧边栏
    sidebarCollapsed,

    // 响应式
    isMobile,

    // 功能
    keepAlive,
    locale,

    // 操作方法
    update,
    reset,
    clearCache,
  };
}
```

### 12.3 PreferencesProvider

```typescript
// packages/preferences/react/src/context/PreferencesContext.tsx

import React, { createContext, useContext, ReactNode } from 'react';
import type { Preferences, DeepPartial } from '@admin-core/preferences';
import { usePreferences } from '../hooks/use-preferences';

interface PreferencesContextValue {
  preferences: Preferences;
  isDark: boolean;
  theme: 'dark' | 'light';
  isMobile: boolean;
  layout: string;
  update: (updates: DeepPartial<Preferences>) => void;
  reset: () => void;
  clearCache: () => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

interface PreferencesProviderProps {
  children: ReactNode;
}

/**
 * 偏好设置 Provider
 */
export function PreferencesProvider({ children }: PreferencesProviderProps) {
  const value = usePreferences();

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

/**
 * 使用偏好设置 Context
 */
export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  
  if (!context) {
    throw new Error(
      'usePreferencesContext must be used within a PreferencesProvider'
    );
  }
  
  return context;
}
```

---

## 13. 测试策略

### 13.1 单元测试

```typescript
// packages/preferences/core/src/__tests__/preferences-manager.test.ts

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PreferencesManager } from '../preferences-manager';
import { DEFAULT_PREFERENCES } from '../constants';

describe('PreferencesManager', () => {
  let manager: PreferencesManager;

  beforeEach(() => {
    manager = new PreferencesManager();
    localStorage.clear();
  });

  describe('initialization', () => {
    it('should initialize with default preferences', async () => {
      await manager.init({ namespace: 'test' });
      
      const preferences = manager.getPreferences();
      expect(preferences).toEqual(DEFAULT_PREFERENCES);
    });

    it('should merge override preferences', async () => {
      await manager.init({
        namespace: 'test',
        overrides: {
          app: { name: 'Custom App' },
          theme: { mode: 'dark' },
        },
      });
      
      const preferences = manager.getPreferences();
      expect(preferences.app.name).toBe('Custom App');
      expect(preferences.theme.mode).toBe('dark');
    });

    it('should load from cache on init', async () => {
      const cached = { ...DEFAULT_PREFERENCES, app: { ...DEFAULT_PREFERENCES.app, name: 'Cached' } };
      localStorage.setItem('test:preferences', JSON.stringify({ value: cached }));
      
      await manager.init({ namespace: 'test' });
      
      expect(manager.getPreferences().app.name).toBe('Cached');
    });
  });

  describe('update', () => {
    beforeEach(async () => {
      await manager.init({ namespace: 'test' });
    });

    it('should update preferences', () => {
      manager.update({ theme: { mode: 'dark' } });
      
      expect(manager.getPreferences().theme.mode).toBe('dark');
    });

    it('should deep merge updates', () => {
      manager.update({ sidebar: { width: 300 } });
      
      const sidebar = manager.getPreferences().sidebar;
      expect(sidebar.width).toBe(300);
      expect(sidebar.collapsed).toBe(DEFAULT_PREFERENCES.sidebar.collapsed);
    });

    it('should notify subscribers', () => {
      const listener = vi.fn();
      manager.subscribe(listener);
      
      manager.update({ theme: { mode: 'dark' } });
      
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    beforeEach(async () => {
      await manager.init({ namespace: 'test' });
    });

    it('should reset to initial preferences', () => {
      manager.update({ theme: { mode: 'dark' }, app: { name: 'Changed' } });
      manager.reset();
      
      expect(manager.getPreferences()).toEqual(DEFAULT_PREFERENCES);
    });
  });

  describe('getDiff', () => {
    beforeEach(async () => {
      await manager.init({ namespace: 'test' });
    });

    it('should return empty object when no changes', () => {
      expect(manager.getDiff()).toEqual({});
    });

    it('should return changed values', () => {
      manager.update({ theme: { mode: 'dark' } });
      
      const diff = manager.getDiff();
      expect(diff.theme?.mode).toBe('dark');
    });
  });
});
```

### 13.2 测试配置

```typescript
// vitest.config.ts (root)

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules',
        '**/*.d.ts',
        '**/__tests__/**',
        '**/examples/**',
      ],
    },
    include: ['packages/**/*.test.ts', 'packages/**/*.test.tsx'],
  },
});
```

---

## 14. 构建配置

### 14.1 tsup 配置示例

```typescript
// packages/preferences/core/tsup.config.ts

import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  external: [
    'culori',
    'theme-colors',
  ],
});
```

### 14.2 package.json 示例

```json
// packages/preferences/core/package.json
{
  "name": "@admin-core/preferences",
  "version": "0.1.0",
  "description": "Framework-agnostic preferences management for admin systems",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "test": "vitest",
    "lint": "eslint src"
  },
  "dependencies": {
    "culori": "catalog:",
    "theme-colors": "catalog:"
  },
  "devDependencies": {
    "@admin-core/tsconfig": "workspace:*",
    "tsup": "catalog:",
    "typescript": "catalog:",
    "vitest": "catalog:"
  },
  "keywords": [
    "admin",
    "preferences",
    "settings",
    "theme",
    "layout"
  ],
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/admin-core.git",
    "directory": "packages/@admin-core/preferences"
  }
}
```

---

## 15. 使用示例

### 15.1 Vue 应用集成

```typescript
// main.ts
import { createApp } from 'vue';
import { initPreferences, antdAdapter } from '@admin-core/preferences';
import '@admin-core/preferences/styles';

import App from './App.vue';

async function bootstrap() {
  // 初始化偏好设置
  await initPreferences({
    namespace: 'my-admin',
    overrides: {
      app: {
        name: 'My Admin',
        locale: 'zh-CN',
      },
      theme: {
        builtinType: 'default',
        mode: 'auto',
      },
    },
  });

  // 初始化 UI 适配器
  antdAdapter.init();

  const app = createApp(App);
  app.mount('#app');
}

bootstrap();
```

```vue
<!-- App.vue -->
<script setup lang="ts">
import { usePreferences, PreferencesButton } from '@admin-core/preferences-vue';

const { isDark, layout, theme } = usePreferences();
</script>

<template>
  <div :class="{ dark: isDark }">
    <Layout :layout="layout">
      <!-- 应用内容 -->
    </Layout>
    
    <!-- 偏好设置按钮 -->
    <PreferencesButton />
  </div>
</template>
```

### 15.2 React 应用集成

```tsx
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { initPreferences, antdAdapter } from '@admin-core/preferences';
import { PreferencesProvider } from '@admin-core/preferences-react';
import '@admin-core/preferences/styles';

import App from './App';

async function bootstrap() {
  await initPreferences({
    namespace: 'my-admin',
    overrides: {
      app: { name: 'My Admin' },
    },
  });

  antdAdapter.init();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <PreferencesProvider>
        <App />
      </PreferencesProvider>
    </React.StrictMode>
  );
}

bootstrap();
```

```tsx
// App.tsx
import { usePreferencesContext, PreferencesButton } from '@admin-core/preferences-react';

function App() {
  const { isDark, layout, theme } = usePreferencesContext();

  return (
    <div className={isDark ? 'dark' : ''}>
      <Layout layout={layout}>
        {/* 应用内容 */}
      </Layout>
      
      <PreferencesButton />
    </div>
  );
}

export default App;
```

---

## 16. 发布流程

### 16.1 版本管理

使用 Changesets 进行版本管理：

```bash
# 添加变更
pnpm changeset:add

# 更新版本
pnpm changeset:version

# 发布
pnpm release
```

### 16.2 发布检查清单

- [ ] 所有测试通过
- [ ] Lint 检查通过
- [ ] 构建成功
- [ ] 文档更新
- [ ] CHANGELOG 更新
- [ ] 版本号正确

---

## 17. 总结

本设计文档详细描述了一个功能完整的偏好设置系统，采用简洁的 3 包架构：

### 包结构

| npm 包名 | 路径 | 说明 |
|----------|------|------|
| `@admin-core/preferences` | `packages/preferences/core` | 核心包（框架无关） |
| `@admin-core/preferences-vue` | `packages/preferences/vue` | Vue 实现 |
| `@admin-core/preferences-react` | `packages/preferences/react` | React 实现 |

### 核心特点

1. **框架无关的核心**: `@admin-core/preferences` 包含所有核心逻辑、类型、常量、工具、样式、国际化、适配器
2. **简洁的包结构**: 仅 3 个 npm 包，避免过度拆分
3. **多框架支持**: Vue 和 React 独立包，共享 core 能力
4. **UI 组件库适配**: 内置 Ant Design、Element Plus、Naive UI、shadcn/ui 适配器
5. **Tailwind CSS v4 集成**: 充分利用新特性
6. **完整的类型定义**: TypeScript 全覆盖
7. **国际化支持**: 内置中英文
8. **全面测试**: 单元测试覆盖核心功能
9. **灵活配置**: 所有选项可配置，无硬编码

### 实施步骤

1. **Core 包基础**: 创建 types、constants、utils 目录
2. **Core 包核心**: 实现 PreferencesManager、styles、locales、adapters
3. **Vue 包**: 实现 composables 和组件
4. **React 包**: 实现 hooks、context 和组件
5. **测试与文档**: 编写测试，完善文档
