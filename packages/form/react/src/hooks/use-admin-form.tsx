

import { createFormApi, mergeFormProps } from '@admin-core/form-core';
import { useEffect, useMemo, useRef } from 'react';
import { AdminForm } from '../components/AdminForm';
import type { AdminFormReactProps } from '../types';
import type { AdminFormProps } from '@admin-core/form-core';
import type { ComponentType } from 'react';

export function useAdminForm(options: AdminFormProps) {
  const apiRef = useRef<ReturnType<typeof createFormApi> | null>(null);
  if (!apiRef.current) {
    apiRef.current = createFormApi(options);
  }
  const api = apiRef.current;
  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    return () => {
      api.unmount();
    };
  }, [api]);

  const Form: ComponentType<AdminFormReactProps> = useMemo(
    () =>
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
