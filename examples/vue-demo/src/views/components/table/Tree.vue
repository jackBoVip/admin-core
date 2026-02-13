<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { TREE_ROWS, type DemoTreeRow } from './data';

const gridOptions: VxeTableGridOptions<DemoTreeRow> = {
  columns: [
    { type: 'seq', width: 70 },
    { field: 'name', minWidth: 300, title: 'Name', treeNode: true },
    { field: 'size', title: 'Size' },
    { field: 'type', title: 'Type' },
    { field: 'date', title: 'Date' },
  ],
  data: TREE_ROWS,
  pagerConfig: {
    enabled: false,
  },
  treeConfig: {
    parentField: 'parentId',
    rowField: 'id',
    transform: true,
  },
};

const [Grid, gridApi] = useAdminTable<DemoTreeRow>({
  gridOptions,
});

function expandAll() {
  (gridApi.grid as any)?.setAllTreeExpand?.(true);
}

function collapseAll() {
  (gridApi.grid as any)?.setAllTreeExpand?.(false);
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 树形</h1>
    <p class="page-description">基于扁平数据转树形结构，支持展开/折叠控制。</p>

    <div class="card">
      <Grid table-title="树形列表">
        <template #toolbar-tools>
          <button class="btn btn-primary" @click="expandAll">展开全部</button>
          <button class="btn btn-secondary" @click="collapseAll">折叠全部</button>
        </template>
      </Grid>
    </div>
  </div>
</template>
