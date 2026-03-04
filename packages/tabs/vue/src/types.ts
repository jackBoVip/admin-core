/**
 * Tabs Vue 类型定义。
 * @description 定义 Vue 适配层页签项、事件载荷、组件属性与 setup 入参类型。
 */
import type {
  AdminTabAdapterItem,
  AdminTabsAdapterBaseProps,
  AdminTabsAdapterChangePayload,
  AdminTabsAdapterClosePayload,
  AdminTabsAdapterSetupOptions,
} from '@admin-core/tabs-shared';
import type {
  Component,
  CSSProperties,
} from 'vue';

/**
 * Vue 标签项类型。
 * @description 基于共享页签项模型，组件类型固定为 Vue `Component`。
 */
export type AdminTabVueItem = AdminTabAdapterItem<Component>;

/**
 * 标签切换事件负载类型（Vue）。
 * @description 在共享事件模型基础上绑定 Vue 页签项类型。
 */
export type AdminTabsChangePayload =
  AdminTabsAdapterChangePayload<AdminTabVueItem>;

/**
 * 标签关闭事件负载类型（Vue）。
 * @description 在共享事件模型基础上绑定 Vue 页签项类型。
 */
export type AdminTabsClosePayload =
  AdminTabsAdapterClosePayload<AdminTabVueItem>;

/**
 * Vue Tabs 组件属性。
 * @description 约束 Vue Tabs 组件的基础行为与事件回调形态。
 */
export interface AdminTabsVueProps
  extends AdminTabsAdapterBaseProps<AdminTabVueItem, CSSProperties> {
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
 * Vue Tabs 适配器初始化参数。
 * @description 用于安装阶段配置默认属性与桥接行为。
 */
export interface SetupAdminTabsVueOptions
  extends AdminTabsAdapterSetupOptions<AdminTabsVueProps> {}
