export type AdminTabsAlign = 'center' | 'left' | 'right';

export interface AdminTabsOptions {
  align?: AdminTabsAlign;
  contentInsetTop?: number | string;
  enabled?: boolean;
  hideWhenSingle?: boolean;
  sticky?: boolean;
  stickyTop?: number | string;
}

export interface NormalizedAdminTabsOptions {
  align: AdminTabsAlign;
  contentInsetTop: number | string;
  enabled: boolean;
  hideWhenSingle: boolean;
  sticky: boolean;
  stickyTop: number | string;
}

export interface AdminTabItem<
  TComponent = unknown,
  TComponentProps extends Record<string, any> = Record<string, any>,
> {
  closable?: boolean;
  component?: TComponent;
  componentProps?: TComponentProps;
  disabled?: boolean;
  key: string;
  meta?: Record<string, any>;
  title?: string;
}

export interface AdminTabsChangePayload<
  TItem extends { key: string } = AdminTabItem,
> {
  activeKey: string;
  item: null | TItem;
}

export interface AdminTabsClosePayload<
  TItem extends { key: string } = AdminTabItem,
> {
  item: TItem;
  key: string;
}
