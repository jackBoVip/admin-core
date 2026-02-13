import { describe, expect, it } from 'vitest';
import { createControlledValuesBridge } from '../utils/controlled-values';

describe('controlled values bridge', () => {
  it('should skip sync when incoming value is undefined or unchanged reference', () => {
    const bridge = createControlledValuesBridge<Record<string, any>>();
    const current = { a: 1 };
    expect(bridge.shouldSyncIncoming(undefined, current)).toBe(false);
    expect(bridge.shouldSyncIncoming(current, current)).toBe(false);
    expect(bridge.shouldSyncIncoming({ a: 1 }, current)).toBe(true);
  });

  it('should suppress emission while external sync is in progress', () => {
    const bridge = createControlledValuesBridge<Record<string, any>>();
    const incoming = { a: 1 };
    const token = bridge.beginExternalSync(incoming);
    expect(bridge.isExternalSyncing()).toBe(true);
    expect(bridge.shouldEmit(incoming)).toBe(false);
    bridge.endExternalSync(token);
    expect(bridge.isExternalSyncing()).toBe(false);
    const next = { a: 2 };
    expect(bridge.shouldEmit(next)).toBe(true);
    bridge.markEmitted(next);
    expect(bridge.shouldEmit(next)).toBe(false);
  });
});
