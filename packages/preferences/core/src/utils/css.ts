/**
 * CSS 工具函数
 */

/**
 * 检查是否在浏览器环境
 */
const isBrowser = typeof document !== 'undefined';

/**
 * 获取默认元素（SSR 安全）
 */
function getDefaultElement(): HTMLElement | null {
  return isBrowser ? document.documentElement : null;
}

/**
 * 设置单个 CSS 变量
 * @param name - 变量名（含 --）
 * @param value - 变量值
 * @param element - 目标元素（默认 :root）
 * @param priority - 优先级（'important' 或空）
 */
export function setCSSVariable(
  name: string,
  value: string,
  element?: HTMLElement,
  priority: string = ''
): void {
  const el = element ?? getDefaultElement();
  if (!el) return;
  el.style.setProperty(name, value, priority);
}

/**
 * 获取 CSS 变量值
 * @param name - 变量名（含 --）
 * @param element - 目标元素（默认 :root）
 * @returns 变量值
 */
export function getCSSVariable(
  name: string,
  element?: HTMLElement
): string {
  const el = element ?? getDefaultElement();
  if (!el) return '';
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/**
 * 移除 CSS 变量
 * @param name - 变量名（含 --）
 * @param element - 目标元素（默认 :root）
 */
export function removeCSSVariable(
  name: string,
  element?: HTMLElement
): void {
  const el = element ?? getDefaultElement();
  if (!el) return;
  el.style.removeProperty(name);
}

/** CSS 变量缓存最大大小（避免内存无限增长） */
const CSS_CACHE_MAX_SIZE = 500;

/** 上次设置的 CSS 变量缓存（避免重复设置相同值） */
const lastCSSVariables = new Map<string, string>();

/** 需要强制更新的 CSS 变量名（确保变更立即生效） */
const FORCE_UPDATE_VARS = new Set(['--radius', '--font-scale', '--font-size-base', '--menu-font-size']);

/**
 * 维护缓存大小限制
 * @description 当缓存超过最大大小时，移除最早添加的条目
 */
function maintainCacheSize(): void {
  if (lastCSSVariables.size > CSS_CACHE_MAX_SIZE) {
    // 移除最早的 1/4 条目
    const keysToDelete = Array.from(lastCSSVariables.keys()).slice(0, CSS_CACHE_MAX_SIZE / 4);
    keysToDelete.forEach(key => lastCSSVariables.delete(key));
  }
}

/**
 * 批量设置 CSS 变量（带变化检查优化）
 * @param variables - CSS 变量对象
 * @param element - 目标元素（默认 :root）
 */
export function updateCSSVariables(
  variables: Record<string, string>,
  element?: HTMLElement
): void {
  const el = element ?? getDefaultElement();
  if (!el) return;
  
  Object.entries(variables).forEach(([name, value]) => {
    // 对于强制更新的变量，跳过缓存检查，直接设置
    if (FORCE_UPDATE_VARS.has(name)) {
      setCSSVariable(name, value, el);
      lastCSSVariables.set(name, value);
      return;
    }
    
    // 检查是否与上次设置的值相同
    const lastValue = lastCSSVariables.get(name);
    if (lastValue !== value) {
      setCSSVariable(name, value, el);
      lastCSSVariables.set(name, value);
    }
  });
  
  // 维护缓存大小限制
  maintainCacheSize();
}

/**
 * 清除 CSS 变量缓存
 * @description 在需要强制刷新所有变量时调用
 */
export function clearCSSVariablesCache(): void {
  lastCSSVariables.clear();
}

/**
 * 批量移除 CSS 变量
 * @param names - 变量名数组
 * @param element - 目标元素（默认 :root）
 */
export function removeCSSVariables(
  names: string[],
  element?: HTMLElement
): void {
  const el = element ?? getDefaultElement();
  if (!el) return;
  names.forEach((name) => removeCSSVariable(name, el));
}

/**
 * 获取所有 CSS 变量（以指定前缀开头）
 * @param prefix - 前缀（如 '--admin-'）
 * @param element - 目标元素（默认 :root）
 * @returns CSS 变量对象
 */
export function getAllCSSVariables(
  prefix: string,
  element?: HTMLElement
): Record<string, string> {
  const el = element ?? getDefaultElement();
  if (!el) return {};
  
  const styles = getComputedStyle(el);
  const variables: Record<string, string> = {};

  // 获取所有 CSS 属性名
  for (let i = 0; i < styles.length; i++) {
    const name = styles[i];
    if (name.startsWith(prefix)) {
      variables[name] = styles.getPropertyValue(name).trim();
    }
  }

  return variables;
}

/**
 * 添加 CSS 类名
 * @param className - 类名
 * @param element - 目标元素（默认 document.documentElement）
 */
export function addClass(
  className: string,
  element?: HTMLElement
): void {
  const el = element ?? getDefaultElement();
  if (!el) return;
  el.classList.add(className);
}

/**
 * 移除 CSS 类名
 * @param className - 类名
 * @param element - 目标元素（默认 document.documentElement）
 */
export function removeClass(
  className: string,
  element?: HTMLElement
): void {
  const el = element ?? getDefaultElement();
  if (!el) return;
  el.classList.remove(className);
}

/**
 * 切换 CSS 类名
 * @param className - 类名
 * @param force - 强制添加/移除
 * @param element - 目标元素（默认 document.documentElement）
 * @returns 操作后是否包含该类名
 */
export function toggleClass(
  className: string,
  force?: boolean,
  element?: HTMLElement
): boolean {
  const el = element ?? getDefaultElement();
  if (!el) return false;
  return el.classList.toggle(className, force);
}

/**
 * 检查是否包含 CSS 类名
 * @param className - 类名
 * @param element - 目标元素（默认 document.documentElement）
 * @returns 是否包含
 */
export function hasClass(
  className: string,
  element?: HTMLElement
): boolean {
  const el = element ?? getDefaultElement();
  if (!el) return false;
  return el.classList.contains(className);
}
