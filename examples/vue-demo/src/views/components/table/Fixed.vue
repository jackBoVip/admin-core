<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { fetchProductRows, type DemoProductRow } from './data';

const gridOptions: VxeTableGridOptions<DemoProductRow> = {
  columns: [
    { fixed: 'left', title: '序号', type: 'seq', width: 60 },
    { field: 'category', title: 'Category', width: 240 },
    { field: 'color', title: 'Color', width: 240 },
    { field: 'productName', title: 'Product Name', width: 260 },
    { field: 'price', title: 'Price', width: 180 },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Release Date', width: 320 },
    { fixed: 'right', field: 'action', slots: { default: 'action' }, title: '操作', width: 140 },
  ],
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
  rowConfig: {
    isHover: true,
  },
};

const [Grid] = useAdminTable<DemoProductRow>({ gridOptions });
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 固定列</h1>
    <p class="page-description">演示固定左列与固定右操作列。</p>

    <div class="card">
      <Grid table-title="固定列列表">
        <template #action>
          <button class="btn btn-secondary">编辑</button>
        </template>
      </Grid>
    </div>
  </div>
</template>
