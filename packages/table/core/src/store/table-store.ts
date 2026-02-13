import type { StoreApi, StoreListener } from '../types';

export function createStore<TState>(initialState: TState): StoreApi<TState> {
  let state = initialState;
  let notifyQueued = false;
  const listeners = new Set<StoreListener>();

  const flush = () => {
    notifyQueued = false;
    for (const listener of listeners) {
      listener();
    }
  };

  const scheduleNotify = () => {
    if (notifyQueued) return;
    notifyQueued = true;
    queueMicrotask(flush);
  };

  const api: StoreApi<TState> = {
    getState() {
      return state;
    },
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
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    subscribeSelector(selector, listener, isEqual = Object.is) {
      let previous = selector(state);
      return api.subscribe(() => {
        const nextSlice = selector(state);
        if (isEqual(previous, nextSlice)) return;
        previous = nextSlice;
        listener(nextSlice);
      });
    },
  };

  return api;
}
