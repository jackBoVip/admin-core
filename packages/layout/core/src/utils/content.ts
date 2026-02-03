/**
 * 内容区工具函数
 * @module utils/content
 * @description 提取 Vue 和 React 共享的内容区样式计算逻辑
 */

/**
 * CSS 样式属性类型
 */
export type CSSProperties = Record<string, string | number | undefined>;

// ============================================================
// 1. 内容区样式计算
// ============================================================

/**
 * 内容区配置
 */
export interface ContentConfig {
  /** 是否紧凑模式 */
  compact?: boolean;
  /** 紧凑模式宽度 */
  compactWidth?: number;
  /** 内边距 */
  padding?: number;
  /** 顶部内边距 */
  paddingTop?: number;
  /** 底部内边距 */
  paddingBottom?: number;
  /** 左侧内边距 */
  paddingLeft?: number;
  /** 右侧内边距 */
  paddingRight?: number;
}

/**
 * 内容区布局状态
 */
export interface ContentLayoutState {
  /** 侧边栏是否折叠 */
  sidebarCollapsed: boolean;
  /** 是否显示面板 */
  showPanel: boolean;
  /** 面板位置 */
  panelPosition: 'left' | 'right';
  /** 面板是否折叠 */
  panelCollapsed: boolean;
  /** 是否移动端 */
  isMobile: boolean;
}

/**
 * 内容区尺寸
 */
export interface ContentDimensions {
  /** 侧边栏宽度 */
  sidebarWidth: number;
  /** 顶栏高度 */
  headerHeight: number;
  /** 标签栏高度 */
  tabbarHeight: number;
  /** 页脚高度 */
  footerHeight: number;
  /** 面板宽度 */
  panelWidth: number;
}

/**
 * 计算内容区类名
 */
export function computeContentClassName(
  config: ContentConfig,
  state: ContentLayoutState
): string {
  const classes = ['layout-content'];
  
  if (config.compact) {
    classes.push('layout-content--compact');
  }
  
  if (state.sidebarCollapsed) {
    classes.push('layout-content--collapsed');
  }
  
  if (state.showPanel) {
    classes.push('layout-content--with-panel');
    classes.push(`layout-content--panel-${state.panelPosition}`);
    
    if (state.panelCollapsed) {
      classes.push('layout-content--panel-collapsed');
    }
  }
  
  if (state.isMobile) {
    classes.push('layout-content--mobile');
  }
  
  return classes.join(' ');
}

/**
 * 计算内容区外层样式
 */
export function computeContentWrapperStyle(
  dimensions: ContentDimensions,
  state: ContentLayoutState
): CSSProperties {
  const { sidebarWidth, headerHeight, tabbarHeight, footerHeight, panelWidth } = dimensions;
  const { showPanel, panelPosition, panelCollapsed, isMobile } = state;
  
  const style: CSSProperties = {};
  
  // 左侧边距（侧边栏）
  if (!isMobile) {
    style.marginLeft = `${sidebarWidth}px`;
  }
  
  // 顶部边距（顶栏 + 标签栏）
  style.marginTop = `${headerHeight + tabbarHeight}px`;
  
  // 底部边距（页脚）
  if (footerHeight > 0) {
    style.marginBottom = `${footerHeight}px`;
  }
  
  // 面板边距
  if (showPanel && !panelCollapsed) {
    if (panelPosition === 'left') {
      style.marginLeft = `${(parseInt(String(style.marginLeft)) || 0) + panelWidth}px`;
    } else {
      style.marginRight = `${panelWidth}px`;
    }
  }
  
  return style;
}

/**
 * 计算内容容器样式
 */
export function computeContentContainerStyle(
  config: ContentConfig
): CSSProperties {
  const { 
    compact,
    compactWidth = 1200,
    padding = 16,
    paddingTop,
    paddingBottom,
    paddingLeft,
    paddingRight,
  } = config;
  
  const style: CSSProperties = {
    padding: `${paddingTop ?? padding}px ${paddingRight ?? padding}px ${paddingBottom ?? padding}px ${paddingLeft ?? padding}px`,
  };
  
  if (compact) {
    style.maxWidth = `${compactWidth}px`;
    style.marginLeft = 'auto';
    style.marginRight = 'auto';
  }
  
  return style;
}

// ============================================================
// 2. 面板样式计算
// ============================================================

/**
 * 面板配置
 */
export interface PanelConfig {
  /** 是否启用 */
  enable?: boolean;
  /** 位置 */
  position?: 'left' | 'right';
  /** 宽度 */
  width?: number;
  /** 折叠宽度 */
  collapsedWidth?: number;
  /** 显示折叠按钮 */
  collapsedButton?: boolean;
}

/**
 * 计算面板类名
 */
export function computePanelClassName(
  config: PanelConfig,
  collapsed: boolean
): string {
  const classes = ['layout-panel'];
  
  classes.push(`layout-panel--${config.position || 'right'}`);
  
  if (collapsed) {
    classes.push('layout-panel--collapsed');
  }
  
  return classes.join(' ');
}

/**
 * 计算面板样式
 */
export function computePanelStyle(
  config: PanelConfig,
  collapsed: boolean
): CSSProperties {
  const width = collapsed 
    ? (config.collapsedWidth || 48)
    : (config.width || 260);
  
  return {
    width: `${width}px`,
  };
}

// ============================================================
// 3. 页脚样式计算
// ============================================================

/**
 * 页脚配置
 */
export interface FooterConfig {
  /** 是否启用 */
  enable?: boolean;
  /** 是否固定 */
  fixed?: boolean;
  /** 高度 */
  height?: number;
}

/**
 * 计算页脚类名
 */
export function computeFooterClassName(
  config: FooterConfig,
  showSidebar: boolean,
  sidebarCollapsed: boolean
): string {
  const classes = ['layout-footer'];
  
  if (config.fixed) {
    classes.push('layout-footer--fixed');
  }
  
  if (showSidebar) {
    classes.push('layout-footer--with-sidebar');
    
    if (sidebarCollapsed) {
      classes.push('layout-footer--collapsed');
    }
  }
  
  return classes.join(' ');
}

/**
 * 计算页脚样式
 */
export function computeFooterStyle(
  config: FooterConfig,
  sidebarWidth: number
): CSSProperties {
  const style: CSSProperties = {};
  
  if (config.height) {
    style.height = `${config.height}px`;
  }
  
  if (config.fixed && sidebarWidth > 0) {
    style.marginLeft = `${sidebarWidth}px`;
  }
  
  return style;
}

// ============================================================
// 4. 版权信息渲染
// ============================================================

/**
 * 版权配置
 */
export interface CopyrightConfig {
  /** 公司名称 */
  companyName?: string;
  /** 公司链接 */
  companyLink?: string;
  /** 起始年份 */
  startYear?: number;
  /** 备案号 */
  icp?: string;
  /** 额外文本 */
  extraText?: string;
}

/**
 * 生成版权文本
 */
export function generateCopyrightText(config: CopyrightConfig): string {
  const currentYear = new Date().getFullYear();
  const { companyName, startYear } = config;
  
  let yearText = String(currentYear);
  if (startYear && startYear < currentYear) {
    yearText = `${startYear}-${currentYear}`;
  }
  
  const parts = [`© ${yearText}`];
  
  if (companyName) {
    parts.push(companyName);
  }
  
  return parts.join(' ');
}
