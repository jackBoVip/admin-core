import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';

import { TREE_ROWS, type DemoTreeRow } from './data';

export default function TableTree() {
  const [TableView] = useAdminTable<DemoTreeRow>(
    useMemo(
      () => ({
        gridOptions: {
          columns: [
            { field: 'name', title: 'Name' },
            { field: 'size', title: 'Size' },
            { field: 'type', title: 'Type' },
            { field: 'date', title: 'Date' },
          ],
          data: TREE_ROWS,
          pagerConfig: {
            enabled: false,
          },
          treeConfig: {
            parentField: 'parentId',
            rowField: 'id',
            transform: true,
          },
        } as AntdGridOptions<DemoTreeRow>,
      }),
      []
    )
  );

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 树形</h1>
      <p className="page-description">基于扁平数据转树形结构。</p>

      <div className="card">
        <TableView tableTitle="树形列表" />
      </div>
    </div>
  );
}
