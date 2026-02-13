import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';
import { Button } from 'antd';

import { BASIC_ROWS, type DemoRow } from './data';

export default function TableBasic() {
  const [TableView, tableApi] = useAdminTable<DemoRow>(
    useMemo(
      () => ({
        gridOptions: {
          border: false,
          columns: [
            { title: '序号', dataIndex: 'id', width: 80 },
            { field: 'name', title: 'Name' },
            { field: 'age', sortable: true, title: 'Age' },
            { field: 'nickname', title: 'Nickname' },
            { field: 'role', title: 'Role' },
            { field: 'address', title: 'Address' },
          ],
          data: BASIC_ROWS,
          pagerConfig: {
            enabled: false,
          },
          stripe: false,
        } as AntdGridOptions<DemoRow>,
      }),
      []
    )
  );

  const showBorder = tableApi.useStore((state) => !!state.gridOptions?.border);
  const showStripe = tableApi.useStore((state) => !!state.gridOptions?.stripe);

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 基础</h1>
      <p className="page-description">基础列展示、store 订阅、loading 与样式切换。</p>

      <div className="card">
        <TableView
          tableTitle="基础列表"
          tableTitleHelp="Table Basic Demo"
          slots={{
            'toolbar-tools': () => (
              <>
                <Button
                  type="primary"
                  onClick={() => {
                    tableApi.setGridOptions({ border: !showBorder });
                  }}
                >
                  {showBorder ? '隐藏' : '显示'}边框
                </Button>
                <Button
                  onClick={() => {
                    tableApi.setLoading(true);
                    setTimeout(() => {
                      tableApi.setLoading(false);
                    }, 1200);
                  }}
                >
                  显示 loading
                </Button>
                <Button
                  onClick={() => {
                    tableApi.setGridOptions({ stripe: !showStripe });
                  }}
                >
                  {showStripe ? '隐藏' : '显示'}斑马纹
                </Button>
              </>
            ),
          }}
        />
      </div>
    </div>
  );
}
