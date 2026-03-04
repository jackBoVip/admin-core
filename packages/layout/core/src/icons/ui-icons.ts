/**
 * Layout UI 图标工具。
 * @description 提供 UI 专用图标常量与辅助方法。
 */

/**
 * Chrome 风格标签拐角 SVG 路径映射。
 * @description 用于标签页左右两侧弧形衔接的 path 片段。
 */
export const TABBAR_CHROME_SVG_PATHS = {
  /** 左侧拐角路径。 */
  before: 'M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z',
  /** 右侧拐角路径。 */
  after: 'M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z',
} as const;

/**
 * Chrome 风格标签页拐角类型。
 */
export type TabbarChromeCorner = keyof typeof TABBAR_CHROME_SVG_PATHS;

/**
 * 获取指定拐角的 SVG 路径。
 *
 * @param type 拐角类型。
 * @returns 对应 SVG path 字符串。
 */
export function getTabbarChromeCornerSvg(type: TabbarChromeCorner): string {
  return TABBAR_CHROME_SVG_PATHS[type];
}
