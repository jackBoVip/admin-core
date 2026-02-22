import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';
import { Button } from 'antd';

import { fetchProductRows, type DemoProductRow } from './data';

export default function TableRemote() {
  const [TableView, tableApi] = useAdminTable<DemoProductRow>(
    useMemo(
      () => ({
        gridOptions: {
          radioConfig: {
            highlight: true,
            trigger: 'row',
          },
          columns: [
            { title: '序号', field: 'id', width: 120 },
            { field: 'category', sortable: true, title: 'Category' },
            { field: 'color', sortable: true, title: 'Color' },
            { field: 'productName', sortable: true, title: 'Product Name' },
            { field: 'price', sortable: true, title: 'Price' },
            { field: 'releaseDate', title: 'Release Date' },
          ],
          keepSource: true,
          pagerConfig: {
            enabled: true,
          },
          proxyConfig: {
            ajax: {
              query: async ({ page, sort }: any) => {
                return await fetchProductRows({
                  page: page.currentPage,
                  pageSize: page.pageSize,
                  sortBy: sort.field,
                  sortOrder: sort.order,
                });
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
          sortConfig: {
            defaultSort: { field: 'category', order: 'desc' },
            remote: true,
          },
          toolbarConfig: {
            custom: true,
            refresh: true,
            zoom: true,
          },
        } as AntdGridOptions<DemoProductRow>,
      }),
      []
    )
  );

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 远程数据</h1>
      <p className="page-description">演示 proxyConfig 远程分页、排序以及 query/reload 行为差异。</p>

      <div className="card">
        <TableView
          tableTitle="远程列表"
          tableTitleHelp="Remote Query"
          slots={{
            'toolbar-tools': () => (
              <>
                <Button type="primary" onClick={() => void tableApi.query()}>
                  刷新当前页
                </Button>
                <Button onClick={() => void tableApi.reload()}>刷新并回第一页</Button>
              </>
            ),
          }}
        />
      </div>
    </div>
  );
}
