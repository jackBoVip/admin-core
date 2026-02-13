import { isFunction } from '../utils/guards';
import { createHash } from '../utils/hash';
import type { AdminFormCommonConfig, AdminFormSchema } from '../types';
import type { CompiledFieldSchema, CompiledSchema } from './types';

const DEFAULT_CACHE_MAX_SIZE = 300;
const compileCache = new Map<string, CompiledSchema>();
let compileRefCache = new WeakMap<
  AdminFormSchema[],
  WeakMap<AdminFormCommonConfig, CompiledSchema>
>();
let cacheMaxSize = DEFAULT_CACHE_MAX_SIZE;
const EMPTY_COMMON_CONFIG = {} as AdminFormCommonConfig;

const cacheStats = {
  evictions: 0,
  hits: 0,
  misses: 0,
};

function trimCompileCache() {
  while (compileCache.size > cacheMaxSize) {
    const oldestKey = compileCache.keys().next().value as string | undefined;
    if (!oldestKey) break;
    compileCache.delete(oldestKey);
    cacheStats.evictions += 1;
  }
}

function normalizeFormItemClass(formItemClass: (() => string) | string | undefined) {
  if (isFunction(formItemClass)) {
    try {
      return formItemClass();
    } catch {
      return '';
    }
  }
  return formItemClass ?? '';
}

function createSchemaHash(schema: AdminFormSchema[], commonConfig: AdminFormCommonConfig) {
  const parts: unknown[] = [commonConfig];
  for (const item of schema) {
    parts.push(
      item.fieldName,
      item.component,
      item.label,
      item.rules,
      item.dependencies,
      item.defaultValue,
      item.componentProps,
      item.hide,
      item.formItemClass,
      item.wrapperClass
    );
  }
  return createHash(parts);
}

export function clearSchemaCompileCache() {
  compileCache.clear();
  compileRefCache = new WeakMap<
    AdminFormSchema[],
    WeakMap<AdminFormCommonConfig, CompiledSchema>
  >();
  cacheStats.hits = 0;
  cacheStats.misses = 0;
  cacheStats.evictions = 0;
}

export function configureSchemaCompileCache(options: {
  maxSize?: number;
} = {}) {
  if (typeof options.maxSize === 'number' && options.maxSize > 0) {
    cacheMaxSize = Math.floor(options.maxSize);
    trimCompileCache();
  }
}

export function getSchemaCompileCacheStats() {
  return {
    ...cacheStats,
    maxSize: cacheMaxSize,
    size: compileCache.size,
  };
}

export function compileSchema(
  schema: AdminFormSchema[] = [],
  commonConfig: AdminFormCommonConfig = EMPTY_COMMON_CONFIG
): CompiledSchema {
  const normalizedCommonConfig = commonConfig ?? EMPTY_COMMON_CONFIG;
  const referencedSchema = schema;
  const refMap = compileRefCache.get(referencedSchema);
  const refCached = refMap?.get(normalizedCommonConfig);
  if (refCached) {
    cacheStats.hits += 1;
    return refCached;
  }

  const hash = createSchemaHash(schema, normalizedCommonConfig);
  const cached = compileCache.get(hash);
  if (cached) {
    cacheStats.hits += 1;
    // LRU: move to the latest position
    compileCache.delete(hash);
    compileCache.set(hash, cached);
    const cachedRefMap = compileRefCache.get(referencedSchema);
    if (!cachedRefMap) {
      compileRefCache.set(
        referencedSchema,
        new WeakMap([[normalizedCommonConfig, cached]])
      );
    } else {
      cachedRefMap.set(normalizedCommonConfig, cached);
    }
    return cached;
  }
  cacheStats.misses += 1;

  const fields: CompiledFieldSchema[] = [];
  const fieldMap = new Map<string, CompiledFieldSchema>();
  const dependencyGraph = new Map<string, string[]>();

  for (const item of schema) {
    if (!item.fieldName) {
      continue;
    }

    const compiledItem: CompiledFieldSchema = {
      ...item,
      compiledFormItemClass: normalizeFormItemClass(item.formItemClass),
      hashId: createHash([item.fieldName, item.component, item.dependencies, item.rules]),
    };

    fields.push(compiledItem);
    fieldMap.set(item.fieldName, compiledItem);

    const triggers = item.dependencies?.triggerFields ?? [];
    for (const triggerField of triggers) {
      const current = dependencyGraph.get(triggerField) ?? [];
      current.push(item.fieldName);
      dependencyGraph.set(triggerField, current);
    }
  }

  const compiled: CompiledSchema = {
    hash,
    fields,
    fieldMap,
    dependencyGraph,
    commonConfig: normalizedCommonConfig,
  };

  compileCache.set(hash, compiled);
  if (!refMap) {
    compileRefCache.set(referencedSchema, new WeakMap([[normalizedCommonConfig, compiled]]));
  } else {
    refMap.set(normalizedCommonConfig, compiled);
  }
  trimCompileCache();
  return compiled;
}
