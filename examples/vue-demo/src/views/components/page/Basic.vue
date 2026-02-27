<script setup lang="ts">
import type { AdminFormProps } from '@admin-core/form-vue';
import type { AdminTableVueProps } from '@admin-core/table-vue';
import type { DemoRow } from '../table/data';

import { useAdminPageQueryTable } from '@admin-core/page-vue';
import { computed, ref } from 'vue';

import { BASIC_ROWS, sleep } from '../table/data';

interface SearchFormValues {
  keyword?: string;
  level?: '' | DemoRow['level'];
  maxAge?: string;
  minAge?: string;
  role?: '' | DemoRow['role'];
  status?: '' | 'disabled' | 'enabled';
}

interface MockQueryRequest {
  method: 'POST';
  page: {
    currentPage: number;
    pageSize: number;
  };
  params: SearchFormValues;
  sort: {
    field?: string;
    order?: 'asc' | 'desc';
  };
  url: '/api/page/query';
}

interface MockQueryResponse<T> {
  code: number;
  data: {
    items: T[];
    total: number;
  };
  message: string;
  request: MockQueryRequest;
}

const ROLE_OPTIONS: Array<{ label: string; value: '' | DemoRow['role'] }> = [
  { label: '全部角色', value: '' },
  { label: 'User', value: 'User' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Guest', value: 'Guest' },
];

const LEVEL_OPTIONS: Array<{
  label: string;
  value: '' | NonNullable<DemoRow['level']>;
}> = [
  { label: '全部等级', value: '' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const STATUS_OPTIONS: Array<{
  label: string;
  value: '' | 'disabled' | 'enabled';
}> = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

function parseOptionalNumber(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

function sortRowsByField(rows: DemoRow[], field?: string, order?: 'asc' | 'desc') {
  if (!field || !order) {
    return rows;
  }
  const sorted = [...rows];
  sorted.sort((a, b) => {
    const aValue = (a as Record<string, any>)[field];
    const bValue = (b as Record<string, any>)[field];
    if (aValue === bValue) {
      return 0;
    }
    const aNum = Number(aValue);
    const bNum = Number(bValue);
    const result =
      Number.isFinite(aNum) && Number.isFinite(bNum)
        ? aNum - bNum
        : String(aValue).localeCompare(String(bValue), undefined, {
          numeric: true,
          sensitivity: 'base',
        });
    return order === 'desc' ? -result : result;
  });
  return sorted;
}

async function queryRowsByBackend(
  requestArg: {
    page?: { currentPage?: number; pageSize?: number };
    sort?: { field?: string; order?: string };
  } = {},
  params: SearchFormValues = {}
) {
  const currentPage = Number(requestArg.page?.currentPage ?? 1) || 1;
  const pageSize = Number(requestArg.page?.pageSize ?? 5) || 5;
  const sortField = requestArg.sort?.field;
  const sortOrder =
    requestArg.sort?.order === 'asc' || requestArg.sort?.order === 'desc'
      ? requestArg.sort.order
      : undefined;

  const request: MockQueryRequest = {
    method: 'POST',
    page: {
      currentPage,
      pageSize,
    },
    params,
    sort: {
      field: sortField,
      order: sortOrder,
    },
    url: '/api/page/query',
  };
  console.log('[mock-api][vue] request =>', request);

  await sleep(320);
  const keyword = (params.keyword ?? '').trim().toLowerCase();
  const minAge = parseOptionalNumber(params.minAge);
  const maxAge = parseOptionalNumber(params.maxAge);

  const filtered = BASIC_ROWS.filter((item) => {
    const matchKeyword =
      !keyword ||
      item.name.toLowerCase().includes(keyword) ||
      item.nickname.toLowerCase().includes(keyword) ||
      item.address.toLowerCase().includes(keyword) ||
      item.role.toLowerCase().includes(keyword);
    const matchRole = !params.role || item.role === params.role;
    const matchLevel = !params.level || item.level === params.level;
    const matchStatus =
      !params.status ||
      (params.status === 'enabled' ? item.enabled === true : item.enabled !== true);
    const matchMinAge = minAge === null || item.age >= minAge;
    const matchMaxAge = maxAge === null || item.age <= maxAge;

    return (
      matchKeyword &&
      matchRole &&
      matchLevel &&
      matchStatus &&
      matchMinAge &&
      matchMaxAge
    );
  });
  const sorted = sortRowsByField(filtered, sortField, sortOrder);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const items = sorted.slice(start, end);

  return {
    code: 0,
    data: {
      items,
      total: sorted.length,
    },
    message: 'ok',
    request,
  } satisfies MockQueryResponse<DemoRow>;
}

const formOptions: AdminFormProps = {
  collapsedRows: 1,
  compact: true,
  schema: [
    {
      component: 'input',
      componentProps: {
        placeholder: '输入名称/角色/地址',
      },
      fieldName: 'keyword',
      label: '关键词',
    },
    {
      component: 'select',
      componentProps: {
        options: ROLE_OPTIONS,
        placeholder: '选择角色',
      },
      fieldName: 'role',
      label: '角色',
    },
    {
      component: 'select',
      componentProps: {
        options: LEVEL_OPTIONS,
        placeholder: '选择等级',
      },
      fieldName: 'level',
      label: '等级',
    },
    {
      component: 'select',
      componentProps: {
        options: STATUS_OPTIONS,
        placeholder: '选择状态',
      },
      fieldName: 'status',
      label: '状态',
    },
    {
      component: 'input',
      componentProps: {
        min: 0,
        placeholder: '最小年龄',
        type: 'number',
      },
      fieldName: 'minAge',
      label: '最小年龄',
    },
    {
      component: 'input',
      componentProps: {
        min: 0,
        placeholder: '最大年龄',
        type: 'number',
      },
      fieldName: 'maxAge',
      label: '最大年龄',
    },
  ],
  showCollapseButton: true,
};

const fixedMode = ref(true);
const useTableHeight = ref(false);

const tableOptions = computed<AdminTableVueProps<DemoRow, SearchFormValues>>(() => ({
  gridOptions: {
    columns: [
      { field: 'name', title: 'Name', minWidth: 160 },
      { field: 'age', title: 'Age', width: 100, sortable: true },
      { field: 'nickname', title: 'Nickname', minWidth: 160 },
      { field: 'role', title: 'Role', width: 120, filterable: true },
      { field: 'address', title: 'Address', minWidth: 220 },
    ],
    pagerConfig: {
      enabled: true,
      pageSize: 5,
    },
    proxyConfig: {
      ajax: {
        query: async (
          request: {
            page?: { currentPage?: number; pageSize?: number };
            sort?: { field?: string; order?: string };
          },
          formValues: SearchFormValues
        ) => {
          const response = await queryRowsByBackend(request, formValues);
          console.log('[mock-api][vue] response <=', response);
          return response.data;
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
    rowConfig: {
      keyField: 'id',
    },
    sortConfig: {
      remote: true,
    },
  },
  gridEvents: {
    cellClick: ({ row }) => {
      console.log('[page-vue] row click', row);
    },
  },
  tableTitle: 'Page 组合页（查询表单 + 表格）',
}));

const [PageQueryTable, pageApi] = useAdminPageQueryTable<DemoRow, SearchFormValues>();

console.log('[page-vue] exposed api', pageApi.formApi, pageApi.tableApi);
</script>

<template>
  <PageQueryTable
    :fixed="fixedMode"
    :table-height="useTableHeight ? 420 : undefined"
    :form-options="formOptions"
    :table-options="tableOptions"
  />
</template>

<style scoped>
.admin-page-mode-switch {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.admin-page-mode-btn {
  border: 1px solid var(--border, #d1d5db);
  border-radius: var(--radius, 8px);
  color: var(--foreground, #111827);
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
  padding: 8px 12px;
  transition: all 0.2s ease;
  background: var(--background, #ffffff);
}

.admin-page-mode-btn:hover {
  border-color: var(--primary, #1677ff);
}

.admin-page-mode-btn.is-active {
  border-color: var(--primary, #1677ff);
  color: #fff;
  background: var(--primary, #1677ff);
}
</style>
