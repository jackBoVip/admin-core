<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { fetchProductRows, type DemoProductRow } from './data';

const statusOptions = [
  { color: '#16a34a', label: 'Enabled', value: 'enabled' },
  { color: '#dc2626', label: 'Disabled', value: 'disabled' },
];

const gridOptions: VxeTableGridOptions<DemoProductRow> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'category', title: 'Category', width: 100 },
    { field: 'imageUrl', slots: { default: 'image' }, title: 'Image', width: 100 },
    { field: 'open', slots: { default: 'open' }, title: 'Open', width: 100 },
    {
      cellRender: {
        name: 'CellTag',
        options: statusOptions,
      },
      field: 'status',
      title: 'Status',
      width: 120,
    },
    { field: 'color', title: 'Color', width: 100 },
    { field: 'productName', title: 'Product Name', width: 200 },
    { field: 'price', title: 'Price', width: 100 },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Date', width: 200 },
    {
      cellRender: {
        attrs: {
          nameField: 'productName',
          onClick: ({ code, row }: any) => {
            console.log('action click:', code, row.productName);
          },
        },
        name: 'CellOperation',
      },
      field: 'operation',
      fixed: 'right',
      title: '操作',
      width: 180,
    },
  ],
  keepSource: true,
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
};

const [Grid] = useAdminTable<DemoProductRow>({ gridOptions });
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 自定义单元格</h1>
    <p class="page-description">同时演示 slot 渲染与内置 CellTag/CellOperation 渲染器。</p>

    <div class="card">
      <Grid table-title="自定义单元格列表">
        <template #image="{ row }">
          <img :src="row.imageUrl" width="28" height="28" class="rounded-full" />
        </template>
        <template #open="{ row }">
          <input v-model="row.open" type="checkbox" />
        </template>
      </Grid>
    </div>
  </div>
</template>
