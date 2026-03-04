/**
 * Table Vue 全局初始化入口。
 * @description 负责联动 table-core、shared 偏好绑定与 VXE 组件/渲染器注册。
 */
import type { SetupAdminTableVueOptions } from './types';

import {
  createTableDateFormatter,
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
import {
  VxeButton,
  VxeCheckbox,
  VxeIcon,
  VxeInput,
  VxeLoading,
  VxeModal,
  VxeNumberInput,
  VxePager,
  VxeRadioGroup,
  VxeSelect,
  VxeSwitch,
  VxeTooltip,
  VxeUI,
  VxeUpload,
} from 'vxe-pc-ui';
import enUS from 'vxe-pc-ui/lib/language/en-US';
import zhCN from 'vxe-pc-ui/lib/language/zh-CN';
import {
  VxeColgroup,
  VxeColumn,
  VxeGrid,
  VxeTable,
  VxeToolbar,
} from 'vxe-table';
import { shallowRef } from 'vue';

import { registerBuiltinVueRenderers } from './renderers';

/**
 * vxe 组件与渲染器是否已完成初始化。
 * @description 防止重复注册 VXE 组件与内置渲染器。
 */
let initialized = false;
/**
 * 全局日期格式化器是否已注册。
 * @description 防止重复调用 `VxeUI.formats.add` 导致冲突。
 */
let formatterInitialized = false;
/**
 * 当前格式化器使用的语言。
 * @description 用于驱动全局日期格式化器输出语言。
 */
let currentFormatterLocale: 'en-US' | 'zh-CN' = 'zh-CN';
/**
 * 主题变更信号。
 * @description 每次主题同步后递增，用于驱动依赖主题的响应式刷新。
 */
const themeSignal = shallowRef(0);

/**
 * Vue 表格主题快照。
 * @description 缓存当前主题相关关键字段，供运行态快速读取。
 */
interface AdminTableVueThemeState {
  /** 当前主色。 */
  colorPrimary?: string;
}

/**
 * Vue 表格全局 setup 状态。
 * @description 保存权限、语言、主题等全局初始化状态。
 */
interface AdminTableVueSetupState {
  /** 当前生效的权限码集合。 */
  accessCodes?: SetupAdminTableVueOptions['accessCodes'];
  /** 当前生效的角色集合。 */
  accessRoles?: SetupAdminTableVueOptions['accessRoles'];
  /** 当前语言。 */
  locale: 'en-US' | 'zh-CN';
  /** 统一权限检查器。 */
  permissionChecker?: SetupAdminTableVueOptions['permissionChecker'];
  /** 当前主题快照。 */
  theme: AdminTableVueThemeState;
}

/**
 * AdminTable Vue 全局 setup 状态快照。
 * @description 模块级单例状态容器，贯穿应用生命周期。
 */
const setupState: AdminTableVueSetupState = {
  accessCodes: undefined,
  accessRoles: undefined,
  locale: 'zh-CN',
  permissionChecker: undefined,
  theme: {},
};

/**
 * vxe 语言包映射表。
 * @description 将标准 locale 映射到 VXE 内置语言包对象。
 */
const localeMap = {
  'en-US': enUS,
  'zh-CN': zhCN,
} as const;

/**
 * 注册 vxe 全局日期格式化器（仅首次注册）。
 * @param locale 当前语言，用于驱动格式化输出。
 * @returns 无返回值。
 */
function registerDefaultFormatters(locale: 'en-US' | 'zh-CN') {
  currentFormatterLocale = locale;

  if (formatterInitialized) {
    return;
  }

  VxeUI.formats.add('formatDate', {
    /**
     * vxe 日期格式化实现。
     * @param payload 单元格值载荷。
     * @returns 格式化后的日期字符串。
     */
    tableCellFormatMethod({ cellValue }) {
      return createTableDateFormatter(currentFormatterLocale).formatDate(cellValue);
    },
  });

  VxeUI.formats.add('formatDateTime', {
    /**
     * vxe 日期时间格式化实现。
     * @param payload 单元格值载荷。
     * @returns 格式化后的日期时间字符串。
     */
    tableCellFormatMethod({ cellValue }) {
      return createTableDateFormatter(currentFormatterLocale).formatDateTime(cellValue);
    },
  });

  formatterInitialized = true;
}

/**
 * 同步表格语言到共享层与 vxe 运行时。
 * @param locale 目标语言。
 * @returns 无返回值。
 */
function applyLocale(locale: 'en-US' | 'zh-CN') {
  applyTableLocaleCore(locale, {
    /**
     * 在语言切换前同步本地状态并刷新格式化器语言。
     * @param nextLocale 即将应用的语言。
     * @returns 无返回值。
     */
    onBeforeApply(nextLocale) {
      setupState.locale = nextLocale;
      registerDefaultFormatters(nextLocale);
    },
    /**
     * 在语言切换后同步 vxe 国际化上下文。
     * @param nextLocale 已应用语言。
     * @returns 无返回值。
     */
    onAfterApply(nextLocale) {
      VxeUI.setI18n(nextLocale, localeMap[nextLocale]);
      VxeUI.setLanguage(nextLocale);
    },
  });
}

/**
 * 根据偏好设置同步主题到 setup 状态与 vxe 主题系统。
 * @param preferences 偏好设置对象。
 * @returns 无返回值。
 */
function applyTheme(preferences: Preferences | null | undefined) {
  const resolvedTheme = resolveTableThemeContext(preferences);
  if (!resolvedTheme) {
    return;
  }
  setupState.theme = {
    colorPrimary: resolvedTheme.resolvedPrimary || undefined,
  };
  themeSignal.value += 1;
  (VxeUI as any).setTheme?.(resolvedTheme.actualMode === 'dark' ? 'dark' : 'light');
}

/**
 * 偏好绑定器
 * @description 负责将偏好中心的语言/主题变化同步到表格运行时。
 */
const preferencesBinder = createTablePreferencesBinder({
  applyLocale,
  applyTheme,
});

/**
 * 立即从偏好系统拉取并同步表格语言/主题。
 * @returns 无返回值。
 */
export function syncAdminTableVueWithPreferences() {
  preferencesBinder.syncWithPreferences();
}

/**
 * 初始化 vxe 组件与内置渲染器（幂等）。
 * @returns 无返回值。
 */
function initVxeTable() {
  if (initialized) return;

  VxeUI.component(VxeTable);
  VxeUI.component(VxeColumn);
  VxeUI.component(VxeColgroup);
  VxeUI.component(VxeGrid);
  VxeUI.component(VxeToolbar);

  VxeUI.component(VxeButton);
  VxeUI.component(VxeCheckbox);
  VxeUI.component(VxeIcon);
  VxeUI.component(VxeInput);
  VxeUI.component(VxeLoading);
  VxeUI.component(VxeModal);
  VxeUI.component(VxeNumberInput);
  VxeUI.component(VxePager);
  VxeUI.component(VxeRadioGroup);
  VxeUI.component(VxeSelect);
  VxeUI.component(VxeSwitch);
  VxeUI.component(VxeTooltip);
  VxeUI.component(VxeUpload);

  registerBuiltinVueRenderers(VxeUI);
  initialized = true;
}

/**
 * 初始化 AdminTable Vue 运行时。
 * @param options 全局安装配置。
 * @returns 无返回值。
 */
export function setupAdminTableVue(options: SetupAdminTableVueOptions = {}) {
  setupAdminTableCore({ locale: options.locale });
  initVxeTable();
  applyTableSetupPermissionState(setupState, options);

  const locale = normalizeTableLocale(options.locale);
  applyLocale(locale);

  if (options.bindPreferences !== false) {
    preferencesBinder.ensurePreferencesBinding();
    syncAdminTableVueWithPreferences();
  }

  if (options.setupThemeAndLocale) {
    options.setupThemeAndLocale(VxeUI);
  }

  options.configVxeTable?.(VxeUI);
}

/**
 * 获取 AdminTable Vue 全局 setup 状态。
 * @returns setup 状态对象。
 */
export function getAdminTableVueSetupState() {
  return setupState;
}

/**
 * 获取主题变更信号，用于触发响应式刷新。
 * @returns 主题变更响应式信号。
 */
export function getAdminTableVueThemeSignal() {
  return themeSignal;
}
