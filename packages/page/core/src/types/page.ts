/**
 * Page 包页面模型类型定义。
 * @description 描述页面项、路由能力、滚动配置以及查询表格桥接相关的统一类型契约。
 */

/**
 * 页面滚动配置。
 * @description 控制页面容器在横向与纵向维度的滚动行为。
 */
export interface PageScrollOptions {
  /** 是否启用页面容器滚动。 */
  enabled?: boolean;
  /** 横向滚动策略。 */
  x?: 'auto' | 'hidden' | 'scroll';
  /** 纵向滚动策略。 */
  y?: 'auto' | 'hidden' | 'scroll';
}

/**
 * 页面容器依赖的最小路由能力。
 * @template TComponent 页面组件类型。
 */
export interface PageRouterLike<TComponent = unknown> {
  /** 当前路径（通常来自路由系统的 location/pathname）。 */
  currentPath?: string;
  /**
   * 导航方法。
   * @param path 目标路径。
   * @param item 命中的路由页面项。
   * @returns 可选异步完成信号；同步实现可不返回值。
   */
  navigate?: (
    path: string,
    item: RoutePageItem<TComponent>
  ) => Promise<void> | void;
}

/**
 * 页面项公共字段。
 * @description 路由页与组件页共享的元信息定义。
 */
export interface BasePageItem {
  /** 页面唯一键；未传时由运行时根据类型自动补齐。 */
  key?: string;
  /** 页面扩展元数据。 */
  meta?: Record<string, unknown>;
  /** 页面级滚动配置（可覆盖全局 `scroll`）。 */
  scroll?: boolean | PageScrollOptions;
  /** 页面标题。 */
  title?: string;
}

/**
 * 路由页面项。
 * @template TComponent 页面组件类型。
 */
export interface RoutePageItem<TComponent = unknown> extends BasePageItem {
  /** 是否精确匹配路径；`false` 时支持前缀匹配。 */
  exact?: boolean;
  /** 路由路径。 */
  path: string;
  /** 透传给页面组件的参数。 */
  props?: Record<string, unknown>;
  /** 可选组件渲染入口（路由项支持直接挂组件）。 */
  component?: TComponent;
  /** 页面项类型。 */
  type: 'route';
}

/**
 * 组件页面项。
 * @template TComponent 页面组件类型。
 */
export interface ComponentPageItem<TComponent = unknown> extends BasePageItem {
  /** 组件渲染入口。 */
  component: TComponent;
  /** 透传给组件的参数。 */
  props?: Record<string, unknown>;
  /** 页面项类型。 */
  type: 'component';
}

/**
 * 页面项联合类型。
 * @template TComponent 页面组件类型。
 */
export type AdminPageItem<TComponent = unknown> =
  | ComponentPageItem<TComponent>
  | RoutePageItem<TComponent>;

/**
 * 激活页面变更事件载荷。
 * @template TComponent 页面组件类型。
 */
export interface PageActiveChangePayload<TComponent = unknown> {
  /** 当前激活页面 key。 */
  activeKey: null | string;
  /** 当前激活页面对象。 */
  activePage: AdminPageItem<TComponent> | null;
}

/**
 * 页面列表变更事件载荷。
 * @template TComponent 页面组件类型。
 */
export interface PagePagesChangePayload<TComponent = unknown> {
  /** 最新页面列表。 */
  pages: AdminPageItem<TComponent>[];
}

/**
 * `AdminPage` 组件配置。
 * @template TComponent 页面组件类型。
 */
export interface AdminPageOptions<TComponent = unknown> {
  /** 受控激活 key。 */
  activeKey?: null | string;
  /** 是否保留非激活页（true 时非激活页不卸载）。 */
  keepInactivePages?: boolean;
  /** 激活页变更回调。 */
  onActiveChange?: (payload: PageActiveChangePayload<TComponent>) => void;
  /** 页面列表变更回调。 */
  onPagesChange?: (payload: PagePagesChangePayload<TComponent>) => void;
  /** 页面列表。 */
  pages?: AdminPageItem<TComponent>[];
  /** 路由能力对象。 */
  router?: PageRouterLike<TComponent>;
  /** 全局滚动配置。 */
  scroll?: boolean | PageScrollOptions;
}

/**
 * 页面容器运行态派生状态。
 * @template TComponent 页面组件类型。
 */
export interface PageComputedState<TComponent = unknown> {
  /** 当前激活页面 key。 */
  activeKey: null | string;
  /** 当前激活页面。 */
  activePage: AdminPageItem<TComponent> | null;
  /** 标准化后的页面列表。 */
  pages: AdminPageItem<TComponent>[];
  /** 当前激活页是否启用滚动。 */
  scrollEnabled: boolean;
}

/**
 * 标准化后的滚动配置。
 * @description 由入参配置归一化而来，供运行时逻辑直接消费。
 */
export interface NormalizedPageScrollOptions {
  /** 是否启用滚动。 */
  enabled: boolean;
  /** 横向滚动策略。 */
  x: 'auto' | 'hidden' | 'scroll';
  /** 纵向滚动策略。 */
  y: 'auto' | 'hidden' | 'scroll';
}

/**
 * 表单-表格桥接触发动作。
 * @description 用于区分桥接由“提交”还是“重置”动作触发。
 */
export type PageFormTableAction = 'reset' | 'submit';

/**
 * 表单-表格桥接上下文。
 * @description 向桥接处理逻辑透出当前动作以及表单、表格 API。
 */
export interface PageFormTableBridgeContext<
  TFormApi = unknown,
  TTableApi = unknown,
> {
  /** 当前触发动作。 */
  action: PageFormTableAction;
  /** 表单 API。 */
  formApi: TFormApi;
  /** 表格 API。 */
  tableApi: TTableApi;
}

/**
 * 表单-表格桥接配置。
 * @description 定义查询参数映射方式以及提交/重置时与表格联动策略。
 */
export interface PageFormTableBridgeOptions<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi = unknown,
> {
  /** 是否启用桥接。 */
  enabled?: boolean;
  /**
   * 查询参数映射器。
   * @param values 表单值。
   * @param context 桥接上下文。
   * @returns 映射后的查询参数对象（支持同步或异步返回）。
   */
  mapParams?: (
    values: TFormValues,
    context: PageFormTableBridgeContext<TFormApi, TTableApi>
  ) => Promise<Record<string, unknown>> | Record<string, unknown>;
  /** 提交时是否触发表格查询。 */
  queryOnSubmit?: boolean;
  /** 重置时是否触发表格刷新。 */
  reloadOnReset?: boolean;
}

/**
 * 标准化后的表单-表格桥接配置。
 * @description 将可选配置补齐为必填布尔值，便于运行时判断。
 */
export interface NormalizedPageFormTableBridgeOptions<
  TFormValues extends Record<string, unknown> = Record<string, unknown>,
  TFormApi = unknown,
  TTableApi = unknown,
> extends Omit<
    PageFormTableBridgeOptions<TFormValues, TFormApi, TTableApi>,
    'enabled' | 'queryOnSubmit' | 'reloadOnReset'
  > {
  /** 是否启用桥接。 */
  enabled: boolean;
  /** 提交时是否触发表格查询。 */
  queryOnSubmit: boolean;
  /** 重置时是否触发表格刷新。 */
  reloadOnReset: boolean;
}

/**
 * 查询表格执行器。
 * @description 约束与查询表格联动时最小可调用能力集合。
 */
export interface PageQueryTableExecutor {
  /**
   * 执行查询。
   * @param params 可选查询参数。
   * @returns 查询请求结果。
   */
  query: (params?: Record<string, unknown>) => Promise<unknown>;
  /**
   * 执行刷新。
   * @param params 可选刷新参数。
   * @returns 刷新请求结果。
   */
  reload: (params?: Record<string, unknown>) => Promise<unknown>;
}

/**
 * 查询表格组合 API。
 * @description 将表单 API 与表格执行器能力打包为统一调用入口。
 */
export interface PageQueryTableApi<
  TFormApi = unknown,
  TTableApi extends PageQueryTableExecutor = PageQueryTableExecutor,
> extends PageQueryTableExecutor {
  /** 表单 API。 */
  formApi: TFormApi;
  /** 表格 API。 */
  tableApi: TTableApi;
}

/**
 * 查询表格布局配置。
 * @description 控制查询表单与表格区域在页面中的高度分配与滚动模式。
 */
export interface PageQueryTableLayoutOptions {
  /**
   * 是否启用固定高度模式。
   * `true`：锁定剩余视口高度，在表格区域内滚动。
   * `false`：页面自然流式滚动，表格不强制固定高度。
   */
  fixed?: boolean;
  /**
   * 指定表格视口高度（`number` 或 `${number}px`）。
   * 配置后会切换为流式模式，并将高度应用到表格滚动区域。
   */
  tableHeight?: number | string;
}
