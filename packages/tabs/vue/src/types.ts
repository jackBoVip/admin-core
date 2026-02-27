import type {
  AdminTabItem,
  AdminTabsChangePayload as CoreAdminTabsChangePayload,
  AdminTabsClosePayload as CoreAdminTabsClosePayload,
  AdminTabsOptions,
  SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';
import type {
  Component,
  CSSProperties,
} from 'vue';

export interface AdminTabVueItem extends AdminTabItem {
  component?: Component;
  componentProps?: Record<string, any>;
}

export type AdminTabsChangePayload = CoreAdminTabsChangePayload<AdminTabVueItem>;

export type AdminTabsClosePayload = CoreAdminTabsClosePayload<AdminTabVueItem>;

export interface AdminTabsVueProps {
  activeKey?: null | string;
  className?: string;
  closeAriaLabel?: string;
  defaultActiveKey?: null | string;
  items?: AdminTabVueItem[];
  style?: CSSProperties;
  tabs?: boolean | AdminTabsOptions;
}

export interface SetupAdminTabsVueOptions
  extends SetupAdminTabsCoreOptions {
  defaults?: Partial<
    Pick<AdminTabsVueProps, 'closeAriaLabel' | 'defaultActiveKey' | 'tabs'>
  >;
}
