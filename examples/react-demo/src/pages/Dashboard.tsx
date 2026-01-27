import { useMemo } from 'react';
import { usePreferences } from '@admin-core/preferences-react';

function Dashboard() {
  const { preferences } = usePreferences();

  // 模拟统计数据
  const stats = [
    { label: '总用户', value: '12,345', color: 'var(--primary)', trend: '+12%' },
    { label: '今日访问', value: '1,234', color: 'var(--success)', trend: '+5%' },
    { label: '订单数', value: '567', color: 'var(--warning)', trend: '+8%' },
    { label: '收入', value: '¥89,012', color: 'var(--info)', trend: '+15%' },
  ];

  // 配置信息
  const configItems = useMemo(() => [
    { label: '主题模式', value: preferences.theme.mode },
    { label: '布局类型', value: preferences.app.layout },
    { label: '侧边栏折叠', value: preferences.sidebar.collapsed ? '是' : '否' },
    { label: '顶栏固定', value: preferences.header.mode },
    { label: '标签页启用', value: preferences.tabbar.enable ? '是' : '否' },
    { label: '面包屑启用', value: preferences.breadcrumb.enable ? '是' : '否' },
    { label: '动画过渡', value: preferences.transition.name },
    { label: '圆角大小', value: preferences.theme.radius + 'rem' },
  ], [preferences]);

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24, color: 'var(--foreground)' }}>
        仪表盘
      </h1>

      {/* 统计卡片 */}
      <div className="stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="stat-card">
            <div className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </div>
            <div className="stat-label">
              {stat.label}
              <span style={{ color: 'var(--success)', marginLeft: 8 }}>{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 配置详情 */}
      <div className="card" style={{ marginBottom: 24 }}>
        <h2 className="card-title">当前偏好配置</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {configItems.map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: 12,
                background: 'var(--muted)',
                borderRadius: 'var(--radius)',
              }}
            >
              <span style={{ color: 'var(--muted-foreground)' }}>{item.label}</span>
              <span style={{ fontWeight: 500, color: 'var(--foreground)' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 颜色变量展示 */}
      <div className="card">
        <h2 className="card-title">当前主题颜色</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
          {['primary', 'success', 'warning', 'destructive', 'info'].map((color) => (
            <div key={color} style={{ textAlign: 'center' }}>
              <div
                style={{
                  width: '100%',
                  height: 60,
                  borderRadius: 'var(--radius)',
                  backgroundColor: `var(--${color})`,
                  marginBottom: 8,
                }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{color}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
