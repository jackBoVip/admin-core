import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';

import { fetchProductRows, type DemoProductRow } from './data';

export default function TableEditCell() {
  const [TableView] = useAdminTable<DemoProductRow>(
    useMemo(
      () => ({
        gridOptions: {
          columns: [
            { field: 'id', title: 'ID', width: 120 },
            { editRender: { name: 'input' }, field: 'category', title: 'Category' },
            { editRender: { name: 'input' }, field: 'color', title: 'Color' },
            { editRender: { name: 'input' }, field: 'productName', title: 'Product Name' },
            { field: 'price', title: 'Price' },
            { field: 'releaseDate', title: 'Release Date' },
          ],
          editConfig: {
            mode: 'cell',
            trigger: 'click',
          },
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
      <h1 className="page-title">表格 - 单元格编辑</h1>
      <p className="page-description">点击单元格进入编辑模式。</p>

      <div className="card">
        <TableView tableTitle="Cell Edit" />
      </div>
    </div>
  );
}
