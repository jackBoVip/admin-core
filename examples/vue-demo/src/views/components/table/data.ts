export interface DemoRow {
  id: number;
  name: string;
  age: number;
  nickname: string;
  role: string;
  address: string;
}

export interface DemoProductRow {
  id: string;
  category: string;
  color: string;
  productName: string;
  price: string;
  releaseDate: string;
  imageUrl: string;
  status: 'enabled' | 'disabled';
  open: boolean;
}

export interface DemoTreeRow {
  id: number;
  parentId: null | number;
  name: string;
  size: number;
  type: string;
  date: string;
}

const roles = ['User', 'Admin', 'Manager', 'Guest'];

export const BASIC_ROWS: DemoRow[] = Array.from({ length: 18 }).map((_, index) => ({
  id: index + 1,
  name: `Test-${index + 1}`,
  age: 18 + ((index * 3) % 20),
  nickname: `nick-${index + 1}`,
  role: roles[index % roles.length],
  address: `No.${index + 1}, Broadway, New York`,
}));

export const TREE_ROWS: DemoTreeRow[] = [
  { id: 10000, parentId: null, name: 'Root-A', size: 1024, type: 'dir', date: '2024-01-01' },
  { id: 10010, parentId: 10000, name: 'Child-A1', size: 160, type: 'file', date: '2024-01-03' },
  { id: 10011, parentId: 10000, name: 'Child-A2', size: 240, type: 'file', date: '2024-01-05' },
  { id: 10020, parentId: null, name: 'Root-B', size: 640, type: 'dir', date: '2024-02-01' },
  { id: 10021, parentId: 10020, name: 'Child-B1', size: 320, type: 'file', date: '2024-02-06' },
  { id: 10022, parentId: 10020, name: 'Child-B2', size: 300, type: 'file', date: '2024-02-10' },
];

const colors = ['teal', 'blue', 'green', 'orange', 'red'];
const categories = ['Hardware', 'Toys', 'Books', 'Shoes', 'Beauty'];

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

export async function sleep(ms = 500) {
  await new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function fetchProductRows(params: {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<{ items: DemoProductRow[]; total: number }> {
  await sleep(300);
  const sorted = sortRows(PRODUCT_ROWS, params.sortBy, params.sortOrder);
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  return {
    items: sorted.slice(start, end),
    total: sorted.length,
  };
}
