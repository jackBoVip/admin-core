/**
 * 列表示例行数据类型。
 */
export interface DemoRow extends Record<string, unknown> {
  /** 唯一标识。 */
id: number;
  /** 名称。 */
name: string;
  /** 年龄。 */
age: number;
  /** 昵称。 */
nickname: string;
  /** 角色名称。 */
role: string;
  /** 联系地址。 */
address: string;
  /** 是否启用。 */
enabled?: boolean;
  /** 是否选中。 */
selected?: boolean;
  /** 等级。 */
level?: 'high' | 'low' | 'medium';
}

/**
 * 商品列表示例行数据类型。
 */
export interface DemoProductRow extends Record<string, unknown> {
  /** 唯一标识。 */
id: string;
  /** 商品分类。 */
category: string;
  /** 主题色标识。 */
color: string;
  /** 商品名称。 */
productName: string;
  /** 价格字符串。 */
price: string;
  /** 发布时间（ISO 字符串）。 */
releaseDate: string;
  /** 图片地址。 */
imageUrl: string;
  /** 上下架状态。 */
status: 'enabled' | 'disabled';
  /** 开关状态。 */
open: boolean;
}

/**
 * 树形列表示例行数据类型。
 */
export interface DemoTreeRow extends Record<string, unknown> {
  /** 唯一标识。 */
id: number;
  /** 关联标识。 */
parentId: null | number;
  /** 名称。 */
name: string;
  /** 文件大小。 */
size: number;
  /** 类型。 */
type: string;
  /** 日期字符串。 */
date: string;
}

/**
 * 角色候选列表。
 */
const roles = ['User', 'Admin', 'Manager', 'Guest'];

/**
 * 基础表示例数据。
 */
export const BASIC_ROWS: DemoRow[] = Array.from({ length: 18 }).map((_, index) => ({
  id: index + 1,
  name: `Test-${index + 1}`,
  age: 18 + ((index * 3) % 20),
  nickname: `nick-${index + 1}`,
  role: roles[index % roles.length],
  address: `No.${index + 1}, Broadway, New York`,
  enabled: index % 2 === 0,
  selected: index % 3 === 0,
  level: index % 3 === 0 ? 'high' : index % 3 === 1 ? 'medium' : 'low',
}));

/**
 * 树表示例数据。
 */
export const TREE_ROWS: DemoTreeRow[] = [
  { id: 10000, parentId: null, name: 'Root-A', size: 1024, type: 'dir', date: '2024-01-01' },
  { id: 10010, parentId: 10000, name: 'Child-A1', size: 160, type: 'file', date: '2024-01-03' },
  { id: 10011, parentId: 10000, name: 'Child-A2', size: 240, type: 'file', date: '2024-01-05' },
  { id: 10020, parentId: null, name: 'Root-B', size: 640, type: 'dir', date: '2024-02-01' },
  { id: 10021, parentId: 10020, name: 'Child-B1', size: 320, type: 'file', date: '2024-02-06' },
  { id: 10022, parentId: 10020, name: 'Child-B2', size: 300, type: 'file', date: '2024-02-10' },
];

/**
 * 商品颜色候选列表。
 */
const colors = ['teal', 'blue', 'green', 'orange', 'red'];
/**
 * 商品分类候选列表。
 */
const categories = ['Hardware', 'Toys', 'Books', 'Shoes', 'Beauty'];

/**
 * 商品表示例数据。
 */
export const PRODUCT_ROWS: DemoProductRow[] = Array.from({ length: 120 }).map((_, index) => {
  const day = (index % 28) + 1;
  const month = (index % 12) + 1;
  return {
    id: `product-${index + 1}`,
    category: categories[index % categories.length],
    color: colors[index % colors.length],
    productName: `Product-${index + 1}`,
    price: (10 + (index % 35) * 2.37).toFixed(2),
    releaseDate: `2024-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T08:00:00.000Z`,
    imageUrl: `https://api.dicebear.com/9.x/shapes/svg?seed=${index + 1}`,
    status: index % 2 === 0 ? 'enabled' : 'disabled',
    open: index % 2 === 0,
  };
});

/**
 * 根据指定字段对商品数据进行排序。
 *
 * @param rows 原始商品列表。
 * @param sortBy 排序字段名。
 * @param sortOrder 排序方向。
 * @returns 排序后的新数组。
 */
function sortRows(rows: DemoProductRow[], sortBy?: string, sortOrder?: 'asc' | 'desc') {
  if (!sortBy) return rows;
  const next = [...rows];
  next.sort((a, b) => {
    const aValue = (a as Record<string, any>)[sortBy];
    const bValue = (b as Record<string, any>)[sortBy];

    if (aValue === bValue) return 0;

    const aNumber = Number(aValue);
    const bNumber = Number(bValue);
    const result =
      Number.isFinite(aNumber) && Number.isFinite(bNumber)
        ? aNumber - bNumber
        : String(aValue).localeCompare(String(bValue), undefined, {
            numeric: true,
            sensitivity: 'base',
          });

    return sortOrder === 'desc' ? -result : result;
  });
  return next;
}

/**
 * 延迟指定时间。
 *
 * @param ms 延迟毫秒数。
 * @returns 无返回值。
 */
export async function sleep(ms = 500) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * 商品分页查询参数。
 */
export interface FetchProductRowsParams {
  /** 当前页码（从 1 开始）。 */
  page: number;
  /** 每页条数。 */
  pageSize: number;
  /** 排序字段。 */
  sortBy?: string;
  /** 排序方向。 */
  sortOrder?: 'asc' | 'desc';
}

/**
 * 商品分页查询结果。
 */
export interface FetchProductRowsResult {
  /** 当前页数据。 */
  items: DemoProductRow[];
  /** 总条数。 */
  total: number;
}

/**
 * 模拟后端分页查询商品数据。
 *
 * @param params 查询参数。
 * @returns 当前页数据与总条数。
 */
export async function fetchProductRows(
  params: FetchProductRowsParams
): Promise<FetchProductRowsResult> {
  await sleep(300);
  const sorted = sortRows(PRODUCT_ROWS, params.sortBy, params.sortOrder);
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  return {
    items: sorted.slice(start, end),
    total: sorted.length,
  };
}
