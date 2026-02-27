import type {
  AdminPageOptions,
  NormalizedPageFormTableBridgeOptions,
  NormalizedPageScrollOptions,
} from '../types';

export const DEFAULT_SCROLL_OPTIONS: NormalizedPageScrollOptions = {
  enabled: true,
  x: 'hidden',
  y: 'auto',
};

export const DEFAULT_PAGE_FORM_TABLE_BRIDGE_OPTIONS: NormalizedPageFormTableBridgeOptions =
  {
    enabled: true,
    queryOnSubmit: true,
    reloadOnReset: true,
  };

export function createDefaultPageOptions<TComponent = unknown>(): AdminPageOptions<TComponent> {
  return {
    activeKey: null,
    keepInactivePages: false,
    pages: [],
    router: undefined,
    scroll: { ...DEFAULT_SCROLL_OPTIONS },
  };
}
