/**
 * Table React 渲染器注册中心。
 * @description 封装 React 节点渲染器的注册、移除与查询能力。
 */
import type { TableRenderer } from '@admin-core/table-core';

import { createTableRendererRegistry } from '@admin-core/table-core';
import type { ReactNode } from 'react';

/**
 * React 渲染器注册表实例。
 */
const reactRendererRegistry = createTableRendererRegistry<ReactNode>();

/**
 * 注册 React 表格渲染器。
 * @param name 渲染器名称。
 * @param renderer 渲染函数。
 * @returns 无返回值。
 */
export function registerReactTableRenderer(name: string, renderer: TableRenderer<ReactNode>) {
  reactRendererRegistry.register(name, renderer);
}

/**
 * 移除 React 表格渲染器。
 * @param name 渲染器名称。
 * @returns 无返回值。
 */
export function removeReactTableRenderer(name: string) {
  reactRendererRegistry.remove(name);
}

/**
 * 获取 React 表格渲染器。
 * @param name 渲染器名称。
 * @returns 渲染器或 `null`。
 */
export function getReactTableRenderer(name: string) {
  return reactRendererRegistry.resolve(name);
}

/**
 * 获取 React 渲染器注册表实例。
 * @returns 注册表实例。
 */
export function getReactTableRendererRegistry() {
  return reactRendererRegistry;
}
