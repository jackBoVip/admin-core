/**
 * Table Core 渲染器注册中心。
 * @description 提供单元格渲染器与格式化器的注册、移除与查询能力。
 */
import type {
  TableFormatter,
  TableFormatterRegistry,
  TableRenderer,
  TableRendererRegistry,
} from '../types';

/**
 * 创建表格渲染器注册表。
 * @template TNode 节点类型。
 * @param initial 初始渲染器映射。
 * @returns 渲染器注册表实例。
 */
export function createTableRendererRegistry<TNode = unknown>(
  initial?: Record<string, TableRenderer<TNode>>
): TableRendererRegistry<TNode> {
  const map = new Map<string, TableRenderer<TNode>>(
    Object.entries(initial ?? {})
  );

  return {
    /**
     * 获取指定名称渲染器。
     * @param name 渲染器名称。
     * @returns 渲染器实例。
     */
    get(name) {
      return map.get(name);
    },
    /**
     * 获取全部渲染器名称。
     * @returns 渲染器名称列表。
     */
    list() {
      return [...map.keys()];
    },
    /**
     * 注册或覆盖渲染器。
     * @param name 渲染器名称。
     * @param renderer 渲染器实现。
     * @returns 无返回值。
     */
    register(name, renderer) {
      map.set(name, renderer);
    },
    /**
     * 删除指定渲染器。
     * @param name 渲染器名称。
     * @returns 无返回值。
     */
    remove(name) {
      map.delete(name);
    },
    /**
     * 解析渲染器，不存在时返回 `null`。
     * @param name 渲染器名称。
     * @returns 渲染器实例或 `null`。
     */
    resolve(name) {
      return map.get(name) ?? null;
    },
  };
}

/**
 * 创建表格格式化器注册表。
 * @param initial 初始格式化器映射。
 * @returns 格式化器注册表实例。
 */
export function createTableFormatterRegistry(
  initial?: Record<string, TableFormatter>
): TableFormatterRegistry {
  const map = new Map<string, TableFormatter>(Object.entries(initial ?? {}));

  return {
    /**
     * 获取指定名称格式化器。
     * @param name 格式化器名称。
     * @returns 格式化器实例。
     */
    get(name) {
      return map.get(name);
    },
    /**
     * 获取全部格式化器名称。
     * @returns 格式化器名称列表。
     */
    list() {
      return [...map.keys()];
    },
    /**
     * 注册或覆盖格式化器。
     * @param name 格式化器名称。
     * @param formatter 格式化器实现。
     * @returns 无返回值。
     */
    register(name, formatter) {
      map.set(name, formatter);
    },
    /**
     * 删除指定格式化器。
     * @param name 格式化器名称。
     * @returns 无返回值。
     */
    remove(name) {
      map.delete(name);
    },
  };
}

const globalFormatterRegistry = createTableFormatterRegistry();

/**
 * 向全局格式化器注册表批量注册格式化器。
 * @param formatters 格式化器映射。
 * @returns 无返回值。
 */
export function registerTableFormatters(
  formatters: Record<string, TableFormatter>
) {
  for (const [name, formatter] of Object.entries(formatters ?? {})) {
    globalFormatterRegistry.register(name, formatter);
  }
}

/**
 * 获取全局格式化器注册表。
 * @returns 全局格式化器注册表实例。
 */
export function getGlobalTableFormatterRegistry() {
  return globalFormatterRegistry;
}
