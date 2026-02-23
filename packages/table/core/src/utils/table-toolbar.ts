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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isPlainObject(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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
