import type { AdminFormReactProps } from '@admin-core/form-react';
import type { AntdGridOptions } from '@admin-core/table-react';
import type { CSSProperties } from 'react';

import { useAdminTable } from '@admin-core/table-react';
import { Button, Tag } from 'antd';
import { useMemo } from 'react';

import { BASIC_ROWS, type DemoRow } from './data';

const roleColorMap: Record<string, string> = {
  admin: 'red',
  guest: 'default',
  manager: 'blue',
  user: 'green',
};

const titleWrapStyle: CSSProperties = {
  alignItems: 'center',
  display: 'inline-flex',
  gap: 8,
};

const titleBadgeStyle: CSSProperties = {
  background: 'color-mix(in oklch, var(--primary, #1677ff) 12%, transparent)',
  borderRadius: 999,
  color: 'var(--primary, #1677ff)',
  fontSize: 11,
  fontWeight: 700,
  lineHeight: 1,
  padding: '4px 8px',
};

const emptyStyle: CSSProperties = {
  color: 'var(--muted-foreground, #64748b)',
  padding: '16px 0',
};

const toolbarCenterHintStyle: CSSProperties = {
  color: 'var(--destructive, #ef4444)',
  fontSize: 13,
  whiteSpace: 'nowrap',
};

export default function TableSlot() {
  const [TableView, tableApi] = useAdminTable<DemoRow>(
    useMemo(
      () => ({
        formOptions: {
          collapsed: false,
          schema: [
            {
              component: 'input',
              componentProps: { placeholder: '请输入姓名' },
              fieldName: 'name',
              label: 'Name',
            },
          ],
          showCollapseButton: false,
          submitOnChange: false,
          submitOnEnter: false,
        } satisfies AdminFormReactProps,
        gridOptions: {
          columns: [
            { title: '序号', dataIndex: 'id', width: 80 },
            { field: 'name', title: 'Name' },
            { field: 'age', title: 'Age', width: 100 },
            { field: 'role', slots: { default: 'role' }, title: 'Role', width: 140 },
            { field: 'address', title: 'Address' },
          ],
          data: BASIC_ROWS,
          pagerConfig: {
            enabled: false,
          },
          toolbarConfig: {
            custom: true,
            refresh: true,
            search: true,
            zoom: true,
          },
        } as AntdGridOptions<DemoRow>,
      }),
      []
    )
  );

  const triggerLoading = async () => {
    tableApi.setLoading(true);
    await new Promise((resolve) => {
      setTimeout(resolve, 600);
    });
    tableApi.setLoading(false);
  };

  return (
    <div className="page-container">
      <h1 className="page-title">表格 - 插槽示例</h1>
      <p className="page-description">演示 table-title、toolbar-actions、toolbar-center、toolbar-tools、列插槽与 empty 插槽（React 端插槽使用 antd 组件）。</p>

      <div className="card">
        <TableView
          tableTitle="插槽列表"
          tableTitleHelp="Slot Demo"
          slots={{
            'table-title': () => (
              <div style={titleWrapStyle}>
                <span>插槽列表</span>
                <span style={titleBadgeStyle}>SLOTS</span>
              </div>
            ),
            'toolbar-actions': () => (
              <Button size="small" type="default" onClick={() => tableApi.toggleSearchForm()}>
                切换搜索
              </Button>
            ),
            'toolbar-center': () => (
              <div style={toolbarCenterHintStyle}>
                这是 toolbar-center 插槽，可完全替换中间提示区内容。
              </div>
            ),
            'toolbar-tools': () => (
              <Button size="small" type="primary" onClick={() => void triggerLoading()}>
                模拟加载
              </Button>
            ),
            empty: () => (
              <div style={emptyStyle}>暂无数据（empty 插槽）</div>
            ),
            role: ({ row }: any) => {
              const role = String(row?.role ?? '');
              const roleKey = role.toLowerCase();
              return <Tag color={roleColorMap[roleKey] ?? 'processing'}>{role}</Tag>;
            },
          }}
        />
      </div>
    </div>
  );
}
