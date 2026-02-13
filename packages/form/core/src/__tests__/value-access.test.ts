import { describe, expect, it } from 'vitest';
import {
  pathDependenciesIntersect,
  trackValueDependencies,
} from '../utils/value-access';

describe('value access tracking', () => {
  it('should collect nested dependency paths', () => {
    const tracker = trackValueDependencies({
      filter: {
        keyword: 'a',
      },
      region: 'cn',
    });
    const values = tracker.values as any;

    void values.filter.keyword;
    void values.region;

    expect(tracker.getDependencies()).toEqual(
      new Set(['filter', 'filter.keyword', 'region'])
    );
  });

  it('should support dependency intersection check', () => {
    const deps = new Set(['filter.keyword']);
    expect(pathDependenciesIntersect(['filter.keyword'], deps)).toBe(true);
    expect(pathDependenciesIntersect(['filter'], deps)).toBe(true);
    expect(pathDependenciesIntersect(['owner'], deps)).toBe(false);
    expect(pathDependenciesIntersect(['owner'], 'all')).toBe(true);
    expect(pathDependenciesIntersect([], deps)).toBe(true);
  });
});
