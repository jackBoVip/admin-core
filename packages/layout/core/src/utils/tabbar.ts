/**
 * 标签栏工具函数
 * @module utils/tabbar
 * @description 提取 Vue 和 React 共享的标签栏逻辑
 */

import type { TabItem } from '../types';

// ============================================================
// 1. 拖拽排序相关
// ============================================================

/**
 * 拖拽状态
 */
export interface DragState {
  /** 是否正在拖拽 */
  isDragging: boolean;
  /** 拖拽起始索引 */
  dragIndex: number;
  /** 当前悬停索引 */
  hoverIndex: number;
}

/**
 * 创建初始拖拽状态
 */
export function createInitialDragState(): DragState {
  return {
    isDragging: false,
    dragIndex: -1,
    hoverIndex: -1,
  };
}

/**
 * 计算拖拽后的新位置
 * @param fromIndex 原始索引
 * @param toIndex 目标索引
 * @param tabs 标签列表
 * @returns 重新排序后的标签列表
 */
export function reorderTabs<T extends TabItem>(
  fromIndex: number,
  toIndex: number,
  tabs: T[]
): T[] {
  if (fromIndex === toIndex) return tabs;
  
  const result = [...tabs];
  const [removed] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, removed);
  return result;
}

/**
 * 检查标签是否可拖拽
 * @param tab 标签项
 * @param draggable 是否启用拖拽
 */
export function isTabDraggable(tab: TabItem, draggable: boolean): boolean {
  return draggable && !tab.affix;
}

// ============================================================
// 2. 滚轮切换相关
// ============================================================

/**
 * 滚轮切换配置
 */
export interface WheelSwitchConfig {
  /** 是否启用滚轮切换 */
  wheelable: boolean;
  /** 标签列表 */
  tabs: TabItem[];
  /** 当前激活的标签 key */
  activeKey: string;
}

/**
 * 计算滚轮切换后的标签 key
 * @param config 配置
 * @param deltaY 滚轮方向 (正数向下，负数向上)
 * @returns 新的激活标签 key，如果无需切换则返回 null
 */
export function computeWheelSwitchKey(
  config: WheelSwitchConfig,
  deltaY: number
): string | null {
  const { wheelable, tabs, activeKey } = config;
  
  if (!wheelable || tabs.length <= 1) return null;
  
  const currentIndex = tabs.findIndex(t => t.key === activeKey);
  if (currentIndex === -1) return null;
  
  let newIndex: number;
  if (deltaY > 0) {
    // 向下滚动，切换到下一个
    newIndex = currentIndex + 1;
    if (newIndex >= tabs.length) newIndex = 0;
  } else {
    // 向上滚动，切换到上一个
    newIndex = currentIndex - 1;
    if (newIndex < 0) newIndex = tabs.length - 1;
  }
  
  if (newIndex === currentIndex) return null;
  return tabs[newIndex].key;
}

// ============================================================
// 3. 中键关闭相关
// ============================================================

/**
 * 检查是否可以中键关闭标签
 * @param tab 标签项
 * @param middleClickEnabled 是否启用中键关闭
 */
export function canMiddleClickClose(tab: TabItem, middleClickEnabled: boolean): boolean {
  return middleClickEnabled && tab.closable !== false && !tab.affix;
}

// ============================================================
// 4. 最大化相关
// ============================================================

/**
 * 最大化状态
 */
export interface MaximizeState {
  /** 是否最大化 */
  isMaximized: boolean;
  /** 原始内容样式 */
  originalStyles: {
    position?: string;
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
    zIndex?: string;
  } | null;
}

/**
 * 创建初始最大化状态
 */
export function createInitialMaximizeState(): MaximizeState {
  return {
    isMaximized: false,
    originalStyles: null,
  };
}

/**
 * 计算最大化样式
 * @param isMaximized 是否最大化
 * @param zIndex z-index 值
 */
export function computeMaximizeStyles(
  isMaximized: boolean,
  zIndex: number = 9999
): Record<string, string> | null {
  if (!isMaximized) return null;
  
  return {
    position: 'fixed',
    top: '0',
    left: '0',
    right: '0',
    bottom: '0',
    zIndex: String(zIndex),
  };
}

// ============================================================
// 5. 右键菜单相关
// ============================================================

/**
 * 右键菜单项类型
 */
export type ContextMenuAction = 
  | 'refresh'
  | 'close'
  | 'closeOther'
  | 'closeLeft'
  | 'closeRight'
  | 'closeAll';

/**
 * 右键菜单项配置
 */
export interface ContextMenuItem {
  key: ContextMenuAction;
  label: string;
  icon?: string;
  disabled?: boolean;
  divider?: boolean;
}

/**
 * 生成右键菜单项
 * @param tab 当前标签
 * @param tabs 所有标签
 * @param activeKey 激活的标签 key
 * @param t 翻译函数
 */
export function generateContextMenuItems(
  tab: TabItem,
  tabs: TabItem[],
  activeKey: string,
  t: (key: string) => string
): ContextMenuItem[] {
  const currentIndex = tabs.findIndex(t => t.key === tab.key);
  const isActive = tab.key === activeKey;
  const canClose = tab.closable !== false && !tab.affix;
  const hasLeftTabs = currentIndex > 0 && tabs.slice(0, currentIndex).some(t => t.closable !== false && !t.affix);
  const hasRightTabs = currentIndex < tabs.length - 1 && tabs.slice(currentIndex + 1).some(t => t.closable !== false && !t.affix);
  const hasOtherTabs = tabs.some(t => t.key !== tab.key && t.closable !== false && !t.affix);
  const hasClosableTabs = tabs.some(t => t.closable !== false && !t.affix);

  return [
    {
      key: 'refresh',
      label: t('layout.tabbar.refresh'),
      icon: 'refresh',
      disabled: !isActive,
    },
    {
      key: 'close',
      label: t('layout.tabbar.close'),
      icon: 'close',
      disabled: !canClose,
      divider: true,
    },
    {
      key: 'closeOther',
      label: t('layout.tabbar.closeOther'),
      icon: 'close',
      disabled: !hasOtherTabs,
    },
    {
      key: 'closeLeft',
      label: t('layout.tabbar.closeLeft'),
      icon: 'chevron-left',
      disabled: !hasLeftTabs,
    },
    {
      key: 'closeRight',
      label: t('layout.tabbar.closeRight'),
      icon: 'chevron-right',
      disabled: !hasRightTabs,
      divider: true,
    },
    {
      key: 'closeAll',
      label: t('layout.tabbar.closeAll'),
      icon: 'close',
      disabled: !hasClosableTabs,
    },
  ];
}

/**
 * 执行右键菜单操作后需要关闭的标签
 * @param action 操作类型
 * @param tab 当前标签
 * @param tabs 所有标签
 * @returns 需要关闭的标签 key 列表
 */
export function getTabsToClose(
  action: ContextMenuAction,
  tab: TabItem,
  tabs: TabItem[]
): string[] {
  const currentIndex = tabs.findIndex(t => t.key === tab.key);
  
  switch (action) {
    case 'close':
      return tab.closable !== false && !tab.affix ? [tab.key] : [];
      
    case 'closeOther':
      return tabs
        .filter(t => t.key !== tab.key && t.closable !== false && !t.affix)
        .map(t => t.key);
        
    case 'closeLeft':
      return tabs
        .slice(0, currentIndex)
        .filter(t => t.closable !== false && !t.affix)
        .map(t => t.key);
        
    case 'closeRight':
      return tabs
        .slice(currentIndex + 1)
        .filter(t => t.closable !== false && !t.affix)
        .map(t => t.key);
        
    case 'closeAll':
      return tabs
        .filter(t => t.closable !== false && !t.affix)
        .map(t => t.key);
        
    default:
      return [];
  }
}

// ============================================================
// 6. 标签样式计算
// ============================================================

/**
 * 标签样式类型
 */
export type TabStyleType = 'chrome' | 'card' | 'plain' | 'brisk';

/**
 * 计算标签类名
 * @param tab 标签项
 * @param options 选项
 */
export function computeTabClassName(
  tab: TabItem,
  options: {
    isActive: boolean;
    styleType: TabStyleType;
    isDragging?: boolean;
    isHovered?: boolean;
  }
): string {
  const { isActive, styleType, isDragging, isHovered } = options;
  
  const classes = [
    'layout-tabbar__tab',
    `layout-tabbar__tab--${styleType}`,
  ];
  
  if (isActive) classes.push('layout-tabbar__tab--active');
  if (isDragging) classes.push('layout-tabbar__tab--dragging');
  if (isHovered) classes.push('layout-tabbar__tab--hovered');
  if (tab.affix) classes.push('layout-tabbar__tab--affix');
  
  return classes.join(' ');
}
