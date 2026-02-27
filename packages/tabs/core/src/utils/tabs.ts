import { DEFAULT_ADMIN_TABS_OPTIONS } from '../constants';
import type {
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsOptions,
  NormalizedAdminTabsOptions,
} from '../types';

export interface AdminTabsStyleVars {
  '--admin-tabs-content-inset-top': string;
  '--admin-tabs-sticky-top': string;
}

export interface ResolveAdminTabsSelectedActiveKeyOptions {
  controlledActiveKey: null | string;
  isControlled: boolean;
  uncontrolledActiveKey: null | string;
}

type TabsKeyItem = { key: string };

type TabsClassName = false | null | string | undefined;

export function normalizeAdminTabsOptions(
  tabs: boolean | AdminTabsOptions | undefined
): NormalizedAdminTabsOptions {
  if (typeof tabs === 'boolean') {
    return {
      ...DEFAULT_ADMIN_TABS_OPTIONS,
      enabled: tabs,
    };
  }
  return {
    ...DEFAULT_ADMIN_TABS_OPTIONS,
    ...(tabs ?? {}),
  };
}

export function resolveAdminTabsOptionsWithDefaults(
  tabs: boolean | AdminTabsOptions | undefined,
  defaults: Partial<AdminTabsOptions> = {}
): boolean | AdminTabsOptions {
  if (tabs === false) {
    return false;
  }
  if (tabs === true || tabs === undefined) {
    return { ...defaults };
  }
  return {
    ...defaults,
    ...tabs,
  };
}

export function resolveAdminTabsActiveKey<T extends { key: string }>(
  items: ReadonlyArray<T> | undefined,
  key: null | string
): null | string {
  if (key && (items?.some((item) => item.key === key) ?? false)) {
    return key;
  }
  return items?.[0]?.key ?? null;
}

export function resolveAdminTabsSelectedActiveKey<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  options: ResolveAdminTabsSelectedActiveKeyOptions
): null | string {
  const sourceKey = options.isControlled
    ? options.controlledActiveKey
    : options.uncontrolledActiveKey;
  return resolveAdminTabsActiveKey(items, sourceKey);
}

export function resolveAdminTabsItemsSignature<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined
): string {
  return (items ?? [])
    .map((item) => item.key)
    .join('||');
}

export function resolveAdminTabsActiveItem<T extends { key: string }>(
  items: ReadonlyArray<T> | undefined,
  key: null | string
): null | T {
  const activeKey = resolveAdminTabsActiveKey(items, key);
  if (!activeKey) {
    return null;
  }
  return items?.find((item) => item.key === activeKey) ?? null;
}

export function resolveAdminTabsVisible(
  tabs: boolean | AdminTabsOptions | undefined,
  items: ReadonlyArray<unknown> | undefined
): boolean {
  const tabsConfig = normalizeAdminTabsOptions(tabs);
  if (!tabsConfig.enabled) {
    return false;
  }
  if (tabsConfig.hideWhenSingle && (items?.length ?? 0) <= 1) {
    return false;
  }
  return true;
}

export function resolveAdminTabsShowClose(
  items: ReadonlyArray<unknown> | undefined
): boolean {
  return (items?.length ?? 0) > 1;
}

export function resolveAdminTabsCssLength(
  value: number | string
): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function resolveAdminTabsStyleVars(
  options: Pick<NormalizedAdminTabsOptions, 'contentInsetTop' | 'stickyTop'>
): AdminTabsStyleVars {
  return {
    '--admin-tabs-content-inset-top': resolveAdminTabsCssLength(options.contentInsetTop),
    '--admin-tabs-sticky-top': resolveAdminTabsCssLength(options.stickyTop),
  };
}

export function resolveAdminTabsRootClassNames(
  options: Pick<NormalizedAdminTabsOptions, 'align' | 'sticky'>,
  extra: TabsClassName[] = []
): string[] {
  const classes: TabsClassName[] = [
    'admin-tabs',
    `admin-tabs--align-${options.align}`,
    options.sticky ? 'admin-tabs--sticky' : null,
    ...extra,
  ];
  return classes.filter(Boolean) as string[];
}

export function resolveAdminTabsUncontrolledActiveKey<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  previous: null | string,
  defaultKey: null | string
): null | string {
  const validPrevious = resolveAdminTabsActiveKey(items, previous);
  if (validPrevious && validPrevious === previous) {
    return previous;
  }
  return resolveAdminTabsActiveKey(items, defaultKey);
}

export function createAdminTabsChangePayload<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  activeKey: string
): AdminTabsChangePayload<T> {
  return {
    activeKey,
    item: items?.find((item) => item.key === activeKey) ?? null,
  };
}

export function createAdminTabsClosePayload<T extends TabsKeyItem>(
  item: T
): AdminTabsClosePayload<T> {
  return {
    item,
    key: item.key,
  };
}
