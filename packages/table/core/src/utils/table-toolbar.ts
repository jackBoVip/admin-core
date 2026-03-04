/**
 * Table Core 工具栏样式与布局工具。
 * @description 提供工具栏项位置、按钮类名与提示配置的标准化处理。
 */
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

/**
 * 工具项内联布局位置（标准化后）。
 */
export type ResolvedToolbarInlinePosition = 'after' | 'before';

/**
 * 工具插槽布局位置（标准化后）。
 * `replace` 表示由插槽完全替换内置工具区。
 */
export type ResolvedToolbarToolsSlotPosition =
  | ResolvedToolbarInlinePosition
  | 'replace';

/**
 * 工具栏提示语配置解析结果。
 */
export interface ResolvedToolbarHintConfig {
  /** 提示文本对齐方式。 */
  align: ToolbarHintAlign;
  /** 提示文本颜色。 */
  color?: string;
  /** 提示文本字号。 */
  fontSize?: string;
  /** 溢出处理方式。 */
  overflow: ToolbarHintOverflow;
  /** 滚动模式下的动画时长（秒）。 */
  speed: number;
  /** 提示文本内容。 */
  text: string;
}

/**
 * 工具栏提示语展示态信息。
 */
export interface ResolvedToolbarHintPresentation {
  /** 对齐样式类。 */
  alignClass: string;
  /** 溢出样式类。 */
  overflowClass: string;
  /** 文本样式对象。 */
  textStyle?: Record<string, string>;
}

/**
 * 判断提示语是否允许溢出滚动所需参数。
 */
export interface ResolveToolbarHintOverflowEnabledOptions {
  /** 是否存在中心插槽。 */
  hasCenterSlot?: boolean;
  /** 提示语配置。 */
  hint?: null | Pick<ResolvedToolbarHintConfig, 'overflow'>;
}

/**
 * 判断提示语是否需要启动滚动动画所需参数。
 */
export interface ResolveToolbarHintShouldScrollOptions
  extends ResolveToolbarHintOverflowEnabledOptions {
  /** 容差像素。 */
  tolerance?: number;
  /** 文本滚动宽度。 */
  textScrollWidth?: number;
  /** 可视区宽度。 */
  viewportClientWidth?: number;
}

/**
 * 工具插槽启用状态。
 */
export interface ResolvedToolbarToolsSlotState {
  /** 是否将插槽放在工具后方。 */
  after: boolean;
  /** 是否将插槽放在工具前方。 */
  before: boolean;
  /** 是否存在工具插槽。 */
  hasSlot: boolean;
  /** 是否替换内置工具区。 */
  replace: boolean;
}

/**
 * 工具项前后分组结果。
 */
export interface ResolvedToolbarToolsPlacement<TItem> {
  /** 后置工具项。 */
  after: TItem[];
  /** 前置工具项。 */
  before: TItem[];
}

/**
 * 工具栏区域可见性判定参数。
 */
export interface ResolveToolbarRegionVisibleOptions {
  /** 额外显示条件。 */
  extraVisible?: boolean;
  /** 是否存在对应插槽。 */
  hasSlot?: boolean;
  /** 插槽是否有内容。 */
  hasSlotContent?: boolean;
  /** 插槽是否替换默认区域。 */
  slotReplace?: boolean;
  /** 区域内工具数量。 */
  toolsLength?: number;
}

/**
 * 工具栏中间区域可见性判定参数。
 */
export interface ResolveToolbarCenterVisibleOptions {
  /** 是否存在中间插槽。 */
  hasCenterSlot?: boolean;
  /** 是否存在提示语。 */
  hasHint?: boolean;
}

/**
 * 工具栏整体可见性判定参数。
 */
export interface ResolveToolbarVisibleOptions {
  /** 内置工具数量。 */
  builtinToolsLength?: number;
  /** 是否存在动作插槽。 */
  hasActionsSlot?: boolean;
  /** 是否存在工具插槽。 */
  hasToolsSlot?: boolean;
  /** 是否显示中间区域。 */
  showCenter?: boolean;
  /** 是否显示搜索按钮。 */
  showSearchButton?: boolean;
  /** 是否显示标题。 */
  showTableTitle?: boolean;
  /** 自定义工具数量。 */
  toolsLength?: number;
}

/**
 * 分页扩展区可见性判定参数。
 */
export interface ResolvePagerVisibilityStateOptions {
  /** 是否存在左侧插槽。 */
  hasLeftSlot?: boolean;
  /** 左侧插槽是否有内容。 */
  hasLeftSlotContent?: boolean;
  /** 是否存在右侧插槽。 */
  hasRightSlot?: boolean;
  /** 右侧插槽是否有内容。 */
  hasRightSlotContent?: boolean;
  /** 左侧插槽是否替换默认区域。 */
  leftSlotReplace?: boolean;
  /** 左侧工具数量。 */
  leftToolsLength?: number;
  /** 分页功能是否启用。 */
  paginationEnabled?: boolean;
  /** 右侧插槽是否替换默认区域。 */
  rightSlotReplace?: boolean;
  /** 右侧工具数量。 */
  rightToolsLength?: number;
  /** 是否显示中间区域。 */
  showCenter?: boolean;
  /** 是否显示导出入口。 */
  showExport?: boolean;
  /** 是否显示末页按钮。 */
  showPageEnd?: boolean;
  /** 是否显示首页按钮。 */
  showPageHome?: boolean;
}

/**
 * 分页扩展区可见性结果。
 */
export interface ResolvedPagerVisibilityState {
  /** 是否存在任意扩展内容。 */
  hasExtension: boolean;
  /** 是否显示中间区域。 */
  showCenter: boolean;
  /** 是否在右侧显示导出入口。 */
  showExportInRight: boolean;
  /** 是否显示左侧区域。 */
  showLeft: boolean;
  /** 是否显示右侧区域。 */
  showRight: boolean;
}

/**
 * 分页插槽绑定解析参数。
 */
export interface ResolvePagerSlotBindingsOptions {
  /** 左侧绑定键。 */
  leftBinding?: string;
  /** 右侧绑定键。 */
  rightBinding?: string;
  /** 是否显示中间区域。 */
  showCenter?: boolean;
  /** 是否显示左侧区域。 */
  showLeft?: boolean;
  /** 是否显示右侧区域。 */
  showRight?: boolean;
  /** 原始插槽绑定对象。 */
  sourceSlots?: unknown;
}

/**
 * 判断值是否为非空字符串。
 * @param value 待判断值。
 * @returns 非空字符串时返回 `true`。
 */
function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * 规范化工具内联位置。
 * 兼容 `left/right` 与 `before/after` 两套写法。
 * @param position 原始位置值。
 * @param fallback 兜底位置。
 * @returns 标准化后的位置值。
 */
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

/**
 * 规范化工具插槽位置。
 * @param position 原始位置值。
 * @returns `before/after/replace`。
 */
export function resolveToolbarToolsSlotPosition(
  position: ToolbarToolsSlotPosition | unknown
): ResolvedToolbarToolsSlotPosition {
  if (position === 'replace') {
    return 'replace';
  }
  return resolveToolbarInlinePosition(position, 'after');
}

/**
 * 解析工具插槽启用状态。
 * @param hasSlot 是否声明了插槽。
 * @param position 插槽位置配置。
 * @returns 插槽状态对象。
 */
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

/**
 * 按位置将工具集合分配到前后区域。
 * @template TItem 工具项类型。
 * @param tools 原始工具项数组。
 * @param position 目标位置。
 * @param fallback 兜底位置。
 * @returns 前后分组结果。
 */
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

/**
 * 判断工具栏区域是否可见。
 * 满足以下任一条件即显示：插槽有内容、非替换模式且有工具、额外显示条件为真。
 * @param options 判定参数。
 * @returns 区域是否显示。
 */
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

/**
 * 判断工具栏中间区域是否可见。
 * @param options 判定参数。
 * @returns 中间区域是否显示。
 */
export function resolveToolbarCenterVisible(
  options: ResolveToolbarCenterVisibleOptions
) {
  return !!options.hasCenterSlot || !!options.hasHint;
}

/**
 * 判断工具栏整体是否可见。
 * @param options 判定参数。
 * @returns 工具栏是否显示。
 */
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

/**
 * 解析分页扩展区展示状态。
 * @param options 判定参数。
 * @returns 分页扩展区状态结果。
 */
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

/**
 * 解析分页左右插槽绑定对象。
 * @param options 绑定解析参数。
 * @returns 绑定对象；无可用绑定时返回 `undefined`。
 */
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

/**
 * 将未知输入规范为对象记录。
 * @param source 原始输入。
 * @returns 合法对象或空对象。
 */
export function resolveToolbarConfigRecord(source: unknown): Record<string, any> {
  if (!isPlainObject(source)) {
    return {};
  }
  return source;
}

/**
 * 解析提示语对齐方式。
 * @param align 原始对齐值。
 * @returns 标准对齐值，默认 `center`。
 */
function resolveToolbarHintAlign(
  align: ToolbarHintConfig['align'] | unknown
): ToolbarHintAlign {
  if (align === 'left' || align === 'right' || align === 'center') {
    return align;
  }
  return 'center';
}

/**
 * 解析提示语溢出策略。
 * @param overflow 原始溢出值。
 * @returns 标准溢出策略，默认 `wrap`。
 */
function resolveToolbarHintOverflow(
  overflow: ToolbarHintConfig['overflow'] | unknown
): ToolbarHintOverflow {
  return overflow === 'scroll' ? 'scroll' : 'wrap';
}

/**
 * 规范化提示语文本。
 * `text` 优先级高于 `content`。
 * @param value 提示语配置。
 * @returns 去空格后的文本。
 */
function normalizeToolbarHintText(value: ToolbarHintConfig) {
  const text = isNonEmptyString(value.text)
    ? value.text
    : isNonEmptyString(value.content)
      ? value.content
      : '';
  return text.trim();
}

/**
 * 规范化提示语字号。
 * @param value 原始字号值。
 * @returns 合法字号字符串；无效时返回 `undefined`。
 */
function normalizeToolbarHintFontSize(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return `${value}px`;
  }
  if (isNonEmptyString(value)) {
    return value.trim();
  }
  return undefined;
}

/**
 * 规范化提示语滚动速度（秒）。
 * 结果范围限制在 `4~120`，默认 `14`。
 * @param value 原始速度值。
 * @returns 可用速度值。
 */
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

/**
 * 解析工具栏提示语配置。
 * 支持字符串快捷写法与对象配置写法。
 * @param hint 原始提示语配置。
 * @returns 标准化提示语配置；不可用时返回 `undefined`。
 */
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

/**
 * 解析提示语展示态样式。
 * @param hint 标准化提示语配置。
 * @returns 展示态对象（类名与内联样式）。
 */
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

/**
 * 判断是否启用提示语溢出滚动能力。
 * 中间插槽存在时强制禁用滚动。
 * @param options 判定参数。
 * @returns 是否启用滚动能力。
 */
export function resolveToolbarHintOverflowEnabled(
  options: ResolveToolbarHintOverflowEnabledOptions
) {
  if (options.hasCenterSlot) {
    return false;
  }
  return options.hint?.overflow === 'scroll';
}

/**
 * 判断提示语是否需要启动滚动动画。
 * @param options 判定参数。
 * @returns 需要滚动时返回 `true`。
 */
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

/**
 * 将动作类型映射为按钮样式类。
 * @param type 原始类型值。
 * @returns 对应样式类；默认/无法识别时返回空字符串。
 */
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

/**
 * 解析动作按钮主题颜色策略类。
 * 当关闭跟随主题且类型为非主色语义类型时，返回静态色类名。
 * @param tool 工具项配置。
 * @returns 主题策略类名。
 */
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
