import { resolveSearchFormDefaults } from '@admin-core/form-core';
import { defineComponent, h } from 'vue';
import { AdminForm } from './AdminForm';
import { useLocaleVersion } from '../composables/useLocaleVersion';
import { normalizeVueAttrs } from '../utils/attrs';

export const AdminSearchForm = defineComponent({
  name: 'AdminSearchForm',
  inheritAttrs: false,
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
