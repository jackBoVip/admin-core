import {
  normalizePageLocale,
  setupAdminPageCore,
  type SetupAdminPageCoreOptions,
} from '@admin-core/page-core';

type PageTableSetupOptionShape = {
  locale?: SetupAdminPageCoreOptions['locale'];
};

export interface PageAdapterSetupOptions<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
> extends SetupAdminPageCoreOptions {
  form?: false | TFormOptions;
  table?: false | TTableOptions;
}

export interface PageAdapterSetupState {
  initialized: boolean;
  locale: ReturnType<typeof normalizePageLocale>;
}

export interface PageAdapterSetupActions<TFormOptions, TTableOptions> {
  setupForm: (options?: TFormOptions) => void;
  setupTable: (options?: TTableOptions) => void;
}

export function createPageAdapterSetupState(): PageAdapterSetupState {
  return {
    initialized: false,
    locale: 'zh-CN',
  };
}

export function setupAdminPageAdapter<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
>(
  setupState: PageAdapterSetupState,
  options: PageAdapterSetupOptions<TFormOptions, TTableOptions>,
  actions: PageAdapterSetupActions<TFormOptions, TTableOptions>
) {
  setupAdminPageCore({
    locale: options.locale,
    logLevel: options.logLevel,
  });

  if (options.form !== false) {
    actions.setupForm((options.form ?? {}) as TFormOptions);
  }

  if (options.table !== false) {
    actions.setupTable({
      ...(options.table ?? {}),
      locale: options.table?.locale ?? normalizePageLocale(options.locale),
    } as TTableOptions);
  }

  setupState.locale = normalizePageLocale(options.locale);
  setupState.initialized = true;

  return setupState;
}

export interface PageAdapterSetupRuntime<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
> {
  getSetupState: () => PageAdapterSetupState;
  setup: (
    options?: PageAdapterSetupOptions<TFormOptions, TTableOptions>
  ) => PageAdapterSetupState;
}

export function createPageAdapterSetupRuntime<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
>(
  actions: PageAdapterSetupActions<TFormOptions, TTableOptions>
): PageAdapterSetupRuntime<TFormOptions, TTableOptions> {
  const setupState = createPageAdapterSetupState();

  return {
    getSetupState() {
      return setupState;
    },
    setup(options: PageAdapterSetupOptions<TFormOptions, TTableOptions> = {}) {
      return setupAdminPageAdapter(setupState, options, actions);
    },
  };
}
