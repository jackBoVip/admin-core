/**
 * 图标模块
 * @description
 * 设计原则：
 * 1. 图标以 SVG 字符串形式存储在 core 包
 * 2. Vue/React 包负责将字符串包装为组件
 * 3. 支持自定义图标尺寸和颜色（通过 currentColor）
 */

// 布局图标
export { getLayoutIcon, layoutIcons } from './layouts';

// 通用图标
export {
  getIcon,
  hasIcon,
  icons,
  ICON_SIZES,
  type IconName,
  type IconSize,
} from './common';
