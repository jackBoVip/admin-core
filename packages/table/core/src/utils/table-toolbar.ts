import { isPlainObject } from '@admin-core/shared-core';
import type {
  ToolbarConfig,
  ToolbarHintAlign,
  ToolbarHintConfig,
  ToolbarHintOverflow,
  ToolbarInlinePosition,
  ToolbarToolConfig,
  ToolbarToolsSlotPosition,
} from '../types';

export type ResolvedToolbarInlinePosition = 'after' | 'before';

export type ResolvedToolbarToolsSlotPosition =
  | ResolvedToolbarInlinePosition
  | 'replace';

export interface ResolvedToolbarHintConfig {
  align: ToolbarHintAlign;
  color?: string;
  fontSize?: string;
  overflow: ToolbarHintOverflow;
  speed: number;
  text: string;
}

export interface ResolvedToolbarHintPresentation {
  alignClass: string;
  overflowClass: string;
  textStyle?: Record<string, string>;
}

export interface ResolveToolbarHintOverflowEnabledOptions {
  hasCenterSlot?: boolean;
  hint?: null | Pick<ResolvedToolbarHintConfig, 'overflow'>;
}

export interface ResolveToolbarHintShouldScrollOptions
  extends ResolveToolbarHintOverflowEnabledOptions {
  tolerance?: number;
  textScrollWidth?: number;
  viewportClientWidth?: number;
}

export interface ResolvedToolbarToolsSlotState {
  after: boolean;
  before: boolean;
  hasSlot: boolean;
  replace: boolean;
}

export interface ResolvedToolbarToolsPlacement<TItem> {
  after: TItem[];
  before: TItem[];
}

export interface ResolveToolbarRegionVisibleOptions {
  extraVisible?: boolean;
  hasSlot?: boolean;
  hasSlotContent?: boolean;
  slotReplace?: boolean;
  toolsLength?: number;
}

export interface ResolveToolbarCenterVisibleOptions {
  hasCenterSlot?: boolean;
  hasHint?: boolean;
}

export interface ResolveToolbarVisibleOptions {
  builtinToolsLength?: number;
  hasActionsSlot?: boolean;
  hasToolsSlot?: boolean;
  showCenter?: boolean;
  showSearchButton?: boolean;
  showTableTitle?: boolean;
  toolsLength?: number;
}

export interface ResolvePagerVisibilityStateOptions {
  hasLeftSlot?: boolean;
  hasLeftSlotContent?: boolean;
  hasRightSlot?: boolean;
  hasRightSlotContent?: boolean;
  leftSlotReplace?: boolean;
  leftToolsLength?: number;
  paginationEnabled?: boolean;
  rightSlotReplace?: boolean;
  rightToolsLength?: number;
  showCenter?: boolean;
  showExport?: boolean;
  showPageEnd?: boolean;
  showPageHome?: boolean;
}

export interface ResolvedPagerVisibilityState {
  hasExtension: boolean;
  showCenter: boolean;
  showExportInRight: boolean;
  showLeft: boolean;
  showRight: boolean;
}

export interface ResolvePagerSlotBindingsOptions {
  leftBinding?: string;
  rightBinding?: string;
  showCenter?: boolean;
  showLeft?: boolean;
  showRight?: boolean;
  sourceSlots?: unknown;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

export function resolveToolbarInlinePosition(
  position: ToolbarInlinePosition | unknown,
  fallback: ResolvedToolbarInlinePosition = 'after'
): ResolvedToolbarInlinePosition {
  if (position === 'before' || position === 'left') {
    return 'before';
  }
  if (position === 'after' || position === 'right') {
    return 'after';
  }
  return fallback;
}

export function resolveToolbarToolsSlotPosition(
  position: ToolbarToolsSlotPosition | unknown
): ResolvedToolbarToolsSlotPosition {
  if (position === 'replace') {
    return 'replace';
  }
  return resolveToolbarInlinePosition(position, 'after');
}

export function resolveToolbarToolsSlotState(
  hasSlot: boolean,
  position: ResolvedToolbarToolsSlotPosition | unknown
): ResolvedToolbarToolsSlotState {
  const resolvedPosition = resolveToolbarToolsSlotPosition(position);
  const enabled = !!hasSlot;
  return {
    after: enabled && resolvedPosition !== 'before',
    before: enabled && resolvedPosition === 'before',
    hasSlot: enabled,
    replace: enabled && resolvedPosition === 'replace',
  };
}

export function resolveToolbarToolsPlacement<TItem>(
  tools: null | readonly TItem[] | undefined,
  position: ResolvedToolbarInlinePosition | unknown,
  fallback: ResolvedToolbarInlinePosition = 'after'
): ResolvedToolbarToolsPlacement<TItem> {
  const source = Array.isArray(tools) ? (tools as TItem[]) : [];
  const resolvedPosition = resolveToolbarInlinePosition(position, fallback);
  if (resolvedPosition === 'before') {
    return {
      after: [],
      before: source,
    };
  }
  return {
    after: source,
    before: [],
  };
}

export function resolveToolbarRegionVisible(
  options: ResolveToolbarRegionVisibleOptions
) {
  const hasSlot = !!options.hasSlot;
  const hasSlotContent = !!options.hasSlotContent;
  const slotReplace = !!options.slotReplace;
  const toolsLength = Number(options.toolsLength ?? 0);
  const hasTools = Number.isFinite(toolsLength) && toolsLength > 0;
  return (
    (hasSlot && hasSlotContent) ||
    (!slotReplace && hasTools) ||
    !!options.extraVisible
  );
}

export function resolveToolbarCenterVisible(
  options: ResolveToolbarCenterVisibleOptions
) {
  return !!options.hasCenterSlot || !!options.hasHint;
}

export function resolveToolbarVisible(
  options: ResolveToolbarVisibleOptions
) {
  const builtinToolsLength = Number(options.builtinToolsLength ?? 0);
  const toolsLength = Number(options.toolsLength ?? 0);
  const hasBuiltinTools =
    Number.isFinite(builtinToolsLength) && builtinToolsLength > 0;
  const hasTools = Number.isFinite(toolsLength) && toolsLength > 0;
  return (
    !!options.showTableTitle ||
    !!options.showCenter ||
    hasTools ||
    hasBuiltinTools ||
    !!options.showSearchButton ||
    !!options.hasActionsSlot ||
    !!options.hasToolsSlot
  );
}

export function resolvePagerVisibilityState(
  options: ResolvePagerVisibilityStateOptions
): ResolvedPagerVisibilityState {
  const showExportInRight =
    !!options.showExport && !options.rightSlotReplace;
  const showCenter = !!options.showCenter;
  const showLeft = resolveToolbarRegionVisible({
    hasSlot: options.hasLeftSlot,
    hasSlotContent: options.hasLeftSlotContent,
    slotReplace: options.leftSlotReplace,
    toolsLength: options.leftToolsLength,
  });
  const showRight = resolveToolbarRegionVisible({
    extraVisible: showExportInRight,
    hasSlot: options.hasRightSlot,
    hasSlotContent: options.hasRightSlotContent,
    slotReplace: options.rightSlotReplace,
    toolsLength: options.rightToolsLength,
  });
  const leftToolsLength = Number(options.leftToolsLength ?? 0);
  const rightToolsLength = Number(options.rightToolsLength ?? 0);
  const hasLeftTools = Number.isFinite(leftToolsLength) && leftToolsLength > 0;
  const hasRightTools =
    Number.isFinite(rightToolsLength) && rightToolsLength > 0;
  const hasExtension =
    showExportInRight ||
    (!!options.paginationEnabled &&
      (!!options.showPageHome || !!options.showPageEnd)) ||
    showCenter ||
    !!options.hasLeftSlot ||
    !!options.hasRightSlot ||
    hasLeftTools ||
    hasRightTools;
  return {
    hasExtension,
    showCenter,
    showExportInRight,
    showLeft,
    showRight,
  };
}

export function resolvePagerSlotBindings(
  options: ResolvePagerSlotBindingsOptions
): Record<string, any> | undefined {
  const sourceSlots = resolveToolbarConfigRecord(options.sourceSlots);
  const nextSlots = {
    ...sourceSlots,
  } as Record<string, any>;
  const leftBinding = isNonEmptyString(options.leftBinding)
    ? options.leftBinding.trim()
    : '__admin_table_pager_left';
  const rightBinding = isNonEmptyString(options.rightBinding)
    ? options.rightBinding.trim()
    : '__admin_table_pager_right';
  if (options.showLeft || options.showCenter) {
    nextSlots.left = leftBinding;
  }
  if (options.showRight) {
    nextSlots.right = rightBinding;
  }
  return Object.keys(nextSlots).length > 0 ? nextSlots : undefined;
}

export function resolveToolbarConfigRecord(source: unknown): Record<string, any> {
  if (!isPlainObject(source)) {
    return {};
  }
  return source;
}

function resolveToolbarHintAlign(
  align: ToolbarHintConfig['align'] | unknown
): ToolbarHintAlign {
  if (align === 'left' || align === 'right' || align === 'center') {
    return align;
  }
  return 'center';
}

function resolveToolbarHintOverflow(
  overflow: ToolbarHintConfig['overflow'] | unknown
): ToolbarHintOverflow {
  return overflow === 'scroll' ? 'scroll' : 'wrap';
}

function normalizeToolbarHintText(value: ToolbarHintConfig) {
  const text = isNonEmptyString(value.text)
    ? value.text
    : isNonEmptyString(value.content)
      ? value.content
      : '';
  return text.trim();
}

function normalizeToolbarHintFontSize(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return `${value}px`;
  }
  if (isNonEmptyString(value)) {
    return value.trim();
  }
  return undefined;
}

function normalizeToolbarHintSpeed(value: unknown) {
  const source =
    typeof value === 'number'
      ? value
      : isNonEmptyString(value)
        ? Number(value)
        : NaN;
  if (!Number.isFinite(source) || source <= 0) {
    return 14;
  }
  return Math.max(4, Math.min(120, source));
}

export function resolveToolbarHintConfig(
  hint: ToolbarConfig['hint'] | unknown
): ResolvedToolbarHintConfig | undefined {
  if (hint === undefined || hint === null || hint === false) {
    return undefined;
  }
  if (isNonEmptyString(hint)) {
    return {
      align: 'center',
      overflow: 'wrap',
      speed: 14,
      text: hint.trim(),
    };
  }
  if (!isPlainObject(hint)) {
    return undefined;
  }

  const text = normalizeToolbarHintText(hint as ToolbarHintConfig);
  if (!text) {
    return undefined;
  }

  const config = hint as ToolbarHintConfig;
  return {
    align: resolveToolbarHintAlign(config.align),
    color: isNonEmptyString(config.color) ? config.color.trim() : undefined,
    fontSize: normalizeToolbarHintFontSize(config.fontSize),
    overflow: resolveToolbarHintOverflow(config.overflow),
    speed: normalizeToolbarHintSpeed(config.speed),
    text,
  };
}

export function resolveToolbarHintPresentation(
  hint: null | ResolvedToolbarHintConfig | undefined
): ResolvedToolbarHintPresentation {
  const alignClass = `is-${hint?.align ?? 'center'}`;
  const overflowClass = hint?.overflow === 'scroll' ? 'is-scroll' : 'is-wrap';
  if (!hint) {
    return {
      alignClass,
      overflowClass,
      textStyle: undefined,
    };
  }
  const textStyle: Record<string, string> = {};
  if (hint.color) {
    textStyle.color = hint.color;
  }
  if (hint.fontSize) {
    textStyle.fontSize = hint.fontSize;
  }
  if (hint.overflow === 'scroll') {
    textStyle['--admin-table-toolbar-hint-duration'] = `${hint.speed}s`;
  }
  return {
    alignClass,
    overflowClass,
    textStyle,
  };
}

export function resolveToolbarHintOverflowEnabled(
  options: ResolveToolbarHintOverflowEnabledOptions
) {
  if (options.hasCenterSlot) {
    return false;
  }
  return options.hint?.overflow === 'scroll';
}

export function resolveToolbarHintShouldScroll(
  options: ResolveToolbarHintShouldScrollOptions
) {
  if (!resolveToolbarHintOverflowEnabled(options)) {
    return false;
  }
  const viewportWidth = Number(options.viewportClientWidth);
  const textWidth = Number(options.textScrollWidth);
  if (!Number.isFinite(viewportWidth) || viewportWidth <= 0) {
    return false;
  }
  if (!Number.isFinite(textWidth) || textWidth <= 0) {
    return false;
  }
  const tolerance = Number(options.tolerance);
  const safeTolerance =
    Number.isFinite(tolerance) && tolerance >= 0 ? tolerance : 1;
  return textWidth > viewportWidth + safeTolerance;
}

export function resolveToolbarActionTypeClass(type: unknown) {
  const value = typeof type === 'string' ? type.trim().toLowerCase() : '';
  if (!value || value === 'default') {
    return '';
  }
  if (value === 'clear' || value === 'text' || value === 'text-clear') {
    return 'is-clear';
  }
  const semanticTypes = new Set([
    'primary',
    'success',
    'warning',
    'danger',
    'error',
    'info',
  ]);
  if (semanticTypes.has(value)) {
    return `is-${value}`;
  }

  const suffixMatched = value.match(
    /^(primary|success|warning|danger|error|info)-(outline|border|text)$/
  );
  if (suffixMatched) {
    const [, color, variant] = suffixMatched;
    return variant === 'text'
      ? `is-${color}-text`
      : `is-${color}-outline`;
  }

  const prefixMatched = value.match(
    /^(outline|border|text)-(primary|success|warning|danger|error|info)$/
  );
  if (prefixMatched) {
    const [, variant, color] = prefixMatched;
    return variant === 'text'
      ? `is-${color}-text`
      : `is-${color}-outline`;
  }
  return '';
}

export function resolveToolbarActionThemeClass(
  tool: null | Pick<ToolbarToolConfig, 'followTheme' | 'themeColor' | 'type'> | undefined
) {
  if (!tool) {
    return '';
  }
  const followTheme = typeof tool.followTheme === 'boolean'
    ? tool.followTheme
    : typeof tool.themeColor === 'boolean'
      ? tool.themeColor
      : false;
  if (followTheme !== false) {
    return '';
  }
  const typeClass = resolveToolbarActionTypeClass(tool.type);
  if (!typeClass) {
    return '';
  }
  if (
    typeClass === 'is-primary' ||
    typeClass === 'is-primary-outline' ||
    typeClass === 'is-primary-text' ||
    typeClass === 'is-clear'
  ) {
    return '';
  }
  return 'is-static-color';
}
