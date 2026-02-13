import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearSchemaCompileCache,
  compileSchema,
  configureSchemaCompileCache,
  getSchemaCompileCacheStats,
} from '../compiler';
import type { AdminFormSchema } from '../types';

describe('compileSchema', () => {
  beforeEach(() => {
    configureSchemaCompileCache({ maxSize: 300 });
    clearSchemaCompileCache();
  });

  it('should reuse cache for same schema references', () => {
    const schema: AdminFormSchema[] = [
      {
        fieldName: 'name',
        component: 'input',
        label: 'Name',
      },
    ];

    const first = compileSchema(schema, {});
    const second = compileSchema(schema, {});
    expect(second).toBe(first);
    expect(second.hash).toBe(first.hash);
  });

  it('should build dependency graph', () => {
    const schema: AdminFormSchema[] = [
      {
        fieldName: 'name',
        component: 'input',
      },
      {
        fieldName: 'target',
        component: 'input',
        dependencies: {
          triggerFields: ['name'],
          show: (values) => !!values.name,
        },
      },
    ];

    const compiled = compileSchema(schema, {});
    expect(compiled.dependencyGraph.get('name')).toEqual(['target']);
  });

  it('should keep lru bound and expose cache stats', () => {
    configureSchemaCompileCache({ maxSize: 2 });

    const schemaA: AdminFormSchema[] = [{ fieldName: 'a', component: 'input' }];
    const schemaB: AdminFormSchema[] = [{ fieldName: 'b', component: 'input' }];
    const schemaC: AdminFormSchema[] = [{ fieldName: 'c', component: 'input' }];

    compileSchema(schemaA, {});
    compileSchema(schemaB, {});
    compileSchema(schemaA, {});
    compileSchema(schemaC, {});

    const stats = getSchemaCompileCacheStats();
    expect(stats.maxSize).toBe(2);
    expect(stats.size).toBe(2);
    expect(stats.hits).toBeGreaterThanOrEqual(1);
    expect(stats.evictions).toBeGreaterThanOrEqual(1);
  });
});
