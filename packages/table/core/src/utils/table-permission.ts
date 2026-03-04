/**
 * Table Core 权限工具。
 * @description 提供工具项权限指令解析与权限判断相关基础函数。
 */
import type {
  ToolbarToolConfig,
  ToolbarToolPermissionDirective,
} from '../types';

/**
 * 判断值是否为去除空白后仍有内容的字符串。
 * 常用于配置项字段的合法性校验（例如 `name`、`arg`、`field` 等）。
 *
 * @param value 待判断的任意值。
 * @returns `true` 表示为非空字符串，`false` 表示不是可用字符串。
 */
export function isTableNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 判断值是否为普通对象（排除数组）。
 *
 * @param value 待判断的任意值。
 * @returns `true` 表示为对象字面量结构，`false` 表示不是普通对象。
 */
export function isTablePlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

/**
 * 从权限配置中解析逻辑运算模式。
 * 解析优先级：`permission.mode` > `permission.modifiers` > 顶层 `and/or` 字段，默认 `'or'`。
 *
 * @param permission 工具栏权限配置对象。
 * @returns 权限计算模式：`'and'` 或 `'or'`。
 */
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

/**
 * 将权限值归一化为字符串数组。
 * 支持字符串或数组输入，并自动去除空值、空白值。
 *
 * @param value 原始权限值，可能是单值字符串或字符串数组。
 * @returns 归一化后的权限标识列表。
 */
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

/**
 * 将工具栏权限配置标准化为统一的权限指令结构。
 * 便于后续在 React/Vue 两端按同一规则执行权限判断。
 *
 * @param permission 原始权限配置，支持布尔值、字符串、数组与对象形式。
 * @returns 标准化后的权限指令；当配置无效或显式禁用时返回 `undefined`。
 */
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
