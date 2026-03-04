/**
 * 业务操作模块
 * @description 框架无关的业务逻辑操作
 */

/**
 * 偏好设置操作导出。
 */
export {
  createPreferencesActions,
  type PreferencesActions,
} from './preferences';

/**
 * 主题操作导出。
 */
export {
  createThemeActions,
  type ThemeActions,
} from './theme';

/**
 * 布局操作导出。
 */
export {
  createLayoutActions,
  type LayoutActions,
} from './layout';

/**
 * Action 工厂与缓存管理导出。
 */
export {
  createActionFactory,
  getGlobalActionFactory,
  resetGlobalActionFactory,
  type ActionFactory,
} from './factory';
