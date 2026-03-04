/**
 * Shared Core 轻量 Store 实现。
 * @description 提供统一的状态读写与订阅能力，支持 selector 级订阅。
 */
/**
 * Store 订阅回调类型。
 * @description 在状态发生变更后触发，用于驱动外部副作用或视图刷新。
 */
export type StoreListener = () => void;

/**
 * 轻量级 Store API。
 * @description 提供状态读取、更新与订阅能力，支持 selector 级别的精细监听。
 * @template TState 状态对象类型。
 */
export interface StoreApi<TState> {
  /** 获取当前状态。 */
  getState(): TState;
  /** 更新状态，返回是否发生变化。 */
  setState(updater: TState | ((prevState: TState) => TState)): boolean;
  /** 订阅全量状态变更。 */
  subscribe(listener: StoreListener): () => void;
  /** 订阅 selector 切片变更。 */
  subscribeSelector<TSlice>(
    selector: (state: TState) => TSlice,
    listener: (slice: TSlice) => void,
    isEqual?: (a: TSlice, b: TSlice) => boolean
  ): () => void;
}

/**
 * 创建轻量级响应式 Store。
 *
 * @template TState 状态对象类型。
 * @param initialState 初始状态。
 * @returns Store API 实例。
 */
export function createStore<TState>(initialState: TState): StoreApi<TState> {
  let state = initialState;
  let notifyQueued = false;
  const listeners = new Set<StoreListener>();

  /**
   * 刷新通知队列并依次触发订阅回调。
   *
   * @returns 无返回值。
   */
  const flush = () => {
    notifyQueued = false;
    for (const listener of listeners) {
      listener();
    }
  };

  /**
   * 将一次状态通知调度到微任务队列，避免同步连环触发。
   *
   * @returns 无返回值。
   */
  const scheduleNotify = () => {
    if (notifyQueued) return;
    notifyQueued = true;
    queueMicrotask(flush);
  };

  const api: StoreApi<TState> = {
    /**
     * 读取当前状态快照。
     * @returns 当前状态。
     */
    getState() {
      return state;
    },
    /**
     * 更新状态并按需触发订阅通知。
     * @param updater 状态值或状态更新函数。
     * @returns 是否发生状态变化。
     */
    setState(updater) {
      const nextState =
        typeof updater === 'function'
          ? (updater as (prev: TState) => TState)(state)
          : updater;
      if (Object.is(nextState, state)) {
        return false;
      }
      state = nextState;
      scheduleNotify();
      return true;
    },
    /**
     * 订阅全量状态变更。
     * @param listener 状态变更回调。
     * @returns 取消订阅函数。
     */
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    /**
     * 订阅状态切片变更。
     * @template TSlice 切片类型。
     * @param selector 切片选择器。
     * @param listener 切片变化回调。
     * @param isEqual 切片比较函数，默认使用 `Object.is`。
     * @returns 取消订阅函数。
     */
    subscribeSelector(selector, listener, isEqual = Object.is) {
      let previous = selector(state);
      return api.subscribe(() => {
        const nextSlice = selector(state);
        if (isEqual(previous, nextSlice)) {
          return;
        }
        previous = nextSlice;
        listener(nextSlice);
      });
    },
  };

  return api;
}
