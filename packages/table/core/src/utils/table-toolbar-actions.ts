/**
 * Table Core 工具栏动作工具。
 * @description 提供工具栏动作可见性、权限过滤与事件载荷构建能力。
 */
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

/**
 * 解析工具栏动作项时的运行时上下文参数。
 */
export interface ResolveToolbarActionToolsRuntimeOptions {
  /** 当前是否最大化。 */
  maximized?: boolean;
  /** 当前是否显示查询表单。 */
  showSearchForm?: boolean;
}

/**
 * 触发工具栏动作项点击时的回调参数。
 */
export interface TriggerToolbarActionToolOptions {
  /** 外部工具栏点击回调。 */
  onToolbarToolClick?: (payload: ToolbarActionEventPayload) => void;
}

/**
 * 触发行内操作点击时的回调参数。
 */
export interface TriggerOperationActionToolOptions {
  /** 外部行内操作点击回调。 */
  onOperationToolClick?: (payload: ToolbarOperationEventPayload) => void;
  /** 当前行数据。 */
  row?: Record<string, any>;
  /** 当前行索引。 */
  rowIndex?: number;
}

/**
 * 解析工具项规则表达式。
 * 支持布尔值或函数规则，函数异常时回退到默认值。
 * @param rule 规则定义。
 * @param fallback 默认回退值。
 * @param context 规则上下文。
 * @returns 规则最终结果。
 */
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

/**
 * 解析工具项显式文本。
 * 按 `title > label > name` 优先级选择首个非空文案。
 * @param tool 工具项配置。
 * @returns 文本内容；未命中时返回 `undefined`。
 */
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

/**
 * 解析权限来源值。
 * 支持直接值或函数形式，函数异常时返回空数组。
 * @param source 权限来源。
 * @returns 归一化后的权限值数组。
 */
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

/**
 * 从权限指令中提取待匹配值数组。
 * 提取优先级：`value` > 当前模式字段（`and`/`or`）> 另一模式字段。
 * @param permission 权限指令对象。
 * @param mode 权限匹配模式。
 * @returns 归一化后的权限值数组。
 */
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

/**
 * 执行工具项权限匹配判定。
 * @param permission 权限指令。
 * @param options 权限解析参数。
 * @returns 当前上下文是否具备访问权限。
 */
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

/**
 * 判断工具项是否应渲染。
 * 优先使用外部 `permissionChecker`，未提供时使用默认权限判定。
 * @param tool 工具项对象。
 * @param options 渲染判定参数。
 * @returns 工具项是否可渲染。
 */
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

/**
 * 解析工具项最终可见性。
 * 同时考虑权限、权限来源、指令渲染策略和兜底行为。
 * @param tool 工具项对象。
 * @param options 可见性判定参数。
 * @returns 工具项是否可见。
 */
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

/**
 * 解析并标准化工具栏动作项。
 * 处理内容包括显隐规则、禁用规则、标题文案和权限指令标准化。
 * @param tools 原始工具项数组。
 * @param options 与页面状态相关的解析参数。
 * @returns 标准化后的动作项列表。
 */
export function resolveToolbarActionTools(
  tools: ToolbarConfig['tools'] | undefined,
  options: ResolveToolbarActionToolsRuntimeOptions = {}
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

/**
 * 解析最终可见的工具栏动作项。
 * 先执行动作项标准化，再按排除编码和可见性规则过滤。
 * @param options 过滤与权限判定参数。
 * @returns 可见动作项列表。
 */
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

/**
 * 解析最终可见的行内操作动作项。
 * 内部将操作列工具配置适配为工具栏动作解析流程。
 * @param options 行内操作可见性参数。
 * @returns 可见行内动作项列表。
 */
export function resolveVisibleOperationActionTools(
  options: ResolveVisibleOperationActionToolsOptions = {}
) {
  return resolveVisibleToolbarActionTools({
    ...options,
    tools: resolveOperationColumnTools(options.operationColumn),
  });
}

/**
 * 触发工具栏动作项点击行为。
 * 会先触发外部事件回调，再调用工具项自身 `onClick`。
 * @param tool 动作项对象。
 * @param index 动作项索引。
 * @param options 点击回调参数。
 * @returns 无返回值。
 */
export function triggerToolbarActionTool(
  tool: Record<string, any> | undefined,
  index: number,
  options: TriggerToolbarActionToolOptions = {}
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

/**
 * 触发行内操作动作项点击行为。
 * 会先触发外部事件回调，再调用工具项自身 `onClick`。
 * @param tool 动作项对象。
 * @param index 动作项索引。
 * @param options 点击回调参数。
 * @returns 无返回值。
 */
export function triggerOperationActionTool(
  tool: Record<string, any> | undefined,
  index: number,
  options: TriggerOperationActionToolOptions = {}
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
