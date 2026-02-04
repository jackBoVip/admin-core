/**
 * 防抖工具
 * @description 创建可取消的防抖回调
 */

export interface DebouncedCallback<T> {
  trigger: (value: T) => void;
  cancel: () => void;
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
