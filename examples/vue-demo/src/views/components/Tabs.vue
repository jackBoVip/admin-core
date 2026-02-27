<script setup lang="ts">
import type { AdminTabVueItem } from '@admin-core/tabs-vue';

import { AdminTabs } from '@admin-core/tabs-vue';
import {
  defineComponent,
  h,
} from 'vue';

function createPanel(
  title: string,
  lines: string[]
) {
  return defineComponent({
    name: `TabsPanel${title}`,
    setup() {
      return () =>
        h('div', { class: 'admin-tabs-page__content' }, [
          h('h3', { class: 'admin-tabs-page__title' }, title),
          ...lines.map((line, index) =>
            h('p', { class: 'admin-tabs-page__line', key: `${title}-${index}` }, line)
          ),
        ]);
    },
  });
}

const items: AdminTabVueItem[] = [
  {
    closable: false,
    component: createPanel('概览', ['概览内容 A', '概览内容 B', '概览内容 C']),
    key: 'overview',
    title: '概览',
  },
  {
    closable: false,
    component: createPanel('详情页', ['详情页内容 A', '详情页内容 B', '详情页内容 C']),
    key: 'detail',
    title: '详情页',
  },
  {
    closable: false,
    component: createPanel('记录页', ['记录页内容 A', '记录页内容 B', '记录页内容 C']),
    key: 'record',
    title: '记录页',
  },
];
</script>

<template>
  <AdminTabs
    default-active-key="overview"
    :items="items"
   
  />
</template>

<style scoped>
.admin-tabs-page__content {
  border-left: 3px solid var(--primary);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 12px;
}

.admin-tabs-page__line {
  margin: 0;
}

.admin-tabs-page__title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 6px;
}
</style>
