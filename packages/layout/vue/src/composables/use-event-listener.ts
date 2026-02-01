/**
 * useEventListener Composable
 * @description 统一管理事件监听器，自动在组件卸载时移除
 */

import { onUnmounted, ref, watch, type Ref } from 'vue';

type EventTarget = Window | Document | HTMLElement | null | undefined;
type EventHandler<E extends Event> = (event: E) => void;

interface EventListenerInfo {
  target: EventTarget;
  type: string;
  handler: EventListener;
  options?: AddEventListenerOptions;
}

/**
 * 事件监听器管理器
 * 在组件卸载时自动移除所有事件监听器
 */
export function useEventListener() {
  const listeners = ref<EventListenerInfo[]>([]);

  /**
   * 添加事件监听器
   * @param target - 事件目标（window, document, 或 HTMLElement）
   * @param type - 事件类型
   * @param handler - 事件处理函数
   * @param options - 事件选项
   * @returns 移除监听器的函数
   */
  function on<E extends Event>(
    target: EventTarget,
    type: string,
    handler: EventHandler<E>,
    options?: AddEventListenerOptions
  ): () => void {
    if (!target) {
      return () => {};
    }

    const wrappedHandler = handler as EventListener;
    target.addEventListener(type, wrappedHandler, options);

    const info: EventListenerInfo = {
      target,
      type,
      handler: wrappedHandler,
      options,
    };
    listeners.value.push(info);

    // 返回移除函数
    return () => off(info);
  }

  /**
   * 移除指定的事件监听器
   */
  function off(info: EventListenerInfo): void {
    if (info.target) {
      info.target.removeEventListener(info.type, info.handler, info.options);
    }
    const index = listeners.value.indexOf(info);
    if (index > -1) {
      listeners.value.splice(index, 1);
    }
  }

  /**
   * 移除所有事件监听器
   */
  function offAll(): void {
    listeners.value.forEach((info) => {
      if (info.target) {
        info.target.removeEventListener(info.type, info.handler, info.options);
      }
    });
    listeners.value = [];
  }

  // 组件卸载时自动清理
  onUnmounted(() => {
    offAll();
  });

  return {
    on,
    off,
    offAll,
  };
}

/**
 * 监听窗口 resize 事件
 * @param handler - 事件处理函数
 * @param options - 事件选项
 */
export function useWindowResize(
  handler: EventHandler<UIEvent>,
  options?: AddEventListenerOptions
): () => void {
  const { on } = useEventListener();
  return on(window, 'resize', handler, options);
}

/**
 * 监听窗口 scroll 事件
 * @param handler - 事件处理函数
 * @param options - 事件选项
 */
export function useWindowScroll(
  handler: EventHandler<Event>,
  options?: AddEventListenerOptions
): () => void {
  const { on } = useEventListener();
  return on(window, 'scroll', handler, { passive: true, ...options });
}

/**
 * 监听键盘事件
 * @param handler - 事件处理函数
 * @param options - 事件选项
 */
export function useKeydown(
  handler: EventHandler<KeyboardEvent>,
  options?: AddEventListenerOptions
): () => void {
  const { on } = useEventListener();
  return on(document, 'keydown', handler, options);
}

/**
 * 监听点击外部区域
 * @param target - 目标元素引用
 * @param handler - 点击外部时的处理函数
 */
export function useClickOutside(
  target: Ref<HTMLElement | null | undefined>,
  handler: () => void
): () => void {
  const { on } = useEventListener();
  
  const clickHandler = (event: MouseEvent) => {
    const el = target.value;
    if (el && !el.contains(event.target as Node)) {
      handler();
    }
  };

  return on(document, 'click', clickHandler);
}

/**
 * 监听元素大小变化
 * @param target - 目标元素引用
 * @param handler - 大小变化时的处理函数
 */
export function useResizeObserver(
  target: Ref<HTMLElement | null | undefined>,
  handler: (entry: ResizeObserverEntry) => void
): () => void {
  let observer: ResizeObserver | null = null;

  const stop = () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
  };

  watch(
    target,
    (el) => {
      stop();
      if (el) {
        observer = new ResizeObserver((entries) => {
          if (entries[0]) {
            handler(entries[0]);
          }
        });
        observer.observe(el);
      }
    },
    { immediate: true }
  );

  onUnmounted(stop);

  return stop;
}
