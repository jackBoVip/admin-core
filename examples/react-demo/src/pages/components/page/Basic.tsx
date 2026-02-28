import type { AdminFormProps } from '@admin-core/form-react';
import type { AdminTableReactProps } from '@admin-core/table-react';
import type { DemoRow } from '../table/data';

import { useAdminPageQueryTable } from '@admin-core/page-react';
import { useMemo, useState } from 'react';

import { BASIC_ROWS, sleep } from '../table/data';

interface SearchFormValues extends Record<string, unknown> {
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

const LEVEL_OPTIONS: Array<{ label: string; value: '' | NonNullable<DemoRow['level']> }> = [
  { label: '全部等级', value: '' },
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' },
];

const STATUS_OPTIONS: Array<{ label: string; value: '' | 'disabled' | 'enabled' }> = [
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

function sortRowsByField(
  rows: DemoRow[],
  field?: string,
  order?: 'asc' | 'desc'
) {
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
    sort?: { field?: string; order?: 'asc' | 'desc' };
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
  console.log('[mock-api][react] request =>', request);

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

export default function PageBasic() {
  const formOptions = useMemo<AdminFormProps>(() => {
    return {
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
  }, []);

  const tableOptions = useMemo<AdminTableReactProps<DemoRow, SearchFormValues>>(() => {
    return {
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
                sort?: { field?: string; order?: 'asc' | 'desc' };
              },
              formValues: SearchFormValues
            ) => {
              const response = await queryRowsByBackend(request, formValues);
              console.log('[mock-api][react] response <=', response);
              return response.data;
            },
          },
          autoLoad: false,
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
        stripe: {
          enabled: true,
          followTheme: false,
        },
        sortConfig: {
          remote: true,
        },
      },
      tableTitle: 'Page 组合页（查询表单 + 表格）',
    };
  }, []);

  const pageOptions = useMemo(() => {
    return {
      formOptions,
      tableOptions,
    };
  }, [formOptions, tableOptions]);

  const [PageQueryTable, pageApi] =
    useAdminPageQueryTable<DemoRow, SearchFormValues>(pageOptions);
  const [fixedMode] = useState(true);
  const [useTableHeight] = useState(false);

  console.log('[page-react] exposed api', pageApi.formApi, pageApi.tableApi);

  return (
    <PageQueryTable
      fixed={fixedMode}
      tableHeight={useTableHeight ? 420 : undefined}
    />
  );
}
