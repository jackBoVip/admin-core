<script setup lang="ts">
import type { AdminFormProps } from '@admin-core/form-vue';
import type { AdminTableVueProps } from '@admin-core/table-vue';
import type { DemoRow } from '../table/data';

import { useAdminPageQueryTable } from '@admin-core/page-vue';
import { computed, ref } from 'vue';

import { BASIC_ROWS, sleep } from '../table/data';

/**
 * 查询表单值结构。
 */
interface SearchFormValues extends Record<string, unknown> {
  /** 关键字。 */
  keyword?: string;
  /** 等级筛选。 */
  level?: '' | DemoRow['level'];
  /** 最大年龄。 */
  maxAge?: string;
  /** 最小年龄。 */
  minAge?: string;
  /** 操作人。 */
  requester?: string;
  /** 角色筛选。 */
  role?: '' | DemoRow['role'];
  /** 业务场景。 */
  scene?: 'daily-query' | 'ops-audit' | 'prod-change';
  /** 启用状态。 */
  status?: '' | 'disabled' | 'enabled';
  /** 租户编码。 */
  tenantCode?: string;
}

/**
 * 模拟后端查询请求参数结构。
 */
interface MockQueryRequest {
  /** 请求方法。 */
  method: 'POST';
  /** 分页参数。 */
  page: {
    /** 当前页码。 */
    currentPage: number;
    /** 每页条数。 */
    pageSize: number;
  };
  /** 查询条件。 */
  params: SearchFormValues;
  /** 排序参数。 */
  sort: {
    /** 排序字段。 */
    field?: string;
    /** 排序方向。 */
    order?: 'asc' | 'desc';
  };
  /** 接口路径。 */
  url: '/api/page/query';
}

/**
 * 模拟后端查询响应结构。
 *
 * @template T 行数据类型。
 */
interface MockQueryResponse<T> {
  /** 响应码。 */
  code: number;
  /** 响应体数据。 */
  data: {
    /** 当前页列表。 */
    items: T[];
    /** 总条数。 */
    total: number;
  };
  /** 响应消息。 */
  message: string;
  /** 回传请求快照。 */
  request: MockQueryRequest;
}

/**
 * 通用下拉选项结构。
 *
 * @template T 选项值类型。
 */
interface SelectOption<T> {
  /** 显示标签。 */
  label: string;
  /** 实际值。 */
  value: T;
}

/**
 * 模拟分页查询入参结构。
 */
interface MockPageQueryArg {
  /** 分页参数。 */
  page?: { currentPage?: number; pageSize?: number };
  /** 排序参数。 */
  sort?: { field?: string; order?: string };
}

/**
 * 角色筛选选项。
 */
const ROLE_OPTIONS: Array<SelectOption<'' | DemoRow['role']>> = [
  { label: '全部角色', value: '' },
  { label: 'User', value: 'User' },
  { label: 'Admin', value: 'Admin' },
  { label: 'Manager', value: 'Manager' },
  { label: 'Guest', value: 'Guest' },
];

/**
 * 等级筛选选项。
 */
const LEVEL_OPTIONS: Array<SelectOption<'' | NonNullable<DemoRow['level']>>> = [
  { label: '全部等级', value: '' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

/**
 * 状态筛选选项。
 */
const STATUS_OPTIONS: Array<SelectOption<'' | 'disabled' | 'enabled'>> = [
  { label: '全部状态', value: '' },
  { label: '启用', value: 'enabled' },
  { label: '禁用', value: 'disabled' },
];

/**
 * 业务场景选项。
 */
const SCENE_OPTIONS: Array<SelectOption<NonNullable<SearchFormValues['scene']>>> = [
  { label: '生产变更', value: 'prod-change' },
  { label: '日常查询', value: 'daily-query' },
  { label: '运维审计', value: 'ops-audit' },
];

/**
 * 将可选输入解析为数字。
 *
 * @param value 输入值。
 * @returns 有效数字或 `null`。
 */
function parseOptionalNumber(value: unknown) {
  const text = String(value ?? '').trim();
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * 按字段与顺序对行数据排序。
 *
 * @param rows 待排序行数据。
 * @param field 排序字段。
 * @param order 排序方向。
 * @returns 排序后的新数组。
 */
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

/**
 * 模拟后端分页查询。
 *
 * @param requestArg 分页与排序参数。
 * @param params 查询表单参数。
 * @returns 模拟后端响应。
 */
async function queryRowsByBackend(
  requestArg: MockPageQueryArg = {},
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

/**
 * 查询表单配置。
 * @description 定义字段结构、默认值与必填规则。
 */
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
      component: 'input',
      componentProps: {
        placeholder: '请输入租户编码',
      },
      defaultValue: 'tenant-demo',
      fieldName: 'tenantCode',
      label: '租户编码',
      rules: 'required',
    },
    {
      component: 'input',
      componentProps: {
        placeholder: '请输入操作人',
      },
      defaultValue: 'admin',
      fieldName: 'requester',
      label: '操作人',
      rules: 'required',
    },
    {
      component: 'select',
      componentProps: {
        options: SCENE_OPTIONS,
        placeholder: '请选择业务场景',
      },
      defaultValue: 'prod-change',
      fieldName: 'scene',
      label: '业务场景',
      rules: 'selectRequired',
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

/**
 * 查询表格区域是否启用固定高度模式。
 */
const fixedMode = ref(true);
/**
 * 是否显式传入表格高度。
 */
const useTableHeight = ref(false);

/**
 * Page 组合示例中的表格配置。
 * @description 定义列、远程代理、分页与排序等演示参数。
 */
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

/**
 * Page 查询 + 表格组合组件与桥接 API。
 */
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
