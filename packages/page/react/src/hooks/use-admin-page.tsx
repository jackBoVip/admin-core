/**
 * React 版 AdminPage Hook。
 * @description 创建并维护页面 API 生命周期，同时返回绑定该 API 的页面组件工厂。
 */

import type {
  AdminPageReactProps,
  ExtendedAdminPageApi,
  ReactPageComponent,
  UseAdminPageReturn,
} from '../types';

import {
  createPageApiWithRuntimeOptions,
  resolvePageStoreSelector,
  syncPageRuntimeState,
} from '@admin-core/page-core';
import { useEffect, useMemo, useRef } from 'react';

import { AdminPage } from '../components/AdminPage';
import { usePageSelector } from './use-page-selector';

/**
 * 创建并维护 React 版 AdminPage 组件与 API。
 * @param options Page 初始配置、路由与事件回调。
 * @returns `[PageComponent, pageApi]` 元组。
 */
export function useAdminPage(
  options: AdminPageReactProps = {}
): UseAdminPageReturn {
  /**
   * 外部传入的运行时控制参数。
   * @description 用于驱动页面激活态、页面集合、路由同步与滚动配置更新。
   */
  const {
    activeKey,
    keepInactivePages,
    onActiveChange,
    onPagesChange,
    pages,
    router,
    scroll,
  } = options;
  /**
   * 页面 API 单例引用。
   * @description 确保整个 Hook 生命周期内复用同一个 API 实例。
   */
  const apiRef = useRef<ExtendedAdminPageApi | null>(null);
  if (!apiRef.current) {
    apiRef.current = createPageApiWithRuntimeOptions<ReactPageComponent>(
      options as Record<string, unknown>
    ) as ExtendedAdminPageApi;
  }

  /**
   * 当前生效的页面 API。
   * @description 在整个 Hook 生命周期内保持稳定引用。
   */
  const api = apiRef.current;

  /**
   * 将外部输入同步到页面运行时状态。
   */
  useEffect(() => {
    syncPageRuntimeState(api, {
      activeKey,
      keepInactivePages,
      onActiveChange,
      onPagesChange,
      pages,
      router,
      scroll,
    });
  }, [
    api,
    activeKey,
    keepInactivePages,
    onActiveChange,
    onPagesChange,
    pages,
    router,
    router?.currentPath,
    scroll,
  ]);

  /**
   * Hook 卸载时释放 API 挂载状态。
   */
  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  /**
   * 订阅 Page 运行时状态切片
   * @description 支持传入选择器按需订阅，未传入时返回完整状态。
   * @template TSlice 状态切片类型。
   * @param selector 状态选择器。
   * @returns 订阅后的状态切片。
   */
  function useStore<TSlice = AdminPageReactProps>(
    selector?: (state: AdminPageReactProps) => TSlice
  ): TSlice {
    /**
     * 标准化后的 selector。
     * @description 为空时自动回退为“返回完整状态”选择器。
     */
    const safeSelector = resolvePageStoreSelector<
      AdminPageReactProps,
      TSlice
    >(selector);
    return usePageSelector<ReactPageComponent, TSlice>(
      api,
      safeSelector
    );
  }

  api.useStore = useStore;

  /**
   * 绑定当前 API 的 Page 组件构造器。
   * @description 返回稳定组件工厂，避免调用方重复创建组件类型。
   */
  const Page = useMemo(
    () =>
      /**
       * Page 渲染组件
       * @description 将外部传入属性与当前 API 组合后渲染 `AdminPage`。
       * @param props 页面运行时属性。
       * @returns 页面组件节点。
       */
      function UseAdminPage(props: AdminPageReactProps) {
        return <AdminPage {...props} api={api} />;
      },
    [api]
  );

  return [Page, api];
}

/**
 * `useAdminPage` Hook 的类型别名。
 */
export type UseAdminPage = typeof useAdminPage;
