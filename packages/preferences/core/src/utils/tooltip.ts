/**
 * 偏好设置 Tooltip 定位工具
 * @description 通过固定定位与边界裁剪，避免提示层在容器中被裁切。
 */
import { isBrowser } from './platform';

/** 提示层与触发节点的默认垂直间距（像素）。 */
const DEFAULT_TOOLTIP_OFFSET = 8;
/** 提示层箭头与触发节点的默认垂直间距（像素）。 */
const DEFAULT_TOOLTIP_ARROW_OFFSET = 6;
/** 提示层默认最大宽度（像素）。 */
const DEFAULT_TOOLTIP_MAX_WIDTH = 240;
/** 提示层在视口边缘保留的默认外边距（像素）。 */
const DEFAULT_TOOLTIP_MARGIN = 12;

/**
 * Tooltip 节点集合。
 */
interface TooltipElements {
  /** 提示层节点。 */
  tooltip: HTMLDivElement;
  /** 提示层箭头节点。 */
  arrow: HTMLDivElement;
}

/**
 * 解析长度值（支持 `px`/`rem`/`em`）。
 * @param value 原始长度字符串。
 * @param base 基准像素值（用于 `rem/em` 换算）。
 * @returns 解析后的像素值；失败返回 `null`。
 */
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

/**
 * 读取根节点 CSS 变量长度值。
 * @param name 变量名。
 * @param fallback 回退值。
 * @returns 解析后的像素值。
 */
const readRootLength = (name: string, fallback: number): number => {
  if (!isBrowser) return fallback;
  const root = document.documentElement;
  const styles = getComputedStyle(root);
  const base = Number.parseFloat(styles.fontSize) || 16;
  const raw = styles.getPropertyValue(name);
  const parsed = parseLength(raw, base);
  return parsed ?? fallback;
};

/**
 * 将数值限制在指定区间。
 * @param value 原始值。
 * @param min 最小值。
 * @param max 最大值。
 * @returns 夹紧后的值。
 */
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

/**
 * 查找最近的 tooltip 触发元素。
 * @param eventTarget 事件目标。
 * @returns 匹配到的触发元素。
 */
const findTooltipTarget = (eventTarget: EventTarget | null): HTMLElement | null => {
  const node = eventTarget as HTMLElement | null;
  if (!node) return null;
  return node.closest?.('[data-preference-tooltip]') as HTMLElement | null;
};

/**
 * 创建 tooltip 与箭头节点。
 * @returns 节点对象。
 */
const createTooltipElements = (): TooltipElements => {
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
 * 初始化偏好设置 Tooltip 悬浮/聚焦定位行为。
 * @param root 事件委托容器，默认使用 `document`。
 * @returns 清理函数，用于移除监听并销毁 Tooltip 节点。
 */
export const setupPreferenceTooltip = (root?: HTMLElement | Document): (() => void) => {
  if (!isBrowser) return () => {};
  const container: HTMLElement | Document = root ?? document;

  let tooltipEl: HTMLDivElement | null = null;
  let arrowEl: HTMLDivElement | null = null;
  let currentTarget: HTMLElement | null = null;
  let rafId = 0;

  /**
   * 懒创建 tooltip 与箭头节点。
   * @returns 无返回值。
   */
  const ensureTooltip = () => {
    if (!tooltipEl || !arrowEl) {
      const created = createTooltipElements();
      tooltipEl = created.tooltip;
      arrowEl = created.arrow;
    }
  };

  /**
   * 计算并更新 tooltip 位置。
   * @param target 当前触发节点。
   * @returns 无返回值。
   */
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

  /**
   * 显示 tooltip。
   * @param target 当前触发节点。
   * @returns 无返回值。
   */
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

  /**
   * 隐藏 tooltip。
   * @returns 无返回值。
   */
  const hideTooltip = () => {
    if (tooltipEl) tooltipEl.setAttribute('data-state', 'closed');
    if (arrowEl) arrowEl.setAttribute('data-state', 'closed');
    currentTarget?.removeAttribute('data-tooltip-managed');
    currentTarget = null;
  };

  /**
   * 处理鼠标移入事件。
   * @param event 事件对象。
   * @returns 无返回值。
   */
  const handleOver = (event: Event) => {
    const target = findTooltipTarget(event.target);
    if (!target || target === currentTarget) return;
    showTooltip(target);
  };

  /**
   * 处理焦点进入事件。
   * @param event 事件对象。
   * @returns 无返回值。
   */
  const handleFocus = (event: Event) => {
    const target = findTooltipTarget(event.target);
    if (!target) return;
    showTooltip(target);
  };

  /**
   * 处理鼠标移出/失焦事件。
   * @param event 事件对象。
   * @returns 无返回值。
   */
  const handleOut = (event: Event) => {
    const related = (event as MouseEvent).relatedTarget as HTMLElement | null;
    if (currentTarget && related && currentTarget.contains(related)) return;
    hideTooltip();
  };

  /**
   * 处理滚动/窗口尺寸变化事件。
   * @returns 无返回值。
   */
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
