/**
 * Form Vue 通用表单 Hook。
 * @description 负责创建稳定的 formApi，并返回绑定该 API 的表单组件。
 */
import type { AdminFormApi, AdminFormProps } from '@admin-core/form-core';

import { createFormApi, mergeFormProps } from '@admin-core/form-core';
import {
  defineComponent,
  h,
  onBeforeUnmount,
} from 'vue';

import { AdminForm } from '../components/AdminForm';
import type { AdminFormComponentProps } from '../types';

/**
 * 创建并维护 Vue 版表单组件与表单 API。
 * @param options 表单初始化配置。
 * @returns `[FormComponent, formApi]` 元组。
 */
export function useAdminForm(options: AdminFormProps) {
  /** 表单 API 实例。 */
  const api = createFormApi(options);

  /**
   * Hook 返回的表单组件。
   * @description 将初始化配置、组件 props 与 attrs 合并，并注入同一个 `formApi`。
   */
  const Form = defineComponent(
    (props: AdminFormComponentProps, { attrs, slots, expose }) => {
      /** 组件卸载时释放 API 资源。 */
      onBeforeUnmount(() => {
        api.unmount();
      });

      expose({
        getFormApi: () => api,
      });

      return () =>
        h(
          AdminForm,
          mergeFormProps(options as any, props as any, attrs as any, { formApi: api }),
          slots
        );
    },
    {
      name: 'AdminUseForm',
      inheritAttrs: false,
    }
  );

  return [Form, api as AdminFormApi] as const;
}
