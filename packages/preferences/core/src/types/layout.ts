/**
 * 布局相关类型定义。
 * @description 定义布局模式、导航风格、登录页布局和多语言等标识类型。
 */

/**
 * 布局类型。
 * @description 系统支持的所有布局模式。
 * - `sidebar-nav`: 侧边导航。
 * - `sidebar-mixed-nav`: 侧边混合导航。
 * - `header-nav`: 顶部导航。
 * - `header-sidebar-nav`: 顶部通栏 + 侧边导航。
 * - `mixed-nav`: 混合导航。
 * - `header-mixed-nav`: 顶部混合导航。
 * - `full-content`: 全屏内容布局。
 */
export type LayoutType =
  | 'full-content'
  | 'header-mixed-nav'
  | 'header-nav'
  | 'header-sidebar-nav'
  | 'mixed-nav'
  | 'sidebar-mixed-nav'
  | 'sidebar-nav';

/**
 * 偏好设置按钮位置。
 * @description
 * - `auto`: 自动（根据布局自适应）。
 * - `fixed`: 固定在页面右侧。
 * - `header`: 放置在顶栏区域。
 */
export type PreferencesButtonPositionType = 'auto' | 'fixed' | 'header';

/**
 * 内容宽度模式。
 * @description
 * - `wide`: 宽屏模式。
 * - `compact`: 紧凑模式（限制最大宽度）。
 */
export type ContentCompactType = 'compact' | 'wide';

/**
 * 顶栏模式。
 * @description
 * - `fixed`: 固定在顶部。
 * - `static`: 随页面滚动。
 * - `auto`: 根据场景自动决定。
 * - `auto-scroll`: 滚动时自动隐藏/显示。
 */
export type LayoutHeaderModeType = 'auto' | 'auto-scroll' | 'fixed' | 'static';

/**
 * 顶栏菜单对齐方式。
 * @description 控制顶栏导航菜单在头部区域中的横向排列位置。
 */
export type LayoutHeaderMenuAlignType = 'center' | 'end' | 'start';

/**
 * 登录过期处理模式。
 * @description
 * - `modal`: 弹窗模式。
 * - `page`: 跳转登录页。
 */
export type LoginExpiredModeType = 'modal' | 'page';

/**
 * 面包屑样式。
 * @description
 * - `normal`: 默认样式。
 * - `background`: 带背景容器样式。
 */
export type BreadcrumbStyleType = 'background' | 'normal';

/**
 * 权限模式。
 * @description
 * - `frontend`: 前端控制权限。
 * - `backend`: 后端控制权限。
 * - `mixed`: 混合模式。
 */
export type AccessModeType = 'backend' | 'frontend' | 'mixed';

/**
 * 导航风格。
 * @description
 * - `rounded`: 圆润风格。
 * - `plain`: 朴素风格。
 */
export type NavigationStyleType = 'plain' | 'rounded';

/**
 * 标签栏风格。
 * @description
 * - `chrome`: Chrome 风格。
 * - `card`: 卡片风格。
 * - `plain`: 朴素风格。
 * - `brisk`: 轻快风格。
 */
export type TabsStyleType = 'brisk' | 'card' | 'chrome' | 'plain';

/**
 * 登录页布局。
 * @description
 * - `panel-left`: 面板居左。
 * - `panel-center`: 面板居中。
 * - `panel-right`: 面板居右。
 */
export type AuthPageLayoutType = 'panel-center' | 'panel-left' | 'panel-right';

/**
 * 支持的语言类型。
 * @description 内置语言标识集合，用于偏好中心语言切换与文案选择。
 */
export type SupportedLanguagesType = 'en-US' | 'zh-CN';

/**
 * 时区选项。
 * @description 用于时区选择器的标准项结构，包含显示名、偏移与时区 ID。
 */
export interface TimezoneOption {
  /** 展示标签（如 `UTC+08:00`）。 */
  label: string;
  /** 协调世界时偏移量（小时）。 */
  offset: number;
  /** 标准时区标识（如 `Asia/Shanghai`）。 */
  timezone: string;
}
