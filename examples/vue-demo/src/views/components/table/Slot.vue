<script setup lang="ts">
import type { AdminFormProps } from '@admin-core/form-vue';
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import { BASIC_ROWS, type DemoRow } from './data';

const formOptions: AdminFormProps = {
  collapsed: false,
  schema: [
    {
      component: 'input',
      componentProps: { placeholder: '请输入姓名' },
      fieldName: 'name',
      label: 'Name',
    },
  ],
  showCollapseButton: false,
  submitOnChange: false,
  submitOnEnter: false,
};

const gridOptions: VxeTableGridOptions<DemoRow> = {
  columns: [
    { title: '序号', type: 'seq', width: 60 },
    { field: 'name', title: 'Name' },
    { field: 'age', title: 'Age', width: 100 },
    { field: 'role', slots: { default: 'role' }, title: 'Role', width: 140 },
    { field: 'address', showOverflow: true, title: 'Address' },
  ],
  data: BASIC_ROWS,
  pagerConfig: {
    enabled: false,
  },
  toolbarConfig: {
    custom: true,
    refresh: true,
    search: true,
    zoom: true,
  },
};

const roleStyleMap: Record<string, { background: string; color: string }> = {
  admin: { background: 'rgba(239, 68, 68, 0.12)', color: '#dc2626' },
  guest: { background: 'rgba(107, 114, 128, 0.15)', color: '#4b5563' },
  manager: { background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' },
  user: { background: 'rgba(16, 185, 129, 0.12)', color: '#059669' },
};

const [Grid, gridApi] = useAdminTable<DemoRow>({
  formOptions,
  gridOptions,
});

function getRoleStyle(role: string) {
  return (
    roleStyleMap[role.toLowerCase()] ?? {
      background: 'rgba(99, 102, 241, 0.12)',
      color: '#4f46e5',
    }
  );
}

async function triggerLoading() {
  gridApi.setLoading(true);
  await new Promise((resolve) => {
    setTimeout(resolve, 600);
  });
  gridApi.setLoading(false);
}
</script>

<template>
  <div class="page-container">
    <h1 class="page-title">表格 - 插槽示例</h1>
    <p class="page-description">演示 table-title、toolbar-actions、toolbar-center、toolbar-tools、列插槽与 empty 插槽。</p>

    <div class="card">
      <Grid table-title="插槽列表" table-title-help="Slot Demo">
        <template #table-title>
          <div class="slot-title">
            <span>插槽列表</span>
            <span class="slot-badge">SLOTS</span>
          </div>
        </template>

        <template #toolbar-actions>
          <button @click="gridApi.toggleSearchForm()">
            切换搜索
          </button>
        </template>

        <template #toolbar-center>
          <div class="slot-center-hint">
            这是 toolbar-center 插槽，可完全替换中间提示区内容。
          </div>
        </template>

        <template #toolbar-tools>
          <button @click="triggerLoading">
            模拟加载
          </button>
        </template>

        <template #role="{ row }">
          <span class="slot-role" :style="getRoleStyle(row.role)">
            {{ row.role }}
          </span>
        </template>

        <template #empty>
          <div class="slot-empty">暂无数据（empty 插槽）</div>
        </template>
      </Grid>
    </div>
  </div>
</template>

<style scoped>
.slot-title {
  align-items: center;
  display: inline-flex;
  gap: 8px;
}

.slot-badge {
  background: color-mix(in oklch, var(--primary, #1677ff) 12%, transparent);
  border-radius: 999px;
  color: var(--primary, #1677ff);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  padding: 4px 8px;
}

.slot-role {
  border-radius: 999px;
  display: inline-flex;
  font-size: 12px;
  font-weight: 600;
  line-height: 1;
  padding: 4px 10px;
}

.slot-center-hint {
  color: var(--destructive, #ef4444);
  font-size: 13px;
  white-space: nowrap;
}

.slot-empty {
  color: var(--muted-foreground, #64748b);
  padding: 16px 0;
}
</style>
