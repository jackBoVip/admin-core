import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';
import { Button } from 'antd';

import { fetchProductRows, type DemoProductRow } from './data';

export default function TableFixed() {
  const [TableView] = useAdminTable<DemoProductRow>(
    useMemo(
      () => ({
        gridOptions: {
          columns: [
            { fixed: 'left', field: 'id', title: 'ID', width: 120 },
            { field: 'category', title: 'Category', width: 240 },
            { field: 'color', title: 'Color', width: 240 },
            { field: 'productName', title: 'Product Name', width: 260 },
            { field: 'price', title: 'Price', width: 180 },
            { field: 'releaseDate', title: 'Release Date', width: 320 },
            { fixed: 'right', field: 'action', slots: { default: 'action' }, title: '操作', width: 140 },
          ],
          proxyConfig: {
            ajax: {
              query: async ({ page }: any) =>
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
        } as AntdGridOptions<DemoProductRow>,
      }),
      []
    )
  );

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 固定列</h1>
      <p className="page-description">演示固定左列与固定右操作列。</p>

      <div className="card">
        <TableView
          tableTitle="固定列列表"
          slots={{
            action: () => <Button type="link">编辑</Button>,
          }}
        />
      </div>
    </div>
  );
}
