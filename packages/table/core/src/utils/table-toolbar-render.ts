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

function normalizeToolbarToolIconClass(icon: unknown) {
  if (!isTableNonEmptyString(icon)) {
    return undefined;
  }
  return icon.trim();
}

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

export function resolveToolbarActionButtonRenderState(
  tool: null | Record<string, any> | undefined,
  options: {
    keyPrefix?: string;
  } = {}
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
