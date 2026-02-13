import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { type AdminFormReactProps } from '@admin-core/form-react';
import { useMemo } from 'react';

import { fetchProductRows, type DemoProductRow } from './data';

export default function TableForm() {
  const [TableView] = useAdminTable<DemoProductRow>(
    useMemo(
      () => ({
        formOptions: {
          collapsed: false,
          schema: [
            {
              component: 'input',
              componentProps: { placeholder: 'Category' },
              fieldName: 'category',
              label: 'Category',
            },
            {
              component: 'input',
              componentProps: { placeholder: 'Product Name' },
              fieldName: 'productName',
              label: 'ProductName',
            },
            {
              component: 'select',
              componentProps: {
                options: [
                  { label: 'Blue', value: 'blue' },
                  { label: 'Green', value: 'green' },
                  { label: 'Orange', value: 'orange' },
                ],
              },
              fieldName: 'color',
              label: 'Color',
            },
            {
              component: 'date-range',
              fieldName: 'releaseDateRange',
              label: 'Release Date',
            },
          ],
          showCollapseButton: true,
          submitOnChange: false,
          submitOnEnter: false,
        } satisfies AdminFormReactProps,
        gridOptions: {
          columns: [
            { title: '序号', field: 'id', width: 120 },
            { field: 'category', title: 'Category' },
            { field: 'color', title: 'Color' },
            { field: 'productName', title: 'Product Name' },
            { field: 'price', title: 'Price' },
            { field: 'releaseDate', title: 'Release Date' },
          ],
          keepSource: true,
          proxyConfig: {
            ajax: {
              query: async ({ page }: any, formValues: Record<string, any>) => {
                const data = await fetchProductRows({
                  page: page.currentPage,
                  pageSize: page.pageSize,
                });

                const keyword = String(formValues?.productName ?? '').trim().toLowerCase();
                const category = String(formValues?.category ?? '').trim().toLowerCase();
                const color = String(formValues?.color ?? '').trim().toLowerCase();

                const filtered = data.items.filter((item) => {
                  const hitKeyword = !keyword || item.productName.toLowerCase().includes(keyword);
                  const hitCategory = !category || item.category.toLowerCase().includes(category);
                  const hitColor = !color || item.color.toLowerCase() === color;
                  return hitKeyword && hitCategory && hitColor;
                });

                return {
                  items: filtered,
                  total: filtered.length,
                };
              },
            },
            autoLoad: true,
            enabled: true,
            response: {
              list: 'items',
              result: 'items',
              total: 'total',
            },
          },
          toolbarConfig: {
            custom: true,
            refresh: true,
            search: true,
            zoom: true,
          },
        } as AntdGridOptions<DemoProductRow>,
      }),
      []
    )
  );

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 搜索表单</h1>
      <p className="page-description">table 与 form 一体化：查询、重置、折叠与 search panel toggle。</p>

      <div className="card">
        <TableView tableTitle="带搜索表单的列表" />
      </div>
    </div>
  );
}
