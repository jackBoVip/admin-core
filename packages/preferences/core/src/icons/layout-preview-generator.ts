/**
 * 动态布局预览图生成器
 * @description 根据偏好设置动态生成布局预览 SVG
 */

import type { LayoutType } from '../types';

/**
 * 预览图配置选项
 */
export interface LayoutPreviewOptions {
  // ========== 侧边栏 ==========
  /** 是否显示侧边栏 */
  showSidebar?: boolean;
  /** 侧边栏是否折叠 */
  sidebarCollapsed?: boolean;

  // ========== 顶栏 ==========
  /** 是否显示顶栏 */
  showHeader?: boolean;

  // ========== 标签栏 ==========
  /** 是否显示标签栏 */
  showTabbar?: boolean;

  // ========== 功能区 ==========
  /** 是否显示左侧功能区 */
  showLeftPanel?: boolean;
  /** 左侧功能区是否折叠 */
  leftPanelCollapsed?: boolean;
  /** 是否显示右侧功能区 */
  showRightPanel?: boolean;
  /** 右侧功能区是否折叠 */
  rightPanelCollapsed?: boolean;

  // ========== 页脚 ==========
  /** 是否显示页脚 */
  showFooter?: boolean;
}

/**
 * 预览图尺寸配置
 */
const PREVIEW_SIZE = {
  width: 80,
  height: 50,
  borderRadius: 3,
};

/**
 * 布局元素尺寸配置
 */
const ELEMENT_SIZES = {
  // 侧边栏
  sidebarWidth: 18,
  sidebarCollapsedWidth: 10,
  // 顶栏
  headerHeight: 10,
  // 标签栏
  tabbarHeight: 6,
  // 功能区
  panelWidth: 12,
  panelCollapsedWidth: 6,
  // 页脚
  footerHeight: 6,
  // 内边距
  padding: 2,
  gap: 2,
};

/**
 * 颜色配置
 */
const COLORS = {
  background: 'var(--muted)',
  surface: 'var(--background)',
  primary: 'hsl(var(--primary))',
  muted: 'var(--muted-foreground)',
  white: 'white',
};

/**
 * 生成矩形 SVG 元素
 */
function rect(
  x: number,
  y: number,
  width: number,
  height: number,
  fill: string,
  options?: {
    rx?: number;
    opacity?: number;
    comment?: string;
  }
): string {
  const { rx = 0, opacity, comment } = options || {};
  const opacityAttr = opacity !== undefined ? ` fill-opacity="${opacity}"` : '';
  const rxAttr = rx > 0 ? ` rx="${rx}"` : '';
  const commentStr = comment ? `<!-- ${comment} -->\n    ` : '';
  return `${commentStr}<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}"${rxAttr}${opacityAttr}/>`;
}

/**
 * 生成圆形 SVG 元素
 */
function circle(
  cx: number,
  cy: number,
  r: number,
  fill: string,
  opacity?: number
): string {
  const opacityAttr = opacity !== undefined ? ` fill-opacity="${opacity}"` : '';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}"${opacityAttr}/>`;
}

/**
 * 生成菜单项
 */
function menuItems(
  x: number,
  startY: number,
  width: number,
  fill: string,
  count: number = 4
): string {
  const items: string[] = [];
  const opacities = [0.5, 0.8, 0.5, 0.5];
  for (let i = 0; i < count; i++) {
    items.push(
      rect(x, startY + i * 6, width, 2, fill, {
        rx: 1,
        opacity: opacities[i] || 0.5,
      })
    );
  }
  return items.join('\n    ');
}

/**
 * 生成工具栏图标
 */
function toolbarIcons(
  endX: number,
  y: number,
  fill: string,
  count: number = 3
): string {
  const icons: string[] = [];
  for (let i = 0; i < count; i++) {
    icons.push(circle(endX - (count - 1 - i) * 7, y, 2, fill, 0.4));
  }
  return icons.join('\n    ');
}

/**
 * 生成功能区图标
 */
function panelIcons(
  x: number,
  startY: number,
  width: number,
  fill: string,
  count: number = 4
): string {
  const icons: string[] = [];
  const iconSize = Math.min(width - 2, 4);
  const iconX = x + (width - iconSize) / 2;
  for (let i = 0; i < count; i++) {
    icons.push(
      rect(iconX, startY + i * 8, iconSize, iconSize, fill, {
        rx: 1,
        opacity: i === 1 ? 0.8 : 0.5,
      })
    );
  }
  return icons.join('\n    ');
}

/**
 * 动态生成布局预览图
 * @param layout - 布局类型
 * @param options - 配置选项
 * @returns SVG 字符串
 */
export function generateLayoutPreview(
  layout: LayoutType,
  options: LayoutPreviewOptions = {}
): string {
  const { width, height, borderRadius } = PREVIEW_SIZE;
  const elements: string[] = [];

  // 背景
  elements.push(
    rect(0, 0, width, height, COLORS.background, {
      rx: borderRadius,
      comment: '背景',
    })
  );

  // 根据布局类型生成不同的结构
  switch (layout) {
    case 'sidebar-nav':
      elements.push(
        generateSidebarNavLayout(options)
      );
      break;
    case 'sidebar-mixed-nav':
      elements.push(
        generateSidebarMixedNavLayout(options)
      );
      break;
    case 'header-nav':
      elements.push(
        generateHeaderNavLayout(options)
      );
      break;
    case 'header-sidebar-nav':
      elements.push(
        generateHeaderSidebarNavLayout(options)
      );
      break;
    case 'mixed-nav':
      elements.push(
        generateMixedNavLayout(options)
      );
      break;
    case 'header-mixed-nav':
      elements.push(
        generateHeaderMixedNavLayout(options)
      );
      break;
    case 'full-content':
      elements.push(
        generateFullContentLayout(options)
      );
      break;
    default:
      elements.push(
        generateSidebarNavLayout(options)
      );
  }

  return `<svg viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${elements.join('\n    ')}
  </svg>`;
}

/**
 * 生成侧边导航布局
 */
function generateSidebarNavLayout(options: LayoutPreviewOptions): string {
  const {
    showSidebar = true,
    sidebarCollapsed = false,
    showHeader = true,
    showTabbar = false,
    showLeftPanel = false,
    leftPanelCollapsed = false,
    showRightPanel = false,
    rightPanelCollapsed = false,
    showFooter = false,
  } = options;

  const elements: string[] = [];
  let contentX = 2;
  let contentY = 2;
  let contentWidth = 76;
  let contentHeight = 46;

  // 侧边栏
  if (showSidebar) {
    const sidebarW = sidebarCollapsed
      ? ELEMENT_SIZES.sidebarCollapsedWidth
      : ELEMENT_SIZES.sidebarWidth;
    
    elements.push(
      rect(0, 0, sidebarW, 50, COLORS.primary, { rx: 3, comment: '侧边栏' })
    );
    
    // Logo
    const logoW = sidebarCollapsed ? 6 : 8;
    const logoX = sidebarCollapsed ? 2 : 5;
    elements.push(
      rect(logoX, 4, logoW, 4, COLORS.white, { rx: 1, opacity: 0.9 })
    );
    
    // 菜单项
    if (!sidebarCollapsed) {
      elements.push(menuItems(3, 14, 12, COLORS.white));
    } else {
      // 折叠时显示图标
      elements.push(panelIcons(1, 14, 8, COLORS.white));
    }
    
    contentX = sidebarW + 2;
    contentWidth = 78 - sidebarW;
  }

  // 左侧功能区
  if (showLeftPanel) {
    const panelW = leftPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    elements.push(
      rect(contentX, 0, panelW, 50, COLORS.surface, { comment: '左功能区' })
    );
    elements.push(panelIcons(contentX, 12, panelW, COLORS.muted));
    
    contentX += panelW + 2;
    contentWidth -= panelW + 2;
  }

  // 右侧功能区
  if (showRightPanel) {
    const panelW = rightPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    const panelX = 80 - panelW;
    elements.push(
      rect(panelX, 0, panelW, 50, COLORS.surface, { comment: '右功能区' })
    );
    elements.push(panelIcons(panelX, 12, panelW, COLORS.muted));
    
    contentWidth -= panelW + 2;
  }

  // 顶栏
  if (showHeader) {
    elements.push(
      rect(contentX, 2, contentWidth, 8, COLORS.surface, { rx: 2, comment: '顶栏' })
    );
    // 工具栏图标
    elements.push(toolbarIcons(contentX + contentWidth - 4, 6, COLORS.muted));
    
    contentY = 12;
    contentHeight -= 10;
  }

  // 标签栏
  if (showTabbar) {
    elements.push(
      rect(contentX, contentY, contentWidth, ELEMENT_SIZES.tabbarHeight, COLORS.surface, {
        rx: 1,
        comment: '标签栏',
      })
    );
    // 标签项
    elements.push(rect(contentX + 2, contentY + 2, 16, 2, COLORS.muted, { rx: 1, opacity: 0.5 }));
    elements.push(rect(contentX + 20, contentY + 2, 12, 2, COLORS.muted, { rx: 1, opacity: 0.3 }));
    elements.push(rect(contentX + 34, contentY + 2, 12, 2, COLORS.muted, { rx: 1, opacity: 0.3 }));
    
    contentY += ELEMENT_SIZES.tabbarHeight + 2;
    contentHeight -= ELEMENT_SIZES.tabbarHeight + 2;
  }

  // 页脚
  if (showFooter) {
    const footerY = 50 - ELEMENT_SIZES.footerHeight - 2;
    elements.push(
      rect(contentX, footerY, contentWidth, ELEMENT_SIZES.footerHeight, COLORS.surface, {
        rx: 1,
        comment: '页脚',
      })
    );
    contentHeight -= ELEMENT_SIZES.footerHeight + 2;
  }

  // 内容区
  const remainingHeight = contentHeight;
  const row1Height = Math.floor(remainingHeight * 0.4);
  const row2Height = remainingHeight - row1Height - 2;

  elements.push(
    rect(contentX, contentY, contentWidth * 0.45, row1Height, COLORS.surface, {
      rx: 2,
      comment: '内容区',
    })
  );
  elements.push(
    rect(
      contentX + contentWidth * 0.47,
      contentY,
      contentWidth * 0.53,
      row1Height,
      COLORS.surface,
      { rx: 2 }
    )
  );
  elements.push(
    rect(contentX, contentY + row1Height + 2, contentWidth, row2Height, COLORS.surface, {
      rx: 2,
    })
  );

  return elements.join('\n    ');
}

/**
 * 生成顶部导航布局
 */
function generateHeaderNavLayout(options: LayoutPreviewOptions): string {
  const {
    showHeader = true,
    showTabbar = false,
    showLeftPanel = false,
    leftPanelCollapsed = false,
    showRightPanel = false,
    rightPanelCollapsed = false,
    showFooter = false,
  } = options;

  const elements: string[] = [];
  let contentX = 2;
  let contentY = 2;
  let contentWidth = 76;
  let contentHeight = 46;

  // 顶栏（主题色）
  if (showHeader) {
    elements.push(
      rect(0, 0, 80, 10, COLORS.primary, { rx: 3, comment: '顶栏' })
    );
    // Logo
    elements.push(rect(4, 2, 8, 6, COLORS.white, { rx: 1.5, opacity: 0.9 }));
    // 菜单项
    elements.push(rect(16, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.5 }));
    elements.push(rect(28, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.8 }));
    elements.push(rect(40, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.5 }));
    elements.push(rect(52, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.5 }));
    // 工具栏
    elements.push(circle(68, 5, 2, COLORS.white, 0.6));
    elements.push(circle(75, 5, 2, COLORS.white, 0.6));
    
    contentY = 12;
    contentHeight = 36;
  }

  // 左侧功能区
  if (showLeftPanel) {
    const panelW = leftPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    elements.push(
      rect(0, contentY - 2, panelW, 50 - contentY + 2, COLORS.surface, { comment: '左功能区' })
    );
    elements.push(panelIcons(0, contentY + 2, panelW, COLORS.muted));
    
    contentX = panelW + 2;
    contentWidth = 78 - panelW;
  }

  // 右侧功能区
  if (showRightPanel) {
    const panelW = rightPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    const panelX = 80 - panelW;
    elements.push(
      rect(panelX, contentY - 2, panelW, 50 - contentY + 2, COLORS.surface, { comment: '右功能区' })
    );
    elements.push(panelIcons(panelX, contentY + 2, panelW, COLORS.muted));
    
    contentWidth -= panelW + 2;
  }

  // 标签栏
  if (showTabbar) {
    elements.push(
      rect(contentX, contentY, contentWidth, ELEMENT_SIZES.tabbarHeight, COLORS.surface, {
        rx: 1,
        comment: '标签栏',
      })
    );
    elements.push(rect(contentX + 2, contentY + 2, 16, 2, COLORS.muted, { rx: 1, opacity: 0.5 }));
    elements.push(rect(contentX + 20, contentY + 2, 12, 2, COLORS.muted, { rx: 1, opacity: 0.3 }));
    
    contentY += ELEMENT_SIZES.tabbarHeight + 2;
    contentHeight -= ELEMENT_SIZES.tabbarHeight + 2;
  }

  // 页脚
  if (showFooter) {
    const footerY = 50 - ELEMENT_SIZES.footerHeight - 2;
    elements.push(
      rect(contentX, footerY, contentWidth, ELEMENT_SIZES.footerHeight, COLORS.surface, {
        rx: 1,
        comment: '页脚',
      })
    );
    contentHeight -= ELEMENT_SIZES.footerHeight + 2;
  }

  // 内容区
  const remainingHeight = contentHeight;
  const row1Height = Math.floor(remainingHeight * 0.45);
  const row2Height = remainingHeight - row1Height - 2;

  elements.push(
    rect(contentX, contentY, contentWidth * 0.47, row1Height, COLORS.surface, {
      rx: 2,
      comment: '内容区',
    })
  );
  elements.push(
    rect(
      contentX + contentWidth * 0.49,
      contentY,
      contentWidth * 0.51,
      row1Height,
      COLORS.surface,
      { rx: 2 }
    )
  );
  elements.push(
    rect(contentX, contentY + row1Height + 2, contentWidth, row2Height, COLORS.surface, {
      rx: 2,
    })
  );

  return elements.join('\n    ');
}

/**
 * 生成侧边混合导航布局
 */
function generateSidebarMixedNavLayout(options: LayoutPreviewOptions): string {
  const {
    showSidebar = true,
    sidebarCollapsed = false,
    showHeader = true,
    showTabbar = false,
    showLeftPanel = false,
    leftPanelCollapsed = false,
    showRightPanel = false,
    rightPanelCollapsed = false,
    showFooter = false,
  } = options;

  const elements: string[] = [];
  let contentX = 2;
  let contentY = 2;
  let contentWidth = 76;
  let contentHeight = 46;

  // 一级侧边栏（始终显示）
  if (showSidebar) {
    elements.push(
      rect(0, 0, 10, 50, COLORS.primary, { rx: 3, comment: '一级侧边栏' })
    );
    // Logo
    elements.push(rect(2, 3, 6, 6, COLORS.white, { rx: 1.5, opacity: 0.9 }));
    // 图标菜单
    elements.push(rect(2, 13, 6, 4, COLORS.white, { rx: 1, opacity: 0.5 }));
    elements.push(rect(2, 20, 6, 4, COLORS.white, { rx: 1, opacity: 0.8 }));
    elements.push(rect(2, 27, 6, 4, COLORS.white, { rx: 1, opacity: 0.5 }));
    elements.push(rect(2, 34, 6, 4, COLORS.white, { rx: 1, opacity: 0.5 }));

    // 二级侧边栏（可折叠）
    if (!sidebarCollapsed) {
      elements.push(
        rect(10, 0, 14, 50, COLORS.surface, { comment: '二级侧边栏' })
      );
      elements.push(rect(12, 14, 10, 2, COLORS.muted, { rx: 1, opacity: 0.3 }));
      elements.push(rect(12, 20, 10, 2, COLORS.muted, { rx: 1, opacity: 0.5 }));
      elements.push(rect(12, 26, 10, 2, COLORS.muted, { rx: 1, opacity: 0.3 }));
      contentX = 26;
      contentWidth = 52;
    } else {
      contentX = 12;
      contentWidth = 66;
    }
  }

  // 左侧功能区（在二级侧边栏之后）
  if (showLeftPanel) {
    const panelW = leftPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    elements.push(
      rect(contentX, 0, panelW, 50, COLORS.surface, { comment: '左功能区' })
    );
    elements.push(panelIcons(contentX, 12, panelW, COLORS.muted));
    
    contentX += panelW + 2;
    contentWidth -= panelW + 2;
  }

  // 右侧功能区
  if (showRightPanel) {
    const panelW = rightPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    const panelX = 80 - panelW;
    elements.push(
      rect(panelX, 0, panelW, 50, COLORS.surface, { comment: '右功能区' })
    );
    elements.push(panelIcons(panelX, 12, panelW, COLORS.muted));
    
    contentWidth -= panelW + 2;
  }

  // 顶栏
  if (showHeader) {
    elements.push(
      rect(contentX, 2, contentWidth, 8, COLORS.surface, { rx: 2, comment: '顶栏' })
    );
    elements.push(toolbarIcons(contentX + contentWidth - 4, 6, COLORS.muted));
    
    contentY = 12;
    contentHeight = 36;
  }

  // 标签栏
  if (showTabbar) {
    elements.push(
      rect(contentX, contentY, contentWidth, ELEMENT_SIZES.tabbarHeight, COLORS.surface, {
        rx: 1,
        comment: '标签栏',
      })
    );
    
    contentY += ELEMENT_SIZES.tabbarHeight + 2;
    contentHeight -= ELEMENT_SIZES.tabbarHeight + 2;
  }

  // 页脚
  if (showFooter) {
    contentHeight -= ELEMENT_SIZES.footerHeight + 2;
  }

  // 内容区
  const remainingHeight = contentHeight;
  const row1Height = Math.floor(remainingHeight * 0.45);
  const row2Height = remainingHeight - row1Height - 2;

  elements.push(
    rect(contentX, contentY, contentWidth * 0.45, row1Height, COLORS.surface, {
      rx: 2,
      comment: '内容区',
    })
  );
  elements.push(
    rect(
      contentX + contentWidth * 0.47,
      contentY,
      contentWidth * 0.53,
      row1Height,
      COLORS.surface,
      { rx: 2 }
    )
  );
  elements.push(
    rect(contentX, contentY + row1Height + 2, contentWidth, row2Height, COLORS.surface, {
      rx: 2,
    })
  );

  return elements.join('\n    ');
}

/**
 * 生成顶部通栏布局
 */
function generateHeaderSidebarNavLayout(options: LayoutPreviewOptions): string {
  // 复用 sidebar-nav 的逻辑，但顶栏在侧边栏上方
  const {
    showSidebar = true,
    sidebarCollapsed = false,
    showHeader = true,
    showTabbar = false,
    showLeftPanel = false,
    leftPanelCollapsed = false,
    showRightPanel = false,
    rightPanelCollapsed = false,
    showFooter = false,
  } = options;

  const elements: string[] = [];
  let contentX = 2;
  let contentY = 12;
  let contentWidth = 76;
  let contentHeight = 36;

  // 顶栏（浅色通栏）
  if (showHeader) {
    elements.push(
      rect(0, 0, 80, 10, COLORS.surface, { rx: 3, comment: '顶栏' })
    );
    // Logo
    elements.push(rect(4, 2, 8, 6, COLORS.primary, { rx: 1.5 }));
    // 菜单项
    elements.push(rect(16, 4, 8, 2, COLORS.muted, { rx: 1, opacity: 0.4 }));
    elements.push(rect(28, 4, 8, 2, COLORS.muted, { rx: 1, opacity: 0.6 }));
    elements.push(rect(40, 4, 8, 2, COLORS.muted, { rx: 1, opacity: 0.4 }));
    // 工具栏
    elements.push(circle(68, 5, 2, COLORS.muted, 0.4));
    elements.push(circle(75, 5, 2, COLORS.muted, 0.4));
  }

  // 侧边栏
  if (showSidebar) {
    const sidebarW = sidebarCollapsed
      ? ELEMENT_SIZES.sidebarCollapsedWidth
      : ELEMENT_SIZES.sidebarWidth;
    
    elements.push(
      rect(0, 10, sidebarW, 40, COLORS.primary, { comment: '侧边栏' })
    );
    
    if (!sidebarCollapsed) {
      elements.push(menuItems(3, 14, 12, COLORS.white));
    } else {
      elements.push(panelIcons(1, 14, 8, COLORS.white));
    }
    
    contentX = sidebarW + 2;
    contentWidth = 78 - sidebarW;
  }

  // 左侧功能区（在侧边栏之后）
  if (showLeftPanel) {
    const panelW = leftPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    elements.push(
      rect(contentX, 10, panelW, 40, COLORS.surface, { comment: '左功能区' })
    );
    elements.push(panelIcons(contentX, 14, panelW, COLORS.muted));
    
    contentX += panelW + 2;
    contentWidth -= panelW + 2;
  }

  // 右侧功能区
  if (showRightPanel) {
    const panelW = rightPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    const panelX = 80 - panelW;
    elements.push(
      rect(panelX, 10, panelW, 40, COLORS.surface, { comment: '右功能区' })
    );
    elements.push(panelIcons(panelX, 14, panelW, COLORS.muted));
    
    contentWidth -= panelW + 2;
  }

  // 标签栏
  if (showTabbar) {
    elements.push(
      rect(contentX, contentY, contentWidth, ELEMENT_SIZES.tabbarHeight, COLORS.surface, {
        rx: 1,
      })
    );
    
    contentY += ELEMENT_SIZES.tabbarHeight + 2;
    contentHeight -= ELEMENT_SIZES.tabbarHeight + 2;
  }

  // 页脚
  if (showFooter) {
    contentHeight -= ELEMENT_SIZES.footerHeight + 2;
  }

  // 内容区
  const remainingHeight = contentHeight;
  const row1Height = Math.floor(remainingHeight * 0.45);
  const row2Height = remainingHeight - row1Height - 2;

  elements.push(
    rect(contentX, contentY, contentWidth * 0.45, row1Height, COLORS.surface, { rx: 2 })
  );
  elements.push(
    rect(
      contentX + contentWidth * 0.47,
      contentY,
      contentWidth * 0.53,
      row1Height,
      COLORS.surface,
      { rx: 2 }
    )
  );
  elements.push(
    rect(contentX, contentY + row1Height + 2, contentWidth, row2Height, COLORS.surface, {
      rx: 2,
    })
  );

  return elements.join('\n    ');
}

/**
 * 生成混合导航布局
 */
function generateMixedNavLayout(options: LayoutPreviewOptions): string {
  const {
    showSidebar = true,
    sidebarCollapsed = false,
    showHeader = true,
    showTabbar = false,
    showLeftPanel = false,
    leftPanelCollapsed = false,
    showRightPanel = false,
    rightPanelCollapsed = false,
    showFooter = false,
  } = options;

  const elements: string[] = [];
  let contentX = 2;
  let contentY = 12;
  let contentWidth = 76;
  let contentHeight = 36;

  // 顶栏（主题色）
  if (showHeader) {
    elements.push(
      rect(0, 0, 80, 10, COLORS.primary, { rx: 3, comment: '顶栏' })
    );
    // Logo
    elements.push(rect(4, 2, 8, 6, COLORS.white, { rx: 1.5, opacity: 0.9 }));
    // 一级菜单
    elements.push(rect(16, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.5 }));
    elements.push(rect(28, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.8 }));
    elements.push(rect(40, 4, 8, 2, COLORS.white, { rx: 1, opacity: 0.5 }));
    // 工具栏
    elements.push(circle(68, 5, 2, COLORS.white, 0.6));
    elements.push(circle(75, 5, 2, COLORS.white, 0.6));
  }

  // 二级侧边栏（浅色）
  if (showSidebar) {
    const sidebarW = sidebarCollapsed
      ? ELEMENT_SIZES.sidebarCollapsedWidth
      : ELEMENT_SIZES.sidebarWidth;
    
    elements.push(
      rect(0, 10, sidebarW, 40, COLORS.surface, { comment: '二级侧边栏' })
    );
    
    if (!sidebarCollapsed) {
      elements.push(rect(3, 14, 12, 2, COLORS.muted, { rx: 1, opacity: 0.4 }));
      elements.push(rect(3, 20, 12, 2, COLORS.muted, { rx: 1, opacity: 0.6 }));
      elements.push(rect(3, 26, 12, 2, COLORS.muted, { rx: 1, opacity: 0.4 }));
      elements.push(rect(3, 32, 12, 2, COLORS.muted, { rx: 1, opacity: 0.4 }));
    } else {
      elements.push(panelIcons(1, 14, 8, COLORS.muted));
    }
    
    contentX = sidebarW + 2;
    contentWidth = 78 - sidebarW;
  }

  // 左侧功能区（在侧边栏之后）
  if (showLeftPanel) {
    const panelW = leftPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    elements.push(
      rect(contentX, 10, panelW, 40, COLORS.surface, { comment: '左功能区' })
    );
    elements.push(panelIcons(contentX, 14, panelW, COLORS.muted));
    
    contentX += panelW + 2;
    contentWidth -= panelW + 2;
  }

  // 右侧功能区
  if (showRightPanel) {
    const panelW = rightPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    const panelX = 80 - panelW;
    elements.push(
      rect(panelX, 10, panelW, 40, COLORS.surface, { comment: '右功能区' })
    );
    elements.push(panelIcons(panelX, 14, panelW, COLORS.muted));
    
    contentWidth -= panelW + 2;
  }

  // 标签栏
  if (showTabbar) {
    elements.push(
      rect(contentX, contentY, contentWidth, ELEMENT_SIZES.tabbarHeight, COLORS.surface, {
        rx: 1,
      })
    );
    
    contentY += ELEMENT_SIZES.tabbarHeight + 2;
    contentHeight -= ELEMENT_SIZES.tabbarHeight + 2;
  }

  // 页脚
  if (showFooter) {
    contentHeight -= ELEMENT_SIZES.footerHeight + 2;
  }

  // 内容区
  const remainingHeight = contentHeight;
  const row1Height = Math.floor(remainingHeight * 0.45);
  const row2Height = remainingHeight - row1Height - 2;

  elements.push(
    rect(contentX, contentY, contentWidth * 0.45, row1Height, COLORS.surface, { rx: 2 })
  );
  elements.push(
    rect(
      contentX + contentWidth * 0.47,
      contentY,
      contentWidth * 0.53,
      row1Height,
      COLORS.surface,
      { rx: 2 }
    )
  );
  elements.push(
    rect(contentX, contentY + row1Height + 2, contentWidth, row2Height, COLORS.surface, {
      rx: 2,
    })
  );

  return elements.join('\n    ');
}

/**
 * 生成顶部混合导航布局
 */
function generateHeaderMixedNavLayout(options: LayoutPreviewOptions): string {
  // 与 header-sidebar-nav 类似
  return generateHeaderSidebarNavLayout(options);
}

/**
 * 生成全屏内容布局
 */
function generateFullContentLayout(options: LayoutPreviewOptions): string {
  const {
    showLeftPanel = false,
    leftPanelCollapsed = false,
    showRightPanel = false,
    rightPanelCollapsed = false,
  } = options;

  const elements: string[] = [];
  let contentX = 2;
  let contentWidth = 76;

  // 左侧功能区
  if (showLeftPanel) {
    const panelW = leftPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    elements.push(
      rect(0, 0, panelW, 50, COLORS.surface, { comment: '左功能区' })
    );
    elements.push(panelIcons(0, 6, panelW, COLORS.muted));
    
    contentX = panelW + 2;
    contentWidth = 78 - panelW;
  }

  // 右侧功能区
  if (showRightPanel) {
    const panelW = rightPanelCollapsed
      ? ELEMENT_SIZES.panelCollapsedWidth
      : ELEMENT_SIZES.panelWidth;
    
    const panelX = 80 - panelW;
    elements.push(
      rect(panelX, 0, panelW, 50, COLORS.surface, { comment: '右功能区' })
    );
    elements.push(panelIcons(panelX, 6, panelW, COLORS.muted));
    
    contentWidth -= panelW + 2;
  }

  // 全屏内容区
  elements.push(
    rect(contentX, 2, contentWidth, 46, COLORS.surface, { rx: 2, comment: '内容区' })
  );
  
  // 内容占位
  elements.push(rect(contentX + 4, 6, 30, 4, COLORS.muted, { rx: 1, opacity: 0.2 }));
  elements.push(rect(contentX + 4, 14, contentWidth - 8, 12, COLORS.background, { rx: 2, opacity: 0.5 }));
  elements.push(rect(contentX + 4, 30, (contentWidth - 10) / 2, 14, COLORS.background, { rx: 2, opacity: 0.5 }));
  elements.push(rect(contentX + 6 + (contentWidth - 10) / 2, 30, (contentWidth - 10) / 2, 14, COLORS.background, { rx: 2, opacity: 0.5 }));

  return elements.join('\n    ');
}

/**
 * 默认配置
 */
export const DEFAULT_PREVIEW_OPTIONS: LayoutPreviewOptions = {
  showSidebar: true,
  sidebarCollapsed: false,
  showHeader: true,
  showTabbar: false,
  showLeftPanel: false,
  leftPanelCollapsed: false,
  showRightPanel: false,
  rightPanelCollapsed: false,
  showFooter: false,
};

/**
 * 偏好设置对象（简化类型，避免循环依赖）
 */
interface PreferencesLike {
  app?: {
    layout?: LayoutType;
  };
  sidebar?: {
    enable?: boolean;
    collapsed?: boolean;
  };
  header?: {
    enable?: boolean;
  };
  tabbar?: {
    enable?: boolean;
  };
  footer?: {
    enable?: boolean;
  };
  // 未来扩展：功能区配置
  leftPanel?: {
    enable?: boolean;
    collapsed?: boolean;
  };
  rightPanel?: {
    enable?: boolean;
    collapsed?: boolean;
  };
}

/**
 * 从偏好设置对象提取预览图配置
 * @param preferences - 偏好设置对象
 * @returns 预览图配置
 */
export function extractPreviewOptions(
  preferences: PreferencesLike
): LayoutPreviewOptions {
  return {
    showSidebar: preferences.sidebar?.enable ?? true,
    sidebarCollapsed: preferences.sidebar?.collapsed ?? false,
    showHeader: preferences.header?.enable ?? true,
    showTabbar: preferences.tabbar?.enable ?? false,
    showFooter: preferences.footer?.enable ?? false,
    showLeftPanel: preferences.leftPanel?.enable ?? false,
    leftPanelCollapsed: preferences.leftPanel?.collapsed ?? false,
    showRightPanel: preferences.rightPanel?.enable ?? false,
    rightPanelCollapsed: preferences.rightPanel?.collapsed ?? false,
  };
}

/**
 * 根据偏好设置生成布局预览图
 * @param preferences - 偏好设置对象
 * @returns SVG 字符串
 */
export function generatePreviewFromPreferences(
  preferences: PreferencesLike
): string {
  const layout = preferences.app?.layout ?? 'sidebar-nav';
  const options = extractPreviewOptions(preferences);
  return generateLayoutPreview(layout, options);
}

/**
 * 生成带有特定选项覆盖的预览图
 * @param layout - 布局类型
 * @param preferences - 偏好设置对象
 * @param overrides - 覆盖选项
 * @returns SVG 字符串
 */
export function generatePreviewWithOverrides(
  layout: LayoutType,
  preferences: PreferencesLike,
  overrides: Partial<LayoutPreviewOptions> = {}
): string {
  const baseOptions = extractPreviewOptions(preferences);
  const finalOptions = { ...baseOptions, ...overrides };
  return generateLayoutPreview(layout, finalOptions);
}
