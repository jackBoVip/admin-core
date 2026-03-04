<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { fetchProductRows, type DemoProductRow } from './data';

/**
 * 行编辑表格配置。
 */
const gridOptions: VxeTableGridOptions<DemoProductRow> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { editRender: { name: 'input' }, field: 'category', title: 'Category' },
    { editRender: { name: 'input' }, field: 'color', title: 'Color' },
    { editRender: { name: 'input' }, field: 'productName', title: 'Product Name' },
    { field: 'price', title: 'Price' },
    { field: 'releaseDate', formatter: 'formatDateTime', title: 'Release Date' },
    { slots: { default: 'action' }, title: '操作', width: 160 },
  ],
  editConfig: {
    mode: 'row',
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

/**
 * `useAdminTable` 返回的组件与 API。
 */
const [Grid, gridApi] = useAdminTable<DemoProductRow>({ gridOptions });

/**
 * 判断当前行是否处于编辑状态。
 *
 * @param row 行数据。
 * @returns 是否处于编辑状态。
 */
function hasEditStatus(row: DemoProductRow) {
  return (gridApi.grid as any)?.isEditByRow?.(row);
}

/**
 * 将指定行切换为编辑模式。
 *
 * @param row 行数据。
 * @returns 无返回值。
 */
function editRowEvent(row: DemoProductRow) {
  (gridApi.grid as any)?.setEditRow?.(row);
}

/**
 * 保存行编辑结果并模拟请求延时。
 *
 * @param row 行数据。
 * @returns 无返回值。
 */
async function saveRowEvent(row: DemoProductRow) {
  await (gridApi.grid as any)?.clearEdit?.();
  gridApi.setLoading(true);
  setTimeout(() => {
    gridApi.setLoading(false);
    console.log('saved row:', row.productName);
  }, 600);
}

/**
 * 取消当前行编辑。
 *
 * @returns 无返回值。
 */
async function cancelRowEvent() {
  await (gridApi.grid as any)?.clearEdit?.();
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 行编辑</h1>
    <p class="page-description">点击编辑进入行编辑模式，支持保存与取消。</p>

    <div class="card">
      <Grid table-title="Row Edit">
        <template #action="{ row }">
          <template v-if="hasEditStatus(row)">
            <button class="btn btn-primary" @click="saveRowEvent(row)">保存</button>
            <button class="btn btn-secondary" @click="cancelRowEvent">取消</button>
          </template>
          <template v-else>
            <button class="btn btn-secondary" @click="editRowEvent(row)">编辑</button>
          </template>
        </template>
      </Grid>
    </div>
  </div>
</template>
