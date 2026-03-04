/**
 * Form React 查询表单组件。
 * @description 基于主表单封装查询场景默认配置，并响应语言版本变化。
 */
import { resolveSearchFormDefaults } from '@admin-core/form-core';
import { memo } from 'react';
import { AdminForm } from './AdminForm';
import { useLocaleVersion } from '../hooks/useLocaleVersion';
import type { AdminFormReactProps } from '../types';

/**
 * 查询表单组件。
 * @description 基于 `AdminForm` 封装查询场景默认行为，并通过 locale 版本变化触发重渲染。
 */
export const AdminSearchForm = memo(function AdminSearchForm(
  props: AdminFormReactProps
) {
  const localeVersion = useLocaleVersion();
  void localeVersion;
  const mergedProps = resolveSearchFormDefaults(props as AdminFormReactProps);

  return <AdminForm {...mergedProps} />;
});
