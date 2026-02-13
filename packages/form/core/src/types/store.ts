export type StoreListener = () => void;

export interface StoreApi<TState> {
  getState(): TState;
  setState(updater: ((prev: TState) => TState) | TState): boolean;
  subscribe(listener: StoreListener): () => void;
  subscribeSelector<TSlice>(
    selector: (state: TState) => TSlice,
    listener: (slice: TSlice) => void,
    isEqual?: (a: TSlice, b: TSlice) => boolean
  ): () => void;
}
