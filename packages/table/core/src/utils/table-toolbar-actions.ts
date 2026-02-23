import type {
  ToolbarConfig,
  ToolbarToolConfig,
  ToolbarToolRule,
  ToolbarToolRuleContext,
} from '../types';
import type {
  ResolveVisibleOperationActionToolsOptions,
  ResolveVisibleToolbarActionToolsOptions,
  ResolvedToolbarActionTool,
  ToolbarAccessValueSource,
  ToolbarActionEventPayload,
  ToolbarActionToolPayload,
  ToolbarOperationEventPayload,
  ToolbarOperationToolPayload,
  ToolbarPermissionResolveOptions,
  ToolbarToolRenderOptions,
  ToolbarToolVisibilityOptions,
} from './table-contracts';
import {
  isTableNonEmptyString,
  isTablePlainObject,
  normalizeToolbarAccessValues,
  normalizeToolbarPermissionDirective,
  resolveToolbarPermissionMode,
} from './table-permission';
import { resolveOperationColumnTools } from './table-selection';

function resolveToolbarRule(
  rule: ToolbarToolRule | undefined,
  fallback: boolean,
  context: ToolbarToolRuleContext
) {
  if (typeof rule === 'boolean') {
    return rule;
  }
  if (typeof rule === 'function') {
    try {
      return !!rule(context);
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function resolveExplicitToolbarToolText(tool: ToolbarToolConfig) {
  if (isTableNonEmptyString(tool.title)) {
    return tool.title.trim();
  }
  if (isTableNonEmptyString(tool.label)) {
    return tool.label.trim();
  }
  if (isTableNonEmptyString(tool.name)) {
    return tool.name.trim();
  }
  return undefined;
}

function resolveToolbarAccessSource(source: ToolbarAccessValueSource): string[] {
  if (typeof source === 'function') {
    try {
      return normalizeToolbarAccessValues(source());
    } catch {
      return [];
    }
  }
  return normalizeToolbarAccessValues(source);
}

function resolveToolbarPermissionValues(
  permission: Record<string, any>,
  mode: 'and' | 'or'
): string[] {
  const directValues = normalizeToolbarAccessValues(permission.value);
  if (directValues.length > 0) {
    return directValues;
  }
  const modeValues = normalizeToolbarAccessValues(permission[mode]);
  if (modeValues.length > 0) {
    return modeValues;
  }
  return normalizeToolbarAccessValues(permission[mode === 'and' ? 'or' : 'and']);
}

export function evaluateToolbarToolPermission(
  permission: Record<string, any> | null | undefined,
  options: ToolbarPermissionResolveOptions = {}
) {
  if (!permission || !isTablePlainObject(permission)) {
    return options.defaultWhenNoAccess ?? false;
  }
  const mode = resolveToolbarPermissionMode(permission);
  const values = resolveToolbarPermissionValues(permission, mode);
  if (values.length <= 0) {
    return options.defaultWhenNoAccess ?? false;
  }
  const targetValues =
    permission.arg === 'role'
      ? resolveToolbarAccessSource(options.accessRoles)
      : resolveToolbarAccessSource(options.accessCodes);
  if (targetValues.length <= 0) {
    return options.defaultWhenNoAccess ?? false;
  }
  const valueSet = new Set(targetValues);
  const matchedCount = values.filter((item) => valueSet.has(item)).length;
  return mode === 'and'
    ? matchedCount === values.length
    : matchedCount > 0;
}

export function shouldRenderToolbarTool(
  tool: Record<string, any> | null | undefined,
  options: ToolbarToolRenderOptions = {}
) {
  const permission = tool?.permission;
  if (!permission) {
    return true;
  }
  const checker = options.permissionChecker;
  if (typeof checker === 'function') {
    try {
      return !!checker(permission, tool ?? {});
    } catch {
      return true;
    }
  }
  return evaluateToolbarToolPermission(permission, options);
}

export function resolveToolbarToolVisibility(
  tool: Record<string, any> | null | undefined,
  options: ToolbarToolVisibilityOptions = {}
) {
  if (!tool) {
    return false;
  }
  const hasAccessSource =
    options.accessCodes !== undefined || options.accessRoles !== undefined;
  const useDirectiveWhenNoAccess = options.useDirectiveWhenNoAccess === true;
  if (
    !shouldRenderToolbarTool(tool, {
      ...options,
      defaultWhenNoAccess: hasAccessSource
        ? false
        : useDirectiveWhenNoAccess
          ? true
          : options.defaultWhenNoAccess,
    })
  ) {
    return false;
  }
  if (!tool.permission) {
    return true;
  }
  if (typeof options.permissionChecker === 'function' || hasAccessSource) {
    return true;
  }
  if (!useDirectiveWhenNoAccess) {
    return true;
  }
  return options.directiveRenderer
    ? options.directiveRenderer(tool)
    : false;
}

export function resolveToolbarActionTools(
  tools: ToolbarConfig['tools'] | undefined,
  options: {
    maximized?: boolean;
    showSearchForm?: boolean;
  } = {}
): ResolvedToolbarActionTool[] {
  const list = Array.isArray(tools) ? tools : [];
  const resolved: ResolvedToolbarActionTool[] = [];

  list.forEach((rawTool, index) => {
    const tool = (isTablePlainObject(rawTool) ? rawTool : {}) as ToolbarToolConfig;
    const context: ToolbarToolRuleContext = {
      index,
      maximized: options.maximized,
      showSearchForm: options.showSearchForm,
      tool,
    };

    const showRule = (tool.show ?? tool.ifShow ?? tool.visible) as ToolbarToolRule | undefined;
    if (!resolveToolbarRule(showRule, true, context)) {
      return;
    }

    const disabled = resolveToolbarRule(tool.disabled, false, context);
    const explicitText = resolveExplicitToolbarToolText(tool);
    const title = explicitText
      ? explicitText
      : isTableNonEmptyString(tool.code)
        ? tool.code
        : `Tool-${index + 1}`;
    const rawPermission = (tool.permission ?? tool.auth) as ToolbarToolConfig['permission'];
    if (rawPermission === false) {
      return;
    }
    const permission = normalizeToolbarPermissionDirective(rawPermission);

    resolved.push({
      ...tool,
      disabled,
      index,
      permission,
      text: explicitText,
      title,
    });
  });

  return resolved;
}

export function resolveVisibleToolbarActionTools(
  options: ResolveVisibleToolbarActionToolsOptions = {}
) {
  const {
    excludeCodes,
    maximized,
    showSearchForm,
    tools,
    ...visibilityOptions
  } = options;
  const excludeCodeSet = new Set(
    Array.isArray(excludeCodes)
      ? excludeCodes
        .map((code) => (isTableNonEmptyString(code) ? code.trim() : ''))
        .filter((code) => code.length > 0)
      : []
  );
  return resolveToolbarActionTools(tools, {
    maximized,
    showSearchForm,
  })
    .filter((tool) => {
      if (!isTableNonEmptyString(tool.code)) {
        return true;
      }
      return !excludeCodeSet.has(tool.code.trim());
    })
    .filter((tool) => resolveToolbarToolVisibility(tool, visibilityOptions));
}

export function resolveVisibleOperationActionTools(
  options: ResolveVisibleOperationActionToolsOptions = {}
) {
  return resolveVisibleToolbarActionTools({
    ...options,
    tools: resolveOperationColumnTools(options.operationColumn),
  });
}

export function triggerToolbarActionTool(
  tool: Record<string, any> | undefined,
  index: number,
  options: {
    onToolbarToolClick?: (payload: ToolbarActionEventPayload) => void;
  } = {}
) {
  const payload = {
    code: tool?.code,
    tool,
  };

  options.onToolbarToolClick?.(payload);

  const handler = tool?.onClick;
  if (typeof handler === 'function') {
    handler({
      ...payload,
      index,
    } as ToolbarActionToolPayload);
  }
}

export function triggerOperationActionTool(
  tool: Record<string, any> | undefined,
  index: number,
  options: {
    onOperationToolClick?: (payload: ToolbarOperationEventPayload) => void;
    row?: Record<string, any>;
    rowIndex?: number;
  } = {}
) {
  const payload = {
    code: tool?.code,
    row: options.row,
    rowIndex: options.rowIndex,
    tool,
  };

  options.onOperationToolClick?.(payload);

  const handler = tool?.onClick;
  if (typeof handler === 'function') {
    handler({
      ...payload,
      index,
    } as ToolbarOperationToolPayload);
  }
}
