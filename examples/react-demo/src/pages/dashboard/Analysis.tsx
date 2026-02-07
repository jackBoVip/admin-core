import { useState, useEffect } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  trend: number;
  isUp: boolean;
  loading?: boolean;
}

function StatCard({ title, value, trend, isUp, loading }: StatCardProps) {
  if (loading) {
    return (
      <div className="stat-card">
        <div className="stat-card-title">{title}</div>
        <div className="stat-card-value skeleton-loading" style={{ width: '80px', height: '24px' }}></div>
        <div className="stat-card-trend skeleton-loading" style={{ width: '60px', height: '16px', marginTop: '8px' }}></div>
      </div>
    );
  }

  return (
    <div className="stat-card">
      <div className="stat-card-title">{title}</div>
      <div className="stat-card-value">{value}</div>
      <div className={`stat-card-trend ${isUp ? 'up' : 'down'}`}>
        {isUp ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    </div>
  );
}

function ChartPlaceholder() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div style={{ 
        height: 300, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: '#f9fafb', 
        borderRadius: 8,
        flexDirection: 'column'
      }}>
        <div className="skeleton-loading" style={{ width: '40px', height: '40px', borderRadius: '50%', marginBottom: '12px' }}></div>
        <div className="skeleton-loading" style={{ width: '120px', height: '16px' }}></div>
      </div>
    );
  }

  return (
    <div style={{ 
      height: 300, 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
      borderRadius: 8,
      color: 'white',
      flexDirection: 'column'
    }}>
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginBottom: '16px' }}>
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
      <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px' }}>数据可视化图表</div>
      <div style={{ fontSize: '14px', opacity: 0.8 }}>集成 ECharts 或其他图表库</div>
    </div>
  );
}

export default function DashboardAnalysis() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState([
    { title: '页面浏览量', value: '12,345', trend: 20.5, isUp: true },
    { title: '独立访客', value: '3,456', trend: 15.2, isUp: true },
    { title: '跳出率', value: '32.5%', trend: 5.1, isUp: false },
    { title: '平均停留时长', value: '4m 32s', trend: 8.3, isUp: true },
  ]);

  useEffect(() => {
    // 模拟数据加载
    const timer = setTimeout(() => {
      setLoading(false);
      // 模拟数据更新
      const interval = setInterval(() => {
        setStats(prev => prev.map(stat => ({
          ...stat,
          value: stat.title === '页面浏览量' ? 
            (parseInt(stat.value.toString().replace(/,/g, '')) + Math.floor(Math.random() * 100)).toLocaleString() :
            stat.value,
          trend: parseFloat((stat.trend + (Math.random() - 0.5) * 2).toFixed(1))
        })));
      }, 10000);
      
      return () => clearInterval(interval);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">数据分析</h1>
          <p className="page-description">实时监控关键业务指标</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" style={{ padding: '8px 16px' }}>
            导出数据
          </button>
          <button className="btn btn-primary" style={{ padding: '8px 16px' }}>
            刷新数据
          </button>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            trend={stat.trend}
            isUp={stat.isUp}
            loading={loading}
          />
        ))}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="card-title">业务趋势分析</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <select className="form-select" style={{ padding: '6px 12px', fontSize: '14px' }}>
              <option>最近7天</option>
              <option>最近30天</option>
              <option>最近90天</option>
            </select>
          </div>
        </div>
        <ChartPlaceholder />
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 className="card-title">数据详情</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>指标名称</th>
                <th>当前值</th>
                <th>环比变化</th>
                <th>同比变化</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>新增用户</td>
                <td>1,234</td>
                <td className="text-success">+12.5%</td>
                <td className="text-success">+8.3%</td>
                <td><span className="status-badge status-success">正常</span></td>
              </tr>
              <tr>
                <td>付费转化率</td>
                <td>3.2%</td>
                <td className="text-danger">-2.1%</td>
                <td className="text-success">+1.8%</td>
                <td><span className="status-badge status-warning">关注</span></td>
              </tr>
              <tr>
                <td>用户留存率</td>
                <td>68.5%</td>
                <td className="text-success">+5.2%</td>
                <td className="text-success">+3.7%</td>
                <td><span className="status-badge status-success">良好</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
