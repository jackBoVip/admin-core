/**
 * 防抖与节流工具。
 * @description 提供函数调用频率控制及可取消的回调句柄。
 */

/**
 * 可取消防抖回调句柄。
 * @template T 回调参数类型。
 */
export interface DebouncedCallback<T> {
  /** 触发防抖回调。 */
  trigger: (value: T) => void;
  /** 取消尚未执行的回调。 */
  cancel: () => void;
}

/**
 * 创建防抖函数。
 * @template T 原始函数类型。
 * @param fn 需要被防抖包装的函数。
 * @param delay 防抖等待时间（毫秒）。
 * @returns 防抖后的函数。
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
}

/**
 * 创建节流函数。
 * @template T 原始函数类型。
 * @param fn 需要被节流包装的函数。
 * @param delay 节流间隔时间（毫秒）。
 * @returns 节流后的函数。
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastTime = 0;

  return (...args: Parameters<T>) => {
    const now = Date.now();
    if (now - lastTime >= delay) {
      fn(...args);
      lastTime = now;
    }
  };
}

/**
 * 创建可取消的防抖回调。
 *
 * @param callback 防抖后执行的回调。
 * @param delay 防抖延迟（毫秒）。
 * @returns 防抖回调句柄。
 */
export function createDebouncedCallback<T>(
  callback: (value: T) => void,
  delay = 300
): DebouncedCallback<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 取消当前待执行回调。
   * @returns 无返回值。
   */
  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  /**
   * 触发一次防抖回调。
   * @param value 回调输入值。
   * @returns 无返回值。
   */
  const trigger = (value: T) => {
    cancel();
    if (delay <= 0) {
      callback(value);
      return;
    }
    timer = setTimeout(() => {
      timer = null;
      callback(value);
    }, delay);
  };

  return { trigger, cancel };
}
