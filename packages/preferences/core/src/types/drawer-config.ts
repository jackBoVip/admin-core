/**
 * 偏好设置抽屉配置类型定义集合。
 * @description 用于控制各页签、功能区块与控件项的显示/禁用状态。
 */

/**
 * 功能项配置。
 * @description
 * 该结构用于最小粒度的界面能力开关：
 * - `visible`: 控制是否渲染；
 * - `disabled`: 控制渲染后是否可交互。
 */
export interface FeatureItemConfig {
  /** 是否显示该功能项 */
  visible?: boolean;
  /** 是否禁用该功能项 */
  disabled?: boolean;
}

/**
 * 功能区块配置（控制显示/禁用）。
 * @description 在区块维度上定义可见性/禁用状态，并可对子项进一步细化。
 */
export interface FeatureBlockConfig extends FeatureItemConfig {
  /** 区块内的功能项配置 */
  items?: Record<string, FeatureItemConfig>;
}

/**
 * 外观设置页签配置。
 * @description 控制主题、圆角、字体与色彩模式相关配置项的可见性和交互状态。
 */
export interface AppearanceTabConfig extends FeatureItemConfig {
  /** 主题模式区块 */
  themeMode?: FeatureBlockConfig;
  /** 内置主题区块 */
  builtinTheme?: FeatureBlockConfig;
  /** 圆角区块 */
  radius?: FeatureBlockConfig;
  /** 字体大小区块 */
  fontSize?: FeatureBlockConfig;
  /** 颜色模式区块（跟随主题等） */
  colorMode?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 浅色背景跟随主题 */
      colorFollowPrimaryLight?: FeatureItemConfig;
      /** 深色背景跟随主题 */
      colorFollowPrimaryDark?: FeatureItemConfig;
      /** 深色侧边栏 */
      semiDarkSidebar?: FeatureItemConfig;
      /** 深色顶栏 */
      semiDarkHeader?: FeatureItemConfig;
      /** 灰色模式 */
      colorGrayMode?: FeatureItemConfig;
      /** 色弱模式 */
      colorWeakMode?: FeatureItemConfig;
    };
  };
}

/**
 * 布局设置页签配置。
 * @description 控制布局结构（顶栏、侧边栏、标签栏、面包屑等）相关配置项。
 */
export interface LayoutTabConfig extends FeatureItemConfig {
  /** 布局类型区块 */
  layoutType?: FeatureBlockConfig;
  /** 内容宽度区块 */
  contentWidth?: FeatureBlockConfig;
  /** 侧边栏区块 */
  sidebar?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 折叠状态 */
      collapsed?: FeatureItemConfig;
      /** 显示折叠按钮 */
      collapsedButton?: FeatureItemConfig;
      /** 悬停展开 */
      expandOnHover?: FeatureItemConfig;
    };
  };
  /** 功能区区块 */
  panel?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用功能区 */
      enable?: FeatureItemConfig;
      /** 显示位置 */
      position?: FeatureItemConfig;
      /** 折叠状态 */
      collapsed?: FeatureItemConfig;
    };
  };
  /** 顶栏区块 */
  header?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用顶栏 */
      enable?: FeatureItemConfig;
      /** 顶栏模式 */
      mode?: FeatureItemConfig;
      /** 菜单对齐 */
      menuAlign?: FeatureItemConfig;
      /** 菜单启动器 */
      menuLauncher?: FeatureItemConfig;
    };
  };
  /** 标签栏区块 */
  tabbar?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用标签栏 */
      enable?: FeatureItemConfig;
      /** 持久化标签页 */
      persist?: FeatureItemConfig;
      /** 页面缓存 */
      keepAlive?: FeatureItemConfig;
      /** 最大标签数 */
      maxCount?: FeatureItemConfig;
      /** 显示图标 */
      showIcon?: FeatureItemConfig;
      /** 显示更多按钮 */
      showMore?: FeatureItemConfig;
      /** 显示最大化按钮 */
      showMaximize?: FeatureItemConfig;
      /** 可拖拽排序 */
      draggable?: FeatureItemConfig;
      /** 启用滚轮响应 */
      wheelable?: FeatureItemConfig;
      /** 中键关闭 */
      middleClickToClose?: FeatureItemConfig;
      /** 标签样式 */
      styleType?: FeatureItemConfig;
    };
  };
  /** 面包屑区块 */
  breadcrumb?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用面包屑 */
      enable?: FeatureItemConfig;
      /** 显示图标 */
      showIcon?: FeatureItemConfig;
    };
  };
  /** 页脚区块 */
  footer?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用页脚 */
      enable?: FeatureItemConfig;
      /** 固定页脚 */
      fixed?: FeatureItemConfig;
    };
  };
  /** 小部件区块 */
  widget?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 全屏按钮 */
      fullscreen?: FeatureItemConfig;
      /** 全局搜索 */
      globalSearch?: FeatureItemConfig;
      /** 主题切换 */
      themeToggle?: FeatureItemConfig;
      /** 语言切换 */
      languageToggle?: FeatureItemConfig;
    };
  };
}

/**
 * 通用设置页签配置。
 * @description 控制语言、动态标题、版权、锁屏、水印和页面过渡等通用配置项。
 */
export interface GeneralTabConfig extends FeatureItemConfig {
  /** 语言区块 */
  language?: FeatureBlockConfig;
  /** 动态标题区块 */
  dynamicTitle?: FeatureBlockConfig;
  /** 版权区块 */
  copyright?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用版权 */
      enable?: FeatureItemConfig;
      /** 公司名称 */
      companyName?: FeatureItemConfig;
      /** 公司网站链接 */
      companySiteLink?: FeatureItemConfig;
      /** 版权年份 */
      date?: FeatureItemConfig;
      /** 备案编号 */
      icp?: FeatureItemConfig;
      /** 备案信息链接 */
      icpLink?: FeatureItemConfig;
    };
  };
  /** 锁屏区块 */
  lockScreen?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 锁屏按钮 */
      enable?: FeatureItemConfig;
      /** 自动锁屏时间 */
      autoLockTime?: FeatureItemConfig;
      /** 清空密码按钮 */
      clearPassword?: FeatureItemConfig;
    };
  };
  /** 水印区块 */
  watermark?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用水印 */
      enable?: FeatureItemConfig;
      /** 附加日期 */
      appendDate?: FeatureItemConfig;
      /** 水印内容 */
      content?: FeatureItemConfig;
      /** 水印角度 */
      angle?: FeatureItemConfig;
      /** 字体大小 */
      fontSize?: FeatureItemConfig;
    };
  };
  /** 页面动画区块 */
  transition?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用动画 */
      enable?: FeatureItemConfig;
      /** 显示进度条 */
      progress?: FeatureItemConfig;
      /** 动画效果 */
      name?: FeatureItemConfig;
    };
  };
}

/**
 * 快捷键设置页签配置。
 * @description 控制快捷键模块及其具体动作开关。
 */
export interface ShortcutKeysTabConfig extends FeatureItemConfig {
  /** 快捷键区块 */
  shortcuts?: FeatureBlockConfig & {
    /** 区块项配置。 */
    items?: {
      /** 启用快捷键 */
      enable?: FeatureItemConfig;
      /** 打开设置 */
      globalPreferences?: FeatureItemConfig;
      /** 全局搜索 */
      globalSearch?: FeatureItemConfig;
      /** 锁屏 */
      globalLockScreen?: FeatureItemConfig;
      /** 登出 */
      globalLogout?: FeatureItemConfig;
    };
  };
}

/**
 * 顶部操作按钮配置。
 * @description 对应抽屉头部右侧的导入、重置、固定、关闭按钮。
 */
export interface HeaderActionsConfig {
  /** 导入配置按钮 */
  import?: FeatureItemConfig;
  /** 重置配置按钮 */
  reset?: FeatureItemConfig;
  /** 固定抽屉按钮 */
  pin?: FeatureItemConfig;
  /** 关闭按钮 */
  close?: FeatureItemConfig;
}

/**
 * 底部操作按钮配置。
 * @description 对应抽屉底部操作区，目前包含复制配置按钮。
 */
export interface FooterActionsConfig {
  /** 复制配置按钮 */
  copy?: FeatureItemConfig;
}

/**
 * 偏好设置抽屉完整配置。
 * @description 按页签与操作区分组的界面配置总结构。
 */
export interface PreferencesDrawerUIConfig {
  /** 顶部操作按钮 */
  headerActions?: HeaderActionsConfig;
  /** 底部操作按钮 */
  footerActions?: FooterActionsConfig;
  /** 外观设置 Tab */
  appearance?: AppearanceTabConfig;
  /** 布局设置 Tab */
  layout?: LayoutTabConfig;
  /** 通用设置 Tab */
  general?: GeneralTabConfig;
  /** 快捷键设置 Tab */
  shortcutKeys?: ShortcutKeysTabConfig;
}

/**
 * 功能项配置辅助解析返回值。
 * @description 为最终解析后的可见性与禁用状态（已应用默认值）。
 */
export interface ResolvedFeatureConfig {
  /** 是否显示 */
  visible: boolean;
  /** 是否禁用 */
  disabled: boolean;
}
