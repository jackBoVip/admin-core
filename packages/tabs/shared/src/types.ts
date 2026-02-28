import type {
  AdminTabItem,
  AdminTabsChangePayload as CoreAdminTabsChangePayload,
  AdminTabsClosePayload as CoreAdminTabsClosePayload,
  AdminTabsOptions,
} from '@admin-core/tabs-core';

export interface AdminTabAdapterItem<TComponent> extends AdminTabItem {
  component?: TComponent;
  componentProps?: Record<string, any>;
}

export type AdminTabsAdapterChangePayload<TItem extends AdminTabItem> =
  CoreAdminTabsChangePayload<TItem>;

export type AdminTabsAdapterClosePayload<TItem extends AdminTabItem> =
  CoreAdminTabsClosePayload<TItem>;

export interface AdminTabsAdapterBaseProps<
  TItem extends AdminTabItem,
  TStyle = unknown,
> {
  activeKey?: null | string;
  className?: string;
  closeAriaLabel?: string;
  defaultActiveKey?: null | string;
  items?: TItem[];
  style?: TStyle;
  tabs?: boolean | AdminTabsOptions;
}
