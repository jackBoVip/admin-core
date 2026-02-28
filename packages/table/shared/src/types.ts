import type {
  SupportedLocale,
  ToolbarToolPermissionDirective,
} from '@admin-core/table-core';

export type BuiltInTableLocale = SupportedLocale;

export type TableAccessList =
  | null
  | string[]
  | undefined
  | (() => null | string[] | undefined);

export interface SetupAdminTableSharedOptions {
  accessCodes?: TableAccessList;
  accessRoles?: TableAccessList;
  bindPreferences?: boolean;
  locale?: BuiltInTableLocale;
  permissionChecker?: (
    permission: ToolbarToolPermissionDirective,
    tool: Record<string, any>
  ) => boolean;
}

export interface TableSetupPermissionState {
  accessCodes?: SetupAdminTableSharedOptions['accessCodes'];
  accessRoles?: SetupAdminTableSharedOptions['accessRoles'];
  permissionChecker?: SetupAdminTableSharedOptions['permissionChecker'];
}

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
