<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { fetchProductRows, type DemoProductRow } from './data';

const gridOptions: VxeTableGridOptions<DemoProductRow> = {
  checkboxConfig: {
    highlight: true,
    labelField: 'productName',
  },
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { align: 'left', title: 'Pick', type: 'checkbox', width: 80 },
    { field: 'category', sortable: true, title: 'Category' },
    { field: 'color', sortable: true, title: 'Color' },
    { field: 'productName', sortable: true, title: 'Product Name' },
    { field: 'price', sortable: true, title: 'Price' },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Release Date' },
  ],
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page, sort }) => {
        const sortOrder =
          sort.order === 'asc' || sort.order === 'desc'
            ? sort.order
            : undefined;
        return await fetchProductRows({
          page: page.currentPage,
          pageSize: page.pageSize,
          sortBy: sort.field,
          sortOrder,
        });
      },
    },
    autoLoad: true,
    enabled: true,
    response: {
      list: 'items',
      result: 'items',
      total: 'total',
    },
    sort: true,
  },
  sortConfig: {
    defaultSort: { field: 'category', order: 'desc' },
    remote: true,
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    zoom: true,
  },
};

const [Grid, gridApi] = useAdminTable<DemoProductRow>({
  gridOptions,
});
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 远程数据</h1>
    <p class="page-description">演示 proxyConfig 远程分页、排序以及 query/reload 行为差异。</p>

    <div class="card">
      <Grid table-title="远程列表" table-title-help="Remote Query">
        <template #toolbar-tools>
          <button class="btn btn-primary" @click="() => gridApi.query()">刷新当前页</button>
          <button class="btn btn-secondary" @click="() => gridApi.reload()">刷新并回第一页</button>
        </template>
      </Grid>
    </div>
  </div>
</template>
