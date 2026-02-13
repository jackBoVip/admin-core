type ControlledValues = Record<string, any>;

function normalizeIncomingValues<TValues extends ControlledValues>(
  values: null | TValues | undefined
): TValues {
  return (values ?? {}) as TValues;
}

export interface ControlledValuesBridge<TValues extends ControlledValues> {
  beginExternalSync(values: TValues): number;
  endExternalSync(token: number): void;
  isExternalSyncing(): boolean;
  markEmitted(values: TValues): void;
  reset(): void;
  resolveIncoming(values: null | TValues | undefined): TValues;
  shouldEmit(values: TValues): boolean;
  shouldSyncIncoming(
    values: null | TValues | undefined,
    currentValues: TValues
  ): boolean;
}

export function createControlledValuesBridge<
  TValues extends ControlledValues = ControlledValues,
>(): ControlledValuesBridge<TValues> {
  let externalSyncToken = 0;
  let emittedValues: null | TValues = null;

  return {
    beginExternalSync(values) {
      emittedValues = values;
      externalSyncToken += 1;
      return externalSyncToken;
    },
    endExternalSync(token) {
      if (externalSyncToken === token) {
        externalSyncToken = 0;
      }
    },
    isExternalSyncing() {
      return externalSyncToken !== 0;
    },
    markEmitted(values) {
      emittedValues = values;
    },
    reset() {
      externalSyncToken = 0;
      emittedValues = null;
    },
    resolveIncoming(values) {
      return normalizeIncomingValues(values);
    },
    shouldEmit(values) {
      return emittedValues !== values;
    },
    shouldSyncIncoming(values, currentValues) {
      if (values === undefined) {
        return false;
      }
      const incomingValues = normalizeIncomingValues(values);
      return incomingValues !== currentValues;
    },
  };
}
