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

export type AdminTabReactComponent = ComponentType<any> | ReactElement;
export type AdminTabReactItem = AdminTabAdapterItem<AdminTabReactComponent>;

export type AdminTabsChangePayload =
  AdminTabsAdapterChangePayload<AdminTabReactItem>;

export type AdminTabsClosePayload =
  AdminTabsAdapterClosePayload<AdminTabReactItem>;

export interface AdminTabsReactProps
  extends AdminTabsAdapterBaseProps<AdminTabReactItem, CSSProperties> {
  onChange?: (payload: AdminTabsChangePayload) => void;
  onClose?: (payload: AdminTabsClosePayload) => void;
}

export interface SetupAdminTabsReactOptions
  extends AdminTabsAdapterSetupOptions<AdminTabsReactProps> {}
