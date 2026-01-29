/**
 * 偏好设置抽屉配置类型
 * @description 用于控制功能项的显示/禁用
 */

/**
 * 功能项配置
 */
export interface FeatureItemConfig {
  /** 是否显示该功能项 */
  visible?: boolean;
  /** 是否禁用该功能项 */
  disabled?: boolean;
}

/**
 * 功能区块配置（控制显示/禁用）
 */
export interface FeatureBlockConfig extends FeatureItemConfig {
  /** 区块内的功能项配置 */
  items?: Record<string, FeatureItemConfig>;
}

/**
 * 外观设置 Tab 配置
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
 * 布局设置 Tab 配置
 */
export interface LayoutTabConfig extends FeatureItemConfig {
  /** 布局类型区块 */
  layoutType?: FeatureBlockConfig;
  /** 内容宽度区块 */
  contentWidth?: FeatureBlockConfig;
  /** 侧边栏区块 */
  sidebar?: FeatureBlockConfig & {
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
    items?: {
      /** 启用顶栏 */
      enable?: FeatureItemConfig;
      /** 顶栏模式 */
      mode?: FeatureItemConfig;
      /** 菜单启动器 */
      menuLauncher?: FeatureItemConfig;
    };
  };
  /** 标签栏区块 */
  tabbar?: FeatureBlockConfig & {
    items?: {
      /** 启用标签栏 */
      enable?: FeatureItemConfig;
      /** 显示图标 */
      showIcon?: FeatureItemConfig;
      /** 可拖拽排序 */
      draggable?: FeatureItemConfig;
      /** 标签样式 */
      styleType?: FeatureItemConfig;
    };
  };
  /** 面包屑区块 */
  breadcrumb?: FeatureBlockConfig & {
    items?: {
      /** 启用面包屑 */
      enable?: FeatureItemConfig;
      /** 显示图标 */
      showIcon?: FeatureItemConfig;
    };
  };
  /** 页脚区块 */
  footer?: FeatureBlockConfig & {
    items?: {
      /** 启用页脚 */
      enable?: FeatureItemConfig;
      /** 固定页脚 */
      fixed?: FeatureItemConfig;
    };
  };
  /** 小部件区块 */
  widget?: FeatureBlockConfig & {
    items?: {
      /** 全屏按钮 */
      fullscreen?: FeatureItemConfig;
      /** 主题切换 */
      themeToggle?: FeatureItemConfig;
      /** 语言切换 */
      languageToggle?: FeatureItemConfig;
    };
  };
}

/**
 * 通用设置 Tab 配置
 */
export interface GeneralTabConfig extends FeatureItemConfig {
  /** 语言区块 */
  language?: FeatureBlockConfig;
  /** 动态标题区块 */
  dynamicTitle?: FeatureBlockConfig;
  /** 锁屏区块 */
  lockScreen?: FeatureBlockConfig & {
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
 * 快捷键设置 Tab 配置
 */
export interface ShortcutKeysTabConfig extends FeatureItemConfig {
  /** 快捷键区块 */
  shortcuts?: FeatureBlockConfig & {
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
 * 顶部操作按钮配置
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
 * 底部操作按钮配置
 */
export interface FooterActionsConfig {
  /** 复制配置按钮 */
  copy?: FeatureItemConfig;
}

/**
 * 偏好设置抽屉完整配置
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
 * 获取功能项配置的辅助函数返回值
 */
export interface ResolvedFeatureConfig {
  /** 是否显示 */
  visible: boolean;
  /** 是否禁用 */
  disabled: boolean;
}
