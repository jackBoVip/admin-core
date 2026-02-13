<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { fetchProductRows, type DemoProductRow } from './data';

const gridOptions: VxeTableGridOptions<DemoProductRow> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { editRender: { name: 'input' }, field: 'category', title: 'Category' },
    { editRender: { name: 'input' }, field: 'color', title: 'Color' },
    { editRender: { name: 'input' }, field: 'productName', title: 'Product Name' },
    { field: 'price', title: 'Price' },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Release Date' },
  ],
  editConfig: {
    mode: 'cell',
    trigger: 'click',
  },
  proxyConfig: {
    ajax: {
      query: async ({ page }) =>
        await fetchProductRows({
          page: page.currentPage,
          pageSize: page.pageSize,
        }),
    },
    autoLoad: true,
    enabled: true,
    response: {
      list: 'items',
      result: 'items',
      total: 'total',
    },
  },
  showOverflow: true,
};

const [Grid] = useAdminTable<DemoProductRow>({ gridOptions });
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 单元格编辑</h1>
    <p class="page-description">点击单元格进入编辑模式。</p>

    <div class="card">
      <Grid table-title="Cell Edit" />
    </div>
  </div>
</template>
