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

export type AdminTabVueItem = AdminTabAdapterItem<Component>;

export type AdminTabsChangePayload =
  AdminTabsAdapterChangePayload<AdminTabVueItem>;

export type AdminTabsClosePayload =
  AdminTabsAdapterClosePayload<AdminTabVueItem>;

export interface AdminTabsVueProps
  extends AdminTabsAdapterBaseProps<AdminTabVueItem, CSSProperties> {}

export interface SetupAdminTabsVueOptions
  extends AdminTabsAdapterSetupOptions<AdminTabsVueProps> {}
