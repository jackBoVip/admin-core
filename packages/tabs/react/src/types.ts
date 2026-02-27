import type {
  AdminTabItem,
  AdminTabsChangePayload as CoreAdminTabsChangePayload,
  AdminTabsClosePayload as CoreAdminTabsClosePayload,
  AdminTabsOptions,
  SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';
import type { CSSProperties } from 'react';
import type {
  ComponentType,
  ReactElement,
} from 'react';

export type AdminTabReactComponent = ComponentType<any> | ReactElement;
export interface AdminTabReactItem extends AdminTabItem {
  component?: AdminTabReactComponent;
  componentProps?: Record<string, any>;
}

export type AdminTabsChangePayload = CoreAdminTabsChangePayload<AdminTabReactItem>;

export type AdminTabsClosePayload = CoreAdminTabsClosePayload<AdminTabReactItem>;

export interface AdminTabsReactProps {
  activeKey?: null | string;
  className?: string;
  closeAriaLabel?: string;
  defaultActiveKey?: null | string;
  items?: AdminTabReactItem[];
  onChange?: (payload: AdminTabsChangePayload) => void;
  onClose?: (payload: AdminTabsClosePayload) => void;
  style?: CSSProperties;
  tabs?: boolean | AdminTabsOptions;
}

export interface SetupAdminTabsReactOptions
  extends SetupAdminTabsCoreOptions {
  defaults?: Partial<
    Pick<AdminTabsReactProps, 'closeAriaLabel' | 'defaultActiveKey' | 'tabs'>
  >;
}
