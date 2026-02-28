import { describe, expect, it } from 'vitest';
import { mergeWithArrayOverride } from '../deep';

describe('mergeWithArrayOverride', () => {
  it('clones arrays by default', () => {
    const source = { list: [1, 2, 3] };
    const target = { list: [0], other: true };

    const merged = mergeWithArrayOverride(source, target);

    expect(merged.list).toEqual([1, 2, 3]);
    expect(merged.list).not.toBe(source.list);
  });

  it('can keep source array references', () => {
    const source = { list: [1, 2, 3] };
    const target = { list: [0], other: true };

    const merged = mergeWithArrayOverride(source, target, { cloneArrays: false });

    expect(merged.list).toBe(source.list);
  });

  it('supports circular references when enabled', () => {
    const sourceNode: Record<string, unknown> = {};
    sourceNode.self = sourceNode;

    const targetNode: Record<string, unknown> = {};
    targetNode.self = targetNode;

    const source = { node: sourceNode };
    const target = { node: targetNode };

    const merged = mergeWithArrayOverride(source, target, { trackCircularRefs: true });

    const mergedNode = merged.node as Record<string, unknown>;
    expect(mergedNode).not.toBe(targetNode);
    expect(mergedNode.self).toBe(mergedNode);
  });
});
