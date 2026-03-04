/**
 * Tabs Shared 共享类型定义。
 * @description 统一跨框架 Tabs 适配层的页签项、事件载荷与组件属性契约。
 */
import type {
  AdminTabItem,
  AdminTabsChangePayload as CoreAdminTabsChangePayload,
  AdminTabsClosePayload as CoreAdminTabsClosePayload,
  AdminTabsOptions,
} from '@admin-core/tabs-core';

/**
 * 标签页适配层单项类型。
 * @template TComponent 页签内容组件类型。
 */
export interface AdminTabAdapterItem<TComponent> extends AdminTabItem {
  /** 当前页签对应的页面组件。 */
  component?: TComponent;
  /** 渲染组件时透传的属性。 */
  componentProps?: Record<string, any>;
}

/**
 * 标签页适配层变更事件载荷类型。
 * @description 对核心事件模型进行泛型绑定，适配不同框架页签项类型。
 */
export type AdminTabsAdapterChangePayload<TItem extends AdminTabItem> =
  CoreAdminTabsChangePayload<TItem>;

/**
 * 标签页适配层关闭事件载荷类型。
 * @description 对核心事件模型进行泛型绑定，适配不同框架页签项类型。
 */
export type AdminTabsAdapterClosePayload<TItem extends AdminTabItem> =
  CoreAdminTabsClosePayload<TItem>;

/**
 * 标签页适配层基础组件属性。
 * @description 定义跨框架 Tabs 组件共用的受控/非受控与展示参数。
 * @template TItem 页签项类型。
 * @template TStyle 样式对象类型。
 */
export interface AdminTabsAdapterBaseProps<
  TItem extends AdminTabItem,
  TStyle = unknown,
> {
  /** 受控模式下的激活标签 key。 */
  activeKey?: null | string;
  /** 根节点类名。 */
  className?: string;
  /** 关闭按钮的 aria-label 文本。 */
  closeAriaLabel?: string;
  /** 非受控模式的默认激活 key。 */
  defaultActiveKey?: null | string;
  /** 页签项数组。 */
  items?: TItem[];
  /** 根节点样式对象。 */
  style?: TStyle;
  /** 标签页组件配置；`false` 表示整体禁用。 */
  tabs?: boolean | AdminTabsOptions;
}
