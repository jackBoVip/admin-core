/**
 * Form React 通用表单 Hook。
 * @description 负责创建稳定的 formApi，并返回绑定该 API 的表单组件。
 */
import { createFormApi, mergeFormProps } from '@admin-core/form-core';
import { useEffect, useMemo, useRef } from 'react';
import type { AdminFormProps } from '@admin-core/form-core';
import type { ComponentType } from 'react';

import { AdminForm } from '../components/AdminForm';
import type { AdminFormReactProps } from '../types';

/**
 * 创建并维护 React 版表单组件与表单 API。
 * @param options 表单初始化配置。
 * @returns `[FormComponent, formApi]` 元组。
 */
export function useAdminForm(options: AdminFormProps) {
  /** 表单 API 单例引用，确保 Hook 生命周期内实例稳定。 */
  const apiRef = useRef<ReturnType<typeof createFormApi> | null>(null);
  if (!apiRef.current) {
    apiRef.current = createFormApi(options);
  }
  const api = apiRef.current;
  /** 持有最新 options，供闭包内渲染函数读取。 */
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  const Form: ComponentType<AdminFormReactProps> = useMemo(
    () =>
      /**
       * Hook 返回的表单组件。
       * @description 组合初始化参数与运行时传入参数，并注入同一个 `formApi`。
       * @param props 运行时覆盖属性。
       * @returns 表单组件节点。
       */
      function UseAdminForm(props) {
        return (
          <AdminForm
            {...mergeFormProps(optionsRef.current as any, props as any, { formApi: api })}
          />
        );
      },
    [api]
  );

  return [Form, api] as const;
}
