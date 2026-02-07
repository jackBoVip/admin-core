/**
 * Tooltip positioning helpers
 * @description Position preference tooltips with fixed coordinates to avoid clipping.
 */
import { isBrowser } from './platform';

const DEFAULT_TOOLTIP_OFFSET = 8;
const DEFAULT_TOOLTIP_ARROW_OFFSET = 6;
const DEFAULT_TOOLTIP_MAX_WIDTH = 240;
const DEFAULT_TOOLTIP_MARGIN = 12;

const parseLength = (value: string, base: number): number | null => {
  const raw = value.trim();
  if (!raw) return null;
  if (raw.endsWith('rem')) {
    const num = Number.parseFloat(raw);
    return Number.isFinite(num) ? num * base : null;
  }
  if (raw.endsWith('em')) {
    const num = Number.parseFloat(raw);
    return Number.isFinite(num) ? num * base : null;
  }
  if (raw.endsWith('px')) {
    const num = Number.parseFloat(raw);
    return Number.isFinite(num) ? num : null;
  }
  const num = Number.parseFloat(raw);
  return Number.isFinite(num) ? num : null;
};

const readRootLength = (name: string, fallback: number): number => {
  if (!isBrowser) return fallback;
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const base = Number.parseFloat(styles.fontSize) || 16;
  const raw = styles.getPropertyValue(name);
  const parsed = parseLength(raw, base);
  return parsed ?? fallback;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const findTooltipTarget = (eventTarget: EventTarget | null): HTMLElement | null => {
  const node = eventTarget as HTMLElement | null;
  if (!node) return null;
  return node.closest?.('[data-preference-tooltip]') as HTMLElement | null;
};

const createTooltipElements = (): { tooltip: HTMLDivElement; arrow: HTMLDivElement } => {
  const tooltip = document.createElement('div');
  tooltip.className = 'preferences-tooltip';
  tooltip.setAttribute('data-state', 'closed');

  const arrow = document.createElement('div');
  arrow.className = 'preferences-tooltip-arrow';
  arrow.setAttribute('data-state', 'closed');

  document.body.appendChild(tooltip);
  document.body.appendChild(arrow);

  return { tooltip, arrow };
};

/**
 * Attach tooltip positioning on hover/focus.
 * @param root - Container element or document to listen on
 * @returns cleanup function
 */
export const setupPreferenceTooltip = (root?: HTMLElement | Document): (() => void) => {
  if (!isBrowser) return () => {};
  const container: HTMLElement | Document = root ?? document;

  let tooltipEl: HTMLDivElement | null = null;
  let arrowEl: HTMLDivElement | null = null;
  let currentTarget: HTMLElement | null = null;
  let rafId = 0;

  const ensureTooltip = () => {
    if (!tooltipEl || !arrowEl) {
      const created = createTooltipElements();
      tooltipEl = created.tooltip;
      arrowEl = created.arrow;
    }
  };

  const updatePosition = (target: HTMLElement) => {
    if (!tooltipEl || !arrowEl) return;
    const rect = target.getBoundingClientRect();
    const offset = readRootLength('--tooltip-offset', DEFAULT_TOOLTIP_OFFSET);
    const arrowOffset = readRootLength('--tooltip-arrow-offset', DEFAULT_TOOLTIP_ARROW_OFFSET);
    const maxWidth = readRootLength('--pref-tooltip-max-width', DEFAULT_TOOLTIP_MAX_WIDTH);
    const margin = readRootLength('--pref-tooltip-margin', DEFAULT_TOOLTIP_MARGIN);

    const tooltipWidth = Math.min(maxWidth, tooltipEl.getBoundingClientRect().width || maxWidth);
    const half = tooltipWidth / 2;
    let centerX = rect.left + rect.width / 2;
    const minX = margin + half;
    const maxX = window.innerWidth - margin - half;
    centerX = clamp(centerX, minX, maxX);

    const tooltipTop = rect.bottom + offset;
    const arrowTop = rect.bottom + arrowOffset;

    tooltipEl.style.left = `${centerX}px`;
    tooltipEl.style.top = `${tooltipTop}px`;
    arrowEl.style.left = `${centerX}px`;
    arrowEl.style.top = `${arrowTop}px`;
  };

  const showTooltip = (target: HTMLElement) => {
    const content = target.getAttribute('data-preference-tooltip');
    if (!content) return;
    ensureTooltip();
    if (!tooltipEl || !arrowEl) return;

    currentTarget?.removeAttribute('data-tooltip-managed');
    currentTarget = target;
    currentTarget.setAttribute('data-tooltip-managed', 'true');

    tooltipEl.textContent = content;
    tooltipEl.setAttribute('data-state', 'open');
    arrowEl.setAttribute('data-state', 'open');

    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => updatePosition(target));
  };

  const hideTooltip = () => {
    if (tooltipEl) tooltipEl.setAttribute('data-state', 'closed');
    if (arrowEl) arrowEl.setAttribute('data-state', 'closed');
    currentTarget?.removeAttribute('data-tooltip-managed');
    currentTarget = null;
  };

  const handleOver = (event: Event) => {
    const target = findTooltipTarget(event.target);
    if (!target || target === currentTarget) return;
    showTooltip(target);
  };

  const handleFocus = (event: Event) => {
    const target = findTooltipTarget(event.target);
    if (!target) return;
    showTooltip(target);
  };

  const handleOut = (event: Event) => {
    const related = (event as MouseEvent).relatedTarget as HTMLElement | null;
    if (currentTarget && related && currentTarget.contains(related)) return;
    hideTooltip();
  };

  const handleScroll = () => {
    if (currentTarget) updatePosition(currentTarget);
  };

  container.addEventListener('mouseover', handleOver, true);
  container.addEventListener('focusin', handleFocus, true);
  container.addEventListener('mouseout', handleOut, true);
  container.addEventListener('focusout', handleOut, true);
  window.addEventListener('scroll', handleScroll, true);
  window.addEventListener('resize', handleScroll);

  return () => {
    container.removeEventListener('mouseover', handleOver, true);
    container.removeEventListener('focusin', handleFocus, true);
    container.removeEventListener('mouseout', handleOut, true);
    container.removeEventListener('focusout', handleOut, true);
    window.removeEventListener('scroll', handleScroll, true);
    window.removeEventListener('resize', handleScroll);
    if (rafId) cancelAnimationFrame(rafId);
    if (tooltipEl) tooltipEl.remove();
    if (arrowEl) arrowEl.remove();
  };
};
