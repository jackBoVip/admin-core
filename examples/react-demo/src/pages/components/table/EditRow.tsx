import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';
import { Button } from 'antd';

import { fetchProductRows, type DemoProductRow } from './data';

export default function TableEditRow() {
  const [TableView, tableApi] = useAdminTable<DemoProductRow>(
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
            { slots: { default: 'action' }, title: '操作', width: 180 },
          ],
          editConfig: {
            mode: 'row',
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
      <h1 className="page-title">表格 - 行编辑</h1>
      <p className="page-description">点击编辑进入行编辑模式，支持保存与取消。</p>

      <div className="card">
        <TableView
          tableTitle="Row Edit"
          slots={{
            action: ({ row }: any) => {
              const isEditing = (tableApi.grid as any)?.isEditByRow?.(row);

              if (isEditing) {
                return (
                  <>
                    <Button
                      type="link"
                      onClick={async () => {
                        await (tableApi.grid as any)?.clearEdit?.();
                        tableApi.setLoading(true);
                        setTimeout(() => {
                          tableApi.setLoading(false);
                        }, 600);
                      }}
                    >
                      保存
                    </Button>
                    <Button
                      type="link"
                      onClick={async () => {
                        await (tableApi.grid as any)?.clearEdit?.();
                      }}
                    >
                      取消
                    </Button>
                  </>
                );
              }

              return (
                <Button
                  type="link"
                  onClick={() => {
                    (tableApi.grid as any)?.setEditRow?.(row);
                  }}
                >
                  编辑
                </Button>
              );
            },
          }}
        />
      </div>
    </div>
  );
}
