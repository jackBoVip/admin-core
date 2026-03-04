/**
 * Form Vue 查询表单组件。
 * @description 基于主表单封装查询场景默认配置，并响应语言版本变化。
 */
import { resolveSearchFormDefaults } from '@admin-core/form-core';
import { defineComponent, h } from 'vue';
import { AdminForm } from './AdminForm';
import { useLocaleVersion } from '../composables/useLocaleVersion';
import { normalizeVueAttrs } from '../utils/attrs';

/**
 * 查询表单组件。
 * @description 基于 `AdminForm` 封装查询场景默认行为，并跟随语言版本触发刷新。
 */
export const AdminSearchForm = defineComponent({
  name: 'AdminSearchForm',
  inheritAttrs: false,
  /**
   * 搜索表单组合逻辑。
   * @param _props 组件属性。
   * @param context 组件上下文。
   * @returns 渲染函数。
   */
  setup(_, { attrs, slots }) {
    const localeVersion = useLocaleVersion();
    return () => {
      const localeTick = localeVersion.value;
      void localeTick;
      const rawAttrs = attrs as Record<string, any>;
      const normalizedAttrs = normalizeVueAttrs(rawAttrs);
      const mergedAttrs = resolveSearchFormDefaults(normalizedAttrs);
      return h(
        AdminForm as any,
        {
          ...rawAttrs,
          ...mergedAttrs,
        },
        slots
      );
    };
  },
});
