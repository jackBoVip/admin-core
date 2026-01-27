/**
 * 图标工具函数
 * @description 框架无关的图标尺寸和样式计算
 */

import { iconSizes, layoutIcon } from '../config/tokens';
import type { IconSize } from '../icons';

/**
 * 扩展的图标尺寸类型（包含 xs）
 */
export type ExtendedIconSize = IconSize | 'xs';

/**
 * 图标尺寸映射
 */
export const ICON_SIZE_MAP: Record<ExtendedIconSize, number> = {
  xs: iconSizes.xs,
  sm: iconSizes.sm,
  md: iconSizes.md,
  lg: iconSizes.lg,
  xl: iconSizes.xl,
};

/**
 * 获取图标尺寸（像素）
 * @param size - 尺寸名称或像素值
 * @returns 像素值
 */
export function getIconSize(size: ExtendedIconSize | number): number {
  if (typeof size === 'number') {
    return size;
  }
  return ICON_SIZE_MAP[size] ?? iconSizes.md;
}

/**
 * 获取图标样式对象
 * @param size - 尺寸名称或像素值
 * @returns 样式对象
 */
export function getIconStyle(size: ExtendedIconSize | number): {
  width: number;
  height: number;
  display: 'inline-flex';
} {
  const px = getIconSize(size);
  return {
    width: px,
    height: px,
    display: 'inline-flex',
  };
}

/**
 * 获取图标样式字符串（用于 Vue style 绑定）
 * @param size - 尺寸名称或像素值
 * @returns 样式字符串
 */
export function getIconStyleString(size: ExtendedIconSize | number): string {
  const px = getIconSize(size);
  return `width: ${px}px; height: ${px}px; display: inline-flex;`;
}

/**
 * 布局图标尺寸
 */
export const LAYOUT_ICON_SIZE = {
  width: layoutIcon.width,
  height: layoutIcon.height,
} as const;

/**
 * 获取布局图标样式对象
 * @param isActive - 是否选中
 * @param primaryColor - 主色
 * @returns 样式对象
 */
export function getLayoutIconStyle(isActive: boolean, primaryColor?: string): {
  width: string;
  height: string;
  borderColor?: string;
  borderWidth?: string;
} {
  const style: {
    width: string;
    height: string;
    borderColor?: string;
    borderWidth?: string;
  } = {
    width: `${LAYOUT_ICON_SIZE.width}px`,
    height: `${LAYOUT_ICON_SIZE.height}px`,
  };

  if (isActive && primaryColor) {
    style.borderColor = primaryColor;
    style.borderWidth = '2px';
  }

  return style;
}

/**
 * 获取布局图标容器样式
 */
export function getLayoutIconContainerStyle(): {
  width: string;
  height: string;
} {
  return {
    width: `${LAYOUT_ICON_SIZE.width}px`,
    height: `${LAYOUT_ICON_SIZE.height}px`,
  };
}
