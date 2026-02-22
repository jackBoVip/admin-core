<script setup lang="ts">
import type { AdminFormProps } from '@admin-core/form-vue';
import type { VxeGridListeners } from 'vxe-table';
import type { VxeTableGridOptions } from '@admin-core/table-vue';

import { useAdminTable } from '@admin-core/table-vue';

import AdapterThemePreview from './AdapterThemePreview.vue';
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
  radioConfig: {
    highlight: true,
    trigger: 'row',
  },
  seqColumn: true,
  columns: [
    { field: 'name', title: 'Name' },
    { field: 'age', sortable: true, title: 'Age' },
    { field: 'risk', title: '风险指数' },
    { field: 'enabled', slots: { default: 'enabled-switch' }, title: '开关', width: 110 },
    { field: 'selected', slots: { default: 'selected-checkbox' }, title: '复选框', width: 120 },
    { field: 'level', slots: { default: 'level-select' }, title: '等级选择', width: 150 },
    { field: 'nickname', slots: { default: 'nickname-input' }, title: '昵称输入', width: 180 },
    { field: 'role', title: 'Role' },
    { field: 'address', showOverflow: true, title: 'Address' },
  ],
  data: BASIC_ROWS,
  columnCustomPersistence: {
    key: 'admin-core:vue-demo:table-basic',
    storage: 'local',
  },
  pagerConfig: {
    enabled: true,
  },
  strategy: {
    columns: {
      age: {
        rules: [
          {
            color: 'var(--warning, #f59e0b)',
            fontWeight: 600,
            when: {
              gte: 30,
            },
          },
        ],
        unit: ' 岁',
      },
      risk: {
        formula: '=ROUND(age * 1.6 + (role === "Admin" ? 8 : 0), 1)',
        rules: [
          {
            color: 'var(--destructive, #ef4444)',
            fontSize: 16,
            onClick: ({ row }: { row: Record<string, any> }) => {
              console.log('risk click:', row?.name);
            },
            when: {
              gte: 52,
            },
          },
          {
            color: 'var(--success, #10b981)',
            when: {
              lt: 40,
            },
          },
        ],
        unit: ' 分',
      },
    },
    rows: [
      {
        onClick: ({ row }: { row: Record<string, any> }) => {
          console.log('row strategy click:', row?.name);
        },
        style: {
          backgroundColor: 'var(--admin-table-strategy-row-bg, var(--primary-100, #dbeafe))',
          color: 'var(--foreground, #0f172a)',
        },
        when: {
          field: 'age',
          gte: 34,
        },
      },
      {
        style: {
          backgroundColor:
            'var(--admin-table-strategy-row-hover-bg, var(--primary-200, #bfdbfe))',
          color: 'var(--foreground, #0f172a)',
          fontWeight: 700,
        },
        when: {
          and: [
            {
              field: 'role',
              regex: '/admin/i',
            },
            {
              field: 'age',
              gte: 30,
            },
          ],
        },
      },
    ],
  },
  stripe: false,
  toolbarConfig: {
    custom: true,
    hint: {
      align: 'center',
      color: '#ef4444',
      content: '这里是顶栏提示区：支持 left / center / right、字号颜色与溢出滚动或换行。',
      fontSize: 18,
      overflow: 'scroll',
      speed: 12,
    },
    refresh: true,
    search: false,
    toolsPosition: 'before',
    toolsSlotPosition: 'before',
    tools: [
      {
        code: 'icon-only',
        onClick: ({ code }: { code?: string }) => {
          console.log('toolbar tool click:', code);
        },
        icon: 'vxe-table-icon-repeat',
      },
      {
        code: 'icon-text',
        onClick: ({ code }: { code?: string }) => {
          console.log('toolbar tool click:', code);
        },
        icon: 'vxe-table-icon-custom-column',
        title: '新增',
      },
      {
        code: 'text-only',
        onClick: ({ code }: { code?: string }) => {
          console.log('toolbar tool click:', code);
        },
        title: '自动构建',
        type: 'primary',
      },
    ],
    zoom: true,
  },
};

const gridEvents: Partial<VxeGridListeners<DemoRow>> = {
  cellClick: ({ row }) => {
    console.log('cell click:', row.name);
  },
};

const [Grid, gridApi] = useAdminTable<DemoRow>({
  formOptions,
  gridEvents,
  gridOptions,
});

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
    <h1 class="page-title">表格 - 基础</h1>
    <p class="page-description">基础列展示、store 订阅、loading 与样式切换。</p>

    <AdapterThemePreview />

    <div class="card">
      <Grid table-title="基础列表" table-title-help="提示">
        <template #enabled-switch="{ row }">
          <vxe-switch v-model="row.enabled" size="small" />
        </template>
        <template #selected-checkbox="{ row }">
          <vxe-checkbox v-model="row.selected" content="" />
        </template>
        <template #level-select="{ row }">
          <vxe-select
            v-model="row.level"
            :options="[
              { label: '高', value: 'high' },
              { label: '中', value: 'medium' },
              { label: '低', value: 'low' },
            ]"
            size="small"
            style="width: 120px"
          />
        </template>
        <template #nickname-input="{ row }">
          <vxe-input
            v-model="row.nickname"
            size="small"
            style="width: 140px"
          />
        </template>
        <template #toolbar-tools>
          <button @click="triggerLoading">
            插槽按钮
          </button>
        </template>
      </Grid>
    </div>
  </div>
</template>
