/**
 * Shared Core 初始化控制工具。
 * @description 提供通用 setup/ensure 控制器，统一模块初始化幂等语义。
 */
/**
 * 通用初始化控制器。
 * @description 封装“仅初始化一次 + 按需兜底初始化”的通用流程控制能力。
 * @template TOptions 初始化参数类型。
 */
export interface SetupController<TOptions extends object> {
  /** 确保至少初始化一次；未初始化时使用默认参数执行。 */
  ensure: () => void;
  /** 查询是否已完成初始化。 */
  isInitialized: () => boolean;
  /** 执行初始化，可传入覆盖参数。 */
  setup: (options?: TOptions) => void;
}

/**
 * 创建可复用的初始化控制器。
 *
 * @template TOptions 初始化参数类型。
 * @param setupHandler 实际初始化处理函数。
 * @param defaultOptions 默认初始化参数。
 * @returns 初始化控制器实例。
 */
export function createSetupController<TOptions extends object>(
  setupHandler: (options: TOptions) => void,
  defaultOptions: TOptions
): SetupController<TOptions> {
  let initialized = false;

  /**
   * 执行初始化逻辑并标记为已初始化。
   *
   * @param options 初始化参数；未传时使用默认参数。
   * @returns 无返回值。
   */
  const setup = (options: TOptions = defaultOptions) => {
    setupHandler(options);
    initialized = true;
  };

  /**
   * 确保初始化至少执行一次。
   *
   * @returns 无返回值。
   */
  const ensure = () => {
    if (initialized) {
      return;
    }
    setup(defaultOptions);
  };

  /**
   * 读取当前初始化状态。
   *
   * @returns 是否已完成初始化。
   */
  const isInitialized = () => initialized;

  return {
    ensure,
    isInitialized,
    setup,
  };
}
