import {
  AdminTabs,
  type AdminTabReactItem,
} from '@admin-core/tabs-react';

/**
 * Tabs 面板组件属性。
 */
interface TabPanelProps {
  /** 文案行列表。 */
  lines: string[];
  /** 标题文案。 */
  title: string;
}

/**
 * Tabs 面板内容组件。
 *
 * @param options 面板标题与文案列表。
 * @returns 面板渲染结果。
 */
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

/**
 * Tabs 示例页。
 * @description 演示静态标签页配置与面板切换。
 */
export default function TabsDemo() {
  /**
   * Tabs 页签配置集合。
   */
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
