/**
 * 可防抖执行的任务句柄。
 */
export interface DebouncedTask {
  /** 取消尚未触发的任务。 */
  cancel: () => void;
  /** 触发防抖任务。 */
  run: () => void;
}

/**
 * 创建一个防抖任务。
 *
 * @param task 延迟执行的任务函数。
 * @param delay 防抖延迟（毫秒）。
 * @returns 防抖任务句柄。
 */
export function createDebouncedTask(task: () => void, delay = 300): DebouncedTask {
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 取消当前待执行任务。
   * @returns 无返回值。
   */
  const cancel = () => {
    if (!timer) return;
    clearTimeout(timer);
    timer = null;
  };

  /**
   * 触发一次防抖调度。
   * @returns 无返回值。
   */
  const run = () => {
    cancel();
    timer = setTimeout(() => {
      timer = null;
      task();
    }, delay);
  };
  return { cancel, run };
}
