import {
  AdminTabs,
  type AdminTabReactItem,
} from '@admin-core/tabs-react';

interface TabPanelProps {
  lines: string[];
  title: string;
}

function TabPanel({ lines, title }: TabPanelProps) {
  return (
    <div
      style={{
        borderLeft: '3px solid var(--primary)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        paddingLeft: 12,
      }}
    >
      <h3 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px' }}>{title}</h3>
      {lines.map((line, index) => {
        return (
          <p key={`${title}-${index}`} style={{ margin: 0 }}>
            {line}
          </p>
        );
      })}
    </div>
  );
}

export default function TabsDemo() {
  const items: AdminTabReactItem[] = [
    {
      closable: false,
      component: TabPanel,
      componentProps: {
        lines: ['概览内容 A', '概览内容 B', '概览内容 C'],
        title: '概览',
      },
      key: 'overview',
      title: '概览',
    },
    {
      closable: false,
      component: TabPanel,
      componentProps: {
        lines: ['详情页内容 A', '详情页内容 B', '详情页内容 C'],
        title: '详情页',
      },
      key: 'detail',
      title: '详情页',
    },
    {
      closable: false,
      component: TabPanel,
      componentProps: {
        lines: ['记录页内容 A', '记录页内容 B', '记录页内容 C'],
        title: '记录页',
      },
      key: 'record',
      title: '记录页',
    },
  ];

  return (
    <AdminTabs
      defaultActiveKey="overview"
      items={items}
      
    />
  );
}
