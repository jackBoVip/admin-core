import { useAdminTable, type AntdGridOptions } from '@admin-core/table-react';
import { useMemo } from 'react';
import { Checkbox, Input, Select, Switch } from 'antd';

import { AdapterThemePreview, resolveTablePopupContainer } from './AdapterThemePreview';
import { BASIC_ROWS, type DemoRow } from './data';

export default function TableBasic() {
  const [TableView, tableApi] = useAdminTable<DemoRow>(
    useMemo(
      () => ({
        tableTitle: '基础列表',
        tableTitleHelp: 'Table Basic Demo',
        gridOptions: {
          border: false,
          radioConfig: {
            highlight: true,
            trigger: 'row',
          },
          seqColumn: true,
          columns: [
            { field: 'name', title: 'Name' },
            { field: 'age', sortable: true, title: 'Age' },
            { field: 'risk', title: '风险指数' },
            { field: 'enabled', slots: { default: 'enabledSwitch' }, title: '开关', width: 110 },
            { field: 'selected', slots: { default: 'selectedCheckbox' }, title: '复选框', width: 120 },
            { field: 'level', slots: { default: 'levelSelect' }, title: '等级选择', width: 150 },
            { field: 'nickname', slots: { default: 'nicknameInput' }, title: '昵称输入', width: 180 },
            { field: 'role', title: 'Role' },
            { field: 'address', title: 'Address' },
          ],
          data: BASIC_ROWS,
          operationColumn: {
            fixed: 'right',
            title: '操作',
            tools: [
              {
                code: 'view',
                onClick: ({ code, row }: { code?: string; row?: DemoRow }) => {
                  console.log('operation tool click:', code, row?.name);
                },
                title: '查看',
                type: 'info',
              },
              {
                code: 'edit',
                onClick: ({ code, row }: { code?: string; row?: DemoRow }) => {
                  console.log('operation tool click:', code, row?.name);
                },
                title: '编辑',
                type: 'primary-text',
              },
              {
                code: 'delete',
                onClick: ({ code, row }: { code?: string; row?: DemoRow }) => {
                  console.log('operation tool click:', code, row?.name);
                },
                
                title: '删除',
                type: 'error-outline',
                followTheme: false,
              },
            ],
            width: 220,
          },
          columnCustomPersistence: {
            key: 'admin-core:react-demo:table-basic',
            storage: 'local',
          },
          pagerConfig: {
            enabled: true,
            toolbar: {
              hint: {
                align: 'center',
                color: '#ef4444',
                content: '分页提示区：支持左侧按钮/插槽、中间提示（或插槽）、右侧自动构建按钮与插槽。',
                fontSize: 14,
                overflow: 'scroll',
                speed: 10,
              },
              leftTools: [
                {
                  code: 'pager-left-icon',
                  icon: 'vxe-table-icon-repeat',
                  onClick: ({ code }: { code?: string }) => {
                    console.log('pager left tool click:', code);
                  },
                },
                {
                  code: 'pager-left-text',
                  onClick: ({ code }: { code?: string }) => {
                    console.log('pager left tool click:', code);
                  },
                  title: '左侧按钮',
                  type: 'default',
                },
              ],
              leftToolsPosition: 'before',
              leftToolsSlotPosition: 'after',
              tools: [
                {
                  code: 'pager-icon-only',
                  icon: 'vxe-table-icon-repeat',
                  onClick: ({ code }: { code?: string }) => {
                    console.log('pager right tool click:', code);
                  },
                },
                {
                  code: 'pager-auto-text',
                  onClick: ({ code }: { code?: string }) => {
                    console.log('pager right tool click:', code);
                  },
                  title: '分页自动按钮',
                  type: 'primary',
                },
                {
                  code: 'pager-icon-text',
                  icon: 'vxe-table-icon-custom-column',
                  onClick: ({ code }: { code?: string }) => {
                    console.log('pager right tool click:', code);
                  },
                  title: '分页图标按钮',
                },
              ],
              toolsPosition: 'before',
              toolsSlotPosition: 'after',
            },
            exportConfig: {
              fileName: 'react-basic-table',
              options: ['current', 'selected', 'all'],
              exportAll: async ({ currentPage, pageSize }) => {
                await new Promise((resolve) => {
                  setTimeout(resolve, 260);
                });
                console.log('export all via api:', { currentPage, pageSize });
              },
            },
          },
          strategy: {
            columns: {
              age: {
                rules: [
                  {
                    color: 'var(--warning, #f59e0b)',
                    fontWeight: 600,
                    when: {
                      gte: 30,
                    },
                  },
                ],
                unit: ' 岁',
              },
              risk: {
                formula: '=ROUND(age * 1.6 + (role === "Admin" ? 8 : 0), 1)',
                rules: [
                  {
                    color: 'var(--destructive, #ef4444)',
                    fontSize: 16,
                    onClick: ({ row }) => {
                      console.log('risk click:', row?.name);
                    },
                    when: {
                      gte: 52,
                    },
                  },
                  {
                    color: 'var(--success, #10b981)',
                    when: {
                      lt: 40,
                    },
                  },
                ],
                unit: ' 分',
              },
            },
            rows: [
              {
                onClick: ({ row }) => {
                  console.log('row strategy click:', row?.name);
                },
                style: {
                  backgroundColor:
                    'var(--admin-table-strategy-row-bg, var(--primary-100, #dbeafe))',
                  color: 'var(--foreground, #0f172a)',
                },
                when: {
                  field: 'age',
                  gte: 34,
                },
              },
              {
                style: {
                  backgroundColor:
                    'var(--admin-table-strategy-row-hover-bg, var(--primary-200, #bfdbfe))',
                  color: 'var(--foreground, #0f172a)',
                  fontWeight: 700,
                },
                when: {
                  and: [
                    {
                      field: 'role',
                      regex: '/admin/i',
                    },
                    {
                      field: 'age',
                      gte: 30,
                    },
                  ],
                },
              },
            ],
          },
          stripe: false,
          toolbarConfig: {
            custom: true,
            hint: {
              align: 'center',
              color: 'var(--destructive, #ef4444)',
              content: '这里是顶栏提示区：支持 left / center / right、字号颜色与溢出滚动或换行。',
              fontSize: 13,
              overflow: 'scroll',
              speed: 12,
            },
            refresh: true,

            toolsPosition: 'before',
            toolsSlotPosition: 'before',
            tools: [
              {
                code: 'icon-only',
                onClick: ({ code }: { code?: string }) => {
                  console.log('toolbar tool click:', code);
                },
                icon: 'vxe-table-icon-repeat',
              },
              {
                code: 'icon-text',
                onClick: ({ code }: { code?: string }) => {
                  console.log('toolbar tool click:', code);
                },
                icon: 'vxe-table-icon-custom-column',
                title: '新建',
              },
              {
                code: 'text-only',
                onClick: ({ code }: { code?: string }) => {
                  console.log('toolbar tool click:', code);
                },
                title: '自动构建',
                type: 'default',
              },
              {
                code: 'clear',
                onClick: ({ code }: { code?: string }) => {
                  console.log('toolbar tool click:', code);
                },
                title: '清空',
                type: 'primary-text',
              },
            ],
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
      <h1 className="page-title">表格 - 基础</h1>
      <p className="page-description">基础列展示、store 订阅、loading 与样式切换。</p>

      <div className="card">
        <TableView
          slots={{
            enabledSwitch: ({ row }: { row: DemoRow }) => (
              <Switch
                defaultChecked={!!row.enabled}
                size="small"
                onChange={(checked) => {
                  row.enabled = checked;
                }}
              />
            ),
            selectedCheckbox: ({ row }: { row: DemoRow }) => (
              <Checkbox
                defaultChecked={!!row.selected}
                onChange={(event) => {
                  row.selected = event.target.checked;
                }}
              />
            ),
            levelSelect: ({ row }: { row: DemoRow }) => (
              <Select
                options={[
                  { label: '高', value: 'high' },
                  { label: '中', value: 'medium' },
                  { label: '低', value: 'low' },
                ]}
                getPopupContainer={resolveTablePopupContainer}
                size="small"
                style={{ width: 120 }}
                defaultValue={row.level ?? 'low'}
                onChange={(value) => {
                  row.level = value as DemoRow['level'];
                }}
              />
            ),
            nicknameInput: ({ row }: { row: DemoRow }) => (
              <Input
                defaultValue={row.nickname}
                size="small"
                style={{ width: 140 }}
                onChange={(event) => {
                  row.nickname = event.target.value;
                }}
              />
            ),
            'toolbar-tools': () => (
              <button onClick={() => void triggerLoading()}>
                插槽按钮
              </button>
            ),
            'pager-left': () => (
              <button onClick={() => void triggerLoading()}>
                分页左插槽
              </button>
            ),
            'pager-center': () => (
              <span style={{ color: '#ef4444' }}>分页中间插槽</span>
            ),
            'pager-tools': () => (
              <button onClick={() => void triggerLoading()}>
                分页右插槽
              </button>
            ),
          }}
        />
      </div>
      <AdapterThemePreview />
    </div>
  );
}
