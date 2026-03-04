/**
 * Table Shared 共享类型定义。
 * @description 统一跨框架表格初始化、权限与偏好联动相关的公共类型契约。
 */
import type {
  SupportedLocale,
  ToolbarToolPermissionDirective,
} from '@admin-core/table-core';

/**
 * 表格内置语言类型。
 * @description 与 `table-core` 侧的 `SupportedLocale` 保持一致。
 */
export type BuiltInTableLocale = SupportedLocale;

/**
 * 权限列表来源类型。
 * @description 可直接传入列表，也可传入惰性函数以延迟解析。
 */
export type TableAccessList =
  | null
  | string[]
  | undefined
  | (() => null | string[] | undefined);

/**
 * 表格共享层初始化配置。
 * @description 汇总权限来源、语言与偏好联动等跨框架通用初始化参数。
 */
export interface SetupAdminTableSharedOptions {
  /** 权限码来源（如按钮权限码列表）。 */
  accessCodes?: TableAccessList;
  /** 角色来源（如当前用户角色列表）。 */
  accessRoles?: TableAccessList;
  /** 是否自动绑定偏好中心并同步主题/语言。 */
  bindPreferences?: boolean;
  /** 默认语言。 */
  locale?: BuiltInTableLocale;
  /** 自定义权限校验器，返回 `true` 表示有权限。 */
  permissionChecker?: (
    permission: ToolbarToolPermissionDirective,
    tool: Record<string, any>
  ) => boolean;
}

/**
 * 共享层权限运行时状态。
 * @description 保存当前生效的权限源与校验器，供运行时统一鉴权判断。
 */
export interface TableSetupPermissionState {
  /** 权限码来源。 */
  accessCodes?: SetupAdminTableSharedOptions['accessCodes'];
  /** 角色来源。 */
  accessRoles?: SetupAdminTableSharedOptions['accessRoles'];
  /** 当前生效的权限校验器。 */
  permissionChecker?: SetupAdminTableSharedOptions['permissionChecker'];
}

/**
 * 将初始化配置合并到权限状态。
 * @template TState 状态类型。
 * @param state 当前权限状态。
 * @param options 初始化配置。
 * @returns 合并后的同一状态对象（原位更新）。
 */
export function applyTableSetupPermissionState<
  TState extends TableSetupPermissionState,
>(
  state: TState,
  options: SetupAdminTableSharedOptions
) {
  state.accessCodes = options.accessCodes ?? state.accessCodes;
  state.accessRoles = options.accessRoles ?? state.accessRoles;
  state.permissionChecker = options.permissionChecker ?? state.permissionChecker;

  return state;
}
