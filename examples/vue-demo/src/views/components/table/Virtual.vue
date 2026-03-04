<script setup lang="ts">
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { onMounted } from 'vue';

import { useAdminTable } from '@admin-core/table-vue';

/**
 * 虚拟滚动示例行数据结构。
 */
type RowType = {
  /** 主键 ID。 */
  id: number;
  /** 姓名。 */
  name: string;
  /** 角色名称。 */
  role: string;
  /** 性别。 */
  sex: string;
};

/**
 * 虚拟滚动表格配置。
 */
const gridOptions: VxeTableGridOptions<RowType> = {
  columns: [
    { type: 'seq', width: 70 },
    { field: 'name', title: 'Name' },
    { field: 'role', title: 'Role' },
    { field: 'sex', title: 'Sex' },
  ],
  data: [],
  height: 'auto',
  pagerConfig: {
    enabled: false,
  },
  scrollY: {
    enabled: true,
    gt: 0,
  },
  showOverflow: true,
};

/**
 * `useAdminTable` 返回的组件与 API。
 */
const [Grid, gridApi] = useAdminTable<RowType>({ gridOptions });

/**
 * 按指定数量生成并写入表格数据。
 *
 * @param size 生成条数，默认 1000。
 * @returns 无返回值。
 */
function loadList(size = 1000) {
  const list: RowType[] = [];
  for (let i = 0; i < size; i += 1) {
    list.push({
      id: 10000 + i,
      name: `Test${i}`,
      role: 'Developer',
      sex: i % 2 === 0 ? '男' : '女',
    });
  }
  gridApi.setGridOptions({ data: list });
}

onMounted(() => {
  loadList();
});
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 虚拟滚动</h1>
    <p class="page-description">大量数据下的纵向虚拟滚动演示。</p>

    <div class="card h-[520px]">
      <Grid table-title="Virtual Scroll" />
    </div>
  </div>
</template>
