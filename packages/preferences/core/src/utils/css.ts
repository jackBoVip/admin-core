/**
 * CSS 工具函数
 */

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
  element: HTMLElement = document.documentElement,
  priority: string = ''
): void {
  element.style.setProperty(name, value, priority);
}

/**
 * 获取 CSS 变量值
 * @param name - 变量名（含 --）
 * @param element - 目标元素（默认 :root）
 * @returns 变量值
 */
export function getCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): string {
  return getComputedStyle(element).getPropertyValue(name).trim();
}

/**
 * 移除 CSS 变量
 * @param name - 变量名（含 --）
 * @param element - 目标元素（默认 :root）
 */
export function removeCSSVariable(
  name: string,
  element: HTMLElement = document.documentElement
): void {
  element.style.removeProperty(name);
}

/** 上次设置的 CSS 变量缓存（避免重复设置相同值） */
const lastCSSVariables = new Map<string, string>();

/** 需要强制更新的 CSS 变量名（确保变更立即生效） */
const FORCE_UPDATE_VARS = new Set(['--radius', '--font-scale', '--font-size-base', '--menu-font-size']);

/**
 * 批量设置 CSS 变量（带变化检查优化）
 * @param variables - CSS 变量对象
 * @param element - 目标元素（默认 :root）
 */
export function updateCSSVariables(
  variables: Record<string, string>,
  element: HTMLElement = document.documentElement
): void {
  Object.entries(variables).forEach(([name, value]) => {
    // 对于强制更新的变量，跳过缓存检查，直接设置
    if (FORCE_UPDATE_VARS.has(name)) {
      setCSSVariable(name, value, element);
      lastCSSVariables.set(name, value);
      return;
    }
    
    // 检查是否与上次设置的值相同
    const lastValue = lastCSSVariables.get(name);
    if (lastValue !== value) {
      setCSSVariable(name, value, element);
      lastCSSVariables.set(name, value);
    }
  });
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
  element: HTMLElement = document.documentElement
): void {
  names.forEach((name) => removeCSSVariable(name, element));
}

/**
 * 获取所有 CSS 变量（以指定前缀开头）
 * @param prefix - 前缀（如 '--admin-'）
 * @param element - 目标元素（默认 :root）
 * @returns CSS 变量对象
 */
export function getAllCSSVariables(
  prefix: string,
  element: HTMLElement = document.documentElement
): Record<string, string> {
  const styles = getComputedStyle(element);
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
  element: HTMLElement = document.documentElement
): void {
  element.classList.add(className);
}

/**
 * 移除 CSS 类名
 * @param className - 类名
 * @param element - 目标元素（默认 document.documentElement）
 */
export function removeClass(
  className: string,
  element: HTMLElement = document.documentElement
): void {
  element.classList.remove(className);
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
  element: HTMLElement = document.documentElement
): boolean {
  return element.classList.toggle(className, force);
}

/**
 * 检查是否包含 CSS 类名
 * @param className - 类名
 * @param element - 目标元素（默认 document.documentElement）
 * @returns 是否包含
 */
export function hasClass(
  className: string,
  element: HTMLElement = document.documentElement
): boolean {
  return element.classList.contains(className);
}
