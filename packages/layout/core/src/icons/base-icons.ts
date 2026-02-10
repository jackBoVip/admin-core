/**
 * 图标定义
 * @description 统一管理布局中使用的所有 SVG 图标路径
 */

export type SvgNode = {
  tag: 'mask' | 'rect' | 'circle' | 'g' | 'line';
  attrs?: Record<string, string>;
  children?: SvgNode[];
};

export interface IconDefinition {
  viewBox: string;
  path: string;
  /** 是否使用 fill 而非 stroke */
  fill?: boolean;
  /** 额外的 SVG 元素（如 rect） */
  extra?: string;
  /** 结构化 SVG 节点（用于安全渲染） */
  extraNodes?: SvgNode[];
  /** 视觉尺寸微调（以 24x24 画布为基准） */
  opticalScale?: number;
}

// ============================================================
// 动画类名常量
// ============================================================

/**
 * 动画类名配置
 */
export const ANIMATION_CLASSES = {
  /** 图标旋转动画 */
  iconRotate: 'transition-transform duration-300 ease-in-out',
  /** 快速旋转动画 */
  iconRotateFast: 'transition-transform duration-200 ease-in-out',
  /** 颜色过渡动画 */
  colorTransition: 'transition-colors duration-200',
  /** 透明度过渡动画 */
  opacityTransition: 'transition-opacity duration-200',
  /** 所有属性过渡 */
  allTransition: 'transition-all duration-200',
  /** 布局过渡（用于侧边栏宽度等） */
  layoutTransition: 'transition-all duration-layout-normal',
} as const;

/**
 * 旋转角度类名
 */
export const ROTATION_CLASSES = {
  rotate0: 'rotate-0',
  rotate90: 'rotate-90',
  rotate180: 'rotate-180',
  rotate270: '-rotate-90',
} as const;

// ============================================================
// 图标尺寸（统一 token）
// ============================================================

export const LAYOUT_ICON_SIZES = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-[1.125rem] w-[1.125rem]',
  lg: 'h-5 w-5',
  xl: 'h-6 w-6',
} as const;

export type LayoutIconSize = keyof typeof LAYOUT_ICON_SIZES;

export function resolveLayoutIconSize(size?: LayoutIconSize | string): string {
  if (!size) return LAYOUT_ICON_SIZES.md;
  return size in LAYOUT_ICON_SIZES ? LAYOUT_ICON_SIZES[size as LayoutIconSize] : size;
}

/**
 * 内置图标定义
 */
export const icons: Record<string, IconDefinition> = {
  // 导航相关
  'chevron-right': {
    viewBox: '0 0 24 24',
    path: 'M9 18l6-6-6-6',
  },
  'chevron-left': {
    viewBox: '0 0 24 24',
    path: 'M15 18l-6-6 6-6',
  },
  'chevrons-left': {
    viewBox: '0 0 24 24',
    path: 'M13 7l5 5-5 5M6 7l5 5-5 5',
  },
  'chevron-down': {
    viewBox: '0 0 24 24',
    path: 'M6 9l6 6 6-6',
  },
  'chevron-up': {
    viewBox: '0 0 24 24',
    path: 'M18 15l-6-6-6 6',
  },
  'chevrons-right': {
    viewBox: '0 0 24 24',
    path: 'M11 17l-5-5 5-5m7 10l-5-5 5-5',
  },

  // 菜单相关
  menu: {
    viewBox: '0 0 24 24',
    path: 'M4 6h16M4 12h16M4 18h16',
  },
  'menu-fold': {
    viewBox: '0 0 24 24',
    path: 'M4 6h16M4 12h10M4 18h16M15 12l4 4-4 4',
  },
  'menu-unfold': {
    viewBox: '0 0 24 24',
    path: 'M4 6h16M10 12h10M4 18h16M9 8l-4 4 4 4',
  },
  // 简洁折叠图标（不对称三横线，带箭头视觉效果）
  'indent-collapse': {
    viewBox: '0 0 24 24',
    path: 'M4 6h10M4 12h16M10 18h10',
  },
  'indent-expand': {
    viewBox: '0 0 24 24',
    path: 'M10 6h10M4 12h16M4 18h10',
  },

  // 操作相关
  close: {
    viewBox: '0 0 24 24',
    path: 'M18 6L6 18M6 6l12 12',
  },
  globe: {
    viewBox: '0 0 24 24',
    path: 'M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10',
    opticalScale: 0.99,
    extra: '<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>',
    extraNodes: [
      { tag: 'circle', attrs: { cx: '12', cy: '12', r: '10' } },
      { tag: 'line', attrs: { x1: '2', y1: '12', x2: '22', y2: '12' } },
    ],
  },
  refresh: {
    viewBox: '0 0 24 24',
    path: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  },
  maximize: {
    viewBox: '0 0 24 24',
    path: 'M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3',
    opticalScale: 1.08,
  },
  minimize: {
    viewBox: '0 0 24 24',
    path: 'M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3',
    opticalScale: 1.08,
  },
  // 图钉相关（用于固定/取消固定子菜单）- lucide 风格
  pin: {
    viewBox: '0 0 24 24',
    path: 'M12 17v5M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z',
  },
  'pin-off': {
    viewBox: '0 0 24 24',
    path: 'M2 2l20 20M12 17v5M9 9v1.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V17h12M15 9.34V6h1a2 2 0 0 0 0-4H7.89',
  },
  // 侧边栏折叠/展开图标（带面板的箭头）
  'sidebar-collapse': {
    viewBox: '0 0 24 24',
    path: 'M14 9l3 3-3 3',
    extra: '<rect x="3" y="3" width="7" height="18" rx="1" />',
    extraNodes: [
      { tag: 'rect', attrs: { x: '3', y: '3', width: '7', height: '18', rx: '1' } },
    ],
  },
  'sidebar-expand': {
    viewBox: '0 0 24 24',
    path: 'M17 9l-3 3 3 3',
    extra: '<rect x="14" y="3" width="7" height="18" rx="1" />',
    extraNodes: [
      { tag: 'rect', attrs: { x: '14', y: '3', width: '7', height: '18', rx: '1' } },
    ],
  },
  more: {
    viewBox: '0 0 24 24',
    path: 'M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z',
  },
  'more-horizontal': {
    viewBox: '0 0 24 24',
    path: 'M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z',
  },

  // 系统相关
  settings: {
    viewBox: '0 0 24 24',
    path: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    opticalScale: 1.2,
  },
  user: {
    viewBox: '0 0 24 24',
    path: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  },
  users: {
    viewBox: '0 0 24 24',
    path: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
  },
  lock: {
    viewBox: '0 0 24 24',
    path: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z',
  },
  logout: {
    viewBox: '0 0 24 24',
    path: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
  },
  search: {
    viewBox: '0 0 24 24',
    path: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
  },
  notification: {
    viewBox: '0 0 24 24',
    path: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9',
    opticalScale: 1.2,
  },

  // 主页/仪表盘
  home: {
    viewBox: '0 0 24 24',
    path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  },
  dashboard: {
    viewBox: '0 0 24 24',
    path: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
  },

  // 文档相关
  document: {
    viewBox: '0 0 24 24',
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  'search-item': {
    viewBox: '0 0 24 24',
    path: 'M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4M9 18c-4.51 2-5-2-7-2',
  },
  folder: {
    viewBox: '0 0 24 24',
    path: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z',
  },
  'folder-open': {
    viewBox: '0 0 24 24',
    path: 'M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z',
  },

  // 图表相关
  chart: {
    viewBox: '0 0 24 24',
    path: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  },
  'chart-line': {
    viewBox: '0 0 24 24',
    path: 'M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4v16',
  },
  'chart-pie': {
    viewBox: '0 0 24 24',
    path: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055zM20.488 9H15V3.512A9.025 9.025 0 0120.488 9z',
  },

  // 链接相关
  link: {
    viewBox: '0 0 24 24',
    path: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
  },
  'external-link': {
    viewBox: '0 0 24 24',
    path: 'M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14',
  },

  // 其他
  info: {
    viewBox: '0 0 24 24',
    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  warning: {
    viewBox: '0 0 24 24',
    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
  },
  error: {
    viewBox: '0 0 24 24',
    path: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  success: {
    viewBox: '0 0 24 24',
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  },
  component: {
    viewBox: '0 0 24 24',
    path: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
};

const THEME_TOGGLE_ICON: IconDefinition = {
  viewBox: '0 0 24 24',
  path: '',
  opticalScale: 0.98,
  extra: `
    <mask class="moon" id="moon-mask">
      <rect x="0" y="0" width="100%" height="100%" fill="white" />
      <circle cx="24" cy="10" r="6" fill="black" />
    </mask>
    <circle class="sun" cx="12" cy="12" r="6" mask="url(#moon-mask)" fill="currentColor" />
    <g class="sun-beams" stroke="currentColor">
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
  `,
  extraNodes: [
    {
      tag: 'mask',
      attrs: { class: 'moon', id: 'moon-mask' },
      children: [
        { tag: 'rect', attrs: { x: '0', y: '0', width: '100%', height: '100%', fill: 'white' } },
        { tag: 'circle', attrs: { cx: '24', cy: '10', r: '6', fill: 'black' } },
      ],
    },
    {
      tag: 'circle',
      attrs: { class: 'sun', cx: '12', cy: '12', r: '6', mask: 'url(#moon-mask)', fill: 'currentColor' },
    },
    {
      tag: 'g',
      attrs: { class: 'sun-beams', stroke: 'currentColor' },
      children: [
        { tag: 'line', attrs: { x1: '12', y1: '1', x2: '12', y2: '3' } },
        { tag: 'line', attrs: { x1: '12', y1: '21', x2: '12', y2: '23' } },
        { tag: 'line', attrs: { x1: '4.22', y1: '4.22', x2: '5.64', y2: '5.64' } },
        { tag: 'line', attrs: { x1: '18.36', y1: '18.36', x2: '19.78', y2: '19.78' } },
        { tag: 'line', attrs: { x1: '1', y1: '12', x2: '3', y2: '12' } },
        { tag: 'line', attrs: { x1: '21', y1: '12', x2: '23', y2: '12' } },
        { tag: 'line', attrs: { x1: '4.22', y1: '19.78', x2: '5.64', y2: '18.36' } },
        { tag: 'line', attrs: { x1: '18.36', y1: '5.64', x2: '19.78', y2: '4.22' } },
      ],
    },
  ],
};

/**
 * 获取图标定义
 */
export function getIconDefinition(name: string): IconDefinition | null {
  return icons[name] || null;
}

/** Emoji 检测正则表达式（缓存避免重复创建） */
const EMOJI_REGEX = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F600}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}]|[\u{231A}-\u{231B}]|[\u{25AA}-\u{25AB}]|[\u{25B6}]|[\u{25C0}]|[\u{25FB}-\u{25FE}]|[\u{2614}-\u{2615}]|[\u{2648}-\u{2653}]|[\u{267F}]|[\u{2693}]|[\u{26A1}]|[\u{26AA}-\u{26AB}]|[\u{26BD}-\u{26BE}]|[\u{26C4}-\u{26C5}]|[\u{26CE}]|[\u{26D4}]|[\u{26EA}]|[\u{26F2}-\u{26F3}]|[\u{26F5}]|[\u{26FA}]|[\u{26FD}]|[\u{2702}]|[\u{2705}]|[\u{2708}-\u{270D}]|[\u{270F}]|[\u{2712}]|[\u{2714}]|[\u{2716}]|[\u{271D}]|[\u{2721}]|[\u{2728}]|[\u{2733}-\u{2734}]|[\u{2744}]|[\u{2747}]|[\u{274C}]|[\u{274E}]|[\u{2753}-\u{2755}]|[\u{2757}]|[\u{2763}-\u{2764}]|[\u{2795}-\u{2797}]|[\u{27A1}]|[\u{27B0}]|[\u{27BF}]/u;

/**
 * 检查是否为 emoji
 */
export function isEmoji(str: string): boolean {
  return EMOJI_REGEX.test(str);
}

/**
 * 渲染图标的类型
 */
export type IconRenderType = 'svg' | 'emoji' | 'custom';

/**
 * 判断图标渲染类型
 */
export function getIconRenderType(icon: string): IconRenderType {
  if (isEmoji(icon)) return 'emoji';
  if (icons[icon]) return 'svg';
  return 'custom';
}

/**
 * 默认 SVG viewBox
 */
export const DEFAULT_SVG_VIEWBOX = '0 0 24 24';

/**
 * 获取图标 SVG 路径
 */
export function getIconPath(icon: string): string {
  const definition = icons[icon];
  return definition?.path || '';
}

/**
 * 获取图标 viewBox
 */
export function getIconViewBox(icon: string): string {
  const definition = icons[icon];
  return definition?.viewBox || DEFAULT_SVG_VIEWBOX;
}

/**
 * 获取图标额外元素
 */
export function getIconExtra(icon: string): string | undefined {
  const definition = icons[icon];
  return definition?.extra;
}

// ============================================================
// 通用图标解析（供 React/Vue 共用）
// ============================================================

export interface IconMeta {
  type: IconRenderType;
  def?: IconDefinition;
}

/**
 * 解析图标元信息
 * @description 统一处理 svg/emoji/custom 的判断逻辑
 */
export function resolveIconMeta(icon: string): IconMeta {
  const type = getIconRenderType(icon);
  if (type === 'svg') {
    return { type, def: getIconDefinition(icon) || undefined };
  }
  return { type };
}

const iconMetaCache = new Map<string, IconMeta>();

export function getIconMeta(icon: string | undefined): IconMeta | null {
  if (!icon) return null;
  const cached = iconMetaCache.get(icon);
  if (cached) return cached;
  const meta = resolveIconMeta(icon);
  iconMetaCache.set(icon, meta);
  return meta;
}

// ============================================================
// 布局图标配置
// ============================================================

/**
 * 布局图标配置
 * @description 统一定义布局中各位置使用的图标和样式
 */
export const LAYOUT_ICONS = {
  /** 侧边栏折叠按钮（使用简洁折叠图标） */
  sidebarCollapse: {
    icon: 'indent-collapse',
    iconCollapsed: 'indent-expand',
    className: 'h-5 w-5',
    animation: ANIMATION_CLASSES.iconRotate,
    rotateWhenCollapsed: false, // 使用不同图标而非旋转
  },
  /** 头部侧边栏切换按钮（使用简洁折叠图标） */
  headerSidebarToggle: {
    icon: 'indent-collapse',
    iconCollapsed: 'indent-expand',
    className: 'h-5 w-5',
    animation: ANIMATION_CLASSES.iconRotate,
    rotateWhenCollapsed: false, // 使用不同图标而非旋转
  },
  /** 菜单展开/折叠箭头 */
  menuArrow: {
    icon: 'chevron-right',
    className: 'h-4 w-4',
    animation: ANIMATION_CLASSES.iconRotateFast,
    rotateWhenExpanded: true,
    expandedRotation: 'rotate-90',
  },
  /** 固定按钮 */
  pin: {
    iconPinned: 'pin',
    iconUnpinned: 'pin-off',
    className: 'h-4 w-4',
    animation: ANIMATION_CLASSES.colorTransition,
  },
  /** 面板折叠按钮 */
  panelCollapse: {
    icon: 'chevrons-right',
    className: 'h-5 w-5',
    animation: ANIMATION_CLASSES.iconRotate,
    rotateWhenCollapsed: true,
  },
} as const;

/**
 * 获取图标 SVG 属性
 * @description 返回可直接用于 SVG 元素的属性对象
 */
export function getSvgIconProps(iconName: string, options?: {
  className?: string;
  isRotated?: boolean;
  animation?: boolean;
}): {
  viewBox: string;
  path: string;
  extra?: string;
  className: string;
} {
  const definition = icons[iconName];
  const baseClass = options?.className || 'h-5 w-5';
  const animationClass = options?.animation !== false ? ANIMATION_CLASSES.iconRotate : '';
  const rotateClass = options?.isRotated ? ROTATION_CLASSES.rotate180 : '';
  
  return {
    viewBox: definition?.viewBox || DEFAULT_SVG_VIEWBOX,
    path: definition?.path || '',
    extra: definition?.extra,
    className: (() => {
      const classes = [baseClass];
      if (animationClass) classes.push(animationClass);
      if (rotateClass) classes.push(rotateClass);
      return classes.join(' ');
    })(),
  };
}

// ============================================================
// Layout UI 图标（统一管理）
// ============================================================

export const LAYOUT_UI_ICONS = {
  // Tabbar
  'tabbar-scroll-left': icons['chevron-left'],
  'tabbar-scroll-right': icons['chevron-right'],
  'tabbar-pin': icons.pin,
  'tabbar-unpin': icons['pin-off'],
  'tabbar-close': icons.close,
  'tabbar-maximize': icons.maximize,
  'tabbar-restore': icons.minimize,
  'tabbar-more': icons['more-horizontal'],

  // Panel
  'panel-collapse': icons['chevron-left'],
  'panel-expand': icons['chevron-right'],
  'submenu-collapse': icons['chevrons-left'],
  'submenu-expand': icons['chevrons-right'],

  // Breadcrumb
  'breadcrumb-separator': icons['chevron-right'],
  home: icons.home,

  // Header / Widgets
  refresh: icons.refresh,
  search: icons.search,
  'search-item': icons['search-item'],
  notification: icons.notification,
  user: icons.user,
  settings: icons.settings,
  lock: icons.lock,
  logout: icons.logout,
  globe: icons.globe,
  fullscreen: icons.maximize,
  'fullscreen-exit': icons.minimize,
  'theme-sun': icons.sun,
  'theme-moon': icons.moon,
  'theme-system': icons.monitor,
  'theme-toggle': THEME_TOGGLE_ICON,
  'more-horizontal': icons['more-horizontal'],
  'menu-launcher': icons.menu,
  'sidebar-toggle': icons['indent-collapse'],
  'sidebar-toggle-collapsed': icons['indent-expand'],
  'sidebar-collapse': icons['indent-collapse'],
  'sidebar-expand': icons['indent-expand'],

  // Menu arrows
  'menu-arrow-right': icons['chevron-right'],
  'menu-arrow-down': icons['chevron-down'],
  'menu-arrow-left': icons['chevron-left'],

  // Status
  'status-success': icons.check,
  'status-warning': icons.alertTriangle,
  'status-error': icons.alertCircle,
  'status-info': icons.info,
} as const;

export type LayoutUiIconName = keyof typeof LAYOUT_UI_ICONS;

export function getLayoutUiIconDefinition(name: LayoutUiIconName): IconDefinition | null {
  return LAYOUT_UI_ICONS[name] || null;
}

export function getLayoutUiIconMeta(name: LayoutUiIconName): { type: 'svg'; def: IconDefinition } | null {
  const def = getLayoutUiIconDefinition(name);
  if (!def) return null;
  return { type: 'svg', def };
}

export function getLayoutUiIconSvg(name: LayoutUiIconName): string {
  const def = getLayoutUiIconDefinition(name);
  if (!def) return '';
  const fill = def.fill ? 'currentColor' : 'none';
  const stroke = def.fill ? 'none' : 'currentColor';
  const extra = def.extra ?? '';
  const path = def.path ? `<path d="${def.path}"/>` : '';
  const hasOpticalScale = typeof def.opticalScale === 'number' && def.opticalScale !== 1;
  const transform = hasOpticalScale
    ? `translate(12 12) scale(${def.opticalScale}) translate(-12 -12)`
    : '';
  const content = `${extra}${path}`;
  const wrapped = transform ? `<g transform="${transform}">${content}</g>` : content;
  return `<svg viewBox="${def.viewBox}" fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${wrapped}</svg>`;
}
