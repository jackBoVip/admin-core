export interface SetupController<TOptions extends object> {
  ensure: () => void;
  isInitialized: () => boolean;
  setup: (options?: TOptions) => void;
}

export function createSetupController<TOptions extends object>(
  setupHandler: (options: TOptions) => void,
  defaultOptions: TOptions
): SetupController<TOptions> {
  let initialized = false;

  const setup = (options: TOptions = defaultOptions) => {
    setupHandler(options);
    initialized = true;
  };

  const ensure = () => {
    if (initialized) {
      return;
    }
    setup(defaultOptions);
  };

  const isInitialized = () => initialized;

  return {
    ensure,
    isInitialized,
    setup,
  };
}
