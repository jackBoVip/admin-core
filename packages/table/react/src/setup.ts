/**
 * Table React 全局初始化入口。
 * @description 负责联动 table-core、shared 偏好绑定与 React 渲染器注册。
 */
import type { SetupAdminTableReactOptions } from './types';

import {
  normalizeTableLocale,
  setupAdminTableCore,
} from '@admin-core/table-core';
import {
  type Preferences,
} from '@admin-core/preferences';
import {
  applyTableLocaleCore,
  applyTableSetupPermissionState,
  createTablePreferencesBinder,
  resolveTableThemeContext,
} from '@admin-core/table-shared';

import { registerBuiltinReactRenderers } from './renderers';

/**
 * React 表格主题快照。
 * @description 缓存当前主题相关关键字段，供运行态快速读取。
 */
interface ReactTableThemeState {
  /** 主色。 */
  colorPrimary?: string;
  /** 字体缩放。 */
  fontScale?: number;
  /** 当前主题模式。 */
  mode?: 'dark' | 'light';
  /** 圆角配置。 */
  radius?: string;
}

/**
 * React 表格全局 setup 状态。
 * @description 保存权限、默认配置、主题与初始化标记等全局状态。
 */
interface AdminTableReactSetupState {
  /** 权限码来源。 */
  accessCodes?: SetupAdminTableReactOptions['accessCodes'];
  /** 角色来源。 */
  accessRoles?: SetupAdminTableReactOptions['accessRoles'];
  /** 默认 grid 配置。 */
  defaultGridOptions: Record<string, any>;
  /** 是否完成初始化。 */
  initialized: boolean;
  /** 当前语言。 */
  locale: 'en-US' | 'zh-CN';
  /** 统一权限校验器。 */
  permissionChecker?: SetupAdminTableReactOptions['permissionChecker'];
  /** 主题状态快照。 */
  theme: ReactTableThemeState;
}

/**
 * React 表格全局 setup 状态存储。
 * @description 模块级单例状态容器，贯穿应用生命周期。
 */
const state: AdminTableReactSetupState = {
  accessCodes: undefined,
  accessRoles: undefined,
  defaultGridOptions: {},
  initialized: false,
  locale: 'zh-CN',
  permissionChecker: undefined,
  theme: {},
};

/**
 * 应用 React 表格语言。
 * @param locale 目标语言。
 * @returns 无返回值。
 */
function applyLocale(locale: 'en-US' | 'zh-CN') {
  applyTableLocaleCore(locale, {
    /**
     * 在语言切换前同步 setup 状态。
     * @param nextLocale 即将应用的语言。
     * @returns 无返回值。
     */
    onBeforeApply(nextLocale) {
      state.locale = nextLocale;
    },
  });
}

/**
 * 应用 React 表格主题。
 * @param preferences 偏好设置。
 * @returns 无返回值。
 */
function applyTheme(preferences: Preferences | null | undefined) {
  const resolvedTheme = resolveTableThemeContext(preferences);
  if (!resolvedTheme) {
    return;
  }

  const theme = resolvedTheme.preferences.theme;
  state.theme = {
    colorPrimary: resolvedTheme.resolvedPrimary || undefined,
    fontScale: theme.fontScale,
    mode: resolvedTheme.actualMode,
    radius: theme.radius,
  };
}

/**
 * 偏好绑定器
 * @description 负责监听偏好中心并同步表格语言与主题。
 */
const preferencesBinder = createTablePreferencesBinder({
  applyLocale,
  applyTheme,
});

/**
 * 立即同步 React 表格与偏好设置。
 * @returns 无返回值。
 */
export function syncAdminTableReactWithPreferences() {
  preferencesBinder.syncWithPreferences();
}

/**
 * 初始化 React 表格运行环境。
 * @param options 初始化配置。
 * @returns 无返回值。
 */
export function setupAdminTableReact(options: SetupAdminTableReactOptions = {}) {
  setupAdminTableCore({ locale: options.locale });

  applyLocale(normalizeTableLocale(options.locale ?? state.locale));
  state.defaultGridOptions = {
    ...state.defaultGridOptions,
    ...(options.defaultGridOptions ?? {}),
  };
  applyTableSetupPermissionState(state, options);

  if (options.bindPreferences !== false) {
    preferencesBinder.ensurePreferencesBinding();
    syncAdminTableReactWithPreferences();
  }

  if (!state.initialized) {
    registerBuiltinReactRenderers();
    state.initialized = true;
  }
}

/**
 * 获取 React 表格初始化状态。
 * @returns 初始化状态对象。
 */
export function getAdminTableReactSetupState() {
  return state;
}
