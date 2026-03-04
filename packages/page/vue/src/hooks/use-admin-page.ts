/**
 * Vue 版 AdminPage Hook。
 * @description 创建并维护页面 API 生命周期，同时返回绑定该 API 的页面组件工厂。
 */

import type {
  AdminPageVueProps,
  ExtendedAdminPageApi,
  VuePageComponent,
  UseAdminPageReturn,
} from '../types';

import {
  createPageApiWithRuntimeOptions,
  resolvePageStoreSelector,
} from '@admin-core/page-core';
import { type Component, defineComponent, h, onBeforeUnmount } from 'vue';

import { usePageStore } from './use-page-store';
import { AdminPage } from '../components/AdminPage';

/**
 * 创建并维护 Vue 版 AdminPage 组件与 API。
 * @param options Page 初始配置、路由与事件回调。
 * @returns `[PageComponent, pageApi]` 元组。
 */
export function useAdminPage(
  options: AdminPageVueProps = {}
): UseAdminPageReturn {
  /**
   * 当前 Hook 生命周期内的 Page API 实例。
   * @description 作为 `useAdminPage` 的核心运行时对象，承载页面状态与事件分发。
   */
  const api = createPageApiWithRuntimeOptions<VuePageComponent>(
    options as Record<string, unknown>
  );
  /**
   * 扩展后的 Page API（包含 `useStore` 能力）。
   * @description 在原始 API 基础上注入订阅切片方法，提升调用体验。
   */
  const extendedApi = api as ExtendedAdminPageApi;

  /**
   * Hook 卸载时释放 API 挂载状态。
   */
  onBeforeUnmount(() => {
    api.unmount();
  });

  /**
   * 订阅 Page 运行时状态切片
   * @description 支持传入选择器按需订阅，未传入时返回完整状态。
   * @template TSlice 状态切片类型。
   * @param selector 状态选择器。
   * @returns 订阅后的状态切片。
   */
  extendedApi.useStore = <TSlice = AdminPageVueProps>(
    selector?: (state: AdminPageVueProps) => TSlice
  ) => {
    const safeSelector = resolvePageStoreSelector<
      AdminPageVueProps,
      TSlice
    >(selector);
    return usePageStore<ReturnType<typeof api.getSnapshot>, TSlice>(
      api.store,
      (snapshot) => {
        const state = snapshot.props as AdminPageVueProps;
        return safeSelector(state);
      }
    );
  };

  /**
   * 绑定当前 API 的 Page 组件构造器。
   */
  const Page = defineComponent(
    (props: AdminPageVueProps, { attrs, slots }) => {
      /**
       * 渲染 AdminPage 组件
       * @description 合并初始化参数、运行时参数与外部 attrs，并注入统一 API。
       * @returns 页面组件渲染函数。
       */
      return () =>
        h(AdminPage as unknown as Component, {
          ...(options as Record<string, unknown>),
          ...(props as Record<string, unknown>),
          ...(attrs as Record<string, unknown>),
          api: extendedApi,
        }, slots);
    },
    {
      name: 'AdminPageUse',
      inheritAttrs: false,
    }
  );

  return [Page, extendedApi];
}

/**
 * `useAdminPage` Hook 的类型别名。
 */
export type UseAdminPage = typeof useAdminPage;
