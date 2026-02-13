import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';
import { Avatar, Button, Switch } from 'antd';

import { fetchProductRows, type DemoProductRow } from './data';

export default function TableCustomCell() {
  const [TableView] = useAdminTable<DemoProductRow>(
    useMemo(
      () => ({
        gridOptions: {
          columns: [
            { title: '序号', field: 'id', width: 120 },
            { field: 'category', title: 'Category', width: 120 },
            { field: 'imageUrl', slots: { default: 'image' }, title: 'Image', width: 120 },
            { field: 'open', slots: { default: 'open' }, title: 'Open', width: 120 },
            {
              cellRender: {
                name: 'CellTag',
                options: [
                  { color: 'success', label: 'Enabled', value: 'enabled' },
                  { color: 'error', label: 'Disabled', value: 'disabled' },
                ],
              },
              field: 'status',
              title: 'Status',
              width: 120,
            },
            { field: 'color', title: 'Color', width: 100 },
            { field: 'productName', title: 'Product Name', width: 200 },
            { field: 'price', title: 'Price', width: 100 },
            { field: 'releaseDate', title: 'Release Date', width: 200 },
            {
              cellRender: {
                attrs: {
                  nameField: 'productName',
                  onClick: ({ code, row }: any) => {
                    console.log('action click:', code, row.productName);
                  },
                },
                name: 'CellOperation',
              },
              field: 'operation',
              fixed: 'right',
              title: '操作',
              width: 180,
            },
          ],
          keepSource: true,
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
      <h1 className="page-title">表格 - 自定义单元格</h1>
      <p className="page-description">同时演示 slot 渲染与内置 CellTag/CellOperation 渲染器。</p>

      <div className="card">
        <TableView
          tableTitle="自定义单元格列表"
          slots={{
            image: ({ row }: any) => <Avatar size={28} src={row.imageUrl} />,
            open: ({ row }: any) => (
              <Switch
                checked={row.open === 1}
                onChange={(next) => {
                  row.open = next ? 1 : 0;
                }}
              />
            ),
            action: () => <Button type="link">编辑</Button>,
          }}
        />
      </div>
    </div>
  );
}
