import type { TableRenderer } from '@admin-core/table-core';

import { createTableRendererRegistry } from '@admin-core/table-core';
import type { ReactNode } from 'react';

const reactRendererRegistry = createTableRendererRegistry<ReactNode>();

export function registerReactTableRenderer(name: string, renderer: TableRenderer<ReactNode>) {
  reactRendererRegistry.register(name, renderer);
}

export function removeReactTableRenderer(name: string) {
  reactRendererRegistry.remove(name);
}

export function getReactTableRenderer(name: string) {
  return reactRendererRegistry.resolve(name);
}

export function getReactTableRendererRegistry() {
  return reactRendererRegistry;
}
