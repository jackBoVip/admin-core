/**
 * useTimer Composable
 * @description 统一管理定时器，自动在组件卸载时清理
 */

import { onUnmounted, ref } from 'vue';

/**
 * 定时器管理器
 * 在组件卸载时自动清理所有定时器
 */
export function useTimer() {
  const timers = ref<Set<ReturnType<typeof setTimeout>>>(new Set());
  const intervals = ref<Set<ReturnType<typeof setInterval>>>(new Set());

  /**
   * 创建一个 setTimeout，自动管理清理
   * @param callback - 回调函数
   * @param delay - 延迟时间（毫秒）
   * @returns 定时器 ID
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
   * 创建一个 setInterval，自动管理清理
   * @param callback - 回调函数
   * @param delay - 间隔时间（毫秒）
   * @returns 定时器 ID
   */
  function setInterval_(callback: () => void, delay: number): ReturnType<typeof setInterval> {
    const id = setInterval(callback, delay);
    intervals.value.add(id);
    return id;
  }

  /**
   * 清除指定的 timeout
   * @param id - 定时器 ID
   */
  function clearTimeout_(id: ReturnType<typeof setTimeout> | null | undefined): void {
    if (id != null) {
      clearTimeout(id);
      timers.value.delete(id);
    }
  }

  /**
   * 清除指定的 interval
   * @param id - 定时器 ID
   */
  function clearInterval_(id: ReturnType<typeof setInterval> | null | undefined): void {
    if (id != null) {
      clearInterval(id);
      intervals.value.delete(id);
    }
  }

  /**
   * 清除所有定时器
   */
  function clearAll(): void {
    timers.value.forEach((id) => clearTimeout(id));
    timers.value.clear();
    intervals.value.forEach((id) => clearInterval(id));
    intervals.value.clear();
  }

  // 组件卸载时自动清理
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
 * 创建一个防抖定时器
 * @description 在组件卸载时自动清理
 */
export function useDebounce() {
  let timer: ReturnType<typeof setTimeout> | null = null;

  function debounce(callback: () => void, delay: number): void {
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      callback();
      timer = null;
    }, delay);
  }

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
 * 创建一个节流定时器
 * @description 在组件卸载时自动清理
 */
export function useThrottle() {
  let lastTime = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;

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
