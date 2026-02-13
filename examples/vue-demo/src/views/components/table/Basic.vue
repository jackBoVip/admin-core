<script setup lang="ts">
import type { VxeGridListeners } from 'vxe-table';
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { BASIC_ROWS, type DemoRow } from './data';

const gridOptions: VxeTableGridOptions<DemoRow> = {
  border: false,
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'name', title: 'Name' },
    { field: 'age', sortable: true, title: 'Age' },
    { field: 'nickname', title: 'Nickname' },
    { field: 'role', title: 'Role' },
    { field: 'address', showOverflow: true, title: 'Address' },
  ],
  data: BASIC_ROWS,
  pagerConfig: {
    enabled: false,
  },
  stripe: false,
};

const gridEvents: Partial<VxeGridListeners<DemoRow>> = {
  cellClick: ({ row }) => {
    console.log('cell click:', row.name);
  },
};

const [Grid, gridApi] = useAdminTable<DemoRow>({
  gridEvents,
  gridOptions,
});

const showBorder = gridApi.useStore((state) => !!state.gridOptions?.border);
const showStripe = gridApi.useStore((state) => !!state.gridOptions?.stripe);

function changeBorder() {
  gridApi.setGridOptions({
    border: !showBorder.value,
  });
}

function changeStripe() {
  gridApi.setGridOptions({
    stripe: !showStripe.value,
  });
}

function changeLoading() {
  gridApi.setLoading(true);
  setTimeout(() => {
    gridApi.setLoading(false);
  }, 1200);
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 基础</h1>
    <p class="page-description">基础列展示、store 订阅、loading 与样式切换。</p>

    <div class="card">
      <Grid table-title="基础列表" table-title-help="Table Basic Demo">
        <template #toolbar-tools>
          <button class="btn btn-primary" @click="changeBorder">
            {{ showBorder ? '隐藏' : '显示' }}边框
          </button>
          <button class="btn btn-secondary" @click="changeLoading">显示 loading</button>
          <button class="btn btn-secondary" @click="changeStripe">
            {{ showStripe ? '隐藏' : '显示' }}斑马纹
          </button>
        </template>
      </Grid>
    </div>
  </div>
</template>
