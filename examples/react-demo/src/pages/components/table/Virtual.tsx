import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useEffect, useMemo } from 'react';

/**
 * 虚拟滚动行数据类型。
 */
type RowType = {
  /** 唯一标识。 */
id: number;
  /** 名称。 */
name: string;
  /** 角色名称。 */
role: string;
  /** 性别。 */
sex: string;
};

/**
 * 构造虚拟滚动演示数据。
 *
 * @param size 数据条数，默认 1000。
 * @returns 虚拟滚动示例数据列表。
 */
function createVirtualRows(size = 1000): RowType[] {
  const list: RowType[] = [];
  for (let i = 0; i < size; i += 1) {
    list.push({
      id: 10000 + i,
      name: `Test${i}`,
      role: 'Developer',
      sex: i % 2 === 0 ? '男' : '女',
    });
  }
  return list;
}

/**
 * 虚拟滚动示例页。
 * @description 演示大数据量场景下的纵向虚拟滚动。
 */
export default function TableVirtual() {
  /**
   * `useAdminTable` 返回的表格组件与控制 API。
   */
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
    tableApi.setGridOptions({ data: createVirtualRows() });
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
