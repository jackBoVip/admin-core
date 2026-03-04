/**
 * Shared Vue Store 切片订阅 Composable。
 * @description 封装 selector 订阅与作用域销毁清理逻辑，提供细粒度响应式状态读取。
 */
import { onScopeDispose, ref, type Ref } from 'vue';

/**
 * 支持 selector 订阅的最小 Store 接口。
 * @description 抽象跨实现 Store 的最小能力集合，便于 Vue 侧统一消费。
 * @template TState Store 状态类型。
 */
export interface SelectorStoreApi<TState> {
  /** 获取当前状态快照。 */
  getState: () => TState;
  /** 订阅指定 selector 的切片变化。 */
  subscribeSelector: <TSlice>(
    selector: (state: TState) => TSlice,
    listener: (next: TSlice) => void
  ) => () => void;
}

/**
 * 在 Vue 组件中订阅 store 切片并返回只读 `Ref`。
 *
 * @template TState Store 状态类型。
 * @template TSlice 订阅切片类型。
 * @param store 可订阅 selector 的 store。
 * @param selector 切片选择器。
 * @returns 与切片同步更新的只读 `Ref`。
 */
export function useStoreSelector<TState, TSlice>(
  store: SelectorStoreApi<TState>,
  selector: (state: TState) => TSlice
): Readonly<Ref<TSlice>> {
  /**
   * 当前切片值引用。
   * @description 初始化为当前快照的 selector 结果，后续由订阅回调持续更新。
   */
  const stateRef = ref(selector(store.getState())) as Ref<TSlice>;

  /**
   * selector 订阅解绑函数。
   * @description 绑定在当前作用域销毁生命周期中自动清理。
   */
  const unsubscribe = store.subscribeSelector(selector, (next) => {
    stateRef.value = next;
  });

  /**
   * 在组合式作用域销毁时释放订阅。
   * @returns 无返回值。
   */
  onScopeDispose(() => {
    unsubscribe();
  });

  return stateRef;
}
