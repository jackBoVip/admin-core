/**
 * Tabs Core 无状态工具函数集合。
 * @description 提供配置标准化、激活项解析、样式变量计算与事件载荷构建能力。
 */
import { DEFAULT_ADMIN_TABS_OPTIONS } from '../constants/defaults';
import type {
  AdminTabsChangePayload,
  AdminTabsClosePayload,
  AdminTabsOptions,
  NormalizedAdminTabsOptions,
} from '../types';

/**
 * Tabs 根节点 CSS 变量集合。
 */
export interface AdminTabsStyleVars {
  /** 内容区域顶部内边距。 */
  '--admin-tabs-content-inset-top': string;
  /** 吸顶偏移量。 */
  '--admin-tabs-sticky-top': string;
}

/**
 * 解析受控/非受控激活 key 所需参数。
 */
export interface ResolveAdminTabsSelectedActiveKeyOptions {
  /** 受控激活 key。 */
  controlledActiveKey: null | string;
  /** 是否启用受控模式。 */
  isControlled: boolean;
  /** 非受控激活 key。 */
  uncontrolledActiveKey: null | string;
}

/**
 * 至少包含 `key` 的 tabs 项约束。
 */
type TabsKeyItem = {
  /** 键名。 */
  key: string;
};

/**
 * Tabs className 输入类型。
 */
type TabsClassName = false | null | string | undefined;

/**
 * 标准化 tabs 配置。
 * @description 将布尔简写或部分配置统一转换为完整运行时配置。
 * @param tabs 原始 tabs 配置。
 * @returns 标准化配置。
 */
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

/**
 * 将 tabs 配置与默认值合并。
 * @description 若传入 `false`，直接返回 `false` 表示功能关闭。
 * @param tabs 原始 tabs 配置。
 * @param defaults 默认配置。
 * @returns 合并结果。
 */
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

/**
 * 解析有效激活 key。
 * @description 若候选 key 不存在，则回退到首个可用项。
 * @param items tabs 项列表。
 * @param key 候选激活 key。
 * @returns 有效激活 key。
 */
export function resolveAdminTabsActiveKey<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  key: null | string
): null | string {
  if (key && (items?.some((item) => item.key === key) ?? false)) {
    return key;
  }
  return items?.[0]?.key ?? null;
}

/**
 * 根据受控/非受控模式解析激活 key。
 * @description 受控模式优先取 `controlledActiveKey`，否则取非受控状态。
 * @param items tabs 项列表。
 * @param options 解析参数。
 * @returns 激活 key。
 */
export function resolveAdminTabsSelectedActiveKey<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  options: ResolveAdminTabsSelectedActiveKeyOptions
): null | string {
  const sourceKey = options.isControlled
    ? options.controlledActiveKey
    : options.uncontrolledActiveKey;
  return resolveAdminTabsActiveKey(items, sourceKey);
}

/**
 * 计算 tabs 项签名（用于依赖比较）。
 * @description 仅基于 key 序列生成，顺序变化会导致签名变化。
 * @param items tabs 项列表。
 * @returns 签名字符串。
 */
export function resolveAdminTabsItemsSignature<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined
): string {
  return (items ?? [])
    .map((item) => item.key)
    .join('||');
}

/**
 * 解析当前激活项。
 * @param items tabs 项列表。
 * @param key 候选激活 key。
 * @returns 激活项。
 */
export function resolveAdminTabsActiveItem<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  key: null | string
): null | T {
  const activeKey = resolveAdminTabsActiveKey(items, key);
  if (!activeKey) {
    return null;
  }
  return items?.find((item) => item.key === activeKey) ?? null;
}

/**
 * 判断 tabs 是否显示。
 * @description 同时考虑 `enabled` 与 `hideWhenSingle` 两个策略。
 * @param tabs tabs 配置。
 * @param items tabs 项列表。
 * @returns 是否显示。
 */
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

/**
 * 判断是否显示关闭按钮。
 * @description 当前策略为“项数大于 1 时展示”。
 * @param items tabs 项列表。
 * @returns 是否显示关闭按钮。
 */
export function resolveAdminTabsShowClose(
  items: ReadonlyArray<unknown> | undefined
): boolean {
  return (items?.length ?? 0) > 1;
}

/**
 * 解析 CSS 长度值。
 * @param value 数字或字符串。
 * @returns CSS 长度字符串。
 */
export function resolveAdminTabsCssLength(
  value: number | string
): string {
  return typeof value === 'number' ? `${value}px` : value;
}

/**
 * 生成 tabs 样式变量。
 * @param options tabs 布局配置。
 * @returns 可直接挂载到 DOM style 的变量对象。
 */
export function resolveAdminTabsStyleVars(
  options: Pick<NormalizedAdminTabsOptions, 'contentInsetTop' | 'stickyTop'>
): AdminTabsStyleVars {
  return {
    '--admin-tabs-content-inset-top': resolveAdminTabsCssLength(options.contentInsetTop),
    '--admin-tabs-sticky-top': resolveAdminTabsCssLength(options.stickyTop),
  };
}

/**
 * 生成 tabs 根节点 className 列表。
 * @param options tabs 样式配置。
 * @param extra 额外 className。
 * @returns 过滤空值后的 className 列表。
 */
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

/**
 * 解析非受控模式下的激活 key。
 * @description 优先沿用上次有效 key，否则回退默认 key 或首项 key。
 * @param items tabs 项列表。
 * @param previous 上一次激活 key。
 * @param defaultKey 默认 key。
 * @returns 激活 key。
 */
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

/**
 * 生成 tabs 切换事件载荷。
 * @param items tabs 项列表。
 * @param activeKey 新激活 key。
 * @returns 事件载荷。
 */
export function createAdminTabsChangePayload<T extends TabsKeyItem>(
  items: ReadonlyArray<T> | undefined,
  activeKey: string
): AdminTabsChangePayload<T> {
  return {
    activeKey,
    item: items?.find((item) => item.key === activeKey) ?? null,
  };
}

/**
 * 生成 tabs 关闭事件载荷。
 * @param item 被关闭的 tabs 项。
 * @returns 事件载荷。
 */
export function createAdminTabsClosePayload<T extends TabsKeyItem>(
  item: T
): AdminTabsClosePayload<T> {
  return {
    item,
    key: item.key,
  };
}
