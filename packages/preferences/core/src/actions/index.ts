/**
 * 业务操作模块
 * @description 框架无关的业务逻辑操作
 */

// 偏好设置操作
export {
  createPreferencesActions,
  type PreferencesActions,
} from './preferences';

// 主题操作
export {
  createThemeActions,
  type ThemeActions,
} from './theme';

// 布局操作
export {
  createLayoutActions,
  type LayoutActions,
} from './layout';

// Action 工厂（缓存管理）
export {
  createActionFactory,
  getGlobalActionFactory,
  resetGlobalActionFactory,
  type ActionFactory,
} from './factory';
