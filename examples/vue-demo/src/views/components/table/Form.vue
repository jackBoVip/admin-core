<script setup lang="ts">
import type { AdminFormProps } from '@admin-core/form-vue';
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { fetchProductRows, type DemoProductRow } from './data';

const formOptions: AdminFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'input',
      componentProps: { placeholder: 'Category' },
      fieldName: 'category',
      label: 'Category',
    },
    {
      component: 'input',
      componentProps: { placeholder: 'Product Name' },
      fieldName: 'productName',
      label: 'ProductName',
    },
    {
      component: 'select',
      componentProps: {
        options: [
          { label: 'Blue', value: 'blue' },
          { label: 'Green', value: 'green' },
          { label: 'Orange', value: 'orange' },
        ],
      },
      fieldName: 'color',
      label: 'Color',
    },
    {
      component: 'date-range',
      fieldName: 'releaseDateRange',
      label: 'Release Date',
    },
  ],
  showCollapseButton: true,
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<DemoProductRow> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'category', title: 'Category' },
    { field: 'color', title: 'Color' },
    { field: 'productName', title: 'Product Name' },
    { field: 'price', title: 'Price' },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Release Date' },
  ],
  keepSource: true,
  proxyConfig: {
    ajax: {
      query: async ({ page }, formValues) => {
        const data = await fetchProductRows({
          page: page.currentPage,
          pageSize: page.pageSize,
        });

        const keyword = String(formValues?.productName ?? '').trim().toLowerCase();
        const category = String(formValues?.category ?? '').trim().toLowerCase();
        const color = String(formValues?.color ?? '').trim().toLowerCase();

        const filtered = data.items.filter((item) => {
          const hitKeyword = !keyword || item.productName.toLowerCase().includes(keyword);
          const hitCategory = !category || item.category.toLowerCase().includes(category);
          const hitColor = !color || item.color.toLowerCase() === color;
          return hitKeyword && hitCategory && hitColor;
        });

        return {
          items: filtered,
          total: filtered.length,
        };
      },
    },
    autoLoad: true,
    enabled: true,
    response: {
      list: 'items',
      result: 'items',
      total: 'total',
    },
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
};

const [Grid] = useAdminTable<DemoProductRow>({
  formOptions,
  gridOptions,
});
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 搜索表单</h1>
    <p class="page-description">table 与 form 一体化：查询、重置、折叠与 search panel toggle。</p>

    <div class="card">
      <Grid table-title="带搜索表单的列表" />
    </div>
  </div>
</template>
