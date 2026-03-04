/**
 * Page API 类型定义。
 * @description 描述 AdminPage 对外暴露的快照结构、页面操作选项以及完整 API 契约。
 */

import type { AdminPageOptions, PageComputedState } from './page';
import type { StoreApi } from '@admin-core/shared-core';

/**
 * 页面 API 快照。
 * @description 聚合页面配置、挂载状态与计算结果，用于状态订阅与调试输出。
 * @template TComponent 页面组件类型。
 */
export interface AdminPageSnapshot<TComponent = unknown> {
  /** 页面运行态派生结果。 */
  computed: PageComputedState<TComponent>;
  /** 宿主注入的页面实例引用。 */
  instance: unknown;
  /** 当前是否已完成挂载。 */
  mounted: boolean;
  /** 当前生效的页面配置。 */
  props: AdminPageOptions<TComponent>;
}

/**
 * 新增页面选项。
 * @description 控制新增页面后的激活行为与插入位置策略。
 */
export interface AddPageOptions {
  /** 新增后是否立即激活该页面。 */
  activate?: boolean;
  /** 插入索引；不传时追加到末尾。 */
  index?: number;
}

/**
 * 删除页面选项。
 * @description 控制删除激活页后是否自动选中相邻页，保证交互连续性。
 */
export interface RemovePageOptions {
  /** 删除激活页后是否自动激活相邻页面。 */
  activateNeighbor?: boolean;
}

/**
 * 激活页面选项。
 * @description 控制切换激活页时是否联动触发路由跳转。
 */
export interface SetActivePageOptions {
  /** 激活后是否同步触发路由导航。 */
  triggerNavigate?: boolean;
}

/**
 * 页面 API 接口定义。
 * @description 提供页面列表维护、激活切换、路由同步与滚动策略解析能力。
 * @template TComponent 页面组件类型。
 */
export interface AdminPageApi<TComponent = unknown> {
  /** 内部快照仓库。 */
  store: StoreApi<AdminPageSnapshot<TComponent>>;
  /**
   * 获取当前页面状态。
   * @returns 当前生效的页面配置。
   */
  getState(): AdminPageOptions<TComponent>;
  /**
   * 获取当前快照。
   * @returns 包含挂载信息和派生状态的快照对象。
   */
  getSnapshot(): AdminPageSnapshot<TComponent>;
  /**
   * 标记页面挂载。
   * @param instance 可选组件实例引用。
   * @returns 无返回值。
   */
  mount(instance?: unknown): void;
  /**
   * 标记页面卸载。
   * @returns 无返回值。
   */
  unmount(): void;
  /**
   * 合并更新页面状态。
   * @param stateOrFn 状态补丁或补丁工厂。
   * @returns 无返回值。
   */
  setState(
    stateOrFn:
      | Partial<AdminPageOptions<TComponent>>
      | ((prev: AdminPageOptions<TComponent>) => Partial<AdminPageOptions<TComponent>>)
  ): void;
  /**
   * 整体替换页面列表。
   * @param pages 新页面列表。
   * @returns 无返回值。
   */
  setPages(pages: AdminPageOptions<TComponent>['pages']): void;
  /**
   * 新增页面。
   * @param page 待新增页面项。
   * @param options 新增行为选项。
   * @returns 无返回值。
   */
  addPage(
    page: NonNullable<AdminPageOptions<TComponent>['pages']>[number],
    options?: AddPageOptions
  ): void;
  /**
   * 删除页面。
   * @param key 页面 key。
   * @param options 删除行为选项。
   * @returns 无返回值。
   */
  removePage(key: string, options?: RemovePageOptions): void;
  /**
   * 设置激活页 key。
   * @param key 目标 key。
   * @param options 激活行为选项。
   * @returns 无返回值。
   */
  setActiveKey(key: null | string, options?: SetActivePageOptions): void;
  /**
   * 根据路径同步路由页激活状态。
   * @param path 目标路径，不传时从路由对象读取当前路径。
   * @returns 无返回值。
   */
  syncRoute(path?: string): void;
  /**
   * 解析指定页面是否启用滚动。
   * @param key 页面 key，不传时基于当前激活页解析。
   * @returns 是否启用滚动。
   */
  resolveScrollEnabled(key?: null | string): boolean;
}
