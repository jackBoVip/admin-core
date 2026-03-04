/**
 * 定时器组合式工具。
 * @description 统一管理定时器，并在组件卸载时自动清理。
 */

import { onUnmounted, ref } from 'vue';

/**
 * 创建定时器管理器。
 *
 * @returns `setTimeout/setInterval` 及清理方法集合。
 */
export function useTimer() {
  /**
   * 托管的 `setTimeout` 定时器集合。
   * @description 便于在组件卸载或手动清理时统一取消。
   */
  const timers = ref<Set<ReturnType<typeof setTimeout>>>(new Set());
  /**
   * 托管的 `setInterval` 定时器集合。
   * @description 便于在组件卸载或手动清理时统一取消。
   */
  const intervals = ref<Set<ReturnType<typeof setInterval>>>(new Set());

  /**
   * 创建并托管一个 `setTimeout`。
   *
   * @param callback 到时执行的回调函数。
   * @param delay 延迟时间（毫秒）。
   * @returns 定时器 ID。
   */
  function setTimeout_(callback: () => void, delay: number): ReturnType<typeof setTimeout> {
    const id = setTimeout(() => {
      callback();
      timers.value.delete(id);
    }, delay);
    timers.value.add(id);
    return id;
  }

  /**
   * 创建并托管一个 `setInterval`。
   *
   * @param callback 每次触发时执行的回调函数。
   * @param delay 触发间隔（毫秒）。
   * @returns 定时器 ID。
   */
  function setInterval_(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    const id = setInterval(callback, delay);
    intervals.value.add(id);
    return id;
  }

  /**
   * 清除指定 `setTimeout` 定时器。
   *
   * @param id 定时器 ID。
   */
  function clearTimeout_(id: ReturnType<typeof setTimeout> | null | undefined): void {
    if (id !== null && id !== undefined) {
      clearTimeout(id);
      timers.value.delete(id);
    }
  }

  /**
   * 清除指定 `setInterval` 定时器。
   *
   * @param id 定时器 ID。
   */
  function clearInterval_(id: ReturnType<typeof setInterval> | null | undefined): void {
    if (id !== null && id !== undefined) {
      clearInterval(id);
      intervals.value.delete(id);
    }
  }

  /**
   * 清除当前管理器托管的全部定时器。
   */
  function clearAll(): void {
    timers.value.forEach((id) => clearTimeout(id));
    timers.value.clear();
    intervals.value.forEach((id) => clearInterval(id));
    intervals.value.clear();
  }

  /**
   * 组件卸载时自动清理全部定时器。
   */
  onUnmounted(() => {
    clearAll();
  });

  return {
    setTimeout: setTimeout_,
    setInterval: setInterval_,
    clearTimeout: clearTimeout_,
    clearInterval: clearInterval_,
    clearAll,
  };
}

/**
 * 创建防抖工具。
 * @description 在组件卸载时自动取消未触发的防抖任务。
 *
 * @returns 防抖执行函数与取消函数。
 */
export function useDebounce() {
  /**
   * 当前防抖计时器句柄。
   * @description 重复触发时会覆盖旧句柄并重新计时。
   */
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 执行防抖调度：在延迟结束后执行回调，期间重复调用会重置计时。
   *
   * @param callback 需要延迟执行的回调。
   * @param delay 防抖等待时间（毫秒）。
   */
  function debounce(callback: () => void, delay: number): void {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      callback();
      timer = null;
    }, delay);
  }

  /**
   * 取消当前待执行的防抖任务。
   */
  function cancel(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  onUnmounted(() => {
    cancel();
  });

  return {
    debounce,
    cancel,
  };
}

/**
 * 创建节流工具。
 * @description 在组件卸载时自动取消挂起的节流任务。
 *
 * @returns 节流执行函数与取消函数。
 */
export function useThrottle() {
  /**
   * 最近一次触发节流回调的时间戳。
   * @description 用于判断是否达到下一次立即执行条件。
   */
  let lastTime = 0;
  /**
   * 节流窗口内挂起的延迟执行句柄。
   * @description 仅在需要补偿尾触发时创建。
   */
  let timer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 执行节流调度：在时间窗口内最多触发一次回调。
   *
   * @param callback 受节流控制的回调函数。
   * @param delay 节流窗口大小（毫秒）。
   */
  function throttle(callback: () => void, delay: number): void {
    const now = Date.now();
    if (now - lastTime >= delay) {
      callback();
      lastTime = now;
    } else if (!timer) {
      timer = setTimeout(() => {
        callback();
        lastTime = Date.now();
        timer = null;
      }, delay - (now - lastTime));
    }
  }

  /**
   * 取消当前挂起的节流延迟执行任务。
   */
  function cancel(): void {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  }

  onUnmounted(() => {
    cancel();
  });

  return {
    throttle,
    cancel,
  };
}
