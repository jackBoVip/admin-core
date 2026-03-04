/**
 * Tabs Core 结构与事件类型。
 * @description 定义 Tabs 配置、页签项模型与切换/关闭事件载荷约束。
 */
/**
 * Tabs 头部对齐方式。
 * @description 控制页签头在可用宽度内的主轴对齐策略。
 */
export type AdminTabsAlign = 'center' | 'left' | 'right';

/**
 * Tabs 组件配置（入参态）。
 * @description 字段均为可选，运行时会合并默认值得到标准化配置。
 */
export interface AdminTabsOptions {
  /** 页签头对齐方式。 */
  align?: AdminTabsAlign;
  /** 内容区顶部内边距（支持数字与 CSS 长度字符串）。 */
  contentInsetTop?: number | string;
  /** 是否启用 Tabs 能力。 */
  enabled?: boolean;
  /** 仅有一个标签时是否隐藏页签头区域。 */
  hideWhenSingle?: boolean;
  /** 是否启用吸顶。 */
  sticky?: boolean;
  /** 吸顶偏移（支持数字与 CSS 长度字符串）。 */
  stickyTop?: number | string;
}

/**
 * 标准化后的 Tabs 配置（运行时态）。
 * @description 所有字段均为必填，便于渲染层直接消费。
 */
export interface NormalizedAdminTabsOptions {
  /** 页签头对齐方式。 */
  align: AdminTabsAlign;
  /** 内容区顶部内边距。 */
  contentInsetTop: number | string;
  /** 是否启用 Tabs。 */
  enabled: boolean;
  /** 仅有一个标签时是否隐藏页签头。 */
  hideWhenSingle: boolean;
  /** 是否启用吸顶。 */
  sticky: boolean;
  /** 吸顶偏移。 */
  stickyTop: number | string;
}

/**
 * Tabs 单项模型。
 * @template TComponent 页签内容组件类型。
 * @template TComponentProps 组件属性类型。
 */
export interface AdminTabItem<
  TComponent = unknown,
  TComponentProps extends Record<string, any> = Record<string, any>,
> {
  /** 是否允许关闭。 */
  closable?: boolean;
  /** 页签对应组件。 */
  component?: TComponent;
  /** 透传给组件的参数。 */
  componentProps?: TComponentProps;
  /** 是否禁用。 */
  disabled?: boolean;
  /** 页签唯一键。 */
  key: string;
  /** 扩展元数据。 */
  meta?: Record<string, any>;
  /** 页签标题。 */
  title?: string;
}

/**
 * 至少包含 `key` 字段的 Tabs 项约束。
 * @description 用于约束各类页签事件载荷中的最小项结构。
 */
export type TabKeyItem = { key: string };

/**
 * Tabs 切换事件载荷。
 * @template TItem 页签项类型。
 * @description 切换激活页签时由核心层向外抛出的标准事件数据。
 */
export interface AdminTabsChangePayload<
  TItem extends TabKeyItem = AdminTabItem,
> {
  /** 当前激活 key。 */
  activeKey: string;
  /** 当前激活项。 */
  item: null | TItem;
}

/**
 * Tabs 关闭事件载荷。
 * @template TItem 页签项类型。
 * @description 关闭页签动作触发后向外抛出的标准事件数据。
 */
export interface AdminTabsClosePayload<
  TItem extends TabKeyItem = AdminTabItem,
> {
  /** 被关闭项。 */
  item: TItem;
  /** 被关闭项 key。 */
  key: string;
}
