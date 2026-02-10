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
        <div className="stat-card-value skeleton-loading w-20 h-6"></div>
        <div className="stat-card-trend skeleton-loading w-[60px] h-4 mt-2"></div>
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
      <div className="h-[300px] flex flex-col items-center justify-center rounded bg-muted">
        <div className="skeleton-loading w-10 h-10 rounded-full mb-3"></div>
        <div className="skeleton-loading w-[120px] h-4"></div>
      </div>
    );
  }

  return (
    <div className="h-[300px] flex flex-col items-center justify-center rounded text-white bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-4">
        <path d="M3 3v18h18" />
        <path d="m19 9-5 5-4-4-3 3" />
      </svg>
      <div className="text-lg font-semibold mb-2">数据可视化图表</div>
      <div className="text-sm opacity-80">集成 ECharts 或其他图表库</div>
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">数据分析</h1>
          <p className="page-description">实时监控关键业务指标</p>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-secondary">
            导出数据
          </button>
          <button className="btn btn-primary">
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

      <div className="card mt-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="card-title">业务趋势分析</h2>
          <div className="flex gap-2">
            <select className="rounded-md border border-border bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary">
              <option>最近7天</option>
              <option>最近30天</option>
              <option>最近90天</option>
            </select>
          </div>
        </div>
        <ChartPlaceholder />
      </div>

      <div className="card mt-6">
        <h2 className="card-title">数据详情</h2>
        <div className="overflow-x-auto">
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
                <td><span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-success/20 text-success">正常</span></td>
              </tr>
              <tr>
                <td>付费转化率</td>
                <td>3.2%</td>
                <td className="text-destructive">-2.1%</td>
                <td className="text-success">+1.8%</td>
                <td><span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-warning/20 text-warning">关注</span></td>
              </tr>
              <tr>
                <td>用户留存率</td>
                <td>68.5%</td>
                <td className="text-success">+5.2%</td>
                <td className="text-success">+3.7%</td>
                <td><span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-success/20 text-success">良好</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
