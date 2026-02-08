/**
 * Layout UI icon helpers
 * @description 补充 UI 专用的常量与工具方法
 */

export const TABBAR_CHROME_SVG_PATHS = {
  before: 'M 0 7 A 7 7 0 0 0 7 0 L 7 7 Z',
  after: 'M 0 0 A 7 7 0 0 0 7 7 L 0 7 Z',
} as const;

export type TabbarChromeCorner = keyof typeof TABBAR_CHROME_SVG_PATHS;

export function getTabbarChromeCornerSvg(type: TabbarChromeCorner): string {
  return TABBAR_CHROME_SVG_PATHS[type];
}
