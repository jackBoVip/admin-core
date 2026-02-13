import type {
  TableFormatter,
  TableFormatterRegistry,
  TableRenderer,
  TableRendererRegistry,
} from '../types';

export function createTableRendererRegistry<TNode = unknown>(
  initial?: Record<string, TableRenderer<TNode>>
): TableRendererRegistry<TNode> {
  const map = new Map<string, TableRenderer<TNode>>(
    Object.entries(initial ?? {})
  );

  return {
    get(name) {
      return map.get(name);
    },
    list() {
      return [...map.keys()];
    },
    register(name, renderer) {
      map.set(name, renderer);
    },
    remove(name) {
      map.delete(name);
    },
    resolve(name) {
      return map.get(name) ?? null;
    },
  };
}

export function createTableFormatterRegistry(
  initial?: Record<string, TableFormatter>
): TableFormatterRegistry {
  const map = new Map<string, TableFormatter>(Object.entries(initial ?? {}));

  return {
    get(name) {
      return map.get(name);
    },
    list() {
      return [...map.keys()];
    },
    register(name, formatter) {
      map.set(name, formatter);
    },
    remove(name) {
      map.delete(name);
    },
  };
}

const globalFormatterRegistry = createTableFormatterRegistry();

export function registerTableFormatters(
  formatters: Record<string, TableFormatter>
) {
  for (const [name, formatter] of Object.entries(formatters ?? {})) {
    globalFormatterRegistry.register(name, formatter);
  }
}

export function getGlobalTableFormatterRegistry() {
  return globalFormatterRegistry;
}
