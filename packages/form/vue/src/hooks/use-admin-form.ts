import type { AdminFormApi, AdminFormProps } from '@admin-core/form-core';

import { createFormApi, mergeFormProps } from '@admin-core/form-core';
import {
  defineComponent,
  h,
  onBeforeUnmount,
} from 'vue';

import { AdminForm } from '../components/AdminForm';
import type { AdminFormComponentProps } from '../types';

export function useAdminForm(options: AdminFormProps) {
  const api = createFormApi(options);

  const Form = defineComponent(
    (props: AdminFormComponentProps, { attrs, slots, expose }) => {
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
