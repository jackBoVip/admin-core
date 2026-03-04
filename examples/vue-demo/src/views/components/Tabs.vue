<script setup lang="ts">
import type { AdminTabVueItem } from '@admin-core/tabs-vue';

import { AdminTabs } from '@admin-core/tabs-vue';
import {
  defineComponent,
  h,
} from 'vue';

/**
 * 创建用于 Tabs 示例的面板组件。
 *
 * @param title 面板标题。
 * @param lines 面板段落内容。
 * @returns 可直接挂到 `AdminTabs` 的 Vue 组件。
 */
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

/**
 * Tabs 演示页签配置集合。
 */
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
