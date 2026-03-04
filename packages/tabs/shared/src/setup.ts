/**
 * Tabs Shared 初始化编排。
 * @description 提供跨框架共用的 tabs-core 初始化状态与默认属性注入流程。
 */
import {
  setupAdminTabsCore,
  type SetupAdminTabsCoreOptions,
} from '@admin-core/tabs-core';

/**
 * 标签页适配层默认属性的最小结构约束。
 * @description 用于约束不同框架适配层可共享的默认字段。
 */
type AdminTabsSetupPropShape = {
  /** 关闭按钮 aria-label。 */
  closeAriaLabel?: unknown;
  /** 默认激活标签 key。 */
  defaultActiveKey?: unknown;
  /** 默认标签列表。 */
  tabs?: unknown;
};

/**
 * 标签页适配层默认配置类型。
 * @description 限定可由 setup 统一注入的默认 props 字段范围。
 * @template TProps 组件属性类型。
 */
export type AdminTabsAdapterSetupDefaults<
  TProps extends AdminTabsSetupPropShape,
> = Partial<Pick<TProps, 'closeAriaLabel' | 'defaultActiveKey' | 'tabs'>>;

/**
 * 标签页适配层 setup 选项。
 * @description 在 core setup 参数基础上扩展适配层默认属性注入能力。
 * @template TProps 组件属性类型。
 */
export interface AdminTabsAdapterSetupOptions<
  TProps extends AdminTabsSetupPropShape,
> extends SetupAdminTabsCoreOptions {
  /** 适配层默认 props 覆盖项。 */
  defaults?: AdminTabsAdapterSetupDefaults<TProps>;
}

/**
 * 标签页适配层 setup 运行时状态。
 * @description 持有累计 core 参数、默认项与初始化标记，支持幂等更新。
 * @template TProps 组件属性类型。
 */
export interface AdminTabsAdapterSetupState<
  TProps extends AdminTabsSetupPropShape,
> {
  /** 标签页核心初始化参数。 */
  core: SetupAdminTabsCoreOptions;
  /** 适配层默认项。 */
  defaults: AdminTabsAdapterSetupDefaults<TProps>;
  /** 是否已初始化。 */
  initialized: boolean;
}

/**
 * 创建标签页适配层 setup 初始状态。
 * @template TProps 组件属性类型。
 * @returns 初始状态对象。
 */
export function createAdminTabsAdapterSetupState<
  TProps extends AdminTabsSetupPropShape,
>(): AdminTabsAdapterSetupState<TProps> {
  return {
    core: {},
    defaults: {},
    initialized: false,
  };
}

/**
 * 执行标签页适配层 setup 并更新状态。
 * @template TProps 组件属性类型。
 * @param setupState 可复用 setup 状态。
 * @param options setup 选项。
 * @returns 更新后的 setup 状态。
 */
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

/**
 * Tabs 适配层 setup 运行时对象。
 * @description 提供 setup 与状态读取 API，供框架侧入口模块复用。
 * @template TProps 组件属性类型。
 * @template TOptions setup 入参类型。
 */
export interface AdminTabsAdapterSetupRuntime<
  TProps extends AdminTabsSetupPropShape,
  TOptions extends AdminTabsAdapterSetupOptions<TProps>,
> {
  /** 获取当前 setup 状态快照。 */
  getSetupState: () => AdminTabsAdapterSetupState<TProps>;
  /**
   * 执行 setup。
   * @param options setup 选项。
   * @returns 更新后的 setup 状态。
   */
  setup: (options?: TOptions) => AdminTabsAdapterSetupState<TProps>;
}

/**
 * 创建 Tabs 适配层 setup 运行时对象。
 * @returns 运行时对象。
 */
export function createAdminTabsAdapterSetupRuntime<
  TProps extends AdminTabsSetupPropShape,
  TOptions extends AdminTabsAdapterSetupOptions<TProps> = AdminTabsAdapterSetupOptions<TProps>,
>(): AdminTabsAdapterSetupRuntime<TProps, TOptions> {
  const setupState = createAdminTabsAdapterSetupState<TProps>();

  return {
    /**
     * 获取当前 Tabs 适配层 setup 状态。
     *
     * @returns setup 状态快照。
     */
    getSetupState() {
      return setupState;
    },
    /**
     * 执行 Tabs 适配层 setup。
     *
     * @param options setup 选项。
     * @returns 更新后的 setup 状态。
     */
    setup(options?: TOptions) {
      return setupAdminTabsAdapter(setupState, options ?? {});
    },
  };
}
