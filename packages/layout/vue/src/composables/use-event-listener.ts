/**
 * 事件监听组合式工具。
 * @description 统一管理事件监听器，并在组件卸载时自动清理。
 */

import { onUnmounted, ref, watch, type Ref } from 'vue';

/**
 * 可绑定事件的目标类型。
 */
type EventTarget = Window | Document | HTMLElement | null | undefined;
/**
 * 事件处理函数类型。
 */
type EventHandler<E extends Event> = (event: E) => void;

/**
 * 已注册事件监听器快照。
 */
interface EventListenerInfo {
  /** 监听目标。 */
  target: EventTarget;
  /** 类型。 */
  type: string;
  /** 实际绑定的处理函数。 */
  handler: EventListener;
  /** 配置项。 */
  options?: AddEventListenerOptions;
}

/**
 * 创建事件监听器管理器，并在组件卸载时统一清理。
 *
 * @returns 事件注册与移除方法集合。
 */
export function useEventListener() {
  /**
   * 当前组合式函数托管的监听器集合。
   * @description 记录每个监听器的目标、事件名、处理函数与配置。
   */
  const listeners = ref<EventListenerInfo[]>([]);

  /**
   * 添加事件监听器并返回反注册函数。
   *
   * @param target 事件目标（`window`、`document` 或元素节点）。
   * @param type 事件类型。
   * @param handler 事件处理函数。
   * @param options 监听选项。
   * @returns 对应监听器的移除函数。
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

    /** 返回当前监听器对应的移除函数。 */
    return () => off(info);
  }

  /**
   * 移除指定的事件监听器。
   *
   * @param info 监听器快照信息。
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
   * 移除当前组合式函数管理的全部事件监听器。
   */
  function offAll(): void {
    listeners.value.forEach((info) => {
      if (info.target) {
        info.target.removeEventListener(info.type, info.handler, info.options);
      }
    });
    listeners.value = [];
  }

  /**
   * 组件卸载时自动清理全部事件监听器。
   */
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
 * 监听窗口 `resize` 事件。
 *
 * @param handler 事件处理函数。
 * @param options 监听选项。
 * @returns 取消监听函数。
 */
export function useWindowResize(
  handler: EventHandler<UIEvent>,
  options?: AddEventListenerOptions
): () => void {
  const { on } = useEventListener();
  return on(window, 'resize', handler, options);
}

/**
 * 监听窗口 `scroll` 事件。
 *
 * @param handler 事件处理函数。
 * @param options 监听选项。
 * @returns 取消监听函数。
 */
export function useWindowScroll(
  handler: EventHandler<Event>,
  options?: AddEventListenerOptions
): () => void {
  const { on } = useEventListener();
  return on(window, 'scroll', handler, { passive: true, ...options });
}

/**
 * 监听全局 `keydown` 事件。
 *
 * @param handler 事件处理函数。
 * @param options 监听选项。
 * @returns 取消监听函数。
 */
export function useKeydown(
  handler: EventHandler<KeyboardEvent>,
  options?: AddEventListenerOptions
): () => void {
  const { on } = useEventListener();
  return on(document, 'keydown', handler, options);
}

/**
 * 监听点击目标元素外部区域的事件。
 *
 * @param target 目标元素引用。
 * @param handler 点击发生在目标元素外部时触发的回调。
 * @returns 取消监听函数。
 */
export function useClickOutside(
  target: Ref<HTMLElement | null | undefined>,
  handler: () => void
): () => void {
  const { on } = useEventListener();
  
  /**
   * 点击事件代理：当点击发生在目标元素外部时触发回调。
   *
   * @param event 鼠标事件对象。
   */
  const clickHandler = (event: MouseEvent) => {
    const el = target.value;
    if (el && !el.contains(event.target as Node)) {
      handler();
    }
  };

  return on(document, 'click', clickHandler);
}

/**
 * 监听元素尺寸变化。
 *
 * @param target 目标元素引用。
 * @param handler 尺寸变化回调，参数为首个 `ResizeObserverEntry`。
 * @returns 停止监听并销毁观察器的方法。
 */
export function useResizeObserver(
  target: Ref<HTMLElement | null | undefined>,
  handler: (entry: ResizeObserverEntry) => void
): () => void {
  let observer: ResizeObserver | null = null;

  /**
   * 停止并销毁当前 `ResizeObserver` 实例。
   */
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
