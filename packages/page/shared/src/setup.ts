/**
 * Page Shared 初始化编排。
 * @description 提供跨框架共用的 page/form/table 初始化状态与执行流程。
 */
import {
  normalizePageLocale,
  setupAdminPageCore,
  type SetupAdminPageCoreOptions,
} from '@admin-core/page-core';

/**
 * 表格适配层 setup 选项基础结构。
 * @description 约束 Page 组合包向表格适配层透传时必须兼容的最小字段。
 */
type PageTableSetupOptionShape = {
  /** 表格语言。 */
  locale?: SetupAdminPageCoreOptions['locale'];
};

/**
 * Page 适配层初始化选项。
 * @description 在 core 初始化参数基础上扩展 form/table 子系统的安装配置。
 * @template TFormOptions 表单适配初始化参数类型。
 * @template TTableOptions 表格适配初始化参数类型。
 */
export interface PageAdapterSetupOptions<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
> extends SetupAdminPageCoreOptions {
  /** 表单适配初始化选项；传入 `false` 表示跳过表单初始化。 */
  form?: false | TFormOptions;
  /** 表格适配初始化选项；传入 `false` 表示跳过表格初始化。 */
  table?: false | TTableOptions;
}

/**
 * Page 适配层初始化状态。
 * @description 记录适配层是否已初始化及当前生效语言，用于幂等控制。
 */
export interface PageAdapterSetupState {
  /** 是否已完成初始化。 */
  initialized: boolean;
  /** 当前生效语言。 */
  locale: ReturnType<typeof normalizePageLocale>;
}

/**
 * Page 适配层初始化动作集合。
 * @description 由具体框架实现注入，用于执行 form/table 子系统初始化。
 * @template TFormOptions 表单适配初始化参数类型。
 * @template TTableOptions 表格适配初始化参数类型。
 */
export interface PageAdapterSetupActions<TFormOptions, TTableOptions> {
  /**
   * 初始化表单适配层。
   * @param options 表单适配层初始化参数。
   * @returns 无返回值。
   */
  setupForm: (options?: TFormOptions) => void;
  /**
   * 初始化表格适配层。
   * @param options 表格适配层初始化参数。
   * @returns 无返回值。
   */
  setupTable: (options?: TTableOptions) => void;
}

/**
 * 创建 Page 适配层初始化状态。
 * @returns 初始状态对象。
 */
export function createPageAdapterSetupState(): PageAdapterSetupState {
  return {
    initialized: false,
    locale: 'zh-CN',
  };
}

/**
 * 执行 Page 适配层初始化。
 * @template TFormOptions 表单适配初始化参数类型。
 * @template TTableOptions 表格适配初始化参数类型。
 * @description
 * 1. 先初始化 `page-core`；
 * 2. 再按配置选择性初始化 form/table；
 * 3. 最后写回 locale 与 initialized 状态。
 * @param setupState 可复用初始化状态。
 * @param options 初始化选项。
 * @param actions 适配层动作集合。
 * @returns 更新后的初始化状态。
 */
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

/**
 * Page 适配层运行时对象。
 * @description 对外提供 setup 执行能力与状态读取能力，便于多处共享。
 * @template TFormOptions 表单适配初始化参数类型。
 * @template TTableOptions 表格适配初始化参数类型。
 */
export interface PageAdapterSetupRuntime<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
> {
  /** 获取当前初始化状态快照。 */
  getSetupState: () => PageAdapterSetupState;
  /**
   * 执行初始化流程。
   * @param options 初始化选项。
   * @returns 更新后的初始化状态。
   */
  setup: (
    options?: PageAdapterSetupOptions<TFormOptions, TTableOptions>
  ) => PageAdapterSetupState;
}

/**
 * 创建 Page 适配层运行时对象。
 * @param actions 适配层动作集合。
 * @returns 运行时对象。
 */
export function createPageAdapterSetupRuntime<
  TFormOptions,
  TTableOptions extends PageTableSetupOptionShape,
>(
  actions: PageAdapterSetupActions<TFormOptions, TTableOptions>
): PageAdapterSetupRuntime<TFormOptions, TTableOptions> {
  const setupState = createPageAdapterSetupState();

  return {
    /**
     * 获取当前 Page 适配层初始化状态。
     *
     * @returns 当前初始化状态快照。
     */
    getSetupState() {
      return setupState;
    },
    /**
     * 执行 Page 适配层初始化流程。
     *
     * @param options 初始化选项。
     * @returns 更新后的初始化状态。
     */
    setup(options: PageAdapterSetupOptions<TFormOptions, TTableOptions> = {}) {
      return setupAdminPageAdapter(setupState, options, actions);
    },
  };
}
