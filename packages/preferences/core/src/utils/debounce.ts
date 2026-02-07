/**
 * 防抖工具
 * @description 创建可取消的防抖回调
 */

export interface DebouncedCallback<T> {
  trigger: (value: T) => void;
  cancel: () => void;
}

/**
 * 防抖函数
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
 * 节流函数
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

export function createDebouncedCallback<T>(
  callback: (value: T) => void,
  delay = 300
): DebouncedCallback<T> {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

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
