/**
 * 受控值对象基础类型。
 */
type ControlledValues = Record<string, any>;

/**
 * 规范化外部传入值。
 *
 * @param values 外部受控值。
 * @returns 非空对象；空值场景返回空对象。
 */
function normalizeIncomingValues<TValues extends ControlledValues>(
  values: null | TValues | undefined
): TValues {
  return (values ?? {}) as TValues;
}

/**
 * 受控值同步桥接器。
 * 用于区分“外部同步导致的更新”与“内部输入导致的更新”，避免循环触发。
 */
export interface ControlledValuesBridge<TValues extends ControlledValues> {
  /** 标记一次外部同步开始，返回本次同步 token。 */
  beginExternalSync(values: TValues): number;
  /** 根据 token 结束外部同步。 */
  endExternalSync(token: number): void;
  /** 当前是否处于外部同步阶段。 */
  isExternalSyncing(): boolean;
  /** 记录最近一次已向外发射的值。 */
  markEmitted(values: TValues): void;
  /** 重置桥接器内部状态。 */
  reset(): void;
  /** 规范化外部传入值。 */
  resolveIncoming(values: null | TValues | undefined): TValues;
  /** 判断当前值是否需要向外发射。 */
  shouldEmit(values: TValues): boolean;
  /** 判断是否应将外部值同步回内部状态。 */
  shouldSyncIncoming(
    values: null | TValues | undefined,
    currentValues: TValues
  ): boolean;
}

/**
 * 创建受控值桥接器。
 *
 * @returns 受控值同步桥接实例。
 */
export function createControlledValuesBridge<
  TValues extends ControlledValues = ControlledValues,
>(): ControlledValuesBridge<TValues> {
  let externalSyncToken = 0;
  let emittedValues: null | TValues = null;

  return {
    /**
     * 标记外部同步开始并更新最近发射值。
     * @param values 外部同步值。
     * @returns 本次同步 token。
     */
    beginExternalSync(values) {
      emittedValues = values;
      externalSyncToken += 1;
      return externalSyncToken;
    },
    /**
     * 结束外部同步阶段。
     * @param token 外部同步 token。
     * @returns 无返回值。
     */
    endExternalSync(token) {
      if (externalSyncToken === token) {
        externalSyncToken = 0;
      }
    },
    /**
     * 判断当前是否处于外部同步中。
     * @returns 是否外部同步中。
     */
    isExternalSyncing() {
      return externalSyncToken !== 0;
    },
    /**
     * 更新最近一次已向外发射的值。
     * @param values 最新发射值。
     * @returns 无返回值。
     */
    markEmitted(values) {
      emittedValues = values;
    },
    /**
     * 重置桥接器内部状态。
     * @returns 无返回值。
     */
    reset() {
      externalSyncToken = 0;
      emittedValues = null;
    },
    /**
     * 规范化外部输入值。
     * @param values 外部输入值。
     * @returns 规范化后的值对象。
     */
    resolveIncoming(values) {
      return normalizeIncomingValues(values);
    },
    /**
     * 判断当前值是否需要向外发射。
     * @param values 当前值。
     * @returns 需要发射返回 `true`。
     */
    shouldEmit(values) {
      return emittedValues !== values;
    },
    /**
     * 判断是否应将外部值同步到内部。
     * @param values 外部输入值。
     * @param currentValues 当前内部值。
     * @returns 应同步返回 `true`。
     */
    shouldSyncIncoming(values, currentValues) {
      if (values === undefined) {
        return false;
      }
      const incomingValues = normalizeIncomingValues(values);
      return incomingValues !== currentValues;
    },
  };
}
