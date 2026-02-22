import { resolveSearchFormDefaults } from '@admin-core/form-core';
import { memo } from 'react';
import { AdminForm } from './AdminForm';
import { useLocaleVersion } from '../hooks/useLocaleVersion';
import type { AdminFormReactProps } from '../types';

export const AdminSearchForm = memo(function AdminSearchForm(
  props: AdminFormReactProps
) {
  const localeVersion = useLocaleVersion();
  void localeVersion;
  const mergedProps = resolveSearchFormDefaults(props as AdminFormReactProps);

  return <AdminForm {...mergedProps} />;
});
