import {
  setupAdminTabsCore,
  type SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';

type AdminTabsSetupPropShape = {
  closeAriaLabel?: unknown;
  defaultActiveKey?: unknown;
  tabs?: unknown;
};

export type AdminTabsAdapterSetupDefaults<
  TProps extends AdminTabsSetupPropShape,
> = Partial<Pick<TProps, 'closeAriaLabel' | 'defaultActiveKey' | 'tabs'>>;

export interface AdminTabsAdapterSetupOptions<
  TProps extends AdminTabsSetupPropShape,
> extends SetupAdminTabsCoreOptions {
  defaults?: AdminTabsAdapterSetupDefaults<TProps>;
}

export interface AdminTabsAdapterSetupState<
  TProps extends AdminTabsSetupPropShape,
> {
  core: SetupAdminTabsCoreOptions;
  defaults: AdminTabsAdapterSetupDefaults<TProps>;
  initialized: boolean;
}

export function createAdminTabsAdapterSetupState<
  TProps extends AdminTabsSetupPropShape,
>(): AdminTabsAdapterSetupState<TProps> {
  return {
    core: {},
    defaults: {},
    initialized: false,
  };
}

export function setupAdminTabsAdapter<TProps extends AdminTabsSetupPropShape>(
  setupState: AdminTabsAdapterSetupState<TProps>,
  options: AdminTabsAdapterSetupOptions<TProps> = {}
) {
  setupAdminTabsCore(options);

  setupState.core = {
    ...setupState.core,
    ...options,
  };
  setupState.defaults = {
    ...setupState.defaults,
    ...(options.defaults ?? {}),
  };
  setupState.initialized = true;

  return setupState;
}

export interface AdminTabsAdapterSetupRuntime<
  TProps extends AdminTabsSetupPropShape,
  TOptions extends AdminTabsAdapterSetupOptions<TProps>,
> {
  getSetupState: () => AdminTabsAdapterSetupState<TProps>;
  setup: (options?: TOptions) => AdminTabsAdapterSetupState<TProps>;
}

export function createAdminTabsAdapterSetupRuntime<
  TProps extends AdminTabsSetupPropShape,
  TOptions extends AdminTabsAdapterSetupOptions<TProps> = AdminTabsAdapterSetupOptions<TProps>,
>(): AdminTabsAdapterSetupRuntime<TProps, TOptions> {
  const setupState = createAdminTabsAdapterSetupState<TProps>();

  return {
    getSetupState() {
      return setupState;
    },
    setup(options?: TOptions) {
      return setupAdminTabsAdapter(setupState, options ?? {});
    },
  };
}
