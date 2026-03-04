/**
 * Table Core 工具栏渲染映射工具。
 * @description 负责将工具栏动作定义转换为渲染态按钮与工具项模型。
 */
import type { ToolbarToolConfig } from '../types';
import type {
  ResolvedToolbarActionButtonClassState,
  ResolvedToolbarActionButtonRenderState,
  ResolvedToolbarActionPresentation,
  ResolvedToolbarActionTool,
} from './table-contracts';
import {
  resolveToolbarActionThemeClass,
  resolveToolbarActionTypeClass,
} from './table-toolbar';
import {
  isTableNonEmptyString,
  isTablePlainObject,
} from './table-permission';

/**
 * 解析工具栏动作按钮渲染态时的附加参数。
 */
export interface ResolveToolbarActionButtonRenderStateOptions {
  /** 渲染键名前缀。 */
  keyPrefix?: string;
}

/**
 * 规范化工具项图标类名。
 * @param icon 原始图标配置。
 * @returns 可用图标类名；无效时返回 `undefined`。
 */
function normalizeToolbarToolIconClass(icon: unknown) {
  if (!isTableNonEmptyString(icon)) {
    return undefined;
  }
  return icon.trim();
}

/**
 * 解析工具项展示态（图标/文本/仅图标模式）。
 * @param tool 工具项信息。
 * @returns 标准化后的展示态对象。
 */
export function resolveToolbarActionPresentation(
  tool?: Pick<ResolvedToolbarActionTool, 'icon' | 'iconOnly' | 'text' | 'title'> | null
): ResolvedToolbarActionPresentation {
  const iconClass = normalizeToolbarToolIconClass(tool?.icon);
  const hasIcon = !!iconClass;
  const forceIconOnly = tool?.iconOnly === true;
  const explicitText = isTableNonEmptyString(tool?.text) ? tool?.text.trim() : '';
  const fallbackText =
    !hasIcon && isTableNonEmptyString(tool?.title) ? tool?.title.trim() : '';
  const text = forceIconOnly ? '' : explicitText || fallbackText;
  return {
    hasIcon,
    iconClass,
    iconOnly: hasIcon && (forceIconOnly || !text),
    text,
  };
}

/**
 * 规范化类名输入为类名数组。
 * 支持字符串、数组与对象语法（Vue/React 常见 class 写法）。
 * @param value 原始类名输入。
 * @returns 扁平化且过滤后的类名数组。
 */
function normalizeToolbarClassTokens(value: unknown): string[] {
  if (isTableNonEmptyString(value)) {
    return value
      .split(' ')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  if (Array.isArray(value)) {
    return value.flatMap((item) => normalizeToolbarClassTokens(item));
  }
  if (isTablePlainObject(value)) {
    return Object.entries(value)
      .filter(([, enabled]) => !!enabled)
      .map(([className]) => className.trim())
      .filter((className) => className.length > 0);
  }
  return [];
}

/**
 * 解析工具栏动作按钮的类名状态。
 * 会结合按钮类型、主题、图标模式和外部 class 配置生成最终类名列表。
 * @param tool 工具项配置。
 * @returns 包含类名集合与展示态的结果。
 */
export function resolveToolbarActionButtonClassState(
  tool?: (null | Pick<ToolbarToolConfig, 'attrs' | 'type'> | Record<string, any>)
): ResolvedToolbarActionButtonClassState {
  const presentation = resolveToolbarActionPresentation(tool as any);
  const attrs = isTablePlainObject(tool?.attrs)
    ? (tool?.attrs as Record<string, any>)
    : {};
  const classList = presentation.iconOnly
    ? ['admin-table__toolbar-tool-btn']
    : [
        'admin-table__toolbar-action-btn',
        'admin-table__toolbar-slot-btn',
        resolveToolbarActionTypeClass(tool?.type),
        resolveToolbarActionThemeClass(tool as any),
      ];
  if (presentation.hasIcon && presentation.text) {
    classList.push('has-icon');
  }
  classList.push(
    ...normalizeToolbarClassTokens(attrs.class),
    ...normalizeToolbarClassTokens((attrs as Record<string, any>).className),
    ...normalizeToolbarClassTokens((tool as Record<string, any>)?.class),
    ...normalizeToolbarClassTokens((tool as Record<string, any>)?.className)
  );
  return {
    classList: classList.filter((item) => item.length > 0),
    presentation,
  };
}

/**
 * 解析工具栏动作按钮渲染态。
 * 会清理 `attrs` 中 class 相关字段并生成稳定渲染 key。
 * @param tool 工具项配置。
 * @param options 渲染选项。
 * @returns 可直接用于渲染层的按钮状态对象。
 */
export function resolveToolbarActionButtonRenderState(
  tool: null | Record<string, any> | undefined,
  options: ResolveToolbarActionButtonRenderStateOptions = {}
): ResolvedToolbarActionButtonRenderState {
  const sourceTool = isTablePlainObject(tool) ? tool : {};
  const attrs = isTablePlainObject(sourceTool.attrs)
    ? { ...(sourceTool.attrs as Record<string, any>) }
    : {};
  delete attrs.class;
  delete attrs.className;
  const classState = resolveToolbarActionButtonClassState(sourceTool);
  const keyPrefix = isTableNonEmptyString(options.keyPrefix)
    ? options.keyPrefix.trim()
    : 'tool';
  const index = typeof sourceTool.index === 'number'
    ? sourceTool.index
    : 0;
  return {
    ...classState,
    attrs,
    disabled: !!sourceTool.disabled,
    key: `${sourceTool.code ?? sourceTool.title ?? keyPrefix}-${index}`,
    title: isTableNonEmptyString(sourceTool.title)
      ? sourceTool.title.trim()
      : undefined,
  };
}
