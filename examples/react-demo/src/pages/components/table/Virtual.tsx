import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useEffect, useMemo } from 'react';

type RowType = {
  id: number;
  name: string;
  role: string;
  sex: string;
};

export default function TableVirtual() {
  const [TableView, tableApi] = useAdminTable<RowType>(
    useMemo(
      () => ({
        gridOptions: {
          columns: [
            { field: 'id', title: 'ID', width: 120 },
            { field: 'name', title: 'Name' },
            { field: 'role', title: 'Role' },
            { field: 'sex', title: 'Sex' },
          ],
          data: [],
          pagerConfig: {
            enabled: false,
          },
          scrollY: {
            enabled: true,
            gt: 0,
          },
        } as AntdGridOptions<RowType>,
      }),
      []
    )
  );

  useEffect(() => {
    const list: RowType[] = [];
    for (let i = 0; i < 1000; i += 1) {
      list.push({
        id: 10000 + i,
        name: `Test${i}`,
        role: 'Developer',
        sex: i % 2 === 0 ? '男' : '女',
      });
    }
    tableApi.setGridOptions({ data: list });
  }, [tableApi]);

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 虚拟滚动</h1>
      <p className="page-description">大量数据下的纵向虚拟滚动演示。</p>

      <div className="card h-[520px]">
        <TableView tableTitle="Virtual Scroll" />
      </div>
    </div>
  );
}
