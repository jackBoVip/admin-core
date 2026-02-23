import type {
  ToolbarToolConfig,
  ToolbarToolPermissionDirective,
} from '../types';

export function isTableNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function isTablePlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function resolveToolbarPermissionMode(
  permission: Record<string, any>
): 'and' | 'or' {
  if (permission.mode === 'and' || permission.mode === 'or') {
    return permission.mode;
  }
  if (permission.modifiers?.and) {
    return 'and';
  }
  if (permission.modifiers?.or) {
    return 'or';
  }
  if (Object.prototype.hasOwnProperty.call(permission, 'and')) {
    return 'and';
  }
  if (Object.prototype.hasOwnProperty.call(permission, 'or')) {
    return 'or';
  }
  return 'or';
}

export function normalizeToolbarAccessValues(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item ?? '').trim())
      .filter((item) => item.length > 0);
  }
  if (typeof value === 'string') {
    const next = value.trim();
    return next ? [next] : [];
  }
  return [];
}

export function normalizeToolbarPermissionDirective(
  permission: ToolbarToolConfig['permission']
): ToolbarToolPermissionDirective | undefined {
  if (permission === undefined || permission === null || permission === false) {
    return undefined;
  }

  if (Array.isArray(permission) || isTableNonEmptyString(permission)) {
    return {
      arg: 'code',
      mode: 'or',
      modifiers: {
        or: true,
      },
      name: 'access',
      value: permission,
    };
  }

  if (!isTablePlainObject(permission)) {
    return undefined;
  }

  const mode = resolveToolbarPermissionMode(permission);
  const hasValue = Object.prototype.hasOwnProperty.call(permission, 'value');
  const modeValue = permission[mode];
  const fallbackModeValue = permission[mode === 'and' ? 'or' : 'and'];
  const modifiers = isTablePlainObject(permission.modifiers)
    ? { ...(permission.modifiers as Record<string, boolean>) }
    : {};

  if (
    !Object.prototype.hasOwnProperty.call(modifiers, 'and') &&
    !Object.prototype.hasOwnProperty.call(modifiers, 'or')
  ) {
    modifiers[mode] = true;
  }

  return {
    and: permission.and,
    arg: isTableNonEmptyString(permission.arg) ? permission.arg : 'code',
    mode,
    modifiers: Object.keys(modifiers).length > 0 ? modifiers : undefined,
    name: isTableNonEmptyString(permission.name) ? permission.name : 'access',
    or: permission.or,
    value: hasValue
      ? permission.value
      : modeValue ?? fallbackModeValue ?? permission,
  };
}
