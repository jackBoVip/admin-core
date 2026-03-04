/**
 * Tabs React 类型定义。
 * @description 定义 React 适配层页签项、事件载荷、组件属性与 setup 入参类型。
 */
import type {
  AdminTabAdapterItem,
  AdminTabsAdapterBaseProps,
  AdminTabsAdapterChangePayload,
  AdminTabsAdapterClosePayload,
  AdminTabsAdapterSetupOptions,
} from '@admin-core/tabs-shared';
import type { CSSProperties } from 'react';
import type {
  ComponentType,
  ReactElement,
} from 'react';

/**
 * React 标签页内容组件类型。
 * @description 同时支持组件类型与已构建的 React 元素。
 */
export type AdminTabReactComponent = ComponentType<any> | ReactElement;
/**
 * React 标签项类型。
 * @description 在共享页签项结构基础上补充 React 组件信息。
 */
export type AdminTabReactItem = AdminTabAdapterItem<AdminTabReactComponent>;

/**
 * 标签切换事件负载类型（React）。
 * @description 在共享事件模型基础上绑定 React 页签项类型。
 */
export type AdminTabsChangePayload =
  AdminTabsAdapterChangePayload<AdminTabReactItem>;

/**
 * 标签关闭事件负载类型（React）。
 * @description 在共享事件模型基础上绑定 React 页签项类型。
 */
export type AdminTabsClosePayload =
  AdminTabsAdapterClosePayload<AdminTabReactItem>;

/**
 * React Tabs 组件属性。
 * @description 约束 React Tabs 组件的基础行为与事件回调形态。
 */
export interface AdminTabsReactProps
  extends AdminTabsAdapterBaseProps<AdminTabReactItem, CSSProperties> {
  /**
   * 页签切换回调。
   * @param payload 切换事件载荷。
   * @returns 无返回值。
   */
  onChange?: (payload: AdminTabsChangePayload) => void;
  /**
   * 页签关闭回调。
   * @param payload 关闭事件载荷。
   * @returns 无返回值。
   */
  onClose?: (payload: AdminTabsClosePayload) => void;
}

/**
 * React Tabs 适配器初始化参数。
 * @description 用于安装阶段配置默认属性与桥接行为。
 */
export interface SetupAdminTabsReactOptions
  extends AdminTabsAdapterSetupOptions<AdminTabsReactProps> {}
